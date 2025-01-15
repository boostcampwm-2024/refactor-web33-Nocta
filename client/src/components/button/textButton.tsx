import { textButtonContainer } from "./textButton.style";

interface TextButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  testKey: string;
  onClick?: () => void;
}

export const TextButton = ({
  variant = "primary",
  children,
  testKey,
  onClick,
}: TextButtonProps) => {
  return (
    <button
      data-testid={testKey}
      className={textButtonContainer({ variant })}
      onClick={onClick}
      data-onboarding="login-button"
    >
      {children}
    </button>
  );
};
