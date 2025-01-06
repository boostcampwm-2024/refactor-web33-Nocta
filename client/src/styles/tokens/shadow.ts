import { colors } from "./color";

export const shadows = {
  xs: {
    // page -> title 그림자
    value: {
      offsetX: 0,
      offsetY: 0,
      blur: 15,
      spread: 0,
      color: `${colors.shadow.value}05`,
    },
  },
  sm: {
    // sidebar -> menuButton 그림자
    value: {
      offsetX: 0,
      offsetY: 3,
      blur: 15,
      spread: 0,
      color: `${colors.shadow.value}10`,
    },
  },
  md: {
    // button 그림자 (bottomNavigator 버튼 + sidebar 페이지 추가 버튼)
    value: {
      offsetX: 0,
      offsetY: 4,
      blur: 15,
      spread: 0,
      color: `${colors.shadow.value}15`,
    },
  },
  lg: {
    // page 그림자
    value: {
      offsetX: 0,
      offsetY: 0,
      blur: 15,
      spread: 0,
      color: `${colors.shadow.value}20`,
    },
  },
};
