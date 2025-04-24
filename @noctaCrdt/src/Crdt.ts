import { LinkedList, BlockLinkedList, TextLinkedList } from "./LinkedList";
import { CharId, BlockId, NodeId } from "./NodeId";
import { Node, Char, Block } from "./Node";
import {
  RemoteBlockDeleteOperation,
  RemoteCharDeleteOperation,
  RemoteBlockInsertOperation,
  RemoteCharInsertOperation,
  CRDTSerializedProps,
  RemoteBlockReorderOperation,
  RemoteBlockUpdateOperation,
  serializedEditorDataProps,
  RemoteCharUpdateOperation,
  TextColorType,
  BackgroundColorType,
} from "./types/Interfaces";

export class CRDT<T extends Node<NodeId>> {
  clock: number;
  client: number;
  LinkedList: LinkedList<T>;

  constructor(client: number, LinkedListClass: new () => LinkedList<T>) {
    this.clock = 0;
    this.client = client;
    this.LinkedList = new LinkedListClass();
  }

  localInsert(
    index: number,
    value: string,
    blockId?: BlockId,
    pageId?: string,
    clientId?: number,
  ): any {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  localDelete(index: number, blockId?: BlockId, pageId?: string): any {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  remoteInsert(operation: any): void {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  remoteDelete(operation: any): void {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  read(): string {
    return this.LinkedList.stringify();
  }

  spread(): T[] {
    return this.LinkedList.spread();
  }

  serialize(): CRDTSerializedProps<T> {
    return {
      clock: this.clock,
      client: this.client,
      LinkedList: this.LinkedList.serialize(),
    };
  }

  deserialize(data: any): void {
    this.clock = data.clock;
    this.client = data.client;
    this.LinkedList.deserialize(data.LinkedList);
  }
}

// EditorCRDT 클래스: 블록을 관리
export class EditorCRDT extends CRDT<Block> {
  currentBlock: Block | null;

  constructor(client: number) {
    super(client, BlockLinkedList);
    this.currentBlock = null;
  }

  localInsert(index: number, value: string): RemoteBlockInsertOperation {
    const id = new BlockId(this.clock + 1, this.client);
    const remoteInsertion = this.LinkedList.insertAtIndex(index, value, id);
    this.clock += 1;
    return { node: remoteInsertion.node } as RemoteBlockInsertOperation;
  }

  localDelete(index: number, blockId: undefined, pageId: string): RemoteBlockDeleteOperation {
    if (index < 0 || index >= this.LinkedList.spread().length) {
      throw new Error(`Invalid index: ${index}`);
    }

    const nodeToDelete = this.LinkedList.findByIndex(index);
    if (!nodeToDelete) {
      throw new Error(`Node not found at index: ${index}`);
    }

    const operation: RemoteBlockDeleteOperation = {
      type: "blockDelete",
      targetId: nodeToDelete.id,
      clock: this.clock,
      pageId,
    };

    this.LinkedList.deleteNode(nodeToDelete.id);
    this.clock += 1;

    return operation;
  }

  localUpdate(block: Block, pageId: string): RemoteBlockUpdateOperation {
    const updatedBlock = this.LinkedList.nodeMap[JSON.stringify(block.id)];
    updatedBlock.animation = block.animation;
    updatedBlock.icon = block.icon;
    updatedBlock.indent = block.indent;
    updatedBlock.style = block.style;
    updatedBlock.type = block.type;
    updatedBlock.listIndex = block.listIndex || undefined;
    return { type: "blockUpdate", node: updatedBlock, pageId };
  }

  remoteUpdate(block: Block, pageId: string): RemoteBlockUpdateOperation {
    const updatedBlock = this.LinkedList.nodeMap[JSON.stringify(block.id)];
    updatedBlock.animation = block.animation;
    updatedBlock.icon = block.icon;
    updatedBlock.indent = block.indent;
    updatedBlock.style = block.style;
    updatedBlock.type = block.type;
    updatedBlock.listIndex = block.listIndex || undefined;
    return { type: "blockUpdate", node: updatedBlock, pageId };
  }

  remoteInsert(operation: RemoteBlockInsertOperation): void {
    const newNodeId = new BlockId(operation.node.id.clock, operation.node.id.client);
    const newNode = new Block(operation.node.value, newNodeId);

    newNode.next = operation.node.next;
    newNode.prev = operation.node.prev;
    newNode.indent = operation.node.indent;
    newNode.listIndex = operation.node.listIndex || undefined;
    this.LinkedList.insertById(newNode);

    this.clock = Math.max(this.clock, operation.node.id.clock) + 1;
  }

  remoteDelete(operation: RemoteBlockDeleteOperation): void {
    const { targetId, clock } = operation;
    if (targetId) {
      const targetNodeId = new BlockId(operation.targetId.clock, operation.targetId.client);
      this.LinkedList.deleteNode(targetNodeId);
    }
    this.clock = Math.max(this.clock, clock) + 1;
  }

  localReorder(params: {
    targetId: BlockId;
    beforeId: BlockId | null;
    afterId: BlockId | null;
    pageId: string;
  }): RemoteBlockReorderOperation {
    const operation: RemoteBlockReorderOperation = {
      ...params,
      type: "blockReorder",
      clock: this.clock,
      client: this.client,
    };

    this.LinkedList.reorderNodes({
      targetId: params.targetId,
      beforeId: params.beforeId,
      afterId: params.afterId,
    });
    this.clock += 1;

    return operation;
  }

  remoteReorder(operation: RemoteBlockReorderOperation): void {
    const { targetId, beforeId, afterId, clock } = operation;

    this.LinkedList.reorderNodes({
      targetId,
      beforeId,
      afterId,
    });

    this.clock = Math.max(this.clock, clock) + 1;
  }

  serialize(): serializedEditorDataProps {
    return {
      ...super.serialize(),
      currentBlock: this.currentBlock ? this.currentBlock.serialize() : null,
    };
  }

  deserialize(data: any): void {
    super.deserialize(data);
    this.currentBlock = data.currentBlock ? Block.deserialize(data.currentBlock) : null;
  }
}

// BlockCRDT 클래스: 문자(Char)를 관리
export class BlockCRDT extends CRDT<Char> {
  currentCaret: number;

  constructor(client: number) {
    super(client, TextLinkedList);
    this.currentCaret = 0;
  }

  localInsert(
    index: number,
    value: string,
    blockId: BlockId,
    pageId: string,
    clientId: number,
    style?: string[],
    color?: TextColorType,
    backgroundColor?: BackgroundColorType,
  ): RemoteCharInsertOperation {
    const id = new CharId(this.clock + 1, clientId); // 여기서 this를 쓰면안된다. 새유저를 넣어야함.
    console.log(this.client, "니가 누군데?");
    const newChar = new Char(value, id);

    if (style && style.length > 0) {
      newChar.style = style;
    }
    if (color) {
      newChar.color = color;
    }
    if (backgroundColor) {
      newChar.backgroundColor = backgroundColor;
    }

    const nodes = this.LinkedList.spread();

    // 삽입 위치에 따른 prev/next 설정
    if (index <= 0) {
      // 맨 앞에 삽입
      newChar.prev = null;
      newChar.next = this.LinkedList.head;
    } else if (index >= nodes.length) {
      // 맨 뒤에 삽입
      if (nodes.length > 0) {
        newChar.prev = nodes[nodes.length - 1].id;
        newChar.next = null;
      } else {
        newChar.prev = null;
        newChar.next = null;
      }
    } else {
      // 중간에 삽입 (index 위치에 있는 문자 앞에 삽입)
      newChar.prev = nodes[index - 1].id;
      newChar.next = nodes[index].id;
    }

    // LinkedList에 삽입
    this.LinkedList.insertById(newChar);
    // this.LinkedList.rebalanceLinks();
    // clock 업데이트
    this.clock += 1;

    // 현재 캐럿 위치 업데이트 (삽입 위치 다음으로)
    this.currentCaret = index + 1;

    const operation: RemoteCharInsertOperation = {
      type: "charInsert",
      node: newChar,
      blockId,
      pageId,
      clientId,
      style: newChar.style || [],
      color: newChar.color,
      backgroundColor: newChar.backgroundColor,
    };

    return operation;
  }
  read(): string {
    // 정렬된 노드 기반으로 문자열 생성
    return (this.LinkedList as TextLinkedList).stringify();
  }
  localDelete(index: number, blockId: BlockId, pageId: string): RemoteCharDeleteOperation {
    if (index < 0 || index >= this.LinkedList.spread().length) {
      throw new Error(`Invalid index: ${index}`);
    }

    const nodeToDelete = this.LinkedList.findByIndex(index);
    if (!nodeToDelete) {
      throw new Error(`Node not found at index: ${index}`);
    }

    const operation: RemoteCharDeleteOperation = {
      type: "charDelete",
      targetId: nodeToDelete.id,
      clock: this.clock,
      blockId,
      pageId,
    };

    this.LinkedList.deleteNode(nodeToDelete.id);
    this.clock += 1;

    return operation;
  }

  localUpdate(node: Char, blockId: BlockId, pageId: string): RemoteCharUpdateOperation {
    const updatedChar = this.LinkedList.nodeMap[JSON.stringify(node.id)];
    if (node.style && node.style.length > 0) {
      updatedChar.style = [...node.style];
    }
    if (node.color) {
      updatedChar.color = node.color;
    }
    if (node.backgroundColor !== updatedChar.backgroundColor) {
      updatedChar.backgroundColor = node.backgroundColor;
    }
    return { type: "charUpdate", node: updatedChar, blockId, pageId };
  }

  remoteInsert(operation: RemoteCharInsertOperation): void {
    const newNodeId = new CharId(operation.node.id.clock, operation.node.id.client);
    const newNode = new Char(operation.node.value, newNodeId);

    newNode.next = operation.node.next;
    newNode.prev = operation.node.prev;

    if (operation.style && operation.style.length > 0) {
      operation.style.forEach((style) => {
        newNode.style.push(style);
      });
    }

    if (operation.node.color) {
      newNode.color = operation.node.color;
    }

    if (operation.node.backgroundColor) {
      newNode.backgroundColor = operation.node.backgroundColor;
    }

    this.LinkedList.insertById(newNode);

    if (this.clock <= newNode.id.clock) {
      this.clock = newNode.id.clock + 1;
    }
  }

  remoteDelete(operation: RemoteCharDeleteOperation): void {
    const { targetId, clock } = operation;
    if (targetId) {
      const targetNodeId = new CharId(operation.targetId.clock, operation.targetId.client);
      this.LinkedList.deleteNode(targetNodeId);
    }
    if (this.clock <= clock) {
      this.clock = clock + 1;
    }
  }

  remoteUpdate(operation: RemoteCharUpdateOperation): void {
    const updatedChar = this.LinkedList.nodeMap[JSON.stringify(operation.node.id)];
    if (operation.node.style && operation.node.style.length > 0) {
      updatedChar.style = [...operation.node.style];
    }
    if (operation.node.color) {
      updatedChar.color = operation.node.color;
    }
    if (operation.node.backgroundColor) {
      updatedChar.backgroundColor = operation.node.backgroundColor;
    }
  }

  serialize(): CRDTSerializedProps<Char> {
    return {
      ...super.serialize(),
      currentCaret: this.currentCaret,
    };
  }

  static deserialize(data: any): BlockCRDT {
    const crdt = new BlockCRDT(data.client);
    crdt.clock = data.clock;
    crdt.LinkedList.deserialize(data.LinkedList);
    crdt.currentCaret = data.currentCaret;
    return crdt;
  }

  deserialize(data: any): void {
    super.deserialize(data);
    this.currentCaret = data.currentCaret;
  }
}
