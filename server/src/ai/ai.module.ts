import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";
import { AuthModule } from "../auth/auth.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "../auth/strategies/jwt.strategy";
import { JwtRefreshTokenStrategy } from "../auth/strategies/jwt-refresh-token.strategy";
import { JwtRefreshTokenAuthGuard } from "../auth/guards/jwt-refresh-token-auth.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Module({
  imports: [
    AuthModule,
    WorkspaceModule,
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  exports: [AiService, JwtModule],
  providers: [
    AiService,
    JwtStrategy,
    JwtRefreshTokenStrategy,
    JwtAuthGuard,
    JwtRefreshTokenAuthGuard,
  ],
  controllers: [AiController],
})
export class AiModule {}
