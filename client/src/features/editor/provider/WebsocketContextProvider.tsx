import { EditorCRDT } from "@noctaCrdt/Crdt";
import { useRef, MutableRefObject, useEffect } from "react";
import { RemoteOperationHandlers } from "@src/stores/useSocketStore.ts";
import { useEditorOperation } from "../hooks/useEditorOperation";

export interface WebsocketContextProviderProps {
  children: React.ReactNode;
  editorCRDT: MutableRefObject<EditorCRDT>;
  pageId: string;
  setEditorState: any;
  isSameLocalChange: MutableRefObject<boolean>;
  subscribeToRemoteOperations: (handlers: RemoteOperationHandlers) => (() => void) | undefined;
}

export const WebsocketContextProvider = ({
  children,
  editorCRDT,
  pageId,
  setEditorState,
  isSameLocalChange,
  subscribeToRemoteOperations,
}: WebsocketContextProviderProps) => {
  const subscriptionRef = useRef(false);

  const {
    handleRemoteBlockInsert,
    handleRemoteBlockDelete,
    handleRemoteCharInsert,
    handleRemoteCharDelete,
    handleRemoteBlockUpdate,
    handleRemoteBlockReorder,
    handleRemoteCharUpdate,
    handleRemoteCursor,
    handleRemoteBlockCheckbox,
  } = useEditorOperation({ editorCRDT, pageId, setEditorState, isSameLocalChange });

  useEffect(() => {
    if (!editorCRDT) return;
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: handleRemoteBlockInsert,
      onRemoteBlockDelete: handleRemoteBlockDelete,
      onRemoteCharInsert: handleRemoteCharInsert,
      onRemoteCharDelete: handleRemoteCharDelete,
      onRemoteBlockUpdate: handleRemoteBlockUpdate,
      onRemoteBlockReorder: handleRemoteBlockReorder,
      onRemoteCharUpdate: handleRemoteCharUpdate,
      onRemoteCursor: handleRemoteCursor,
      onRemoteBlockCheckbox: handleRemoteBlockCheckbox,
      onBatchOperations: (batch) => {
        for (const item of batch) {
          switch (item.event) {
            case "insert/block":
              handleRemoteBlockInsert(item.operation);
              break;
            case "delete/block":
              handleRemoteBlockDelete(item.operation);
              break;
            case "insert/char":
              handleRemoteCharInsert(item.operation);
              break;
            case "delete/char":
              handleRemoteCharDelete(item.operation);
              break;
            case "update/block":
              handleRemoteBlockUpdate(item.operation);
              break;
            case "reorder/block":
              handleRemoteBlockReorder(item.operation);
              break;
            case "update/char":
              handleRemoteCharUpdate(item.operation);
              break;
            default:
              console.warn("알 수 없는 연산 타입:", item.event);
          }
        }
      },
    });

    return () => {
      subscriptionRef.current = false;
      unsubscribe?.();
    };
  }, [
    editorCRDT,
    subscribeToRemoteOperations,
    pageId,
    handleRemoteBlockInsert,
    handleRemoteBlockDelete,
    handleRemoteCharInsert,
    handleRemoteCharDelete,
    handleRemoteBlockUpdate,
    handleRemoteBlockReorder,
    handleRemoteCharUpdate,
    handleRemoteCursor,
  ]);

  return <>{children}</>;
};
