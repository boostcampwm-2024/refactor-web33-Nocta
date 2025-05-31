export interface DeleteCharOperation {
  type: "deleteChar";
  charId: string;
  blockId: string;
}

export interface DeleteBlockOperation {
  type: "deleteBlock";
  blockId: string;
}

export type DeleteOperation = DeleteCharOperation | DeleteBlockOperation;
