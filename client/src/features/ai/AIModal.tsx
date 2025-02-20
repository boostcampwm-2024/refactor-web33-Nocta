import { motion } from "framer-motion";
import { useState, KeyboardEvent } from "react";
import { FaLocationArrow } from "react-icons/fa";
import { useCreateAIDocumentMutation } from "@src/apis/ai";
import { LoadingSpinner } from "@src/components/lotties/LoadingSpinner";
import { useSocketStore } from "@src/stores/useSocketStore";
import { useToastStore } from "@src/stores/useToastStore";
import * as style from "./AIModal.style";
import { animation } from "./AiModal.animation";

export const AIModal = ({ onCloseButton }: { onCloseButton: () => void }) => {
  const { clientId, workspace } = useSocketStore();
  const [message, setMessage] = useState("");
  const { mutate: createAIDocument, status } = useCreateAIDocumentMutation(onCloseButton);
  const isLoading = status === "pending";
  const { getSocketId } = useSocketStore();
  const socketId = getSocketId() || "";

  const { addToast } = useToastStore();
  const handleSubmit = () => {
    if (!message.trim()) {
      addToast("올바른 명령을 작성해주세요");
      return;
    }
    if (!isLoading) {
      createAIDocument({ socketId, clientId, workspaceId: workspace?.id, message });
    }
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
          <div className={style.inputWrapper}>
            <input
              type="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="문서 작성해줘"
              className={style.inputBox}
              disabled={isLoading}
            />
          </div>
          <div className={style.iconBox} onClick={!isLoading ? handleSubmit : undefined}>
            {isLoading ? (
              <div className={style.loadingOverlay}>
                <LoadingSpinner size={50} />
              </div>
            ) : (
              <FaLocationArrow />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
