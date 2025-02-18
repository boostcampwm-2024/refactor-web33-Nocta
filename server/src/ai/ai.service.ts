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
  RemoteCharUpdateOperation,
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
  `   ### `
  공백을 받았을 때 전에 받은게 공백이 아니면 블록 타입 지정 로직 수행
  예외 : *|~|_
  specifiedBlocType = true;
  그 뒤에거는 스타일 문법 변환/바로 쏘기
  `    ### abcd asdfasdf`
  */

  // 스타일 시작 위치
  bold: CharId | null;
  italic: CharId | null;
  underline: CharId | null;
  strikethrough: CharId | null;
}

@Injectable()
export class AiService {
  private tokenQueue: string[] = [];
  private processingQueue = false;

  constructor(
    private axiosHttpService: HttpService,
    private readonly workspaceService: WorkSpaceService,
  ) {}

  async requestAI(message: string, workspaceId: string, clientId: number): Promise<void> {
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: process.env.AI_PROMPT,
        },
        {
          role: "user",
          content: message,
        },
      ],

      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.8,
      stream: true, // 스트리밍 응답 요청
    };

    try {
      const pageCreator: PageCreator = {
        currentPage: null,
        currentBlock: null,
        lastBlock: null,
        blockClock: 0,
        charClock: 0,
        currentLine: "",
        lastChar: null,
        bold: null,
        italic: null,
        underline: null,
        strikethrough: null,
        specifiedBlockType: false,
      };

      // 페이지 초기화
      pageCreator.currentPage = await this.createNewPage(clientId, "AI 응답", workspaceId);

      // Axios가 응답을 스트림으로 반환하도록 설정합니다.
      const response = await this.axiosHttpService.axiosRef.post(process.env.AI_API_URL, payload, {
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      });

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

      rl.on("line", (line: string) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // OpenAI 스트림은 "data:" 접두사가 붙습니다.
        if (trimmedLine.startsWith("data:")) {
          const dataText = trimmedLine.slice(5).trim();

          // 스트림 종료 시 "[DONE]" 메시지가 옵니다.
          if (dataText === "[DONE]") {
            rl.close();
            return;
          }

          try {
            const parsedData = JSON.parse(dataText);
            // OpenAI의 응답은 choices 배열 내에 delta가 존재합니다.
            // 예: { choices: [ { delta: { content: "..." } } ] }
            this.handleSSEEvent(parsedData, workspaceId, clientId, pageCreator);
          } catch (error) {
            console.error("JSON 파싱 에러:", error);
          }
        }
      });

      rl.on("close", () => {
        this.processToken("\n", workspaceId, clientId, pageCreator);
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
    event: any,
    workspaceId: string,
    clientId: number,
    pageCreator: PageCreator,
  ): Promise<void> {
    // OpenAI의 응답은 choices 배열 내에 delta 객체에 token 내용이 있습니다.
    if (!event.choices || !Array.isArray(event.choices)) return;

    const [choice, _] = event.choices;
    if (!choice) return;

    const token = choice.delta?.content || "";
    if (token) {
      await this.enqueueToken(token, workspaceId, clientId, pageCreator);
    }
  }

  async enqueueToken(
    token: string,
    workspaceId: string,
    clientId: number,
    pageCreator: PageCreator,
  ): Promise<void> {
    // 토큰을 큐에 추가
    this.tokenQueue.push(token);

    // 만약 현재 큐 처리가 진행 중이지 않다면 시작합니다.
    if (!this.processingQueue) {
      this.processingQueue = true;
      while (this.tokenQueue.length > 0) {
        // 큐에서 토큰을 하나씩 꺼내어 처리합니다.
        const tokenToProcess = this.tokenQueue.shift();
        if (tokenToProcess) {
          await this.processToken(tokenToProcess, workspaceId, clientId, pageCreator);
        }
      }
      this.processingQueue = false;
    }
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

      if (char === "\n") {
        // 임시 저장된 토큰 반영
        const line = pageCreator.currentLine;
        pageCreator.currentLine = "";
        pageCreator.specifiedBlockType = true;
        await this.processToken(line, workspaceId, clientId, pageCreator);

        // 새 블록 준비
        pageCreator.lastChar = null;
        pageCreator.currentBlock = null;
        pageCreator.charClock = 0;
        pageCreator.bold = null;
        pageCreator.italic = null;
        pageCreator.underline = null;
        pageCreator.strikethrough = null;
        pageCreator.specifiedBlockType = false;
        continue;
      }

      if (!pageCreator.specifiedBlockType) {
        pageCreator.currentLine += char;
        // "  -"
        // " "
        // "   "
        if (
          char === " " &&
          pageCreator.currentLine.length >= 2 &&
          pageCreator.currentLine.at(-2) !== " "
        ) {
          console.log(`currentLine : '${pageCreator.currentLine}'`);
          await this.updateCurrentBlock(workspaceId, pageCreator);
          pageCreator.specifiedBlockType = true;
          if (pageCreator.currentBlock.type === "p") {
            // currentLine에서 indent만큼 공백 지우고
            // 남은 것들에 대해서
            // 스타일 문법이면 변환해서 스타일 적용
            // 아니면 insertChar
            const line = pageCreator.currentLine.slice(pageCreator.currentBlock.indent * 2);
            pageCreator.currentLine = "";
            await this.processToken(line, workspaceId, clientId, pageCreator);
          }
          pageCreator.currentLine = "";
        }
        continue;
      }

      // 스타일 문법이면 변환해서 스타일 적용
      // 아니면 insertChar
      // asdf**asd**fasd
      // aa***asd***aa
      // b 0 i 0  asdf
      // b 0 i 1  asdf*
      // b 1 i 0  asdf**
      // b 1 i 1  asdf***asdf
      // b 1 i 0  asdf***asdf* -> asdf**asdf
      // b 1 i 1  asdf**asdf*
      //          asdf**asdf**

      if (char === "*") {
        if (pageCreator.lastChar && pageCreator.lastChar.value === "*") {
          if (pageCreator.italic) {
            pageCreator.italic = null;
          } else {
            pageCreator.italic = (
              await this.createNewChar(char, workspaceId, clientId, pageCreator)
            ).id;
            continue;
          }
          if (pageCreator.bold) {
            let curNode = pageCreator.lastChar;
            this.deleteCurrentChar(curNode.id, workspaceId, pageCreator);
            curNode = pageCreator.currentBlock.crdt.LinkedList.getNode(curNode.prev);
            while (!curNode.id.equals(pageCreator.bold)) {
              this.updateCurrentChar("bold", curNode.id, workspaceId, pageCreator);
              curNode = pageCreator.currentBlock.crdt.LinkedList.getNode(curNode.prev);
            }
            this.deleteCurrentChar(curNode.id, workspaceId, pageCreator);
            this.deleteCurrentChar(curNode.prev, workspaceId, pageCreator);

            pageCreator.bold = null;
          } else {
            pageCreator.bold = (
              await this.createNewChar(char, workspaceId, clientId, pageCreator)
            ).id;
          }
          continue;
        } else {
          if (pageCreator.italic) {
            let curNode = pageCreator.lastChar;
            while (!curNode.id.equals(pageCreator.italic)) {
              this.updateCurrentChar("italic", curNode.id, workspaceId, pageCreator);
              curNode = pageCreator.currentBlock.crdt.LinkedList.getNode(curNode.prev);
            }
            this.deleteCurrentChar(curNode.id, workspaceId, pageCreator);

            pageCreator.italic = null;
          } else {
            pageCreator.italic = (
              await this.createNewChar(char, workspaceId, clientId, pageCreator)
            ).id;
          }
          continue;
        }
      }
      if (char === "~") {
        if (pageCreator.lastChar && pageCreator.lastChar.value === "~") {
          if (pageCreator.strikethrough) {
            // 취소선 문법이 들어옴
            // pageCreator.strikethrough = ~~iii~~
            // lastchar 삭제
            // strikethrough가 나올 때까지 뒤로 가면서 node 업데이트
            // strikethrough 만나면 이거 지우고
            // strikethrough 이전 노드까지 지우고
            let curNode = pageCreator.lastChar;
            this.deleteCurrentChar(curNode.id, workspaceId, pageCreator);
            curNode = pageCreator.currentBlock.crdt.LinkedList.getNode(curNode.prev);
            while (!curNode.id.equals(pageCreator.strikethrough)) {
              this.updateCurrentChar("strikethrough", curNode.id, workspaceId, pageCreator);
              curNode = pageCreator.currentBlock.crdt.LinkedList.getNode(curNode.prev);
            }
            this.deleteCurrentChar(curNode.id, workspaceId, pageCreator);
            this.deleteCurrentChar(curNode.prev, workspaceId, pageCreator);

            pageCreator.strikethrough = null;
          } else {
            pageCreator.strikethrough = (
              await this.createNewChar(char, workspaceId, clientId, pageCreator)
            ).id;
          }
          continue;
        }
      }
      if (char === "_") {
        if (pageCreator.lastChar && pageCreator.lastChar.value === "_") {
          // 밑줄 문법
          if (pageCreator.underline) {
            let curNode = pageCreator.lastChar;
            this.deleteCurrentChar(curNode.id, workspaceId, pageCreator);
            curNode = pageCreator.currentBlock.crdt.LinkedList.getNode(curNode.prev);
            while (!curNode.id.equals(pageCreator.underline)) {
              this.updateCurrentChar("underline", curNode.id, workspaceId, pageCreator);
              curNode = pageCreator.currentBlock.crdt.LinkedList.getNode(curNode.prev);
            }
            this.deleteCurrentChar(curNode.id, workspaceId, pageCreator);
            this.deleteCurrentChar(curNode.prev, workspaceId, pageCreator);

            pageCreator.underline = null;
          } else {
            pageCreator.underline = (
              await this.createNewChar(char, workspaceId, clientId, pageCreator)
            ).id;
          }
          continue;
        }
      }

      await this.createNewChar(char, workspaceId, clientId, pageCreator);
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
    const newBlock = new Block("", new BlockId(pageCreator.blockClock, clientId));
    pageCreator.blockClock += 1;
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
  ): Promise<Char> {
    const charNode = new Char(char, new CharId(pageCreator.charClock, clientId));
    pageCreator.charClock += 1;
    charNode.next = null;
    charNode.prev = pageCreator.lastChar ? pageCreator.lastChar.id : null;

    if (pageCreator.lastChar) {
      pageCreator.lastChar.next = charNode.id;
    }

    pageCreator.lastChar = charNode;

    // 문자 삽입 연산 전송
    const charOperation: RemoteCharInsertOperation = {
      type: "charInsert",
      node: charNode,
      blockId: pageCreator.currentBlock.id,
      pageId: pageCreator.currentPage.id,
      style: [],
      color: "black",
      backgroundColor: "transparent",
    };

    pageCreator.currentBlock.crdt.remoteInsert(charOperation);

    await this.emitOperation(workspaceId, charOperation);
    return charNode;
  }

  private async updateCurrentChar(
    type: "bold" | "italic" | "underline" | "strikethrough",
    charId: CharId,
    workspaceId: string,
    pageCreator: PageCreator,
  ) {
    const charNode = pageCreator.currentBlock.crdt.LinkedList.getNode(charId);
    charNode.style.push(type);
    const charOperation: RemoteCharUpdateOperation = {
      type: "charUpdate",
      node: charNode,
      blockId: pageCreator.currentBlock.id,
      pageId: pageCreator.currentPage.id,
    };

    pageCreator.currentBlock.crdt.remoteUpdate(charOperation);
    await this.emitOperation(workspaceId, charOperation);
  }

  private async deleteCurrentChar(charId: CharId, workspaceId: string, pageCreator: PageCreator) {
    const charOperation: RemoteCharDeleteOperation = {
      type: "charDelete",
      targetId: charId,
      clock: 0,
      blockId: pageCreator.currentBlock.id,
      pageId: pageCreator.currentPage.id,
    };

    pageCreator.currentBlock.crdt.remoteDelete(charOperation);
    await this.emitOperation(workspaceId, charOperation);
  }

  private async updateCurrentBlock(workspaceId: string, pageCreator: PageCreator) {
    if (!pageCreator.currentBlock) return;

    // 블록 타입 판정
    const { type, indent } = this.parseBlockType(pageCreator.currentLine);

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
      case "charDelete":
        return "delete/char";
      case "charUpdate":
        return "update/char";
      default:
        return "batch/operations";
    }
  }

  parseBlockType(line: string): { type: ElementType; length: number; indent: number } {
    const indent = Math.floor(line.match(/^[\s]*/)[0].length / 2) || 0;
    const trimmed = line.trim();
    console.log(line, " : ", indent);
    if (trimmed.startsWith("###")) return { type: "h3", length: 4, indent };
    if (trimmed.startsWith("##")) return { type: "h2", length: 3, indent };
    if (trimmed.startsWith("#")) return { type: "h1", length: 2, indent };
    if (trimmed.startsWith("-")) return { type: "ul", length: 2, indent };
    if (/^\d+\./.test(trimmed)) return { type: "ol", length: 3, indent };
    if (trimmed.startsWith(">")) return { type: "blockquote", length: 2, indent };
    if (trimmed.startsWith("[]")) return { type: "checkbox", length: 3, indent };
    if (trimmed.startsWith("[x]")) return { type: "checkbox", length: 4, indent };
    if (trimmed === "---") return { type: "hr", length: 0, indent };
    return { type: "p", length: 0, indent };
  }
}
