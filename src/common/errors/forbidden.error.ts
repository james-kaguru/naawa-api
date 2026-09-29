import { HttpStatus } from "@/common/enums";
import { BaseError } from "./base.error";

export class ForbiddenError extends BaseError {
  public constructor(public message: string) {
    super('ForbiddenError', HttpStatus.FORBIDDEN, message);
  }
}
