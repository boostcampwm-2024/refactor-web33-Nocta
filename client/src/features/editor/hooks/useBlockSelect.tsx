import { useState } from "react";

export const useBlockSelect = () => {
  const [selectionBox, setSelectionBox] = useState({
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());

  // NOTE 외부에서 마우스로 블록을 선택할 때ㄴ
  const handleEditorMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[contenteditable="true"]')) return;
    if ((e.target as HTMLElement).closest("[data-id]")) return;

    setSelectionBox({
      isSelecting: true,
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
    });
    setSelectedBlocks(new Set());
  };

  const handleEditorMouseMove = (e: React.MouseEvent) => {
    if (!selectionBox.isSelecting) return;

    setSelectionBox((prev) => ({
      ...prev,
      endX: e.clientX,
      endY: e.clientY,
    }));

    const selectionRect = {
      left: Math.min(selectionBox.startX, e.clientX),
      top: Math.min(selectionBox.startY, e.clientY),
      right: Math.max(selectionBox.startX, e.clientX),
      bottom: Math.max(selectionBox.startY, e.clientY),
    };

    const blockElements = document.querySelectorAll("[data-id]");
    const newSelectedBlocks = new Set<string>();

    blockElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (
        rect.left < selectionRect.right &&
        rect.right > selectionRect.left &&
        rect.top < selectionRect.bottom &&
        rect.bottom > selectionRect.top
      ) {
        newSelectedBlocks.add(element.getAttribute("data-id")!);
      }
    });

    setSelectedBlocks(newSelectedBlocks);
  };

  const handleEditorMouseUp = () => {
    setSelectionBox((prev) => ({
      ...prev,
      isSelecting: false,
    }));
  };

  // NOTE 글자 선택 시 블록 선택
  const compareNodesPosition = (node1: Node, node2: Node) => {
    // DOM에서의 위치를 비교하여 순서 결정
    return node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  };

  const getNextNode = (node: Node | null) => {
    if (!node) return null;

    // 자식이 있으면 첫 번째 자식으로 이동
    if (node.firstChild) return node.firstChild;

    // 형제가 있으면 다음 형제로 이동
    if (node.nextSibling) return node.nextSibling;

    // 부모의 다음 형제를 찾을 때까지 위로 이동
    let current = node;
    while (current.parentNode) {
      if (current.parentNode.nextSibling) {
        return current.parentNode.nextSibling;
      }
      current = current.parentNode;
    }

    return null;
  };

  // NOTE 텍스트 선택 시 블록 선택.
  // 그러나 노션에서는 텍스트 index 0부터 선택해야지 블록 타입까지 복사가 됨.
  // TODO 블록 텍스트 일부만 선택했을때 구현 필요
  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const newSelectedBlocks = new Set<string>();

    // 시작 노드와 끝 노드 결정
    let startNode = selection.anchorNode;
    let endNode = selection.focusNode;

    // DOM 순서에 따라 시작과 끝 노드 정렬
    if (startNode && endNode && compareNodesPosition(startNode, endNode) > 0) {
      [startNode, endNode] = [endNode, startNode];
    }

    // 시작 노드부터 끝 노드까지의 모든 블록 찾기
    let currentNode = startNode;

    while (currentNode) {
      // 블록 요소 찾기
      const blockElement = currentNode.parentElement?.closest("[data-id]");
      if (blockElement) {
        const blockId = blockElement.getAttribute("data-id");
        if (blockId) newSelectedBlocks.add(blockId);
      }

      // 끝 노드에 도달했는지 확인
      if (currentNode === endNode || !endNode) break;

      // 다음 노드로 이동
      const nextNode = getNextNode(currentNode);
      if (!nextNode) break;
      currentNode = nextNode;
    }

    if (newSelectedBlocks.size > 0) {
      setSelectedBlocks(newSelectedBlocks);
    }
  };

  return {
    selectionBox,
    selectedBlocks,
    handleEditorMouseDown,
    handleEditorMouseMove,
    handleEditorMouseUp,
    handleTextSelect,
  };
};
