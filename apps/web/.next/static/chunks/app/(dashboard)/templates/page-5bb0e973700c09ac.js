(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [702],
  {
    548: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => a });
      let a = (0, t(2046).A)("layout-template", [
        [
          "rect",
          { width: "18", height: "7", x: "3", y: "3", rx: "1", key: "f1a2em" },
        ],
        [
          "rect",
          { width: "9", height: "7", x: "3", y: "14", rx: "1", key: "jqznyg" },
        ],
        [
          "rect",
          { width: "5", height: "7", x: "16", y: "14", rx: "1", key: "q5h2i8" },
        ],
      ]);
    },
    1063: (e, r, t) => {
      "use strict";
      t.d(r, { p: () => n });
      var a = t(4568),
        s = t(7620),
        l = t(5703);
      let n = s.forwardRef((e, r) => {
        let { className: t, type: s, ...n } = e;
        return (0, a.jsx)("input", {
          type: s,
          className: (0, l.cn)(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            t,
          ),
          ref: r,
          ...n,
        });
      });
      n.displayName = "Input";
    },
    2046: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => d });
      var a = t(7620);
      let s = (e) => {
          let r = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, r, t) =>
            t ? t.toUpperCase() : r.toLowerCase(),
          );
          return r.charAt(0).toUpperCase() + r.slice(1);
        },
        l = function () {
          for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
            r[t] = arguments[t];
          return r
            .filter((e, r, t) => !!e && "" !== e.trim() && t.indexOf(e) === r)
            .join(" ")
            .trim();
        };
      var n = {
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
      let i = (0, a.forwardRef)((e, r) => {
          let {
            color: t = "currentColor",
            size: s = 24,
            strokeWidth: i = 2,
            absoluteStrokeWidth: d,
            className: o = "",
            children: c,
            iconNode: u,
            ...m
          } = e;
          return (0, a.createElement)(
            "svg",
            {
              ref: r,
              ...n,
              width: s,
              height: s,
              stroke: t,
              strokeWidth: d ? (24 * Number(i)) / Number(s) : i,
              className: l("lucide", o),
              ...(!c &&
                !((e) => {
                  for (let r in e)
                    if (r.startsWith("aria-") || "role" === r || "title" === r)
                      return !0;
                })(m) && { "aria-hidden": "true" }),
              ...m,
            },
            [
              ...u.map((e) => {
                let [r, t] = e;
                return (0, a.createElement)(r, t);
              }),
              ...(Array.isArray(c) ? c : [c]),
            ],
          );
        }),
        d = (e, r) => {
          let t = (0, a.forwardRef)((t, n) => {
            let { className: d, ...o } = t;
            return (0, a.createElement)(i, {
              ref: n,
              iconNode: r,
              className: l(
                "lucide-".concat(
                  s(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                d,
              ),
              ...o,
            });
          });
          return ((t.displayName = s(e)), t);
        };
    },
    2381: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => a });
      let a = (0, t(2046).A)("search", [
        ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
        ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
      ]);
    },
    4616: (e, r, t) => {
      "use strict";
      t.d(r, { F: () => n });
      var a = t(2902);
      let s = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        l = a.$,
        n = (e, r) => (t) => {
          var a;
          if ((null == r ? void 0 : r.variants) == null)
            return l(
              e,
              null == t ? void 0 : t.class,
              null == t ? void 0 : t.className,
            );
          let { variants: n, defaultVariants: i } = r,
            d = Object.keys(n).map((e) => {
              let r = null == t ? void 0 : t[e],
                a = null == i ? void 0 : i[e];
              if (null === r) return null;
              let l = s(r) || s(a);
              return n[e][l];
            }),
            o =
              t &&
              Object.entries(t).reduce((e, r) => {
                let [t, a] = r;
                return (void 0 === a || (e[t] = a), e);
              }, {});
          return l(
            e,
            d,
            null == r || null == (a = r.compoundVariants)
              ? void 0
              : a.reduce((e, r) => {
                  let { class: t, className: a, ...s } = r;
                  return Object.entries(s).every((e) => {
                    let [r, t] = e;
                    return Array.isArray(t)
                      ? t.includes({ ...i, ...o }[r])
                      : { ...i, ...o }[r] === t;
                  })
                    ? [...e, t, a]
                    : e;
                }, []),
            null == t ? void 0 : t.class,
            null == t ? void 0 : t.className,
          );
        };
    },
    5703: (e, r, t) => {
      "use strict";
      t.d(r, { cn: () => l });
      var a = t(2902),
        s = t(3714);
      function l() {
        for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
          r[t] = arguments[t];
        return (0, s.QP)((0, a.$)(r));
      }
    },
    7254: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 9648));
    },
    8186: (e, r, t) => {
      "use strict";
      t.d(r, {
        BT: () => o,
        Wu: () => c,
        ZB: () => d,
        Zp: () => n,
        aR: () => i,
      });
      var a = t(4568),
        s = t(7620),
        l = t(5703);
      let n = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, l.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            t,
          ),
          ...s,
        });
      });
      n.displayName = "Card";
      let i = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, l.cn)("flex flex-col space-y-1.5 p-6", t),
          ...s,
        });
      });
      i.displayName = "CardHeader";
      let d = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, l.cn)("font-semibold leading-none tracking-tight", t),
          ...s,
        });
      });
      d.displayName = "CardTitle";
      let o = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, l.cn)("text-sm text-muted-foreground", t),
          ...s,
        });
      });
      o.displayName = "CardDescription";
      let c = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, l.cn)("p-6 pt-0", t),
          ...s,
        });
      });
      ((c.displayName = "CardContent"),
        (s.forwardRef((e, r) => {
          let { className: t, ...s } = e;
          return (0, a.jsx)("div", {
            ref: r,
            className: (0, l.cn)("flex items-center p-6 pt-0", t),
            ...s,
          });
        }).displayName = "CardFooter"));
    },
    9648: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => u }));
      var a = t(4568),
        s = t(8186),
        l = t(9977),
        n = t(1063),
        i = t(2381),
        d = t(548);
      let o = (0, t(2046).A)("star", [
          [
            "path",
            {
              d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
              key: "r04s7s",
            },
          ],
        ]),
        c = [
          {
            name: "Order Processing Pipeline",
            desc: "Process orders from API to database with notifications",
            category: "ecommerce",
            uses: 42,
            rating: 4.5,
          },
          {
            name: "Data Sync Every 15min",
            desc: "Sync data between Postgres and external APIs on a schedule",
            category: "data",
            uses: 28,
            rating: 4.2,
          },
          {
            name: "Slack Alerting",
            desc: "Send alerts to Slack channels based on conditions",
            category: "notifications",
            uses: 35,
            rating: 4.8,
          },
          {
            name: "Email Digest",
            desc: "Collect and send periodic email digests",
            category: "email",
            uses: 19,
            rating: 4,
          },
        ];
      function u() {
        return (0, a.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, a.jsxs)("div", {
              children: [
                (0, a.jsx)("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: "Templates",
                }),
                (0, a.jsx)("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Pre-built workflow templates",
                }),
              ],
            }),
            (0, a.jsxs)("div", {
              className: "relative w-full max-w-sm",
              children: [
                (0, a.jsx)(i.A, {
                  className:
                    "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                }),
                (0, a.jsx)(n.p, {
                  placeholder: "Search templates...",
                  className: "pl-9",
                }),
              ],
            }),
            (0, a.jsx)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
              children: c.map((e) =>
                (0, a.jsxs)(
                  s.Zp,
                  {
                    className:
                      "cursor-pointer transition-colors hover:border-primary/50",
                    children: [
                      (0, a.jsxs)(s.aR, {
                        children: [
                          (0, a.jsxs)("div", {
                            className: "flex items-start justify-between",
                            children: [
                              (0, a.jsx)(d.A, {
                                className: "h-5 w-5 text-primary",
                              }),
                              (0, a.jsxs)("div", {
                                className:
                                  "flex items-center gap-1 text-xs text-muted-foreground",
                                children: [
                                  (0, a.jsx)(o, {
                                    className:
                                      "h-3 w-3 fill-amber-400 text-amber-400",
                                  }),
                                  e.rating,
                                ],
                              }),
                            ],
                          }),
                          (0, a.jsx)(s.ZB, {
                            className: "mt-2 text-sm",
                            children: e.name,
                          }),
                          (0, a.jsx)(s.BT, {
                            className: "text-xs",
                            children: e.desc,
                          }),
                        ],
                      }),
                      (0, a.jsxs)(s.Wu, {
                        className: "flex items-center justify-between",
                        children: [
                          (0, a.jsx)(l.E, {
                            variant: "secondary",
                            className: "text-xs",
                            children: e.category,
                          }),
                          (0, a.jsxs)("span", {
                            className: "text-xs text-muted-foreground",
                            children: [e.uses, " uses"],
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
    9977: (e, r, t) => {
      "use strict";
      t.d(r, { E: () => i });
      var a = t(4568);
      t(7620);
      var s = t(4616),
        l = t(5703);
      let n = (0, s.F)(
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
        let { className: r, variant: t, ...s } = e;
        return (0, a.jsx)("div", {
          className: (0, l.cn)(n({ variant: t }), r),
          ...s,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 7254))), (_N_E = e.O()));
  },
]);
