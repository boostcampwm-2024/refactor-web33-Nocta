import { Nocta } from "@noctaDoc";
import { useRef, useEffect, useState } from "react";

const socket = {
  on: () => {},
  emit: () => {},
};

const client = Nocta.createClient({ socket, clientId: "client-123" });

export const TestEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [binding, setBinding] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [crdtText, setCrdtText] = useState("");
  const [domText, setDomText] = useState("");

  // CRDT 텍스트를 주기적으로 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const newCrdtText = client.getTextSafe("block-1");
      const newDomText = editorRef.current?.innerText || "";

      setCrdtText(newCrdtText);
      setDomText(newDomText);
    }, 100); // 100ms마다 업데이트

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      console.log("🚀 에디터 바인딩 시작...");

      // 에디터 바인딩 생성 - 이제 모든 게 자동화됨!
      const editorBinding = client.bindToEditor(editorRef.current, "block-1");
      setBinding(editorBinding);
      setIsReady(true);

      console.log("✅ 에디터 바인딩 완료!");

      return () => {
        console.log("🧹 에디터 바인딩 정리 중...");
        // 컴포넌트 언마운트 시 바인딩 해제
        editorBinding.destroy();
      };
    }
  }, []);

  return (
    <div>
      <h2>TestEditor - 바인딩 시스템 적용 🚀</h2>
      <div
        ref={editorRef}
        contentEditable
        style={{
          border: "1px solid black",
          padding: "8px",
          minHeight: "100px",
          fontSize: "16px",
        }}
      />
      <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
        <p>바인딩 상태: {isReady ? "🟢 연결됨" : "🔴 연결 중..."}</p>
        <p>
          CRDT 텍스트: "<strong style={{ color: "blue" }}>{crdtText}</strong>"
        </p>
        <p>
          DOM 텍스트: "<strong style={{ color: "green" }}>{domText}</strong>"
        </p>
        <p>동기화 상태: {crdtText === domText ? "🟢 동기화됨" : "🔴 불일치"}</p>

        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#f0f8ff",
            borderRadius: "4px",
          }}
        >
          <strong>디버깅 가이드:</strong>
          <ol style={{ marginLeft: "20px", fontSize: "11px" }}>
            <li>콘솔 열기: F12 또는 Ctrl+Shift+I</li>
            <li>에디터에 타이핑해보기</li>
            <li>콘솔에서 로그 확인하기</li>
            <li>CRDT 텍스트가 업데이트되는지 확인</li>
          </ol>
        </div>

        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#f0f8ff",
            borderRadius: "4px",
          }}
        >
          <strong>개선사항:</strong>
          <ul style={{ marginLeft: "20px", fontSize: "11px" }}>
            <li>✅ 자동 변경 감지 (input 이벤트)</li>
            <li>✅ 자동 캐럿 추적 (selectionchange 이벤트)</li>
            <li>✅ 자동 CRDT 연산 생성</li>
            <li>✅ 실시간 텍스트 동기화 확인</li>
            <li>⏳ 원격 변경사항 반영 (TODO)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
