(() => {
  var a = {};
  ((a.id = 670),
    (a.ids = [670]),
    (a.modules = {
      261: (a) => {
        "use strict";
        a.exports = require("next/dist/shared/lib/router/utils/app-paths");
      },
      3295: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");
      },
      5510: (a, b, c) => {
        "use strict";
        c.d(b, { J: () => k });
        var d = c(78157),
          e = c(31768),
          f = c(39437),
          g = e.forwardRef((a, b) =>
            (0, d.jsx)(f.sG.label, {
              ...a,
              ref: b,
              onMouseDown: (b) => {
                b.target.closest("button, input, select, textarea") ||
                  (a.onMouseDown?.(b),
                  !b.defaultPrevented && b.detail > 1 && b.preventDefault());
              },
            }),
          );
        g.displayName = "Label";
        var h = c(4306),
          i = c(10573);
        let j = (0, h.F)(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          ),
          k = e.forwardRef(({ className: a, ...b }, c) =>
            (0, d.jsx)(g, { ref: c, className: (0, i.cn)(j(), a), ...b }),
          );
        k.displayName = g.displayName;
      },
      6533: (a, b, c) => {
        "use strict";
        c.d(b, { DashboardLayout: () => M });
        var d = c(78157),
          e = c(71159),
          f = c(94496),
          g = c.n(f),
          h = c(10573),
          i = c(24444),
          j = c(49170),
          k = c(55320),
          l = c(29486),
          m = c(59730),
          n = c(53162),
          o = c(86141),
          p = c(93160),
          q = c(35646),
          r = c(6446),
          s = c(28432),
          t = c(54159),
          u = c(63774),
          v = c(75879),
          w = c(42122),
          x = c(84958),
          y = c(56335),
          z = c(24241),
          A = c(50130),
          B = c(16443),
          C = c(94676),
          D = c(60689),
          E = c(87962),
          F = c(24967),
          G = c(41406),
          H = c(22664);
        let I = [
          { label: "Dashboard", href: "/dashboard", icon: k.A },
          { label: "Workflows", href: "/workflows", icon: l.A },
          { label: "Builder", href: "/builder", icon: l.A },
          { label: "Executions", href: "/executions", icon: m.A },
          { label: "Connectors", href: "/connectors", icon: n.A },
          { label: "Credentials", href: "/credentials", icon: o.A },
          { label: "Templates", href: "/templates", icon: p.A },
          { label: "Marketplace", href: "/marketplace", icon: q.A },
          { label: "Analytics", href: "/analytics", icon: r.A },
          { label: "Dashboards", href: "/dashboards", icon: s.A },
          { label: "Billing", href: "/billing", icon: t.A },
          { separator: !0 },
          { label: "Environments", href: "/environments", icon: u.A },
          { label: "Tenants", href: "/tenants", icon: v.A },
          { label: "RBAC", href: "/rbac", icon: w.A },
          { separator: !0 },
          { label: "AI Playground", href: "/ai/playground", icon: x.A },
          { label: "AI Models", href: "/ai/models", icon: y.A },
          { label: "AI Analytics", href: "/ai/analytics", icon: r.A },
          { label: "Prompts", href: "/ai/prompts", icon: z.A },
          { separator: !0 },
          { label: "Webhook Endpoints", href: "/webhook-endpoints", icon: A.A },
          { label: "Apps", href: "/apps", icon: B.A },
          { label: "Audit Log", href: "/audit-log", icon: C.A },
          { label: "DLQ", href: "/dlq", icon: y.A },
          { label: "Feature Flags", href: "/feature-flags", icon: D.A },
          { label: "Notifications", href: "/notifications", icon: E.A },
          { label: "Regions", href: "/settings/regions", icon: F.A },
          { separator: !0 },
          { label: "Settings", href: "/settings", icon: G.A },
        ];
        function J() {
          let a = (0, e.usePathname)(),
            { user: b, logout: c } = (0, i.A)();
          return (0, d.jsxs)("aside", {
            className:
              "fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r bg-sidebar",
            children: [
              (0, d.jsxs)("div", {
                className: "flex h-14 items-center gap-2 border-b px-4",
                children: [
                  (0, d.jsx)("div", {
                    className:
                      "flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground",
                    children: "FC",
                  }),
                  (0, d.jsx)("span", {
                    className: "text-sm font-semibold",
                    children: "LongoX",
                  }),
                ],
              }),
              (0, d.jsx)("nav", {
                className: "flex-1 overflow-y-auto p-2",
                children: I.map((b, c) => {
                  if ("separator" in b)
                    return (0, d.jsx)("div", { className: "my-2 border-t" }, c);
                  let e = b.icon,
                    f = a === b.href || a?.startsWith(b.href + "/");
                  return (0, d.jsxs)(
                    g(),
                    {
                      href: b.href,
                      className: (0, h.cn)(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        f
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                      ),
                      children: [
                        (0, d.jsx)(e, { className: "h-4 w-4" }),
                        b.label,
                      ],
                    },
                    b.href,
                  );
                }),
              }),
              (0, d.jsxs)("div", {
                className: "border-t p-3",
                children: [
                  (0, d.jsx)("div", {
                    className: "mb-2 truncate text-xs text-muted-foreground",
                    children: b?.name ?? b?.email ?? "Guest",
                  }),
                  (0, d.jsxs)(j.$, {
                    variant: "ghost",
                    size: "sm",
                    className: "w-full justify-start gap-2 text-xs",
                    onClick: c,
                    children: [
                      (0, d.jsx)(H.A, { className: "h-3.5 w-3.5" }),
                      "Sign out",
                    ],
                  }),
                ],
              }),
            ],
          });
        }
        function K({ className: a = "" }) {
          return (0, d.jsx)("div", {
            role: "status",
            "aria-label": "Loading",
            className: `inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${a}`,
          });
        }
        function L({ children: a }) {
          let { user: b, isLoading: c } = (0, i.A)();
          return ((0, e.useRouter)(), c)
            ? (0, d.jsx)("div", {
                className: "flex min-h-screen items-center justify-center",
                children: (0, d.jsx)(K, {}),
              })
            : b
              ? (0, d.jsx)(d.Fragment, { children: a })
              : null;
        }
        function M({ children: a }) {
          return (0, d.jsx)(L, {
            children: (0, d.jsxs)("div", {
              className: "flex min-h-screen",
              children: [
                (0, d.jsx)(J, {}),
                (0, d.jsx)("main", {
                  className: "ml-56 flex-1 p-6",
                  children: a,
                }),
              ],
            }),
          });
        }
        c(31768);
      },
      10846: (a) => {
        "use strict";
        a.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
      },
      12142: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => d });
        let d = (0, c(23048).A)("save", [
          [
            "path",
            {
              d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
              key: "1c8476",
            },
          ],
          [
            "path",
            { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" },
          ],
          ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }],
        ]);
      },
      19121: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/action-async-storage.external.js");
      },
      26294: (a, b, c) => {
        "use strict";
        c.d(b, { DashboardLayout: () => d });
        let d = (0, c(25459).registerClientReference)(
          function () {
            throw Error(
              "Attempted to call DashboardLayout() from the server but DashboardLayout is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
            );
          },
          "/home/ubuntu/repos/Flow-Builder-Nexus/apps/web/src/components/dashboard-layout.tsx",
          "DashboardLayout",
        );
      },
      26713: (a) => {
        "use strict";
        a.exports = require("next/dist/shared/lib/router/utils/is-bot");
      },
      28354: (a) => {
        "use strict";
        a.exports = require("util");
      },
      29294: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/work-async-storage.external.js");
      },
      33873: (a) => {
        "use strict";
        a.exports = require("path");
      },
      41025: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/dynamic-access-async-storage.external.js");
      },
      49170: (a, b, c) => {
        "use strict";
        c.d(b, { $: () => j });
        var d = c(78157),
          e = c(31768),
          f = c(90632),
          g = c(4306),
          h = c(10573);
        let i = (0, g.F)(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            {
              variants: {
                variant: {
                  default:
                    "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                  destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                  outline:
                    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                  secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                  ghost: "hover:bg-accent hover:text-accent-foreground",
                  link: "text-primary underline-offset-4 hover:underline",
                },
                size: {
                  default: "h-9 px-4 py-2",
                  sm: "h-8 rounded-md px-3 text-xs",
                  lg: "h-10 rounded-md px-8",
                  icon: "h-9 w-9",
                },
              },
              defaultVariants: { variant: "default", size: "default" },
            },
          ),
          j = e.forwardRef(
            (
              { className: a, variant: b, size: c, asChild: e = !1, ...g },
              j,
            ) => {
              let k = e ? f.DX : "button";
              return (0, d.jsx)(k, {
                className: (0, h.cn)(i({ variant: b, size: c, className: a })),
                ref: j,
                ...g,
              });
            },
          );
        j.displayName = "Button";
      },
      54846: (a, b, c) => {
        "use strict";
        (c.r(b), c.d(b, { default: () => d }));
        let d = (0, c(25459).registerClientReference)(
          function () {
            throw Error(
              "Attempted to call the default export of \"/home/ubuntu/repos/Flow-Builder-Nexus/apps/web/src/app/(dashboard)/settings/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
            );
          },
          "/home/ubuntu/repos/Flow-Builder-Nexus/apps/web/src/app/(dashboard)/settings/page.tsx",
          "default",
        );
      },
      55730: (a, b, c) => {
        Promise.resolve().then(c.bind(c, 79255));
      },
      60808: (a, b, c) => {
        "use strict";
        (c.r(b),
          c.d(b, {
            GlobalError: () => E.a,
            __next_app__: () => K,
            handler: () => M,
            pages: () => J,
            routeModule: () => L,
            tree: () => I,
          }));
        var d = c(73653),
          e = c(97714),
          f = c(85250),
          g = c(37587),
          h = c(22369),
          i = c(1889),
          j = c(96232),
          k = c(22841),
          l = c(46537),
          m = c(46027),
          n = c(30905),
          o = c(78559),
          p = c(75928),
          q = c(19374),
          r = c(65971),
          s = c(261),
          t = c(79898),
          u = c(32967),
          v = c(26713),
          w = c(40139),
          x = c(14248),
          y = c(59580),
          z = c(57749),
          A = c(53123),
          B = c(89745),
          C = c(86439),
          D = c(58671),
          E = c.n(D),
          F = c(18283),
          G = c(39818),
          H = {};
        for (let a in F)
          0 >
            [
              "default",
              "tree",
              "pages",
              "GlobalError",
              "__next_app__",
              "routeModule",
              "handler",
            ].indexOf(a) && (H[a] = () => F[a]);
        c.d(b, H);
        let I = {
            children: [
              "",
              {
                children: [
                  "(dashboard)",
                  {
                    children: [
                      "settings",
                      {
                        children: [
                          "__PAGE__",
                          {},
                          {
                            page: [
                              () => Promise.resolve().then(c.bind(c, 54846)),
                              "/home/ubuntu/repos/Flow-Builder-Nexus/apps/web/src/app/(dashboard)/settings/page.tsx",
                            ],
                          },
                        ],
                      },
                      {},
                    ],
                  },
                  {
                    layout: [
                      () => Promise.resolve().then(c.bind(c, 82466)),
                      "/home/ubuntu/repos/Flow-Builder-Nexus/apps/web/src/app/(dashboard)/layout.tsx",
                    ],
                    "not-found": [
                      () => Promise.resolve().then(c.t.bind(c, 17983, 23)),
                      "next/dist/client/components/builtin/not-found.js",
                    ],
                    forbidden: [
                      () => Promise.resolve().then(c.t.bind(c, 15034, 23)),
                      "next/dist/client/components/builtin/forbidden.js",
                    ],
                    unauthorized: [
                      () => Promise.resolve().then(c.t.bind(c, 54693, 23)),
                      "next/dist/client/components/builtin/unauthorized.js",
                    ],
                  },
                ],
              },
              {
                layout: [
                  () => Promise.resolve().then(c.bind(c, 47570)),
                  "/home/ubuntu/repos/Flow-Builder-Nexus/apps/web/src/app/layout.tsx",
                ],
                "global-error": [
                  () => Promise.resolve().then(c.t.bind(c, 58671, 23)),
                  "next/dist/client/components/builtin/global-error.js",
                ],
                "not-found": [
                  () => Promise.resolve().then(c.t.bind(c, 17983, 23)),
                  "next/dist/client/components/builtin/not-found.js",
                ],
                forbidden: [
                  () => Promise.resolve().then(c.t.bind(c, 15034, 23)),
                  "next/dist/client/components/builtin/forbidden.js",
                ],
                unauthorized: [
                  () => Promise.resolve().then(c.t.bind(c, 54693, 23)),
                  "next/dist/client/components/builtin/unauthorized.js",
                ],
              },
            ],
          }.children,
          J = [
            "/home/ubuntu/repos/Flow-Builder-Nexus/apps/web/src/app/(dashboard)/settings/page.tsx",
          ],
          K = { require: c, loadChunk: () => Promise.resolve() },
          L = new d.AppPageRouteModule({
            definition: {
              kind: e.RouteKind.APP_PAGE,
              page: "/(dashboard)/settings/page",
              pathname: "/settings",
              bundlePath: "",
              filename: "",
              appPaths: [],
            },
            userland: { loaderTree: I },
            distDir: ".next",
            relativeProjectDir: "",
          });
        async function M(a, b, d) {
          var D;
          let H = "/(dashboard)/settings/page";
          "/index" === H && (H = "/");
          let N = (0, h.getRequestMeta)(a, "postponed"),
            O = (0, h.getRequestMeta)(a, "minimalMode"),
            P = await L.prepare(a, b, { srcPage: H, multiZoneDraftMode: !1 });
          if (!P)
            return (
              (b.statusCode = 400),
              b.end("Bad Request"),
              null == d.waitUntil || d.waitUntil.call(d, Promise.resolve()),
              null
            );
          let {
              buildId: Q,
              query: R,
              params: S,
              parsedUrl: T,
              pageIsDynamic: U,
              buildManifest: V,
              nextFontManifest: W,
              reactLoadableManifest: X,
              serverActionsManifest: Y,
              clientReferenceManifest: Z,
              subresourceIntegrityManifest: $,
              prerenderManifest: _,
              isDraftMode: aa,
              resolvedPathname: ab,
              revalidateOnlyGenerated: ac,
              routerServerContext: ad,
              nextConfig: ae,
              interceptionRoutePatterns: af,
            } = P,
            ag = T.pathname || "/",
            ah = (0, s.normalizeAppPath)(H),
            { isOnDemandRevalidate: ai } = P,
            aj = L.match(ag, _),
            ak = !!_.routes[ab],
            al = !!(aj || ak || _.routes[ah]),
            am = a.headers["user-agent"] || "",
            an = (0, v.getBotType)(am),
            ao = (0, q.isHtmlBotRequest)(a),
            ap =
              (0, h.getRequestMeta)(a, "isPrefetchRSCRequest") ??
              "1" === a.headers[u.NEXT_ROUTER_PREFETCH_HEADER],
            aq =
              (0, h.getRequestMeta)(a, "isRSCRequest") ??
              (0, n.f)(a.headers[u.RSC_HEADER]),
            ar = (0, t.getIsPossibleServerAction)(a),
            as =
              (0, m.checkIsAppPPREnabled)(ae.experimental.ppr) &&
              (null == (D = _.routes[ah] ?? _.dynamicRoutes[ah])
                ? void 0
                : D.renderingMode) === "PARTIALLY_STATIC",
            at = !1,
            au = !1,
            av = as ? N : void 0,
            aw = as && aq && !ap,
            ax = (0, h.getRequestMeta)(a, "segmentPrefetchRSCRequest"),
            ay =
              !am ||
              (0, q.shouldServeStreamingMetadata)(am, ae.htmlLimitedBots);
          ao && as && ((al = !1), (ay = !1));
          let az = !0 === L.isDev || !al || "string" == typeof N || aw,
            aA = ao && as,
            aB = null;
          aa || !al || az || ar || av || aw || (aB = ab);
          let aC = aB;
          (!aC && L.isDev && (aC = ab),
            L.isDev || aa || !al || !aq || aw || (0, k.d)(a.headers));
          let aD = {
            ...F,
            tree: I,
            pages: J,
            GlobalError: E(),
            handler: M,
            routeModule: L,
            __next_app__: K,
          };
          Y &&
            Z &&
            (0, p.setReferenceManifestsSingleton)({
              page: H,
              clientReferenceManifest: Z,
              serverActionsManifest: Y,
              serverModuleMap: (0, r.createServerModuleMap)({
                serverActionsManifest: Y,
              }),
            });
          let aE = a.method || "GET",
            aF = (0, g.getTracer)(),
            aG = aF.getActiveScopeSpan();
          try {
            let f = L.getVaryHeader(ab, af);
            b.setHeader("Vary", f);
            let k = async (c, d) => {
                let e = new l.NodeNextRequest(a),
                  f = new l.NodeNextResponse(b);
                return L.render(e, f, d).finally(() => {
                  if (!c) return;
                  c.setAttributes({
                    "http.status_code": b.statusCode,
                    "next.rsc": !1,
                  });
                  let d = aF.getRootSpanAttributes();
                  if (!d) return;
                  if (
                    d.get("next.span_type") !== i.BaseServerSpan.handleRequest
                  )
                    return void console.warn(
                      `Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`,
                    );
                  let e = d.get("next.route");
                  if (e) {
                    let a = `${aE} ${e}`;
                    (c.setAttributes({
                      "next.route": e,
                      "http.route": e,
                      "next.span_name": a,
                    }),
                      c.updateName(a));
                  } else c.updateName(`${aE} ${a.url}`);
                });
              },
              m = async ({ span: e, postponed: f, fallbackRouteParams: g }) => {
                let i = {
                    query: R,
                    params: S,
                    page: ah,
                    sharedContext: { buildId: Q },
                    serverComponentsHmrCache: (0, h.getRequestMeta)(
                      a,
                      "serverComponentsHmrCache",
                    ),
                    fallbackRouteParams: g,
                    renderOpts: {
                      App: () => null,
                      Document: () => null,
                      pageConfig: {},
                      ComponentMod: aD,
                      Component: (0, j.T)(aD),
                      params: S,
                      routeModule: L,
                      page: H,
                      postponed: f,
                      shouldWaitOnAllReady: aA,
                      serveStreamingMetadata: ay,
                      supportsDynamicResponse: "string" == typeof f || az,
                      buildManifest: V,
                      nextFontManifest: W,
                      reactLoadableManifest: X,
                      subresourceIntegrityManifest: $,
                      serverActionsManifest: Y,
                      clientReferenceManifest: Z,
                      setIsrStatus: null == ad ? void 0 : ad.setIsrStatus,
                      dir: c(33873).join(process.cwd(), L.relativeProjectDir),
                      isDraftMode: aa,
                      isRevalidate: al && !f && !aw,
                      botType: an,
                      isOnDemandRevalidate: ai,
                      isPossibleServerAction: ar,
                      assetPrefix: ae.assetPrefix,
                      nextConfigOutput: ae.output,
                      crossOrigin: ae.crossOrigin,
                      trailingSlash: ae.trailingSlash,
                      previewProps: _.preview,
                      deploymentId: ae.deploymentId,
                      enableTainting: ae.experimental.taint,
                      htmlLimitedBots: ae.htmlLimitedBots,
                      devtoolSegmentExplorer:
                        ae.experimental.devtoolSegmentExplorer,
                      reactMaxHeadersLength: ae.reactMaxHeadersLength,
                      multiZoneDraftMode: !1,
                      incrementalCache: (0, h.getRequestMeta)(
                        a,
                        "incrementalCache",
                      ),
                      cacheLifeProfiles: ae.experimental.cacheLife,
                      basePath: ae.basePath,
                      serverActions: ae.experimental.serverActions,
                      ...(at
                        ? {
                            nextExport: !0,
                            supportsDynamicResponse: !1,
                            isStaticGeneration: !0,
                            isRevalidate: !0,
                            isDebugDynamicAccesses: at,
                          }
                        : {}),
                      experimental: {
                        isRoutePPREnabled: as,
                        expireTime: ae.expireTime,
                        staleTimes: ae.experimental.staleTimes,
                        cacheComponents: !!ae.experimental.cacheComponents,
                        clientSegmentCache:
                          !!ae.experimental.clientSegmentCache,
                        clientParamParsing:
                          !!ae.experimental.clientParamParsing,
                        dynamicOnHover: !!ae.experimental.dynamicOnHover,
                        inlineCss: !!ae.experimental.inlineCss,
                        authInterrupts: !!ae.experimental.authInterrupts,
                        clientTraceMetadata:
                          ae.experimental.clientTraceMetadata || [],
                      },
                      waitUntil: d.waitUntil,
                      onClose: (a) => {
                        b.on("close", a);
                      },
                      onAfterTaskError: () => {},
                      onInstrumentationRequestError: (b, c, d) =>
                        L.onRequestError(a, b, d, ad),
                      err: (0, h.getRequestMeta)(a, "invokeError"),
                      dev: L.isDev,
                    },
                  },
                  l = await k(e, i),
                  { metadata: m } = l,
                  { cacheControl: n, headers: o = {}, fetchTags: p } = m;
                if (
                  (p && (o[z.NEXT_CACHE_TAGS_HEADER] = p),
                  (a.fetchMetrics = m.fetchMetrics),
                  al &&
                    (null == n ? void 0 : n.revalidate) === 0 &&
                    !L.isDev &&
                    !as)
                ) {
                  let a = m.staticBailoutInfo,
                    b = Object.defineProperty(
                      Error(`Page changed from static to dynamic at runtime ${ab}${(null == a ? void 0 : a.description) ? `, reason: ${a.description}` : ""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),
                      "__NEXT_ERROR_CODE",
                      { value: "E132", enumerable: !1, configurable: !0 },
                    );
                  if (null == a ? void 0 : a.stack) {
                    let c = a.stack;
                    b.stack = b.message + c.substring(c.indexOf("\n"));
                  }
                  throw b;
                }
                return {
                  value: {
                    kind: w.CachedRouteKind.APP_PAGE,
                    html: l,
                    headers: o,
                    rscData: m.flightData,
                    postponed: m.postponed,
                    status: m.statusCode,
                    segmentData: m.segmentData,
                  },
                  cacheControl: n,
                };
              },
              n = async ({
                hasResolved: c,
                previousCacheEntry: f,
                isRevalidating: g,
                span: i,
              }) => {
                let j,
                  k = !1 === L.isDev,
                  l = c || b.writableEnded;
                if (ai && ac && !f && !O)
                  return (
                    (null == ad ? void 0 : ad.render404)
                      ? await ad.render404(a, b)
                      : ((b.statusCode = 404),
                        b.end("This page could not be found")),
                    null
                  );
                if (
                  (aj && (j = (0, x.parseFallbackField)(aj.fallback)),
                  j === x.FallbackMode.PRERENDER &&
                    (0, v.isBot)(am) &&
                    (!as || ao) &&
                    (j = x.FallbackMode.BLOCKING_STATIC_RENDER),
                  (null == f ? void 0 : f.isStale) === -1 && (ai = !0),
                  ai &&
                    (j !== x.FallbackMode.NOT_FOUND || f) &&
                    (j = x.FallbackMode.BLOCKING_STATIC_RENDER),
                  !O &&
                    j !== x.FallbackMode.BLOCKING_STATIC_RENDER &&
                    aC &&
                    !l &&
                    !aa &&
                    U &&
                    (k || !ak))
                ) {
                  let b;
                  if ((k || aj) && j === x.FallbackMode.NOT_FOUND)
                    throw new C.NoFallbackError();
                  if (as && !aq) {
                    let c =
                      "string" == typeof (null == aj ? void 0 : aj.fallback)
                        ? aj.fallback
                        : k
                          ? ah
                          : null;
                    if (
                      ((b = await L.handleResponse({
                        cacheKey: c,
                        req: a,
                        nextConfig: ae,
                        routeKind: e.RouteKind.APP_PAGE,
                        isFallback: !0,
                        prerenderManifest: _,
                        isRoutePPREnabled: as,
                        responseGenerator: async () =>
                          m({
                            span: i,
                            postponed: void 0,
                            fallbackRouteParams: k || au ? (0, o.u)(ah) : null,
                          }),
                        waitUntil: d.waitUntil,
                      })),
                      null === b)
                    )
                      return null;
                    if (b) return (delete b.cacheControl, b);
                  }
                }
                let n = ai || g || !av ? void 0 : av;
                if (at && void 0 !== n)
                  return {
                    cacheControl: { revalidate: 1, expire: void 0 },
                    value: {
                      kind: w.CachedRouteKind.PAGES,
                      html: y.default.EMPTY,
                      pageData: {},
                      headers: void 0,
                      status: void 0,
                    },
                  };
                let p =
                  U &&
                  as &&
                  ((0, h.getRequestMeta)(a, "renderFallbackShell") || au)
                    ? (0, o.u)(ag)
                    : null;
                return m({ span: i, postponed: n, fallbackRouteParams: p });
              },
              p = async (c) => {
                var f, g, i, j, k;
                let l,
                  o = await L.handleResponse({
                    cacheKey: aB,
                    responseGenerator: (a) => n({ span: c, ...a }),
                    routeKind: e.RouteKind.APP_PAGE,
                    isOnDemandRevalidate: ai,
                    isRoutePPREnabled: as,
                    req: a,
                    nextConfig: ae,
                    prerenderManifest: _,
                    waitUntil: d.waitUntil,
                  });
                if (
                  (aa &&
                    b.setHeader(
                      "Cache-Control",
                      "private, no-cache, no-store, max-age=0, must-revalidate",
                    ),
                  L.isDev &&
                    b.setHeader("Cache-Control", "no-store, must-revalidate"),
                  !o)
                ) {
                  if (aB)
                    throw Object.defineProperty(
                      Error(
                        "invariant: cache entry required but not generated",
                      ),
                      "__NEXT_ERROR_CODE",
                      { value: "E62", enumerable: !1, configurable: !0 },
                    );
                  return null;
                }
                if (
                  (null == (f = o.value) ? void 0 : f.kind) !==
                  w.CachedRouteKind.APP_PAGE
                )
                  throw Object.defineProperty(
                    Error(
                      `Invariant app-page handler received invalid cache entry ${null == (i = o.value) ? void 0 : i.kind}`,
                    ),
                    "__NEXT_ERROR_CODE",
                    { value: "E707", enumerable: !1, configurable: !0 },
                  );
                let p = "string" == typeof o.value.postponed;
                al &&
                  !aw &&
                  (!p || ap) &&
                  (O ||
                    b.setHeader(
                      "x-nextjs-cache",
                      ai
                        ? "REVALIDATED"
                        : o.isMiss
                          ? "MISS"
                          : o.isStale
                            ? "STALE"
                            : "HIT",
                    ),
                  b.setHeader(u.NEXT_IS_PRERENDER_HEADER, "1"));
                let { value: q } = o;
                if (av) l = { revalidate: 0, expire: void 0 };
                else if (O && aq && !ap && as)
                  l = { revalidate: 0, expire: void 0 };
                else if (!L.isDev)
                  if (aa) l = { revalidate: 0, expire: void 0 };
                  else if (al) {
                    if (o.cacheControl)
                      if ("number" == typeof o.cacheControl.revalidate) {
                        if (o.cacheControl.revalidate < 1)
                          throw Object.defineProperty(
                            Error(
                              `Invalid revalidate configuration provided: ${o.cacheControl.revalidate} < 1`,
                            ),
                            "__NEXT_ERROR_CODE",
                            { value: "E22", enumerable: !1, configurable: !0 },
                          );
                        l = {
                          revalidate: o.cacheControl.revalidate,
                          expire:
                            (null == (j = o.cacheControl)
                              ? void 0
                              : j.expire) ?? ae.expireTime,
                        };
                      } else
                        l = { revalidate: z.CACHE_ONE_YEAR, expire: void 0 };
                  } else
                    b.getHeader("Cache-Control") ||
                      (l = { revalidate: 0, expire: void 0 });
                if (
                  ((o.cacheControl = l),
                  "string" == typeof ax &&
                    (null == q ? void 0 : q.kind) ===
                      w.CachedRouteKind.APP_PAGE &&
                    q.segmentData)
                ) {
                  b.setHeader(u.NEXT_DID_POSTPONE_HEADER, "2");
                  let c =
                    null == (k = q.headers)
                      ? void 0
                      : k[z.NEXT_CACHE_TAGS_HEADER];
                  O &&
                    al &&
                    c &&
                    "string" == typeof c &&
                    b.setHeader(z.NEXT_CACHE_TAGS_HEADER, c);
                  let d = q.segmentData.get(ax);
                  return void 0 !== d
                    ? (0, B.sendRenderResult)({
                        req: a,
                        res: b,
                        generateEtags: ae.generateEtags,
                        poweredByHeader: ae.poweredByHeader,
                        result: y.default.fromStatic(
                          d,
                          u.RSC_CONTENT_TYPE_HEADER,
                        ),
                        cacheControl: o.cacheControl,
                      })
                    : ((b.statusCode = 204),
                      (0, B.sendRenderResult)({
                        req: a,
                        res: b,
                        generateEtags: ae.generateEtags,
                        poweredByHeader: ae.poweredByHeader,
                        result: y.default.EMPTY,
                        cacheControl: o.cacheControl,
                      }));
                }
                let r = (0, h.getRequestMeta)(a, "onCacheEntry");
                if (
                  r &&
                  (await r(
                    { ...o, value: { ...o.value, kind: "PAGE" } },
                    { url: (0, h.getRequestMeta)(a, "initURL") },
                  ))
                )
                  return null;
                if (p && av)
                  throw Object.defineProperty(
                    Error(
                      "Invariant: postponed state should not be present on a resume request",
                    ),
                    "__NEXT_ERROR_CODE",
                    { value: "E396", enumerable: !1, configurable: !0 },
                  );
                if (q.headers) {
                  let a = { ...q.headers };
                  for (let [c, d] of ((O && al) ||
                    delete a[z.NEXT_CACHE_TAGS_HEADER],
                  Object.entries(a)))
                    if (void 0 !== d)
                      if (Array.isArray(d))
                        for (let a of d) b.appendHeader(c, a);
                      else
                        ("number" == typeof d && (d = d.toString()),
                          b.appendHeader(c, d));
                }
                let s =
                  null == (g = q.headers)
                    ? void 0
                    : g[z.NEXT_CACHE_TAGS_HEADER];
                if (
                  (O &&
                    al &&
                    s &&
                    "string" == typeof s &&
                    b.setHeader(z.NEXT_CACHE_TAGS_HEADER, s),
                  !q.status || (aq && as) || (b.statusCode = q.status),
                  !O &&
                    q.status &&
                    G.RedirectStatusCode[q.status] &&
                    aq &&
                    (b.statusCode = 200),
                  p && b.setHeader(u.NEXT_DID_POSTPONE_HEADER, "1"),
                  aq && !aa)
                ) {
                  if (void 0 === q.rscData) {
                    if (q.postponed)
                      throw Object.defineProperty(
                        Error("Invariant: Expected postponed to be undefined"),
                        "__NEXT_ERROR_CODE",
                        { value: "E372", enumerable: !1, configurable: !0 },
                      );
                    return (0, B.sendRenderResult)({
                      req: a,
                      res: b,
                      generateEtags: ae.generateEtags,
                      poweredByHeader: ae.poweredByHeader,
                      result: q.html,
                      cacheControl: aw
                        ? { revalidate: 0, expire: void 0 }
                        : o.cacheControl,
                    });
                  }
                  return (0, B.sendRenderResult)({
                    req: a,
                    res: b,
                    generateEtags: ae.generateEtags,
                    poweredByHeader: ae.poweredByHeader,
                    result: y.default.fromStatic(
                      q.rscData,
                      u.RSC_CONTENT_TYPE_HEADER,
                    ),
                    cacheControl: o.cacheControl,
                  });
                }
                let t = q.html;
                if (!p || O || aq)
                  return (0, B.sendRenderResult)({
                    req: a,
                    res: b,
                    generateEtags: ae.generateEtags,
                    poweredByHeader: ae.poweredByHeader,
                    result: t,
                    cacheControl: o.cacheControl,
                  });
                if (at)
                  return (
                    t.push(
                      new ReadableStream({
                        start(a) {
                          (a.enqueue(A.ENCODED_TAGS.CLOSED.BODY_AND_HTML),
                            a.close());
                        },
                      }),
                    ),
                    (0, B.sendRenderResult)({
                      req: a,
                      res: b,
                      generateEtags: ae.generateEtags,
                      poweredByHeader: ae.poweredByHeader,
                      result: t,
                      cacheControl: { revalidate: 0, expire: void 0 },
                    })
                  );
                let v = new TransformStream();
                return (
                  t.push(v.readable),
                  m({
                    span: c,
                    postponed: q.postponed,
                    fallbackRouteParams: null,
                  })
                    .then(async (a) => {
                      var b, c;
                      if (!a)
                        throw Object.defineProperty(
                          Error("Invariant: expected a result to be returned"),
                          "__NEXT_ERROR_CODE",
                          { value: "E463", enumerable: !1, configurable: !0 },
                        );
                      if (
                        (null == (b = a.value) ? void 0 : b.kind) !==
                        w.CachedRouteKind.APP_PAGE
                      )
                        throw Object.defineProperty(
                          Error(
                            `Invariant: expected a page response, got ${null == (c = a.value) ? void 0 : c.kind}`,
                          ),
                          "__NEXT_ERROR_CODE",
                          { value: "E305", enumerable: !1, configurable: !0 },
                        );
                      await a.value.html.pipeTo(v.writable);
                    })
                    .catch((a) => {
                      v.writable.abort(a).catch((a) => {
                        console.error("couldn't abort transformer", a);
                      });
                    }),
                  (0, B.sendRenderResult)({
                    req: a,
                    res: b,
                    generateEtags: ae.generateEtags,
                    poweredByHeader: ae.poweredByHeader,
                    result: t,
                    cacheControl: { revalidate: 0, expire: void 0 },
                  })
                );
              };
            if (!aG)
              return await aF.withPropagatedContext(a.headers, () =>
                aF.trace(
                  i.BaseServerSpan.handleRequest,
                  {
                    spanName: `${aE} ${a.url}`,
                    kind: g.SpanKind.SERVER,
                    attributes: { "http.method": aE, "http.target": a.url },
                  },
                  p,
                ),
              );
            await p(aG);
          } catch (b) {
            throw (
              b instanceof C.NoFallbackError ||
                (await L.onRequestError(
                  a,
                  b,
                  {
                    routerKind: "App Router",
                    routePath: H,
                    routeType: "render",
                    revalidateReason: (0, f.c)({
                      isRevalidate: al,
                      isOnDemandRevalidate: ai,
                    }),
                  },
                  ad,
                )),
              b
            );
          }
        }
      },
      63033: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");
      },
      67399: (a, b, c) => {
        Promise.resolve().then(c.bind(c, 26294));
      },
      69680: (a, b, c) => {
        "use strict";
        c.d(b, { p: () => g });
        var d = c(78157),
          e = c(31768),
          f = c(10573);
        let g = e.forwardRef(({ className: a, type: b, ...c }, e) =>
          (0, d.jsx)("input", {
            type: b,
            className: (0, f.cn)(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              a,
            ),
            ref: e,
            ...c,
          }),
        );
        g.displayName = "Input";
      },
      79255: (a, b, c) => {
        "use strict";
        (c.r(b), c.d(b, { default: () => k }));
        var d = c(78157),
          e = c(90868),
          f = c(49170),
          g = c(69680),
          h = c(5510),
          i = c(41406),
          j = c(12142);
        function k() {
          return (0, d.jsxs)("div", {
            className: "space-y-6",
            children: [
              (0, d.jsxs)("div", {
                className: "flex items-center gap-2",
                children: [
                  (0, d.jsx)(i.A, { className: "h-5 w-5" }),
                  (0, d.jsxs)("div", {
                    children: [
                      (0, d.jsx)("h1", {
                        className: "text-2xl font-bold tracking-tight",
                        children: "Settings",
                      }),
                      (0, d.jsx)("p", {
                        className: "text-sm text-muted-foreground",
                        children: "Manage your account settings",
                      }),
                    ],
                  }),
                ],
              }),
              (0, d.jsxs)(e.Zp, {
                children: [
                  (0, d.jsx)(e.aR, {
                    children: (0, d.jsx)(e.ZB, {
                      className: "text-lg",
                      children: "Profile",
                    }),
                  }),
                  (0, d.jsxs)(e.Wu, {
                    className: "space-y-4",
                    children: [
                      (0, d.jsxs)("div", {
                        className: "grid grid-cols-2 gap-4",
                        children: [
                          (0, d.jsxs)("div", {
                            className: "space-y-2",
                            children: [
                              (0, d.jsx)(h.J, {
                                htmlFor: "name",
                                children: "Name",
                              }),
                              (0, d.jsx)(g.p, {
                                id: "name",
                                defaultValue: "Alice Johnson",
                              }),
                            ],
                          }),
                          (0, d.jsxs)("div", {
                            className: "space-y-2",
                            children: [
                              (0, d.jsx)(h.J, {
                                htmlFor: "email",
                                children: "Email",
                              }),
                              (0, d.jsx)(g.p, {
                                id: "email",
                                type: "email",
                                defaultValue: "alice@acme.com",
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, d.jsxs)(f.$, {
                        children: [
                          (0, d.jsx)(j.A, { className: "mr-1 h-4 w-4" }),
                          " Save Changes",
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (0, d.jsxs)(e.Zp, {
                children: [
                  (0, d.jsx)(e.aR, {
                    children: (0, d.jsx)(e.ZB, {
                      className: "text-lg",
                      children: "API Keys",
                    }),
                  }),
                  (0, d.jsx)(e.Wu, {
                    className: "space-y-3",
                    children: ["Production", "Development"].map((a) =>
                      (0, d.jsxs)(
                        "div",
                        {
                          className:
                            "flex items-center justify-between rounded-lg border p-3",
                          children: [
                            (0, d.jsxs)("div", {
                              children: [
                                (0, d.jsx)("p", {
                                  className: "text-sm font-medium",
                                  children: a,
                                }),
                                (0, d.jsxs)("p", {
                                  className:
                                    "text-xs text-muted-foreground font-mono",
                                  children: [
                                    "fc_",
                                    a.toLowerCase(),
                                    "_****a1b2",
                                  ],
                                }),
                              ],
                            }),
                            (0, d.jsx)(f.$, {
                              variant: "outline",
                              size: "sm",
                              children: "Regenerate",
                            }),
                          ],
                        },
                        a,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          });
        }
      },
      82466: (a, b, c) => {
        "use strict";
        (c.r(b), c.d(b, { default: () => f }));
        var d = c(5939),
          e = c(26294);
        function f({ children: a }) {
          return (0, d.jsx)(e.DashboardLayout, { children: a });
        }
      },
      86439: (a) => {
        "use strict";
        a.exports = require("next/dist/shared/lib/no-fallback-error.external");
      },
      90868: (a, b, c) => {
        "use strict";
        c.d(b, {
          BT: () => j,
          Wu: () => k,
          ZB: () => i,
          Zp: () => g,
          aR: () => h,
        });
        var d = c(78157),
          e = c(31768),
          f = c(10573);
        let g = e.forwardRef(({ className: a, ...b }, c) =>
          (0, d.jsx)("div", {
            ref: c,
            className: (0, f.cn)(
              "rounded-xl border bg-card text-card-foreground shadow-sm",
              a,
            ),
            ...b,
          }),
        );
        g.displayName = "Card";
        let h = e.forwardRef(({ className: a, ...b }, c) =>
          (0, d.jsx)("div", {
            ref: c,
            className: (0, f.cn)("flex flex-col space-y-1.5 p-6", a),
            ...b,
          }),
        );
        h.displayName = "CardHeader";
        let i = e.forwardRef(({ className: a, ...b }, c) =>
          (0, d.jsx)("div", {
            ref: c,
            className: (0, f.cn)(
              "font-semibold leading-none tracking-tight",
              a,
            ),
            ...b,
          }),
        );
        i.displayName = "CardTitle";
        let j = e.forwardRef(({ className: a, ...b }, c) =>
          (0, d.jsx)("div", {
            ref: c,
            className: (0, f.cn)("text-sm text-muted-foreground", a),
            ...b,
          }),
        );
        j.displayName = "CardDescription";
        let k = e.forwardRef(({ className: a, ...b }, c) =>
          (0, d.jsx)("div", {
            ref: c,
            className: (0, f.cn)("p-6 pt-0", a),
            ...b,
          }),
        );
        ((k.displayName = "CardContent"),
          (e.forwardRef(({ className: a, ...b }, c) =>
            (0, d.jsx)("div", {
              ref: c,
              className: (0, f.cn)("flex items-center p-6 pt-0", a),
              ...b,
            }),
          ).displayName = "CardFooter"));
      },
      92682: (a, b, c) => {
        Promise.resolve().then(c.bind(c, 54846));
      },
      97663: (a, b, c) => {
        Promise.resolve().then(c.bind(c, 6533));
      },
    }));
  var b = require("../../../webpack-runtime.js");
  b.C(a);
  var c = b.X(0, [474, 85, 360], () => b((b.s = 60808)));
  module.exports = c;
})();
