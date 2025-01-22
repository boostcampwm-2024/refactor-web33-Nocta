import { PageIconType, serializedEditorDataProps } from "@noctaCrdt/types/Interfaces";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Editor } from "@features/editor/Editor";
import { Page as PageType, DIRECTIONS, Direction } from "@src/types/page";
import { pageContainer, pageHeader, resizeHandles } from "./Page.style";
import { PageControlButton } from "./components/PageControlButton/PageControlButton";
import { PageSkeletonUI } from "./components/PageSkeletonUI/PageSkeletonUI";
import { useSkeletonPage } from "./components/PageSkeletonUI/useSkeletonPage";
import { PageTitle } from "./components/PageTitle/PageTitle";
import { usePage } from "./hooks/usePage";

interface PageProps extends PageType {
  testKey: string;
  handlePageSelect: ({ pageId, isSidebar }: { pageId: string; isSidebar?: boolean }) => void;
  handlePageClose: (pageId: string) => void;
  handleTitleChange: (
    pageId: string,
    updates: { title?: string; icon?: PageIconType },
    syncWithServer: boolean,
  ) => void;
  serializedEditorData: serializedEditorDataProps | null;
}

export const Page = ({
  id,
  x,
  y,
  testKey,
  title,
  zIndex,
  icon,
  isActive,
  handlePageSelect,
  handlePageClose,
  handleTitleChange,
  serializedEditorData,
}: PageProps) => {
  const {
    position,
    size,
    isMaximized,
    pageDrag,
    pageMinimize,
    pageMaximize,
    isSidebarOpen,
    handleResizeComplete,
  } = usePage({ x, y });

  const { isResizing, skeletonPosition, skeletonSize, handleSkeletonResizeStart } = useSkeletonPage(
    {
      initialPosition: position,
      initialSize: size,
      isSidebarOpen,
      onApply: handleResizeComplete,
    },
  );

  const [serializedEditorDatas, setSerializedEditorDatas] =
    useState<serializedEditorDataProps | null>(serializedEditorData);

  const onTitleChange = (newTitle: string, syncWithServer: boolean) => {
    if (syncWithServer) {
      handleTitleChange(id, { title: newTitle }, true);
    } else {
      handleTitleChange(id, { title: newTitle }, false);
    }
  };

  const handlePageClick = () => {
    if (!isActive) {
      handlePageSelect({ pageId: id });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, direction: Direction) => {
    e.preventDefault();
    // 스켈레톤 UI의 리사이징을 시작
    handleSkeletonResizeStart(e, direction);
  };
  // serializedEditorData prop이 변경되면 local state도 업데이트
  useEffect(() => {
    setSerializedEditorDatas(serializedEditorData);
  }, [serializedEditorData]);

  if (!serializedEditorDatas) {
    return null;
  }
  return (
    <AnimatePresence>
      <motion.div key={`page-${id}`}>
        <div
          id={id}
          data-testid={testKey}
          className={pageContainer}
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`,
            transform: isResizing
              ? "scale(0)"
              : `scale(1) translate(${position.x}px, ${position.y}px)`,
            zIndex,
            visibility: isResizing ? "hidden" : "visible",
          }}
          onPointerDown={handlePageClick}
        >
          <div className={pageHeader} onPointerDown={pageDrag} onClick={handlePageClick}>
            <PageTitle testKey={testKey.split("-")[1]} title={title} icon={icon} />
            <PageControlButton
              testKey={testKey.split("-")[1]}
              isMaximized={isMaximized}
              onPageClose={() => handlePageClose(id)}
              onPageMaximize={pageMaximize}
              onPageMinimize={pageMinimize}
            />
          </div>
          <Editor
            isResizing={isResizing}
            testKey={`${testKey.split("-")[1]}`}
            onTitleChange={onTitleChange}
            pageId={id}
            pageTitle={title}
            serializedEditorData={serializedEditorDatas}
          />
          {DIRECTIONS.map((direction) => (
            <motion.div
              key={direction}
              className={resizeHandles[direction]}
              onMouseDown={(e) => handleResizeStart(e, direction)}
            />
          ))}
        </div>
      </motion.div>
      {isResizing && (
        <motion.div key={`skeleton-${id}`}>
          <PageSkeletonUI
            id={`${id}-skeleton`}
            title={title}
            icon={icon}
            testKey={`${testKey}-skeleton`}
            position={skeletonPosition}
            size={skeletonSize}
            zIndex={zIndex}
            onDragStart={pageDrag}
            onResizeStart={handleSkeletonResizeStart}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
