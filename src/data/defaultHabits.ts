import type { TimeSlot } from "../types";

export const DEFAULT_HABITS: { title: string; icon: string; timeSlot: TimeSlot }[] = [
  { title: "Morning Stretch",      icon: "stretch",  timeSlot: "morning"   },
  { title: "Drink Water",          icon: "water",    timeSlot: "morning"   },
  { title: "Meditate 5 Min",       icon: "meditate", timeSlot: "morning"   },
  { title: "Morning Journal",      icon: "journal",  timeSlot: "morning"   },
  { title: "Stay Hydrated",        icon: "water",    timeSlot: "afternoon" },
  { title: "Take a Walk",          icon: "run",      timeSlot: "afternoon" },
  { title: "Eat Well",             icon: "meal",     timeSlot: "afternoon" },
  { title: "Focus Block",          icon: "focus",    timeSlot: "afternoon" },
  { title: "Read for 20 Min",      icon: "book",     timeSlot: "evening"   },
  { title: "Evening Workout",      icon: "gym",      timeSlot: "evening"   },
  { title: "Connect with Someone", icon: "heart",    timeSlot: "evening"   },
  { title: "Evening Bike Ride",    icon: "bike",     timeSlot: "evening"   },
  { title: "Sleep by 10:30pm",     icon: "sleep",    timeSlot: "night"     },
  { title: "Night Journal",        icon: "journal",  timeSlot: "night"     },
  { title: "Take Vitamins",        icon: "medicine", timeSlot: "night"     },
  { title: "Night Stretch",        icon: "stretch",  timeSlot: "night"     },
];
