import { useMutation } from "@tanstack/react-query";
import { unAuthorizationFetch } from "./axios";

// TODO 실패 시 예외처리
export const useCreateAIDocumentMutation = (onSuccess: () => void) => {
  const fetcher = ({ text }: { text: string }) => unAuthorizationFetch.post("/ai", { text });

  return useMutation({
    mutationFn: fetcher,
    onSuccess: () => {
      onSuccess();
    },
  });
};
