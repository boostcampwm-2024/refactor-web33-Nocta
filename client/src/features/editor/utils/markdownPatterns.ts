import { MarkdownElement, MarkdownPattern } from "../../../types/markdown";

const MARKDOWN_PATTERNS: Record<string, MarkdownPattern> = {
  // Fix: 서윤님 피드백 반영
  h3: {
    regex: /^###$/,
    length: 3,
    createElement: () => ({ type: "h3", length: 3 }),
  },
  h2: {
    regex: /^##$/,
    length: 2,
    createElement: () => ({ type: "h2", length: 2 }),
  },
  h1: {
    regex: /^#$/,
    length: 1,
    createElement: () => ({ type: "h1", length: 1 }),
  },
  ul: {
    regex: /^-$/,
    length: 1,
    createElement: () => ({ type: "ul", length: 1 }),
  },
  ol: {
    regex: /^\d\.$/,
    length: 2,
    createElement: () => ({ type: "ol", length: 2 }),
  },
  blockquote: {
    regex: /^>$/,
    length: 1,
    createElement: () => ({ type: "blockquote", length: 1 }),
  },
  checkbox1: {
    regex: /^\[\]$/,
    length: 2,
    createElement: () => ({
      type: "checkbox",
      length: 2,
    }),
  },
  checkbox2: {
    regex: /^\[\s*\]$/,
    length: 3,
    createElement: () => ({
      type: "checkbox",
      length: 3,
    }),
  },
};

export const checkMarkdownPattern = (text: string): MarkdownElement | null => {
  if (!text) return null;

  for (const pattern of Object.values(MARKDOWN_PATTERNS)) {
    const markdownPattern = text.slice(0, pattern.length);
    if (pattern.regex.test(markdownPattern)) {
      return pattern.createElement();
    }
  }
  return null;
};
