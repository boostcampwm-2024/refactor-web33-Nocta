import { Injectable, Logger } from "@nestjs/common";
import { Operation, ElementType, RemoteBlockInsertOperation, RemotePageCreateOperation, RemoteCharInsertOperation, CRDTOperation } from "@noctaCrdt/types/Interfaces";
import { Block } from "@noctaCrdt/Node";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { Page } from "@noctaCrdt/Page";
import { nanoid } from "nanoid";
import { WorkSpaceService } from "../workspace/workspace.service";
import { BlockId, CharId } from "@noctaCrdt/NodeId";
import { Char } from "@noctaCrdt/Node";

@Injectable()
export class AiService {
  constructor(private readonly workspaceService: WorkSpaceService) {}

  // CLOVA Studio API에 요청을 보내는 로직
  requestAI() {
    // 문자열 받고

    // 문자열을 CRDT로 변환

    // CRDT 연산들 적용해서 브로드캐스트

  }

  // 요청받은 답변을 CRDT 연산으로 변환하는 로직
  async generateDocumentToCRDT(workspaceId: string, clientId: number, document: String): Promise<Operation[]> {
    const operations = [];
    // 페이지 생성
    const workspace = await this.workspaceService.getWorkspace(workspaceId);
    const newEditorCRDT = new EditorCRDT(clientId);
    const newPage = new Page(nanoid(), "새로운 페이지", "Docs", newEditorCRDT);
    workspace.pageList.push(newPage);
    this.workspaceService.updateWorkspace(workspace);
    // 페이지 생성 연산 추가
    operations.push({
      type: "pageCreate",
      workspaceId,
      clientId,
      page: newPage.serialize()
    } as RemotePageCreateOperation);

    let blockClock = 0;
    let charClock = 0;

    const documentLines = document.split('\n');

    let lastBlock = null;
    documentLines.forEach(line => {
      const {type, length, indent} = this.parseBlockType(line);
      const newBlock = new Block("", new BlockId(blockClock++, clientId));
      newBlock.next = null;
      newBlock.prev = lastBlock ? lastBlock.id : null;
      newBlock.type = type;
      newBlock.indent = indent;
      if (lastBlock) {
        lastBlock.next = newBlock.id;
      }
      lastBlock = newBlock;
      // 블록 추가 연산
      operations.push({
        type: "blockInsert",
        node: newBlock,
        pageId: newPage.id
      } as RemoteBlockInsertOperation);

      const slicedLine = [...line.slice(length + indent * 2)];
      let lastNode = null;
      slicedLine.forEach(char => {
        const charNode = new Char(char, new CharId(charClock++, clientId));
        charNode.next = null;
        charNode.prev = lastNode ? lastNode.id : null;
        
        // 이전 노드가 있는 경우, 해당 노드의 next를 현재 노드로 설정
        if (lastNode) {
          lastNode.next = charNode.id;
        }

        lastNode = charNode;

        operations.push({
          type: "charInsert",
          node: charNode,
          blockId: newBlock.id,
          pageId: newPage.id,
          style: charNode.style || [],
          color: charNode.color ? charNode.color : "black",
          backgroundColor: charNode.backgroundColor ? charNode.backgroundColor : "transparent",
        } as RemoteCharInsertOperation);
      });

      // TODO: 스타일 적용
      // let start = 0, end = 0;
      // while 순회 end <-
      // 특수기호 *, **, ~~, __
      // 여는 애, 닫힌 애 **ㅁㄴㅇㄻㄴㅇㄹ**
      // stack [], cur **
      // stack [**], cur ㅁ
      // ...
      // stack [**], cur **
      // stack [], cur EOF

    });

    // 클라이언트에서 workspaceId, clientId, message 받아옴
    // 워크스페이스에서 페이지 생성 -> pageId: string(uuid)
    // 매 줄 처음마다 블록 생성 -> blockId: {client, clock}
    // 문자를 돌면서 CRDTOperation 연산 생성
    // 서식 문자(**, *, ~, __)를 만나면 해당 문자는 연산을 만들지 않고, 내부 글자에 대해 스타일 속성 추가후 연산 생성
    // 연산 배열 리턴
    
    return operations;
  }

  // CRDT 연산들을 페이지에 적용하고 다른 클라이언트에 뿌리는 로직 (workspace.service)
  emitOperations() {
    
  }

  // 블록 타입을 판정하는 로직
  parseBlockType(line: String): {type: ElementType, length: number, indent : number} {

    const indent = line.match(/^[\s]*/)[0].length / 2 || 0; 
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) return { type: "h1", length: 2, indent};
    if (trimmed.startsWith('## ')) return { type: "h2", length: 3, indent };
    if (trimmed.startsWith('### ')) return { type: "h3", length: 4, indent };
    if (trimmed.startsWith('- ')) return { type: "ul", length: 2, indent };
    if (/^\d+\. /.test(trimmed)) return { type: "ol", length: 3, indent };
    if (trimmed.startsWith('> ')) return { type: "blockquote", length: 2, indent };
    if (trimmed.startsWith('[] ')) return {type: "checkbox", length: 3, indent };
    if (trimmed.startsWith('[x] ')) return {type: "checkbox", length: 4, indent};
    if (trimmed === '---') return {type: "hr", length: 0, indent};
    return {type: "p", length: 0, indent};
  };

  parseCharType() {};
}
