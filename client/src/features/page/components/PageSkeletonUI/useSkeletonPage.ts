// hooks/useSkeletonPage.ts
import { useRef, useState, useEffect } from "react";
import { SIDE_BAR, PAGE } from "@constants/size";
import { SPACING } from "@constants/spacing";
import { Direction, Position, Size } from "@src/types/page";

const PADDING = SPACING.MEDIUM * 2;

interface UseSkeletonPageProps {
  initialPosition: Position;
  initialSize: Size;
  isSidebarOpen: boolean;
  onApply: (size: Size, position: Position) => void;
}

export const useSkeletonPage = ({
  initialPosition,
  initialSize,
  isSidebarOpen,
  onApply,
}: UseSkeletonPageProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [skeletonSize, setSkeletonSize] = useState<Size>(initialSize);
  const [skeletonPosition, setSkeletonPosition] = useState<Position>(initialPosition);

  // 리사이즈 관련 ref
  const startX = useRef(0);
  const startY = useRef(0);
  const startWidth = useRef(0);
  const startHeight = useRef(0);
  const startPosition = useRef<Position>({ x: 0, y: 0 });
  const resizeDirection = useRef<Direction | null>(null);

  const getSidebarWidth = () => (isSidebarOpen ? SIDE_BAR.WIDTH : SIDE_BAR.MIN_WIDTH);

  const handleSkeletonResizeStart = (e: React.MouseEvent, direction: Direction) => {
    e.preventDefault();
    setIsResizing(true);

    // 초기값 설정
    startX.current = e.clientX;
    startY.current = e.clientY;
    startWidth.current = initialSize.width;
    startHeight.current = initialSize.height;
    startPosition.current = { ...initialPosition };
    resizeDirection.current = direction;

    // 스켈레톤 초기 상태 설정
    setSkeletonPosition(initialPosition);
    setSkeletonSize(initialSize);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeDirection.current) return;

    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    const sidebarWidth = getSidebarWidth();

    let newWidth = startWidth.current;
    let newHeight = startHeight.current;
    let newX = startPosition.current.x;
    let newY = startPosition.current.y;

    switch (resizeDirection.current) {
      case "right": {
        newWidth = Math.min(
          window.innerWidth - startPosition.current.x - sidebarWidth - PADDING,
          Math.max(PAGE.MIN_WIDTH, startWidth.current + deltaX),
        );
        break;
      }

      case "left": {
        const possibleWidth = Math.min(
          startPosition.current.x + startWidth.current,
          Math.max(PAGE.MIN_WIDTH, startWidth.current - deltaX),
        );
        newX = Math.max(0, startPosition.current.x + startWidth.current - possibleWidth);
        newWidth = possibleWidth;
        break;
      }

      case "bottom": {
        newHeight = Math.min(
          window.innerHeight - startPosition.current.y - PADDING,
          Math.max(PAGE.MIN_HEIGHT, startHeight.current + deltaY),
        );
        break;
      }

      case "top": {
        const possibleHeight = Math.min(
          startPosition.current.y + startHeight.current,
          Math.max(PAGE.MIN_HEIGHT, startHeight.current - deltaY),
        );
        newY = Math.max(0, startPosition.current.y + startHeight.current - possibleHeight);
        newHeight = possibleHeight;
        break;
      }

      case "topLeft": {
        // 높이 계산
        const possibleHeight = Math.min(
          startPosition.current.y + startHeight.current,
          Math.max(PAGE.MIN_HEIGHT, startHeight.current - deltaY),
        );
        newY = Math.max(0, startPosition.current.y + startHeight.current - possibleHeight);
        newHeight = possibleHeight;

        // 너비 계산
        const possibleWidth = Math.min(
          startPosition.current.x + startWidth.current,
          Math.max(PAGE.MIN_WIDTH, startWidth.current - deltaX),
        );
        newX = Math.max(0, startPosition.current.x + startWidth.current - possibleWidth);
        newWidth = possibleWidth;
        break;
      }

      case "topRight": {
        // 높이 계산
        const possibleHeight = Math.min(
          startPosition.current.y + startHeight.current,
          Math.max(PAGE.MIN_HEIGHT, startHeight.current - deltaY),
        );
        newY = Math.max(0, startPosition.current.y + startHeight.current - possibleHeight);
        newHeight = possibleHeight;

        // 너비 계산
        newWidth = Math.min(
          window.innerWidth - startPosition.current.x - sidebarWidth - PADDING,
          Math.max(PAGE.MIN_WIDTH, startWidth.current + deltaX),
        );
        break;
      }

      case "bottomLeft": {
        // 높이 계산
        newHeight = Math.min(
          window.innerHeight - startPosition.current.y - PADDING,
          Math.max(PAGE.MIN_HEIGHT, startHeight.current + deltaY),
        );

        // 너비 계산
        const possibleWidth = Math.min(
          startPosition.current.x + startWidth.current,
          Math.max(PAGE.MIN_WIDTH, startWidth.current - deltaX),
        );
        newX = Math.max(0, startPosition.current.x + startWidth.current - possibleWidth);
        newWidth = possibleWidth;
        break;
      }

      case "bottomRight": {
        newHeight = Math.min(
          window.innerHeight - startPosition.current.y - PADDING,
          Math.max(PAGE.MIN_HEIGHT, startHeight.current + deltaY),
        );

        newWidth = Math.min(
          window.innerWidth - startPosition.current.x - sidebarWidth - PADDING,
          Math.max(PAGE.MIN_WIDTH, startWidth.current + deltaX),
        );
        break;
      }
    }

    setSkeletonSize({ width: newWidth, height: newHeight });
    setSkeletonPosition({ x: newX, y: newY });
  };

  const handleResizeEnd = () => {
    if (!isResizing) return;

    // 최종 크기와 위치를 실제 페이지에 적용
    onApply(skeletonSize, skeletonPosition);
    setIsResizing(false);
    resizeDirection.current = null;
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);

      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, skeletonSize, skeletonPosition]);

  return {
    isResizing,
    skeletonPosition,
    skeletonSize,
    handleSkeletonResizeStart,
  };
};
