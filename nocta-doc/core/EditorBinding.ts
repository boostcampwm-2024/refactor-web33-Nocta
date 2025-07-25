import type { Nocta } from "./Nocta";

export class EditorBinding {
  private element: HTMLElement;
  private nocta: Nocta;
  private blockId: string;
  private prevText: string = "";
  private isUpdating: boolean = false;

  constructor(nocta: Nocta, element: HTMLElement, blockId: string) {
    console.log("🔗 EditorBinding 생성 중...", { blockId, element });

    this.nocta = nocta;
    this.element = element;
    this.blockId = blockId;
    this.prevText = element.innerText || "";

    this.attachEventListeners();
    this.syncFromCRDT();

    console.log("✅ EditorBinding 생성 완료!", { blockId, initialText: this.prevText });
  }

  private attachEventListeners() {
    console.log("🎧 이벤트 리스너 연결 중...");

    // DOM 변경 감지
    this.element.addEventListener("input", this.handleInput);

    // 캐럿 위치 추적
    document.addEventListener("selectionchange", this.handleSelectionChange);

    console.log("✅ 이벤트 리스너 연결 완료!");
  }

  private handleInput = () => {
    if (this.isUpdating) {
      return;
    }

    const newText = this.element.innerText || "";
    const oldText = this.prevText;

    // 변경사항 계산 및 CRDT에 반영
    const changes = this.calculateChanges(oldText, newText);

    this.applyChangesToCRDT(changes);

    this.prevText = newText;
  };

  private handleSelectionChange = () => {
    if (!this.element.contains(document.activeElement)) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const offset = this.getTextOffset(range.startContainer, range.startOffset);

      console.log("🎯 캐럿 위치 변경:", { offset });

      // NoctaRealm을 통해 캐럿 위치 브로드캐스트
      this.nocta.setCaret(this.blockId, String(offset));
    }
  };

  private calculateChanges(oldText: string, newText: string) {
    const selection = window.getSelection();
    let cursorPosition = 0;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPosition = this.getTextOffset(range.startContainer, range.startOffset);
    }

    if (newText.length > oldText.length) {
      // 삽입
      const insertedLength = newText.length - oldText.length;
      let insertPosition = cursorPosition - insertedLength;

      if (insertPosition < 0) insertPosition = 0;
      if (insertPosition > oldText.length) insertPosition = oldText.length;

      const insertedText = newText.slice(insertPosition, insertPosition + insertedLength);

      return {
        type: "insert" as const,
        position: insertPosition,
        text: insertedText,
        length: insertedLength,
      };
    } else if (newText.length < oldText.length) {
      // 삭제
      const deletedLength = oldText.length - newText.length;
      let deletePosition = cursorPosition;

      if (deletePosition < 0) deletePosition = 0;
      if (deletePosition > newText.length) deletePosition = newText.length;

      return {
        type: "delete" as const,
        position: deletePosition,
        length: deletedLength,
      };
    }

    return null;
  }

  private applyChangesToCRDT(changes: any) {
    if (!changes) {
      return;
    }

    if (changes.type === "insert") {
      console.log(`📝 삽입: 위치 ${changes.position}, 텍스트 "${changes.text}"`);

      // 각 문자를 개별적으로 삽입
      for (let i = 0; i < changes.text.length; i++) {
        console.log(`  - 문자 삽입: "${changes.text[i]}" at ${changes.position + i}`);
        this.nocta.insertChar(this.blockId, changes.position + i, changes.text[i]);
      }
    } else if (changes.type === "delete") {
      console.log(`🗑️ 삭제: 위치 ${changes.position}, 길이 ${changes.length}`);

      // 연속된 문자 삭제
      for (let i = 0; i < changes.length; i++) {
        console.log(`  - 문자 삭제: position ${changes.position}`);
        this.nocta.deleteChar(this.blockId, changes.position);
      }
    }
  }

  private getTextOffset(node: Node, offset: number): number {
    let textOffset = 0;
    const walker = document.createTreeWalker(this.element, NodeFilter.SHOW_TEXT, null);

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      if (currentNode === node) {
        return textOffset + offset;
      }
      textOffset += currentNode.textContent?.length || 0;
    }

    return textOffset;
  }

  // CRDT 변경사항을 DOM에 반영
  private syncFromCRDT() {
    // TODO: CRDT에서 변경사항을 감지하고 DOM 업데이트
    // 현재는 단방향 (DOM -> CRDT)만 구현
    console.log("🔄 CRDT 동기화 (현재는 TODO)");
  }

  // 바인딩 해제
  destroy() {
    console.log("🧹 EditorBinding 정리 중...");
    this.element.removeEventListener("input", this.handleInput);
    document.removeEventListener("selectionchange", this.handleSelectionChange);
    console.log("✅ EditorBinding 정리 완료!");
  }
}
