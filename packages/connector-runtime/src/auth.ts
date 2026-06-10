import type { AuthConfig, AuthMethod } from "./types";

export interface AuthValidator {
  type: AuthMethod;
  validate(credentials: Record<string, unknown>): { valid: boolean; error?: string };
  getHeaders(credentials: Record<string, unknown>): Record<string, string>;
}

const apiKeyValidator: AuthValidator = {
  type: "api_key",
  validate(credentials) {
    if (!credentials.apiKey) return { valid: false, error: "apiKey is required" };
    return { valid: true };
  },
  getHeaders(credentials) {
    const headerName = String(credentials.headerName ?? "Authorization");
    const prefix = String(credentials.prefix ?? "Bearer");
    return { [headerName]: `${prefix} ${credentials.apiKey}` };
  },
};

const basicAuthValidator: AuthValidator = {
  type: "basic",
  validate(credentials) {
    if (!credentials.username) return { valid: false, error: "username is required" };
    if (!credentials.password) return { valid: false, error: "password is required" };
    return { valid: true };
  },
  getHeaders(credentials) {
    const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  },
};

const oauth2Validator: AuthValidator = {
  type: "oauth2",
  validate(credentials) {
    if (!credentials.accessToken && !credentials.refreshToken) {
      return { valid: false, error: "accessToken or refreshToken is required" };
    }
    return { valid: true };
  },
  getHeaders(credentials) {
    return { Authorization: `Bearer ${credentials.accessToken}` };
  },
};

const noAuthValidator: AuthValidator = {
  type: "none",
  validate() {
    return { valid: true };
  },
  getHeaders() {
    return {};
  },
};

const validators: Record<AuthMethod, AuthValidator> = {
  api_key: apiKeyValidator,
  basic: basicAuthValidator,
  oauth2: oauth2Validator,
  none: noAuthValidator,
};

export function getAuthValidator(type: AuthMethod): AuthValidator {
  return validators[type] ?? noAuthValidator;
}

export function validateAuth(config: AuthConfig): { valid: boolean; error?: string } {
  return getAuthValidator(config.type).validate(config.credentials);
}

export function getAuthHeaders(config: AuthConfig): Record<string, string> {
  return getAuthValidator(config.type).getHeaders(config.credentials);
}
