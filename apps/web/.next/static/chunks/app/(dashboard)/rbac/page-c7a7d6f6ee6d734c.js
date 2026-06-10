(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [483],
  {
    1549: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 3685));
    },
    1715: (e, r, t) => {
      "use strict";
      t.d(r, { s: () => a });
      var n = t(7620);
      function s(e, r) {
        if ("function" == typeof e) return e(r);
        null != e && (e.current = r);
      }
      function a(...e) {
        return n.useCallback(
          (function (...e) {
            return (r) => {
              let t = !1,
                n = e.map((e) => {
                  let n = s(e, r);
                  return (t || "function" != typeof n || (t = !0), n);
                });
              if (t)
                return () => {
                  for (let r = 0; r < n.length; r++) {
                    let t = n[r];
                    "function" == typeof t ? t() : s(e[r], null);
                  }
                };
            };
          })(...e),
          e,
        );
      }
    },
    2046: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => o });
      var n = t(7620);
      let s = (e) => {
          let r = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, r, t) =>
            t ? t.toUpperCase() : r.toLowerCase(),
          );
          return r.charAt(0).toUpperCase() + r.slice(1);
        },
        a = function () {
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
      let i = (0, n.forwardRef)((e, r) => {
          let {
            color: t = "currentColor",
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
              ref: r,
              ...l,
              width: s,
              height: s,
              stroke: t,
              strokeWidth: o ? (24 * Number(i)) / Number(s) : i,
              className: a("lucide", d),
              ...(!c &&
                !((e) => {
                  for (let r in e)
                    if (r.startsWith("aria-") || "role" === r || "title" === r)
                      return !0;
                })(f) && { "aria-hidden": "true" }),
              ...f,
            },
            [
              ...u.map((e) => {
                let [r, t] = e;
                return (0, n.createElement)(r, t);
              }),
              ...(Array.isArray(c) ? c : [c]),
            ],
          );
        }),
        o = (e, r) => {
          let t = (0, n.forwardRef)((t, l) => {
            let { className: o, ...d } = t;
            return (0, n.createElement)(i, {
              ref: l,
              iconNode: r,
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
          return ((t.displayName = s(e)), t);
        };
    },
    3685: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => u }));
      var n = t(4568),
        s = t(8186),
        a = t(9977),
        l = t(5400);
      let i = (0, t(2046).A)("user-plus", [
        [
          "path",
          { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" },
        ],
        ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
        ["line", { x1: "19", x2: "19", y1: "8", y2: "14", key: "1bvyxn" }],
        ["line", { x1: "22", x2: "16", y1: "11", y2: "11", key: "1shjgl" }],
      ]);
      var o = t(7801),
        d = t(5256);
      let c = [
        { name: "Admin", users: 3, permissions: "Full access" },
        { name: "Editor", users: 8, permissions: "Create and edit workflows" },
        { name: "Viewer", users: 12, permissions: "Read-only access" },
      ];
      function u() {
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
                      children: "RBAC",
                    }),
                    (0, n.jsx)("p", {
                      className: "text-sm text-muted-foreground",
                      children: "Role-based access control",
                    }),
                  ],
                }),
                (0, n.jsxs)("div", {
                  className: "flex gap-2",
                  children: [
                    (0, n.jsxs)(l.$, {
                      variant: "outline",
                      children: [
                        (0, n.jsx)(i, { className: "mr-1 h-4 w-4" }),
                        " Invite User",
                      ],
                    }),
                    (0, n.jsxs)(l.$, {
                      children: [
                        (0, n.jsx)(o.A, { className: "mr-1 h-4 w-4" }),
                        " Add Role",
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, n.jsx)("div", {
              className: "grid gap-4 md:grid-cols-3",
              children: c.map((e) =>
                (0, n.jsxs)(
                  s.Zp,
                  {
                    children: [
                      (0, n.jsxs)(s.aR, {
                        className:
                          "flex flex-row items-center justify-between pb-2",
                        children: [
                          (0, n.jsx)(s.ZB, {
                            className: "text-sm",
                            children: e.name,
                          }),
                          (0, n.jsx)(d.A, {
                            className: "h-4 w-4 text-muted-foreground",
                          }),
                        ],
                      }),
                      (0, n.jsxs)(s.Wu, {
                        className: "space-y-2",
                        children: [
                          (0, n.jsxs)(a.E, {
                            variant: "secondary",
                            children: [e.users, " users"],
                          }),
                          (0, n.jsx)("p", {
                            className: "text-xs text-muted-foreground",
                            children: e.permissions,
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
    4616: (e, r, t) => {
      "use strict";
      t.d(r, { F: () => l });
      var n = t(2902);
      let s = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        a = n.$,
        l = (e, r) => (t) => {
          var n;
          if ((null == r ? void 0 : r.variants) == null)
            return a(
              e,
              null == t ? void 0 : t.class,
              null == t ? void 0 : t.className,
            );
          let { variants: l, defaultVariants: i } = r,
            o = Object.keys(l).map((e) => {
              let r = null == t ? void 0 : t[e],
                n = null == i ? void 0 : i[e];
              if (null === r) return null;
              let a = s(r) || s(n);
              return l[e][a];
            }),
            d =
              t &&
              Object.entries(t).reduce((e, r) => {
                let [t, n] = r;
                return (void 0 === n || (e[t] = n), e);
              }, {});
          return a(
            e,
            o,
            null == r || null == (n = r.compoundVariants)
              ? void 0
              : n.reduce((e, r) => {
                  let { class: t, className: n, ...s } = r;
                  return Object.entries(s).every((e) => {
                    let [r, t] = e;
                    return Array.isArray(t)
                      ? t.includes({ ...i, ...d }[r])
                      : { ...i, ...d }[r] === t;
                  })
                    ? [...e, t, n]
                    : e;
                }, []),
            null == t ? void 0 : t.class,
            null == t ? void 0 : t.className,
          );
        };
    },
    5256: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => n });
      let n = (0, t(2046).A)("shield", [
        [
          "path",
          {
            d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
            key: "oel41y",
          },
        ],
      ]);
    },
    5400: (e, r, t) => {
      "use strict";
      t.d(r, { $: () => d });
      var n = t(4568),
        s = t(7620),
        a = t(6118),
        l = t(4616),
        i = t(5703);
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
        d = s.forwardRef((e, r) => {
          let { className: t, variant: s, size: l, asChild: d = !1, ...c } = e,
            u = d ? a.DX : "button";
          return (0, n.jsx)(u, {
            className: (0, i.cn)(o({ variant: s, size: l, className: t })),
            ref: r,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5703: (e, r, t) => {
      "use strict";
      t.d(r, { cn: () => a });
      var n = t(2902),
        s = t(3714);
      function a() {
        for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
          r[t] = arguments[t];
        return (0, s.QP)((0, n.$)(r));
      }
    },
    6118: (e, r, t) => {
      "use strict";
      t.d(r, { DX: () => i, Dc: () => d, TL: () => l });
      var n,
        s = t(7620),
        a = t(1715);
      function l(e) {
        let r = s.forwardRef((r, t) => {
          var n;
          let l,
            i,
            { children: d, ...u } = r,
            v = null,
            x = !1,
            y = [];
          (f(d) && "function" == typeof h && (d = h(d._payload)),
            s.Children.forEach(d, (e) => {
              var r;
              if (
                ((r = e),
                s.isValidElement(r) &&
                  "function" == typeof r.type &&
                  "__radixId" in r.type &&
                  r.type.__radixId === o)
              ) {
                x = !0;
                let r = "child" in e.props ? e.props.child : e.props.children;
                (f(r) && "function" == typeof h && (r = h(r._payload)),
                  (v = c(e, r)),
                  y.push(v?.props?.children));
              } else y.push(e);
            }),
            v
              ? (v = s.cloneElement(v, void 0, y))
              : !x &&
                1 === s.Children.count(d) &&
                s.isValidElement(d) &&
                (v = d));
          let g = v
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
            b = (0, a.s)(t, g);
          if (!v) {
            if (d || 0 === d) throw Error(x ? m(e) : p(e));
            return d;
          }
          let w = (function (e, r) {
            let t = { ...r };
            for (let n in r) {
              let s = e[n],
                a = r[n];
              /^on[A-Z]/.test(n)
                ? s && a
                  ? (t[n] = (...e) => {
                      let r = a(...e);
                      return (s(...e), r);
                    })
                  : s && (t[n] = s)
                : "style" === n
                  ? (t[n] = { ...s, ...a })
                  : "className" === n &&
                    (t[n] = [s, a].filter(Boolean).join(" "));
            }
            return { ...e, ...t };
          })(u, v.props ?? {});
          return (
            v.type !== s.Fragment && (w.ref = t ? b : g),
            s.cloneElement(v, w)
          );
        });
        return ((r.displayName = `${e}.Slot`), r);
      }
      var i = l("Slot"),
        o = Symbol.for("radix.slottable");
      function d(e) {
        let r = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((r.displayName = `${e}.Slottable`), (r.__radixId = o), r);
      }
      var c = (e, r) => {
          if ("child" in e.props) {
            let r = e.props.child;
            return s.isValidElement(r)
              ? s.cloneElement(r, void 0, e.props.children(r.props.children))
              : null;
          }
          return s.isValidElement(r) ? r : null;
        },
        u = Symbol.for("react.lazy");
      function f(e) {
        var r;
        return (
          null != e &&
          "object" == typeof e &&
          "$$typeof" in e &&
          e.$$typeof === u &&
          "_payload" in e &&
          "object" == typeof (r = e._payload) &&
          null !== r &&
          "then" in r
        );
      }
      var p = (e) =>
          `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
        m = (e) =>
          `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
        h = (n || (n = t.t(s, 2)))[" use ".trim().toString()];
    },
    7801: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => n });
      let n = (0, t(2046).A)("plus", [
        ["path", { d: "M5 12h14", key: "1ays0h" }],
        ["path", { d: "M12 5v14", key: "s699le" }],
      ]);
    },
    8186: (e, r, t) => {
      "use strict";
      t.d(r, {
        BT: () => d,
        Wu: () => c,
        ZB: () => o,
        Zp: () => l,
        aR: () => i,
      });
      var n = t(4568),
        s = t(7620),
        a = t(5703);
      let l = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, a.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            t,
          ),
          ...s,
        });
      });
      l.displayName = "Card";
      let i = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, a.cn)("flex flex-col space-y-1.5 p-6", t),
          ...s,
        });
      });
      i.displayName = "CardHeader";
      let o = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, a.cn)("font-semibold leading-none tracking-tight", t),
          ...s,
        });
      });
      o.displayName = "CardTitle";
      let d = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, a.cn)("text-sm text-muted-foreground", t),
          ...s,
        });
      });
      d.displayName = "CardDescription";
      let c = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, a.cn)("p-6 pt-0", t),
          ...s,
        });
      });
      ((c.displayName = "CardContent"),
        (s.forwardRef((e, r) => {
          let { className: t, ...s } = e;
          return (0, n.jsx)("div", {
            ref: r,
            className: (0, a.cn)("flex items-center p-6 pt-0", t),
            ...s,
          });
        }).displayName = "CardFooter"));
    },
    9977: (e, r, t) => {
      "use strict";
      t.d(r, { E: () => i });
      var n = t(4568);
      t(7620);
      var s = t(4616),
        a = t(5703);
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
        let { className: r, variant: t, ...s } = e;
        return (0, n.jsx)("div", {
          className: (0, a.cn)(l({ variant: t }), r),
          ...s,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 1549))), (_N_E = e.O()));
  },
]);
