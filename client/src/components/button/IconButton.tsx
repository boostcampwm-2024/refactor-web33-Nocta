import { PageIconType } from "@noctaCrdt/types/Interfaces";
import { iconComponents, IconConfig } from "@src/constants/PageIconButton.config";
import { iconButtonContainer } from "./IconButton.style";

interface IconButtonProps {
  icon: PageIconType | "plus";
  size: "sm" | "md";
  testKey: string;
  onClick?: () => void;
}

export const IconButton = ({ icon, size, testKey, onClick }: IconButtonProps) => {
  const { icon: IconComponent, color: defaultColor }: IconConfig = iconComponents[icon];

  return (
    <button
      data-testid={testKey}
      className={iconButtonContainer({ size })}
      data-onboarding="page-add-button"
      onClick={onClick}
    >
      <IconComponent color={defaultColor} size="24px" />
    </button>
  );
};
