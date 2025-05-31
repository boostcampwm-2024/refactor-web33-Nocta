import { Nocta } from "@noctaDoc";
import { useRef, useEffect } from "react";

const socket = {
  on: () => {},
  emit: () => {},
};

const client = Nocta.createClient({ socket, clientId: "client-123" });

export const TestEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const prevText = useRef("");
  useEffect(() => {
    // 처음 렌더링 시 block-1 생성
    client.insertBlock(null, "block-1", "paragraph");
  }, []);

  const handleInput = () => {
    const blockId = "block-1";
    const newText = editorRef.current?.innerText || "";
    const oldText = prevText.current;

    if (newText.length > oldText.length) {
      // 입력 발생
      const addedChar = newText.slice(oldText.length); // 단일 문자만 가정
      client.insertChar(blockId, oldText.length, addedChar);
    } else if (newText.length < oldText.length) {
      // 삭제 발생
      client.deleteChar(blockId, oldText.length - 1);
    }
    console.log(client.getText("block-1"));
    prevText.current = newText;
  };

  return (
    <div>
      <h2>TestEditor</h2>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{
          border: "1px solid black",
          padding: "8px",
          minHeight: "100px",
          fontSize: "16px",
        }}
      />
    </div>
  );
};
