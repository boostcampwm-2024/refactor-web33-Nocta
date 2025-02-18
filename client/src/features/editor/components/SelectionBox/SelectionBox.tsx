import { SIDE_BAR } from "@src/constants/size";
import { useIsSidebarOpen } from "@src/stores/useSidebarStore";

interface SelectionBoxProps {
  selectionBox: {
    isSelecting: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
}

export const SelectionBox = ({ selectionBox }: SelectionBoxProps) => {
  const isSidebarOpen = useIsSidebarOpen();
  const getSidebarWidth = () => (isSidebarOpen ? SIDE_BAR.WIDTH : SIDE_BAR.MIN_WIDTH);

  return (
    <div
      style={{
        position: "fixed",
        left: Math.min(
          selectionBox.startX - getSidebarWidth() - 20,
          selectionBox.endX - getSidebarWidth() - 20,
        ),
        top: Math.min(selectionBox.startY - 16, selectionBox.endY - 16),
        width: Math.abs(selectionBox.endX - selectionBox.startX),
        height: Math.abs(selectionBox.endY - selectionBox.startY),
        backgroundColor: "rgba(173, 173, 255, 0.3)",
        border: "1px solid rgba(173, 173, 255)",
        pointerEvents: "none",
        zIndex: 100,
      }}
    />
  );
};
