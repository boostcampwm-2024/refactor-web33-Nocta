import { BlockCRDT } from "@noctaCrdt/Crdt";
import { getAbsoluteCaretPosition } from "@src/utils/caretUtils";
import { KeyHandlerContext } from "../types";
import { createNewBlock, updateEditorState } from "../utils";

export const handleEnterKey = (e: React.KeyboardEvent<HTMLDivElement>, ctx: KeyHandlerContext) => {
  const {
    editorCRDT,
    pageId,
    clientId,
    setEditorState,
    sendBlockInsertOperation,
    sendBlockUpdateOperation,
    sendCharInsertOperation,
    sendCharDeleteOperation,
  } = ctx;

  const { currentBlock } = editorCRDT;
  if (!currentBlock || e.nativeEvent.isComposing) return;

  e.preventDefault();

  const caretPosition = getAbsoluteCaretPosition(e.currentTarget);
  const currentContent = currentBlock.crdt.read();
  const currentCharNodes = currentBlock.crdt.spread();
  const currentIndex = editorCRDT.LinkedList.spread().findIndex((b) =>
    b.id.equals(currentBlock.id),
  );

  if (!currentContent && currentBlock.type !== "p") {
    const wasOrderedList = currentBlock.type === "ol";
    currentBlock.type = "p";
    sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
    editorCRDT.currentBlock = currentBlock;
    currentBlock.crdt.currentCaret = 0;
    if (wasOrderedList) {
      editorCRDT.LinkedList.updateAllOrderedListIndices();
    }
    updateEditorState(editorCRDT, setEditorState);
    return;
  }

  if (!currentContent && currentBlock.type === "p") {
    const operation = createNewBlock(editorCRDT, currentIndex + 1);
    operation.node.indent = currentBlock.indent;
    operation.node.crdt = new BlockCRDT(editorCRDT.client);

    sendBlockInsertOperation({ type: "blockInsert", node: operation.node, pageId });
    editorCRDT.currentBlock = operation.node;
    editorCRDT.currentBlock.crdt.currentCaret = 0;
    updateEditorState(editorCRDT, setEditorState);
    return;
  }

  const afterContent = currentContent.slice(caretPosition);
  const afterCharNodes = currentCharNodes.slice(caretPosition);

  const operation = createNewBlock(editorCRDT, currentIndex + 1);
  const newBlock = operation.node;
  newBlock.indent = currentBlock.indent;

  if (currentBlock.type === "ol") {
    newBlock.listIndex = currentBlock.listIndex! + 1;
  }

  sendBlockInsertOperation({ type: "blockInsert", node: newBlock, pageId });

  if (afterContent) {
    afterContent.split("").forEach((char, i) => {
      const charNode = afterCharNodes[i];
      sendCharInsertOperation(
        newBlock.crdt.localInsert(
          i,
          char,
          newBlock.id,
          pageId,
          clientId,
          charNode.style,
          charNode.color,
          charNode.backgroundColor,
        ),
      );
    });

    for (let i = currentContent.length - 1; i >= caretPosition; i--) {
      sendCharDeleteOperation(currentBlock.crdt.localDelete(i, currentBlock.id, pageId));
    }
  }

  if (["ul", "ol", "checkbox"].includes(currentBlock.type)) {
    newBlock.type = currentBlock.type;
    sendBlockUpdateOperation(editorCRDT.localUpdate(newBlock, pageId));
  }

  editorCRDT.currentBlock = newBlock;
  newBlock.crdt.currentCaret = 0;

  if (currentBlock.type === "ol") {
    editorCRDT.LinkedList.updateAllOrderedListIndices();
  }

  updateEditorState(editorCRDT, setEditorState);
};
