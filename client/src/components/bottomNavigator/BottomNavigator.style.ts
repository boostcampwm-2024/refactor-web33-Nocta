import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const bottomNavigatorContainer = cx(
  glassContainer({
    borderRadius: "top",
  }),
  css({
    display: "flex",
    zIndex: 1000,
    position: "fixed",
    left: "50%",
    bottom: 0,
    transform: "translateX(-50%)",
    gap: "lg",
    justifyContent: "center",
    alignItems: "center",
    minWidth: "360px",
    height: "88px",
    padding: "sm",
    paddingBottom: "lg",
    background: "white/60",
  }),
);
