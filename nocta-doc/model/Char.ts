export interface CharNode {
  id: string;
  value: string;
  prevId: string | null;
  nextId: string | null;
}
