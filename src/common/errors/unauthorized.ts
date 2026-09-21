import { HttpStatus } from "@/common/enums";
import { BaseError } from "@/common/errors";

export default class UnauthorizedError extends BaseError {
  public constructor(public message: string) {
    super('UnauthorizedError', HttpStatus.UNAUTHORIZED, message);
  }
}
