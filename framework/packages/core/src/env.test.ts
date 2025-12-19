import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateEnvironment,
  loadEnvironment,
  isEnvironmentConfigured,
  EnvironmentError
} from "./env.js";

describe("env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_ORGANIZATION;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe("validateEnvironment", () => {
    it("should throw if API key is required but not set", () => {
      expect(() => {
        validateEnvironment({ requireApiKey: true });
      }).toThrow(EnvironmentError);
    });

    it("should not throw if API key is not required", () => {
      expect(() => {
        validateEnvironment({ requireApiKey: false });
      }).not.toThrow();
    });

    it("should throw if API key is too short", () => {
      process.env.OPENAI_API_KEY = "short";

      expect(() => {
        validateEnvironment({ requireApiKey: true });
      }).toThrow(EnvironmentError);
    });

    it("should accept valid API key", () => {
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef";

      const config = validateEnvironment({ requireApiKey: true });

      expect(config.apiKey).toBe("sk-1234567890abcdef");
    });

    it("should throw if model is required but not set", () => {
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef";

      expect(() => {
        validateEnvironment({ requireApiKey: true, requireModel: true });
      }).toThrow(EnvironmentError);
    });

    it("should accept valid model", () => {
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef";
      process.env.OPENAI_MODEL = "gpt-4";

      const config = validateEnvironment({ requireApiKey: true, requireModel: true });

      expect(config.model).toBe("gpt-4");
    });

    it("should warn about potentially invalid model names", () => {
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef";
      process.env.OPENAI_MODEL = "gpt-5.2";

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      validateEnvironment({ requireApiKey: true });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('OPENAI_MODEL="gpt-5.2" may not be a valid OpenAI model')
      );
    });

    it("should validate base URL format", () => {
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef";
      process.env.OPENAI_BASE_URL = "not-a-url";

      expect(() => {
        validateEnvironment({ requireApiKey: true });
      }).toThrow(EnvironmentError);
    });

    it("should accept valid base URL", () => {
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef";
      process.env.OPENAI_BASE_URL = "https://api.openai.com/v1";

      const config = validateEnvironment({ requireApiKey: true });

      expect(config.baseUrl).toBe("https://api.openai.com/v1");
    });

    it("should include organization if set", () => {
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef";
      process.env.OPENAI_ORGANIZATION = "org-123";

      const config = validateEnvironment({ requireApiKey: true });

      expect(config.organization).toBe("org-123");
    });

    it("should return all config values", () => {
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef";
      process.env.OPENAI_MODEL = "gpt-4";
      process.env.OPENAI_BASE_URL = "https://api.openai.com/v1";
      process.env.OPENAI_ORGANIZATION = "org-123";

      const config = validateEnvironment({ requireApiKey: true });

      expect(config).toEqual({
        apiKey: "sk-1234567890abcdef",
        model: "gpt-4",
        baseUrl: "https://api.openai.com/v1",
        organization: "org-123"
      });
    });
  });

  describe("loadEnvironment", () => {
    it("should load environment without throwing", () => {
      expect(() => {
        loadEnvironment();
      }).not.toThrow();
    });

    it("should return config even without API key", () => {
      const config = loadEnvironment();

      expect(config).toHaveProperty("apiKey");
      expect(config.apiKey).toBe("");
    });

    it("should still validate model format", () => {
      process.env.OPENAI_MODEL = "gpt-5.0";

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      loadEnvironment();

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("isEnvironmentConfigured", () => {
    it("should return false if API key not set", () => {
      expect(isEnvironmentConfigured()).toBe(false);
    });

    it("should return true if API key is valid", () => {
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef";

      expect(isEnvironmentConfigured()).toBe(true);
    });

    it("should return false if API key is invalid", () => {
      process.env.OPENAI_API_KEY = "short";

      expect(isEnvironmentConfigured()).toBe(false);
    });
  });
});
