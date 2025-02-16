import { PageIconType } from "@noctaCrdt/types/Interfaces";
import { motion } from "framer-motion";
import { useState } from "react";
import { IconButton } from "@components/button/IconButton";
import { Modal } from "@components/modal/modal";
import { useModal } from "@components/modal/useModal";
import { MAX_VISIBLE_PAGE } from "@src/constants/page";
import { AuthButton } from "@src/features/auth/AuthButton";
import { useSocketStore } from "@src/stores/useSocketStore";
import { Page } from "@src/types/page";
import { useIsSidebarOpen, useSidebarActions } from "@stores/useSidebarStore";
import { animation, contentVariants, sidebarVariants } from "./Sidebar.animation";
import {
  sidebarContainer,
  navWrapper,
  plusIconBox,
  sidebarToggleButton,
  placeholderMessage,
} from "./Sidebar.style";
import { MenuButton } from "./components/menuButton/MenuButton";
import { PageItem } from "./components/pageItem/PageItem";

export const Sidebar = ({
  pages,
  handlePageAdd,
  handlePageOpen,
  handlePageUpdate,
  sidebarOnBoardingProps,
}: {
  pages: Page[];
  handlePageAdd: () => void;
  handlePageOpen: ({ pageId }: { pageId: string }) => void;
  handlePageUpdate: (
    pageId: string,
    updates: { title?: string; icon?: PageIconType },
    syncWithServer: boolean,
  ) => void;
  sidebarOnBoardingProps?: Record<string, string>;
}) => {
  const visiblePages = pages.filter((page) => page.isVisible && page.isLoaded);
  const isMaxVisiblePage = visiblePages.length > MAX_VISIBLE_PAGE;
  const isSidebarOpen = useIsSidebarOpen();
  const { toggleSidebar } = useSidebarActions();
  const { isOpen, openModal, closeModal } = useModal();
  const { sendPageDeleteOperation, clientId } = useSocketStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

  const handlePageItemClick = (id: string) => {
    if (isMaxVisiblePage) {
      openModal();
      return;
    }
    handlePageOpen({ pageId: id });
  };

  const handleAddPageButtonClick = () => {
    if (isMaxVisiblePage) {
      openModal();
      return;
    }
    handlePageAdd();
  };

  const handlePageDelete = (pageId: string) => {
    if (!clientId) {
      console.error("Client ID not assigned");
      return;
    }

    sendPageDeleteOperation({
      type: "pageDelete",
      workspaceId: "default",
      pageTitle: pageToDelete!.title,
      pageId,
      clientId,
    });
  };

  const confirmPageDelete = (page: Page) => {
    setPageToDelete(page);
    setIsDeleteModalOpen(true);
  };

  return (
    <motion.aside
      data-testid="sidebar"
      className={sidebarContainer}
      initial="open"
      animate={isSidebarOpen ? "open" : "closed"}
      variants={sidebarVariants}
      {...sidebarOnBoardingProps}
    >
      <div data-testid="sidebarToggle" className={sidebarToggleButton} onClick={toggleSidebar}>
        {isSidebarOpen ? "«" : "»"}
      </div>
      <motion.div variants={contentVariants}>
        <MenuButton />
      </motion.div>
      <motion.nav className={navWrapper} variants={contentVariants}>
        {pages.length === 0 ? (
          <div className={placeholderMessage}>+ 버튼을 눌러 페이지를 추가하세요</div>
        ) : (
          pages?.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={animation.initial}
              animate={animation.animate}
              transition={animation.transition}
            >
              <PageItem
                {...item}
                testKey={`pageItem-${idx}`}
                onClick={() => handlePageItemClick(item.id)}
                onDelete={() => confirmPageDelete(item)}
                handleIconUpdate={handlePageUpdate}
              />
            </motion.div>
          ))
        )}
      </motion.nav>
      <motion.div className={plusIconBox} variants={contentVariants}>
        <IconButton
          testKey="addPageButton"
          icon="plus"
          onClick={handleAddPageButtonClick}
          size="sm"
        />
        <AuthButton />
      </motion.div>

      <Modal isOpen={isOpen} primaryButtonLabel="확인" primaryButtonOnClick={closeModal}>
        <p>
          최대 {MAX_VISIBLE_PAGE}개의 페이지만 표시할 수 있습니다
          <br />
          사용하지 않는 페이지는 닫아주세요.
        </p>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        primaryButtonLabel="예"
        primaryButtonOnClick={() => {
          if (pageToDelete) {
            handlePageDelete(pageToDelete.id);
            setIsDeleteModalOpen(false);
            setPageToDelete(null);
          }
        }}
        secondaryButtonLabel="아니오"
        secondaryButtonOnClick={() => {
          setIsDeleteModalOpen(false);
          setPageToDelete(null);
        }}
      >
        <p>
          정말 이 <strong>{pageToDelete?.title}</strong>을(를) 삭제하시겠습니까?
        </p>
      </Modal>
    </motion.aside>
  );
};
