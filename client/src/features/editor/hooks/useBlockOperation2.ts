import { EditorCRDT } from "@noctaCrdt/Crdt";
import { Block } from "@noctaCrdt/Node";
import { RemoteCharInsertOperation } from "@noctaCrdt/types/Interfaces";
import { useSocketStore } from "@src/stores/useSocketStore";
import { getAbsoluteCaretPosition } from "@src/utils/caretUtils";
import { EditorStateProps } from "../Editor";

interface BlockOperationProps {
  editorCRDT: EditorCRDT;
  pageId: string;
  setEditorState: React.Dispatch<React.SetStateAction<EditorStateProps>>;
  handleKeyDown: (
    e: React.KeyboardEvent<HTMLDivElement>,
    element: HTMLDivElement,
    block: Block,
  ) => void;
  handleHrInput: (block: Block, newContent: string) => boolean;
}

export const useBlockOperation = ({
  editorCRDT,
  pageId,
  setEditorState,
  handleKeyDown,
  handleHrInput,
}: BlockOperationProps) => {
  const { sendCharInsertOperation, sendCharDeleteOperation } = useSocketStore();

  const parseBlockId = (id: string) => {
    const [client, clock] = id.split("-").map(Number);
    return { clock, client };
  };

  const getBlock = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    if (!range) return;

    const blockElement = range.startContainer.parentElement?.closest("[data-id]");
    if (!blockElement) return;

    const blockId = blockElement.getAttribute("data-id");
    if (!blockId) return;

    const blockIdJson = JSON.stringify(parseBlockId(blockId));

    return {
      blockElement: blockElement as HTMLDivElement,
      block: editorCRDT.LinkedList.nodeMap[blockIdJson],
    };
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const blockInfo = getBlock();
    if (!blockInfo) return;

    const { block, blockElement } = blockInfo;
    handleKeyDown(e, blockElement, block);
  };

  const handleEditorInput = () => {
    const blockInfo = getBlock();
    if (!blockInfo) return;
    const { block, blockElement } = blockInfo;

    let operationNode;
    const element = blockElement as HTMLDivElement;
    const newContent = element.textContent || "";
    const currentContent = block.crdt.read();
    const caretPosition = getAbsoluteCaretPosition(element);

    if (handleHrInput(block, newContent)) {
      return;
    }

    if (newContent.length > currentContent.length) {
      let charNode: RemoteCharInsertOperation;
      // 캐럿 위치 유효성 검사
      const validCaretPosition = Math.min(Math.max(0, caretPosition), currentContent.length);
      // 맨 앞에 삽입
      if (caretPosition === 0) {
        const [addedChar] = newContent;
        charNode = block.crdt.localInsert(0, addedChar, block.id, pageId);
      } else if (caretPosition > currentContent.length) {
        // 맨 뒤에 삽입
        let prevChar;
        if (currentContent.length > 0) {
          prevChar = editorCRDT.currentBlock?.crdt.LinkedList.findByIndex(
            currentContent.length - 1,
          );
        }

        const addedChar = newContent[newContent.length - 1];
        charNode = block.crdt.localInsert(
          currentContent.length,
          addedChar,
          block.id,
          pageId,
          prevChar?.style,
          prevChar?.color,
          prevChar?.backgroundColor,
        );
      } else {
        // 중간에 삽입
        const prevChar = editorCRDT.currentBlock?.crdt.LinkedList.findByIndex(
          validCaretPosition === 1 ? 0 : validCaretPosition - 2,
        );
        const addedChar = newContent[validCaretPosition - 1];
        charNode = block.crdt.localInsert(
          validCaretPosition - 1,
          addedChar,
          block.id,
          pageId,
          prevChar?.style,
          prevChar?.color,
          prevChar?.backgroundColor,
        );
      }
      editorCRDT.currentBlock!.crdt.currentCaret = caretPosition;
      sendCharInsertOperation({
        type: "charInsert",
        node: charNode.node,
        blockId: block.id,
        pageId,
      });
    } else if (newContent.length < currentContent.length) {
      // 문자가 삭제된 경우
      // 삭제 위치 계산
      const deletePosition = Math.max(0, caretPosition);
      if (deletePosition >= 0 && deletePosition < currentContent.length) {
        operationNode = block.crdt.localDelete(deletePosition, block.id, pageId);
        sendCharDeleteOperation(operationNode);

        // 캐럿 위치 업데이트
        editorCRDT.currentBlock!.crdt.currentCaret = deletePosition;
      }
    }
    setEditorState({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    });
  };

  const handleEditorClick = () => {
    const blockInfo = getBlock();
    if (!blockInfo) return;
    editorCRDT.currentBlock = blockInfo.block;
    const caretPosition = getAbsoluteCaretPosition(blockInfo.blockElement);
    editorCRDT.currentBlock.crdt.currentCaret = caretPosition;
  };

  const handleCheckboxToggle = () => {};

  return {
    handleEditorKeyDown,
    handleEditorInput,
    handleEditorClick,
    handleCheckboxToggle,
  };
};
