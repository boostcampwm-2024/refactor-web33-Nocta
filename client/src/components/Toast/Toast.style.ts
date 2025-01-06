import { css } from "@styled-system/css";

export const ToastWrapper = css({
  display: "flex",
  // position: "relative", // progress bar를 위한 position 설정
  gap: "2",
  alignItems: "center",
  borderRadius: "lg",
  width: "fit-content",
  paddingBlock: "2",
  paddingInline: "4",
  color: "white",
  backgroundColor: "gray.700",
  boxShadow: "lg",
  // overflow: "hidden", // progress bar가 넘치지 않도록
  transition: "all",
  transitionDuration: "300ms",
});

export const CloseItemBox = css({
  width: "15px",
  height: "15px",
});

export const ToastProgress = css({
  position: "absolute",
  left: "0px",
  bottom: "0px",
  borderRadius: "lg",
  width: "100%",
  height: "6px",
  backgroundColor: "blue",
});
