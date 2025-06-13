import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { serializedEditorDataProps } from "@noctaCrdt/types/Interfaces";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, useEffect, useMemo, memo } from "react";
import { useSocketStore } from "@src/stores/useSocketStore.ts";
import { setCaretPosition } from "@src/utils/caretUtils.ts";
import { editorContainer, addNewBlockButton } from "./Editor.style";
import { Block } from "./components/block/Block";
import { useBlockOperation } from "./hooks/useBlockOperation.ts";
import { useBlockOptionSelect } from "./hooks/useBlockOption";
import { useComposition } from "./hooks/useComposition.ts";
import { useCopyAndPaste } from "./hooks/useCopyAndPaste.ts";
import { useMarkdownGrammer } from "./hooks/useMarkdownGrammer";
import { useTextOptionSelect } from "./hooks/useTextOptions.ts";
import { DndProvider } from "./provider/DndProvider.tsx";
import { WebSocketProvider } from "./provider/WebsocketProvider.tsx";

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
}

interface EditorProps {
  testKey: string;
  onTitleChange: (title: string, syncWithServer: boolean) => void;
  pageId: string;
  serializedEditorData: serializedEditorDataProps;
  pageTitle: string;
}

export const Editor = memo(({ testKey, pageId, serializedEditorData }: EditorProps) => {
  const {
    sendCharInsertOperation,
    sendCharDeleteOperation,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
    sendBlockCheckboxOperation,
    subscribeToRemoteOperations,
    clientId,
  } = useSocketStore();
  const [dragBlockList, setDragBlockList] = useState<string[]>([]);

  const editorCRDTInstance = useMemo(() => {
    let newEditorCRDT;
    if (serializedEditorData && clientId) {
      newEditorCRDT = new EditorCRDT(clientId);
      serializedEditorData.client = clientId;
      newEditorCRDT.deserialize(serializedEditorData);
    } else {
      newEditorCRDT = new EditorCRDT(clientId ? clientId : 0);
    }
    return newEditorCRDT;
  }, [serializedEditorData, clientId]);

  const editorCRDT = useRef<EditorCRDT>(editorCRDTInstance);
  const isLocalChange = useRef(false);
  const isSameLocalChange = useRef(false);

  // editorState도 editorCRDT가 변경될 때마다 업데이트
  const [editorState, setEditorState] = useState<EditorStateProps>({
    clock: editorCRDT.current.clock,
    linkedList: editorCRDT.current.LinkedList,
  });

  const { handleTypeSelect, handleAnimationSelect, handleCopySelect, handleDeleteSelect } =
    useBlockOptionSelect({
      editorCRDT: editorCRDT.current,
      editorState,
      setEditorState,
      pageId,
      clientId,
      sendBlockUpdateOperation,
      sendBlockDeleteOperation,
      sendBlockInsertOperation,
      sendCharInsertOperation,
    });

  const { handleKeyDown: onKeyDown, handleInput: handleHrInput } = useMarkdownGrammer({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
    pageId,
    clientId,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
    sendCharDeleteOperation,
    sendCharInsertOperation,
  });

  const { handleBlockClick, handleBlockInput, handleKeyDown, handleCheckboxToggle } =
    useBlockOperation({
      editorCRDT: editorCRDT.current,
      setEditorState,
      pageId,
      onKeyDown,
      handleHrInput,
      isLocalChange,
      sendBlockCheckboxOperation,
      clientId,
    });

  const { onTextStyleUpdate, onTextColorUpdate, onTextBackgroundColorUpdate } = useTextOptionSelect(
    {
      editorCRDT: editorCRDT.current,
      setEditorState,
      pageId,
      isLocalChange,
    },
  );

  const { handleCopy, handlePaste } = useCopyAndPaste({
    editorCRDT: editorCRDT.current,
    setEditorState,
    pageId,
    isLocalChange,
    clientId,
  });

  const { handleCompositionStart, handleCompositionUpdate, handleCompositionEnd } = useComposition({
    editorCRDT,
    pageId,
    clientId,
    sendCharInsertOperation,
    isLocalChange,
    isSameLocalChange,
  });

  useEffect(() => {
    if (!editorCRDT || !editorCRDT.current.currentBlock) return;

    const { activeElement } = document;
    if (activeElement?.tagName.toLowerCase() === "input") {
      return; // input에 포커스가 있으면 캐럿 위치 변경하지 않음
    }
    if (isLocalChange.current || isSameLocalChange.current) {
      setCaretPosition({
        blockId: editorCRDT.current.currentBlock!.id,
        position: editorCRDT.current.currentBlock?.crdt.currentCaret,
        pageId,
      });
      isLocalChange.current = false;
      isSameLocalChange.current = false;
      return;
    }
  }, [editorCRDT.current.currentBlock?.id.serialize()]);

  // 리스트 가상화
  const editorRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: editorState.linkedList.spread().length,
    getScrollElement: () => editorRef.current,
    estimateSize: () => 24,
    overscan: 3,
  });

  useEffect(() => {
    if (!editorCRDT || !editorCRDT.current.currentBlock) return;

    const { activeElement } = document;
    if (activeElement?.tagName.toLowerCase() === "input") {
      return; // input에 포커스가 있으면 캐럿 위치 변경하지 않음
    }
    if (isLocalChange.current || isSameLocalChange.current) {
      setCaretPosition({
        blockId: editorCRDT.current.currentBlock!.id,
        position: editorCRDT.current.currentBlock?.crdt.currentCaret,
        pageId,
      });
      isLocalChange.current = false;
      isSameLocalChange.current = false;
      return;
    }
  }, [editorCRDT.current.currentBlock?.id.serialize()]);

  const addNewBlock = () => {
    if (!editorCRDT) return;
    const index = editorCRDT.current.LinkedList.spread().length;
    const operation = editorCRDT.current.localInsert(index, "");
    editorCRDT.current.currentBlock = operation.node;
    sendBlockInsertOperation({ type: "blockInsert", node: operation.node, pageId });
    setEditorState({
      clock: editorCRDT.current.clock,
      linkedList: editorCRDT.current.LinkedList,
    });
  };

  // 로딩 상태 체크
  if (!editorCRDT || !editorState) {
    return <div>Loading editor data...</div>;
  }
  return (
    <div data-testid={`editor-${testKey}`} className={editorContainer} ref={editorRef}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        <WebSocketProvider
          editorCRDT={editorCRDT}
          pageId={pageId}
          setEditorState={setEditorState}
          isSameLocalChange={isSameLocalChange}
          subscribeToRemoteOperations={subscribeToRemoteOperations}
        >
          <DndProvider
            editorCRDT={editorCRDT}
            pageId={pageId}
            editorState={editorState}
            setEditorState={setEditorState}
            isLocalChange={isLocalChange}
            dragBlockList={dragBlockList}
            setDragBlockList={setDragBlockList}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const block = editorState.linkedList.spread()[virtualRow.index];
              return (
                <Block
                  testKey={`block-${virtualRow.index}`}
                  virtualStart={virtualRow.start}
                  virtualIndex={virtualRow.index}
                  virtualRef={virtualizer.measureElement}
                  key={`${block.id.client}-${block.id.clock}`}
                  id={`${block.id.client}-${block.id.clock}`}
                  block={block}
                  isActive={block.id === editorCRDT.current.currentBlock?.id}
                  onInput={handleBlockInput}
                  onCompositionStart={handleCompositionStart}
                  onCompositionUpdate={handleCompositionUpdate}
                  onCompositionEnd={handleCompositionEnd}
                  onKeyDown={handleKeyDown}
                  onCopy={handleCopy}
                  onPaste={handlePaste}
                  onClick={handleBlockClick}
                  onAnimationSelect={handleAnimationSelect}
                  onTypeSelect={handleTypeSelect}
                  onCopySelect={handleCopySelect}
                  onDeleteSelect={handleDeleteSelect}
                  onTextStyleUpdate={onTextStyleUpdate}
                  onTextColorUpdate={onTextColorUpdate}
                  onTextBackgroundColorUpdate={onTextBackgroundColorUpdate}
                  dragBlockList={dragBlockList}
                  onCheckboxToggle={handleCheckboxToggle}
                />
              );
            })}
          </DndProvider>
          {editorState.linkedList.spread().length === 0 && (
            <div
              data-testid="addNewBlockButton"
              className={addNewBlockButton}
              onClick={addNewBlock}
            >
              클릭해서 새로운 블록을 추가하세요
            </div>
          )}
        </WebSocketProvider>
      </div>
    </div>
  );
});

Editor.displayName = "Editor";
