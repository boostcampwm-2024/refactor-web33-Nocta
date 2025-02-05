import { Injectable, Logger } from "@nestjs/common";
import {
  Operation,
  ElementType,
  RemoteBlockInsertOperation,
  RemotePageCreateOperation,
  RemoteCharInsertOperation,
  CRDTOperation,
  RemoteBlockUpdateOperation,
} from "@noctaCrdt/types/Interfaces";
import { Block } from "@noctaCrdt/Node";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { Page } from "@noctaCrdt/Page";
import { nanoid } from "nanoid";
import { WorkSpaceService } from "../workspace/workspace.service";
import { BlockId, CharId } from "@noctaCrdt/NodeId";
import { Char } from "@noctaCrdt/Node";
import { HttpService } from "@nestjs/axios";
import { map, lastValueFrom } from "rxjs";

@Injectable()
export class AiService {
  constructor(
    private axiosHttpService: HttpService,
    private readonly workspaceService: WorkSpaceService,
  ) {}

  async requestAI(message: string): Promise<any> {
    const payload = {
      messages: [
        {
          role: "system",
          content: process.env.CLOVASTUDIO_PROMPT,
        },
        {
          role: "user",
          content: message,
        },
      ],
      topP: 0.8,
      topK: 0,
      maxTokens: 512,
      temperature: 0.5,
      repeatPenalty: 5.0,
      stopBefore: [],
      includeAiFilters: true,
      seed: 0,
    };

    const response$ = this.axiosHttpService
      .post(process.env.CLOVASTUDIO_API_URL, payload, {
        headers: {
          "X-NCP-CLOVASTUDIO-REQUEST-ID": process.env.CLOVASTUDIO_REQUEST_ID, // 요청 ID
          Authorization: `Bearer ${process.env.CLOVASTUDIO_API_KEY}`, // API 키
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
      })
      .pipe(
        map((res) => {
          return res.data;
        }),
      );

    const response = await lastValueFrom(response$);
    const completionText = this.parseClovaSSEBackward(response);

    return completionText;
  }

  parseClovaSSEBackward(sseText: string): string {
    const lines = sseText.split("\n").map((line) => line.trim());

    // 뒤에서부터 역순으로 순회
    for (let i = lines.length - 1; i >= 0; i--) {
      // event:result 라인 확인
      if (lines[i].startsWith("event:result")) {
        // 다음 줄(혹은 같은 블록 안의 다음 줄)이 data:... 형태일 것
        const dataLine = lines[i + 1]; // i+1이 안전하게 존재하는지 체크
        if (dataLine?.startsWith("data:")) {
          const jsonStr = dataLine.replace(/^data:/, "").trim();
          try {
            const parsed = JSON.parse(jsonStr);
            return parsed?.message?.content ?? "";
          } catch (err) {
            console.error("JSON 파싱 실패:", err);
          }
        }
        // 만약 i+1줄에 data가 없다면, 더 위로 가봤자 의미 없으니 여기서 끝냄
        return "";
      }
    }

    return "";
  }

  // 요청받은 답변을 CRDT 연산으로 변환하는 로직
  async generateDocumentToCRDT(
    workspaceId: string,
    clientId: number,
    document: String,
  ): Promise<Operation[]> {
    const documentLines = document.split("\n");
    let title = documentLines[0];
    const { type, length, indent } = this.parseBlockType(title);
    title = title.slice(length + indent * 2);

    const operations = [];
    // 새 페이지를 생성해서 DB에 업데이트
    const workspace = await this.workspaceService.getWorkspace(workspaceId);
    const newEditorCRDT = new EditorCRDT(clientId);
    const newPage = new Page(nanoid(), title, "Docs", newEditorCRDT);
    workspace.pageList.push(newPage);
    this.workspaceService.updateWorkspace(workspace);
    // 페이지 생성 연산 추가
    operations.push({
      type: "pageCreate",
      workspaceId,
      clientId,
      page: newPage.serialize(),
    } as RemotePageCreateOperation);

    let blockClock = 0;
    let charClock = 0;

    let lastBlock = null;
    documentLines.forEach((line) => {
      const { type, length, indent } = this.parseBlockType(line);

      const newBlock = new Block("", new BlockId(blockClock++, clientId));
      newBlock.next = null;
      newBlock.prev = lastBlock ? lastBlock.id : null;
      newBlock.type = type;
      newBlock.indent = indent;
      newBlock.animation = type === "h1" ? "rainbow" : type === "h2" ? "highlight" : "none";

      if (lastBlock) {
        lastBlock.next = newBlock.id;
      }
      lastBlock = newBlock;
      // 블록 추가 연산
      operations.push({
        type: "blockInsert",
        node: newBlock,
        pageId: newPage.id,
      } as RemoteBlockInsertOperation);

      operations.push({
        type: "blockUpdate",
        node: newBlock,
        pageId: newPage.id,
      } as RemoteBlockUpdateOperation);

      const slicedLine = [...line.slice(length + indent * 2)];
      let lastNode = null;

      let bold = false;
      let italic = false;
      let underline = false;
      let strikethrough = false;

      for (let i = 0; i < slicedLine.length; ++i) {
        const char = slicedLine[i];

        if (char === "*") {
          if (i < slicedLine.length - 1 && slicedLine[i + 1] === "*") {
            bold = !bold;
            i++;
            continue;
          } else {
            italic = !italic;
            continue;
          }
        } else if (char === "~") {
          if (i < slicedLine.length - 1 && slicedLine[i + 1] === "~") {
            strikethrough = !strikethrough;
            i++;
            continue;
          }
        } else if (char === "_") {
          if (i < slicedLine.length - 1 && slicedLine[i + 1] === "_") {
            underline = !underline;
            i++;
            continue;
          }
        }

        const charNode = new Char(char, new CharId(charClock++, clientId));
        charNode.next = null;
        charNode.prev = lastNode ? lastNode.id : null;

        // 이전 노드가 있는 경우, 해당 노드의 next를 현재 노드로 설정
        if (lastNode) {
          lastNode.next = charNode.id;
        }

        lastNode = charNode;

        const styles = [];
        if (bold) styles.push("bold");
        if (italic) styles.push("italic");
        if (underline) styles.push("underline");
        if (strikethrough) styles.push("strikethrough");

        operations.push({
          type: "charInsert",
          node: charNode,
          blockId: newBlock.id,
          pageId: newPage.id,
          style: styles,
          color: charNode.color ? charNode.color : "black",
          backgroundColor: charNode.backgroundColor ? charNode.backgroundColor : "transparent",
        } as RemoteCharInsertOperation);
      }
    });

    return operations;
  }

  // CRDT 연산들을 페이지에 적용하고 다른 클라이언트에 뿌리는 로직 (workspace.service)
  emitOperations(workspaceId: string, operations: Operation[]) {
    const pageOperation = operations[0];
    const crdtOperations = operations.slice(1);
    this.workspaceService.getServer().to(workspaceId).emit("create/page", pageOperation);

    crdtOperations.forEach((operation) => {
      this.workspaceService.storeOperation(workspaceId, operation as CRDTOperation);
    });

    this.workspaceService.getServer().to(workspaceId).emit("batch/operations", crdtOperations);
  }

  // 블록 타입을 판정하는 로직
  parseBlockType(line: String): { type: ElementType; length: number; indent: number } {
    const indent = line.match(/^[\s]*/)[0].length / 2 || 0;
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) return { type: "h1", length: 2, indent };
    if (trimmed.startsWith("## ")) return { type: "h2", length: 3, indent };
    if (trimmed.startsWith("### ")) return { type: "h3", length: 4, indent };
    if (trimmed.startsWith("- ")) return { type: "ul", length: 2, indent };
    if (/^\d+\. /.test(trimmed)) return { type: "ol", length: 3, indent };
    if (trimmed.startsWith("> ")) return { type: "blockquote", length: 2, indent };
    if (trimmed.startsWith("[] ")) return { type: "checkbox", length: 3, indent };
    if (trimmed.startsWith("[x] ")) return { type: "checkbox", length: 4, indent };
    if (trimmed === "---") return { type: "hr", length: 0, indent };
    return { type: "p", length: 0, indent };
  }
}
