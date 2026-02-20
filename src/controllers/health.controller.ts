import { Controller, Get } from "@nestjs/common";
import { ConfigurationService } from "../core/configuration/configuration.service.js";

@Controller()
export class HealthController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get("health")
  getHealth() {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("status")
  getStatus() {
    return {
      status: "running",
      agentProvider: this.configService.config.agent.provider,
      timestamp: new Date().toISOString(),
    };
  }
}
