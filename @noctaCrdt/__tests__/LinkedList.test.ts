import { LinkedList, BlockLinkedList, TextLinkedList } from "../src/LinkedList";
import { Node, Char, Block } from "../src/Node";
import { NodeId, BlockId, CharId } from "../src/NodeId";

describe("연결 리스트", () => {
  let blockList: BlockLinkedList;
  let textList: TextLinkedList;

  beforeEach(() => {
    blockList = new BlockLinkedList();
    textList = new TextLinkedList();
  });

  describe("기본 동작", () => {
    test("빈 리스트로 초기화되어야 함", () => {
      expect(blockList.head).toBeNull();
      expect(blockList.nodeMap).toEqual({});
    });

    test("노드 생성 및 조회가 가능해야 함", () => {
      const id = new BlockId(1, 1); // clock: 1, client: 1
      const node = new Block("테스트 내용", id);
      blockList.setNode(id, node);

      const retrievedNode = blockList.getNode(id);
      expect(retrievedNode).toBeDefined();
      expect(retrievedNode?.value).toBe("테스트 내용");
    });

    test("존재하지 않는 노드 조회시 null을 반환해야 함", () => {
      const nonExistentId = new BlockId(999, 1);
      expect(blockList.getNode(nonExistentId)).toBeNull();
    });
  });

  describe("삽입 연산", () => {
    test("리스트 시작에 노드를 삽입해야 함", () => {
      const id = new BlockId(1, 1);
      const result = blockList.insertAtIndex(0, "첫 번째 노드", id);

      expect(blockList.head).toEqual(id);
      expect(result.node.value).toBe("첫 번째 노드");
      expect(result.node.prev).toBeNull();
      expect(result.node.next).toBeNull();
    });

    test("기존 노드들 사이에 노드를 삽입해야 함", () => {
      // 첫 번째 노드 삽입
      const id1 = new BlockId(1, 1);
      blockList.insertAtIndex(0, "첫번째", id1);

      // 두 번째 노드 삽입
      const id2 = new BlockId(2, 1);
      blockList.insertAtIndex(1, "두번째", id2);

      // 중간에 노드 삽입
      const id3 = new BlockId(3, 1);
      blockList.insertAtIndex(1, "중간", id3);
      const middleNode = blockList.getNode(id3);
      expect(middleNode?.prev).toEqual(id1);
      expect(middleNode?.next).toEqual(id2);
    });

    test("ID로 노드를 삽입해야 함", () => {
      const id1 = new BlockId(1, 1);
      const node1 = new Block("첫번째", id1);
      const id2 = new BlockId(2, 1);
      const node2 = new Block("두번째", id2);

      node2.prev = id1;
      blockList.insertById(node1);
      blockList.insertById(node2);

      expect(blockList.stringify()).toBe("첫번째두번째");
    });
  });

  describe("삭제 및 톰스톤", () => {
    test("노드가 삭제됨으로 표시되어야 함 (톰스톤)", () => {
      const id = new BlockId(1, 1);
      blockList.insertAtIndex(0, "삭제될 내용", id);

      blockList.deleteNode(id);
      const node = blockList.getNode(id);

      expect(node?.deleted).toBe(true);
      expect(blockList.stringify()).toBe(""); // 삭제된 노드는 문자열에 나타나지 않아야 함
    });

    test("연속된 톰스톤을 처리해야 함", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(2, 1);
      const id3 = new BlockId(3, 1);

      blockList.insertAtIndex(0, "첫번째", id1);
      blockList.insertAtIndex(1, "두번째", id2);
      blockList.insertAtIndex(2, "세번째", id3);

      blockList.deleteNode(id1);
      blockList.deleteNode(id2);

      expect(blockList.stringify()).toBe("세번째");
      expect(blockList.spread().length).toBe(1);
    });

    test("인덱스로 노드를 찾을 때 톰스톤을 건너뛰어야 함", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(2, 1);
      const id3 = new BlockId(3, 1);

      blockList.insertAtIndex(0, "첫번째", id1);
      blockList.insertAtIndex(1, "두번째", id2);
      blockList.insertAtIndex(2, "세번째", id3);

      blockList.deleteNode(id2); // 중간 노드를 삭제로 표시

      const thirdNode = blockList.findByIndex(1); // 삭제된 노드를 건너뛰어야 함
      expect(thirdNode.value).toBe("세번째");
    });
  });

  describe("노드 제거", () => {
    test("리스트에서 노드를 완전히 제거해야 함", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(2, 1);

      blockList.insertAtIndex(0, "첫번째", id1);
      blockList.insertAtIndex(1, "두번째", id2);

      blockList.removeNode(id1);

      expect(blockList.getNode(id1)).toBeNull();
      expect(blockList.head).toEqual(id2);
    });

    test("헤드 노드 제거를 처리해야 함", () => {
      const id = new BlockId(1, 1);
      blockList.insertAtIndex(0, "헤드", id);

      blockList.removeNode(id);

      expect(blockList.head).toBeNull();
      expect(blockList.nodeMap).toEqual({});
    });
  });

  describe("리스트 연산", () => {
    test("인덱스 범위 내의 노드들을 가져와야 함", () => {
      const nodes = ["첫번째", "두번째", "세번째", "네번째"].map((value, index) => {
        const id = new BlockId(index + 1, 1);
        blockList.insertAtIndex(index, value, id);
        return blockList.getNode(id)!;
      });

      const middle = blockList.getNodesBetween(1, 3);
      expect(middle.length).toBe(2);
      expect(middle[0].value).toBe("두번째");
      expect(middle[1].value).toBe("세번째");
    });

    test("리스트를 배열로 변환해야 함", () => {
      ["가", "나", "다"].forEach((value, index) => {
        const id = new BlockId(index + 1, 1);
        blockList.insertAtIndex(index, value, id);
      });

      const array = blockList.spread();
      expect(array.length).toBe(3);
      expect(array.map((node) => node.value).join("")).toBe("가나다");
    });
  });

  describe("직렬화", () => {
    test("리스트를 직렬화하고 역직렬화해야 함", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(2, 1);

      blockList.insertAtIndex(0, "첫번째", id1);
      blockList.insertAtIndex(1, "두번째", id2);

      const serialized = blockList.serialize();
      const newList = new BlockLinkedList();
      newList.deserialize(serialized);

      expect(newList.stringify()).toBe(blockList.stringify());
      expect(newList.head).toEqual(blockList.head);
    });

    test("BlockId를 올바르게 직렬화하고 역직렬화해야 함", () => {
      const originalId = new BlockId(1, 2);
      const serialized = originalId.serialize();
      const deserialized = BlockId.deserialize(serialized);

      expect(deserialized.clock).toBe(originalId.clock);
      expect(deserialized.client).toBe(originalId.client);
      expect(deserialized.equals(originalId)).toBe(true);
    });
  });

  describe("순서가 있는 리스트 연산", () => {
    test("순서가 있는 리스트의 인덱스를 갱신해야 함", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(2, 1);
      const id3 = new BlockId(3, 1);

      blockList.insertAtIndex(0, "첫번째", id1);
      blockList.insertAtIndex(1, "두번째", id2);
      blockList.insertAtIndex(2, "세번째", id3);

      const node1 = blockList.getNode(id1)!;
      const node2 = blockList.getNode(id2)!;
      const node3 = blockList.getNode(id3)!;

      node1.type = "ol";
      node2.type = "ol";
      node3.type = "ol";

      expect(node1.next).toBe(id2);
      expect(node2.prev).toBe(id1);
      expect(node2.next).toBe(id3);
      expect(node3.prev).toBe(id2);

      blockList.updateAllOrderedListIndices();

      expect(node1.listIndex).toBe(1);
      expect(node2.listIndex).toBe(2);
      expect(node3.listIndex).toBe(3);
    });

    test("들여쓰기가 다른 중첩된 순서 리스트를 처리해야 함", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(2, 1);

      blockList.insertAtIndex(0, "부모", id1);
      blockList.insertAtIndex(1, "자식", id2);

      const node1 = blockList.getNode(id1)!;
      const node2 = blockList.getNode(id2)!;

      node1.type = "ol";
      node2.type = "ol";
      node2.indent = 1;
      blockList.updateAllOrderedListIndices();

      expect(node1.listIndex).toBe(1);
      expect(node2.listIndex).toBe(1); // 중첩된 리스트는 1부터 시작
      expect(node1.indent).toBe(0);
      expect(node2.indent).toBe(1);
    });
  });

  describe("노드 재정렬", () => {
    test("노드 순서를 변경해야 함", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(2, 1);
      const id3 = new BlockId(3, 1);

      blockList.insertAtIndex(0, "첫번째", id1);
      blockList.insertAtIndex(1, "두번째", id2);
      blockList.insertAtIndex(2, "세번째", id3);

      blockList.reorderNodes({
        targetId: id3,
        beforeId: id1,
        afterId: id2,
      });
      expect(blockList.head).toEqual(id1);
      const firstNode = blockList.getNode(blockList.head!);
      expect(firstNode?.value).toBe("첫번째");

      blockList.reorderNodes({
        targetId: id2,
        beforeId: null,
        afterId: id1,
      });
      expect(blockList.head).toEqual(id2);
      const firstNode2 = blockList.getNode(blockList.head!);
      expect(firstNode2?.value).toBe("두번째");
    });

    test("순서가 있는 리스트의 재정렬을 처리해야 함", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(2, 1);

      const node1 = new Block("첫번째", id1);
      const node2 = new Block("두번째", id2);

      node1.type = "ol";
      node2.type = "ol";

      blockList.insertById(node1);
      blockList.insertById(node2);

      blockList.reorderNodes({
        targetId: id2,
        beforeId: id1,
        afterId: null,
      });

      blockList.updateAllOrderedListIndices();

      const firstNode = blockList.getNode(blockList.head!);
      expect(firstNode?.listIndex).toBe(1);
    });
  });

  describe("CRDT 속성", () => {
    test("노드 우선순위를 올바르게 결정해야 함", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(1, 2);
      const id3 = new BlockId(2, 1);

      const node1 = new Block("첫번째", id1);
      const node2 = new Block("두번째", id2);
      const node3 = new Block("세번째", id3);

      // 같은 클록, 다른 클라이언트
      expect(node1.precedes(node2)).toBe(true);

      // 다른 클록
      expect(node1.precedes(node3)).toBe(true);
      expect(node3.precedes(node1)).toBe(false);
    });
  });

  describe("TombStone 제거", () => {
    test("3개 툼스톤 가비지 컬렉팅 확인", () => {
      const id1 = new BlockId(1, 1);
      const id2 = new BlockId(2, 1);
      const id3 = new BlockId(3, 1);
      blockList.insertAtIndex(0, "a", id1);
      blockList.insertAtIndex(1, "c", id2);
      blockList.insertAtIndex(1, "b", id3);

      blockList.deleteNode(id3);

      blockList.clearDeletedNode();

      const node1 = blockList.getNode(id1);

      expect(node1?.next).toBe(id2);
    });

    test("여러개 Linked list 가비지 컬렉팅", () => {
      const ids = [];
      for (let i = 0; i < 10; i++) {
        const id = new BlockId(i, 1);
        ids.push(id);
        blockList.insertAtIndex(i, `블록${i}`, id);
      }

      expect(blockList.spread().length).toBe(10);

      for (let i = 1; i < 10; i += 2) {
        blockList.deleteNode(ids[i]);
      }

      blockList.clearDeletedNode();

      expect(blockList.spread().length).toBe(5);
      const node0 = blockList.getNode(ids[0]);
      const node3 = blockList.getNode(ids[2]);
      expect(node0?.next).toBe(node3?.id);
    });
  });
});
