import { useMutation } from "@tanstack/react-query";
import { unAuthorizationFetch } from "./axios";

// TODO 실패 시 예외처리
export const useCreateAIDocumentMutation = (onSuccess: () => void) => {
  const fetcher = ({
    clientId,
    workspaceId,
    message,
  }: {
    clientId: number | null;
    workspaceId: string | undefined;
    message: string;
  }) => unAuthorizationFetch.post("/ai/chat", { clientId, workspaceId, message });

  return useMutation({
    mutationFn: fetcher,
    onSuccess: () => {
      onSuccess();
    },
  });
};
