/**
 * PR1 §3 — peak-hour simulation: 8:00 AM rush, 150 orders/hour at peak,
 * with a realistic browse:order mix (most visitors browse; some buy).
 * Run: k6 run scripts/load/peak-hour.js -e BASE=https://staging.himbean.coffee -e LOC=<locationId> -e PROD=<productId>
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE || "http://localhost:3000";

export const options = {
  scenarios: {
    browsers: { // menu readers — the majority
      executor: "ramping-vus",
      stages: [
        { duration: "2m", target: 40 },
        { duration: "5m", target: 40 },
        { duration: "2m", target: 0 },
      ],
      exec: "browse",
    },
    buyers: { // 150 orders/hour peak = 2.5/min
      executor: "ramping-arrival-rate",
      startRate: 20, timeUnit: "1h", preAllocatedVUs: 20,
      stages: [
        { duration: "2m", target: 150 },
        { duration: "5m", target: 150 },
        { duration: "2m", target: 30 },
      ],
      exec: "order",
    },
  },
  thresholds: {
    // PR1 §7 budgets
    "http_req_duration{page:menu}": ["p(95)<600"],
    "http_req_duration{api:order}": ["p(95)<800"],
    "http_req_duration{api:pos}": ["p(95)<250"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
};

export function browse() {
  const home = http.get(`${BASE}/`, { tags: { page: "home" } });
  check(home, { "home 200": (r) => r.status === 200 });
  sleep(Math.random() * 3 + 1);
  const menu = http.get(`${BASE}/menu`, { tags: { page: "menu" } });
  check(menu, { "menu 200": (r) => r.status === 200 });
  sleep(Math.random() * 5 + 2);
}

export function order() {
  const res = http.post(`${BASE}/api/orders`, JSON.stringify({
    locationId: __ENV.LOC,
    fulfilment: "PICKUP",
    guestName: `Load Tester ${__VU}`,
    guestPhone: "+9779800000000",
    items: [{ productId: __ENV.PROD, quantity: 1 }],
  }), { headers: { "Content-Type": "application/json" }, tags: { api: "order" } });
  check(res, {
    "order created or rate-limited": (r) => r.status === 201 || r.status === 429,
    "no server errors": (r) => r.status < 500,
  });
}
