import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";

import {
  RemoteBlockInsertOperation,
  RemoteBlockDeleteOperation,
  RemoteBlockUpdateOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
} from "@noctaCrdt/types/Interfaces";

export type SetEditorState = React.Dispatch<
  React.SetStateAction<{
    clock: number;
    linkedList: BlockLinkedList;
  }>
>;

export interface KeyHandlerContext {
  editorCRDT: EditorCRDT;
  setEditorState: SetEditorState;
  pageId: string;
  clientId: number;
  sendBlockInsertOperation: (op: RemoteBlockInsertOperation) => void;
  sendBlockDeleteOperation: (op: RemoteBlockDeleteOperation) => void;
  sendCharDeleteOperation: (op: RemoteCharDeleteOperation) => void;
  sendCharInsertOperation: (op: RemoteCharInsertOperation) => void;
  sendBlockUpdateOperation: (op: RemoteBlockUpdateOperation) => void;
}
