export const animation = {
  initial: {
    scale: 0.5,
    opacity: 0,
  },
  animate: (isActive: boolean) => ({
    scale: 1,
    opacity: isActive ? 1 : 0.5,
    borderRadius: 16,
  }),
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 20,
  },
  whileHover: {
    scale: 1.1,
  },
};
