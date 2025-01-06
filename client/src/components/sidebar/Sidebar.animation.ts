import { SIDE_BAR } from "@constants/size";

export const animation = {
  initial: {
    x: -100,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
  },
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    duration: 0.5,
  },
};

export const sidebarVariants = {
  open: {
    width: `${SIDE_BAR.WIDTH}px`,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  closed: {
    width: `${SIDE_BAR.MIN_WIDTH}px`,
  },
};

export const contentVariants = {
  open: {
    opacity: 1,
    x: 0,
    display: "flex",
    transition: { delay: 0.2 },
  },
  closed: {
    opacity: 0,
    x: -20,
    transitionEnd: {
      delay: 0.2,
      display: "none",
    },
  },
};
