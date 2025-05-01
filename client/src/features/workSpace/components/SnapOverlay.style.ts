import { css, cva } from "@styled-system/css";

export const snapSkeleton = css({
  zIndex: 9999,
  position: "absolute",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  pointerEvents: "none",
});

export const snapBox = cva({
  base: {
    position: "absolute",
    border: "4px solid #004585",
    borderRadius: "md",
    margin: "md",
    opacity: 0,
    transition: "all 0.2s ease-in-out",
    pointerEvents: "none",
  },
  variants: {
    isActive: {
      true: {
        opacity: 0.5,
        backgroundColor: "gray.300",
      },
      false: {
        border: "none",
        opacity: 0,
      },
    },
  },
});
