import { ElementType } from "@noctaCrdt/types/Interfaces";

export interface MarkdownElement {
  type: ElementType;
  length: number;
}

export interface MarkdownPattern {
  regex: RegExp;
  length: number;
  createElement: () => MarkdownElement;
}
