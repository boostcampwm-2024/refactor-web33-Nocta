import { defineKeyframes } from "@pandacss/dev";
import { css, cx, cva } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const keyframes = defineKeyframes({
  moveGradient: {
    "50%": { backgroundPosition: "100% 50%" },
  },
});

export const pageSkeletonContainer = cx(
  glassContainer({ border: "lg" }),
  css({
    display: "flex",
    position: "absolute",
    flexDirection: "column",
    border: "2px dashed gray",
    borderRadius: "24px",
    width: "450px",
    height: "400px",
    overflow: "hidden",
  }),
);

export const pageTitleContainer = css({
  display: "flex",
  gap: "8px",
  flexDirection: "row",
  alignItems: "center",
  overflow: "hidden",
});

export const pageHeader = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderTopRadius: "md",
  height: "60px",
  padding: "sm",
  boxShadow: "xs",
  backdropFilter: "blur(30px)",
  "&:hover": {
    cursor: "move",
  },
});

export const pageControlContainer = css({
  display: "flex",
  gap: "sm",
  _hover: {
    "& svg": {
      opacity: 1,
    },
  },
});

export const pageControlButton = cva({
  base: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "full",
    width: "20px",
    height: "20px",
    cursor: "pointer",
    "&:disabled": {
      background: "gray.400",
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  variants: {
    color: {
      yellow: { background: "yellow" },
      green: { background: "green" },
      red: { background: "red" },
    },
  },
});

export const pageTitle = css({
  textStyle: "display-medium24",
  alignItems: "center",
  paddingTop: "3px",
  color: "gray.500",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
});
