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

export const inputWrapper = css({
  position: "relative",
  flex: 1,
});

export const inputBox = css({
  outline: "none",
  width: "full",
  backgroundColor: "transparent",
});

export const iconBox = css({
  display: "flex",
  position: "relative",
  justifyContent: "center",
  alignItems: "center",
  width: "36px",
  transition: "filter 0.3s ease",
  cursor: "pointer",
  "&:hover": {
    scale: 1.1,
  },
});
export const loadingOverlay = css({
  display: "flex",
  zIndex: 10,
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
});
