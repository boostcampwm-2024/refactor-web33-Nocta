import { useState, useRef, useEffect } from "react";
import * as style from "./AIButton.style";
import AIModal from "./AIModal";

const AIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsOpen(false);
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
    <div className={style.floatingButtonContainer}>
      <div ref={modalRef}>
        {isOpen && <AIModal onCloseButton={handleClose} />}
        <button onClick={() => setIsOpen((prev) => !prev)} className={style.buttonContainer}>
          <span>AI 문서 작성</span>
        </button>
      </div>
    </div>
  );
};

export default AIButton;
