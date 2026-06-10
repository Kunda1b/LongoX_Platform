(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [943],
  {
    670: (e, s, r) => {
      "use strict";
      r.d(s, { A: () => t });
      let t = (0, r(2046).A)("trash-2", [
        ["path", { d: "M10 11v6", key: "nco0om" }],
        ["path", { d: "M14 11v6", key: "outv1u" }],
        [
          "path",
          { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" },
        ],
        ["path", { d: "M3 6h18", key: "d0wm0j" }],
        [
          "path",
          { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" },
        ],
      ]);
    },
    2031: (e, s, r) => {
      "use strict";
      r.d(s, { A: () => t });
      let t = (0, r(2046).A)("play", [
        [
          "path",
          {
            d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
            key: "10ikf1",
          },
        ],
      ]);
    },
    5400: (e, s, r) => {
      "use strict";
      r.d(s, { $: () => c });
      var t = r(4568),
        a = r(7620),
        d = r(6118),
        n = r(4616),
        i = r(5703);
      let l = (0, n.F)(
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
        c = a.forwardRef((e, s) => {
          let { className: r, variant: a, size: n, asChild: c = !1, ...o } = e,
            x = c ? d.DX : "button";
          return (0, t.jsx)(x, {
            className: (0, i.cn)(l({ variant: a, size: n, className: r })),
            ref: s,
            ...o,
          });
        });
      c.displayName = "Button";
    },
    5703: (e, s, r) => {
      "use strict";
      r.d(s, { cn: () => d });
      var t = r(2902),
        a = r(3714);
      function d() {
        for (var e = arguments.length, s = Array(e), r = 0; r < e; r++)
          s[r] = arguments[r];
        return (0, a.QP)((0, t.$)(s));
      }
    },
    8186: (e, s, r) => {
      "use strict";
      r.d(s, {
        BT: () => c,
        Wu: () => o,
        ZB: () => l,
        Zp: () => n,
        aR: () => i,
      });
      var t = r(4568),
        a = r(7620),
        d = r(5703);
      let n = a.forwardRef((e, s) => {
        let { className: r, ...a } = e;
        return (0, t.jsx)("div", {
          ref: s,
          className: (0, d.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            r,
          ),
          ...a,
        });
      });
      n.displayName = "Card";
      let i = a.forwardRef((e, s) => {
        let { className: r, ...a } = e;
        return (0, t.jsx)("div", {
          ref: s,
          className: (0, d.cn)("flex flex-col space-y-1.5 p-6", r),
          ...a,
        });
      });
      i.displayName = "CardHeader";
      let l = a.forwardRef((e, s) => {
        let { className: r, ...a } = e;
        return (0, t.jsx)("div", {
          ref: s,
          className: (0, d.cn)("font-semibold leading-none tracking-tight", r),
          ...a,
        });
      });
      l.displayName = "CardTitle";
      let c = a.forwardRef((e, s) => {
        let { className: r, ...a } = e;
        return (0, t.jsx)("div", {
          ref: s,
          className: (0, d.cn)("text-sm text-muted-foreground", r),
          ...a,
        });
      });
      c.displayName = "CardDescription";
      let o = a.forwardRef((e, s) => {
        let { className: r, ...a } = e;
        return (0, t.jsx)("div", {
          ref: s,
          className: (0, d.cn)("p-6 pt-0", r),
          ...a,
        });
      });
      ((o.displayName = "CardContent"),
        (a.forwardRef((e, s) => {
          let { className: r, ...a } = e;
          return (0, t.jsx)("div", {
            ref: s,
            className: (0, d.cn)("flex items-center p-6 pt-0", r),
            ...a,
          });
        }).displayName = "CardFooter"));
    },
    8537: (e, s, r) => {
      Promise.resolve().then(r.bind(r, 8866));
    },
    8866: (e, s, r) => {
      "use strict";
      (r.r(s), r.d(s, { default: () => f }));
      var t = r(4568),
        a = r(7620),
        d = r(8186),
        n = r(9977),
        i = r(5400),
        l = r(2046);
      let c = (0, l.A)("square-pen", [
          [
            "path",
            {
              d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
              key: "1m0v6g",
            },
          ],
          [
            "path",
            {
              d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",
              key: "ohrbg2",
            },
          ],
        ]),
        o = (0, l.A)("pause", [
          [
            "rect",
            {
              x: "14",
              y: "3",
              width: "5",
              height: "18",
              rx: "1",
              key: "kaeet6",
            },
          ],
          [
            "rect",
            {
              x: "5",
              y: "3",
              width: "5",
              height: "18",
              rx: "1",
              key: "1wsw3u",
            },
          ],
        ]);
      var x = r(2031),
        u = r(670),
        m = r(9664),
        h = r.n(m);
      function f(e) {
        let { params: s } = e,
          { id: r } = (0, a.use)(s);
        return (0, t.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, t.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, t.jsx)("div", {
                  className: "flex items-center gap-3",
                  children: (0, t.jsxs)("div", {
                    children: [
                      (0, t.jsx)("h1", {
                        className: "text-2xl font-bold tracking-tight",
                        children: "Order Processing",
                      }),
                      (0, t.jsxs)("div", {
                        className:
                          "flex items-center gap-2 text-sm text-muted-foreground",
                        children: [
                          (0, t.jsxs)("span", { children: ["ID: ", r] }),
                          (0, t.jsx)(n.E, {
                            variant: "success",
                            children: "active",
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
                (0, t.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [
                    (0, t.jsx)(i.$, {
                      variant: "outline",
                      size: "sm",
                      asChild: !0,
                      children: (0, t.jsxs)(h(), {
                        href: "/builder/".concat(r),
                        children: [
                          (0, t.jsx)(c, { className: "mr-1 h-4 w-4" }),
                          " Edit",
                        ],
                      }),
                    }),
                    (0, t.jsxs)(i.$, {
                      variant: "outline",
                      size: "sm",
                      children: [
                        (0, t.jsx)(o, { className: "mr-1 h-4 w-4" }),
                        " Pause",
                      ],
                    }),
                    (0, t.jsxs)(i.$, {
                      size: "sm",
                      children: [
                        (0, t.jsx)(x.A, { className: "mr-1 h-4 w-4" }),
                        " Run",
                      ],
                    }),
                    (0, t.jsx)(i.$, {
                      variant: "destructive",
                      size: "sm",
                      children: (0, t.jsx)(u.A, { className: "h-4 w-4" }),
                    }),
                  ],
                }),
              ],
            }),
            (0, t.jsxs)("div", {
              className: "grid gap-4 md:grid-cols-3",
              children: [
                (0, t.jsxs)(d.Zp, {
                  children: [
                    (0, t.jsx)(d.aR, {
                      className: "pb-2",
                      children: (0, t.jsx)(d.ZB, {
                        className: "text-sm",
                        children: "Total Runs",
                      }),
                    }),
                    (0, t.jsx)(d.Wu, {
                      children: (0, t.jsx)("div", {
                        className: "text-2xl font-bold",
                        children: "142",
                      }),
                    }),
                  ],
                }),
                (0, t.jsxs)(d.Zp, {
                  children: [
                    (0, t.jsx)(d.aR, {
                      className: "pb-2",
                      children: (0, t.jsx)(d.ZB, {
                        className: "text-sm",
                        children: "Success Rate",
                      }),
                    }),
                    (0, t.jsx)(d.Wu, {
                      children: (0, t.jsx)("div", {
                        className: "text-2xl font-bold",
                        children: "98.6%",
                      }),
                    }),
                  ],
                }),
                (0, t.jsxs)(d.Zp, {
                  children: [
                    (0, t.jsx)(d.aR, {
                      className: "pb-2",
                      children: (0, t.jsx)(d.ZB, {
                        className: "text-sm",
                        children: "Last Run",
                      }),
                    }),
                    (0, t.jsx)(d.Wu, {
                      children: (0, t.jsx)("div", {
                        className: "text-2xl font-bold",
                        children: "2h ago",
                      }),
                    }),
                  ],
                }),
              ],
            }),
            (0, t.jsxs)(d.Zp, {
              children: [
                (0, t.jsx)(d.aR, {
                  children: (0, t.jsx)(d.ZB, {
                    className: "text-lg",
                    children: "Workflow Overview",
                  }),
                }),
                (0, t.jsxs)(d.Wu, {
                  className: "space-y-4",
                  children: [
                    (0, t.jsxs)("div", {
                      className: "grid grid-cols-2 gap-4 text-sm",
                      children: [
                        (0, t.jsxs)("div", {
                          children: [
                            (0, t.jsx)("span", {
                              className: "text-muted-foreground",
                              children: "Created:",
                            }),
                            " Jan 15, 2026",
                          ],
                        }),
                        (0, t.jsxs)("div", {
                          children: [
                            (0, t.jsx)("span", {
                              className: "text-muted-foreground",
                              children: "Updated:",
                            }),
                            " 2 hours ago",
                          ],
                        }),
                        (0, t.jsxs)("div", {
                          children: [
                            (0, t.jsx)("span", {
                              className: "text-muted-foreground",
                              children: "Connector:",
                            }),
                            " Slack, Postgres",
                          ],
                        }),
                        (0, t.jsxs)("div", {
                          children: [
                            (0, t.jsx)("span", {
                              className: "text-muted-foreground",
                              children: "Schedule:",
                            }),
                            " Every 15 minutes",
                          ],
                        }),
                      ],
                    }),
                    (0, t.jsx)("div", {
                      className: "rounded-lg border bg-muted/30 p-4",
                      children: (0, t.jsx)("p", {
                        className: "text-sm text-muted-foreground",
                        children:
                          "This workflow processes incoming orders from the API endpoint, validates them against the database, and sends notifications via Slack.",
                      }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      }
    },
    9977: (e, s, r) => {
      "use strict";
      r.d(s, { E: () => i });
      var t = r(4568);
      r(7620);
      var a = r(4616),
        d = r(5703);
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
        let { className: s, variant: r, ...a } = e;
        return (0, t.jsx)("div", {
          className: (0, d.cn)(n({ variant: r }), s),
          ...a,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 697, 587, 18, 358], () => e((e.s = 8537))), (_N_E = e.O()));
  },
]);
