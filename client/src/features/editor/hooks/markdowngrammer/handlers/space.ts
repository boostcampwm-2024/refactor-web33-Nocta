import { checkMarkdownPattern } from "@src/features/editor/utils/markdownPatterns";
import { getAbsoluteCaretPosition } from "@src/utils/caretUtils";
import { KeyHandlerContext } from "../types";
import { updateEditorState } from "../utils";

export const handleSpaceKey = (e: React.KeyboardEvent<HTMLDivElement>, ctx: KeyHandlerContext) => {
  const { editorCRDT, pageId, setEditorState, sendBlockUpdateOperation, sendCharDeleteOperation } =
    ctx;

  const { currentBlock } = editorCRDT;
  if (!currentBlock) return;

  const selection = window.getSelection();
  if (!selection) return;

  const currentContent = currentBlock.crdt.read();
  const currentCaret = getAbsoluteCaretPosition(e.currentTarget);
  const markdownElement = checkMarkdownPattern(currentContent);

  if (markdownElement && currentCaret === markdownElement.length && currentBlock.type === "p") {
    e.preventDefault();

    // 마크다운 패턴 매칭 시 타입 변경하고 내용 비우기
    currentBlock.type = markdownElement.type;

    for (let i = 0; i < markdownElement.length; i++) {
      const op = currentBlock.crdt.localDelete(0, currentBlock.id, pageId);
      sendCharDeleteOperation(op);
    }

    sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
    currentBlock.crdt.currentCaret = 0;
    editorCRDT.currentBlock = currentBlock;

    if (markdownElement.type === "ol") {
      editorCRDT.LinkedList.updateAllOrderedListIndices();
    }

    updateEditorState(editorCRDT, setEditorState);
  }
};
