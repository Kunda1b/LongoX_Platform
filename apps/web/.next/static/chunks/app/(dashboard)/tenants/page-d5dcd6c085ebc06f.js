(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [856],
  {
    1715: (e, t, r) => {
      "use strict";
      r.d(t, { s: () => a });
      var n = r(7620);
      function s(e, t) {
        if ("function" == typeof e) return e(t);
        null != e && (e.current = t);
      }
      function a(...e) {
        return n.useCallback(
          (function (...e) {
            return (t) => {
              let r = !1,
                n = e.map((e) => {
                  let n = s(e, t);
                  return (r || "function" != typeof n || (r = !0), n);
                });
              if (r)
                return () => {
                  for (let t = 0; t < n.length; t++) {
                    let r = n[t];
                    "function" == typeof r ? r() : s(e[t], null);
                  }
                };
            };
          })(...e),
          e,
        );
      }
    },
    2046: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => o });
      var n = r(7620);
      let s = (e) => {
          let t = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, r) =>
            r ? r.toUpperCase() : t.toLowerCase(),
          );
          return t.charAt(0).toUpperCase() + t.slice(1);
        },
        a = function () {
          for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
            t[r] = arguments[r];
          return t
            .filter((e, t, r) => !!e && "" !== e.trim() && r.indexOf(e) === t)
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
      let i = (0, n.forwardRef)((e, t) => {
          let {
            color: r = "currentColor",
            size: s = 24,
            strokeWidth: i = 2,
            absoluteStrokeWidth: o,
            className: d = "",
            children: c,
            iconNode: u,
            ...f
          } = e;
          return (0, n.createElement)(
            "svg",
            {
              ref: t,
              ...l,
              width: s,
              height: s,
              stroke: r,
              strokeWidth: o ? (24 * Number(i)) / Number(s) : i,
              className: a("lucide", d),
              ...(!c &&
                !((e) => {
                  for (let t in e)
                    if (t.startsWith("aria-") || "role" === t || "title" === t)
                      return !0;
                })(f) && { "aria-hidden": "true" }),
              ...f,
            },
            [
              ...u.map((e) => {
                let [t, r] = e;
                return (0, n.createElement)(t, r);
              }),
              ...(Array.isArray(c) ? c : [c]),
            ],
          );
        }),
        o = (e, t) => {
          let r = (0, n.forwardRef)((r, l) => {
            let { className: o, ...d } = r;
            return (0, n.createElement)(i, {
              ref: l,
              iconNode: t,
              className: a(
                "lucide-".concat(
                  s(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                o,
              ),
              ...d,
            });
          });
          return ((r.displayName = s(e)), r);
        };
    },
    3615: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("users", [
        [
          "path",
          { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" },
        ],
        ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
        ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
        ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
      ]);
    },
    4436: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 7511));
    },
    4616: (e, t, r) => {
      "use strict";
      r.d(t, { F: () => l });
      var n = r(2902);
      let s = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        a = n.$,
        l = (e, t) => (r) => {
          var n;
          if ((null == t ? void 0 : t.variants) == null)
            return a(
              e,
              null == r ? void 0 : r.class,
              null == r ? void 0 : r.className,
            );
          let { variants: l, defaultVariants: i } = t,
            o = Object.keys(l).map((e) => {
              let t = null == r ? void 0 : r[e],
                n = null == i ? void 0 : i[e];
              if (null === t) return null;
              let a = s(t) || s(n);
              return l[e][a];
            }),
            d =
              r &&
              Object.entries(r).reduce((e, t) => {
                let [r, n] = t;
                return (void 0 === n || (e[r] = n), e);
              }, {});
          return a(
            e,
            o,
            null == t || null == (n = t.compoundVariants)
              ? void 0
              : n.reduce((e, t) => {
                  let { class: r, className: n, ...s } = t;
                  return Object.entries(s).every((e) => {
                    let [t, r] = e;
                    return Array.isArray(r)
                      ? r.includes({ ...i, ...d }[t])
                      : { ...i, ...d }[t] === r;
                  })
                    ? [...e, r, n]
                    : e;
                }, []),
            null == r ? void 0 : r.class,
            null == r ? void 0 : r.className,
          );
        };
    },
    5400: (e, t, r) => {
      "use strict";
      r.d(t, { $: () => d });
      var n = r(4568),
        s = r(7620),
        a = r(6118),
        l = r(4616),
        i = r(5703);
      let o = (0, l.F)(
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
        d = s.forwardRef((e, t) => {
          let { className: r, variant: s, size: l, asChild: d = !1, ...c } = e,
            u = d ? a.DX : "button";
          return (0, n.jsx)(u, {
            className: (0, i.cn)(o({ variant: s, size: l, className: r })),
            ref: t,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5703: (e, t, r) => {
      "use strict";
      r.d(t, { cn: () => a });
      var n = r(2902),
        s = r(3714);
      function a() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
          t[r] = arguments[r];
        return (0, s.QP)((0, n.$)(t));
      }
    },
    6118: (e, t, r) => {
      "use strict";
      r.d(t, { DX: () => i, Dc: () => d, TL: () => l });
      var n,
        s = r(7620),
        a = r(1715);
      function l(e) {
        let t = s.forwardRef((t, r) => {
          var n;
          let l,
            i,
            { children: d, ...u } = t,
            v = null,
            x = !1,
            g = [];
          (f(d) && "function" == typeof h && (d = h(d._payload)),
            s.Children.forEach(d, (e) => {
              var t;
              if (
                ((t = e),
                s.isValidElement(t) &&
                  "function" == typeof t.type &&
                  "__radixId" in t.type &&
                  t.type.__radixId === o)
              ) {
                x = !0;
                let t = "child" in e.props ? e.props.child : e.props.children;
                (f(t) && "function" == typeof h && (t = h(t._payload)),
                  (v = c(e, t)),
                  g.push(v?.props?.children));
              } else g.push(e);
            }),
            v
              ? (v = s.cloneElement(v, void 0, g))
              : !x &&
                1 === s.Children.count(d) &&
                s.isValidElement(d) &&
                (v = d));
          let y = v
              ? ((n = v),
                (i =
                  (l = Object.getOwnPropertyDescriptor(n.props, "ref")?.get) &&
                  "isReactWarning" in l &&
                  l.isReactWarning)
                  ? n.ref
                  : (i =
                        (l = Object.getOwnPropertyDescriptor(n, "ref")?.get) &&
                        "isReactWarning" in l &&
                        l.isReactWarning)
                    ? n.props.ref
                    : n.props.ref || n.ref)
              : void 0,
            b = (0, a.s)(r, y);
          if (!v) {
            if (d || 0 === d) throw Error(x ? m(e) : p(e));
            return d;
          }
          let w = (function (e, t) {
            let r = { ...t };
            for (let n in t) {
              let s = e[n],
                a = t[n];
              /^on[A-Z]/.test(n)
                ? s && a
                  ? (r[n] = (...e) => {
                      let t = a(...e);
                      return (s(...e), t);
                    })
                  : s && (r[n] = s)
                : "style" === n
                  ? (r[n] = { ...s, ...a })
                  : "className" === n &&
                    (r[n] = [s, a].filter(Boolean).join(" "));
            }
            return { ...e, ...r };
          })(u, v.props ?? {});
          return (
            v.type !== s.Fragment && (w.ref = r ? b : y),
            s.cloneElement(v, w)
          );
        });
        return ((t.displayName = `${e}.Slot`), t);
      }
      var i = l("Slot"),
        o = Symbol.for("radix.slottable");
      function d(e) {
        let t = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((t.displayName = `${e}.Slottable`), (t.__radixId = o), t);
      }
      var c = (e, t) => {
          if ("child" in e.props) {
            let t = e.props.child;
            return s.isValidElement(t)
              ? s.cloneElement(t, void 0, e.props.children(t.props.children))
              : null;
          }
          return s.isValidElement(t) ? t : null;
        },
        u = Symbol.for("react.lazy");
      function f(e) {
        var t;
        return (
          null != e &&
          "object" == typeof e &&
          "$$typeof" in e &&
          e.$$typeof === u &&
          "_payload" in e &&
          "object" == typeof (t = e._payload) &&
          null !== t &&
          "then" in t
        );
      }
      var p = (e) =>
          `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
        m = (e) =>
          `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
        h = (n || (n = r.t(s, 2)))[" use ".trim().toString()];
    },
    7511: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => c }));
      var n = r(4568),
        s = r(8186),
        a = r(9977),
        l = r(5400),
        i = r(7801),
        o = r(3615);
      let d = [
        { name: "Acme Corp", plan: "enterprise", users: 12, status: "active" },
        { name: "Globex Inc", plan: "pro", users: 5, status: "active" },
        { name: "Initech", plan: "free", users: 2, status: "suspended" },
      ];
      function c() {
        return (0, n.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, n.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, n.jsxs)("div", {
                  children: [
                    (0, n.jsx)("h1", {
                      className: "text-2xl font-bold tracking-tight",
                      children: "Tenants",
                    }),
                    (0, n.jsx)("p", {
                      className: "text-sm text-muted-foreground",
                      children: "Multi-tenant administration",
                    }),
                  ],
                }),
                (0, n.jsxs)(l.$, {
                  children: [
                    (0, n.jsx)(i.A, { className: "mr-1 h-4 w-4" }),
                    " Add Tenant",
                  ],
                }),
              ],
            }),
            (0, n.jsx)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
              children: d.map((e) =>
                (0, n.jsxs)(
                  s.Zp,
                  {
                    children: [
                      (0, n.jsxs)(s.aR, {
                        className:
                          "flex flex-row items-start justify-between pb-2",
                        children: [
                          (0, n.jsxs)("div", {
                            children: [
                              (0, n.jsx)(s.ZB, {
                                className: "text-sm",
                                children: e.name,
                              }),
                              (0, n.jsxs)("p", {
                                className:
                                  "text-xs text-muted-foreground capitalize",
                                children: [e.plan, " plan"],
                              }),
                            ],
                          }),
                          (0, n.jsx)(o.A, {
                            className: "h-4 w-4 text-muted-foreground",
                          }),
                        ],
                      }),
                      (0, n.jsxs)(s.Wu, {
                        className: "flex items-center justify-between",
                        children: [
                          (0, n.jsxs)("span", {
                            className: "text-xs text-muted-foreground",
                            children: [e.users, " users"],
                          }),
                          (0, n.jsx)(a.E, {
                            variant:
                              "active" === e.status ? "success" : "destructive",
                            children: e.status,
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
    7801: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("plus", [
        ["path", { d: "M5 12h14", key: "1ays0h" }],
        ["path", { d: "M12 5v14", key: "s699le" }],
      ]);
    },
    8186: (e, t, r) => {
      "use strict";
      r.d(t, {
        BT: () => d,
        Wu: () => c,
        ZB: () => o,
        Zp: () => l,
        aR: () => i,
      });
      var n = r(4568),
        s = r(7620),
        a = r(5703);
      let l = s.forwardRef((e, t) => {
        let { className: r, ...s } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            r,
          ),
          ...s,
        });
      });
      l.displayName = "Card";
      let i = s.forwardRef((e, t) => {
        let { className: r, ...s } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("flex flex-col space-y-1.5 p-6", r),
          ...s,
        });
      });
      i.displayName = "CardHeader";
      let o = s.forwardRef((e, t) => {
        let { className: r, ...s } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("font-semibold leading-none tracking-tight", r),
          ...s,
        });
      });
      o.displayName = "CardTitle";
      let d = s.forwardRef((e, t) => {
        let { className: r, ...s } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("text-sm text-muted-foreground", r),
          ...s,
        });
      });
      d.displayName = "CardDescription";
      let c = s.forwardRef((e, t) => {
        let { className: r, ...s } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("p-6 pt-0", r),
          ...s,
        });
      });
      ((c.displayName = "CardContent"),
        (s.forwardRef((e, t) => {
          let { className: r, ...s } = e;
          return (0, n.jsx)("div", {
            ref: t,
            className: (0, a.cn)("flex items-center p-6 pt-0", r),
            ...s,
          });
        }).displayName = "CardFooter"));
    },
    9977: (e, t, r) => {
      "use strict";
      r.d(t, { E: () => i });
      var n = r(4568);
      r(7620);
      var s = r(4616),
        a = r(5703);
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
      function i(e) {
        let { className: t, variant: r, ...s } = e;
        return (0, n.jsx)("div", {
          className: (0, a.cn)(l({ variant: r }), t),
          ...s,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 4436))), (_N_E = e.O()));
  },
]);
