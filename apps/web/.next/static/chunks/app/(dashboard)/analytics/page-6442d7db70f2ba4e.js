(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [817],
  {
    767: (e, t, s) => {
      "use strict";
      (s.r(t), s.d(t, { default: () => o }));
      var r = s(4568),
        a = s(8186),
        l = s(6584),
        d = s(3615),
        n = s(2046);
      let c = (0, n.A)("clock", [
          ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }],
          ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
        ]),
        i = (0, n.A)("trending-up", [
          ["path", { d: "M16 7h6v6", key: "box55l" }],
          ["path", { d: "m22 7-8.5 8.5-5-5L2 17", key: "1t1m79" }],
        ]);
      function o() {
        return (0, r.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, r.jsxs)("div", {
              children: [
                (0, r.jsx)("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: "Analytics",
                }),
                (0, r.jsx)("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Usage and performance metrics",
                }),
              ],
            }),
            (0, r.jsxs)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
              children: [
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsxs)(a.aR, {
                      className:
                        "flex flex-row items-center justify-between pb-2",
                      children: [
                        (0, r.jsx)(a.ZB, {
                          className: "text-sm font-medium",
                          children: "Total Executions",
                        }),
                        (0, r.jsx)(l.A, {
                          className: "h-4 w-4 text-muted-foreground",
                        }),
                      ],
                    }),
                    (0, r.jsxs)(a.Wu, {
                      children: [
                        (0, r.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "12,483",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "+12% from last month",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsxs)(a.aR, {
                      className:
                        "flex flex-row items-center justify-between pb-2",
                      children: [
                        (0, r.jsx)(a.ZB, {
                          className: "text-sm font-medium",
                          children: "Active Users",
                        }),
                        (0, r.jsx)(d.A, {
                          className: "h-4 w-4 text-muted-foreground",
                        }),
                      ],
                    }),
                    (0, r.jsxs)(a.Wu, {
                      children: [
                        (0, r.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "24",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "+3 this week",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsxs)(a.aR, {
                      className:
                        "flex flex-row items-center justify-between pb-2",
                      children: [
                        (0, r.jsx)(a.ZB, {
                          className: "text-sm font-medium",
                          children: "Avg. Duration",
                        }),
                        (0, r.jsx)(c, {
                          className: "h-4 w-4 text-muted-foreground",
                        }),
                      ],
                    }),
                    (0, r.jsxs)(a.Wu, {
                      children: [
                        (0, r.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "8.2s",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "-0.5s from last week",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsxs)(a.aR, {
                      className:
                        "flex flex-row items-center justify-between pb-2",
                      children: [
                        (0, r.jsx)(a.ZB, {
                          className: "text-sm font-medium",
                          children: "Success Rate",
                        }),
                        (0, r.jsx)(i, {
                          className: "h-4 w-4 text-muted-foreground",
                        }),
                      ],
                    }),
                    (0, r.jsxs)(a.Wu, {
                      children: [
                        (0, r.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "98.3%",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "+0.2% from last month",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, r.jsxs)(a.Zp, {
              children: [
                (0, r.jsx)(a.aR, {
                  children: (0, r.jsx)(a.ZB, {
                    className: "text-lg",
                    children: "Execution Volume (Last 7 days)",
                  }),
                }),
                (0, r.jsx)(a.Wu, {
                  children: (0, r.jsx)("div", {
                    className: "flex h-48 items-end gap-2",
                    children: [40, 70, 55, 90, 65, 80, 45].map((e, t) =>
                      (0, r.jsxs)(
                        "div",
                        {
                          className: "flex flex-1 flex-col items-center gap-1",
                          children: [
                            (0, r.jsx)("div", {
                              className:
                                "w-full rounded-md bg-primary/20 transition-all hover:bg-primary/30",
                              style: { height: "".concat(2 * e, "px") },
                            }),
                            (0, r.jsx)("span", {
                              className: "text-xs text-muted-foreground",
                              children: [
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat",
                                "Sun",
                              ][t],
                            }),
                          ],
                        },
                        t,
                      ),
                    ),
                  }),
                }),
              ],
            }),
          ],
        });
      }
    },
    2046: (e, t, s) => {
      "use strict";
      s.d(t, { A: () => c });
      var r = s(7620);
      let a = (e) => {
          let t = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, s) =>
            s ? s.toUpperCase() : t.toLowerCase(),
          );
          return t.charAt(0).toUpperCase() + t.slice(1);
        },
        l = function () {
          for (var e = arguments.length, t = Array(e), s = 0; s < e; s++)
            t[s] = arguments[s];
          return t
            .filter((e, t, s) => !!e && "" !== e.trim() && s.indexOf(e) === t)
            .join(" ")
            .trim();
        };
      var d = {
        xmlns: "http://www.w3.org/2000/svg",
        width: 24,
        height: 24,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      };
      let n = (0, r.forwardRef)((e, t) => {
          let {
            color: s = "currentColor",
            size: a = 24,
            strokeWidth: n = 2,
            absoluteStrokeWidth: c,
            className: i = "",
            children: o,
            iconNode: x,
            ...m
          } = e;
          return (0, r.createElement)(
            "svg",
            {
              ref: t,
              ...d,
              width: a,
              height: a,
              stroke: s,
              strokeWidth: c ? (24 * Number(n)) / Number(a) : n,
              className: l("lucide", i),
              ...(!o &&
                !((e) => {
                  for (let t in e)
                    if (t.startsWith("aria-") || "role" === t || "title" === t)
                      return !0;
                })(m) && { "aria-hidden": "true" }),
              ...m,
            },
            [
              ...x.map((e) => {
                let [t, s] = e;
                return (0, r.createElement)(t, s);
              }),
              ...(Array.isArray(o) ? o : [o]),
            ],
          );
        }),
        c = (e, t) => {
          let s = (0, r.forwardRef)((s, d) => {
            let { className: c, ...i } = s;
            return (0, r.createElement)(n, {
              ref: d,
              iconNode: t,
              className: l(
                "lucide-".concat(
                  a(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                c,
              ),
              ...i,
            });
          });
          return ((s.displayName = a(e)), s);
        };
    },
    3615: (e, t, s) => {
      "use strict";
      s.d(t, { A: () => r });
      let r = (0, s(2046).A)("users", [
        [
          "path",
          { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" },
        ],
        ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
        ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
        ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
      ]);
    },
    4147: (e, t, s) => {
      Promise.resolve().then(s.bind(s, 767));
    },
    5703: (e, t, s) => {
      "use strict";
      s.d(t, { cn: () => l });
      var r = s(2902),
        a = s(3714);
      function l() {
        for (var e = arguments.length, t = Array(e), s = 0; s < e; s++)
          t[s] = arguments[s];
        return (0, a.QP)((0, r.$)(t));
      }
    },
    6584: (e, t, s) => {
      "use strict";
      s.d(t, { A: () => r });
      let r = (0, s(2046).A)("chart-column", [
        ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
        ["path", { d: "M18 17V9", key: "2bz60n" }],
        ["path", { d: "M13 17V5", key: "1frdt8" }],
        ["path", { d: "M8 17v-3", key: "17ska0" }],
      ]);
    },
    8186: (e, t, s) => {
      "use strict";
      s.d(t, {
        BT: () => i,
        Wu: () => o,
        ZB: () => c,
        Zp: () => d,
        aR: () => n,
      });
      var r = s(4568),
        a = s(7620),
        l = s(5703);
      let d = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            s,
          ),
          ...a,
        });
      });
      d.displayName = "Card";
      let n = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)("flex flex-col space-y-1.5 p-6", s),
          ...a,
        });
      });
      n.displayName = "CardHeader";
      let c = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)("font-semibold leading-none tracking-tight", s),
          ...a,
        });
      });
      c.displayName = "CardTitle";
      let i = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)("text-sm text-muted-foreground", s),
          ...a,
        });
      });
      i.displayName = "CardDescription";
      let o = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)("p-6 pt-0", s),
          ...a,
        });
      });
      ((o.displayName = "CardContent"),
        (a.forwardRef((e, t) => {
          let { className: s, ...a } = e;
          return (0, r.jsx)("div", {
            ref: t,
            className: (0, l.cn)("flex items-center p-6 pt-0", s),
            ...a,
          });
        }).displayName = "CardFooter"));
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 4147))), (_N_E = e.O()));
  },
]);
