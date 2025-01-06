import { AnimatePresence } from "framer-motion";
import { useToastStore } from "@stores/useToastStore";
import { Toast } from "./Toast";
import { ToastContainerStyle } from "./ToastContainer.style";

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className={ToastContainerStyle}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
