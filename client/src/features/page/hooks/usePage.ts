import { useEffect, useState } from "react";
import { PAGE, SIDE_BAR } from "@constants/size";
import { SPACING } from "@constants/spacing";
import { Position, Size } from "@src/types/page";
import { useIsSidebarOpen } from "@stores/useSidebarStore";

const PADDING = SPACING.MEDIUM * 2;

// 만약 maximize 상태면, 화면이 커질때도 꽉 촤게 해줘야함.
export const usePage = ({ x, y }: Position) => {
  const [position, setPosition] = useState<Position>({ x, y });
  const [size, setSize] = useState<Size>({
    width: PAGE.WIDTH,
    height: PAGE.HEIGHT,
  });
  const [prevPosition, setPrevPosition] = useState<Position>({ x, y });
  const [prevSize, setPrevSize] = useState<Size>({
    width: PAGE.WIDTH,
    height: PAGE.HEIGHT,
  });

  const [isMaximized, setIsMaximized] = useState(false);
  const isSidebarOpen = useIsSidebarOpen();

  const getSidebarWidth = () => (isSidebarOpen ? SIDE_BAR.WIDTH : SIDE_BAR.MIN_WIDTH);

  const pageDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleDragMove = (e: PointerEvent) => {
      const newX = Math.max(
        0,
        Math.min(window.innerWidth - size.width - getSidebarWidth() - PADDING, e.clientX - startX),
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - size.height - PADDING, e.clientY - startY),
      );
      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      document.removeEventListener("pointermove", handleDragMove);
      document.removeEventListener("pointerup", handleDragEnd);
    };

    document.addEventListener("pointermove", handleDragMove);
    document.addEventListener("pointerup", handleDragEnd);
  };

  const pageMinimize = () => {
    setSize({
      width: PAGE.MIN_WIDTH,
      height: PAGE.MIN_HEIGHT,
    });
  };

  const pageMaximize = () => {
    if (isMaximized) {
      // 최대화가 된 상태에서 다시 최대화 버튼을 누르면, 원래 위치, 크기로 돌아가야함.
      setPosition(prevPosition);
      setSize(prevSize);
      setIsMaximized(false);
    } else {
      // 최대화할시, 추후 이전 상태로 돌아가기 위해 prev 위치,크기 저장
      setPrevPosition({ ...position });
      setPrevSize({ ...size });
      setPosition({ x: 0, y: 0 });
      setSize({
        width: window.innerWidth - getSidebarWidth() - PADDING,
        height: window.innerHeight - PADDING,
      });
      setIsMaximized(true);
    }
  };

  useEffect(() => {
    if (isMaximized) {
      setSize({
        width: window.innerWidth - getSidebarWidth() - PADDING,
        height: window.innerHeight - PADDING,
      });
    }
  }, [isSidebarOpen]);

  const adjustPageToWindow = () => {
    const maxWidth = window.innerWidth - getSidebarWidth() - PADDING;
    const maxHeight = window.innerHeight - PADDING;

    let newWidth = Math.min(size.width, maxWidth);
    let newHeight = Math.min(size.height, maxHeight);

    // 최소 크기 보장
    newWidth = Math.max(PAGE.MIN_WIDTH, newWidth);
    newHeight = Math.max(PAGE.MIN_HEIGHT, newHeight);

    // 새로운 위치 계산
    let newX = position.x;
    let newY = position.y;

    // 오른쪽 경계를 벗어나는 경우
    if (newX + newWidth > maxWidth) {
      newX = Math.max(0, maxWidth - newWidth);
    }

    // 아래쪽 경계를 벗어나는 경우
    if (newY + newHeight > maxHeight) {
      newY = Math.max(0, maxHeight - newHeight);
    }

    // 크기나 위치가 변경된 경우에만 상태 업데이트
    if (
      newWidth !== size.width ||
      newHeight !== size.height ||
      newX !== position.x ||
      newY !== position.y
    ) {
      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  };

  // maximize 상태일 때의 resize 처리
  useEffect(() => {
    if (!isMaximized) return;

    let timeoutId: NodeJS.Timeout;
    const handleMaximizedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newWidth = window.innerWidth - getSidebarWidth() - PADDING;
        const newHeight = window.innerHeight - PADDING;

        // 실제로 크기가 변경될 때만 update
        if (size.width !== newWidth || size.height !== newHeight) {
          setSize({ width: newWidth, height: newHeight });
        }
      }, 100);
    };

    window.addEventListener("resize", handleMaximizedResize);
    handleMaximizedResize();

    return () => {
      window.removeEventListener("resize", handleMaximizedResize);
      clearTimeout(timeoutId);
    };
  }, [isMaximized, isSidebarOpen]); // maximize 상태와 sidebar 상태만 의존성

  const handleResizeComplete = (newSize: Size, newPosition: Position) => {
    setSize(newSize);
    setPosition(newPosition);
  };

  // 일반 상태일 때의 resize 처리
  useEffect(() => {
    if (isMaximized) return;

    let timeoutId: NodeJS.Timeout;
    const handleNormalResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        adjustPageToWindow();
      }, 100);
    };

    window.addEventListener("resize", handleNormalResize);
    handleNormalResize();

    return () => {
      window.removeEventListener("resize", handleNormalResize);
      clearTimeout(timeoutId);
    };
  }, [position, size, isSidebarOpen]);

  return {
    position,
    size,
    pageDrag,
    pageMinimize,
    pageMaximize,
    isMaximized,
    isSidebarOpen,
    handleResizeComplete,
  };
};
