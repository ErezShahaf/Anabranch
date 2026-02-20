import "dotenv/config";
import "reflect-metadata";
import { Logger as NestLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module.js";
import { ConfigurationService } from "./core/configuration/configuration.service.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  const logger = new NestLogger("Bootstrap");
  logger.log("starting anabranch");

  const configService = app.get(ConfigurationService);
  const { port, host } = configService.config.server;
  await app.listen(port, host);

  logger.log(`anabranch is ready on ${host}:${port}`);

  const shutdown = async (signal: string) => {
    logger.log(`received shutdown signal: ${signal}`);

    const forceExitTimeout = setTimeout(() => {
      logger.error("graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000);

    try {
      await app.close();
      clearTimeout(forceExitTimeout);
      logger.log("server closed");
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
  const stack = error instanceof Error ? error.stack : "";
  process.stderr.write(`Fatal startup error: ${message}\n${stack ?? ""}\n`);
  process.exit(1);
});
