import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import CloseIcon from "@assets/icons/close.svg?react";
import { ToastWrapper, CloseItemBox, ToastProgress } from "./Toast.style";

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Toast = ({ message, duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };
  if (!isVisible) return null;
  return (
    <motion.div
      className={ToastWrapper}
      style={{
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? "translateY(100%)" : "translateY(0)",
        transition: "all 0.3s ease-in-out",
      }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: duration / 1000, ease: "easeOut" }}
        className={ToastProgress}
      />

      <span className="text-sm">{message}</span>
      <div className={CloseItemBox} onClick={handleClose}>
        <CloseIcon />
      </div>
    </motion.div>
  );
};
