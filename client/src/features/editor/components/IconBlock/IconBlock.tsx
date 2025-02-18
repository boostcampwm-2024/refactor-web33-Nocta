import { ElementType } from "@noctaCrdt/types/Interfaces";
import { iconContainerStyle, iconStyle } from "./IconBlock.style";

interface IconBlockProps {
  testKey: string;
  type: ElementType;
  index: number | undefined;
  indent?: number;
  isChecked?: boolean;
  onCheckboxClick?: () => void;
}

export const IconBlock = ({
  testKey,
  type,
  index = 1,
  indent = 0,
  isChecked = false,
  onCheckboxClick,
}: IconBlockProps) => {
  const getIcon = () => {
    switch (type) {
      case "ul":
        return (
          <span className={iconStyle({ type: "ul" })}>
            {indent === 0 && "●"}
            {indent === 1 && "○"}
            {indent === 2 && "■"}
          </span>
        );
      case "ol":
        return <span className={iconStyle({ type: "ol" })}>{`${index}.`}</span>;
      case "checkbox":
        return (
          <span
            onClick={onCheckboxClick}
            className={iconStyle({
              type: "checkbox",
              isChecked,
            })}
          >
            {isChecked ? "✓" : ""}
          </span>
        );
      default:
        return null;
    }
  };

  const icon = getIcon();
  if (!icon) return null;

  return (
    <div contentEditable={false} data-testid={testKey} className={iconContainerStyle}>
      {icon}
    </div>
  );
};
