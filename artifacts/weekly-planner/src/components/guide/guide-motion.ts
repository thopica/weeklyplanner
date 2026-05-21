import type { Transition, Variants } from "framer-motion";
import { tasteSpringContent } from "@/lib/motion";

export const guideStaggerParent: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const guideStaggerChild: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: tasteSpringContent as Transition,
  },
};
