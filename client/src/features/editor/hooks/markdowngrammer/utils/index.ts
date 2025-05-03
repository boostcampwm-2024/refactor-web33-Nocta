import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block } from "@noctaCrdt/Node";
import { RemoteBlockUpdateOperation } from "@noctaCrdt/types/Interfaces";

type SetEditorState = React.Dispatch<
  React.SetStateAction<{
    clock: number;
    linkedList: BlockLinkedList;
  }>
>;

export const createNewBlock = (editorCRDT: EditorCRDT, index: number) => {
  const operation = editorCRDT.localInsert(index, "");
  operation.node.type = "p";
  return operation;
};

export const updateEditorState = (editorCRDT: EditorCRDT, setEditorState: SetEditorState) => {
  setEditorState({
    clock: editorCRDT.clock,
    linkedList: editorCRDT.LinkedList,
  });
};

export const findBlockByIndex = (editorCRDT: EditorCRDT, index: number) => {
  if (index < 0) return null;
  if (index >= editorCRDT.LinkedList.spread().length) return null;

  return editorCRDT.LinkedList.findByIndex(index);
};

export const decreaseIndent = (
  editorCRDT: EditorCRDT,
  block: Block,
  pageId: string,
  setEditorState: SetEditorState,
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void,
) => {
  if (block.indent === 0) return;

  const currentIndex = editorCRDT.LinkedList.spread().findIndex((block) =>
    block.id.equals(block.id),
  );

  // 현재 블록의 indent 감소
  const wasOrderedList = block.type === "ol";
  const originalIndent = block.indent;
  const newIndent = originalIndent - 1;
  block.indent = newIndent;
  sendBlockUpdateOperation(editorCRDT.localUpdate(block, pageId));

  // 자식 블록들 찾기 및 업데이트
  const blocks = editorCRDT.LinkedList.spread();
  let i = currentIndex + 1;

  // 현재 블록의 원래 indent보다 큰 블록들만 처리 (자식 블록들만)
  while (i < blocks.length && blocks[i].indent > originalIndent) {
    const childBlock = blocks[i];

    // 자식 블록의 indent도 1 감소
    childBlock.indent = Math.max(0, childBlock.indent - 1);
    sendBlockUpdateOperation(editorCRDT.localUpdate(childBlock, pageId));

    i += 1;
  }

  // ordered list인 경우 인덱스 업데이트
  if (wasOrderedList) {
    editorCRDT.LinkedList.updateAllOrderedListIndices();
  }

  editorCRDT.currentBlock = block;
  updateEditorState(editorCRDT, setEditorState);
};

export const isEditableBlock = (block: Block | null): boolean => {
  if (!block) return false;
  return block.type !== "hr";
};
