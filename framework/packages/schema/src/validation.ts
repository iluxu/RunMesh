import { ZodSchema } from "zod";
import { ValidationError } from "@runmesh/core";

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: unknown;
};

export function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, errors: error };
  }
}

export function assertValid<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = validate(schema, data);
  if (!result.success) {
    throw new ValidationError("Data validation failed", result.errors);
  }
  return result.data as T;
}
