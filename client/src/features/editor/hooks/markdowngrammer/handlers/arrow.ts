import { getAbsoluteCaretPosition, setCaretPosition } from "@src/utils/caretUtils";
import { KeyHandlerContext } from "../types";
import { findBlockByIndex, isEditableBlock } from "../utils";

export const handleArrowKey = (e: React.KeyboardEvent<HTMLDivElement>, ctx: KeyHandlerContext) => {
  const { editorCRDT, pageId } = ctx;

  const { currentBlock } = editorCRDT;
  if (!currentBlock || e.nativeEvent.isComposing) return;

  const currentIndex = editorCRDT.LinkedList.spread().findIndex((block) =>
    block.id.equals(currentBlock.id),
  );

  const caretPosition = getAbsoluteCaretPosition(e.currentTarget);
  const textLength = currentBlock.crdt.read().length;

  const moveToBlock = (targetBlockIndex: number, caretPos: number) => {
    const targetBlock = findBlockByIndex(editorCRDT, targetBlockIndex);
    if (targetBlock && isEditableBlock(targetBlock)) {
      targetBlock.crdt.currentCaret = Math.min(caretPos, targetBlock.crdt.read().length);
      editorCRDT.currentBlock = targetBlock;
      setCaretPosition({
        blockId: targetBlock.id,
        position: targetBlock.crdt.currentCaret,
        pageId,
      });
    }
  };

  switch (e.key) {
    case "ArrowUp": {
      const hasPrev = currentIndex > 0;
      if (!hasPrev) {
        e.preventDefault();
        return;
      }

      let targetIndex = currentIndex - 1;
      let targetBlock = findBlockByIndex(editorCRDT, targetIndex);

      while (targetBlock && targetBlock.type === "hr") {
        targetIndex -= 1;
        targetBlock = findBlockByIndex(editorCRDT, targetIndex);
      }

      if (!targetBlock || targetBlock.type === "hr") return;

      e.preventDefault();
      moveToBlock(targetIndex, caretPosition);
      break;
    }

    case "ArrowDown": {
      const hasNext = currentIndex < editorCRDT.LinkedList.spread().length - 1;
      if (!hasNext) {
        e.preventDefault();
        return;
      }

      let targetIndex = currentIndex + 1;
      let targetBlock = findBlockByIndex(editorCRDT, targetIndex);

      while (targetBlock && targetBlock.type === "hr") {
        targetIndex += 1;
        targetBlock = findBlockByIndex(editorCRDT, targetIndex);
      }

      if (!targetBlock || targetBlock.type === "hr") return;

      e.preventDefault();
      moveToBlock(targetIndex, caretPosition);
      break;
    }

    case "ArrowLeft": {
      if (caretPosition === 0 && currentIndex > 0) {
        e.preventDefault();

        let targetIndex = currentIndex - 1;
        let targetBlock = findBlockByIndex(editorCRDT, targetIndex);

        while (targetBlock && targetBlock.type === "hr") {
          targetIndex -= 1;
          targetBlock = findBlockByIndex(editorCRDT, targetIndex);
        }

        if (targetBlock && targetBlock.type !== "hr") {
          targetBlock.crdt.currentCaret = targetBlock.crdt.read().length;
          editorCRDT.currentBlock = targetBlock;
          setCaretPosition({
            blockId: targetBlock.id,
            position: targetBlock.crdt.read().length,
            pageId,
          });
        }
        break;
      } else {
        currentBlock.crdt.currentCaret = Math.max(0, caretPosition - 1);
      }
      break;
    }

    case "ArrowRight": {
      if (
        caretPosition === textLength &&
        currentIndex < editorCRDT.LinkedList.spread().length - 1
      ) {
        e.preventDefault();

        let targetIndex = currentIndex + 1;
        let targetBlock = findBlockByIndex(editorCRDT, targetIndex);

        while (targetBlock && targetBlock.type === "hr") {
          targetIndex += 1;
          targetBlock = findBlockByIndex(editorCRDT, targetIndex);
        }

        if (targetBlock && targetBlock.type !== "hr") {
          targetBlock.crdt.currentCaret = 0;
          editorCRDT.currentBlock = targetBlock;
          setCaretPosition({
            blockId: targetBlock.id,
            position: 0,
            pageId,
          });
        }
        break;
      } else {
        currentBlock.crdt.currentCaret = Math.min(textLength, caretPosition + 1);
      }
      break;
    }
  }
};
