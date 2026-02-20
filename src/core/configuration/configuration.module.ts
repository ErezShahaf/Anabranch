import { Global, Module } from "@nestjs/common";
import { ConfigurationService } from "./configuration.service.js";
import { CONFIGURATION_SERVICE } from "./tokens.js";

@Global()
@Module({
  providers: [
    ConfigurationService,
    { provide: CONFIGURATION_SERVICE, useExisting: ConfigurationService },
  ],
  exports: [ConfigurationService, CONFIGURATION_SERVICE],
})
export class ConfigurationModule {}
