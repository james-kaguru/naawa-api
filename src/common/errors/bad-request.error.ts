import { HttpStatus } from "@/common/enums";
import { BaseError } from "./base.error";

export class BadRequestError extends BaseError {
  public constructor(public message: string) {
    super('BadRequestError', HttpStatus.BAD_REQUEST, message);
  }
}
