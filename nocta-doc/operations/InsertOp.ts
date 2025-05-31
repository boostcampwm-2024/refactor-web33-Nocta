import type { NodeId } from "../crdt/Id";
import type { BlockNode } from "../model/Block";

export interface InsertCharOperation {
  type: "insertChar";
  blockId: string;
  charId: NodeId;
  value: string;
}

type InsertBlockOperation = {
  type: "insertBlock";
  node: BlockNode;
};

export type InsertOperation = InsertCharOperation | InsertBlockOperation;
