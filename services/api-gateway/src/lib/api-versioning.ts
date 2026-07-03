import type { Request, Response, NextFunction } from "express";

interface VersionConfig {
  supported: boolean;
  deprecated: boolean;
  sunset?: string;
  successor?: string;
}

const VERSIONS: Record<string, VersionConfig> = {
  v1: {
    supported: true,
    deprecated: true,
    sunset: "2026-07-03",
    successor: "v2",
  },
  v2: {
    supported: true,
    deprecated: false,
    sunset: undefined,
    successor: undefined,
  },
};

const VERSION_PATTERN = /^\/api\/v(\d+)\//;

export function getApiVersion(path: string): string | undefined {
  const match = path.match(VERSION_PATTERN);
  return match ? `v${match[1]}` : undefined;
}

export function getActiveVersionTag(): string {
  return "v2";
}

export function apiVersioningMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const version = getApiVersion(req.path);
  if (!version) {
    next();
    return;
  }

  const config = VERSIONS[version];
  if (!config) {
    next();
    return;
  }

  if (config.deprecated) {
    res.setHeader("Deprecation", "true");
    if (config.sunset) {
      res.setHeader("Sunset", config.sunset);
    }
    if (config.successor) {
      res.setHeader(
        "Link",
        `<${req.path.replace(`/v${version.replace("v", "")}`, `/v${config.successor.replace("v", "")}`)}>; rel="successor-version"`,
      );
    }
  }

  next();
}

export interface VersionRoute {
  path: string;
  handler: (req: Request, res: Response, next: NextFunction) => void;
  deprecatedSince?: string;
  sunsetDate?: string;
}

export function registerVersionedRoutes(
  router: import("express").IRouter,
  routes: VersionRoute[],
): void {
  for (const route of routes) {
    const version = getApiVersion(route.path);
    if (version && VERSIONS[version]?.deprecated) {
      router.use(route.path, (req, res, next) => {
        res.setHeader("Deprecation", "true");
        if (route.sunsetDate) {
          res.setHeader("Sunset", route.sunsetDate);
        }
        next();
      });
    }
    router.use(route.path, route.handler);
  }
}

const SUPPORTED_API_VERSIONS = ["v1", "v2"] as const;

export function buildVersionedPaths(
  path: string,
  versions: readonly string[] = SUPPORTED_API_VERSIONS,
): string[] {
  const base = path.startsWith("/") ? path : `/${path}`;
  const paths = [base, `/api${base}`];
  for (const version of versions) {
    paths.push(`/api/${version}${base}`);
  }
  return paths;
}
