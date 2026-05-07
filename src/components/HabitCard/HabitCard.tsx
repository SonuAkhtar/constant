import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import type { Habit, Streak } from "../../types";
import { SlotIcon, FlameIcon } from "../Icons";
import "./HabitCard.css";

interface Props {
  habit: Habit;
  done: boolean;
  skipped: boolean;
  streak: Streak;
  onToggle: () => void;
  index: number;
}

const SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;

export default function HabitCard({
  habit,
  done,
  skipped,
  streak,
  onToggle,
  index,
}: Props) {
  const [justCompleted, setJustCompleted] = useState(false);
  const x = useMotionValue(0);
  const rightRevealOpacity = useTransform(x, [0, 80], [0, 1]);

  const cardDisabled = done || skipped;

  function handleToggle() {
    if (!cardDisabled) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 650);
      navigator.vibrate?.(12);
    } else if (done) {
      navigator.vibrate?.([6, 10, 6]);
    }
    onToggle();
  }

  function handleDragEnd(_: PointerEvent, info: PanInfo) {
    const { offset } = info;
    if (offset.x > 60 && !cardDisabled) {
      handleToggle();
    }
    animate(x, 0, SPRING);
  }

  const isHot = streak.current >= 7;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
    >
      <div className="habit-card-wrap">
        {/* Right swipe reveal - Complete */}
        {!cardDisabled && (
          <motion.div
            className="habit-card__swipe-bg"
            style={{ opacity: rightRevealOpacity }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 11l5 5 9-9"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}

        {/* Draggable card layer */}
        <motion.div
          className="habit-card__drag-layer"
          style={{ x }}
          drag={cardDisabled ? false : "x"}
          dragConstraints={{ left: 0, right: 120 }}
          dragElastic={{ left: 0, right: 0.15 }}
          onDragEnd={handleDragEnd}
        >
          <motion.button
            className={[
              "habit-card",
              done ? "habit-card--done" : "",
              skipped ? "habit-card--skipped" : "",
              isHot && !cardDisabled ? "habit-card--milestone" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-slot={habit.timeSlot}
            onClick={handleToggle}
            aria-pressed={done || skipped}
            animate={
              justCompleted ? { scale: [1, 1.025, 0.99, 1] } : { scale: 1 }
            }
            transition={justCompleted ? { duration: 0.38 } : {}}
          >
            <div className="habit-card__badge">
              <SlotIcon slot={habit.timeSlot} size={20} />
            </div>

            <div className="habit-card__body">
              <div className="habit-card__title-row">
                <p className="habit-card__title">{habit.title}</p>
                {habit.reminderTime && !done && !skipped && (
                  <span className="habit-card__reminder-tag">
                    {habit.reminderTime}
                  </span>
                )}
              </div>
              {habit.description && (
                <p className="habit-card__desc">{habit.description}</p>
              )}
              {habit.intention && !done && !skipped && (
                <p className="habit-card__intention">{habit.intention}</p>
              )}
              {skipped && (
                <span className="habit-card__skipped-badge">Skipped today</span>
              )}
              {streak.current >= 2 && !skipped && (
                <div
                  className={[
                    "habit-card__streak",
                    isHot ? "habit-card__streak--hot" : "",
                  ].join(" ")}
                >
                  <span className="habit-card__streak-flame"><FlameIcon /></span>
                  <span className="habit-card__streak-text">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={streak.current}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.32, ease: "easeOut" }}
                        style={{ display: "inline-block" }}
                      >
                        {streak.current}
                      </motion.span>
                    </AnimatePresence>
                    -day streak
                  </span>
                </div>
              )}
            </div>

            <div
              className={[
                "habit-card__check",
                skipped ? "habit-card__check--skipped" : "",
              ].join(" ")}
            >
              <AnimatePresence>
                {justCompleted && (
                  <motion.div
                    key="ripple"
                    className="habit-card__ripple"
                    initial={{ scale: 0.8, opacity: 0.45 }}
                    animate={{ scale: 3, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {done ? (
                  <motion.svg
                    key="check"
                    width="14"
                    height="11"
                    viewBox="0 0 14 11"
                    fill="none"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={{ type: "spring", stiffness: 480, damping: 26 }}
                  >
                    <motion.path
                      d="M1.5 5.5L5.5 9.5L12.5 1.5"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    />
                  </motion.svg>
                ) : skipped ? (
                  <motion.svg
                    key="skip"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={{ type: "spring", stiffness: 480, damping: 26 }}
                  >
                    <path
                      d="M2 7h7M6 4l3 3-3 3M11 3v8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </motion.li>
  );
}
