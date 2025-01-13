import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class MetricInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const client = context.switchToWs().getClient();
    const event = context.getArgs()[0].event;

    return next.handle().pipe(
      tap(() => {
        const latency = Date.now() - start;
        // 서버 측 지연시간 로깅
        client.emit("operation:latency", {
          event,
          latency,
          timestamp: Date.now(),
        });
      }),
    );
  }
}
