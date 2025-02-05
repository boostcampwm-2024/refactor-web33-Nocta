import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { AiService } from "./ai.service";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { Response as ExpressResponse, Request as ExpressRequest } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("ai")
// @UseGuards(JwtAuthGuard)
@Controller("ai")
export class AiController {
  private readonly logger = new Logger();
  constructor(private readonly aiService: AiService) {}

  // 사용자의 AI 요청을 받는 POST 메서드
  @Post("chat")
  @ApiOperation({ summary: "Chat to AI" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        clientId: { type: "number" },
        workspaceId: { type: "string" },
        message: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "good" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async chat(
    @Body() body: { clientId: number; workspaceId: string; message: string },
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<void> {
    const message = await this.aiService.requestAI(body.message);
    const operations = await this.aiService.generateDocumentToCRDT(
      body.workspaceId,
      body.clientId,
      message,
    );
    this.aiService.emitOperations(body.workspaceId, operations);
    res.status(200).send();
  }
}
