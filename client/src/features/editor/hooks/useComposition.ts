import { EditorCRDT } from "@noctaCrdt/Crdt";
import { Block } from "@noctaCrdt/Node";
import { useCallback, useRef } from "react";
import { getAbsoluteCaretPosition } from "@src/utils/caretUtils";

interface UseCompositionProps {
  editorCRDT: React.MutableRefObject<EditorCRDT>;
  pageId: string;
  clientId: number;
  sendCharInsertOperation: (operation: any) => void;
  isLocalChange: React.MutableRefObject<boolean>;
  isSameLocalChange: React.MutableRefObject<boolean>;
}

export const useComposition = ({
  editorCRDT,
  pageId,
  clientId,
  sendCharInsertOperation,
  isLocalChange,
  isSameLocalChange,
}: UseCompositionProps) => {
  const composingCaret = useRef<number | null>(null);
  const handleCompositionStart = (e: React.CompositionEvent<HTMLDivElement>, block: Block) => {
    const currentText = e.data;
    composingCaret.current = getAbsoluteCaretPosition(e.currentTarget);
    block.crdt.localInsert(composingCaret.current, currentText, block.id, pageId, clientId);
  };

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLDivElement>, block: Block) => {
    const currentText = e.data;
    if (composingCaret.current === null) return;
    const currentCaret = composingCaret.current;
    const currentCharNode = block.crdt.LinkedList.findByIndex(currentCaret);
    if (!currentCharNode) return;
    currentCharNode.value = currentText;
  };

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLDivElement>, block: Block) => {
      if (!editorCRDT) return;
      const event = e.nativeEvent as CompositionEvent;
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

      if (composingCaret.current === null) return;
      const currentCaret = composingCaret.current;
      const currentCharNode = block.crdt.LinkedList.findByIndex(currentCaret);
      if (!currentCharNode) return;

      if (isMac) {
        const [character, space] = event.data;
        if (!character || composingCaret.current === null) return;
        if (!currentCharNode) return;
        currentCharNode.value = character;
        sendCharInsertOperation({
          type: "charInsert",
          node: currentCharNode,
          blockId: block.id,
          pageId,
          clientId,
        });
        if (space) {
          const spaceNode = block.crdt.localInsert(
            currentCaret + 1,
            space,
            block.id,
            pageId,
            clientId,
          );
          sendCharInsertOperation({
            type: "charInsert",
            node: spaceNode.node,
            blockId: block.id,
            pageId,
            clientId,
          });
        }
        block.crdt.currentCaret = currentCaret + 2;
      } else {
        // Windows의 경우
        const character = event.data;
        if (!character) return;

        // 문자열을 개별 문자로 분리
        const characters = Array.from(character);
        let currentPosition = currentCaret;

        // 각 문자에 대해 처리
        characters.forEach((char, index) => {
          // 현재 위치의 노드 찾기
          const charNode = block.crdt.LinkedList.findByIndex(currentPosition);
          if (!charNode) return;

          // 노드 값 설정 및 operation 전송
          charNode.value = char;
          sendCharInsertOperation({
            type: "charInsert",
            node: charNode,
            blockId: block.id,
            pageId,
            clientId,
          });

          // 다음 문자를 위한 새 노드 생성 (마지막 문자가 아닌 경우에만)
          if (index < characters.length - 1) {
            block.crdt.localInsert(currentPosition + 1, "", block.id, pageId, clientId);
          }

          currentPosition += 1;
        });

        block.crdt.currentCaret = currentCaret + characters.length;
      }
      isLocalChange.current = false;
      isSameLocalChange.current = false;
    },
    [editorCRDT, pageId, sendCharInsertOperation],
  );

  return {
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
  };
};
