import { KeyHandlerContext } from "../types";
import { decreaseIndent, updateEditorState } from "../utils";

export const handleTabKey = (e: React.KeyboardEvent<HTMLDivElement>, ctx: KeyHandlerContext) => {
  const { editorCRDT, pageId, setEditorState, sendBlockUpdateOperation } = ctx;
  const { currentBlock } = editorCRDT;
  if (!currentBlock || e.nativeEvent.isComposing) return;

  e.preventDefault();

  if (currentBlock) {
    if (e.shiftKey) {
      // shift + tab: 들여쓰기 감소
      if (currentBlock.indent > 0) {
        decreaseIndent(editorCRDT, currentBlock, pageId, setEditorState, sendBlockUpdateOperation);
        updateEditorState(editorCRDT, setEditorState);
      }
    } else {
      if (!currentBlock.prev) return;

      const parentIndent =
        editorCRDT.LinkedList.nodeMap[JSON.stringify(currentBlock.prev)]?.indent ?? 0;

      const maxIndent = Math.min(
        parentIndent + 1, // 부모 indent + 1
        2, // 들여쓰기 최대 indent
      );

      // 현재 indent가 허용된 최대값보다 작을 때만 들여쓰기 증가
      if (currentBlock.indent < maxIndent) {
        const isOrderedList = currentBlock.type === "ol";
        currentBlock.indent += 1;
        sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
        editorCRDT.currentBlock = currentBlock;
        if (isOrderedList) {
          editorCRDT.LinkedList.updateAllOrderedListIndices();
        }
        updateEditorState(editorCRDT, setEditorState);
      }
    }
  }
};
