import { RunMeshError } from "./errors.js";

export class EnvironmentError extends RunMeshError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "EnvironmentError";
  }
}

export interface EnvironmentConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  organization?: string;
}

export interface EnvironmentValidationOptions {
  requireApiKey?: boolean;
  requireModel?: boolean;
  validateModelFormat?: boolean;
}

/**
 * Validates and loads OpenAI configuration from environment variables
 */
export function validateEnvironment(options: EnvironmentValidationOptions = {}): EnvironmentConfig {
  const { requireApiKey = true, requireModel = false, validateModelFormat = true } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  const baseUrl = process.env.OPENAI_BASE_URL;
  const organization = process.env.OPENAI_ORGANIZATION;

  // Validate API key
  if (requireApiKey && !apiKey) {
    throw new EnvironmentError(
      "OPENAI_API_KEY environment variable is required but not set. " +
        "Please set it to your OpenAI API key."
    );
  }

  if (apiKey && apiKey.length < 10) {
    throw new EnvironmentError(
      "OPENAI_API_KEY appears to be invalid (too short). " + "Please check your API key."
    );
  }

  // Validate model
  if (requireModel && !model) {
    throw new EnvironmentError(
      "OPENAI_MODEL environment variable is required but not set. " +
        'Please set it to a valid model name (e.g., "gpt-4", "gpt-4-turbo").'
    );
  }

  if (model && validateModelFormat) {
    // Check for common invalid model names
    const invalidPatterns = [
      /^gpt-5/i, // gpt-5 doesn't exist yet
      /^gpt-4\.5/i // Invalid format
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(model)) {
        console.warn(
          `Warning: OPENAI_MODEL="${model}" may not be a valid OpenAI model. ` +
            `Common models include: gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo`
        );
        break;
      }
    }
  }

  // Validate base URL format if provided
  if (baseUrl) {
    try {
      new URL(baseUrl);
    } catch {
      throw new EnvironmentError(
        `OPENAI_BASE_URL="${baseUrl}" is not a valid URL. ` +
          'Please provide a valid URL (e.g., "https://api.openai.com/v1").'
      );
    }
  }

  return {
    apiKey: apiKey || "",
    model,
    baseUrl,
    organization
  };
}

/**
 * Loads environment configuration with sensible defaults
 */
export function loadEnvironment(): EnvironmentConfig {
  return validateEnvironment({ requireApiKey: false, validateModelFormat: true });
}

/**
 * Checks if the environment is properly configured for OpenAI API calls
 */
export function isEnvironmentConfigured(): boolean {
  try {
    validateEnvironment({ requireApiKey: true });
    return true;
  } catch {
    return false;
  }
}
