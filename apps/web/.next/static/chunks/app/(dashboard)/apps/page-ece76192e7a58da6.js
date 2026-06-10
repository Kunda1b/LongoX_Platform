(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [387],
  {
    333: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 8942));
    },
    1715: (e, r, t) => {
      "use strict";
      t.d(r, { s: () => s });
      var n = t(7620);
      function a(e, r) {
        if ("function" == typeof e) return e(r);
        null != e && (e.current = r);
      }
      function s(...e) {
        return n.useCallback(
          (function (...e) {
            return (r) => {
              let t = !1,
                n = e.map((e) => {
                  let n = a(e, r);
                  return (t || "function" != typeof n || (t = !0), n);
                });
              if (t)
                return () => {
                  for (let r = 0; r < n.length; r++) {
                    let t = n[r];
                    "function" == typeof t ? t() : a(e[r], null);
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
      let a = (e) => {
          let r = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, r, t) =>
            t ? t.toUpperCase() : r.toLowerCase(),
          );
          return r.charAt(0).toUpperCase() + r.slice(1);
        },
        s = function () {
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
            size: a = 24,
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
              width: a,
              height: a,
              stroke: t,
              strokeWidth: o ? (24 * Number(i)) / Number(a) : i,
              className: s("lucide", d),
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
              className: s(
                "lucide-".concat(
                  a(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                o,
              ),
              ...d,
            });
          });
          return ((t.displayName = a(e)), t);
        };
    },
    4616: (e, r, t) => {
      "use strict";
      t.d(r, { F: () => l });
      var n = t(2902);
      let a = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        s = n.$,
        l = (e, r) => (t) => {
          var n;
          if ((null == r ? void 0 : r.variants) == null)
            return s(
              e,
              null == t ? void 0 : t.class,
              null == t ? void 0 : t.className,
            );
          let { variants: l, defaultVariants: i } = r,
            o = Object.keys(l).map((e) => {
              let r = null == t ? void 0 : t[e],
                n = null == i ? void 0 : i[e];
              if (null === r) return null;
              let s = a(r) || a(n);
              return l[e][s];
            }),
            d =
              t &&
              Object.entries(t).reduce((e, r) => {
                let [t, n] = r;
                return (void 0 === n || (e[t] = n), e);
              }, {});
          return s(
            e,
            o,
            null == r || null == (n = r.compoundVariants)
              ? void 0
              : n.reduce((e, r) => {
                  let { class: t, className: n, ...a } = r;
                  return Object.entries(a).every((e) => {
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
    5400: (e, r, t) => {
      "use strict";
      t.d(r, { $: () => d });
      var n = t(4568),
        a = t(7620),
        s = t(6118),
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
        d = a.forwardRef((e, r) => {
          let { className: t, variant: a, size: l, asChild: d = !1, ...c } = e,
            u = d ? s.DX : "button";
          return (0, n.jsx)(u, {
            className: (0, i.cn)(o({ variant: a, size: l, className: t })),
            ref: r,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5605: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => n });
      let n = (0, t(2046).A)("puzzle", [
        [
          "path",
          {
            d: "M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z",
            key: "w46dr5",
          },
        ],
      ]);
    },
    5703: (e, r, t) => {
      "use strict";
      t.d(r, { cn: () => s });
      var n = t(2902),
        a = t(3714);
      function s() {
        for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
          r[t] = arguments[t];
        return (0, a.QP)((0, n.$)(r));
      }
    },
    6118: (e, r, t) => {
      "use strict";
      t.d(r, { DX: () => i, Dc: () => d, TL: () => l });
      var n,
        a = t(7620),
        s = t(1715);
      function l(e) {
        let r = a.forwardRef((r, t) => {
          var n;
          let l,
            i,
            { children: d, ...u } = r,
            g = null,
            v = !1,
            x = [];
          (f(d) && "function" == typeof h && (d = h(d._payload)),
            a.Children.forEach(d, (e) => {
              var r;
              if (
                ((r = e),
                a.isValidElement(r) &&
                  "function" == typeof r.type &&
                  "__radixId" in r.type &&
                  r.type.__radixId === o)
              ) {
                v = !0;
                let r = "child" in e.props ? e.props.child : e.props.children;
                (f(r) && "function" == typeof h && (r = h(r._payload)),
                  (g = c(e, r)),
                  x.push(g?.props?.children));
              } else x.push(e);
            }),
            g
              ? (g = a.cloneElement(g, void 0, x))
              : !v &&
                1 === a.Children.count(d) &&
                a.isValidElement(d) &&
                (g = d));
          let y = g
              ? ((n = g),
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
            b = (0, s.s)(t, y);
          if (!g) {
            if (d || 0 === d) throw Error(v ? m(e) : p(e));
            return d;
          }
          let w = (function (e, r) {
            let t = { ...r };
            for (let n in r) {
              let a = e[n],
                s = r[n];
              /^on[A-Z]/.test(n)
                ? a && s
                  ? (t[n] = (...e) => {
                      let r = s(...e);
                      return (a(...e), r);
                    })
                  : a && (t[n] = a)
                : "style" === n
                  ? (t[n] = { ...a, ...s })
                  : "className" === n &&
                    (t[n] = [a, s].filter(Boolean).join(" "));
            }
            return { ...e, ...t };
          })(u, g.props ?? {});
          return (
            g.type !== a.Fragment && (w.ref = t ? b : y),
            a.cloneElement(g, w)
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
            return a.isValidElement(r)
              ? a.cloneElement(r, void 0, e.props.children(r.props.children))
              : null;
          }
          return a.isValidElement(r) ? r : null;
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
        h = (n || (n = t.t(a, 2)))[" use ".trim().toString()];
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
        a = t(7620),
        s = t(5703);
      let l = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, s.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            t,
          ),
          ...a,
        });
      });
      l.displayName = "Card";
      let i = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, s.cn)("flex flex-col space-y-1.5 p-6", t),
          ...a,
        });
      });
      i.displayName = "CardHeader";
      let o = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, s.cn)("font-semibold leading-none tracking-tight", t),
          ...a,
        });
      });
      o.displayName = "CardTitle";
      let d = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, s.cn)("text-sm text-muted-foreground", t),
          ...a,
        });
      });
      d.displayName = "CardDescription";
      let c = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, s.cn)("p-6 pt-0", t),
          ...a,
        });
      });
      ((c.displayName = "CardContent"),
        (a.forwardRef((e, r) => {
          let { className: t, ...a } = e;
          return (0, n.jsx)("div", {
            ref: r,
            className: (0, s.cn)("flex items-center p-6 pt-0", t),
            ...a,
          });
        }).displayName = "CardFooter"));
    },
    8942: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => c }));
      var n = t(4568),
        a = t(8186),
        s = t(9977),
        l = t(5400),
        i = t(7801),
        o = t(5605);
      let d = [
        {
          name: "Slack Bot",
          desc: "Slack integration for notifications",
          status: "published",
          installs: 12,
        },
        {
          name: "Analytics Dashboard",
          desc: "Embedded analytics for workflows",
          status: "draft",
          installs: 0,
        },
        {
          name: "Custom Portal",
          desc: "Customer-facing workflow portal",
          status: "published",
          installs: 5,
        },
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
                      children: "Apps",
                    }),
                    (0, n.jsx)("p", {
                      className: "text-sm text-muted-foreground",
                      children: "Manage your integrated applications",
                    }),
                  ],
                }),
                (0, n.jsxs)(l.$, {
                  children: [
                    (0, n.jsx)(i.A, { className: "mr-1 h-4 w-4" }),
                    " New App",
                  ],
                }),
              ],
            }),
            (0, n.jsx)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
              children: d.map((e) =>
                (0, n.jsxs)(
                  a.Zp,
                  {
                    className:
                      "cursor-pointer transition-colors hover:border-primary/50",
                    children: [
                      (0, n.jsxs)(a.aR, {
                        children: [
                          (0, n.jsx)(o.A, {
                            className: "h-5 w-5 text-primary",
                          }),
                          (0, n.jsx)(a.ZB, {
                            className: "mt-2 text-sm",
                            children: e.name,
                          }),
                          (0, n.jsx)(a.BT, {
                            className: "text-xs",
                            children: e.desc,
                          }),
                        ],
                      }),
                      (0, n.jsxs)(a.Wu, {
                        className: "flex items-center justify-between",
                        children: [
                          (0, n.jsx)(s.E, {
                            variant:
                              "published" === e.status
                                ? "success"
                                : "secondary",
                            children: e.status,
                          }),
                          (0, n.jsxs)("span", {
                            className: "text-xs text-muted-foreground",
                            children: [e.installs, " installs"],
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
      var n = t(4568);
      t(7620);
      var a = t(4616),
        s = t(5703);
      let l = (0, a.F)(
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
        return (0, n.jsx)("div", {
          className: (0, s.cn)(l({ variant: t }), r),
          ...a,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 333))), (_N_E = e.O()));
  },
]);
