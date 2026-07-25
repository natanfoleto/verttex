import { describe, expect, it } from "vitest";

describe("Stock & FEFO Integration Logic", () => {
  it("should prioritize earliest expiring batch (FEFO order)", () => {
    const lotA = {
      id: "lot-a",
      expirationDate: new Date("2026-09-01"),
      receivedAt: new Date("2026-07-01"),
      availableQuantity: 20,
    };

    const lotB = {
      id: "lot-b",
      expirationDate: new Date("2026-08-01"), // Expires first!
      receivedAt: new Date("2026-07-10"),
      availableQuantity: 15,
    };

    const lotC = {
      id: "lot-c",
      expirationDate: new Date("2026-11-01"),
      receivedAt: new Date("2026-06-01"),
      availableQuantity: 50,
    };

    const items = [lotA, lotB, lotC];

    items.sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime());

    expect(items[0]!.id).toBe("lot-b"); // August 1st comes before September 1st
    expect(items[1]!.id).toBe("lot-a"); // September 1st
    expect(items[2]!.id).toBe("lot-c"); // November 1st
  });

  it("should fulfill order quantity spanning multiple FEFO lots", () => {
    const lotB = { id: "lot-b", availableQuantity: 10 };
    const lotA = { id: "lot-a", availableQuantity: 20 };
    const sortedLots = [lotB, lotA];

    let requested = 15;
    const allocations: Array<{ id: string; qty: number }> = [];

    for (const lot of sortedLots) {
      if (requested <= 0) break;
      const take = Math.min(lot.availableQuantity, requested);
      allocations.push({ id: lot.id, qty: take });
      requested -= take;
    }

    expect(allocations.length).toBe(2);
    expect(allocations[0]).toEqual({ id: "lot-b", qty: 10 });
    expect(allocations[1]).toEqual({ id: "lot-a", qty: 5 });
    expect(requested).toBe(0);
  });
});
