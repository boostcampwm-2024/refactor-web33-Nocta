import { NoctaDoc } from "./NoctaDoc";
import { ClientNoctaRealm, ServerNoctaRealm } from "./NoctaRealm";
import { EditorBinding } from "./EditorBinding";

export class Nocta {
  private doc: NoctaDoc;
  private realm: ClientNoctaRealm | ServerNoctaRealm;

  private constructor(doc: NoctaDoc, realm: ClientNoctaRealm | ServerNoctaRealm) {
    this.doc = doc;
    this.realm = realm;
  }

  static createClient({ socket, clientId }): Nocta {
    const doc = new NoctaDoc(clientId);
    const realm = new ClientNoctaRealm(socket, doc);
    return new Nocta(doc, realm);
  }

  static createServer({ socket, clientId }): Nocta {
    const doc = new NoctaDoc(clientId);
    const realm = new ServerNoctaRealm(socket, doc);
    return new Nocta(doc, realm);
  }

  // 바인딩 API 추가
  bindToEditor(element: HTMLElement, blockId: string): EditorBinding {
    // 블록이 없으면 생성
    if (!this.hasBlock(blockId)) {
      this.insertBlock(null, blockId, "paragraph");
    }

    return new EditorBinding(this, element, blockId);
  }

  setCaret(blockId: string, charId: string) {
    this.realm.setCaret(blockId, charId);
  }

  insertChar(blockId: string, index: number, value: string) {
    this.doc.insertChar(blockId, index, value);
  }

  deleteChar(blockId: string, index: number) {
    this.doc.deleteChar(blockId, index);
  }

  applyUpdate(update: Uint8Array) {
    this.doc.applyUpdate(update);
  }

  encodeUpdate(): Uint8Array {
    return this.doc.encodeUpdate();
  }

  getText(blockId: string): string {
    return this.doc.getText(blockId);
  }

  hasBlock(blockId: string): boolean {
    return this.doc.hasBlock(blockId);
  }

  getTextSafe(blockId: string): string {
    return this.doc.getTextSafe(blockId);
  }

  insertBlock(prevId: string | null, blockId: string, type: string) {
    this.doc.insertBlock(prevId, blockId, type);
  }
}
