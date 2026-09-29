import { HttpStatus } from "@/common/enums";
import { BaseError } from "./base.error";

export class NotFoundError extends BaseError {
  public constructor(public message: string) {
    super('NotFoundError', HttpStatus.NOT_FOUND, message);
  }
}
