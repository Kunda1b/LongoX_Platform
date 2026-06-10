(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [881],
  {
    421: (e, t, r) => {
      "use strict";
      r.d(t, { hO: () => l, sG: () => i });
      var n = r(7620),
        a = r(7509),
        s = r(6118),
        o = r(4568),
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
          let r = (0, s.TL)(`Primitive.${t}`),
            a = n.forwardRef((e, n) => {
              let { asChild: a, ...s } = e;
              return (
                "undefined" != typeof window &&
                  (window[Symbol.for("radix-ui")] = !0),
                (0, o.jsx)(a ? r : t, { ...s, ref: n })
              );
            });
          return ((a.displayName = `Primitive.${t}`), { ...e, [t]: a });
        }, {});
      function l(e, t) {
        e && a.flushSync(() => e.dispatchEvent(t));
      }
    },
    1715: (e, t, r) => {
      "use strict";
      r.d(t, { s: () => s });
      var n = r(7620);
      function a(e, t) {
        if ("function" == typeof e) return e(t);
        null != e && (e.current = t);
      }
      function s(...e) {
        return n.useCallback(
          (function (...e) {
            return (t) => {
              let r = !1,
                n = e.map((e) => {
                  let n = a(e, t);
                  return (r || "function" != typeof n || (r = !0), n);
                });
              if (r)
                return () => {
                  for (let t = 0; t < n.length; t++) {
                    let r = n[t];
                    "function" == typeof r ? r() : a(e[t], null);
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
      r.d(t, { A: () => l });
      var n = r(7620);
      let a = (e) => {
          let t = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, r) =>
            r ? r.toUpperCase() : t.toLowerCase(),
          );
          return t.charAt(0).toUpperCase() + t.slice(1);
        },
        s = function () {
          for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
            t[r] = arguments[r];
          return t
            .filter((e, t, r) => !!e && "" !== e.trim() && r.indexOf(e) === t)
            .join(" ")
            .trim();
        };
      var o = {
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
            size: a = 24,
            strokeWidth: i = 2,
            absoluteStrokeWidth: l,
            className: d = "",
            children: c,
            iconNode: u,
            ...f
          } = e;
          return (0, n.createElement)(
            "svg",
            {
              ref: t,
              ...o,
              width: a,
              height: a,
              stroke: r,
              strokeWidth: l ? (24 * Number(i)) / Number(a) : i,
              className: s("lucide", d),
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
        l = (e, t) => {
          let r = (0, n.forwardRef)((r, o) => {
            let { className: l, ...d } = r;
            return (0, n.createElement)(i, {
              ref: o,
              iconNode: t,
              className: s(
                "lucide-".concat(
                  a(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                l,
              ),
              ...d,
            });
          });
          return ((r.displayName = a(e)), r);
        };
    },
    4111: (e, t, r) => {
      "use strict";
      r.d(t, { i: () => i });
      var n,
        a = r(7620),
        s = r(7514),
        o =
          (n || (n = r.t(a, 2)))[" useInsertionEffect ".trim().toString()] ||
          s.N;
      function i({
        prop: e,
        defaultProp: t,
        onChange: r = () => {},
        caller: n,
      }) {
        let [s, i, l] = (function ({ defaultProp: e, onChange: t }) {
            let [r, n] = a.useState(e),
              s = a.useRef(r),
              i = a.useRef(t);
            return (
              o(() => {
                i.current = t;
              }, [t]),
              a.useEffect(() => {
                s.current !== r && (i.current?.(r), (s.current = r));
              }, [r, s]),
              [r, n, i]
            );
          })({ defaultProp: t, onChange: r }),
          d = void 0 !== e,
          c = d ? e : s;
        {
          let t = a.useRef(void 0 !== e);
          a.useEffect(() => {
            let e = t.current;
            if (e !== d) {
              let t = d ? "controlled" : "uncontrolled";
              console.warn(
                `${n} is changing from ${e ? "controlled" : "uncontrolled"} to ${t}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`,
              );
            }
            t.current = d;
          }, [d, n]);
        }
        return [
          c,
          a.useCallback(
            (t) => {
              if (d) {
                let r = "function" == typeof t ? t(e) : t;
                r !== e && l.current?.(r);
              } else i(t);
            },
            [d, e, i, l],
          ),
        ];
      }
      Symbol("RADIX:SYNC_STATE");
    },
    4185: (e, t, r) => {
      "use strict";
      r.d(t, { X: () => s });
      var n = r(7620),
        a = r(7514);
      function s(e) {
        let [t, r] = n.useState(void 0);
        return (
          (0, a.N)(() => {
            if (e) {
              r({ width: e.offsetWidth, height: e.offsetHeight });
              let t = new ResizeObserver((t) => {
                let n, a;
                if (!Array.isArray(t) || !t.length) return;
                let s = t[0];
                if ("borderBoxSize" in s) {
                  let e = s.borderBoxSize,
                    t = Array.isArray(e) ? e[0] : e;
                  ((n = t.inlineSize), (a = t.blockSize));
                } else ((n = e.offsetWidth), (a = e.offsetHeight));
                r({ width: n, height: a });
              });
              return (
                t.observe(e, { box: "border-box" }),
                () => t.unobserve(e)
              );
            }
            r(void 0);
          }, [e]),
          t
        );
      }
    },
    4616: (e, t, r) => {
      "use strict";
      r.d(t, { F: () => o });
      var n = r(2902);
      let a = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        s = n.$,
        o = (e, t) => (r) => {
          var n;
          if ((null == t ? void 0 : t.variants) == null)
            return s(
              e,
              null == r ? void 0 : r.class,
              null == r ? void 0 : r.className,
            );
          let { variants: o, defaultVariants: i } = t,
            l = Object.keys(o).map((e) => {
              let t = null == r ? void 0 : r[e],
                n = null == i ? void 0 : i[e];
              if (null === t) return null;
              let s = a(t) || a(n);
              return o[e][s];
            }),
            d =
              r &&
              Object.entries(r).reduce((e, t) => {
                let [r, n] = t;
                return (void 0 === n || (e[r] = n), e);
              }, {});
          return s(
            e,
            l,
            null == t || null == (n = t.compoundVariants)
              ? void 0
              : n.reduce((e, t) => {
                  let { class: r, className: n, ...a } = t;
                  return Object.entries(a).every((e) => {
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
    4811: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("flag", [
        [
          "path",
          {
            d: "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",
            key: "1jaruq",
          },
        ],
      ]);
    },
    5286: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => P }));
      var n = r(4568),
        a = r(8186),
        s = r(9977),
        o = r(5400),
        i = r(7620),
        l = r(7231),
        d = r(1715),
        c = r(8107),
        u = r(4111),
        f = r(4185),
        p = r(421),
        m = "Switch",
        [h, v] = (0, c.A)(m),
        [b, g] = h(m);
      function x(e) {
        let {
            __scopeSwitch: t,
            checked: r,
            children: a,
            defaultChecked: s,
            disabled: o,
            form: l,
            name: d,
            onCheckedChange: c,
            required: f,
            value: p = "on",
            internal_do_not_use_render: h,
          } = e,
          [v, g] = (0, u.i)({
            prop: r,
            defaultProp: null != s && s,
            onChange: c,
            caller: m,
          }),
          [x, y] = i.useState(null),
          [w, N] = i.useState(null),
          j = i.useRef(!1),
          k = !x || !!l || !!x.closest("form"),
          E = {
            checked: v,
            setChecked: g,
            disabled: o,
            control: x,
            setControl: y,
            name: d,
            form: l,
            value: p,
            hasConsumerStoppedPropagationRef: j,
            required: f,
            defaultChecked: s,
            isFormControl: k,
            bubbleInput: w,
            setBubbleInput: N,
          };
        return (0, n.jsx)(b, {
          scope: t,
          ...E,
          children: "function" == typeof h ? h(E) : a,
        });
      }
      var y = "SwitchTrigger",
        w = i.forwardRef((e, t) => {
          let { __scopeSwitch: r, onClick: a, ...s } = e,
            {
              value: o,
              disabled: i,
              checked: c,
              required: u,
              setControl: f,
              setChecked: m,
              hasConsumerStoppedPropagationRef: h,
              isFormControl: v,
              bubbleInput: b,
            } = g(y, r),
            x = (0, d.s)(t, f);
          return (0, n.jsx)(p.sG.button, {
            type: "button",
            role: "switch",
            "aria-checked": c,
            "aria-required": u,
            "data-state": _(c),
            "data-disabled": i ? "" : void 0,
            disabled: i,
            value: o,
            ...s,
            ref: x,
            onClick: (0, l.mK)(a, (e) => {
              (m((e) => !e),
                b &&
                  v &&
                  ((h.current = e.isPropagationStopped()),
                  h.current || e.stopPropagation()));
            }),
          });
        });
      w.displayName = y;
      var N = i.forwardRef((e, t) => {
        let {
          __scopeSwitch: r,
          name: a,
          checked: s,
          defaultChecked: o,
          required: i,
          disabled: l,
          value: d,
          onCheckedChange: c,
          form: u,
          ...f
        } = e;
        return (0, n.jsx)(x, {
          __scopeSwitch: r,
          checked: s,
          defaultChecked: o,
          disabled: l,
          required: i,
          onCheckedChange: c,
          name: a,
          form: u,
          value: d,
          internal_do_not_use_render: (e) => {
            let { isFormControl: a } = e;
            return (0, n.jsxs)(n.Fragment, {
              children: [
                (0, n.jsx)(w, { ...f, ref: t, __scopeSwitch: r }),
                a && (0, n.jsx)(R, { __scopeSwitch: r }),
              ],
            });
          },
        });
      });
      N.displayName = m;
      var j = "SwitchThumb",
        k = i.forwardRef((e, t) => {
          let { __scopeSwitch: r, ...a } = e,
            s = g(j, r);
          return (0, n.jsx)(p.sG.span, {
            "data-state": _(s.checked),
            "data-disabled": s.disabled ? "" : void 0,
            ...a,
            ref: t,
          });
        });
      k.displayName = j;
      var E = "SwitchBubbleInput",
        R = i.forwardRef((e, t) => {
          let { __scopeSwitch: r, ...a } = e,
            {
              control: s,
              hasConsumerStoppedPropagationRef: o,
              checked: l,
              defaultChecked: c,
              required: u,
              disabled: m,
              name: h,
              value: v,
              form: b,
              bubbleInput: x,
              setBubbleInput: y,
            } = g(E, r),
            w = (0, d.s)(t, y),
            N = (function (e) {
              let t = i.useRef({ value: e, previous: e });
              return i.useMemo(
                () => (
                  t.current.value !== e &&
                    ((t.current.previous = t.current.value),
                    (t.current.value = e)),
                  t.current.previous
                ),
                [e],
              );
            })(l),
            j = (0, f.X)(s);
          i.useEffect(() => {
            if (!x) return;
            let e = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "checked",
              ).set,
              t = !o.current;
            if (N !== l && e) {
              let r = new Event("click", { bubbles: t });
              (e.call(x, l), x.dispatchEvent(r));
            }
          }, [x, N, l, o]);
          let k = i.useRef(l);
          return (0, n.jsx)(p.sG.input, {
            type: "checkbox",
            "aria-hidden": !0,
            defaultChecked: null != c ? c : k.current,
            required: u,
            disabled: m,
            name: h,
            value: v,
            form: b,
            ...a,
            tabIndex: -1,
            ref: w,
            style: {
              ...a.style,
              ...j,
              position: "absolute",
              pointerEvents: "none",
              opacity: 0,
              margin: 0,
              transform: "translateX(-100%)",
            },
          });
        });
      function _(e) {
        return e ? "checked" : "unchecked";
      }
      R.displayName = E;
      var A = r(5703);
      let C = i.forwardRef((e, t) => {
        let { className: r, ...a } = e;
        return (0, n.jsx)(N, {
          className: (0, A.cn)(
            "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
            r,
          ),
          ...a,
          ref: t,
          children: (0, n.jsx)(k, {
            className: (0, A.cn)(
              "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
            ),
          }),
        });
      });
      C.displayName = N.displayName;
      var S = r(4811),
        $ = r(7801);
      let O = [
        {
          name: "new-dashboard",
          description: "New dashboard UI",
          enabled: !0,
          percentage: 100,
        },
        {
          name: "ai-features",
          description: "AI-powered workflow suggestions",
          enabled: !1,
          percentage: 0,
        },
        {
          name: "dark-mode",
          description: "Dark mode support",
          enabled: !0,
          percentage: 50,
        },
        {
          name: "beta-connectors",
          description: "New connector integrations",
          enabled: !0,
          percentage: 25,
        },
      ];
      function P() {
        return (0, n.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, n.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, n.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [
                    (0, n.jsx)(S.A, { className: "h-5 w-5" }),
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("h1", {
                          className: "text-2xl font-bold tracking-tight",
                          children: "Feature Flags",
                        }),
                        (0, n.jsx)("p", {
                          className: "text-sm text-muted-foreground",
                          children: "Manage feature rollouts",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, n.jsxs)(o.$, {
                  children: [
                    (0, n.jsx)($.A, { className: "mr-1 h-4 w-4" }),
                    " New Flag",
                  ],
                }),
              ],
            }),
            (0, n.jsx)("div", {
              className: "space-y-3",
              children: O.map((e) =>
                (0, n.jsx)(
                  a.Zp,
                  {
                    children: (0, n.jsxs)(a.Wu, {
                      className: "flex items-center justify-between p-4",
                      children: [
                        (0, n.jsxs)("div", {
                          className: "flex items-center gap-3",
                          children: [
                            (0, n.jsx)(C, { defaultChecked: e.enabled }),
                            (0, n.jsxs)("div", {
                              children: [
                                (0, n.jsx)("p", {
                                  className: "text-sm font-medium",
                                  children: e.name,
                                }),
                                (0, n.jsx)("p", {
                                  className: "text-xs text-muted-foreground",
                                  children: e.description,
                                }),
                              ],
                            }),
                          ],
                        }),
                        (0, n.jsx)(s.E, {
                          variant: e.enabled ? "success" : "secondary",
                          children: e.enabled
                            ? "".concat(e.percentage, "% rollout")
                            : "disabled",
                        }),
                      ],
                    }),
                  },
                  e.name,
                ),
              ),
            }),
          ],
        });
      }
    },
    5400: (e, t, r) => {
      "use strict";
      r.d(t, { $: () => d });
      var n = r(4568),
        a = r(7620),
        s = r(6118),
        o = r(4616),
        i = r(5703);
      let l = (0, o.F)(
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
        d = a.forwardRef((e, t) => {
          let { className: r, variant: a, size: o, asChild: d = !1, ...c } = e,
            u = d ? s.DX : "button";
          return (0, n.jsx)(u, {
            className: (0, i.cn)(l({ variant: a, size: o, className: r })),
            ref: t,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5703: (e, t, r) => {
      "use strict";
      r.d(t, { cn: () => s });
      var n = r(2902),
        a = r(3714);
      function s() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
          t[r] = arguments[r];
        return (0, a.QP)((0, n.$)(t));
      }
    },
    6118: (e, t, r) => {
      "use strict";
      r.d(t, { DX: () => i, Dc: () => d, TL: () => o });
      var n,
        a = r(7620),
        s = r(1715);
      function o(e) {
        let t = a.forwardRef((t, r) => {
          var n;
          let o,
            i,
            { children: d, ...u } = t,
            v = null,
            b = !1,
            g = [];
          (f(d) && "function" == typeof h && (d = h(d._payload)),
            a.Children.forEach(d, (e) => {
              var t;
              if (
                ((t = e),
                a.isValidElement(t) &&
                  "function" == typeof t.type &&
                  "__radixId" in t.type &&
                  t.type.__radixId === l)
              ) {
                b = !0;
                let t = "child" in e.props ? e.props.child : e.props.children;
                (f(t) && "function" == typeof h && (t = h(t._payload)),
                  (v = c(e, t)),
                  g.push(v?.props?.children));
              } else g.push(e);
            }),
            v
              ? (v = a.cloneElement(v, void 0, g))
              : !b &&
                1 === a.Children.count(d) &&
                a.isValidElement(d) &&
                (v = d));
          let x = v
              ? ((n = v),
                (i =
                  (o = Object.getOwnPropertyDescriptor(n.props, "ref")?.get) &&
                  "isReactWarning" in o &&
                  o.isReactWarning)
                  ? n.ref
                  : (i =
                        (o = Object.getOwnPropertyDescriptor(n, "ref")?.get) &&
                        "isReactWarning" in o &&
                        o.isReactWarning)
                    ? n.props.ref
                    : n.props.ref || n.ref)
              : void 0,
            y = (0, s.s)(r, x);
          if (!v) {
            if (d || 0 === d) throw Error(b ? m(e) : p(e));
            return d;
          }
          let w = (function (e, t) {
            let r = { ...t };
            for (let n in t) {
              let a = e[n],
                s = t[n];
              /^on[A-Z]/.test(n)
                ? a && s
                  ? (r[n] = (...e) => {
                      let t = s(...e);
                      return (a(...e), t);
                    })
                  : a && (r[n] = a)
                : "style" === n
                  ? (r[n] = { ...a, ...s })
                  : "className" === n &&
                    (r[n] = [a, s].filter(Boolean).join(" "));
            }
            return { ...e, ...r };
          })(u, v.props ?? {});
          return (
            v.type !== a.Fragment && (w.ref = r ? y : x),
            a.cloneElement(v, w)
          );
        });
        return ((t.displayName = `${e}.Slot`), t);
      }
      var i = o("Slot"),
        l = Symbol.for("radix.slottable");
      function d(e) {
        let t = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((t.displayName = `${e}.Slottable`), (t.__radixId = l), t);
      }
      var c = (e, t) => {
          if ("child" in e.props) {
            let t = e.props.child;
            return a.isValidElement(t)
              ? a.cloneElement(t, void 0, e.props.children(t.props.children))
              : null;
          }
          return a.isValidElement(t) ? t : null;
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
        h = (n || (n = r.t(a, 2)))[" use ".trim().toString()];
    },
    7231: (e, t, r) => {
      "use strict";
      function n(e, t, { checkForDefaultPrevented: r = !0 } = {}) {
        return function (n) {
          if ((e?.(n), !1 === r || !n.defaultPrevented)) return t?.(n);
        };
      }
      (r.d(t, { mK: () => n }),
        "undefined" != typeof window &&
          window.document &&
          window.document.createElement);
    },
    7355: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 5286));
    },
    7514: (e, t, r) => {
      "use strict";
      r.d(t, { N: () => a });
      var n = r(7620),
        a = globalThis?.document ? n.useLayoutEffect : () => {};
    },
    7801: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("plus", [
        ["path", { d: "M5 12h14", key: "1ays0h" }],
        ["path", { d: "M12 5v14", key: "s699le" }],
      ]);
    },
    8107: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => s });
      var n = r(7620),
        a = r(4568);
      function s(e, t = []) {
        let r = [],
          o = () => {
            let t = r.map((e) => n.createContext(e));
            return function (r) {
              let a = r?.[e] || t;
              return n.useMemo(
                () => ({ [`__scope${e}`]: { ...r, [e]: a } }),
                [r, a],
              );
            };
          };
        return (
          (o.scopeName = e),
          [
            function (t, s) {
              let o = n.createContext(s);
              o.displayName = t + "Context";
              let i = r.length;
              r = [...r, s];
              let l = (t) => {
                let { scope: r, children: s, ...l } = t,
                  d = r?.[e]?.[i] || o,
                  c = n.useMemo(() => l, Object.values(l));
                return (0, a.jsx)(d.Provider, { value: c, children: s });
              };
              return (
                (l.displayName = t + "Provider"),
                [
                  l,
                  function (r, a) {
                    let l = a?.[e]?.[i] || o,
                      d = n.useContext(l);
                    if (d) return d;
                    if (void 0 !== s) return s;
                    throw Error(`\`${r}\` must be used within \`${t}\``);
                  },
                ]
              );
            },
            (function (...e) {
              let t = e[0];
              if (1 === e.length) return t;
              let r = () => {
                let r = e.map((e) => ({
                  useScope: e(),
                  scopeName: e.scopeName,
                }));
                return function (e) {
                  let a = r.reduce((t, { useScope: r, scopeName: n }) => {
                    let a = r(e)[`__scope${n}`];
                    return { ...t, ...a };
                  }, {});
                  return n.useMemo(
                    () => ({ [`__scope${t.scopeName}`]: a }),
                    [a],
                  );
                };
              };
              return ((r.scopeName = t.scopeName), r);
            })(o, ...t),
          ]
        );
      }
    },
    8186: (e, t, r) => {
      "use strict";
      r.d(t, {
        BT: () => d,
        Wu: () => c,
        ZB: () => l,
        Zp: () => o,
        aR: () => i,
      });
      var n = r(4568),
        a = r(7620),
        s = r(5703);
      let o = a.forwardRef((e, t) => {
        let { className: r, ...a } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, s.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            r,
          ),
          ...a,
        });
      });
      o.displayName = "Card";
      let i = a.forwardRef((e, t) => {
        let { className: r, ...a } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, s.cn)("flex flex-col space-y-1.5 p-6", r),
          ...a,
        });
      });
      i.displayName = "CardHeader";
      let l = a.forwardRef((e, t) => {
        let { className: r, ...a } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, s.cn)("font-semibold leading-none tracking-tight", r),
          ...a,
        });
      });
      l.displayName = "CardTitle";
      let d = a.forwardRef((e, t) => {
        let { className: r, ...a } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, s.cn)("text-sm text-muted-foreground", r),
          ...a,
        });
      });
      d.displayName = "CardDescription";
      let c = a.forwardRef((e, t) => {
        let { className: r, ...a } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, s.cn)("p-6 pt-0", r),
          ...a,
        });
      });
      ((c.displayName = "CardContent"),
        (a.forwardRef((e, t) => {
          let { className: r, ...a } = e;
          return (0, n.jsx)("div", {
            ref: t,
            className: (0, s.cn)("flex items-center p-6 pt-0", r),
            ...a,
          });
        }).displayName = "CardFooter"));
    },
    9977: (e, t, r) => {
      "use strict";
      r.d(t, { E: () => i });
      var n = r(4568);
      r(7620);
      var a = r(4616),
        s = r(5703);
      let o = (0, a.F)(
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
        let { className: t, variant: r, ...a } = e;
        return (0, n.jsx)("div", {
          className: (0, s.cn)(o({ variant: r }), t),
          ...a,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 7355))), (_N_E = e.O()));
  },
]);
