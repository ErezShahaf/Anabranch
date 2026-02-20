import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { ConfigurationModule } from "../configuration/configuration.module.js";
import { ConfigurationService } from "../configuration/configuration.service.js";

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (configService: ConfigurationService) => {
        const config = configService.config.logging;
        return {
          pinoHttp: {
            level: config.level,
            transport: config.format === "pretty"
                ? { target: "pino-pretty", options: { colorize: true } }
                : undefined,
          },
          renameContext: "component",
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}