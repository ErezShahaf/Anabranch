import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { ConfigurationService } from "../configuration/configuration.service.js";

export const LoggerModule = PinoLoggerModule.forRootAsync({
  inject: [ConfigurationService],
  useFactory: (configService: ConfigurationService) => {
    const config = configService.config.logging;
    return {
      pinoHttp: {
        level: config.level,
        transport:
          config.format === "pretty"
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
      },
      renameContext: "component",
    };
  },
});
