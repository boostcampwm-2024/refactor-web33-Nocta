import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const popoverContainer = cx(
  glassContainer({ border: "md" }),
  css({
    position: "absolute",
    right: "0",
    bottom: "100%",
    width: "480px",
    marginBottom: "24px",
  }),
);

export const inputContainer = css({
  display: "flex",
  justifyContent: "space-between",
  borderRadius: "xl",
  margin: "10px",
  padding: "10px",
  backgroundColor: "white/80",
});

export const inputBox = css({
  outline: "none",
  width: "full",
  backgroundColor: "transparent",
});

export const iconBox = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "36px",
  cursor: "pointer",
});
