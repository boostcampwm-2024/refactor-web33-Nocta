import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const glassEffect = cx(glassContainer({ border: "md" }));

export const floatingButtonContainer = css({
  zIndex: "1",
  position: "fixed",
  right: "24px",
  bottom: "24px",
});

export const buttonContainer = cx(
  glassContainer({ border: "md" }),
  css({
    padding: "12px",
    paddingX: "20px",
    backgroundColor: "white/40",
    cursor: "pointer",
  }),
);
