import backgroundPNG from "@assets/images/background.png";
import backgroundWEBP from "@assets/images/background.webp";
import backgroundAVIF from "@assets/images/background.avif";

export const BackgroundImage = () => (
  <picture
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: -1,
    }}
  >
    <source srcSet={backgroundAVIF} type="image/avif" />
    <source srcSet={backgroundWEBP} type="image/webp" />
    <img
      src={backgroundPNG}
      alt="background"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  </picture>
);
