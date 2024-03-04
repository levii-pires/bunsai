import { version } from "../package.json";

export class LoaderNotFoundError extends Error {
  name = "LoaderNotFoundError";

  constructor(request: Request) {
    super(`'${request.url}' does not have an appropriate loader`);
  }
}

export class VersionMigrationError extends Error {
  name = "VersionMigrationError";

  constructor(message = "") {
    super(`v${version}` + (message && `: ${message}`));
  }
}
