export class ScanPackError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class PackageJsonReadError extends ScanPackError {
  constructor(message: string, cause?: Error) {
    super(message, 'PACKAGE_JSON_READ_ERROR', cause);
  }
}

export class PackageJsonParseError extends ScanPackError {
  constructor(message: string, cause?: Error) {
    super(message, 'PACKAGE_JSON_PARSE_ERROR', cause);
  }
}

export class NpmRegistryError extends ScanPackError {
  constructor(message: string, cause?: Error) {
    super(message, 'NPM_REGISTRY_ERROR', cause);
  }
}

export class MaliciousPackageRepositoryError extends ScanPackError {
  constructor(message: string, cause?: Error) {
    super(message, 'MALICIOUS_PACKAGE_REPOSITORY_ERROR', cause);
  }
}

