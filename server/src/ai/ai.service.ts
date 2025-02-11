import { Injectable, Logger } from "@nestjs/common";
import {
  Operation,
  ElementType,
  RemoteBlockInsertOperation,
  RemotePageCreateOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
  CRDTOperation,
  RemoteBlockUpdateOperation,
} from "@noctaCrdt/types/Interfaces";
import { Block, Char } from "@noctaCrdt/Node";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { Page } from "@noctaCrdt/Page";
import { nanoid } from "nanoid";
import { BlockId, CharId } from "@noctaCrdt/NodeId";
import { HttpService } from "@nestjs/axios";
import { WorkSpaceService } from "../workspace/workspace.service";
import { firstValueFrom, lastValueFrom, map } from "rxjs";
import * as readline from "readline";

interface SSEEvent {
  id?: string;
  event?: string;
  data?: any;
}

interface PageCreator {
  currentPage: Page | null;
  currentBlock: Block | null;
  lastBlock: Block | null;
  lastChar: Char | null;
  blockClock: number;
  charClock: number;
  currentLine: string;

  specifiedBlockType: boolean;
  /*
  `    ### `
  공백을 받았을 때 전에 받은게 공백이 아니면 블록 타입 지정 로직 수행
  예외 : *|~|_
  specifiedBlocType = true;
  그 뒤에거는 스타일 문법 변환/바로 쏘기
  `    ### abcd asdfasdf`
  */

  // 스타일 상태
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

@Injectable()
export class AiService {
  constructor(
    private axiosHttpService: HttpService,
    private readonly workspaceService: WorkSpaceService,
  ) {}

  async requestAI(message: string, workspaceId: string, clientId: number): Promise<void> {
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
      maxTokens: 100,
      temperature: 0.5,
      repeatPenalty: 5.0,
      stopBefore: [],
      includeAiFilters: true,
      seed: 0,
    };

    try {
      // Axios가 응답을 스트림으로 반환하도록 설정합니다.
      const response = await this.axiosHttpService.axiosRef.post(
        process.env.CLOVASTUDIO_API_URL,
        payload,
        {
          headers: {
            "X-NCP-CLOVASTUDIO-REQUEST-ID": process.env.CLOVASTUDIO_REQUEST_ID,
            Authorization: `Bearer ${process.env.CLOVASTUDIO_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          responseType: "stream",
        },
      );

      // response.data가 스트림인지 확인
      if (typeof response.data.on !== "function") {
        console.error("response.data가 스트림이 아닙니다:", response.data);
        return;
      }

      // readline 인터페이스를 사용하여 스트림을 한 줄씩 읽습니다.
      const rl = readline.createInterface({
        input: response.data,
        crlfDelay: Infinity,
      });

      let eventBuffer: SSEEvent = {};
      let pageCreator: PageCreator = {
        currentPage: null,
        currentBlock: null,
        lastBlock: null,
        blockClock: 0,
        charClock: 0,
        currentLine: "",
        lastChar: null,
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        specifiedBlockType: false,
      };

      // 페이지 초기화
      pageCreator.currentPage = await this.createNewPage(clientId, "AI 응답", workspaceId);

      rl.on("line", (line: string) => {
        // 공백 라인이 나오면 이벤트 구분자로 판단하고, 지금까지 버퍼에 담긴 이벤트를 처리합니다.
        if (!line.trim()) {
          if (Object.keys(eventBuffer).length > 0) {
            this.handleSSEEvent(eventBuffer, workspaceId, clientId, pageCreator);
            eventBuffer = {};
          }
          return;
        }

        // 새로운 이벤트 시작: 이전 이벤트가 있으면 먼저 처리
        if (line.startsWith("id:")) {
          // 만약 이미 버퍼에 이벤트 내용이 있다면 flush 합니다.
          if (eventBuffer.id || eventBuffer.event || eventBuffer.data) {
            this.handleSSEEvent(eventBuffer, workspaceId, clientId, pageCreator);
            eventBuffer = {};
          }
          eventBuffer.id = line.slice(3).trim();
        } else if (line.startsWith("event:")) {
          eventBuffer.event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const dataText = line.slice(5).trim();
          try {
            eventBuffer.data = JSON.parse(dataText);
          } catch (error) {
            // JSON 파싱이 실패하면 그냥 문자열로 저장합니다.
            eventBuffer.data = dataText;
          }
        }
      });

      rl.on("close", () => {
        // 스트림 종료 시, 버퍼에 남은 이벤트가 있으면 처리합니다.
        if (Object.keys(eventBuffer).length > 0) {
          this.handleSSEEvent(eventBuffer, workspaceId, clientId, pageCreator);
        }
        console.log("SSE 스트림이 종료되었습니다.");
      });

      // 에러 처리도 추가할 수 있습니다.
      response.data.on("error", (err: Error) => {
        console.error("스트림 에러 발생:", err);
      });
    } catch (error) {
      console.error("Streaming error:", error);
    }
  }

  async handleSSEEvent(
    event: SSEEvent,
    workspaceId: string,
    clientId: number,
    pageCreator: PageCreator,
  ): Promise<void> {
    console.log("받은 이벤트:", event);
    if (event.event !== "token") return;
    const token = event.data.message?.content || "";
    await this.processToken(token, workspaceId, clientId, pageCreator);
  }

  private async processToken(
    token: string,
    workspaceId: string,
    clientId: number,
    pageCreator: PageCreator,
  ) {
    for (let i = 0; i < token.length; i++) {
      /*
      `    ### `
      공백을 받았을 때 전에 받은게 공백이 아니면 블록 타입 지정 로직 수행
      예외 : *|~|_
      specifiedBlocType = true;
      그 뒤에거는 스타일 문법 변환/바로 쏘기
      `    ### abcd asdfasdf`
      */
      const char = token[i];

      if (!pageCreator.currentBlock) {
        pageCreator.currentBlock = await this.createNewBlock(workspaceId, clientId, pageCreator);
        pageCreator.specifiedBlockType = false;
      }

      if (!pageCreator.specifiedBlockType) {
        pageCreator.currentLine += char;
        if (char === " " && pageCreator.currentLine.at(-1) !== " ") {
          await this.updateCurrentBlock(workspaceId, clientId, pageCreator);
          if (pageCreator.currentBlock.type === "p") {
            // currentLine에서 indent만큼 공백 지우고
            // 남은 것들에 대해서
            // 스타일 문법이면 변환해서 스타일 적용
            // 아니면 insertChar
          }
          pageCreator.specifiedBlockType = true;
        }
        continue;
      }

      if (char === "\n") {
        // 새 블록 준비
        pageCreator.currentLine = "";
        pageCreator.lastChar = null;
        pageCreator.currentBlock = null;
        pageCreator.charClock = 0;
        pageCreator.bold = false;
        pageCreator.italic = false;
        pageCreator.underline = false;
        pageCreator.strikethrough = false;
        pageCreator.specifiedBlockType = false;
      }

      // 스타일 문법이면 변환해서 스타일 적용
      // 아니면 insertChar

      if (char === "*") {
        if (pageCreator.currentLine === "*") {
          pageCreator.bold = !pageCreator.bold;
          i += 1;
          continue;
        } else {
          pageCreator.italic = pageCreator.italic;
          continue;
        }
      } else if (char === "~") {
        if (pageCreator.currentLine === "~") {
          pageCreator.strikethrough = !pageCreator.strikethrough;
          i += 1;
          continue;
        } else {
          if (pageCreator.currentLine !== "") {
            this.createNewChar(pageCreator.currentLine, workspaceId, clientId, pageCreator);
            pageCreator.currentLine = "";
          }
          pageCreator.currentLine = char;
        }
      } else if (char === "_") {
        if (pageCreator.currentLine === "_") {
          pageCreator.underline = pageCreator.underline;
          i += 1;
          continue;
        } else {
          if (pageCreator.currentLine !== "") {
            this.createNewChar(pageCreator.currentLine, workspaceId, clientId, pageCreator);
            pageCreator.currentLine = "";
          }
          pageCreator.currentLine = char;
        }
      }

      /*
      if (char === "\n" && this.currentBlock) {
        // 현재 블록 마무리
        await this.updateCurrentBlock(workspaceId, clientId);

        // 새 블록 준비
        this.currentLine = "";
        this.lastChar = null;
        this.currentBlock = null;
        this.charClock = 0;
        this.blockClock = 0;

        this.bold = false;
        this.italic = false;
        this.underline = false;
        this.strikethrough = false;
        continue;
      }

      // 현재 라인에 문자 추가 (마크다운 문법 파싱용)
      this.currentLine += char;

      if (char === "*") {
        if (i < token.length - 1 && token[i + 1] === "*") {
          this.bold = !this.bold;
          i += 1;
          continue;
        } else {
          this.italic = !this.italic;
          continue;
        }
      } else if (char === "~") {
        if (i < token.length - 1 && token[i + 1] === "~") {
          this.strikethrough = !this.strikethrough;
          i += 1;
          continue;
        }
      } else if (char === "_") {
        if (i < token.length - 1 && token[i + 1] === "_") {
          this.underline = !this.underline;
          i += 1;
          continue;
        }
      }

      // 필요한 경우 새 블록 생성
      if (!this.currentBlock) {
        await this.createNewBlock(workspaceId, clientId);
      }

      // 실제 컨텐츠 추가
      await this.createNewChar(char, workspaceId, clientId);
      */
    }
  }

  private async createNewPage(clientId: number, title: string, workspaceId: string): Promise<Page> {
    const newEditorCRDT = new EditorCRDT(clientId);
    const page = new Page(nanoid(), title, "Docs", newEditorCRDT);

    const pageOperation = {
      type: "pageCreate",
      workspaceId,
      clientId,
      page: page.serialize(),
    } as RemotePageCreateOperation;

    const workspace = await this.workspaceService.getWorkspace(workspaceId);
    workspace.pageList.push(pageOperation.page);
    this.workspaceService.updateWorkspace(workspace);
    await this.emitOperation(workspaceId, pageOperation);
    return page;
  }

  private async createNewBlock(
    workspaceId: string,
    clientId: number,
    pageCreator: PageCreator,
  ): Promise<Block> {
    const newBlock = new Block("", new BlockId(pageCreator.blockClock++, clientId));
    newBlock.next = null;
    newBlock.prev = pageCreator.lastBlock ? pageCreator.lastBlock.id : null;

    if (pageCreator.lastBlock) {
      pageCreator.lastBlock.next = newBlock.id;
    }

    pageCreator.lastBlock = newBlock;
    pageCreator.currentBlock = newBlock;

    // 블록 삽입 연산 전송
    const blockInsertOperation: RemoteBlockInsertOperation = {
      type: "blockInsert",
      node: newBlock,
      pageId: pageCreator.currentPage.id,
    };

    await this.emitOperation(workspaceId, blockInsertOperation);
    return newBlock;
  }

  private async createNewChar(
    char: string,
    workspaceId: string,
    clientId: number,
    pageCreator: PageCreator,
  ) {
    const charNode = new Char(char, new CharId(pageCreator.charClock++, clientId));
    charNode.next = null;
    charNode.prev = pageCreator.lastChar ? pageCreator.lastChar.id : null;

    if (pageCreator.lastChar) {
      pageCreator.lastChar.next = charNode.id;
    }

    pageCreator.lastChar = charNode;

    // 현재 활성화된 스타일 수집
    const styles = [];
    if (pageCreator.bold) styles.push("bold");
    if (pageCreator.italic) styles.push("italic");
    if (pageCreator.underline) styles.push("underline");
    if (pageCreator.strikethrough) styles.push("strikethrough");

    // 문자 삽입 연산 전송
    const charOperation: RemoteCharInsertOperation = {
      type: "charInsert",
      node: charNode,
      blockId: pageCreator.currentBlock.id,
      pageId: pageCreator.currentPage.id,
      style: styles,
      color: "black",
      backgroundColor: "transparent",
    };

    await this.emitOperation(workspaceId, charOperation);
  }

  private async updateCurrentBlock(
    workspaceId: string,
    clientId: number,
    pageCreator: PageCreator,
  ) {
    if (!pageCreator.currentBlock || !pageCreator.currentLine.trim()) return;

    // 블록 타입 판정
    const { type, length, indent } = this.parseBlockType(pageCreator.currentLine);

    // 블록 속성 업데이트
    pageCreator.currentBlock.type = type;
    pageCreator.currentBlock.indent = indent;
    pageCreator.currentBlock.animation = this.determineAnimation(type);

    // 블록 업데이트 연산 전송
    const blockUpdateOperation: RemoteBlockUpdateOperation = {
      type: "blockUpdate",
      node: pageCreator.currentBlock,
      pageId: pageCreator.currentPage.id,
    };

    await this.emitOperation(workspaceId, blockUpdateOperation);
  }

  private determineAnimation(type: ElementType): "rainbow" | "highlight" | "none" {
    switch (type) {
      case "h1":
        return "rainbow";
      case "h2":
        return "highlight";
      default:
        return "none";
    }
  }

  private async emitOperation(workspaceId: string, operation: Operation) {
    if (operation.type !== "pageCreate") {
      this.workspaceService.storeOperation(workspaceId, operation as CRDTOperation);
    }
    this.workspaceService
      .getServer()
      .to(workspaceId)
      .emit(this.getEventName(operation.type), operation);
  }

  private getEventName(operationType: string): string {
    switch (operationType) {
      case "pageCreate":
        return "create/page";
      case "blockInsert":
        return "insert/block";
      case "blockUpdate":
        return "update/block";
      case "charInsert":
        return "insert/char";
      default:
        return "batch/operations";
    }
  }

  parseBlockType(line: string): { type: ElementType; length: number; indent: number } {
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
