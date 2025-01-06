const defaultState = {
  background: "transparent",
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  backgroundSize: "100% 100%",
  backgroundPosition: "0 0",
};

const none = {
  initial: {
    ...defaultState,
  },
  animate: {
    ...defaultState,
  },
};

const highlight = {
  initial: {
    ...defaultState,
    background: `linear-gradient(to right,
      #BFBFFF70 0%,
      #BFBFFF70 0%,
      transparent 0%,
      transparent 100%
    )`,
  },
  animate: {
    ...defaultState,
    background: `linear-gradient(to right,
      #BFBFFF70 0%,
      #BFBFFF70 100%,
      transparent 100%,
      transparent 100%
    )`,
    transition: {
      duration: 1,
      ease: "linear",
    },
  },
};

const rainbow = {
  initial: {
    ...defaultState,
    background: `linear-gradient(to right,
      #BFBFFF 0%,
      #B0E2FF 50%,
      #FFE4E1 100%
    )`,
    backgroundSize: "300% 100%",
    backgroundPosition: "100% 0",
  },
  animate: {
    ...defaultState,
    background: [
      `linear-gradient(to right,
        #BFBFFF 0%,
        #B0E2FF 50%,
        #FFE4E1 100%
      )`,
      `linear-gradient(to right,
        #FFE4E1 0%,
        #BFBFFF 50%,
        #B0E2FF 100%
      )`,
      `linear-gradient(to right,
        #B0E2FF 0%,
        #FFE4E1 50%,
        #BFBFFF 100%
      )`,
      `linear-gradient(to right,
        #BFBFFF 0%,
        #B0E2FF 50%,
        #FFE4E1 100%
      )`,
    ],
    backgroundSize: "300% 100%",
    transition: {
      duration: 3,
      ease: "linear",
      repeat: Infinity,
      times: [0, 0.33, 0.66, 1],
    },
  },
};

const fadeIn = {
  initial: {
    ...defaultState,
    opacity: 0,
  },
  animate: {
    ...defaultState,
    opacity: 1,
    transition: {
      duration: 1,
      ease: "easeOut",
    },
  },
};

const slideIn = {
  initial: {
    ...defaultState,
    x: -20,
    opacity: 0,
  },
  animate: {
    ...defaultState,
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const pulse = {
  initial: {
    ...defaultState,
    scale: 1,
  },
  animate: {
    ...defaultState,
    scale: [1, 1.02, 1],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

const gradation = {
  initial: {
    ...defaultState,
    background: `linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      #BFBFFF80 70%,
      rgba(255,255,255,0) 100%
    )`,
    backgroundSize: "200% 100%",
    backgroundPosition: "100% 0",
  },
  animate: {
    ...defaultState,
    background: `linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      #BFBFFF80 70%,
      rgba(255,255,255,0) 100%
    )`,
    backgroundSize: "200% 100%",
    backgroundPosition: ["100% 0", "-100% 0"],
    transition: {
      duration: 2,
      ease: "linear",
      repeat: Infinity,
    },
  },
};

const bounce = {
  initial: {
    ...defaultState,
    y: 0,
  },
  animate: {
    ...defaultState,
    y: [-2, 2, -2],
    transition: {
      duration: 1,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

export const blockAnimation = {
  none,
  highlight,
  rainbow,
  fadeIn,
  slideIn,
  pulse,
  gradation,
  bounce,
};

// types.ts
export type AnimationType = keyof typeof blockAnimation;
