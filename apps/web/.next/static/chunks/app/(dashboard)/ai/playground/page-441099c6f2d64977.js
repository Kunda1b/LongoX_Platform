(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [427],
  {
    1063: (e, t, r) => {
      "use strict";
      r.d(t, { p: () => s });
      var n = r(4568),
        l = r(7620),
        a = r(5703);
      let s = l.forwardRef((e, t) => {
        let { className: r, type: l, ...s } = e;
        return (0, n.jsx)("input", {
          type: l,
          className: (0, a.cn)(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            r,
          ),
          ref: t,
          ...s,
        });
      });
      s.displayName = "Input";
    },
    1715: (e, t, r) => {
      "use strict";
      r.d(t, { s: () => a });
      var n = r(7620);
      function l(e, t) {
        if ("function" == typeof e) return e(t);
        null != e && (e.current = t);
      }
      function a(...e) {
        return n.useCallback(
          (function (...e) {
            return (t) => {
              let r = !1,
                n = e.map((e) => {
                  let n = l(e, t);
                  return (r || "function" != typeof n || (r = !0), n);
                });
              if (r)
                return () => {
                  for (let t = 0; t < n.length; t++) {
                    let r = n[t];
                    "function" == typeof r ? r() : l(e[t], null);
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
      r.d(t, { A: () => i });
      var n = r(7620);
      let l = (e) => {
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
      var s = {
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
      let o = (0, n.forwardRef)((e, t) => {
          let {
            color: r = "currentColor",
            size: l = 24,
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
              ref: t,
              ...s,
              width: l,
              height: l,
              stroke: r,
              strokeWidth: i ? (24 * Number(o)) / Number(l) : o,
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
        i = (e, t) => {
          let r = (0, n.forwardRef)((r, s) => {
            let { className: i, ...d } = r;
            return (0, n.createElement)(o, {
              ref: s,
              iconNode: t,
              className: a(
                "lucide-".concat(
                  l(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                i,
              ),
              ...d,
            });
          });
          return ((r.displayName = l(e)), r);
        };
    },
    4616: (e, t, r) => {
      "use strict";
      r.d(t, { F: () => s });
      var n = r(2902);
      let l = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        a = n.$,
        s = (e, t) => (r) => {
          var n;
          if ((null == t ? void 0 : t.variants) == null)
            return a(
              e,
              null == r ? void 0 : r.class,
              null == r ? void 0 : r.className,
            );
          let { variants: s, defaultVariants: o } = t,
            i = Object.keys(s).map((e) => {
              let t = null == r ? void 0 : r[e],
                n = null == o ? void 0 : o[e];
              if (null === t) return null;
              let a = l(t) || l(n);
              return s[e][a];
            }),
            d =
              r &&
              Object.entries(r).reduce((e, t) => {
                let [r, n] = t;
                return (void 0 === n || (e[r] = n), e);
              }, {});
          return a(
            e,
            i,
            null == t || null == (n = t.compoundVariants)
              ? void 0
              : n.reduce((e, t) => {
                  let { class: r, className: n, ...l } = t;
                  return Object.entries(l).every((e) => {
                    let [t, r] = e;
                    return Array.isArray(r)
                      ? r.includes({ ...o, ...d }[t])
                      : { ...o, ...d }[t] === r;
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
        l = r(7620),
        a = r(6118),
        s = r(4616),
        o = r(5703);
      let i = (0, s.F)(
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
        d = l.forwardRef((e, t) => {
          let { className: r, variant: l, size: s, asChild: d = !1, ...c } = e,
            u = d ? a.DX : "button";
          return (0, n.jsx)(u, {
            className: (0, o.cn)(i({ variant: l, size: s, className: r })),
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
        l = r(3714);
      function a() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
          t[r] = arguments[r];
        return (0, l.QP)((0, n.$)(t));
      }
    },
    6118: (e, t, r) => {
      "use strict";
      r.d(t, { DX: () => o, Dc: () => d, TL: () => s });
      var n,
        l = r(7620),
        a = r(1715);
      function s(e) {
        let t = l.forwardRef((t, r) => {
          var n;
          let s,
            o,
            { children: d, ...u } = t,
            x = null,
            v = !1,
            y = [];
          (f(d) && "function" == typeof h && (d = h(d._payload)),
            l.Children.forEach(d, (e) => {
              var t;
              if (
                ((t = e),
                l.isValidElement(t) &&
                  "function" == typeof t.type &&
                  "__radixId" in t.type &&
                  t.type.__radixId === i)
              ) {
                v = !0;
                let t = "child" in e.props ? e.props.child : e.props.children;
                (f(t) && "function" == typeof h && (t = h(t._payload)),
                  (x = c(e, t)),
                  y.push(x?.props?.children));
              } else y.push(e);
            }),
            x
              ? (x = l.cloneElement(x, void 0, y))
              : !v &&
                1 === l.Children.count(d) &&
                l.isValidElement(d) &&
                (x = d));
          let g = x
              ? ((n = x),
                (o =
                  (s = Object.getOwnPropertyDescriptor(n.props, "ref")?.get) &&
                  "isReactWarning" in s &&
                  s.isReactWarning)
                  ? n.ref
                  : (o =
                        (s = Object.getOwnPropertyDescriptor(n, "ref")?.get) &&
                        "isReactWarning" in s &&
                        s.isReactWarning)
                    ? n.props.ref
                    : n.props.ref || n.ref)
              : void 0,
            b = (0, a.s)(r, g);
          if (!x) {
            if (d || 0 === d) throw Error(v ? m(e) : p(e));
            return d;
          }
          let N = (function (e, t) {
            let r = { ...t };
            for (let n in t) {
              let l = e[n],
                a = t[n];
              /^on[A-Z]/.test(n)
                ? l && a
                  ? (r[n] = (...e) => {
                      let t = a(...e);
                      return (l(...e), t);
                    })
                  : l && (r[n] = l)
                : "style" === n
                  ? (r[n] = { ...l, ...a })
                  : "className" === n &&
                    (r[n] = [l, a].filter(Boolean).join(" "));
            }
            return { ...e, ...r };
          })(u, x.props ?? {});
          return (
            x.type !== l.Fragment && (N.ref = r ? b : g),
            l.cloneElement(x, N)
          );
        });
        return ((t.displayName = `${e}.Slot`), t);
      }
      var o = s("Slot"),
        i = Symbol.for("radix.slottable");
      function d(e) {
        let t = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((t.displayName = `${e}.Slottable`), (t.__radixId = i), t);
      }
      var c = (e, t) => {
          if ("child" in e.props) {
            let t = e.props.child;
            return l.isValidElement(t)
              ? l.cloneElement(t, void 0, e.props.children(t.props.children))
              : null;
          }
          return l.isValidElement(t) ? t : null;
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
        h = (n || (n = r.t(l, 2)))[" use ".trim().toString()];
    },
    6469: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => c }));
      var n = r(4568),
        l = r(7620),
        a = r(8186),
        s = r(5400),
        o = r(1063),
        i = r(8314);
      let d = (0, r(2046).A)("send", [
        [
          "path",
          {
            d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
            key: "1ffxy3",
          },
        ],
        ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }],
      ]);
      function c() {
        let [e, t] = (0, l.useState)(""),
          [r, c] = (0, l.useState)([]);
        return (0, n.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, n.jsxs)("div", {
              children: [
                (0, n.jsx)("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: "AI Playground",
                }),
                (0, n.jsx)("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Test AI models and prompts",
                }),
              ],
            }),
            (0, n.jsxs)(a.Zp, {
              className: "flex flex-col h-[600px]",
              children: [
                (0, n.jsx)(a.aR, {
                  children: (0, n.jsxs)(a.ZB, {
                    className: "flex items-center gap-2 text-sm",
                    children: [
                      (0, n.jsx)(i.A, { className: "h-4 w-4" }),
                      " Chat",
                    ],
                  }),
                }),
                (0, n.jsxs)(a.Wu, {
                  className: "flex-1 overflow-y-auto space-y-4",
                  children: [
                    0 === r.length &&
                      (0, n.jsx)("p", {
                        className:
                          "text-sm text-muted-foreground text-center py-12",
                        children: "Send a message to test the AI model",
                      }),
                    r.map((e, t) =>
                      (0, n.jsx)(
                        "div",
                        {
                          className: "flex ".concat(
                            "user" === e.role ? "justify-end" : "justify-start",
                          ),
                          children: (0, n.jsx)("div", {
                            className:
                              "rounded-lg px-4 py-2 max-w-[80%] text-sm ".concat(
                                "user" === e.role
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted",
                              ),
                            children: e.content,
                          }),
                        },
                        t,
                      ),
                    ),
                  ],
                }),
                (0, n.jsx)("div", {
                  className: "border-t p-4",
                  children: (0, n.jsxs)("form", {
                    onSubmit: (r) => {
                      (r.preventDefault(),
                        e.trim() &&
                          (c((t) => [...t, { role: "user", content: e }]),
                          c((t) => [
                            ...t,
                            {
                              role: "assistant",
                              content: 'Simulated response to: "'.concat(
                                e,
                                '"',
                              ),
                            },
                          ]),
                          t("")));
                    },
                    className: "flex gap-2",
                    children: [
                      (0, n.jsx)(o.p, {
                        value: e,
                        onChange: (e) => t(e.target.value),
                        placeholder: "Type your prompt...",
                        className: "flex-1",
                      }),
                      (0, n.jsx)(s.$, {
                        type: "submit",
                        size: "icon",
                        children: (0, n.jsx)(d, { className: "h-4 w-4" }),
                      }),
                    ],
                  }),
                }),
              ],
            }),
          ],
        });
      }
    },
    8186: (e, t, r) => {
      "use strict";
      r.d(t, {
        BT: () => d,
        Wu: () => c,
        ZB: () => i,
        Zp: () => s,
        aR: () => o,
      });
      var n = r(4568),
        l = r(7620),
        a = r(5703);
      let s = l.forwardRef((e, t) => {
        let { className: r, ...l } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            r,
          ),
          ...l,
        });
      });
      s.displayName = "Card";
      let o = l.forwardRef((e, t) => {
        let { className: r, ...l } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("flex flex-col space-y-1.5 p-6", r),
          ...l,
        });
      });
      o.displayName = "CardHeader";
      let i = l.forwardRef((e, t) => {
        let { className: r, ...l } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("font-semibold leading-none tracking-tight", r),
          ...l,
        });
      });
      i.displayName = "CardTitle";
      let d = l.forwardRef((e, t) => {
        let { className: r, ...l } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("text-sm text-muted-foreground", r),
          ...l,
        });
      });
      d.displayName = "CardDescription";
      let c = l.forwardRef((e, t) => {
        let { className: r, ...l } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("p-6 pt-0", r),
          ...l,
        });
      });
      ((c.displayName = "CardContent"),
        (l.forwardRef((e, t) => {
          let { className: r, ...l } = e;
          return (0, n.jsx)("div", {
            ref: t,
            className: (0, a.cn)("flex items-center p-6 pt-0", r),
            ...l,
          });
        }).displayName = "CardFooter"));
    },
    8314: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("bot", [
        ["path", { d: "M12 8V4H8", key: "hb8ula" }],
        [
          "rect",
          { width: "16", height: "12", x: "4", y: "8", rx: "2", key: "enze0r" },
        ],
        ["path", { d: "M2 14h2", key: "vft8re" }],
        ["path", { d: "M20 14h2", key: "4cs60a" }],
        ["path", { d: "M15 13v2", key: "1xurst" }],
        ["path", { d: "M9 13v2", key: "rq6x2g" }],
      ]);
    },
    9999: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 6469));
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 9999))), (_N_E = e.O()));
  },
]);
