import { Block } from "@noctaCrdt/Node";
import { TextColorType, BackgroundColorType } from "@noctaCrdt/types/Interfaces";
import { COLOR } from "@src/constants/color";
import { css } from "styled-system/css";

export const TEXT_STYLES: Record<string, string> = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
};

interface SetInnerHTMLProps {
  element: HTMLDivElement;
  block: Block;
}

interface TextStyleState {
  styles: Set<string>;
  color: TextColorType;
  backgroundColor: BackgroundColorType;
}

const textColorMap: Record<TextColorType, string> = {
  black: COLOR.GRAY_900,
  red: COLOR.RED,
  green: COLOR.GREEN,
  blue: COLOR.BLUE,
  yellow: COLOR.YELLOW,
  purple: COLOR.PURPLE,
  brown: COLOR.BROWN,
  white: COLOR.WHITE,
};

const getClassNames = (state: TextStyleState): string => {
  // underline과 strikethrough가 함께 있는 경우 특별 처리
  const baseStyles = {
    textDecoration:
      state.styles.has("underline") && state.styles.has("strikethrough")
        ? "underline line-through"
        : state.styles.has("underline")
          ? "underline"
          : state.styles.has("strikethrough")
            ? "line-through"
            : "none",
    fontWeight: state.styles.has("bold") ? "bold" : "normal",
    fontStyle: state.styles.has("italic") ? "italic" : "normal",
    color: textColorMap[state.color],
  };

  // backgroundColor가 transparent가 아닐 때만 추가
  if (state.backgroundColor !== "transparent") {
    return css({
      ...baseStyles,
      backgroundColor: textColorMap[state.backgroundColor],
    });
  }

  return css(baseStyles);
};
export const setInnerHTML = ({ element, block }: SetInnerHTMLProps): void => {
  const chars = block.crdt.LinkedList.spread();
  const selection = window.getSelection();
  const range = selection?.getRangeAt(0);
  let caretNode = range?.startContainer;

  if (chars.length === 0) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  let currentSpan: HTMLSpanElement | null = null;
  let currentText = "";
  let currentState: TextStyleState = {
    styles: new Set<string>(),
    color: "black",
    backgroundColor: "transparent",
  };

  const hasStylesApplied = (state: TextStyleState): boolean => {
    return (
      state.styles.size > 0 || state.color !== "black" || state.backgroundColor !== "transparent"
    );
  };

  const flushCurrentText = () => {
    if (!currentText) return;

    // 현재 스타일이 적용된 상태라면 span으로 감싸서 추가
    if (hasStylesApplied(currentState) && currentSpan) {
      currentSpan.appendChild(document.createTextNode(sanitizeText(currentText)));
      fragment.appendChild(currentSpan);
    } else {
      // 스타일이 없다면 일반 텍스트 노드로 추가
      fragment.appendChild(document.createTextNode(sanitizeText(currentText)));
    }
    currentText = "";
    currentSpan = null;
  };

  chars.forEach((char) => {
    const targetState = {
      styles: new Set(char.style.map((style) => TEXT_STYLES[style])),
      color: char.color,
      backgroundColor: char.backgroundColor,
    };

    const styleChanged =
      !setsEqual(currentState.styles, targetState.styles) ||
      currentState.color !== targetState.color ||
      currentState.backgroundColor !== targetState.backgroundColor;

    // 스타일이 변경되었다면 현재까지의 텍스트를 처리
    if (styleChanged) {
      flushCurrentText();

      // 새로운 스타일 상태 설정
      currentState = targetState;

      // 새로운 스타일이 있는 경우에만 span 생성
      if (hasStylesApplied(targetState)) {
        currentSpan = document.createElement("span");
        currentSpan.className = getClassNames(targetState);
        currentSpan.style.whiteSpace = "pre";
      }
    }

    currentText += char.value;
  });

  // 마지막 텍스트 처리
  flushCurrentText();

  // DOM 업데이트 로직
  const existingNodes = Array.from(element.childNodes);
  const newNodes = Array.from(fragment.childNodes);
  let i = 0;

  // 공통 길이만큼 업데이트 또는 재사용
  const minLength = Math.min(existingNodes.length, newNodes.length);
  for (; i < minLength; i++) {
    if (!nodesAreEqual(existingNodes[i], newNodes[i])) {
      if (caretNode === existingNodes[i]) {
        // 캐럿이 있던 노드가 교체되는 경우, 새 노드에서 동일한 텍스트 위치 찾기
        caretNode = newNodes[i];
      }
      element.replaceChild(newNodes[i], existingNodes[i]);
    }
  }

  // 남은 새 노드 추가
  for (; i < newNodes.length; i++) {
    element.appendChild(newNodes[i]);
  }

  // 남은 기존 노드 제거
  while (i < existingNodes.length) {
    if (caretNode === existingNodes[i]) {
      // 캐럿이 있던 노드가 제거되는 경우
      caretNode = undefined;
    }
    element.removeChild(existingNodes[i]);
    i += 1;
  }
};

const nodesAreEqual = (node1: Node, node2: Node): boolean => {
  if (node1.nodeType !== node2.nodeType) return false;

  if (node1.nodeType === Node.TEXT_NODE) {
    return node1.textContent === node2.textContent;
  }

  if (node1.nodeType === Node.ELEMENT_NODE) {
    const elem1 = node1 as HTMLElement;
    const elem2 = node2 as HTMLElement;
    return (
      elem1.tagName === elem2.tagName &&
      elem1.className === elem2.className &&
      elem1.getAttribute("style") === elem2.getAttribute("style") &&
      elem1.textContent === elem2.textContent
    );
  }

  return false;
};

// export const setInnerHTML = ({ element, block }: SetInnerHTMLProps): void => {
//   const chars = block.crdt.LinkedList.spread();
//   if (chars.length === 0) {
//     element.innerHTML = "";
//     return;
//   }

//   // 각 위치별 모든 적용된 스타일을 추적
//   const positionStyles: TextStyleState[] = chars.map((char) => {
//     const styleSet = new Set<string>();

//     // 현재 문자의 스타일 수집
//     char.style.forEach((style) => styleSet.add(TEXT_STYLES[style]));

//     return {
//       styles: styleSet,
//       color: char.color,
//       backgroundColor: char.backgroundColor,
//     };
//   });

//   let html = "";
//   let currentState: TextStyleState = {
//     styles: new Set<string>(),
//     color: "black",
//     backgroundColor: "transparent",
//   };
//   let spanOpen = false;

//   chars.forEach((char, index) => {
//     const targetState = positionStyles[index];

//     // 스타일, 색상, 배경색 변경 확인
//     const styleChanged =
//       !setsEqual(currentState.styles, targetState.styles) ||
//       currentState.color !== targetState.color ||
//       currentState.backgroundColor !== targetState.backgroundColor;

//     // 변경되었으면 현재 span 태그 닫기
//     if (styleChanged && spanOpen) {
//       html += "</span>";
//       spanOpen = false;
//     }

//     // 새로운 스타일 조합으로 span 태그 열기
//     if (styleChanged) {
//       const className = getClassNames(targetState);
//       html += `<span class="${className}" style="white-space: pre;">`;
//       spanOpen = true;
//     }

//     // 텍스트 추가
//     html += sanitizeText(char.value);

//     // 다음 문자로 넘어가기 전에 현재 상태 업데이트
//     currentState = targetState;

//     // 마지막 문자이고 span이 열려있으면 닫기
//     if (index === chars.length - 1 && spanOpen) {
//       html += "</span>";
//       spanOpen = false;
//     }
//   });

//   // DOM 업데이트
//   if (element.innerHTML !== html) {
//     element.innerHTML = html;
//   }
// };

// Set 비교 헬퍼 함수
const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
};

const sanitizeText = (text: string): string => {
  return text.replace(/<br>/g, "\u00A0").replace(/[<>&"']/g, (match) => {
    const escapeMap: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#x27;",
    };
    return escapeMap[match] || match;
  });
};

// 배열 비교 헬퍼 함수
export const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.sort().every((val, idx) => val === b.sort()[idx]);
};

export const getTextOffset = (
  blockRef: HTMLDivElement,
  container: Node,
  offset: number,
): number => {
  let totalOffset = 0;
  const walker = document.createTreeWalker(blockRef, NodeFilter.SHOW_TEXT, null);

  let node = walker.nextNode();
  while (node) {
    if (node === container) {
      return totalOffset + offset;
    }
    if (node.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING) {
      totalOffset += node.textContent?.length || 0;
    }
    node = walker.nextNode();
  }
  return totalOffset;
};
