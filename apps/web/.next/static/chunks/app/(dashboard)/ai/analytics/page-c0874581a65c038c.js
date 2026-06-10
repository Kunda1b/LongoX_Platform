(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [70],
  {
    27: (e, s, t) => {
      "use strict";
      (t.r(s), t.d(s, { default: () => i }));
      var r = t(4568),
        a = t(8186),
        l = t(6584),
        d = t(2840),
        c = t(2079);
      let n = (0, t(2046).A)("zap", [
        [
          "path",
          {
            d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
            key: "1xq2db",
          },
        ],
      ]);
      function i() {
        return (0, r.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, r.jsxs)("div", {
              children: [
                (0, r.jsx)("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: "AI Analytics",
                }),
                (0, r.jsx)("p", {
                  className: "text-sm text-muted-foreground",
                  children: "AI usage and cost metrics",
                }),
              ],
            }),
            (0, r.jsxs)("div", {
              className: "grid gap-4 md:grid-cols-4",
              children: [
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsx)(a.aR, {
                      className: "pb-2",
                      children: (0, r.jsx)(a.ZB, {
                        className: "text-sm",
                        children: "Total Requests",
                      }),
                    }),
                    (0, r.jsx)(a.Wu, {
                      children: (0, r.jsxs)("div", {
                        className: "flex items-center gap-2",
                        children: [
                          (0, r.jsx)(l.A, {
                            className: "h-4 w-4 text-muted-foreground",
                          }),
                          (0, r.jsx)("div", {
                            className: "text-2xl font-bold",
                            children: "45.2K",
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsx)(a.aR, {
                      className: "pb-2",
                      children: (0, r.jsx)(a.ZB, {
                        className: "text-sm",
                        children: "Avg Tokens",
                      }),
                    }),
                    (0, r.jsx)(a.Wu, {
                      children: (0, r.jsxs)("div", {
                        className: "flex items-center gap-2",
                        children: [
                          (0, r.jsx)(d.A, {
                            className: "h-4 w-4 text-muted-foreground",
                          }),
                          (0, r.jsx)("div", {
                            className: "text-2xl font-bold",
                            children: "1,234",
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsx)(a.aR, {
                      className: "pb-2",
                      children: (0, r.jsx)(a.ZB, {
                        className: "text-sm",
                        children: "Total Cost",
                      }),
                    }),
                    (0, r.jsx)(a.Wu, {
                      children: (0, r.jsxs)("div", {
                        className: "flex items-center gap-2",
                        children: [
                          (0, r.jsx)(c.A, {
                            className: "h-4 w-4 text-muted-foreground",
                          }),
                          (0, r.jsx)("div", {
                            className: "text-2xl font-bold",
                            children: "$89.42",
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsx)(a.aR, {
                      className: "pb-2",
                      children: (0, r.jsx)(a.ZB, {
                        className: "text-sm",
                        children: "Avg Latency",
                      }),
                    }),
                    (0, r.jsx)(a.Wu, {
                      children: (0, r.jsxs)("div", {
                        className: "flex items-center gap-2",
                        children: [
                          (0, r.jsx)(n, {
                            className: "h-4 w-4 text-muted-foreground",
                          }),
                          (0, r.jsx)("div", {
                            className: "text-2xl font-bold",
                            children: "1.4s",
                          }),
                        ],
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
    2046: (e, s, t) => {
      "use strict";
      t.d(s, { A: () => n });
      var r = t(7620);
      let a = (e) => {
          let s = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, s, t) =>
            t ? t.toUpperCase() : s.toLowerCase(),
          );
          return s.charAt(0).toUpperCase() + s.slice(1);
        },
        l = function () {
          for (var e = arguments.length, s = Array(e), t = 0; t < e; t++)
            s[t] = arguments[t];
          return s
            .filter((e, s, t) => !!e && "" !== e.trim() && t.indexOf(e) === s)
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
      let c = (0, r.forwardRef)((e, s) => {
          let {
            color: t = "currentColor",
            size: a = 24,
            strokeWidth: c = 2,
            absoluteStrokeWidth: n,
            className: i = "",
            children: o,
            iconNode: x,
            ...m
          } = e;
          return (0, r.createElement)(
            "svg",
            {
              ref: s,
              ...d,
              width: a,
              height: a,
              stroke: t,
              strokeWidth: n ? (24 * Number(c)) / Number(a) : c,
              className: l("lucide", i),
              ...(!o &&
                !((e) => {
                  for (let s in e)
                    if (s.startsWith("aria-") || "role" === s || "title" === s)
                      return !0;
                })(m) && { "aria-hidden": "true" }),
              ...m,
            },
            [
              ...x.map((e) => {
                let [s, t] = e;
                return (0, r.createElement)(s, t);
              }),
              ...(Array.isArray(o) ? o : [o]),
            ],
          );
        }),
        n = (e, s) => {
          let t = (0, r.forwardRef)((t, d) => {
            let { className: n, ...i } = t;
            return (0, r.createElement)(c, {
              ref: d,
              iconNode: s,
              className: l(
                "lucide-".concat(
                  a(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                n,
              ),
              ...i,
            });
          });
          return ((t.displayName = a(e)), t);
        };
    },
    2079: (e, s, t) => {
      "use strict";
      t.d(s, { A: () => r });
      let r = (0, t(2046).A)("dollar-sign", [
        ["line", { x1: "12", x2: "12", y1: "2", y2: "22", key: "7eqyqh" }],
        [
          "path",
          {
            d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
            key: "1b0p4s",
          },
        ],
      ]);
    },
    2588: (e, s, t) => {
      Promise.resolve().then(t.bind(t, 27));
    },
    2840: (e, s, t) => {
      "use strict";
      t.d(s, { A: () => r });
      let r = (0, t(2046).A)("activity", [
        [
          "path",
          {
            d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
            key: "169zse",
          },
        ],
      ]);
    },
    5703: (e, s, t) => {
      "use strict";
      t.d(s, { cn: () => l });
      var r = t(2902),
        a = t(3714);
      function l() {
        for (var e = arguments.length, s = Array(e), t = 0; t < e; t++)
          s[t] = arguments[t];
        return (0, a.QP)((0, r.$)(s));
      }
    },
    6584: (e, s, t) => {
      "use strict";
      t.d(s, { A: () => r });
      let r = (0, t(2046).A)("chart-column", [
        ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
        ["path", { d: "M18 17V9", key: "2bz60n" }],
        ["path", { d: "M13 17V5", key: "1frdt8" }],
        ["path", { d: "M8 17v-3", key: "17ska0" }],
      ]);
    },
    8186: (e, s, t) => {
      "use strict";
      t.d(s, {
        BT: () => i,
        Wu: () => o,
        ZB: () => n,
        Zp: () => d,
        aR: () => c,
      });
      var r = t(4568),
        a = t(7620),
        l = t(5703);
      let d = a.forwardRef((e, s) => {
        let { className: t, ...a } = e;
        return (0, r.jsx)("div", {
          ref: s,
          className: (0, l.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            t,
          ),
          ...a,
        });
      });
      d.displayName = "Card";
      let c = a.forwardRef((e, s) => {
        let { className: t, ...a } = e;
        return (0, r.jsx)("div", {
          ref: s,
          className: (0, l.cn)("flex flex-col space-y-1.5 p-6", t),
          ...a,
        });
      });
      c.displayName = "CardHeader";
      let n = a.forwardRef((e, s) => {
        let { className: t, ...a } = e;
        return (0, r.jsx)("div", {
          ref: s,
          className: (0, l.cn)("font-semibold leading-none tracking-tight", t),
          ...a,
        });
      });
      n.displayName = "CardTitle";
      let i = a.forwardRef((e, s) => {
        let { className: t, ...a } = e;
        return (0, r.jsx)("div", {
          ref: s,
          className: (0, l.cn)("text-sm text-muted-foreground", t),
          ...a,
        });
      });
      i.displayName = "CardDescription";
      let o = a.forwardRef((e, s) => {
        let { className: t, ...a } = e;
        return (0, r.jsx)("div", {
          ref: s,
          className: (0, l.cn)("p-6 pt-0", t),
          ...a,
        });
      });
      ((o.displayName = "CardContent"),
        (a.forwardRef((e, s) => {
          let { className: t, ...a } = e;
          return (0, r.jsx)("div", {
            ref: s,
            className: (0, l.cn)("flex items-center p-6 pt-0", t),
            ...a,
          });
        }).displayName = "CardFooter"));
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 2588))), (_N_E = e.O()));
  },
]);
