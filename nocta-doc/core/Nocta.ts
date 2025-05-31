import { NoctaDoc } from "./NoctaDoc";
import { ClientNoctaRealm, ServerNoctaRealm } from "./NoctaRealm";

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

  insertBlock(prevId: string | null, blockId: string, type: string) {
    this.doc.insertBlock(prevId, blockId, type);
  }
}
