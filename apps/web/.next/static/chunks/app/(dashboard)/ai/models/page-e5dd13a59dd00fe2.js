(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [416],
  {
    1715: (e, r, t) => {
      "use strict";
      t.d(r, { s: () => s });
      var a = t(7620);
      function n(e, r) {
        if ("function" == typeof e) return e(r);
        null != e && (e.current = r);
      }
      function s(...e) {
        return a.useCallback(
          (function (...e) {
            return (r) => {
              let t = !1,
                a = e.map((e) => {
                  let a = n(e, r);
                  return (t || "function" != typeof a || (t = !0), a);
                });
              if (t)
                return () => {
                  for (let r = 0; r < a.length; r++) {
                    let t = a[r];
                    "function" == typeof t ? t() : n(e[r], null);
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
      var a = t(7620);
      let n = (e) => {
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
      let i = (0, a.forwardRef)((e, r) => {
          let {
            color: t = "currentColor",
            size: n = 24,
            strokeWidth: i = 2,
            absoluteStrokeWidth: o,
            className: d = "",
            children: c,
            iconNode: u,
            ...f
          } = e;
          return (0, a.createElement)(
            "svg",
            {
              ref: r,
              ...l,
              width: n,
              height: n,
              stroke: t,
              strokeWidth: o ? (24 * Number(i)) / Number(n) : i,
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
                return (0, a.createElement)(r, t);
              }),
              ...(Array.isArray(c) ? c : [c]),
            ],
          );
        }),
        o = (e, r) => {
          let t = (0, a.forwardRef)((t, l) => {
            let { className: o, ...d } = t;
            return (0, a.createElement)(i, {
              ref: l,
              iconNode: r,
              className: s(
                "lucide-".concat(
                  n(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                o,
              ),
              ...d,
            });
          });
          return ((t.displayName = n(e)), t);
        };
    },
    4616: (e, r, t) => {
      "use strict";
      t.d(r, { F: () => l });
      var a = t(2902);
      let n = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        s = a.$,
        l = (e, r) => (t) => {
          var a;
          if ((null == r ? void 0 : r.variants) == null)
            return s(
              e,
              null == t ? void 0 : t.class,
              null == t ? void 0 : t.className,
            );
          let { variants: l, defaultVariants: i } = r,
            o = Object.keys(l).map((e) => {
              let r = null == t ? void 0 : t[e],
                a = null == i ? void 0 : i[e];
              if (null === r) return null;
              let s = n(r) || n(a);
              return l[e][s];
            }),
            d =
              t &&
              Object.entries(t).reduce((e, r) => {
                let [t, a] = r;
                return (void 0 === a || (e[t] = a), e);
              }, {});
          return s(
            e,
            o,
            null == r || null == (a = r.compoundVariants)
              ? void 0
              : a.reduce((e, r) => {
                  let { class: t, className: a, ...n } = r;
                  return Object.entries(n).every((e) => {
                    let [r, t] = e;
                    return Array.isArray(t)
                      ? t.includes({ ...i, ...d }[r])
                      : { ...i, ...d }[r] === t;
                  })
                    ? [...e, t, a]
                    : e;
                }, []),
            null == t ? void 0 : t.class,
            null == t ? void 0 : t.className,
          );
        };
    },
    5077: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => a });
      let a = (0, t(2046).A)("hard-drive", [
        ["line", { x1: "22", x2: "2", y1: "12", y2: "12", key: "1y58io" }],
        [
          "path",
          {
            d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
            key: "oot6mr",
          },
        ],
        ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16", key: "sgf278" }],
        ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16", key: "1l4acy" }],
      ]);
    },
    5400: (e, r, t) => {
      "use strict";
      t.d(r, { $: () => d });
      var a = t(4568),
        n = t(7620),
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
        d = n.forwardRef((e, r) => {
          let { className: t, variant: n, size: l, asChild: d = !1, ...c } = e,
            u = d ? s.DX : "button";
          return (0, a.jsx)(u, {
            className: (0, i.cn)(o({ variant: n, size: l, className: t })),
            ref: r,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5578: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 9779));
    },
    5703: (e, r, t) => {
      "use strict";
      t.d(r, { cn: () => s });
      var a = t(2902),
        n = t(3714);
      function s() {
        for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
          r[t] = arguments[t];
        return (0, n.QP)((0, a.$)(r));
      }
    },
    6118: (e, r, t) => {
      "use strict";
      t.d(r, { DX: () => i, Dc: () => d, TL: () => l });
      var a,
        n = t(7620),
        s = t(1715);
      function l(e) {
        let r = n.forwardRef((r, t) => {
          var a;
          let l,
            i,
            { children: d, ...u } = r,
            h = null,
            x = !1,
            y = [];
          (f(d) && "function" == typeof v && (d = v(d._payload)),
            n.Children.forEach(d, (e) => {
              var r;
              if (
                ((r = e),
                n.isValidElement(r) &&
                  "function" == typeof r.type &&
                  "__radixId" in r.type &&
                  r.type.__radixId === o)
              ) {
                x = !0;
                let r = "child" in e.props ? e.props.child : e.props.children;
                (f(r) && "function" == typeof v && (r = v(r._payload)),
                  (h = c(e, r)),
                  y.push(h?.props?.children));
              } else y.push(e);
            }),
            h
              ? (h = n.cloneElement(h, void 0, y))
              : !x &&
                1 === n.Children.count(d) &&
                n.isValidElement(d) &&
                (h = d));
          let g = h
              ? ((a = h),
                (i =
                  (l = Object.getOwnPropertyDescriptor(a.props, "ref")?.get) &&
                  "isReactWarning" in l &&
                  l.isReactWarning)
                  ? a.ref
                  : (i =
                        (l = Object.getOwnPropertyDescriptor(a, "ref")?.get) &&
                        "isReactWarning" in l &&
                        l.isReactWarning)
                    ? a.props.ref
                    : a.props.ref || a.ref)
              : void 0,
            b = (0, s.s)(t, g);
          if (!h) {
            if (d || 0 === d) throw Error(x ? m(e) : p(e));
            return d;
          }
          let w = (function (e, r) {
            let t = { ...r };
            for (let a in r) {
              let n = e[a],
                s = r[a];
              /^on[A-Z]/.test(a)
                ? n && s
                  ? (t[a] = (...e) => {
                      let r = s(...e);
                      return (n(...e), r);
                    })
                  : n && (t[a] = n)
                : "style" === a
                  ? (t[a] = { ...n, ...s })
                  : "className" === a &&
                    (t[a] = [n, s].filter(Boolean).join(" "));
            }
            return { ...e, ...t };
          })(u, h.props ?? {});
          return (
            h.type !== n.Fragment && (w.ref = t ? b : g),
            n.cloneElement(h, w)
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
            return n.isValidElement(r)
              ? n.cloneElement(r, void 0, e.props.children(r.props.children))
              : null;
          }
          return n.isValidElement(r) ? r : null;
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
        v = (a || (a = t.t(n, 2)))[" use ".trim().toString()];
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
      var a = t(4568),
        n = t(7620),
        s = t(5703);
      let l = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, s.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            t,
          ),
          ...n,
        });
      });
      l.displayName = "Card";
      let i = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, s.cn)("flex flex-col space-y-1.5 p-6", t),
          ...n,
        });
      });
      i.displayName = "CardHeader";
      let o = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, s.cn)("font-semibold leading-none tracking-tight", t),
          ...n,
        });
      });
      o.displayName = "CardTitle";
      let d = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, s.cn)("text-sm text-muted-foreground", t),
          ...n,
        });
      });
      d.displayName = "CardDescription";
      let c = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, a.jsx)("div", {
          ref: r,
          className: (0, s.cn)("p-6 pt-0", t),
          ...n,
        });
      });
      ((c.displayName = "CardContent"),
        (n.forwardRef((e, r) => {
          let { className: t, ...n } = e;
          return (0, a.jsx)("div", {
            ref: r,
            className: (0, s.cn)("flex items-center p-6 pt-0", t),
            ...n,
          });
        }).displayName = "CardFooter"));
    },
    9779: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => c }));
      var a = t(4568),
        n = t(8186),
        s = t(9977),
        l = t(5400),
        i = t(5077);
      let o = (0, t(2046).A)("check", [
          ["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }],
        ]),
        d = [
          {
            name: "GPT-4o",
            provider: "OpenAI",
            status: "available",
            latency: "1.2s",
          },
          {
            name: "Claude 3.5 Sonnet",
            provider: "Anthropic",
            status: "available",
            latency: "1.8s",
          },
          {
            name: "Llama 3 70B",
            provider: "Meta",
            status: "maintenance",
            latency: "2.1s",
          },
          {
            name: "Mistral Large",
            provider: "Mistral",
            status: "available",
            latency: "1.5s",
          },
        ];
      function c() {
        return (0, a.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, a.jsxs)("div", {
              children: [
                (0, a.jsx)("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: "AI Models",
                }),
                (0, a.jsx)("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Manage and monitor AI models",
                }),
              ],
            }),
            (0, a.jsx)("div", {
              className: "grid gap-4 md:grid-cols-2",
              children: d.map((e) =>
                (0, a.jsxs)(
                  n.Zp,
                  {
                    children: [
                      (0, a.jsxs)(n.aR, {
                        className:
                          "flex flex-row items-start justify-between pb-2",
                        children: [
                          (0, a.jsxs)("div", {
                            children: [
                              (0, a.jsx)(n.ZB, {
                                className: "text-sm",
                                children: e.name,
                              }),
                              (0, a.jsx)(n.BT, {
                                className: "text-xs",
                                children: e.provider,
                              }),
                            ],
                          }),
                          (0, a.jsx)(i.A, {
                            className: "h-4 w-4 text-muted-foreground",
                          }),
                        ],
                      }),
                      (0, a.jsxs)(n.Wu, {
                        className: "flex items-center justify-between",
                        children: [
                          (0, a.jsxs)("div", {
                            className: "flex items-center gap-2",
                            children: [
                              (0, a.jsx)(s.E, {
                                variant:
                                  "available" === e.status
                                    ? "success"
                                    : "warning",
                                children: e.status,
                              }),
                              (0, a.jsx)("span", {
                                className: "text-xs text-muted-foreground",
                                children: e.latency,
                              }),
                            ],
                          }),
                          (0, a.jsx)(l.$, {
                            variant: "ghost",
                            size: "sm",
                            children:
                              "available" === e.status
                                ? (0, a.jsx)(o, {
                                    className: "h-4 w-4 text-emerald-500",
                                  })
                                : "Enable",
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
      var n = t(4616),
        s = t(5703);
      let l = (0, n.F)(
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
        let { className: r, variant: t, ...n } = e;
        return (0, a.jsx)("div", {
          className: (0, s.cn)(l({ variant: t }), r),
          ...n,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 5578))), (_N_E = e.O()));
  },
]);
