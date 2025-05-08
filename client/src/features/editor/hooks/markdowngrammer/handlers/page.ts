import { setCaretPosition } from "@src/utils/caretUtils";
import { KeyHandlerContext } from "../types";

export const handlePageUpKey = (e: React.KeyboardEvent<HTMLDivElement>, ctx: KeyHandlerContext) => {
  const { editorCRDT, pageId } = ctx;

  e.preventDefault();

  const { currentBlock } = editorCRDT;
  if (!currentBlock) return;

  const currentCaretPosition = currentBlock.crdt.currentCaret;
  const headBlock = editorCRDT.LinkedList.getNode(editorCRDT.LinkedList.head);
  if (!headBlock) return;

  headBlock.crdt.currentCaret = Math.min(currentCaretPosition, headBlock.crdt.read().length);

  editorCRDT.currentBlock = headBlock;

  setCaretPosition({
    blockId: headBlock.id,
    position: currentCaretPosition,
    pageId,
  });
};

export const handlePageDownKey = (
  e: React.KeyboardEvent<HTMLDivElement>,
  ctx: KeyHandlerContext,
) => {
  const { editorCRDT, pageId } = ctx;

  e.preventDefault();

  const { currentBlock } = editorCRDT;
  if (!currentBlock) return;

  const currentCaretPosition = currentBlock.crdt.currentCaret;
  let lastBlock = currentBlock;

  while (lastBlock.next && editorCRDT.LinkedList.getNode(lastBlock.next)) {
    lastBlock = editorCRDT.LinkedList.getNode(lastBlock.next)!;
  }

  lastBlock.crdt.currentCaret = Math.min(currentCaretPosition, lastBlock.crdt.read().length);

  editorCRDT.currentBlock = lastBlock;

  setCaretPosition({
    blockId: lastBlock.id,
    position: currentCaretPosition,
    pageId,
  });
};
