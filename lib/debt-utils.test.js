import { describe, test, expect } from "vitest";
import {
  formatRupiah,
  formatThousands,
  stripThousands,
  remainingOf,
  paidAmountOf,
  normalizePhone,
  customerColor,
  customerInitials,
  allocateOldestFirst,
} from "./debt-utils";

describe("remainingOf", () => {
  test("hutang belum dibayar sama sekali", () => {
    expect(remainingOf({ amount: 50000, payments: [] })).toBe(50000);
  });

  test("hutang tanpa properti payments sama sekali", () => {
    expect(remainingOf({ amount: 50000 })).toBe(50000);
  });

  test("hutang sudah dibayar sebagian", () => {
    expect(remainingOf({ amount: 50000, payments: [{ amount: 20000 }] })).toBe(30000);
  });

  test("hutang sudah dibayar lunas dari beberapa cicilan", () => {
    expect(
      remainingOf({ amount: 50000, payments: [{ amount: 20000 }, { amount: 30000 }] })
    ).toBe(0);
  });

  test("hutang dibayar lebih (overpay) menghasilkan angka negatif", () => {
    expect(remainingOf({ amount: 50000, payments: [{ amount: 70000 }] })).toBe(-20000);
  });

  test("amount berupa string angka tetap dihitung benar", () => {
    expect(remainingOf({ amount: "50000", payments: [{ amount: "20000" }] })).toBe(30000);
  });
});

describe("paidAmountOf", () => {
  test("tanpa payments mengembalikan 0", () => {
    expect(paidAmountOf({ payments: [] })).toBe(0);
  });

  test("tanpa properti payments sama sekali mengembalikan 0", () => {
    expect(paidAmountOf({})).toBe(0);
  });

  test("menjumlahkan beberapa payments", () => {
    expect(paidAmountOf({ payments: [{ amount: 10000 }, { amount: 15000 }] })).toBe(25000);
  });
});

describe("formatRupiah", () => {
  test("memformat angka dengan titik ribuan dan awalan Rp", () => {
    expect(formatRupiah(10000)).toBe("Rp 10.000");
  });

  test("membulatkan angka desimal", () => {
    expect(formatRupiah(10000.6)).toBe("Rp 10.001");
  });

  test("nol menghasilkan Rp 0", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  test("input null/undefined diperlakukan sebagai 0", () => {
    expect(formatRupiah(null)).toBe("Rp 0");
    expect(formatRupiah(undefined)).toBe("Rp 0");
  });

  test("angka besar tetap terformat dengan benar", () => {
    expect(formatRupiah(1234567)).toBe("Rp 1.234.567");
  });
});

describe("formatThousands", () => {
  test("angka 5 digit diberi satu titik ribuan", () => {
    expect(formatThousands("10000")).toBe("10.000");
  });

  test("angka di bawah 1000 tidak diberi titik", () => {
    expect(formatThousands("500")).toBe("500");
  });

  test("string kosong menghasilkan string kosong", () => {
    expect(formatThousands("")).toBe("");
  });

  test("input null/undefined menghasilkan string kosong", () => {
    expect(formatThousands(null)).toBe("");
    expect(formatThousands(undefined)).toBe("");
  });

  test("prefiks non-digit (mis. \"Rp\") dibuang sebelum diformat", () => {
    expect(formatThousands("Rp10000")).toBe("10.000");
  });
});

describe("stripThousands", () => {
  test("membuang titik ribuan", () => {
    expect(stripThousands("10.000")).toBe("10000");
  });

  test("membuang semua karakter non-digit", () => {
    expect(stripThousands("Rp 10.000,-")).toBe("10000");
  });

  test("string kosong menghasilkan string kosong", () => {
    expect(stripThousands("")).toBe("");
  });
});

describe("normalizePhone", () => {
  test("nomor diawali 0 diubah jadi diawali 62", () => {
    expect(normalizePhone("08123456789")).toBe("628123456789");
  });

  test("nomor sudah diawali 62 tidak diubah", () => {
    expect(normalizePhone("628123456789")).toBe("628123456789");
  });

  test("karakter non-digit (spasi, tanda hubung) dibuang", () => {
    expect(normalizePhone("0812-3456-789")).toBe("628123456789");
  });
});

describe("customerColor", () => {
  test("nama yang sama selalu menghasilkan warna yang sama", () => {
    expect(customerColor("Budi Santoso")).toBe(customerColor("Budi Santoso"));
  });

  test("nama kosong tidak melempar error dan tetap menghasilkan string hsl", () => {
    expect(customerColor("")).toMatch(/^hsl\(/);
  });

  test("hasil selalu berupa string format hsl()", () => {
    expect(customerColor("Siti")).toMatch(/^hsl\(\d+, 62%, 45%\)$/);
  });
});

describe("customerInitials", () => {
  test("nama kosong menghasilkan tanda tanya", () => {
    expect(customerInitials("")).toBe("?");
  });

  test("nama satu kata mengambil 2 huruf pertama", () => {
    expect(customerInitials("Budi")).toBe("BU");
  });

  test("nama dua kata mengambil huruf pertama tiap kata", () => {
    expect(customerInitials("Budi Santoso")).toBe("BS");
  });

  test("nama lebih dari dua kata tetap hanya ambil kata pertama & kedua", () => {
    expect(customerInitials("Budi Santoso Wijaya")).toBe("BS");
  });

  test("spasi berlebih di antara kata tidak memengaruhi hasil", () => {
    expect(customerInitials("  Budi   Santoso  ")).toBe("BS");
  });
});

describe("allocateOldestFirst", () => {
  const items = [
    { id: "c", amount: 30000, date: "2026-01-03", payments: [] },
    { id: "a", amount: 50000, date: "2026-01-01", payments: [] },
    { id: "b", amount: 20000, date: "2026-01-02", payments: [{ amount: 5000 }] },
  ];

  test("melunasi item paling lama dulu sampai uang habis", () => {
    const { allocations, totalUsed, leftover } = allocateOldestFirst(items, 60000);
    expect(allocations.map((a) => a.item.id)).toEqual(["a", "b"]);
    expect(allocations[0]).toMatchObject({ amount: 50000, fullyPaid: true });
    expect(allocations[1]).toMatchObject({ amount: 10000, fullyPaid: false });
    expect(totalUsed).toBe(60000);
    expect(leftover).toBe(0);
  });

  test("jumlah cukup untuk semua item, sisanya jadi leftover", () => {
    const { allocations, totalUsed, leftover } = allocateOldestFirst(items, 100000);
    expect(allocations).toHaveLength(3);
    expect(allocations.every((a) => a.fullyPaid)).toBe(true);
    expect(totalUsed).toBe(95000); // 50000 + 15000 (sisa b) + 30000
    expect(leftover).toBe(5000);
  });

  test("item yang sudah lunas (remaining 0 atau negatif) diabaikan", () => {
    const paidItems = [{ id: "x", amount: 10000, date: "2026-01-01", payments: [{ amount: 10000 }] }];
    const { allocations, totalUsed, leftover } = allocateOldestFirst(paidItems, 5000);
    expect(allocations).toHaveLength(0);
    expect(totalUsed).toBe(0);
    expect(leftover).toBe(5000);
  });

  test("jumlah bayar 0 tidak mengalokasikan apa pun", () => {
    const { allocations, totalUsed, leftover } = allocateOldestFirst(items, 0);
    expect(allocations).toHaveLength(0);
    expect(totalUsed).toBe(0);
    expect(leftover).toBe(0);
  });
});
