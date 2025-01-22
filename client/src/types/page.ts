import { serializedEditorDataProps, PageIconType } from "@noctaCrdt/types/Interfaces";

export interface Page {
  id: string;
  title: string;
  icon: PageIconType;
  x: number;
  y: number;
  zIndex: number;
  isActive: boolean;
  isVisible: boolean;
  isLoaded: boolean;
  serializedEditorData: serializedEditorDataProps | null;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export const DIRECTIONS = [
  "top",
  "bottom",
  "left",
  "right",
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
] as const;

export type Direction = (typeof DIRECTIONS)[number];
