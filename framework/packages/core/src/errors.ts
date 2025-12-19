export class RunMeshError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "RunMeshError";
    this.cause = cause;
  }
}

export class ValidationError extends RunMeshError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "ValidationError";
  }
}

export class ToolError extends RunMeshError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "ToolError";
  }
}

export class OpenAIRequestError extends RunMeshError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "OpenAIRequestError";
  }
}
