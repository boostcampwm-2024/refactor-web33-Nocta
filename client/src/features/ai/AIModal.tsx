import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import * as style from "./AIModal.style";
import { animation } from "./AiModal.animation";
import { FaLocationArrow } from "react-icons/fa";

const AIModal = ({ onCloseButton }: { onCloseButton: () => void }) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {};

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={animation.initial}
      animate={animation.animate}
      transition={animation.transition}
    >
      <div className={style.popoverContainer}>
        <div className={style.inputContainer}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="문서 작성해줘"
            className={style.inputBox}
          />
          <div className={style.iconBox} onClick={handleSubmit}>
            <FaLocationArrow />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIModal;
