export class LoaderNotFoundError extends Error {
  name = "LoaderNotFoundError";

  constructor(request: Request) {
    super(`'${request.url}' does not have an appropriate loader`);
  }
}
