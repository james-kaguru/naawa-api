import { HttpStatus } from "@/common/enums";
import { BaseError } from "./base.error";

export class InternalServerError extends BaseError {
  public constructor(public message: string) {
    super('InternalServerError', HttpStatus.INTERNAL_SERVER, message);
  }
}
