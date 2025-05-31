import { BlockCRDT } from "../crdt/BlockCRDT";
import { IdGenerator, NodeId } from "../crdt/Id";
import type { Operation } from "../operations";

export class NoctaDoc {
  public blockCRDT: BlockCRDT;
  public clientId: string;
  private idGenerator: IdGenerator;

  constructor(clientId: string) {
    this.clientId = clientId;
    this.idGenerator = new IdGenerator(clientId);
    this.blockCRDT = new BlockCRDT(clientId);
  }

  insertChar(blockId: string, index: number, value: string) {
    const nextId: NodeId = this.idGenerator.next();
    const id: string = this.idGenerator.toString(nextId);
    const block = this.blockCRDT.getBlock(blockId);
    block.charCRDT.insert(index, id, value);
  }

  deleteChar(blockId: string, index: number) {
    const block = this.blockCRDT.getBlock(blockId);
    block.charCRDT.delete(index);
  }

  insertBlock(prevId: string | null, blockId: string, type: string) {
    this.blockCRDT.insertBlockAfter(prevId, blockId, type);
  }

  applyUpdate(update: Uint8Array) {
    const json = new TextDecoder().decode(update);
    const operations: Operation[] = JSON.parse(json);
    this.blockCRDT.applyOperations(operations);
  }

  // TODO: Define a proper encoding strategy for updates (e.g., CBOR, JSON, VarInt)
  //       and decide on the structure of operation messages (insert, delete, etc.)
  encodeUpdate(): Uint8Array {
    const operations: Operation[] = this.blockCRDT.collectOperations(); // 가정
    const json = JSON.stringify(operations);
    return new TextEncoder().encode(json);
  }

  private mergeUpdates(updates: Uint8Array[]): Uint8Array {
    return updates.reduce((acc, cur) => {
      const merged = new Uint8Array(acc.length + cur.length);
      merged.set(acc);
      merged.set(cur, acc.length);
      return merged;
    });
  }

  getText(blockId: string): string {
    const block = this.blockCRDT.getBlock(blockId);
    return block.charCRDT.getText();
  }
}
