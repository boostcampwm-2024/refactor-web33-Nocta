import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { EditorStateProps } from "../Editor";

import { useBlockDragAndDrop } from "../hooks/useBlockDragAndDrop";

export interface DndContextProviderProps {
  children: React.ReactNode;
  editorCRDT: React.MutableRefObject<EditorCRDT>;
  pageId: string;
  editorState: EditorStateProps;
  setEditorState: any;
  isLocalChange: React.MutableRefObject<boolean>;
  dragBlockList: string[];
  setDragBlockList: React.Dispatch<React.SetStateAction<string[]>>;
}

export const DndContextProvider = ({
  children,
  editorCRDT,
  pageId,
  editorState,
  setEditorState,
  isLocalChange,
  dragBlockList,
  setDragBlockList,
}: DndContextProviderProps) => {
  const { sensors, handleDragEnd, handleDragStart } = useBlockDragAndDrop({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
    pageId,
    isLocalChange,
  });

  return (
    <DndContext
      onDragEnd={(event: DragEndEvent) => {
        handleDragEnd(event, dragBlockList, () => setDragBlockList([]));
      }}
      onDragStart={(event) => {
        handleDragStart(event, setDragBlockList);
      }}
      sensors={sensors}
    >
      <SortableContext
        items={editorState.linkedList
          .spread()
          .map((block) => `${block.id.client}-${block.id.clock}`)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
};
