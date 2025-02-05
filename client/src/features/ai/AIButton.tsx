import { useState, useRef, useEffect } from "react";
import { useToastStore } from "@src/stores/useToastStore";
import * as style from "./AIButton.style";
import { AIModal } from "./AIModal";

export const AIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToastStore();
  const handleClose = () => {
    setIsOpen(false);
    addToast("AI 문서 페이지가 생성되었습니다.");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={style.floatingButtonContainer} data-onboarding="ai-button">
      <div ref={modalRef}>
        {isOpen && <AIModal onCloseButton={handleClose} />}
        <button onClick={() => setIsOpen((prev) => !prev)} className={style.buttonContainer}>
          <span>AI 문서 작성</span>
        </button>
      </div>
    </div>
  );
};
