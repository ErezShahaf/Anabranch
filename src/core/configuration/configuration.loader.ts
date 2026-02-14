import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load as parseYaml } from "js-yaml";
import Ajv from "ajv";
import type { ApplicationConfiguration } from "./types.js";

const ENVIRONMENT_VARIABLE_PATTERN = /\$\{(\w+)\}/g;

function substituteInString(value: string): string {
  return value.replace(ENVIRONMENT_VARIABLE_PATTERN, (_match, variableName: string) => {
    const envValue = process.env[variableName];
    if (envValue === undefined) {
      return "temporary-value";
    }
    return envValue;
  });
}

function substituteEnvironmentVariablesInObject(obj: unknown): unknown {
  if (typeof obj === "string") {
    return substituteInString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(substituteEnvironmentVariablesInObject);
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvironmentVariablesInObject(value);
    }
    return result;
  }
  return obj;
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

export function loadConfiguration(): ApplicationConfiguration {
  const filePath = findConfigurationFilePath();
  const rawContent = readFileSync(filePath, "utf-8");
  const parsed = parseYaml(rawContent) as unknown;
  const withEnvironmentVariables = substituteEnvironmentVariablesInObject(parsed);

  return validateWithSchema(withEnvironmentVariables);
}
