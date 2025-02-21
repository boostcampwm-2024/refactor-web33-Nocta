import CloseIcon from "@assets/icons/close.svg?react";
import ExpandIcon from "@assets/icons/expand.svg?react";
import MinusIcon from "@assets/icons/minus.svg?react";
import { pageControlContainer, pageControlButton, iconBox } from "./PageControlButton.style";

interface PageControlButtonProps {
  testKey: string;
  onPageMinimize?: () => void;
  onPageMaximize?: () => void;
  onPageClose?: () => void;
}

export const PageControlButton = ({
  testKey,
  onPageMinimize,
  onPageMaximize,
  onPageClose,
}: PageControlButtonProps) => {
  return (
    <div className={pageControlContainer}>
      <button
        data-testid={`pageMinimizeButton-${testKey}`}
        className={pageControlButton({ color: "yellow" })}
        onClick={onPageMinimize}
      >
        <MinusIcon className={iconBox} />
      </button>
      <button
        data-testid={`pageMaximizeButton-${testKey}`}
        className={pageControlButton({ color: "green" })}
        onClick={onPageMaximize}
      >
        <ExpandIcon className={iconBox} />
      </button>
      <button
        data-testid={`pageCloseButton-${testKey}`}
        className={pageControlButton({ color: "red" })}
        onClick={onPageClose}
      >
        <CloseIcon className={iconBox} />
      </button>
    </div>
  );
};
