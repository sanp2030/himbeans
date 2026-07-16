/**
 * PR1 §3 — inventory race probe: fire many concurrent orders for one tracked item.
 * PASS = exactly `stock` succeed (201), the rest 409, and final stock is exactly 0.
 * Set the item's stock to a known N first, then:
 * k6 run scripts/load/oversell-probe.js -e BASE=... -e LOC=... -e PROD=<trackedProductId> -e SHOTS=30
 */
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const created = new Counter("orders_created");
const soldOut = new Counter("orders_sold_out");
const SHOTS = Number(__ENV.SHOTS || 30);

export const options = {
  scenarios: {
    burst: { executor: "shared-iterations", vus: SHOTS, iterations: SHOTS, maxDuration: "1m" },
  },
  thresholds: { http_req_failed: ["rate<0.01"] }, // 409s are expected, not failures
};

export default function () {
  const res = http.post(`${__ENV.BASE}/api/orders`, JSON.stringify({
    locationId: __ENV.LOC,
    fulfilment: "PICKUP",
    guestName: `Race ${__VU}`,
    guestPhone: "+9779800000000",
    items: [{ productId: __ENV.PROD, quantity: 1 }],
  }), { headers: { "Content-Type": "application/json" } });

  if (res.status === 201) created.add(1);
  else if (res.status === 409) soldOut.add(1);
  check(res, { "201 or 409 only": (r) => r.status === 201 || r.status === 409 });
}
// After the run: orders_created must equal the seeded stock; verify stock is 0 in Admin.
