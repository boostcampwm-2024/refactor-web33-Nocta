import type { InsertOperation } from "./InsertOp";
import type { DeleteOperation } from "./DeleteOp";

export * from "./InsertOp";
export * from "./DeleteOp";
export type Operation = InsertOperation | DeleteOperation;
