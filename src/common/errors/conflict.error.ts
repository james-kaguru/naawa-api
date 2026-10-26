import { HttpStatus } from "@/common/enums";
import { BaseError } from "./base.error";

export class ConflictError extends BaseError {
  public constructor(public message: string) {
    super('ConflictError', HttpStatus.CONFLICT, message);
  }
}
