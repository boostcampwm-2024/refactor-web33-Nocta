import { motion } from "framer-motion";
import { useState, KeyboardEvent } from "react";
import { FaLocationArrow } from "react-icons/fa";
import { useCreateAIDocumentMutation } from "@src/apis/ai";
import { useSocketStore } from "@src/stores/useSocketStore";
import * as style from "./AIModal.style";
import { animation } from "./AiModal.animation";

export const AIModal = ({ onCloseButton }: { onCloseButton: () => void }) => {
  const { clientId, workspace } = useSocketStore();
  const [message, setMessage] = useState("");
  const { mutate: createAIDocument } = useCreateAIDocumentMutation(onCloseButton);

  const handleSubmit = () => {
    createAIDocument({ clientId, workspaceId: workspace?.id, message });
  };

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
            type="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
