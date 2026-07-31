export type AuthClientError = {
  code?: string | null;
  message?: string | null;
  status?: number;
  statusText?: string;
};

/**
 * Better Auth intentionally returns the same code for unknown emails and
 * wrong passwords (INVALID_EMAIL_OR_PASSWORD) to avoid user enumeration.
 */
const SIGN_IN_ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PASSWORD: "Invalid email or password.",
  USER_NOT_FOUND: "Invalid email or password.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Invalid email or password.",
  EMAIL_NOT_VERIFIED:
    "Please verify your email address before signing in. Check your inbox for a verification link.",
  USER_BANNED: "This account has been suspended. Contact support for help.",
  TOO_MANY_REQUESTS: "Too many attempts. Please wait a moment and try again.",
};

export function getAuthErrorMessage(
  error: AuthClientError | null | undefined,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error) return fallback;

  const code = error.code?.toUpperCase();
  if (code && SIGN_IN_ERROR_MESSAGES[code]) {
    return SIGN_IN_ERROR_MESSAGES[code];
  }

  // Better Auth may put the human message in `message` (e.g. "Invalid email or password")
  const message = error.message?.trim();
  if (message) {
    const normalized = message.toUpperCase().replace(/ /g, "_");
    if (SIGN_IN_ERROR_MESSAGES[normalized]) {
      return SIGN_IN_ERROR_MESSAGES[normalized];
    }
    return message;
  }

  if (error.status === 401) {
    return SIGN_IN_ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD;
  }
  if (error.status === 403) {
    return SIGN_IN_ERROR_MESSAGES.EMAIL_NOT_VERIFIED;
  }

  return fallback;
}

export function isEmailNotVerifiedError(
  error: AuthClientError | null | undefined,
): boolean {
  if (!error) return false;
  const code = error.code?.toUpperCase();
  return (
    code === "EMAIL_NOT_VERIFIED" ||
    error.status === 403 ||
    error.message?.toLowerCase().includes("email not verified") === true
  );
}

export function isInvalidCredentialsError(
  error: AuthClientError | null | undefined,
): boolean {
  if (!error) return false;
  const code = error.code?.toUpperCase();
  if (
    code === "INVALID_EMAIL_OR_PASSWORD" ||
    code === "INVALID_PASSWORD" ||
    code === "USER_NOT_FOUND" ||
    code === "CREDENTIAL_ACCOUNT_NOT_FOUND"
  ) {
    return true;
  }

  return error.status === 401;
}

export class SignInError extends Error {
  readonly code?: string;
  readonly status?: number;
  readonly email?: string;

  constructor(
    error: AuthClientError,
    options?: {
      email?: string;
    },
  ) {
    super(getAuthErrorMessage(error));
    this.name = "SignInError";
    this.code = error.code ?? undefined;
    this.status = error.status;
    this.email = options?.email;
  }
}
