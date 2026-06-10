(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [177],
  {
    1674: (t, e, r) => {
      "use strict";
      r.d(e, { A: () => d, O: () => c });
      var o,
        n = r(4568),
        u = r(7620),
        a = r(7541),
        l = r(7011);
      let s = (0, u.createContext)(null),
        i = null != (o = l.env.NEXT_PUBLIC_API_URL) ? o : "/api";
      function c(t) {
        let { children: e } = t,
          r = (0, a.useRouter)(),
          [o, l] = (0, u.useState)(null),
          [c, d] = (0, u.useState)(null),
          [h, f] = (0, u.useState)(!0);
        (0, u.useEffect)(() => {
          let t = (function () {
            let t = localStorage.getItem("auth");
            if (!t) return null;
            try {
              return JSON.parse(t);
            } catch (t) {
              return null;
            }
          })();
          (t && (d(t.token), l(t.user)), f(!1));
        }, []);
        let p = (0, u.useCallback)(
            async (t, e) => {
              var o, n;
              let u = await fetch("".concat(i, "/auth/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: t, password: e }),
              });
              if (!u.ok)
                throw Error(
                  (await u.json().catch(() => ({ error: "Login failed" })))
                    .error,
                );
              let a = await u.json();
              (d(a.token),
                l(a.user),
                (o = a.token),
                (n = a.user),
                localStorage.setItem(
                  "auth",
                  JSON.stringify({ token: o, user: n }),
                ),
                r.push("/dashboard"));
            },
            [r],
          ),
          g = (0, u.useCallback)(() => {
            (d(null),
              l(null),
              localStorage.removeItem("auth"),
              fetch("".concat(i, "/auth/logout"), { method: "POST" }).catch(
                () => {},
              ),
              r.push("/"));
          }, [r]);
        return (0, n.jsx)(s.Provider, {
          value: { user: o, token: c, isLoading: h, login: p, logout: g },
          children: e,
        });
      }
      function d() {
        let t = (0, u.useContext)(s);
        if (!t) throw Error("useAuth must be used within AuthProvider");
        return t;
      }
    },
    2474: (t, e, r) => {
      (Promise.resolve().then(r.t.bind(r, 8761, 23)),
        Promise.resolve().then(r.bind(r, 5762)));
    },
    5703: (t, e, r) => {
      "use strict";
      r.d(e, { cn: () => u });
      var o = r(2902),
        n = r(3714);
      function u() {
        for (var t = arguments.length, e = Array(t), r = 0; r < t; r++)
          e[r] = arguments[r];
        return (0, n.QP)((0, o.$)(e));
      }
    },
    5762: (t, e, r) => {
      "use strict";
      r.d(e, { Providers: () => x });
      var o = r(4568),
        n = r(7620),
        u = r(7432),
        a = r(4869),
        l = r(1674),
        s = r(7011);
      let i = !1;
      function c() {
        var t, e, r;
        i ||
          ((i = !0),
          (r =
            (null !=
            (e =
              null == (t = s.env.NEXT_PUBLIC_API_URL)
                ? void 0
                : t.replace(/\/+$/, ""))
              ? e
              : "") || null) && r.replace(/\/+$/, ""),
          () =>
            (function () {
              try {
                var t;
                let e = localStorage.getItem("auth");
                if (!e) return null;
                return null != (t = JSON.parse(e).token) ? t : null;
              } catch (t) {
                return null;
              }
            })());
      }
      var d = r(9153),
        h = r(5703);
      let f = d.Kq;
      (d.bL,
        d.l9,
        (n.forwardRef((t, e) => {
          let { className: r, sideOffset: n = 4, ...u } = t;
          return (0, o.jsx)(d.ZL, {
            children: (0, o.jsx)(d.UC, {
              ref: e,
              sideOffset: n,
              className: (0, h.cn)(
                "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
                r,
              ),
              ...u,
            }),
          });
        }).displayName = d.UC.displayName));
      var p = r(9885);
      function g() {
        return (0, o.jsx)(p.l$, {
          position: "bottom-right",
          toastOptions: {
            classNames: {
              toast:
                "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
              description: "group-[.toast]:text-muted-foreground",
              actionButton:
                "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
              cancelButton:
                "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            },
          },
        });
      }
      c();
      let m = new u.E({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: !1 } },
      });
      function v(t) {
        let { children: e } = t;
        return (
          (0, n.useEffect)(() => {
            c();
          }, []),
          (0, o.jsx)(o.Fragment, { children: e })
        );
      }
      function x(t) {
        let { children: e } = t;
        return (0, o.jsx)(a.Ht, {
          client: m,
          children: (0, o.jsx)(v, {
            children: (0, o.jsx)(l.O, {
              children: (0, o.jsxs)(f, { children: [e, (0, o.jsx)(g, {})] }),
            }),
          }),
        });
      }
    },
    8761: () => {},
  },
  (t) => {
    (t.O(0, [950, 289, 380, 587, 18, 358], () => t((t.s = 2474))),
      (_N_E = t.O()));
  },
]);
