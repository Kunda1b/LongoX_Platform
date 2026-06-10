(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [334],
  {
    31: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => f }));
      var s = t(4568),
        a = t(8186),
        d = t(9977),
        n = t(5400),
        i = t(7801),
        o = t(3328),
        l = t(9664),
        c = t.n(l);
      let u = [
        {
          name: "Operations Overview",
          widgets: 6,
          lastModified: "2 hours ago",
          shared: !0,
        },
        {
          name: "Executive Summary",
          widgets: 4,
          lastModified: "1 day ago",
          shared: !0,
        },
        {
          name: "Error Monitoring",
          widgets: 3,
          lastModified: "3 days ago",
          shared: !1,
        },
      ];
      function f() {
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
                      children: "Dashboards",
                    }),
                    (0, s.jsx)("p", {
                      className: "text-sm text-muted-foreground",
                      children: "Visualize workflow data and metrics",
                    }),
                  ],
                }),
                (0, s.jsx)(n.$, {
                  asChild: !0,
                  children: (0, s.jsxs)(c(), {
                    href: "/dashboards/new",
                    children: [
                      (0, s.jsx)(i.A, { className: "mr-1 h-4 w-4" }),
                      " New Dashboard",
                    ],
                  }),
                }),
              ],
            }),
            (0, s.jsx)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
              children: u.map((e) =>
                (0, s.jsxs)(
                  a.Zp,
                  {
                    className:
                      "cursor-pointer transition-colors hover:border-primary/50",
                    children: [
                      (0, s.jsxs)(a.aR, {
                        children: [
                          (0, s.jsx)(o.A, {
                            className: "h-5 w-5 text-primary",
                          }),
                          (0, s.jsx)(a.ZB, {
                            className: "mt-2 text-sm",
                            children: e.name,
                          }),
                          (0, s.jsxs)(a.BT, {
                            className: "text-xs",
                            children: [e.widgets, " widgets"],
                          }),
                        ],
                      }),
                      (0, s.jsxs)(a.Wu, {
                        className: "flex items-center justify-between",
                        children: [
                          (0, s.jsx)("span", {
                            className: "text-xs text-muted-foreground",
                            children: e.lastModified,
                          }),
                          (0, s.jsx)(d.E, {
                            variant: e.shared ? "info" : "secondary",
                            children: e.shared ? "Shared" : "Private",
                          }),
                        ],
                      }),
                    ],
                  },
                  e.name,
                ),
              ),
            }),
          ],
        });
      }
    },
    3106: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 31));
    },
    3328: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => s });
      let s = (0, t(2046).A)("palette", [
        [
          "path",
          {
            d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",
            key: "e79jfc",
          },
        ],
        [
          "circle",
          {
            cx: "13.5",
            cy: "6.5",
            r: ".5",
            fill: "currentColor",
            key: "1okk4w",
          },
        ],
        [
          "circle",
          {
            cx: "17.5",
            cy: "10.5",
            r: ".5",
            fill: "currentColor",
            key: "f64h9f",
          },
        ],
        [
          "circle",
          {
            cx: "6.5",
            cy: "12.5",
            r: ".5",
            fill: "currentColor",
            key: "qy21gx",
          },
        ],
        [
          "circle",
          {
            cx: "8.5",
            cy: "7.5",
            r: ".5",
            fill: "currentColor",
            key: "fotxhn",
          },
        ],
      ]);
    },
    5400: (e, r, t) => {
      "use strict";
      t.d(r, { $: () => l });
      var s = t(4568),
        a = t(7620),
        d = t(6118),
        n = t(4616),
        i = t(5703);
      let o = (0, n.F)(
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
          let { className: t, variant: a, size: n, asChild: l = !1, ...c } = e,
            u = l ? d.DX : "button";
          return (0, s.jsx)(u, {
            className: (0, i.cn)(o({ variant: a, size: n, className: t })),
            ref: r,
            ...c,
          });
        });
      l.displayName = "Button";
    },
    5703: (e, r, t) => {
      "use strict";
      t.d(r, { cn: () => d });
      var s = t(2902),
        a = t(3714);
      function d() {
        for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
          r[t] = arguments[t];
        return (0, a.QP)((0, s.$)(r));
      }
    },
    7801: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => s });
      let s = (0, t(2046).A)("plus", [
        ["path", { d: "M5 12h14", key: "1ays0h" }],
        ["path", { d: "M12 5v14", key: "s699le" }],
      ]);
    },
    8186: (e, r, t) => {
      "use strict";
      t.d(r, {
        BT: () => l,
        Wu: () => c,
        ZB: () => o,
        Zp: () => n,
        aR: () => i,
      });
      var s = t(4568),
        a = t(7620),
        d = t(5703);
      let n = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, s.jsx)("div", {
          ref: r,
          className: (0, d.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            t,
          ),
          ...a,
        });
      });
      n.displayName = "Card";
      let i = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, s.jsx)("div", {
          ref: r,
          className: (0, d.cn)("flex flex-col space-y-1.5 p-6", t),
          ...a,
        });
      });
      i.displayName = "CardHeader";
      let o = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, s.jsx)("div", {
          ref: r,
          className: (0, d.cn)("font-semibold leading-none tracking-tight", t),
          ...a,
        });
      });
      o.displayName = "CardTitle";
      let l = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, s.jsx)("div", {
          ref: r,
          className: (0, d.cn)("text-sm text-muted-foreground", t),
          ...a,
        });
      });
      l.displayName = "CardDescription";
      let c = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, s.jsx)("div", {
          ref: r,
          className: (0, d.cn)("p-6 pt-0", t),
          ...a,
        });
      });
      ((c.displayName = "CardContent"),
        (a.forwardRef((e, r) => {
          let { className: t, ...a } = e;
          return (0, s.jsx)("div", {
            ref: r,
            className: (0, d.cn)("flex items-center p-6 pt-0", t),
            ...a,
          });
        }).displayName = "CardFooter"));
    },
    9977: (e, r, t) => {
      "use strict";
      t.d(r, { E: () => i });
      var s = t(4568);
      t(7620);
      var a = t(4616),
        d = t(5703);
      let n = (0, a.F)(
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
      function i(e) {
        let { className: r, variant: t, ...a } = e;
        return (0, s.jsx)("div", {
          className: (0, d.cn)(n({ variant: t }), r),
          ...a,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 697, 587, 18, 358], () => e((e.s = 3106))), (_N_E = e.O()));
  },
]);
