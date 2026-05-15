import type { Transition } from "framer-motion";

/** Popovers / dropdowns — snappy, low overshoot */
export const tasteSpringPopover: Transition = {
  type: "spring",
  stiffness: 440,
  damping: 30,
  mass: 0.85,
};

/** Page / panel cross-fade */
export const tasteSpringContent: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.9,
};

/** Toggles, checkmarks, small UI */
export const tasteSpringToggle: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 26,
  mass: 0.75,
};

/** List layout / reorder */
export const tasteSpringLayout: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 28,
  mass: 0.8,
};

export function tasteTransition(
  reducedMotion: boolean | null,
  spring: Transition,
  instantDuration = 0.12,
): Transition {
  if (reducedMotion) return { duration: instantDuration, ease: "easeOut" };
  return spring;
}
