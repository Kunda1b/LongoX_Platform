(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [401],
  {
    2046: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => i });
      var a = t(7620);
      let s = (e) => {
          let r = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, r, t) =>
            t ? t.toUpperCase() : r.toLowerCase(),
          );
          return r.charAt(0).toUpperCase() + r.slice(1);
        },
        n = function () {
          for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
            r[t] = arguments[t];
          return r
            .filter((e, r, t) => !!e && "" !== e.trim() && t.indexOf(e) === r)
            .join(" ")
            .trim();
        };
      var l = {
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
      let d = (0, a.forwardRef)((e, r) => {
          let {
            color: t = "currentColor",
            size: s = 24,
            strokeWidth: d = 2,
            absoluteStrokeWidth: i,
            className: o = "",
            children: c,
            iconNode: u,
            ...m
          } = e;
          return (0, a.createElement)(
            "svg",
            {
              ref: r,
              ...l,
              width: s,
              height: s,
              stroke: t,
              strokeWidth: i ? (24 * Number(d)) / Number(s) : d,
              className: n("lucide", o),
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
        i = (e, r) => {
          let t = (0, a.forwardRef)((t, l) => {
            let { className: i, ...o } = t;
            return (0, a.createElement)(d, {
              ref: l,
              iconNode: r,
              className: n(
                "lucide-".concat(
                  s(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                i,
              ),
              ...o,
            });
          });
          return ((t.displayName = s(e)), t);
        };
    },
    3703: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 4668));
    },
    4616: (e, r, t) => {
      "use strict";
      t.d(r, { F: () => l });
      var a = t(2902);
      let s = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        n = a.$,
        l = (e, r) => (t) => {
          var a;
          if ((null == r ? void 0 : r.variants) == null)
            return n(
              e,
              null == t ? void 0 : t.class,
              null == t ? void 0 : t.className,
            );
          let { variants: l, defaultVariants: d } = r,
            i = Object.keys(l).map((e) => {
              let r = null == t ? void 0 : t[e],
                a = null == d ? void 0 : d[e];
              if (null === r) return null;
              let n = s(r) || s(a);
              return l[e][n];
            }),
            o =
              t &&
              Object.entries(t).reduce((e, r) => {
                let [t, a] = r;
                return (void 0 === a || (e[t] = a), e);
              }, {});
          return n(
            e,
            i,
            null == r || null == (a = r.compoundVariants)
              ? void 0
              : a.reduce((e, r) => {
                  let { class: t, className: a, ...s } = r;
                  return Object.entries(s).every((e) => {
                    let [r, t] = e;
                    return Array.isArray(t)
                      ? t.includes({ ...d, ...o }[r])
                      : { ...d, ...o }[r] === t;
                  })
                    ? [...e, t, a]
                    : e;
                }, []),
            null == t ? void 0 : t.class,
            null == t ? void 0 : t.className,
          );
        };
    },
    4668: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => i }));
      var a = t(4568),
        s = t(8186),
        n = t(9977),
        l = t(6482);
      let d = [
        {
          name: "Production",
          color: "destructive",
          status: "healthy",
          url: "https://api.longox.io",
        },
        {
          name: "Staging",
          color: "warning",
          status: "healthy",
          url: "https://staging.api.longox.io",
        },
        {
          name: "Development",
          color: "info",
          status: "degraded",
          url: "https://dev.api.longox.io",
        },
      ];
      function i() {
        return (0, a.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, a.jsxs)("div", {
              children: [
                (0, a.jsx)("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: "Environments",
                }),
                (0, a.jsx)("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Manage deployment environments",
                }),
              ],
            }),
            (0, a.jsx)("div", {
              className: "grid gap-4 md:grid-cols-3",
              children: d.map((e) =>
                (0, a.jsxs)(
                  s.Zp,
                  {
                    children: [
                      (0, a.jsxs)(s.aR, {
                        className:
                          "flex flex-row items-center justify-between pb-2",
                        children: [
                          (0, a.jsx)(s.ZB, {
                            className: "text-sm",
                            children: e.name,
                          }),
                          (0, a.jsx)(l.A, {
                            className: "h-4 w-4 text-muted-foreground",
                          }),
                        ],
                      }),
                      (0, a.jsxs)(s.Wu, {
                        className: "space-y-2",
                        children: [
                          (0, a.jsx)(n.E, {
                            variant:
                              "healthy" === e.status ? "success" : "warning",
                            children: e.status,
                          }),
                          (0, a.jsx)("p", {
                            className: "text-xs text-muted-foreground truncate",
                            children: e.url,
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
    5703: (e, r, t) => {
      "use strict";
      t.d(r, { cn: () => n });
      var a = t(2902),
        s = t(3714);
      function n() {
        for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
          r[t] = arguments[t];
        return (0, s.QP)((0, a.$)(r));
      }
    },
    6482: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => a });
      let a = (0, t(2046).A)("globe", [
        ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
        [
          "path",
          {
            d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",
            key: "13o1zl",
          },
        ],
        ["path", { d: "M2 12h20", key: "9i4pu4" }],
      ]);
    },
    8186: (e, r, t) => {
      "use strict";
      t.d(r, {
        BT: () => o,
        Wu: () => c,
        ZB: () => i,
        Zp: () => l,
        aR: () => d,
      });
      var a = t(4568),
        s = t(7620),
        n = t(5703);
      let l = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, n.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            t,
          ),
          ...s,
        });
      });
      l.displayName = "Card";
      let d = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, n.cn)("flex flex-col space-y-1.5 p-6", t),
          ...s,
        });
      });
      d.displayName = "CardHeader";
      let i = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, n.cn)("font-semibold leading-none tracking-tight", t),
          ...s,
        });
      });
      i.displayName = "CardTitle";
      let o = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, n.cn)("text-sm text-muted-foreground", t),
          ...s,
        });
      });
      o.displayName = "CardDescription";
      let c = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, n.cn)("p-6 pt-0", t),
          ...s,
        });
      });
      ((c.displayName = "CardContent"),
        (s.forwardRef((e, r) => {
          let { className: t, ...s } = e;
          return (0, a.jsx)("div", {
            ref: r,
            className: (0, n.cn)("flex items-center p-6 pt-0", t),
            ...s,
          });
        }).displayName = "CardFooter"));
    },
    9977: (e, r, t) => {
      "use strict";
      t.d(r, { E: () => d });
      var a = t(4568);
      t(7620);
      var s = t(4616),
        n = t(5703);
      let l = (0, s.F)(
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
      function d(e) {
        let { className: r, variant: t, ...s } = e;
        return (0, a.jsx)("div", {
          className: (0, n.cn)(l({ variant: t }), r),
          ...s,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 3703))), (_N_E = e.O()));
  },
]);
