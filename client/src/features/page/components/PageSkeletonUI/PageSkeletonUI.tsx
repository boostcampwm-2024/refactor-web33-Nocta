import { PageIconType } from "@noctaCrdt/types/Interfaces";
import { iconComponents } from "@src/constants/PageIconButton.config";
import { Direction, Size, Position } from "@src/types/page";
import {
  pageSkeletonContainer,
  pageTitleContainer,
  pageHeader,
  pageControlContainer,
  pageControlButton,
  pageTitle,
} from "./PageSkeletonUI.style";

interface PageSkeletonUIProps {
  id: string;
  title: string;
  icon: PageIconType;
  testKey: string;
  position: Position;
  size: Size;
  zIndex: number;
  onDragStart: (e: React.PointerEvent) => void;
  onResizeStart: (e: React.MouseEvent, direction: Direction) => void;
}

export const PageSkeletonUI = ({
  id,
  title,
  icon,
  testKey,
  position,
  size,
  zIndex,
  onDragStart,
}: PageSkeletonUIProps) => {
  const { icon: IconComponent, color } = iconComponents[icon];
  return (
    <div
      id={id}
      data-testid={testKey}
      className={pageSkeletonContainer}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex,
      }}
    >
      <div className={pageHeader} onPointerDown={onDragStart}>
        <div className={pageTitleContainer} style={{ height: "32px" }}>
          <IconComponent
            color={color}
            size="24px"
            style={{ flexShrink: 0, background: "transparent" }}
          />
          <p className={pageTitle}>{title || "Title"}</p>
        </div>
        <div className={pageControlContainer}>
          <div className={pageControlButton({ color: "yellow" })}></div>
          <div className={pageControlButton({ color: "green" })}></div>
          <div className={pageControlButton({ color: "red" })}></div>
        </div>
      </div>
    </div>
  );
};
