(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [468],
  {
    1063: (e, r, s) => {
      "use strict";
      s.d(r, { p: () => d });
      var t = s(4568),
        a = s(7620),
        n = s(5703);
      let d = a.forwardRef((e, r) => {
        let { className: s, type: a, ...d } = e;
        return (0, t.jsx)("input", {
          type: a,
          className: (0, n.cn)(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            s,
          ),
          ref: r,
          ...d,
        });
      });
      d.displayName = "Input";
    },
    2381: (e, r, s) => {
      "use strict";
      s.d(r, { A: () => t });
      let t = (0, s(2046).A)("search", [
        ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
        ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
      ]);
    },
    5400: (e, r, s) => {
      "use strict";
      s.d(r, { $: () => l });
      var t = s(4568),
        a = s(7620),
        n = s(6118),
        d = s(4616),
        o = s(5703);
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
          let { className: s, variant: a, size: d, asChild: l = !1, ...c } = e,
            u = l ? n.DX : "button";
          return (0, t.jsx)(u, {
            className: (0, o.cn)(i({ variant: a, size: d, className: s })),
            ref: r,
            ...c,
          });
        });
      l.displayName = "Button";
    },
    5703: (e, r, s) => {
      "use strict";
      s.d(r, { cn: () => n });
      var t = s(2902),
        a = s(3714);
      function n() {
        for (var e = arguments.length, r = Array(e), s = 0; s < e; s++)
          r[s] = arguments[s];
        return (0, a.QP)((0, t.$)(r));
      }
    },
    5792: (e, r, s) => {
      "use strict";
      (s.r(r), s.d(r, { default: () => m }));
      var t = s(4568),
        a = s(9977),
        n = s(5400),
        d = s(7801),
        o = s(2381),
        i = s(1063),
        l = s(9664),
        c = s.n(l);
      let u = [
        {
          id: "wf-1",
          name: "Order Processing",
          status: "active",
          updated: "2 hours ago",
          runs: 142,
        },
        {
          id: "wf-2",
          name: "Data Sync Pipeline",
          status: "active",
          updated: "5 hours ago",
          runs: 89,
        },
        {
          id: "wf-3",
          name: "Email Notification",
          status: "paused",
          updated: "1 day ago",
          runs: 34,
        },
        {
          id: "wf-4",
          name: "Slack Alerting",
          status: "draft",
          updated: "3 days ago",
          runs: 0,
        },
      ];
      function m() {
        return (0, t.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, t.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, t.jsxs)("div", {
                  children: [
                    (0, t.jsx)("h1", {
                      className: "text-2xl font-bold tracking-tight",
                      children: "Workflows",
                    }),
                    (0, t.jsx)("p", {
                      className: "text-sm text-muted-foreground",
                      children: "Manage your automation workflows",
                    }),
                  ],
                }),
                (0, t.jsx)(n.$, {
                  asChild: !0,
                  children: (0, t.jsxs)(c(), {
                    href: "/workflows/new",
                    children: [
                      (0, t.jsx)(d.A, { className: "mr-1 h-4 w-4" }),
                      " New Workflow",
                    ],
                  }),
                }),
              ],
            }),
            (0, t.jsxs)("div", {
              className: "relative w-full max-w-sm",
              children: [
                (0, t.jsx)(o.A, {
                  className:
                    "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                }),
                (0, t.jsx)(i.p, {
                  placeholder: "Search workflows...",
                  className: "pl-9",
                }),
              ],
            }),
            (0, t.jsxs)("div", {
              className: "rounded-lg border",
              children: [
                (0, t.jsxs)("div", {
                  className:
                    "grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground",
                  children: [
                    (0, t.jsx)("div", {
                      className: "col-span-4",
                      children: "Name",
                    }),
                    (0, t.jsx)("div", {
                      className: "col-span-2",
                      children: "Status",
                    }),
                    (0, t.jsx)("div", {
                      className: "col-span-2",
                      children: "Runs",
                    }),
                    (0, t.jsx)("div", {
                      className: "col-span-3",
                      children: "Updated",
                    }),
                    (0, t.jsx)("div", { className: "col-span-1" }),
                  ],
                }),
                u.map((e) =>
                  (0, t.jsx)(
                    c(),
                    {
                      href: "/workflows/".concat(e.id),
                      children: (0, t.jsxs)("div", {
                        className:
                          "grid cursor-pointer grid-cols-12 gap-4 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/30 last:border-0",
                        children: [
                          (0, t.jsx)("div", {
                            className: "col-span-4 font-medium",
                            children: e.name,
                          }),
                          (0, t.jsx)("div", {
                            className: "col-span-2",
                            children: (0, t.jsx)(a.E, {
                              variant:
                                "active" === e.status
                                  ? "success"
                                  : "paused" === e.status
                                    ? "warning"
                                    : "secondary",
                              children: e.status,
                            }),
                          }),
                          (0, t.jsx)("div", {
                            className: "col-span-2 text-muted-foreground",
                            children: e.runs,
                          }),
                          (0, t.jsx)("div", {
                            className: "col-span-3 text-muted-foreground",
                            children: e.updated,
                          }),
                          (0, t.jsx)("div", {
                            className: "col-span-1 text-right",
                            children: (0, t.jsxs)(n.$, {
                              variant: "ghost",
                              size: "icon",
                              className: "h-8 w-8",
                              children: [
                                (0, t.jsx)("span", {
                                  className: "sr-only",
                                  children: "Menu",
                                }),
                                "⋯",
                              ],
                            }),
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
    7801: (e, r, s) => {
      "use strict";
      s.d(r, { A: () => t });
      let t = (0, s(2046).A)("plus", [
        ["path", { d: "M5 12h14", key: "1ays0h" }],
        ["path", { d: "M12 5v14", key: "s699le" }],
      ]);
    },
    8705: (e, r, s) => {
      Promise.resolve().then(s.bind(s, 5792));
    },
    9977: (e, r, s) => {
      "use strict";
      s.d(r, { E: () => o });
      var t = s(4568);
      s(7620);
      var a = s(4616),
        n = s(5703);
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
        let { className: r, variant: s, ...a } = e;
        return (0, t.jsx)("div", {
          className: (0, n.cn)(d({ variant: s }), r),
          ...a,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 697, 587, 18, 358], () => e((e.s = 8705))), (_N_E = e.O()));
  },
]);
