import { HttpStatus } from "@/common/enums";
import { BaseError } from "@/common/errors";

export default class ForbiddenError extends BaseError {
  public constructor(public message: string) {
    super('ForbiddenError', HttpStatus.FORBIDDEN, message);
  }
}
