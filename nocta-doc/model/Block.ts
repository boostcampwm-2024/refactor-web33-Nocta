import { CharCRDT } from "../crdt/CharCRDT";

export interface BlockNode {
  id: string;
  type: string;
  prevId: string | null;
  nextId: string | null;
  charCRDT: CharCRDT;
}
