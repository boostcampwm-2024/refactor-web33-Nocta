import { CharNode } from "../model/Char";

export class CharCRDT {
  public clientId: string;
  private chars: Map<string, CharNode> = new Map();
  private headId: string | null = null;
  private tailId: string | null = null;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * CRDT 일치를 맞추기 위한 저수준 동기화 메서드
   * 이전 prevId가 있을때 그다음에 문자를 삽입할때 씀
   */
  insertCharAfter(prevId: string | null, id: string, value: string): void {
    const newNode: CharNode = {
      id,
      value,
      prevId,
      nextId: null,
    };

    if (prevId === null) {
      newNode.nextId = this.headId;
      if (this.headId) {
        const oldHead = this.chars.get(this.headId);
        if (oldHead) oldHead.prevId = id;
      }
      this.headId = id;
      if (!this.tailId) this.tailId = id;
    } else {
      const prevNode = this.chars.get(prevId);
      if (!prevNode) throw new Error(`Char ${prevId} not found`);
      const { nextId } = prevNode;
      newNode.nextId = nextId;
      prevNode.nextId = id;

      if (nextId) {
        const nextNode = this.chars.get(nextId);
        if (nextNode) nextNode.prevId = id;
      } else {
        this.tailId = id;
      }
    }

    this.chars.set(id, newNode);
  }

  /**
   * CRDT 일치를 맞추기 위한 저수준 동기화 메서드
   * id를 알 때, 해당 문자를 삭제할때 씀
   */
  deleteChar(id: string): void {
    const node = this.chars.get(id);
    if (!node) return;

    const { prevId, nextId } = node;

    if (prevId) {
      const prev = this.chars.get(prevId);
      if (prev) prev.nextId = nextId;
    } else {
      this.headId = nextId;
    }

    if (nextId) {
      const next = this.chars.get(nextId);
      if (next) next.prevId = prevId;
    } else {
      this.tailId = prevId;
    }

    this.chars.delete(id);
  }

  getText(): string {
    let text = "";
    let currentId = this.headId;
    while (currentId) {
      const node = this.chars.get(currentId);
      if (!node) break;
      text += node.value;
      currentId = node.nextId;
    }
    return text;
  }

  /**
   * index 기반으로 편하게 삽입처리 하는 메서드
   * 추후 index가 아니라 prevId를 알면 사용하지 않음
   */
  insert(index: number, id: string, value: string): void {
    if (index === 0 || this.headId === null) {
      this.insertCharAfter(null, id, value);
      return;
    }

    let currentId = this.headId;
    let currentIndex = 0;
    while (currentId && currentIndex < index - 1) {
      const node = this.chars.get(currentId);
      if (!node || node.nextId === null) break;
      currentId = node.nextId;
      currentIndex += 1;
    }

    this.insertCharAfter(currentId, id, value);
  }

  /**
   * index기반으로 편하게 delete 하는 메서드
   * 순회하여 해당 index에 해당하는 글자를 삭제한다
   */
  delete(index: number): void {
    let currentId = this.headId;
    let currentIndex = 0;
    while (currentId) {
      if (currentIndex === index) {
        this.deleteChar(currentId);
        return;
      }
      const node = this.chars.get(currentId);
      if (!node) return;
      currentId = node.nextId;
      currentIndex += 1;
    }
  }
}
