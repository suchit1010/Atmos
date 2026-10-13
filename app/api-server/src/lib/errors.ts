/** An expected failure with a stable machine-readable code. Routes answer with `{ error: code, ...body }`. */
export class ServiceError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    public body: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = "ServiceError";
  }
}
