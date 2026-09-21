import { HttpStatus } from "@/common/enums";
import { BaseError } from "@/common/errors";

export default class NotFoundError extends BaseError {
  public constructor(public message: string) {
    super('NotFoundError', HttpStatus.NOT_FOUND, message);
  }
}
