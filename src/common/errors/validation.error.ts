import { HttpStatus } from "@/common/enums";
import { BaseError } from "@/common/errors/base.error";

export type ValidationErrors = Partial<Record<"body" | "query" | "params", Record<string, string[] | undefined>>>;

export default class ValidationError extends BaseError {
  public constructor(public errors: ValidationErrors, public message = "Bad Request") {
    super('ValidationError', HttpStatus.BAD_REQUEST, message);
  }
}
