import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INVALID = { error: "Invalid credentials" };
const TOO_MANY = { error: "Too many attempts. Try again in a few minutes." };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_USERNAME = 8;
const MAX_PER_IP = 30;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return req.headers.get("cf-connecting-ip") ?? forwarded ?? "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json(INVALID, 405);

  try {
    const { identifier, password } = await req.json();
    if (
      typeof identifier !== "string" ||
      typeof password !== "string" ||
      !identifier.trim() ||
      !password ||
      identifier.length > 254 ||
      password.length > 200
    ) {
      return json(INVALID, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const id = identifier.trim().toLowerCase();
    const userKey = `user:${id}`;
    const ipKey = `ip:${clientIp(req)}`;
    const since = new Date(Date.now() - WINDOW_MS).toISOString();

    const countFor = async (key: string) => {
      const { count } = await admin
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("key", key)
        .gte("attempted_at", since);
      return count ?? 0;
    };
    const [userCount, ipCount] = await Promise.all([countFor(userKey), countFor(ipKey)]);
    if (userCount >= MAX_PER_USERNAME || ipCount >= MAX_PER_IP) {
      return json(TOO_MANY, 429);
    }

    const recordFailure = async () => {
      await admin.from("login_attempts").insert([{ key: userKey }, { key: ipKey }]);
      if (Math.random() < 0.05) {
        await admin
          .from("login_attempts")
          .delete()
          .lt("attempted_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      }
    };

    let email = id;
    if (!email.includes("@")) {
      const { data } = await admin
        .from("profiles")
        .select("email")
        .eq("username", email)
        .maybeSingle();
      if (!data?.email) {
        await recordFailure();
        return json(INVALID, 400);
      }
      email = data.email;
    }

    const auth = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    const { data: signIn, error } = await auth.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !signIn.session) {
      await recordFailure();
      return json(INVALID, 400);
    }

    return json({ session: signIn.session }, 200);
  } catch (e) {
    console.error("[login]", e);
    return json(INVALID, 400);
  }
});
