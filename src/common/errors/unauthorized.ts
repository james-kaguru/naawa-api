import { HttpStatus } from "@/common/enums";
import { BaseError } from "./base.error";

export class UnauthorizedError extends BaseError {
  public constructor(public message: string) {
    super('UnauthorizedError', HttpStatus.UNAUTHORIZED, message);
  }
}
