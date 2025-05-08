import { setCaretPosition } from "@src/utils/caretUtils";
import { KeyHandlerContext } from "../types";

export const handleHomeEndKey = (
  e: React.KeyboardEvent<HTMLDivElement>,
  ctx: KeyHandlerContext,
) => {
  const { editorCRDT, pageId } = ctx;

  const { currentBlock } = editorCRDT;
  if (!currentBlock) return;

  currentBlock.crdt.currentCaret = e.key === "Home" ? 0 : currentBlock.crdt.read().length;

  setCaretPosition({
    blockId: currentBlock.id,
    position: currentBlock.crdt.currentCaret,
    pageId,
  });
};
