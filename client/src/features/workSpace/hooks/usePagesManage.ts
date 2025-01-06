import {
  PageIconType,
  RemotePageCreateOperation,
  RemotePageUpdateOperation,
  serializedEditorDataProps,
} from "@noctaCrdt/Interfaces";
import { Page as CRDTPage } from "@noctaCrdt/Page";
import { WorkSpace } from "@noctaCrdt/WorkSpace";
import { useEffect, useState, useRef, useCallback } from "react";
import { PAGE, SIDE_BAR } from "@src/constants/size";
import { useSocketStore } from "@src/stores/useSocketStore";
import { useToastStore } from "@src/stores/useToastStore";
import { Page } from "@src/types/page";

const PAGE_OFFSET = 60;

export const usePagesManage = (workspace: WorkSpace | null, clientId: number | null) => {
  const [pages, setPages] = useState<Page[]>([]);
  const { subscribeToPageOperations, sendPageCreateOperation, sendPageUpdateOperation } =
    useSocketStore();
  const subscriptionRef = useRef(false);
  const { addToast } = useToastStore();
  useEffect(() => {
    if (!workspace) return;
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToPageOperations({
      onRemotePageUpdate: (operation) => {
        workspace.remotePageUpdate({
          pageId: operation.pageId,
          icon: operation.icon,
          title: operation.title,
          workspaceId: operation.workspaceId,
          clientId: operation.clientId,
        } as RemotePageUpdateOperation);
        setPages((prevPages) =>
          prevPages.map((page) =>
            page.id === operation.pageId
              ? {
                  ...page,
                  title: operation.title || page.title,
                  icon: operation.icon || page.icon,
                }
              : page,
          ),
        );
      },
      onRemotePageCreate: (operation) => {
        const newPage = workspace.remotePageCreate({
          page: operation.page!,
          workspaceId: operation.workspaceId,
          clientId: operation.clientId,
        });
        addPage(newPage);
      },
      onRemotePageDelete: (operation) => {
        addToast(`${operation.clientId}번 유저가 페이지(${operation.pageTitle})를 삭제하였습니다.`);
        workspace.remotePageDelete?.({
          pageId: operation.pageId,
          workspaceId: operation.workspaceId,
          clientId: operation.clientId,
        });

        setPages((prevPages) => {
          const remainingPages = prevPages.filter((page) => page.id !== operation.pageId);
          return remainingPages;
        });
      },
    });

    return () => {
      subscriptionRef.current = false;
      unsubscribe?.();
    };
  }, [workspace, pages]);

  const updatePageData = useCallback((pageId: string, newData: serializedEditorDataProps) => {
    setPages((prevPages) =>
      prevPages.map((page) =>
        page.id === pageId ? { ...page, serializedEditorData: newData } : page,
      ),
    );
  }, []);

  const getZIndex = () => {
    return Math.max(0, ...pages.map((page) => page.zIndex)) + 1;
  };

  const adjustPagePosition = (page: Page) => {
    const PADDING = 20;
    const maxWidth = window.innerWidth - SIDE_BAR.WIDTH - PADDING * 2;
    const maxHeight = window.innerHeight - PADDING * 2;

    // 페이지가 최소 크기보다 작아지지 않도록 보장
    const width = PAGE.WIDTH;
    const height = PAGE.HEIGHT;

    // 새로운 위치 계산
    let newX = page.x;
    let newY = page.y;

    // 오른쪽 경계를 벗어나는 경우
    if (newX + width > maxWidth) {
      newX = Math.max(0, maxWidth - width);
    }

    // 왼쪽 경계를 벗어나는 경우
    if (newX < 0) {
      newX = 0;
    }

    // 아래쪽 경계를 벗어나는 경우
    if (newY + height > maxHeight) {
      newY = Math.max(0, maxHeight - height);
    }

    // 위쪽 경계를 벗어나는 경우
    if (newY < 0) {
      newY = 0;
    }

    return { x: newX, y: newY };
  };

  const fetchPage = () => {
    const operation = {
      type: "pageCreate",
      workspaceId: workspace!.id!,
      clientId: clientId!,
    } as RemotePageCreateOperation;
    sendPageCreateOperation(operation);
  };

  const addPage = (newPage: CRDTPage) => {
    const newPageIndex = pages.length;
    const serializedEditorData = newPage.crdt.serialize();
    setPages((prevPages) => [
      ...prevPages.map((page) => ({ ...page, isActive: false })),
      {
        id: newPage.id, // 여기
        title: newPage.title,
        icon: "Docs",
        x: PAGE_OFFSET * newPageIndex,
        y: PAGE_OFFSET * newPageIndex,
        zIndex: getZIndex(),
        isActive: true,
        isVisible: true,
        isLoaded: false,
        serializedEditorData,
      } as Page,
    ]);
  };

  // 이미 열린 페이지를 선택할 때 사용하는 함수 (데이터 가져오기 수행 안 함)
  const selectPage = ({ pageId }: { pageId: string }) => {
    setPages((prevPages) =>
      prevPages.map((page) =>
        page.id === pageId
          ? { ...page, isActive: true, zIndex: getZIndex(), isVisible: true }
          : { ...page, isActive: false },
      ),
    );
  };
  // 페이지 데이터 로딩 상태 업데이트 함수
  const setPageDataReady = (pageId: string, isLoaded: boolean) => {
    setPages((prevPages) =>
      prevPages.map((page) => (page.id === pageId ? { ...page, isLoaded } : page)),
    );
  };
  // 페이지 데이터를 가져오는 함수
  const fetchPageData = (pageId: string) => {
    const socketStore = useSocketStore.getState();
    const page = pages.find((p) => p.id === pageId);

    if (page && page.isLoaded) {
      // 이미 데이터가 로드된 경우 아무 작업도 하지 않음
      return;
    }
    if (!socketStore.socket) return;

    // 페이지 데이터 수신 핸들러
    const handlePageData = (data: { pageId: string; serializedPage: any }) => {
      if (data.pageId === pageId) {
        // 페이지 데이터 업데이트
        updatePageData(pageId, data.serializedPage.crdt);

        // 로딩 상태 업데이트
        setPageDataReady(pageId, true);

        // 소켓 이벤트 해제
        socketStore.socket?.off("join/page", handlePageData);
      }
    };

    // 소켓 이벤트 등록 및 데이터 요청
    socketStore.socket.on("join/page", handlePageData);
    socketStore.socket.emit("join/page", { pageId });
  };

  // 페이지를 열 때 사용하는 함수 (데이터가 로드되지 않은 경우 데이터 가져오기 수행)
  const openPage = ({ pageId }: { pageId: string }) => {
    const page = pages.find((p) => p.id === pageId);

    if (page) {
      fetchPageData(pageId);

      // 페이지를 활성화하고 표시
      setPages((prevPages) =>
        prevPages.map((p) => {
          if (p.id === pageId) {
            // isLoaded가 false일 때만 위치 재조정
            if (!p.isLoaded) {
              const adjustedPosition = adjustPagePosition(p);
              return {
                ...p,
                isActive: true,
                isVisible: true,
                zIndex: getZIndex(),
                x: adjustedPosition.x,
                y: adjustedPosition.y,
              };
            }
            // 이미 로드된 페이지는 위치 유지
            return { ...p, isActive: true, isVisible: true, zIndex: getZIndex() };
          }
          return { ...p, isActive: false };
        }),
      );

      setTimeout(() => {
        const titleInput = document.querySelector(`#${CSS.escape(pageId)} input`);
        if (titleInput instanceof HTMLInputElement) {
          titleInput.focus();
        }
      }, 0);
    }
  };
  const closePage = (pageId: string) => {
    setPages((prevPages) =>
      prevPages.map((page) =>
        page.id === pageId ? { ...page, isVisible: false, isLoaded: false } : page,
      ),
    );
    // Socket.IO를 통해 서버에 페이지 퇴장 알림
    const socketStore = useSocketStore.getState();
    if (socketStore.socket) {
      socketStore.socket.emit("leave/page", { pageId });
    }
  };
  const updatePage = (
    pageId: string,
    updates: { title?: string; icon?: PageIconType },
    syncWithServer: boolean = true,
  ) => {
    setPages((prevPages) =>
      prevPages.map((page) => (page.id === pageId ? { ...page, ...updates } : page)),
    );

    if (syncWithServer && clientId && workspace?.id) {
      sendPageUpdateOperation({
        type: "pageUpdate",
        pageId,
        ...updates,
        clientId,
        workspaceId: workspace.id,
      } as RemotePageUpdateOperation);
    }
  };

  const initPages = (list: CRDTPage[]) => {
    const pageList: Page[] = list.map(
      (crdtPage, index) =>
        ({
          id: crdtPage.id,
          title: crdtPage.title,
          icon: crdtPage.icon || "Doccs",
          x: PAGE_OFFSET * index,
          y: PAGE_OFFSET * index,
          zIndex: index,
          isActive: index === 0, // 첫 번째 페이지를 활성화
          isVisible: false,
          isLoaded: false,
          serializedEditorData: null,
        }) as Page,
    );
    setPages(pageList);
  };

  useEffect(() => {
    initPages([]);
  }, []);

  return {
    pages,
    fetchPage,
    selectPage,
    openPage,
    closePage,
    updatePageData,
    updatePage,
    initPages,
  };
};
