import { useEffect, useState } from "react";
import { PAGE, SIDE_BAR } from "@constants/size";
import { SPACING } from "@constants/spacing";
import { useSnapTargetStore } from "@src/stores/useSnapStore";
import { Position, Size, Direction, SnapTarget } from "@src/types/page";
import { useIsSidebarOpen } from "@stores/useSidebarStore";

const PADDING = SPACING.MEDIUM * 2;
const SNAP_THRESHOLD = 12; // 스냅을 위한 임계값
const DRAG_THRESHOLD = 12; // 드래그를 위한 임계값

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
  const [isSnapped, setIsSnapped] = useState(false);
  const isSidebarOpen = useIsSidebarOpen();
  const { setTarget, reset } = useSnapTargetStore();

  const getSidebarWidth = () => (isSidebarOpen ? SIDE_BAR.WIDTH : SIDE_BAR.MIN_WIDTH);

  const getSidebarActualWidth = () => {
    const sidebar = document.querySelector("[data-sidebar]") as HTMLElement | null;
    return sidebar?.offsetWidth ?? 0;
  };

  const computeSnapTarget = (
    x: number,
    y: number,
    sidebarWidth: number,
  ): "topLeft" | "topRight" | "left" | "right" | "bottomLeft" | "bottomRight" | null => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Y 영역 퍼센트 기반 구간
    const topLimit = height * 0.05;
    const bottomLimit = height * 0.9;

    const isTop = y < topLimit;
    const isMiddle = y > topLimit && y < bottomLimit;
    const isBottom = y >= bottomLimit;

    // X 영역 좌우 끝 임계값
    const isLeftEdge = x <= SNAP_THRESHOLD + sidebarWidth;
    const isRightEdge = x >= width - SNAP_THRESHOLD * 2;

    if (isLeftEdge && isTop) return "topLeft";
    if (isRightEdge && isTop) return "topRight";
    if (isLeftEdge && isMiddle) return "left";
    if (isRightEdge && isMiddle) return "right";
    if (isLeftEdge && isBottom) return "bottomLeft";
    if (isRightEdge && isBottom) return "bottomRight";

    return null;
  };

  const getSnapStyle = (
    target: SnapTarget,
    availableWidth: number,
    fullHeight: number,
  ): React.CSSProperties => {
    const width = availableWidth / 2 - PADDING * 0.75;
    const height = fullHeight / 2 - PADDING * 0.25;

    const common = {
      width,
      height,
    };

    const positions: Record<Exclude<SnapTarget, null>, React.CSSProperties> = {
      left: { top: 0, left: 0, width, height: fullHeight },
      right: { top: 0, left: width + PADDING / 2, width, height: fullHeight },

      topLeft: { top: 0, left: 0, ...common },
      topRight: { top: 0, left: width + PADDING / 2, ...common },

      bottomLeft: { top: height + PADDING * 0.5, left: 0, ...common },
      bottomRight: { top: height + PADDING * 0.5, left: width + PADDING / 2, ...common },
    };

    return target ? positions[target] : {};
  };

  const applySnap = (
    target: SnapTarget,
    _sidebarWidth: number,
    availableWidth: number,
    fullHeight: number,
  ) => {
    const width = availableWidth / 2 - PADDING * 0.75;
    const height = fullHeight / 2 - PADDING * 0.25;

    const base = {
      left: { x: 0, width },
      right: { x: width + PADDING * 0.5, width },
    } as const;

    const apply = (x: number, y: number, w: number, h: number) => {
      if (!isSnapped) {
        setPrevPosition(position);
        setPrevSize(size);
      }
      setPosition({ x, y });
      setSize({ width: w, height: h });
      setIsMaximized(false);
      setIsSnapped(true);
    };

    const snapMap = {
      left: () => apply(base.left.x, 0, base.left.width, fullHeight),
      right: () => apply(base.right.x, 0, base.right.width, fullHeight),

      topLeft: () => apply(base.left.x, 0, base.left.width, height),
      topRight: () => apply(base.right.x, 0, base.right.width, height),

      bottomLeft: () => apply(base.left.x, height + PADDING * 0.5, base.left.width, height),
      bottomRight: () => apply(base.right.x, height + PADDING * 0.5, base.right.width, height),
    };

    snapMap[target]?.();
  };

  const pageDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;
    const element = e.currentTarget as HTMLElement;

    let didBreakSnap = false;

    const handleDragMove = (e: PointerEvent) => {
      element.style.cursor = "grabbing";

      const deltaX = e.clientX - startX - position.x;
      const deltaY = e.clientY - startY - position.y;
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

      // ✅ 일정 거리 이상 이동하면 snap 해제 + 이전 상태 복원
      if (isSnapped && !didBreakSnap && distance > DRAG_THRESHOLD) {
        requestAnimationFrame(() => {
          setSize(prevSize);
          setIsSnapped(false);
        });
        didBreakSnap = true;
        return; // 복원 후 즉시 return하여 아래 위치 계산 로직 방지
      }
      const currentWidth = isSnapped ? prevSize.width : size.width;
      const currentHeight = isSnapped ? prevSize.height : size.height;

      const newX = Math.max(
        0,
        Math.min(
          window.innerWidth - currentWidth - getSidebarWidth() - PADDING,
          e.clientX - startX,
        ),
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - currentHeight - PADDING, e.clientY - startY),
      );
      setPosition({ x: newX, y: newY });

      const sidebarWidth = getSidebarActualWidth();
      const newSnapTarget = computeSnapTarget(e.clientX, e.clientY, sidebarWidth);
      if (newSnapTarget) {
        const availableWidth = window.innerWidth - sidebarWidth;
        const fullHeight = window.innerHeight - PADDING;
        const style = getSnapStyle(newSnapTarget, availableWidth, fullHeight);
        setTarget({ target: newSnapTarget, style });
      } else {
        requestAnimationFrame(() => {
          reset();
        });
      }
    };

    const handleDragEnd = (e: PointerEvent) => {
      element.style.cursor = "default";

      document.removeEventListener("pointermove", handleDragMove);
      document.removeEventListener("pointerup", handleDragEnd);

      const sidebarWidth = getSidebarActualWidth();
      const availableWidth = window.innerWidth - sidebarWidth;
      const fullHeight = window.innerHeight - PADDING;

      const snapTarget = computeSnapTarget(e.clientX, e.clientY, sidebarWidth);

      if (snapTarget) {
        applySnap(snapTarget, sidebarWidth, availableWidth, fullHeight);
      }
      reset();
    };

    document.addEventListener("pointermove", handleDragMove);
    document.addEventListener("pointerup", handleDragEnd);
  };

  const pageResize = (e: React.MouseEvent, direction: Direction) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startPosition = { x: position.x, y: position.y };

    const resize = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosition.x;
      let newY = startPosition.y;

      switch (direction) {
        case "right": {
          newWidth = Math.min(
            window.innerWidth - startPosition.x - getSidebarWidth() - PADDING,
            Math.max(PAGE.MIN_WIDTH, startWidth + deltaX),
          );
          break;
        }

        case "left": {
          newWidth = Math.min(
            startPosition.x + startWidth,
            Math.max(PAGE.MIN_WIDTH, startWidth - deltaX),
          );
          newX = Math.max(0, startPosition.x + startWidth - newWidth);
          break;
        }

        case "bottom": {
          newHeight = Math.min(
            window.innerHeight - startPosition.y - PADDING,
            Math.max(PAGE.MIN_HEIGHT, startHeight + deltaY),
          );
          break;
        }

        case "top": {
          newHeight = Math.min(
            startPosition.y + startHeight,
            Math.max(PAGE.MIN_HEIGHT, startHeight - deltaY),
          );
          newY = Math.max(0, startPosition.y + startHeight - newHeight);
          break;
        }

        case "topLeft": {
          newHeight = Math.min(
            startPosition.y + startHeight,
            Math.max(PAGE.MIN_HEIGHT, startHeight - deltaY),
          );
          newY = Math.max(0, startPosition.y + startHeight - newHeight);

          newWidth = Math.min(
            startPosition.x + startWidth,
            Math.max(PAGE.MIN_WIDTH, startWidth - deltaX),
          );
          newX = Math.max(0, startPosition.x + startWidth - newWidth);
          break;
        }

        case "topRight": {
          newHeight = Math.min(
            startPosition.y + startHeight,
            Math.max(PAGE.MIN_HEIGHT, startHeight - deltaY),
          );
          newY = Math.max(0, startPosition.y + startHeight - newHeight);

          newWidth = Math.min(
            window.innerWidth - startPosition.x - getSidebarWidth() - PADDING,
            Math.max(PAGE.MIN_WIDTH, startWidth + deltaX),
          );
          break;
        }

        case "bottomLeft": {
          newHeight = Math.min(
            window.innerHeight - startPosition.y - PADDING,
            Math.max(PAGE.MIN_HEIGHT, startHeight + deltaY),
          );

          newWidth = Math.min(
            startPosition.x + startWidth,
            Math.max(PAGE.MIN_WIDTH, startWidth - deltaX),
          );
          newX = Math.max(0, startPosition.x + startWidth - newWidth);
          break;
        }

        case "bottomRight": {
          newHeight = Math.min(
            window.innerHeight - startPosition.y - PADDING,
            Math.max(PAGE.MIN_HEIGHT, startHeight + deltaY),
          );

          newWidth = Math.min(
            window.innerWidth - startPosition.x - getSidebarWidth() - PADDING,
            Math.max(PAGE.MIN_WIDTH, startWidth + deltaX),
          );
          break;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  };

  const pageMinimize = () => {
    setIsMaximized(false);
    setSize({
      width: PAGE.MIN_WIDTH,
      height: PAGE.MIN_HEIGHT,
    });
  };

  const pageMaximize = () => {
    if (isMaximized) {
      // 최대화가 된 상태에서 다시 최대화 버튼을 누르면, 원래 위치, 크기로 돌아가야함.
      setPosition(prevPosition);
      if (
        size.width === window.innerWidth - getSidebarWidth() - PADDING &&
        size.height === window.innerHeight - PADDING
      ) {
        setSize(prevSize);
      } else {
        setSize({
          width: window.innerWidth - getSidebarWidth() - PADDING,
          height: window.innerHeight - PADDING,
        });
      }

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
    pageResize,
    pageDrag,
    pageMinimize,
    pageMaximize,
    isMaximized,
  };
};
