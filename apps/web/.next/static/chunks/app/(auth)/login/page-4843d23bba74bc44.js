(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [72],
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
    533: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => u }));
      var n = r(4568),
        l = r(7620),
        a = r(1674),
        s = r(5400),
        i = r(1063),
        o = r(9334),
        d = r(8186);
      function u() {
        let { login: e, isLoading: t } = (0, a.A)(),
          [r, u] = (0, l.useState)(""),
          [c, f] = (0, l.useState)(""),
          [p, m] = (0, l.useState)(""),
          [h, v] = (0, l.useState)(!1),
          y = async (t) => {
            (t.preventDefault(), m(""), v(!0));
            try {
              await e(r, c);
            } catch (e) {
              m(e instanceof Error ? e.message : "Login failed");
            } finally {
              v(!1);
            }
          };
        return (0, n.jsx)("div", {
          className:
            "flex min-h-screen items-center justify-center bg-muted/30 px-4",
          children: (0, n.jsxs)(d.Zp, {
            className: "w-full max-w-sm",
            children: [
              (0, n.jsxs)(d.aR, {
                className: "text-center",
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground",
                    children: "FC",
                  }),
                  (0, n.jsx)(d.ZB, { children: "LongoX" }),
                  (0, n.jsx)(d.BT, { children: "Sign in to your account" }),
                ],
              }),
              (0, n.jsx)(d.Wu, {
                children: (0, n.jsxs)("form", {
                  onSubmit: y,
                  className: "space-y-4",
                  children: [
                    (0, n.jsxs)("div", {
                      className: "space-y-2",
                      children: [
                        (0, n.jsx)(o.J, {
                          htmlFor: "email",
                          children: "Email",
                        }),
                        (0, n.jsx)(i.p, {
                          id: "email",
                          type: "email",
                          placeholder: "you@example.com",
                          value: r,
                          onChange: (e) => u(e.target.value),
                          required: !0,
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      className: "space-y-2",
                      children: [
                        (0, n.jsx)(o.J, {
                          htmlFor: "password",
                          children: "Password",
                        }),
                        (0, n.jsx)(i.p, {
                          id: "password",
                          type: "password",
                          value: c,
                          onChange: (e) => f(e.target.value),
                          required: !0,
                        }),
                      ],
                    }),
                    p &&
                      (0, n.jsx)("p", {
                        className: "text-sm text-destructive",
                        children: p,
                      }),
                    (0, n.jsx)(s.$, {
                      type: "submit",
                      className: "w-full",
                      disabled: h || t,
                      children: h ? "Signing in..." : "Sign in",
                    }),
                  ],
                }),
              }),
            ],
          }),
        });
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
    1674: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => c, O: () => u });
      var n,
        l = r(4568),
        a = r(7620),
        s = r(7541),
        i = r(7011);
      let o = (0, a.createContext)(null),
        d = null != (n = i.env.NEXT_PUBLIC_API_URL) ? n : "/api";
      function u(e) {
        let { children: t } = e,
          r = (0, s.useRouter)(),
          [n, i] = (0, a.useState)(null),
          [u, c] = (0, a.useState)(null),
          [f, p] = (0, a.useState)(!0);
        (0, a.useEffect)(() => {
          let e = (function () {
            let e = localStorage.getItem("auth");
            if (!e) return null;
            try {
              return JSON.parse(e);
            } catch (e) {
              return null;
            }
          })();
          (e && (c(e.token), i(e.user)), p(!1));
        }, []);
        let m = (0, a.useCallback)(
            async (e, t) => {
              var n, l;
              let a = await fetch("".concat(d, "/auth/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: e, password: t }),
              });
              if (!a.ok)
                throw Error(
                  (await a.json().catch(() => ({ error: "Login failed" })))
                    .error,
                );
              let s = await a.json();
              (c(s.token),
                i(s.user),
                (n = s.token),
                (l = s.user),
                localStorage.setItem(
                  "auth",
                  JSON.stringify({ token: n, user: l }),
                ),
                r.push("/dashboard"));
            },
            [r],
          ),
          h = (0, a.useCallback)(() => {
            (c(null),
              i(null),
              localStorage.removeItem("auth"),
              fetch("".concat(d, "/auth/logout"), { method: "POST" }).catch(
                () => {},
              ),
              r.push("/"));
          }, [r]);
        return (0, l.jsx)(o.Provider, {
          value: { user: n, token: u, isLoading: f, login: m, logout: h },
          children: t,
        });
      }
      function c() {
        let e = (0, a.useContext)(o);
        if (!e) throw Error("useAuth must be used within AuthProvider");
        return e;
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
          let { className: r, variant: l, size: s, asChild: d = !1, ...u } = e,
            c = d ? a.DX : "button";
          return (0, n.jsx)(c, {
            className: (0, i.cn)(o({ variant: l, size: s, className: r })),
            ref: t,
            ...u,
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
            { children: d, ...c } = t,
            v = null,
            y = !1,
            g = [];
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
                y = !0;
                let t = "child" in e.props ? e.props.child : e.props.children;
                (f(t) && "function" == typeof h && (t = h(t._payload)),
                  (v = u(e, t)),
                  g.push(v?.props?.children));
              } else g.push(e);
            }),
            v
              ? (v = l.cloneElement(v, void 0, g))
              : !y &&
                1 === l.Children.count(d) &&
                l.isValidElement(d) &&
                (v = d));
          let x = v
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
            b = (0, a.s)(r, x);
          if (!v) {
            if (d || 0 === d) throw Error(y ? m(e) : p(e));
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
          })(c, v.props ?? {});
          return (
            v.type !== l.Fragment && (w.ref = r ? b : x),
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
      var u = (e, t) => {
          if ("child" in e.props) {
            let t = e.props.child;
            return l.isValidElement(t)
              ? l.cloneElement(t, void 0, e.props.children(t.props.children))
              : null;
          }
          return l.isValidElement(t) ? t : null;
        },
        c = Symbol.for("react.lazy");
      function f(e) {
        var t;
        return (
          null != e &&
          "object" == typeof e &&
          "$$typeof" in e &&
          e.$$typeof === c &&
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
    7541: (e, t, r) => {
      "use strict";
      var n = r(3041);
      (r.o(n, "usePathname") &&
        r.d(t, {
          usePathname: function () {
            return n.usePathname;
          },
        }),
        r.o(n, "useRouter") &&
          r.d(t, {
            useRouter: function () {
              return n.useRouter;
            },
          }));
    },
    7628: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 533));
    },
    8186: (e, t, r) => {
      "use strict";
      r.d(t, {
        BT: () => d,
        Wu: () => u,
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
      let u = l.forwardRef((e, t) => {
        let { className: r, ...l } = e;
        return (0, n.jsx)("div", {
          ref: t,
          className: (0, a.cn)("p-6 pt-0", r),
          ...l,
        });
      });
      ((u.displayName = "CardContent"),
        (l.forwardRef((e, t) => {
          let { className: r, ...l } = e;
          return (0, n.jsx)("div", {
            ref: t,
            className: (0, a.cn)("flex items-center p-6 pt-0", r),
            ...l,
          });
        }).displayName = "CardFooter"));
    },
    9334: (e, t, r) => {
      "use strict";
      r.d(t, { J: () => u });
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
        u = l.forwardRef((e, t) => {
          let { className: r, ...l } = e;
          return (0, n.jsx)(s, { ref: t, className: (0, o.cn)(d(), r), ...l });
        });
      u.displayName = s.displayName;
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 7628))), (_N_E = e.O()));
  },
]);
