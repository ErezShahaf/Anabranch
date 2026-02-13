import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load as parseYaml } from "js-yaml";
import Ajv from "ajv";
import type { ApplicationConfiguration } from "../types.js";

const ENVIRONMENT_VARIABLE_PATTERN = /\$\{(\w+)\}/g;

function substituteEnvironmentVariables(text: string): string {
  return text.replace(ENVIRONMENT_VARIABLE_PATTERN, (_match, variableName: string) => {
    const value = process.env[variableName];
    if (value === undefined) {
      throw new Error(
        `Environment variable "${variableName}" is referenced in configuration but is not set.`
      );
    }
    return value;
  });
}

function findConfigurationFilePath(): string {
  const fromEnvironment = process.env["ANABRANCH_CONFIG_PATH"];
  if (fromEnvironment) {
    return resolve(fromEnvironment);
  }

  const localPath = resolve("config", "default.yaml");
  if (existsSync(localPath)) {
    return localPath;
  }

  const containerPath = "/config/default.yaml";
  if (existsSync(containerPath)) {
    return containerPath;
  }

  throw new Error(
    "No configuration file found. Set ANABRANCH_CONFIG_PATH or place a default.yaml in ./config/"
  );
}

function loadConfigurationSchema(): Record<string, unknown> {
  const currentDirectory = resolve(fileURLToPath(import.meta.url), "..");
  const schemaPath = resolve(currentDirectory, "..", "..", "..", "config", "config.schema.json");
  const schemaContent = readFileSync(schemaPath, "utf-8");
  return JSON.parse(schemaContent) as Record<string, unknown>;
}

function validateWithSchema(data: unknown): ApplicationConfiguration {
  const schema = loadConfigurationSchema();
  const ajv = new Ajv.default({ allErrors: true });
  const validate = ajv.compile(schema);

  if (!validate(data)) {
    const messages = (validate.errors ?? []).map(
      (error: { instancePath?: string; message?: string }) =>
        `  ${error.instancePath || "/"}: ${error.message ?? "unknown error"}`
    );
    throw new Error(
      `Configuration validation failed:\n${messages.join("\n")}`
    );
  }

  return data as ApplicationConfiguration;
}

function validateAgentApiKey(configuration: ApplicationConfiguration): void {
  const provider = configuration.agent.provider;

  const requiredKeyByProvider: Record<string, string> = {
    "claude-code": "ANTHROPIC_API_KEY",
    cursor: "CURSOR_API_KEY",
  };

  const requiredKey = requiredKeyByProvider[provider];
  if (!requiredKey) {
    throw new Error(`Unknown agent provider: "${provider}"`);
  }

  if (!process.env[requiredKey]) {
    throw new Error(
      `Agent provider is set to "${provider}" but the required environment variable ${requiredKey} is not set.`
    );
  }
}

export function loadConfiguration(): ApplicationConfiguration {
  const filePath = findConfigurationFilePath();
  const rawContent = readFileSync(filePath, "utf-8");
  const withEnvironmentVariables = substituteEnvironmentVariables(rawContent);
  const parsed = parseYaml(withEnvironmentVariables) as unknown;
  const validated = validateWithSchema(parsed);

  validateAgentApiKey(validated);

  return validated;
}
