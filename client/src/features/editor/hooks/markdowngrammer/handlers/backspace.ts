import { setCaretPosition } from "@src/utils/caretUtils";
import { KeyHandlerContext } from "../types";
import { updateEditorState, decreaseIndent, findBlockByIndex } from "../utils";

export const handleBackspaceKey = (
  e: React.KeyboardEvent<HTMLDivElement>,
  ctx: KeyHandlerContext,
) => {
  const {
    editorCRDT,
    pageId,
    clientId,
    setEditorState,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
    sendCharInsertOperation,
    sendCharDeleteOperation,
  } = ctx;

  const { currentBlock } = editorCRDT;
  if (!currentBlock) return;

  const currentContent = currentBlock.crdt.read();
  const currentCharNodes = currentBlock.crdt.spread();
  const currentIndex = editorCRDT.LinkedList.spread().findIndex((block) =>
    block.id.equals(currentBlock.id),
  );

  const update = () => updateEditorState(editorCRDT, setEditorState);

  if (currentContent === "") {
    e.preventDefault();

    if (currentBlock.indent > 0) {
      decreaseIndent(editorCRDT, currentBlock, pageId, setEditorState, sendBlockUpdateOperation);
      return;
    }

    if (currentBlock.type === "p") {
      const prevBlock = currentBlock.prev ? editorCRDT.LinkedList.getNode(currentBlock.prev) : null;
      const nextBlock = currentBlock.next ? editorCRDT.LinkedList.getNode(currentBlock.next) : null;

      if (prevBlock?.type === "ol" && nextBlock?.type === "ol") {
        sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));
        editorCRDT.LinkedList.updateAllOrderedListIndices();

        editorCRDT.currentBlock = prevBlock;
        prevBlock.crdt.currentCaret = prevBlock.crdt.read().length;
        update();
        return;
      }
    }

    if (currentBlock.type !== "p") {
      const wasOrderedList = currentBlock.type === "ol";
      currentBlock.type = "p";
      sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
      editorCRDT.currentBlock = currentBlock;

      if (wasOrderedList) {
        editorCRDT.LinkedList.updateAllOrderedListIndices();
      }
      update();
      return;
    }

    const prevBlock = currentIndex > 0 ? editorCRDT.LinkedList.findByIndex(currentIndex - 1) : null;

    if (prevBlock) {
      sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));

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

      update();
    }

    return;
  }

  const { currentCaret } = currentBlock.crdt;
  if (currentCaret === 0) {
    if (currentBlock.indent > 0) {
      decreaseIndent(editorCRDT, currentBlock, pageId, setEditorState, sendBlockUpdateOperation);
      update();
      return;
    }

    if (currentBlock.type !== "p") {
      const wasOrderedList = currentBlock.type === "ol";
      currentBlock.type = "p";
      sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
      editorCRDT.currentBlock = currentBlock;
      if (wasOrderedList) {
        editorCRDT.LinkedList.updateAllOrderedListIndices();
      }
      update();
      return;
    }

    const prevBlock = currentIndex > 0 ? editorCRDT.LinkedList.findByIndex(currentIndex - 1) : null;
    const nextBlock =
      currentIndex < editorCRDT.LinkedList.spread().length - 1
        ? editorCRDT.LinkedList.findByIndex(currentIndex + 1)
        : null;

    if (prevBlock) {
      let targetIndex = currentIndex - 1;
      let targetBlock = findBlockByIndex(editorCRDT, targetIndex);

      while (targetBlock && targetBlock.type === "hr") {
        targetIndex -= 1;
        targetBlock = findBlockByIndex(editorCRDT, targetIndex);
      }

      if (targetBlock && prevBlock.type === "hr") {
        editorCRDT.currentBlock = targetBlock;
        editorCRDT.currentBlock.crdt.currentCaret = targetBlock.crdt.read().length;
        update();
        return;
      }

      const prevBlockEndCaret = prevBlock.crdt.read().length;

      for (let i = 0; i < currentContent.length; i++) {
        const currentCharNode = currentCharNodes[i];
        sendCharInsertOperation(
          prevBlock.crdt.localInsert(
            prevBlockEndCaret + i,
            currentContent[i],
            prevBlock.id,
            pageId,
            clientId,
            currentCharNode.style,
            currentCharNode.color,
            currentCharNode.backgroundColor,
          ),
        );
      }

      currentContent.split("").forEach(() => {
        sendCharDeleteOperation(currentBlock.crdt.localDelete(0, currentBlock.id, pageId));
      });

      editorCRDT.currentBlock = prevBlock;
      prevBlock.crdt.currentCaret = prevBlockEndCaret;
      sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));
      update();

      if (prevBlock.type === "ol" && nextBlock?.type === "ol") {
        editorCRDT.LinkedList.updateAllOrderedListIndices();
      }
      e.preventDefault();
    }
  }
};
