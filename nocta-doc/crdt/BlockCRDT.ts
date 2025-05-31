import { Operation, InsertOperation } from "../operations";
import { CharCRDT } from "./CharCRDT";
import { BlockNode } from "../model/Block";

export class BlockCRDT {
  private blocks: Map<string, BlockNode> = new Map();
  public clientId: string;
  private headId: string | null = null;
  private tailId: string | null = null;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  insertBlockAfter(prevId: string | null, blockId: string, type: string): void {
    const newBlock: BlockNode = {
      id: blockId,
      type,
      prevId,
      nextId: null,
      charCRDT: new CharCRDT(this.clientId),
    };

    if (prevId === null) {
      // Insert at head
      const oldHead = this.headId ? this.blocks.get(this.headId) : null;
      newBlock.nextId = this.headId;
      if (oldHead) oldHead.prevId = blockId;
      this.headId = blockId;
      if (!this.tailId) this.tailId = blockId;
    } else {
      const prevBlock = this.blocks.get(prevId);
      if (!prevBlock) throw new Error(`Block ${prevId} not found`);
      const { nextId } = prevBlock;
      newBlock.nextId = nextId;
      prevBlock.nextId = blockId;

      if (nextId) {
        const nextBlock = this.blocks.get(nextId);
        if (nextBlock) nextBlock.prevId = blockId;
      } else {
        this.tailId = blockId;
      }
    }

    this.blocks.set(blockId, newBlock);
  }

  deleteBlock(blockId: string): void {
    const block = this.blocks.get(blockId);
    if (!block) return;

    const { prevId, nextId } = block;

    if (prevId) {
      const prev = this.blocks.get(prevId);
      if (prev) prev.nextId = nextId;
    } else {
      this.headId = nextId;
    }

    if (nextId) {
      const next = this.blocks.get(nextId);
      if (next) next.prevId = prevId;
    } else {
      this.tailId = prevId;
    }

    this.blocks.delete(blockId);
  }

  getBlocks(): BlockNode[] {
    const result: BlockNode[] = [];
    let currentId = this.headId;
    while (currentId) {
      const node = this.blocks.get(currentId);
      if (!node) break;
      result.push(node);
      currentId = node.nextId;
    }
    return result;
  }
  getBlock(blockId: string): BlockNode {
    const block = this.blocks.get(blockId);
    if (!block) throw new Error(`Block ${blockId} not found`);
    return block;
  }

  collectOperations(): Operation[] {
    const ops: Operation[] = [];
    let currentId = this.headId;
    while (currentId) {
      const block = this.blocks.get(currentId);
      if (!block) break;
      ops.push({
        type: "insertBlock",
        node: block,
      });
      currentId = block.nextId;
    }
    return ops;
  }

  applyOperations(operations: Operation[]): void {
    for (const op of operations) {
      if (op.type === "insertBlock") {
        const block = op.node;
        if (!this.blocks.has(block.id)) {
          this.insertBlockAfter(this.tailId, block.id, block.type);
        }
      }
    }
  }
}
