import { Controller, Post, Body, Response, Logger } from "@nestjs/common";
import { AiService } from "./ai.service";
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from "@nestjs/swagger";
import { Response as ExpressResponse } from "express";

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
        socketId: { type: "string" },
        message: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "good" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async chat(
    @Body() body: { clientId: number; workspaceId: string; socketId: string; message: string },
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<void> {
    await this.aiService.requestAI(body.message, body.workspaceId, body.clientId, body.socketId);
    res.status(200).send();
  }
}
