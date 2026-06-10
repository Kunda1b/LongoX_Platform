(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [670],
  {
    421: (e, t, r) => {
      "use strict";
      r.d(t, { hO: () => o, sG: () => i });
      var n = r(7620),
        l = r(7509),
        a = r(6118),
        s = r(4568),
        i = [
          "a",
          "button",
          "div",
          "form",
          "h2",
          "h3",
          "img",
          "input",
          "label",
          "li",
          "nav",
          "ol",
          "p",
          "select",
          "span",
          "svg",
          "ul",
        ].reduce((e, t) => {
          let r = (0, a.TL)(`Primitive.${t}`),
            l = n.forwardRef((e, n) => {
              let { asChild: l, ...a } = e;
              return (
                "undefined" != typeof window &&
                  (window[Symbol.for("radix-ui")] = !0),
                (0, s.jsx)(l ? r : t, { ...a, ref: n })
              );
            });
          return ((l.displayName = `Primitive.${t}`), { ...e, [t]: l });
        }, {});
      function o(e, t) {
        e && l.flushSync(() => e.dispatchEvent(t));
      }
    },
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
    1579: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => c }));
      var n = r(4568),
        l = r(8186),
        a = r(5400),
        s = r(1063),
        i = r(9334),
        o = r(6932),
        d = r(8876);
      function c() {
        return (0, n.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, n.jsxs)("div", {
              className: "flex items-center gap-2",
              children: [
                (0, n.jsx)(o.A, { className: "h-5 w-5" }),
                (0, n.jsxs)("div", {
                  children: [
                    (0, n.jsx)("h1", {
                      className: "text-2xl font-bold tracking-tight",
                      children: "Settings",
                    }),
                    (0, n.jsx)("p", {
                      className: "text-sm text-muted-foreground",
                      children: "Manage your account settings",
                    }),
                  ],
                }),
              ],
            }),
            (0, n.jsxs)(l.Zp, {
              children: [
                (0, n.jsx)(l.aR, {
                  children: (0, n.jsx)(l.ZB, {
                    className: "text-lg",
                    children: "Profile",
                  }),
                }),
                (0, n.jsxs)(l.Wu, {
                  className: "space-y-4",
                  children: [
                    (0, n.jsxs)("div", {
                      className: "grid grid-cols-2 gap-4",
                      children: [
                        (0, n.jsxs)("div", {
                          className: "space-y-2",
                          children: [
                            (0, n.jsx)(i.J, {
                              htmlFor: "name",
                              children: "Name",
                            }),
                            (0, n.jsx)(s.p, {
                              id: "name",
                              defaultValue: "Alice Johnson",
                            }),
                          ],
                        }),
                        (0, n.jsxs)("div", {
                          className: "space-y-2",
                          children: [
                            (0, n.jsx)(i.J, {
                              htmlFor: "email",
                              children: "Email",
                            }),
                            (0, n.jsx)(s.p, {
                              id: "email",
                              type: "email",
                              defaultValue: "alice@acme.com",
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, n.jsxs)(a.$, {
                      children: [
                        (0, n.jsx)(d.A, { className: "mr-1 h-4 w-4" }),
                        " Save Changes",
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, n.jsxs)(l.Zp, {
              children: [
                (0, n.jsx)(l.aR, {
                  children: (0, n.jsx)(l.ZB, {
                    className: "text-lg",
                    children: "API Keys",
                  }),
                }),
                (0, n.jsx)(l.Wu, {
                  className: "space-y-3",
                  children: ["Production", "Development"].map((e) =>
                    (0, n.jsxs)(
                      "div",
                      {
                        className:
                          "flex items-center justify-between rounded-lg border p-3",
                        children: [
                          (0, n.jsxs)("div", {
                            children: [
                              (0, n.jsx)("p", {
                                className: "text-sm font-medium",
                                children: e,
                              }),
                              (0, n.jsxs)("p", {
                                className:
                                  "text-xs text-muted-foreground font-mono",
                                children: ["fc_", e.toLowerCase(), "_****a1b2"],
                              }),
                            ],
                          }),
                          (0, n.jsx)(a.$, {
                            variant: "outline",
                            size: "sm",
                            children: "Regenerate",
                          }),
                        ],
                      },
                      e,
                    ),
                  ),
                }),
              ],
            }),
          ],
        });
      }
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
      r.d(t, { A: () => o });
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
      let i = (0, n.forwardRef)((e, t) => {
          let {
            color: r = "currentColor",
            size: l = 24,
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
              ...s,
              width: l,
              height: l,
              stroke: r,
              strokeWidth: o ? (24 * Number(i)) / Number(l) : i,
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
          let r = (0, n.forwardRef)((r, s) => {
            let { className: o, ...d } = r;
            return (0, n.createElement)(i, {
              ref: s,
              iconNode: t,
              className: a(
                "lucide-".concat(
                  l(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                o,
              ),
              ...d,
            });
          });
          return ((r.displayName = l(e)), r);
        };
    },
    4526: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 1579));
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
          let { variants: s, defaultVariants: i } = t,
            o = Object.keys(s).map((e) => {
              let t = null == r ? void 0 : r[e],
                n = null == i ? void 0 : i[e];
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
            o,
            null == t || null == (n = t.compoundVariants)
              ? void 0
              : n.reduce((e, t) => {
                  let { class: r, className: n, ...l } = t;
                  return Object.entries(l).every((e) => {
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
        l = r(7620),
        a = r(6118),
        s = r(4616),
        i = r(5703);
      let o = (0, s.F)(
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
            className: (0, i.cn)(o({ variant: l, size: s, className: r })),
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
      r.d(t, { DX: () => i, Dc: () => d, TL: () => s });
      var n,
        l = r(7620),
        a = r(1715);
      function s(e) {
        let t = l.forwardRef((t, r) => {
          var n;
          let s,
            i,
            { children: d, ...u } = t,
            v = null,
            x = !1,
            y = [];
          (f(d) && "function" == typeof h && (d = h(d._payload)),
            l.Children.forEach(d, (e) => {
              var t;
              if (
                ((t = e),
                l.isValidElement(t) &&
                  "function" == typeof t.type &&
                  "__radixId" in t.type &&
                  t.type.__radixId === o)
              ) {
                x = !0;
                let t = "child" in e.props ? e.props.child : e.props.children;
                (f(t) && "function" == typeof h && (t = h(t._payload)),
                  (v = c(e, t)),
                  y.push(v?.props?.children));
              } else y.push(e);
            }),
            v
              ? (v = l.cloneElement(v, void 0, y))
              : !x &&
                1 === l.Children.count(d) &&
                l.isValidElement(d) &&
                (v = d));
          let g = v
              ? ((n = v),
                (i =
                  (s = Object.getOwnPropertyDescriptor(n.props, "ref")?.get) &&
                  "isReactWarning" in s &&
                  s.isReactWarning)
                  ? n.ref
                  : (i =
                        (s = Object.getOwnPropertyDescriptor(n, "ref")?.get) &&
                        "isReactWarning" in s &&
                        s.isReactWarning)
                    ? n.props.ref
                    : n.props.ref || n.ref)
              : void 0,
            b = (0, a.s)(r, g);
          if (!v) {
            if (d || 0 === d) throw Error(x ? m(e) : p(e));
            return d;
          }
          let w = (function (e, t) {
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
          })(u, v.props ?? {});
          return (
            v.type !== l.Fragment && (w.ref = r ? b : g),
            l.cloneElement(v, w)
          );
        });
        return ((t.displayName = `${e}.Slot`), t);
      }
      var i = s("Slot"),
        o = Symbol.for("radix.slottable");
      function d(e) {
        let t = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((t.displayName = `${e}.Slottable`), (t.__radixId = o), t);
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
    6932: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("settings", [
        [
          "path",
          {
            d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
            key: "1i5ecw",
          },
        ],
        ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
      ]);
    },
    8186: (e, t, r) => {
      "use strict";
      r.d(t, {
        BT: () => d,
        Wu: () => c,
        ZB: () => o,
        Zp: () => s,
        aR: () => i,
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
      let i = l.forwardRef((e, t) => {
        let { className: r, ...l } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("flex flex-col space-y-1.5 p-6", r),
          ...l,
        });
      });
      i.displayName = "CardHeader";
      let o = l.forwardRef((e, t) => {
        let { className: r, ...l } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("font-semibold leading-none tracking-tight", r),
          ...l,
        });
      });
      o.displayName = "CardTitle";
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
    8876: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("save", [
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
    9334: (e, t, r) => {
      "use strict";
      r.d(t, { J: () => c });
      var n = r(4568),
        l = r(7620),
        a = r(421),
        s = l.forwardRef((e, t) =>
          (0, n.jsx)(a.sG.label, {
            ...e,
            ref: t,
            onMouseDown: (t) => {
              var r;
              t.target.closest("button, input, select, textarea") ||
                (null == (r = e.onMouseDown) || r.call(e, t),
                !t.defaultPrevented && t.detail > 1 && t.preventDefault());
            },
          }),
        );
      s.displayName = "Label";
      var i = r(4616),
        o = r(5703);
      let d = (0, i.F)(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        ),
        c = l.forwardRef((e, t) => {
          let { className: r, ...l } = e;
          return (0, n.jsx)(s, { ref: t, className: (0, o.cn)(d(), r), ...l });
        });
      c.displayName = s.displayName;
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 4526))), (_N_E = e.O()));
  },
]);
