export function isErrorWithMessage(
  error: unknown,
): error is { message: string } {
  return typeof error === "object" && error !== null && "message" in error;
}

export function isErrorWithCode(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}
