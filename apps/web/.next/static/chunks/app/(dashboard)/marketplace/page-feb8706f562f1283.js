(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [22],
  {
    1063: (e, r, t) => {
      "use strict";
      t.d(r, { p: () => l });
      var n = t(4568),
        a = t(7620),
        s = t(5703);
      let l = a.forwardRef((e, r) => {
        let { className: t, type: a, ...l } = e;
        return (0, n.jsx)("input", {
          type: a,
          className: (0, s.cn)(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            t,
          ),
          ref: r,
          ...l,
        });
      });
      l.displayName = "Input";
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
      t.d(r, { A: () => i });
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
      let o = (0, n.forwardRef)((e, r) => {
          let {
            color: t = "currentColor",
            size: a = 24,
            strokeWidth: o = 2,
            absoluteStrokeWidth: i,
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
              strokeWidth: i ? (24 * Number(o)) / Number(a) : o,
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
        i = (e, r) => {
          let t = (0, n.forwardRef)((t, l) => {
            let { className: i, ...d } = t;
            return (0, n.createElement)(o, {
              ref: l,
              iconNode: r,
              className: s(
                "lucide-".concat(
                  a(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                i,
              ),
              ...d,
            });
          });
          return ((t.displayName = a(e)), t);
        };
    },
    2381: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => n });
      let n = (0, t(2046).A)("search", [
        ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
        ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
      ]);
    },
    2566: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 4929));
    },
    2594: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => n });
      let n = (0, t(2046).A)("shopping-cart", [
        ["circle", { cx: "8", cy: "21", r: "1", key: "jimo8o" }],
        ["circle", { cx: "19", cy: "21", r: "1", key: "13723u" }],
        [
          "path",
          {
            d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",
            key: "9zh506",
          },
        ],
      ]);
    },
    4289: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => n });
      let n = (0, t(2046).A)("download", [
        ["path", { d: "M12 15V3", key: "m9g1x1" }],
        [
          "path",
          { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" },
        ],
        ["path", { d: "m7 10 5 5 5-5", key: "brsn70" }],
      ]);
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
          let { variants: l, defaultVariants: o } = r,
            i = Object.keys(l).map((e) => {
              let r = null == t ? void 0 : t[e],
                n = null == o ? void 0 : o[e];
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
            i,
            null == r || null == (n = r.compoundVariants)
              ? void 0
              : n.reduce((e, r) => {
                  let { class: t, className: n, ...a } = r;
                  return Object.entries(a).every((e) => {
                    let [r, t] = e;
                    return Array.isArray(t)
                      ? t.includes({ ...o, ...d }[r])
                      : { ...o, ...d }[r] === t;
                  })
                    ? [...e, t, n]
                    : e;
                }, []),
            null == t ? void 0 : t.class,
            null == t ? void 0 : t.className,
          );
        };
    },
    4929: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => f }));
      var n = t(4568),
        a = t(8186),
        s = t(9977),
        l = t(5400),
        o = t(1063),
        i = t(2381),
        d = t(2594),
        c = t(4289);
      let u = [
        {
          name: "Slack Connector Pro",
          desc: "Advanced Slack integration with rich messaging",
          type: "connector",
          price: "Free",
          downloads: 1200,
        },
        {
          name: "AI Text Analyzer",
          desc: "Analyze text using GPT models",
          type: "plugin",
          price: "$9.99/mo",
          downloads: 340,
        },
        {
          name: "Data Transform Suite",
          desc: "Transform data between formats",
          type: "plugin",
          price: "$4.99/mo",
          downloads: 560,
        },
        {
          name: "PostgreSQL Monitor",
          desc: "Monitor and alert on DB health",
          type: "connector",
          price: "Free",
          downloads: 890,
        },
      ];
      function f() {
        return (0, n.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, n.jsxs)("div", {
              children: [
                (0, n.jsx)("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: "Marketplace",
                }),
                (0, n.jsx)("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Discover connectors and plugins",
                }),
              ],
            }),
            (0, n.jsxs)("div", {
              className: "relative w-full max-w-sm",
              children: [
                (0, n.jsx)(i.A, {
                  className:
                    "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                }),
                (0, n.jsx)(o.p, {
                  placeholder: "Search marketplace...",
                  className: "pl-9",
                }),
              ],
            }),
            (0, n.jsx)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
              children: u.map((e) =>
                (0, n.jsxs)(
                  a.Zp,
                  {
                    children: [
                      (0, n.jsxs)(a.aR, {
                        children: [
                          (0, n.jsxs)("div", {
                            className: "flex items-start justify-between",
                            children: [
                              (0, n.jsx)(d.A, {
                                className: "h-5 w-5 text-primary",
                              }),
                              (0, n.jsx)(s.E, {
                                variant: "secondary",
                                className: "text-xs",
                                children: e.type,
                              }),
                            ],
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
                          (0, n.jsxs)("div", {
                            children: [
                              (0, n.jsx)("span", {
                                className: "text-sm font-semibold",
                                children: e.price,
                              }),
                              (0, n.jsxs)("span", {
                                className: "ml-2 text-xs text-muted-foreground",
                                children: [e.downloads, " downloads"],
                              }),
                            ],
                          }),
                          (0, n.jsxs)(l.$, {
                            size: "sm",
                            children: [
                              (0, n.jsx)(c.A, { className: "mr-1 h-4 w-4" }),
                              " Install",
                            ],
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
    5400: (e, r, t) => {
      "use strict";
      t.d(r, { $: () => d });
      var n = t(4568),
        a = t(7620),
        s = t(6118),
        l = t(4616),
        o = t(5703);
      let i = (0, l.F)(
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
            className: (0, o.cn)(i({ variant: a, size: l, className: t })),
            ref: r,
            ...c,
          });
        });
      d.displayName = "Button";
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
      t.d(r, { DX: () => o, Dc: () => d, TL: () => l });
      var n,
        a = t(7620),
        s = t(1715);
      function l(e) {
        let r = a.forwardRef((r, t) => {
          var n;
          let l,
            o,
            { children: d, ...u } = r,
            x = null,
            g = !1,
            y = [];
          (f(d) && "function" == typeof h && (d = h(d._payload)),
            a.Children.forEach(d, (e) => {
              var r;
              if (
                ((r = e),
                a.isValidElement(r) &&
                  "function" == typeof r.type &&
                  "__radixId" in r.type &&
                  r.type.__radixId === i)
              ) {
                g = !0;
                let r = "child" in e.props ? e.props.child : e.props.children;
                (f(r) && "function" == typeof h && (r = h(r._payload)),
                  (x = c(e, r)),
                  y.push(x?.props?.children));
              } else y.push(e);
            }),
            x
              ? (x = a.cloneElement(x, void 0, y))
              : !g &&
                1 === a.Children.count(d) &&
                a.isValidElement(d) &&
                (x = d));
          let v = x
              ? ((n = x),
                (o =
                  (l = Object.getOwnPropertyDescriptor(n.props, "ref")?.get) &&
                  "isReactWarning" in l &&
                  l.isReactWarning)
                  ? n.ref
                  : (o =
                        (l = Object.getOwnPropertyDescriptor(n, "ref")?.get) &&
                        "isReactWarning" in l &&
                        l.isReactWarning)
                    ? n.props.ref
                    : n.props.ref || n.ref)
              : void 0,
            b = (0, s.s)(t, v);
          if (!x) {
            if (d || 0 === d) throw Error(g ? m(e) : p(e));
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
          })(u, x.props ?? {});
          return (
            x.type !== a.Fragment && (w.ref = t ? b : v),
            a.cloneElement(x, w)
          );
        });
        return ((r.displayName = `${e}.Slot`), r);
      }
      var o = l("Slot"),
        i = Symbol.for("radix.slottable");
      function d(e) {
        let r = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((r.displayName = `${e}.Slottable`), (r.__radixId = i), r);
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
    8186: (e, r, t) => {
      "use strict";
      t.d(r, {
        BT: () => d,
        Wu: () => c,
        ZB: () => i,
        Zp: () => l,
        aR: () => o,
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
      let o = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, s.cn)("flex flex-col space-y-1.5 p-6", t),
          ...a,
        });
      });
      o.displayName = "CardHeader";
      let i = a.forwardRef((e, r) => {
        let { className: t, ...a } = e;
        return (0, n.jsx)("div", {
          ref: r,
          className: (0, s.cn)("font-semibold leading-none tracking-tight", t),
          ...a,
        });
      });
      i.displayName = "CardTitle";
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
    9977: (e, r, t) => {
      "use strict";
      t.d(r, { E: () => o });
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
      function o(e) {
        let { className: r, variant: t, ...a } = e;
        return (0, n.jsx)("div", {
          className: (0, s.cn)(l({ variant: t }), r),
          ...a,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 2566))), (_N_E = e.O()));
  },
]);
