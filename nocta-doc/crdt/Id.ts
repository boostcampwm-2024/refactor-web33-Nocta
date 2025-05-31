export interface NodeId {
  clientId: string;
  clock: number;
}

export class IdGenerator {
  private clock: number = 0;
  private clientId: string;
  constructor(clientId: string) {
    this.clientId = clientId;
  }

  next(): NodeId {
    return {
      clientId: this.clientId,
      clock: (this.clock += 1),
    };
  }

  toString(id: NodeId): string {
    return `${id.clientId}:${id.clock}`;
  }
}
