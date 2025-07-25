import { KeyHandlerContext } from "../types";
import { updateEditorState } from "../utils";

export const handleDeleteKey = (e: React.KeyboardEvent<HTMLDivElement>, ctx: KeyHandlerContext) => {
  if (e.nativeEvent.isComposing) return;
  const { editorCRDT, pageId, sendCharDeleteOperation, setEditorState } = ctx;

  const { currentBlock } = editorCRDT;
  if (!currentBlock) return;

  const currentContent = currentBlock.crdt.read();

  if (!currentBlock.next || currentContent) return;

  const nextBlock = editorCRDT.LinkedList.getNode(currentBlock.next);
  if (!nextBlock) return;

  sendCharDeleteOperation(
    currentBlock.crdt.localDelete(
      editorCRDT.LinkedList.spread().findIndex((b) => b.id.equals(currentBlock.id)) + 1,
      currentBlock.id,
      pageId,
    ),
  );

  updateEditorState(editorCRDT, setEditorState);
};
