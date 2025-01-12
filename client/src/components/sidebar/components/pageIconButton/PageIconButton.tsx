import { PageIconType } from "@noctaCrdt/Interfaces";
import { iconComponents, IconConfig } from "@constants/PageIconButton.config";
import { IconBox } from "./PageIconButton.style";

interface PageIconButtonProps {
  type: PageIconType;
  testKey: string;
  onClick: (e: React.MouseEvent) => void;
}

export const PageIconButton = ({ type, testKey, onClick }: PageIconButtonProps) => {
  const { icon: IconComponent, color: defaultColor }: IconConfig = iconComponents[type];

  return (
    <div data-testId={testKey} style={{ position: "relative" }}>
      <div className={IconBox} onClick={(e) => onClick(e)}>
        <IconComponent color={defaultColor} size="24px" />
      </div>
    </div>
  );
};
