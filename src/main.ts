import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, PinoLogger } from "nestjs-pino";
import { AppModule } from "./app.module.js";
import { ConfigurationService } from "./core/configuration/configuration.service.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigurationService);
  const logger = await app.resolve(PinoLogger);

  logger.info("starting anabranch");

  const { port, host } = configService.config.server;
  await app.listen(port, host);

  logger.info({ port, host }, "anabranch is ready");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "received shutdown signal, closing server");

    const forceExitTimeout = setTimeout(() => {
      logger.error("graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000);

    try {
      await app.close();
      clearTimeout(forceExitTimeout);
      logger.info("server closed");
      process.exit(0);
    } catch {
      clearTimeout(forceExitTimeout);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Fatal startup error: ${message}\n`);
  process.exit(1);
});
