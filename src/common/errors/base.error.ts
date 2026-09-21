export class BaseError extends Error {
  public constructor(
    public name: string,
    public status: number,
    public message: string,
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
