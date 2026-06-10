(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [672],
  {
    461: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => x }));
      var s = t(4568),
        a = t(9977),
        n = t(5400),
        d = t(1063),
        o = t(6380),
        i = t(2381),
        l = t(9664),
        c = t.n(l);
      let u = [
        {
          id: "exec-001",
          workflow: "Order Processing",
          status: "completed",
          started: "2 min ago",
          duration: "12s",
        },
        {
          id: "exec-002",
          workflow: "Data Sync Pipeline",
          status: "running",
          started: "30s ago",
          duration: "...",
        },
        {
          id: "exec-003",
          workflow: "Email Notification",
          status: "failed",
          started: "1h ago",
          duration: "8s",
        },
        {
          id: "exec-004",
          workflow: "Slack Alerting",
          status: "queued",
          started: "just now",
          duration: "-",
        },
      ];
      function x() {
        return (0, s.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, s.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, s.jsxs)("div", {
                  children: [
                    (0, s.jsx)("h1", {
                      className: "text-2xl font-bold tracking-tight",
                      children: "Executions",
                    }),
                    (0, s.jsx)("p", {
                      className: "text-sm text-muted-foreground",
                      children: "View and manage workflow executions",
                    }),
                  ],
                }),
                (0, s.jsxs)(n.$, {
                  variant: "outline",
                  size: "sm",
                  children: [
                    (0, s.jsx)(o.A, { className: "mr-1 h-4 w-4" }),
                    " Refresh",
                  ],
                }),
              ],
            }),
            (0, s.jsxs)("div", {
              className: "relative w-full max-w-sm",
              children: [
                (0, s.jsx)(i.A, {
                  className:
                    "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                }),
                (0, s.jsx)(d.p, {
                  placeholder: "Search executions...",
                  className: "pl-9",
                }),
              ],
            }),
            (0, s.jsxs)("div", {
              className: "rounded-lg border",
              children: [
                (0, s.jsxs)("div", {
                  className:
                    "grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground",
                  children: [
                    (0, s.jsx)("div", {
                      className: "col-span-3",
                      children: "ID",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-3",
                      children: "Workflow",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-2",
                      children: "Status",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-2",
                      children: "Started",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-2",
                      children: "Duration",
                    }),
                  ],
                }),
                u.map((e) =>
                  (0, s.jsx)(
                    c(),
                    {
                      href: "/executions/".concat(e.id),
                      children: (0, s.jsxs)("div", {
                        className:
                          "grid cursor-pointer grid-cols-12 gap-4 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/30 last:border-0",
                        children: [
                          (0, s.jsx)("div", {
                            className: "col-span-3 font-mono text-xs",
                            children: e.id,
                          }),
                          (0, s.jsx)("div", {
                            className: "col-span-3",
                            children: e.workflow,
                          }),
                          (0, s.jsx)("div", {
                            className: "col-span-2",
                            children: (0, s.jsx)(a.E, {
                              variant:
                                "completed" === e.status
                                  ? "success"
                                  : "running" === e.status
                                    ? "info"
                                    : "failed" === e.status
                                      ? "destructive"
                                      : "secondary",
                              children: e.status,
                            }),
                          }),
                          (0, s.jsx)("div", {
                            className: "col-span-2 text-muted-foreground",
                            children: e.started,
                          }),
                          (0, s.jsx)("div", {
                            className: "col-span-2 text-muted-foreground",
                            children: e.duration,
                          }),
                        ],
                      }),
                    },
                    e.id,
                  ),
                ),
              ],
            }),
          ],
        });
      }
    },
    1063: (e, r, t) => {
      "use strict";
      t.d(r, { p: () => d });
      var s = t(4568),
        a = t(7620),
        n = t(5703);
      let d = a.forwardRef((e, r) => {
        let { className: t, type: a, ...d } = e;
        return (0, s.jsx)("input", {
          type: a,
          className: (0, n.cn)(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            t,
          ),
          ref: r,
          ...d,
        });
      });
      d.displayName = "Input";
    },
    2381: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => s });
      let s = (0, t(2046).A)("search", [
        ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
        ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
      ]);
    },
    4732: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 461));
    },
    5400: (e, r, t) => {
      "use strict";
      t.d(r, { $: () => l });
      var s = t(4568),
        a = t(7620),
        n = t(6118),
        d = t(4616),
        o = t(5703);
      let i = (0, d.F)(
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
        l = a.forwardRef((e, r) => {
          let { className: t, variant: a, size: d, asChild: l = !1, ...c } = e,
            u = l ? n.DX : "button";
          return (0, s.jsx)(u, {
            className: (0, o.cn)(i({ variant: a, size: d, className: t })),
            ref: r,
            ...c,
          });
        });
      l.displayName = "Button";
    },
    5703: (e, r, t) => {
      "use strict";
      t.d(r, { cn: () => n });
      var s = t(2902),
        a = t(3714);
      function n() {
        for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
          r[t] = arguments[t];
        return (0, a.QP)((0, s.$)(r));
      }
    },
    6380: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => s });
      let s = (0, t(2046).A)("rotate-ccw", [
        [
          "path",
          {
            d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
            key: "1357e3",
          },
        ],
        ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
      ]);
    },
    9977: (e, r, t) => {
      "use strict";
      t.d(r, { E: () => o });
      var s = t(4568);
      t(7620);
      var a = t(4616),
        n = t(5703);
      let d = (0, a.F)(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          variants: {
            variant: {
              default:
                "border-transparent bg-primary text-primary-foreground shadow",
              secondary:
                "border-transparent bg-secondary text-secondary-foreground",
              destructive:
                "border-transparent bg-destructive text-destructive-foreground shadow",
              outline: "text-foreground",
              success:
                "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
              warning:
                "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
              info: "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
            },
          },
          defaultVariants: { variant: "default" },
        },
      );
      function o(e) {
        let { className: r, variant: t, ...a } = e;
        return (0, s.jsx)("div", {
          className: (0, n.cn)(d({ variant: t }), r),
          ...a,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 697, 587, 18, 358], () => e((e.s = 4732))), (_N_E = e.O()));
  },
]);
