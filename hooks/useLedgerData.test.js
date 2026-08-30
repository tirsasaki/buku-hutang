import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// vi.mock di-hoist ke atas file oleh Vitest, jadi variabel yang dipakai di
// dalam factory-nya harus dideklarasikan lewat vi.hoisted() -- kalau tidak,
// akan kena error "Cannot access before initialization" karena urutan
// eksekusi sebenarnya (mock duluan, baru sisa import) berbeda dari urutan
// tertulis di file ini.
const { fromMock, channelFnMock, channelMock, removeChannelMock, mockResults } = vi.hoisted(() => {
  const mockResults = {
    customers: { data: [{ id: "c1", name: "Budi" }], error: null },
    debt_items: { data: [{ id: "d1", customer_id: "c1", amount: 10000, payments: [] }], error: null },
    credit_transactions: { data: [{ id: "t1", customer_id: "c1", amount: 5000 }], error: null },
  };

  // Query builder tiruan yang meniru pola chaining Supabase:
  // supabase.from(table).select(...).order(...) -> Promise<{ data, error }>.
  function makeQueryBuilder(table) {
    const builder = {};
    builder.select = vi.fn(() => builder);
    builder.order = vi.fn(() => Promise.resolve(mockResults[table]));
    return builder;
  }

  const fromMock = vi.fn((table) => makeQueryBuilder(table));

  const channelMock = {
    on: vi.fn(function on() {
      return this;
    }),
    subscribe: vi.fn(function subscribe() {
      return this;
    }),
  };
  const channelFnMock = vi.fn(() => channelMock);
  const removeChannelMock = vi.fn();

  return { fromMock, channelFnMock, channelMock, removeChannelMock, mockResults };
});

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: fromMock,
    channel: channelFnMock,
    removeChannel: removeChannelMock,
  },
}));

const { useLedgerData } = await import("./useLedgerData");

describe("useLedgerData", () => {
  beforeEach(() => {
    fromMock.mockClear();
    channelFnMock.mockClear();
    channelMock.on.mockClear();
    channelMock.subscribe.mockClear();
    removeChannelMock.mockClear();
  });

  test("tidak fetch apa pun selama checkingAuth masih true", () => {
    const { result } = renderHook(() => useLedgerData({ userId: null, checkingAuth: true }));

    expect(fromMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
    expect(result.current.customers).toEqual([]);
  });

  test("tidak fetch apa pun kalau userId belum ada meski checkingAuth sudah selesai", () => {
    renderHook(() => useLedgerData({ userId: null, checkingAuth: false }));

    expect(fromMock).not.toHaveBeenCalled();
  });

  test("fetch ketiga tabel & mengisi state begitu checkingAuth selesai dan userId ada", async () => {
    const { result } = renderHook(() => useLedgerData({ userId: "u1", checkingAuth: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.customers).toEqual(mockResults.customers.data);
    expect(result.current.debtItems).toEqual(mockResults.debt_items.data);
    expect(result.current.creditTx).toEqual(mockResults.credit_transactions.data);
    expect(fromMock).toHaveBeenCalledWith("customers");
    expect(fromMock).toHaveBeenCalledWith("debt_items");
    expect(fromMock).toHaveBeenCalledWith("credit_transactions");
  });

  test("berlangganan channel realtime dengan nama unik per userId", async () => {
    renderHook(() => useLedgerData({ userId: "u1", checkingAuth: false }));

    await waitFor(() => expect(channelFnMock).toHaveBeenCalledWith("realtime-ledger-u1"));
    // Empat tabel yang dipantau: customers, debt_items, payments, credit_transactions.
    expect(channelMock.on).toHaveBeenCalledTimes(4);
    expect(channelMock.subscribe).toHaveBeenCalledTimes(1);
  });

  test("melepas channel (unsubscribe) saat komponen unmount", async () => {
    const { unmount } = renderHook(() => useLedgerData({ userId: "u1", checkingAuth: false }));

    await waitFor(() => expect(channelFnMock).toHaveBeenCalled());

    unmount();

    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  test("fetchAll yang dikembalikan bisa dipanggil manual untuk fetch ulang", async () => {
    const { result } = renderHook(() => useLedgerData({ userId: "u1", checkingAuth: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const callCountAfterInitialFetch = fromMock.mock.calls.length;

    await result.current.fetchAll();

    expect(fromMock.mock.calls.length).toBeGreaterThan(callCountAfterInitialFetch);
  });
});
