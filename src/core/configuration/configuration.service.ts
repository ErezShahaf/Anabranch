import { Injectable } from "@nestjs/common";
import type { ApplicationConfiguration } from "../types.js";
import { loadConfiguration } from "./configuration.loader.js";

@Injectable()
export class ConfigurationService {
  readonly config: ApplicationConfiguration;

  constructor() {
    this.config = loadConfiguration();
  }
}
