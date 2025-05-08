import { Provider, Root, Trigger, Portal, Content, Arrow } from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import { useState } from "react";
import { IconButton } from "@components/button/IconButton";
import { Page } from "@src/types/page";
import { animation } from "./BottomNavigator.animation";
import { bottomNavigatorContainer } from "./BottomNavigator.style";

interface BottomNavigatorProps {
  pages: Page[];
  handlePageSelect: ({ pageId, isSidebar }: { pageId: string; isSidebar?: boolean }) => void;
  BottomNavigatorOnBoardingProps?: Record<string, string>;
}

export const BottomNavigator = ({
  pages,
  handlePageSelect,
  BottomNavigatorOnBoardingProps,
}: BottomNavigatorProps) => {
  const [zIndex, setZIndex] = useState(1);
  return (
    <Provider delayDuration={300}>
      <div
        className={bottomNavigatorContainer}
        style={{ zIndex }}
        onMouseEnter={() => setZIndex(100)}
        onMouseLeave={() => setZIndex(1)}
        {...BottomNavigatorOnBoardingProps}
      >
        {pages.map((page, idx) => (
          <Root key={page.id}>
            <Trigger asChild>
              <motion.div
                initial={animation.initial}
                animate={animation.animate(page.isActive)}
                transition={animation.transition}
                whileHover={animation.whileHover}
              >
                <IconButton
                  icon={page.icon}
                  size="md"
                  testKey={`BottomNavigator-iconButton-${idx}`}
                  onClick={() => {
                    handlePageSelect({ pageId: page.id });
                  }}
                />
              </motion.div>
            </Trigger>
            <Portal>
              <Content side="top" sideOffset={16} style={{ zIndex: 9999 }}>
                <div
                  style={{
                    padding: "4px 8px",
                    background: "#2B4158",
                    opacity: 0.7,
                    color: "white",
                    borderRadius: 4,
                  }}
                >
                  {page.title || "제목 없음"}
                </div>
                <Arrow fill="#2B4158" opacity={0.7} />
              </Content>
            </Portal>
          </Root>
        ))}
      </div>
    </Provider>
  );
};
