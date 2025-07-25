import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block } from "@noctaCrdt/Node";
import {
  RemoteBlockInsertOperation,
  RemoteBlockDeleteOperation,
  RemoteCharDeleteOperation,
  RemoteCharInsertOperation,
  RemoteBlockUpdateOperation,
} from "@noctaCrdt/types/Interfaces";
import { useCallback } from "react";
import { handleArrowKey } from "./handlers/arrow";
import { handleBackspaceKey } from "./handlers/backspace";
import { handleDeleteKey } from "./handlers/delete";
import { handleEnterKey } from "./handlers/enter";
import { handleHomeEndKey } from "./handlers/homeend";
import { handlePageDownKey, handlePageUpKey } from "./handlers/page";
import { handleSpaceKey } from "./handlers/space";
import { handleTabKey } from "./handlers/tab";
import { KeyHandlerContext } from "./types";

interface useMarkdownGrammerProps {
  editorCRDT: EditorCRDT;
  setEditorState: React.Dispatch<
    React.SetStateAction<{
      clock: number;
      linkedList: BlockLinkedList;
    }>
  >;
  pageId: string;
  clientId: number;
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => void;
  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => void;
  sendCharDeleteOperation: (operation: RemoteCharDeleteOperation) => void;
  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => void;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
}

export const useMarkdownGrammer2 = ({
  editorCRDT,
  setEditorState,
  pageId,
  clientId,
  sendBlockInsertOperation,
  sendBlockDeleteOperation,
  sendCharDeleteOperation,
  sendCharInsertOperation,
  sendBlockUpdateOperation,
}: useMarkdownGrammerProps) => {
  const ctx: KeyHandlerContext = {
    editorCRDT,
    setEditorState,
    pageId,
    clientId,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendCharDeleteOperation,
    sendCharInsertOperation,
    sendBlockUpdateOperation,
  };
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const { key } = e;

      // 키와 핸들러 매핑
      const handlerMap: Record<
        string,
        (e: React.KeyboardEvent<HTMLDivElement>, ctx: KeyHandlerContext) => void
      > = {
        Enter: handleEnterKey,
        Backspace: handleBackspaceKey,
        Tab: handleTabKey,
        Delete: handleDeleteKey,
        Home: handleHomeEndKey,
        End: handleHomeEndKey,
        PageUp: handlePageUpKey,
        PageDown: handlePageDownKey,
        ArrowUp: handleArrowKey,
        ArrowDown: handleArrowKey,
        ArrowLeft: handleArrowKey,
        ArrowRight: handleArrowKey,
        " ": handleSpaceKey,
      };

      const handler = handlerMap[key];
      if (handler) {
        handler(e, ctx);
      }
    },
    [ctx],
  );

  const handleInput = useCallback(
    (block: Block, newContent: string) => {
      if (newContent === "---") {
        const currentContent = block.crdt.read();
        currentContent.split("").forEach((_) => {
          const operationNode = block.crdt.localDelete(0, block.id, pageId);
          sendCharDeleteOperation(operationNode);
        });

        block.type = "hr";
        sendBlockUpdateOperation(editorCRDT.localUpdate(block, pageId));

        // 새로운 블록 생성
        const currentIndex = editorCRDT.LinkedList.spread().findIndex((b) => b.id.equals(block.id));
        const operation = editorCRDT.localInsert(currentIndex + 1, "");
        operation.node.type = "p";
        sendBlockInsertOperation({ type: "blockInsert", node: operation.node, pageId });

        editorCRDT.currentBlock = operation.node;
        editorCRDT.currentBlock.crdt.currentCaret = 0;

        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
        });

        return true;
      }
      return false;
    },
    [
      editorCRDT,
      sendCharDeleteOperation,
      sendBlockUpdateOperation,
      sendBlockInsertOperation,
      pageId,
    ],
  );
  return { handleKeyDown, handleInput };
};
