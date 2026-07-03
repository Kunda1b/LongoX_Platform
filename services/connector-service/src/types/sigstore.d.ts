/**
 * Type declaration for the optional `sigstore` peer dependency.
 *
 * Per ADR-017 / §17.2, the connector-service verifies connector manifests
 * using Sigstore. The `sigstore` npm package is an optional peer dependency:
 * production deployments install it via `pnpm add sigstore`; dev deployments
 * skip it and fall back to the dev-mode verifier (see sigstore.service.ts).
 *
 * This declaration prevents TypeScript from failing when the package is not
 * installed. At runtime, the dynamic `import("sigstore")` in
 * sigstore.service.ts is wrapped in try/catch and falls back to dev-mode
 * verification if the package is absent.
 */
declare module "sigstore" {
  /**
   * Verify a Sigstore bundle against a payload. Throws on verification
   * failure; returns void on success.
   *
   * The actual signature is more complex (DSSE envelopes, certificates,
   * transparency log entries); we type it loosely here because the dev-mode
   * fallback does not depend on the exact shape.
   */
  export function verify(bundle: string, payload: Buffer): Promise<void>;
}
