(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [838],
  {
    1715: (e, r, t) => {
      "use strict";
      t.d(r, { s: () => s });
      var l = t(7620);
      function n(e, r) {
        if ("function" == typeof e) return e(r);
        null != e && (e.current = r);
      }
      function s(...e) {
        return l.useCallback(
          (function (...e) {
            return (r) => {
              let t = !1,
                l = e.map((e) => {
                  let l = n(e, r);
                  return (t || "function" != typeof l || (t = !0), l);
                });
              if (t)
                return () => {
                  for (let r = 0; r < l.length; r++) {
                    let t = l[r];
                    "function" == typeof t ? t() : n(e[r], null);
                  }
                };
            };
          })(...e),
          e,
        );
      }
    },
    2031: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => l });
      let l = (0, t(2046).A)("play", [
        [
          "path",
          {
            d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
            key: "10ikf1",
          },
        ],
      ]);
    },
    2046: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => o });
      var l = t(7620);
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
      var a = {
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
      let i = (0, l.forwardRef)((e, r) => {
          let {
            color: t = "currentColor",
            size: n = 24,
            strokeWidth: i = 2,
            absoluteStrokeWidth: o,
            className: c = "",
            children: d,
            iconNode: u,
            ...f
          } = e;
          return (0, l.createElement)(
            "svg",
            {
              ref: r,
              ...a,
              width: n,
              height: n,
              stroke: t,
              strokeWidth: o ? (24 * Number(i)) / Number(n) : i,
              className: s("lucide", c),
              ...(!d &&
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
                return (0, l.createElement)(r, t);
              }),
              ...(Array.isArray(d) ? d : [d]),
            ],
          );
        }),
        o = (e, r) => {
          let t = (0, l.forwardRef)((t, a) => {
            let { className: o, ...c } = t;
            return (0, l.createElement)(i, {
              ref: a,
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
              ...c,
            });
          });
          return ((t.displayName = n(e)), t);
        };
    },
    2426: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 9183));
    },
    4128: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => l });
      let l = (0, t(2046).A)("workflow", [
        [
          "rect",
          { width: "8", height: "8", x: "3", y: "3", rx: "2", key: "by2w9f" },
        ],
        ["path", { d: "M7 11v4a2 2 0 0 0 2 2h4", key: "xkn7yn" }],
        [
          "rect",
          { width: "8", height: "8", x: "13", y: "13", rx: "2", key: "1cgmvn" },
        ],
      ]);
    },
    4616: (e, r, t) => {
      "use strict";
      t.d(r, { F: () => a });
      var l = t(2902);
      let n = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        s = l.$,
        a = (e, r) => (t) => {
          var l;
          if ((null == r ? void 0 : r.variants) == null)
            return s(
              e,
              null == t ? void 0 : t.class,
              null == t ? void 0 : t.className,
            );
          let { variants: a, defaultVariants: i } = r,
            o = Object.keys(a).map((e) => {
              let r = null == t ? void 0 : t[e],
                l = null == i ? void 0 : i[e];
              if (null === r) return null;
              let s = n(r) || n(l);
              return a[e][s];
            }),
            c =
              t &&
              Object.entries(t).reduce((e, r) => {
                let [t, l] = r;
                return (void 0 === l || (e[t] = l), e);
              }, {});
          return s(
            e,
            o,
            null == r || null == (l = r.compoundVariants)
              ? void 0
              : l.reduce((e, r) => {
                  let { class: t, className: l, ...n } = r;
                  return Object.entries(n).every((e) => {
                    let [r, t] = e;
                    return Array.isArray(t)
                      ? t.includes({ ...i, ...c }[r])
                      : { ...i, ...c }[r] === t;
                  })
                    ? [...e, t, l]
                    : e;
                }, []),
            null == t ? void 0 : t.class,
            null == t ? void 0 : t.className,
          );
        };
    },
    5400: (e, r, t) => {
      "use strict";
      t.d(r, { $: () => c });
      var l = t(4568),
        n = t(7620),
        s = t(6118),
        a = t(4616),
        i = t(5703);
      let o = (0, a.F)(
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
        c = n.forwardRef((e, r) => {
          let { className: t, variant: n, size: a, asChild: c = !1, ...d } = e,
            u = c ? s.DX : "button";
          return (0, l.jsx)(u, {
            className: (0, i.cn)(o({ variant: n, size: a, className: t })),
            ref: r,
            ...d,
          });
        });
      c.displayName = "Button";
    },
    5703: (e, r, t) => {
      "use strict";
      t.d(r, { cn: () => s });
      var l = t(2902),
        n = t(3714);
      function s() {
        for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
          r[t] = arguments[t];
        return (0, n.QP)((0, l.$)(r));
      }
    },
    6118: (e, r, t) => {
      "use strict";
      t.d(r, { DX: () => i, Dc: () => c, TL: () => a });
      var l,
        n = t(7620),
        s = t(1715);
      function a(e) {
        let r = n.forwardRef((r, t) => {
          var l;
          let a,
            i,
            { children: c, ...u } = r,
            x = null,
            v = !1,
            y = [];
          (f(c) && "function" == typeof h && (c = h(c._payload)),
            n.Children.forEach(c, (e) => {
              var r;
              if (
                ((r = e),
                n.isValidElement(r) &&
                  "function" == typeof r.type &&
                  "__radixId" in r.type &&
                  r.type.__radixId === o)
              ) {
                v = !0;
                let r = "child" in e.props ? e.props.child : e.props.children;
                (f(r) && "function" == typeof h && (r = h(r._payload)),
                  (x = d(e, r)),
                  y.push(x?.props?.children));
              } else y.push(e);
            }),
            x
              ? (x = n.cloneElement(x, void 0, y))
              : !v &&
                1 === n.Children.count(c) &&
                n.isValidElement(c) &&
                (x = c));
          let g = x
              ? ((l = x),
                (i =
                  (a = Object.getOwnPropertyDescriptor(l.props, "ref")?.get) &&
                  "isReactWarning" in a &&
                  a.isReactWarning)
                  ? l.ref
                  : (i =
                        (a = Object.getOwnPropertyDescriptor(l, "ref")?.get) &&
                        "isReactWarning" in a &&
                        a.isReactWarning)
                    ? l.props.ref
                    : l.props.ref || l.ref)
              : void 0,
            b = (0, s.s)(t, g);
          if (!x) {
            if (c || 0 === c) throw Error(v ? m(e) : p(e));
            return c;
          }
          let N = (function (e, r) {
            let t = { ...r };
            for (let l in r) {
              let n = e[l],
                s = r[l];
              /^on[A-Z]/.test(l)
                ? n && s
                  ? (t[l] = (...e) => {
                      let r = s(...e);
                      return (n(...e), r);
                    })
                  : n && (t[l] = n)
                : "style" === l
                  ? (t[l] = { ...n, ...s })
                  : "className" === l &&
                    (t[l] = [n, s].filter(Boolean).join(" "));
            }
            return { ...e, ...t };
          })(u, x.props ?? {});
          return (
            x.type !== n.Fragment && (N.ref = t ? b : g),
            n.cloneElement(x, N)
          );
        });
        return ((r.displayName = `${e}.Slot`), r);
      }
      var i = a("Slot"),
        o = Symbol.for("radix.slottable");
      function c(e) {
        let r = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((r.displayName = `${e}.Slottable`), (r.__radixId = o), r);
      }
      var d = (e, r) => {
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
        h = (l || (l = t.t(n, 2)))[" use ".trim().toString()];
    },
    7801: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => l });
      let l = (0, t(2046).A)("plus", [
        ["path", { d: "M5 12h14", key: "1ays0h" }],
        ["path", { d: "M12 5v14", key: "s699le" }],
      ]);
    },
    8186: (e, r, t) => {
      "use strict";
      t.d(r, {
        BT: () => c,
        Wu: () => d,
        ZB: () => o,
        Zp: () => a,
        aR: () => i,
      });
      var l = t(4568),
        n = t(7620),
        s = t(5703);
      let a = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, s.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            t,
          ),
          ...n,
        });
      });
      a.displayName = "Card";
      let i = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, s.cn)("flex flex-col space-y-1.5 p-6", t),
          ...n,
        });
      });
      i.displayName = "CardHeader";
      let o = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, s.cn)("font-semibold leading-none tracking-tight", t),
          ...n,
        });
      });
      o.displayName = "CardTitle";
      let c = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, s.cn)("text-sm text-muted-foreground", t),
          ...n,
        });
      });
      c.displayName = "CardDescription";
      let d = n.forwardRef((e, r) => {
        let { className: t, ...n } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, s.cn)("p-6 pt-0", t),
          ...n,
        });
      });
      ((d.displayName = "CardContent"),
        (n.forwardRef((e, r) => {
          let { className: t, ...n } = e;
          return (0, l.jsx)("div", {
            ref: r,
            className: (0, s.cn)("flex items-center p-6 pt-0", t),
            ...n,
          });
        }).displayName = "CardFooter"));
    },
    8876: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => l });
      let l = (0, t(2046).A)("save", [
        [
          "path",
          {
            d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
            key: "1c8476",
          },
        ],
        [
          "path",
          { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" },
        ],
        ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }],
      ]);
    },
    9183: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => u }));
      var l = t(4568),
        n = t(8186),
        s = t(5400),
        a = t(8876),
        i = t(2031);
      let o = (0, t(2046).A)("grip-vertical", [
        ["circle", { cx: "9", cy: "12", r: "1", key: "1vctgf" }],
        ["circle", { cx: "9", cy: "5", r: "1", key: "hp0tcf" }],
        ["circle", { cx: "9", cy: "19", r: "1", key: "fkjjf6" }],
        ["circle", { cx: "15", cy: "12", r: "1", key: "1tmaij" }],
        ["circle", { cx: "15", cy: "5", r: "1", key: "19l28e" }],
        ["circle", { cx: "15", cy: "19", r: "1", key: "f4zoj3" }],
      ]);
      var c = t(4128),
        d = t(7801);
      function u() {
        return (0, l.jsxs)("div", {
          className: "flex h-[calc(100vh-3rem)] flex-col",
          children: [
            (0, l.jsxs)("div", {
              className: "flex items-center justify-between border-b pb-4 mb-4",
              children: [
                (0, l.jsxs)("div", {
                  className: "flex items-center gap-3",
                  children: [
                    (0, l.jsx)("h1", {
                      className: "text-xl font-bold tracking-tight",
                      children: "Workflow Builder",
                    }),
                    (0, l.jsx)("span", {
                      className: "text-xs text-muted-foreground",
                      children: "Untitled Workflow",
                    }),
                  ],
                }),
                (0, l.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [
                    (0, l.jsxs)(s.$, {
                      variant: "outline",
                      size: "sm",
                      children: [
                        (0, l.jsx)(a.A, { className: "mr-1 h-4 w-4" }),
                        " Save",
                      ],
                    }),
                    (0, l.jsxs)(s.$, {
                      size: "sm",
                      children: [
                        (0, l.jsx)(i.A, { className: "mr-1 h-4 w-4" }),
                        " Run",
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, l.jsxs)("div", {
              className: "flex flex-1 gap-4",
              children: [
                (0, l.jsxs)(n.Zp, {
                  className: "w-64 shrink-0",
                  children: [
                    (0, l.jsx)(n.aR, {
                      children: (0, l.jsx)(n.ZB, {
                        className: "text-sm",
                        children: "Nodes",
                      }),
                    }),
                    (0, l.jsx)(n.Wu, {
                      className: "space-y-2",
                      children: [
                        "Trigger",
                        "Action",
                        "Condition",
                        "Transform",
                        "Delay",
                        "Notification",
                      ].map((e) =>
                        (0, l.jsxs)(
                          "div",
                          {
                            className:
                              "flex cursor-grab items-center gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted/50",
                            children: [
                              (0, l.jsx)(o, {
                                className: "h-4 w-4 text-muted-foreground",
                              }),
                              e,
                            ],
                          },
                          e,
                        ),
                      ),
                    }),
                  ],
                }),
                (0, l.jsx)(n.Zp, {
                  className: "flex-1",
                  children: (0, l.jsx)(n.Wu, {
                    className: "flex h-full items-center justify-center p-12",
                    children: (0, l.jsxs)("div", {
                      className: "text-center",
                      children: [
                        (0, l.jsx)(c.A, {
                          className:
                            "mx-auto h-12 w-12 text-muted-foreground/50",
                        }),
                        (0, l.jsx)("p", {
                          className: "mt-4 text-sm text-muted-foreground",
                          children:
                            "Drag nodes from the sidebar to start building your workflow",
                        }),
                        (0, l.jsxs)(s.$, {
                          variant: "outline",
                          className: "mt-4",
                          children: [
                            (0, l.jsx)(d.A, { className: "mr-1 h-4 w-4" }),
                            " Add Trigger",
                          ],
                        }),
                      ],
                    }),
                  }),
                }),
              ],
            }),
          ],
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 2426))), (_N_E = e.O()));
  },
]);
