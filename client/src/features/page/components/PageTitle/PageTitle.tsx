import { PageIconType } from "@noctaCrdt/types/Interfaces";
import { useEffect, useRef, useState } from "react";
import { iconComponents } from "@src/constants/PageIconButton.config";
import { pageTitleContainer, pageTitle } from "./PageTitle.style";

interface PageTitleProps {
  testKey: string;
  title: string;
  icon: PageIconType;
  onTitleChange: (title: string, syncWithServer: boolean) => void;
}

export const PageTitle = ({ testKey, title, icon, onTitleChange }: PageTitleProps) => {
  const { icon: IconComponent, color } = iconComponents[icon];
  const [displayTitle, setDisplayTitle] = useState(title);
  const [isTitleChange, setIsTitleChange] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setDisplayTitle(newTitle); // 로컬 상태 업데이트
    onTitleChange(newTitle, false); // 낙관적 업데이트
  };

  const handleDoubleClick = () => {
    setIsTitleChange(true);
  };

  const handleBlur = () => {
    setIsTitleChange(false);
    onTitleChange(displayTitle, true);
  };

  const handleInput = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case "Escape": {
        setIsTitleChange(false);
        onTitleChange(displayTitle, true);
        break;
      }
    }
  };
  useEffect(() => {
    if (title === "새로운 페이지" || title === "") {
      setDisplayTitle("");
    } else {
      setDisplayTitle(title);
    }
  }, [title]);

  useEffect(() => {
    if (isTitleChange && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTitleChange]);

  return (
    <div className={pageTitleContainer} onClick={handleBlur}>
      <IconComponent color={color} size="24px" style={{ flexShrink: 0 }} />
      {isTitleChange ? (
        <input
          ref={inputRef}
          data-testid={`editorTitle-${testKey}`}
          type="text"
          placeholder="제목을 입력하세요..."
          onChange={handleTitleChange}
          onKeyDown={handleInput}
          onBlur={handleBlur}
          value={displayTitle}
          className={pageTitle}
        />
      ) : (
        <p
          data-testid={`pageTitle-${testKey}`}
          className={pageTitle}
          onDoubleClick={handleDoubleClick}
        >
          {displayTitle || "새로운 페이지"}
        </p>
      )}
    </div>
  );
};
