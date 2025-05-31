import type { Socket as ServerSocket } from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";
import type { NoctaDoc } from "./NoctaDoc";
import { Operation } from "../operations";

export class ClientNoctaRealm {
  constructor(
    private socket: ClientSocket,
    private doc: NoctaDoc,
  ) {
    this.socket.on("operation", (ops: Operation[]) => {
      this.doc.blockCRDT.applyOperations(ops);
    });
  }

  sendOperations(ops: Operation[]) {
    this.socket.emit("operation", ops);
  }

  setCaret(blockId: string, charId: string) {
    // TODO: 브로드캐스트 방식 변경 가능
    this.socket.emit("setCaret", { blockId, charId });
  }
}
// TODO: io 매개변수 : 특정 room번호에 송신
export class ServerNoctaRealm {
  constructor(
    private socket: ServerSocket,
    private doc: NoctaDoc,
  ) {
    this.socket.on("operation", (ops: Operation[]) => {
      this.doc.blockCRDT.applyOperations(ops);
      this.socket.broadcast.emit("operation", ops);
    });
    this.socket.on("requestInit", () => {
      const ops = this.doc.blockCRDT.collectOperations();
      this.socket.emit("initDoc", ops);
    });
  }

  setCaret(blockId: string, charId: string) {
    // TODO: room 기반으로 전파하려면 socket.to(room).emit 등 사용
    this.socket.broadcast.emit("setCaret", { blockId, charId });
  }
}
