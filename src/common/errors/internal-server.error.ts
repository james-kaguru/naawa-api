import { HttpStatus } from "@/common/enums";
import { BaseError } from "@/common/errors";

export default class InternalServerError extends BaseError {
  public constructor(public message: string) {
    super('InternalServerError', HttpStatus.INTERNAL_SERVER, message);
  }
}
