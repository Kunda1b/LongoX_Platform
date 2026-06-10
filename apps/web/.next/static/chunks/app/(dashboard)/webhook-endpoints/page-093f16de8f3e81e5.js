(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [711],
  {
    2076: (e, s, t) => {
      "use strict";
      (t.r(s), t.d(s, { default: () => h }));
      var a = t(4568),
        l = t(8186),
        i = t(9977),
        n = t(5400),
        c = t(5494),
        r = t(7801),
        o = t(2888);
      let d = [
        {
          name: "Order Webhook",
          url: "https://api.longox.io/webhooks/ord-001",
          status: "active",
          lastDelivery: "2 min ago",
        },
        {
          name: "GitHub Push",
          url: "https://api.longox.io/webhooks/gh-002",
          status: "active",
          lastDelivery: "1 hour ago",
        },
        {
          name: "Slack Events",
          url: "https://api.longox.io/webhooks/sl-003",
          status: "inactive",
          lastDelivery: "never",
        },
      ];
      function h() {
        return (0, a.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, a.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, a.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [
                    (0, a.jsx)(c.A, { className: "h-5 w-5" }),
                    (0, a.jsxs)("div", {
                      children: [
                        (0, a.jsx)("h1", {
                          className: "text-2xl font-bold tracking-tight",
                          children: "Webhook Endpoints",
                        }),
                        (0, a.jsx)("p", {
                          className: "text-sm text-muted-foreground",
                          children: "Manage incoming webhooks",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, a.jsxs)(n.$, {
                  children: [
                    (0, a.jsx)(r.A, { className: "mr-1 h-4 w-4" }),
                    " Add Endpoint",
                  ],
                }),
              ],
            }),
            (0, a.jsx)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
              children: d.map((e) =>
                (0, a.jsxs)(
                  l.Zp,
                  {
                    children: [
                      (0, a.jsxs)(l.aR, {
                        className:
                          "flex flex-row items-start justify-between pb-2",
                        children: [
                          (0, a.jsxs)("div", {
                            children: [
                              (0, a.jsx)(l.ZB, {
                                className: "text-sm",
                                children: e.name,
                              }),
                              (0, a.jsx)("p", {
                                className:
                                  "text-xs text-muted-foreground font-mono truncate max-w-[200px]",
                                children: e.url,
                              }),
                            ],
                          }),
                          (0, a.jsx)(c.A, {
                            className: "h-4 w-4 text-muted-foreground",
                          }),
                        ],
                      }),
                      (0, a.jsxs)(l.Wu, {
                        className: "flex items-center justify-between",
                        children: [
                          (0, a.jsx)(i.E, {
                            variant:
                              "active" === e.status ? "success" : "secondary",
                            children: e.status,
                          }),
                          (0, a.jsxs)("div", {
                            className: "flex items-center gap-2",
                            children: [
                              (0, a.jsx)("span", {
                                className: "text-xs text-muted-foreground",
                                children: e.lastDelivery,
                              }),
                              (0, a.jsx)(n.$, {
                                variant: "ghost",
                                size: "icon",
                                className: "h-8 w-8",
                                children: (0, a.jsx)(o.A, {
                                  className: "h-4 w-4",
                                }),
                              }),
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
    4901: (e, s, t) => {
      Promise.resolve().then(t.bind(t, 2076));
    },
    5494: (e, s, t) => {
      "use strict";
      t.d(s, { A: () => a });
      let a = (0, t(2046).A)("webhook", [
        [
          "path",
          {
            d: "M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2",
            key: "q3hayz",
          },
        ],
        [
          "path",
          {
            d: "m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06",
            key: "1go1hn",
          },
        ],
        [
          "path",
          {
            d: "m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8",
            key: "qlwsc0",
          },
        ],
      ]);
    },
  },
  (e) => {
    (e.O(0, [289, 552, 587, 18, 358], () => e((e.s = 4901))), (_N_E = e.O()));
  },
]);
