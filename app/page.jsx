"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

function formatRupiah(n) {
  return "Rp " + Math.round(n || 0).toLocaleString("id-ID");
}
function formatRupiahWa(n) {
  return "Rp" + Math.round(n || 0).toLocaleString("id-ID");
}
function remainingOf(item) {
  const paid = (item.payments || []).reduce((s, p) => s + Number(p.amount), 0);
  return Number(item.amount) - paid;
}
function paidAmountOf(item) {
  return (item.payments || []).reduce((s, p) => s + Number(p.amount), 0);
}
function normalizePhone(phone) {
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return digits;
}

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [debtItems, setDebtItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [showAddCust, setShowAddCust] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custNameError, setCustNameError] = useState(false);

  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtItemName, setDebtItemName] = useState("");
  const [debtQty, setDebtQty] = useState(1);
  const [debtAmount, setDebtAmount] = useState("");
  const [debtDate, setDebtDate] = useState("");
  const [debtAmountError, setDebtAmountError] = useState(false);

  const [payTarget, setPayTarget] = useState(null);
  const [payMode, setPayMode] = useState("partial");
  const [payAmount, setPayAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [receiverOther, setReceiverOther] = useState("");
  const [payAmountError, setPayAmountError] = useState(false);
  const [receiverError, setReceiverError] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      } else {
        setUserId(data.session.user.id);
        setCheckingAuth(false);
      }
    });
  }, [router]);

  const fetchAll = useCallback(async () => {
    const { data: custs } = await supabase.from("customers").select("*").order("name");
    const { data: items } = await supabase
      .from("debt_items")
      .select("*, payments(*)")
      .order("date", { ascending: false });
    setCustomers(custs || []);
    setDebtItems(items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (checkingAuth || !userId) return;
    fetchAll();

    const channel = supabase
      .channel("realtime-ledger-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers", filter: `user_id=eq.${userId}` }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "debt_items", filter: `user_id=eq.${userId}` }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${userId}` }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkingAuth, userId, fetchAll]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function balanceForCustomer(custId) {
    return debtItems
      .filter((i) => i.customer_id === custId)
      .reduce((s, i) => s + Math.max(remainingOf(i), 0), 0);
  }
  function lastActivityFor(custId) {
    const items = debtItems.filter((i) => i.customer_id === custId);
    if (items.length === 0) return null;
    return items.reduce((a, b) => (new Date(a.date) > new Date(b.date) ? a : b)).date;
  }

  async function handleAddCustomer(e) {
    e.preventDefault();
    if (!custName.trim()) {
      setCustNameError(true);
      return;
    }
    setCustNameError(false);
    await supabase.from("customers").insert({ name: custName.trim(), phone: custPhone.trim() || null });
    setCustName("");
    setCustPhone("");
    setShowAddCust(false);
    fetchAll();
  }

  async function handleAddDebt(e) {
    e.preventDefault();
    const amount = parseFloat(debtAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      setDebtAmountError(true);
      return;
    }
    setDebtAmountError(false);
    await supabase.from("debt_items").insert({
      customer_id: selectedCustomerId,
      item: debtItemName.trim(),
      qty: parseInt(debtQty) || 1,
      amount: amount,
      date: debtDate || new Date().toISOString().split("T")[0],
    });
    setDebtItemName("");
    setDebtQty(1);
    setDebtAmount("");
    setShowAddDebt(false);
    fetchAll();
  }

  function openPayModal(item, mode) {
    setPayTarget(item);
    setPayMode(mode);
    setPayAmount("");
    setReceiver("");
    setReceiverOther("");
    setPayAmountError(false);
    setReceiverError(false);
  }

  function openBulkLunasModal() {
    const items = debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0);
    if (items.length === 0) {
      alert("Pelanggan ini tidak memiliki hutang aktif.");
      return;
    }
    setPayTarget("ALL");
    setPayMode("lunas");
    setPayAmount("");
    setReceiver("");
    setReceiverOther("");
    setPayAmountError(false);
    setReceiverError(false);
  }

  async function handleConfirmPay(e) {
    e.preventDefault();
    if (!payTarget) return;
    const finalReceiver = receiverOther.trim() || receiver;

    if (!finalReceiver) {
      setReceiverError(true);
      return;
    }
    setReceiverError(false);

    if (payTarget === "ALL") {
      const items = debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0);
      const rows = items.map((it) => ({
        debt_item_id: it.id,
        amount: remainingOf(it),
        received_by: finalReceiver,
      }));
      await supabase.from("payments").insert(rows);
      setPayTarget(null);
      fetchAll();
      return;
    }

    const remaining = remainingOf(payTarget);
    let amount;
    let valid = true;

    if (payMode === "lunas") {
      amount = remaining;
    } else {
      amount = parseFloat(payAmount);
      if (!amount || amount <= 0 || isNaN(amount) || amount > remaining) {
        setPayAmountError(true);
        valid = false;
      } else {
        setPayAmountError(false);
      }
    }
    if (!valid) return;

    await supabase.from("payments").insert({
      debt_item_id: payTarget.id,
      amount: amount,
      received_by: finalReceiver,
    });
    setPayTarget(null);
    fetchAll();
  }

  async function deleteDebtItem(itemId) {
    if (!confirm("Hapus catatan hutang ini beserta riwayat pembayarannya?")) return;
    await supabase.from("debt_items").delete().eq("id", itemId);
    fetchAll();
  }

  async function deleteCustomer(cust) {
    if (!confirm(`Hapus pelanggan "${cust.name}" beserta seluruh riwayat hutangnya? Tindakan ini tidak bisa dibatalkan.`)) return;
    await supabase.from("customers").delete().eq("id", cust.id);
    setSelectedCustomerId(null);
    fetchAll();
  }

  function buildWaMessage(cust) {
    const unpaidItems = debtItems.filter((i) => i.customer_id === cust.id && remainingOf(i) > 0);
    if (unpaidItems.length === 0) return null;
    const lines = unpaidItems.map((it) => {
      const qty = it.qty || 1;
      const rem = remainingOf(it);
      return "* " + (it.item || "Barang") + " (" + qty + " pcs) : " + formatRupiahWa(rem);
    });
    const total = unpaidItems.reduce((s, it) => s + remainingOf(it), 0);
    return "Rincian Belanja\n\n" + lines.join("\n") + "\n\nTotal belanja Anda adalah: " + formatRupiahWa(total);
  }

  function handleShareWa(cust) {
    const message = buildWaMessage(cust);
    if (!message) {
      alert("Pelanggan ini tidak memiliki hutang aktif untuk dibagikan.");
      return;
    }
    const encoded = encodeURIComponent(message);
    const url =
      cust.phone && cust.phone.trim()
        ? "https://wa.me/" + normalizePhone(cust.phone) + "?text=" + encoded
        : "https://api.whatsapp.com/send?text=" + encoded;
    window.open(url, "_blank");
  }

  if (checkingAuth || loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">Memuat...</div>;
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const filteredCustomers = customers
    .filter((c) => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((c) => ({ ...c, balance: balanceForCustomer(c.id), last: lastActivityFor(c.id) }))
    .sort((a, b) => (a.balance !== b.balance ? b.balance - a.balance : a.name.localeCompare(b.name)));

  const totalUnpaid = customers.reduce((s, c) => s + balanceForCustomer(c.id), 0);
  const countUnpaid = customers.filter((c) => balanceForCustomer(c.id) > 0).length;

  const customerItems = selectedCustomer
    ? debtItems
        .filter((i) => i.customer_id === selectedCustomer.id)
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  return (
    <div className="max-w-xl mx-auto px-4 pt-5 pb-10">
      {!selectedCustomer ? (
        <>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="font-ledger text-2xl">Buku Hutang</h1>
              <p className="text-sm text-[var(--ink-soft)] mt-0.5">Catatan hutang pelanggan</p>
            </div>
            <button onClick={handleSignOut} className="text-xs text-[var(--ink-soft)] underline">
              Keluar
            </button>
          </div>

          <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-4 mb-4">
            <div className="text-xs text-[var(--ink-soft)] uppercase tracking-wide">Total belum lunas</div>
            <div className="font-mono-num text-2xl font-semibold text-[var(--red)]">{formatRupiah(totalUnpaid)}</div>
            <div className="text-xs text-[var(--ink-soft)] mt-0.5">{countUnpaid} pelanggan</div>
          </div>

          <input
            type="text"
            placeholder="Cari nama pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--card)] text-sm mb-4 outline-none focus:border-[var(--gold)]"
          />

          <div className="flex flex-col gap-2.5">
            {filteredCustomers.length === 0 && (
              <div className="text-center py-10 text-sm text-[var(--ink-soft)]">Belum ada pelanggan tercatat.</div>
            )}
            {filteredCustomers.map((c) => {
              const isLunas = c.balance <= 0;
              const lastStr = c.last
                ? new Date(c.last).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                : "Belum ada transaksi";
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-3.5 cursor-pointer ${isLunas ? "opacity-70" : ""}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-semibold text-sm">{c.name}</div>
                      <div className="text-xs text-[var(--ink-soft)] mt-0.5">Aktivitas terakhir: {lastStr}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono-num text-base font-semibold ${isLunas ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                        {formatRupiah(c.balance)}
                      </div>
                      {isLunas && (
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--green-soft)] text-[var(--green)] mt-1">
                          Lunas
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowAddCust(true)}
            className="w-full mt-5 py-3 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm sticky bottom-4"
          >
            + Tambah pelanggan baru
          </button>
        </>
      ) : (
        <>
          <div
            onClick={() => setSelectedCustomerId(null)}
            className="text-sm text-[var(--ink-soft)] cursor-pointer mb-3 select-none"
          >
            &larr; Kembali ke daftar pelanggan
          </div>

          <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-5 text-center mb-4">
            <div className="font-ledger text-xl mb-1">{selectedCustomer.name}</div>
            <div className="text-xs text-[var(--ink-soft)] uppercase tracking-wide">Total sisa hutang</div>
            <div className={`font-mono-num text-3xl font-semibold mt-0.5 ${balanceForCustomer(selectedCustomer.id) <= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
              {formatRupiah(balanceForCustomer(selectedCustomer.id))}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleShareWa(selectedCustomer)}
              className="flex-1 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--paper-line)] text-sm font-medium"
            >
              Bagikan ke WhatsApp
            </button>
            <button
              onClick={openBulkLunasModal}
              className="flex-1 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--green-soft)] text-[var(--green)] text-sm font-medium"
            >
              Tandai semua lunas
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {customerItems.length === 0 && (
              <div className="text-center py-10 text-sm text-[var(--ink-soft)]">Belum ada hutang tercatat.</div>
            )}
            {customerItems.map((it) => {
              const paid = paidAmountOf(it);
              const remaining = remainingOf(it);
              const isDone = remaining <= 0;
              const pct = it.amount > 0 ? Math.min(100, Math.round((paid / it.amount) * 100)) : 100;
              const dateStr = new Date(it.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
              return (
                <div key={it.id} className={`bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-3.5 ${isDone ? "opacity-70" : ""}`}>
                  <div className="text-sm font-semibold">{it.item || "Hutang"}</div>
                  <div className="text-xs text-[var(--ink-soft)] mt-0.5">{dateStr}</div>
                  <div className="text-xs text-[var(--ink-soft)] mt-1.5">Total: {formatRupiah(it.amount)}</div>
                  <div className="h-1.5 rounded-full bg-[var(--red-soft)] mt-2 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--green)]" style={{ width: pct + "%" }} />
                  </div>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-xs text-[var(--ink-soft)]">Sisa</span>
                    <span className={`font-mono-num text-lg font-semibold ${isDone ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                      {formatRupiah(Math.max(remaining, 0))}
                    </span>
                  </div>
                  {paid > 0 && !isDone && <div className="text-xs text-[var(--green)] mt-1">Sudah dibayar {formatRupiah(paid)}</div>}
                  {!isDone ? (
                    <div className="flex gap-2 mt-2.5">
                      <button onClick={() => openPayModal(it, "partial")} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-xs font-medium">
                        Bayar sebagian
                      </button>
                      <button onClick={() => openPayModal(it, "lunas")} className="flex-1 py-2 rounded-lg bg-[var(--green)] text-white text-xs font-medium">
                        Tandai lunas
                      </button>
                    </div>
                  ) : (
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--green-soft)] text-[var(--green)] mt-2">
                      Lunas
                    </span>
                  )}
                  {(it.payments || []).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dashed border-[var(--paper-line)]">
                      {it.payments
                        .slice()
                        .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
                        .map((p) => (
                          <div key={p.id} className="text-[11.5px] text-[var(--ink-soft)] mt-0.5">
                            {formatRupiah(p.amount)} &middot; diterima oleh {p.received_by} &middot;{" "}
                            {new Date(p.paid_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </div>
                        ))}
                    </div>
                  )}
                  <div onClick={() => deleteDebtItem(it.id)} className="text-[11px] text-[var(--ink-soft)] underline cursor-pointer mt-2 inline-block">
                    Hapus barang ini
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setDebtItemName("");
              setDebtQty(1);
              setDebtAmount("");
              setDebtDate(new Date().toISOString().split("T")[0]);
              setDebtAmountError(false);
              setShowAddDebt(true);
            }}
            className="w-full mt-5 py-3 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm sticky bottom-4"
          >
            + Tambah hutang baru
          </button>

          <div
            onClick={() => deleteCustomer(selectedCustomer)}
            className="text-center text-sm text-[var(--red)] mt-3.5 cursor-pointer select-none"
          >
            Hapus pelanggan ini
          </div>
        </>
      )}

      {/* Modal: Tambah pelanggan */}
      {showAddCust && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <form onSubmit={handleAddCustomer} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-ledger text-lg mb-3">Pelanggan baru</h2>
            <div className="mb-3">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Nama pelanggan</label>
              <input value={custName} onChange={(e) => setCustName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm" />
              {custNameError && <div className="text-xs text-[var(--red)] mt-1">Nama wajib diisi</div>}
            </div>
            <div className="mb-4">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">No. WhatsApp (opsional)</label>
              <input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="Contoh: 08123456789" className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddCust(false)} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
                Batal
              </button>
              <button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--green)] text-white text-sm font-medium">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Tambah hutang */}
      {showAddDebt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <form onSubmit={handleAddDebt} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-ledger text-lg mb-3">Tambah hutang baru</h2>
            <div className="mb-3">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Barang</label>
              <input value={debtItemName} onChange={(e) => setDebtItemName(e.target.value)} placeholder="Contoh: Beras 5kg" className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm" />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Qty (pcs)</label>
              <input type="number" min="1" value={debtQty} onChange={(e) => setDebtQty(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm" />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Harga total (Rp)</label>
              <input type="number" min="0" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm" />
              {debtAmountError && <div className="text-xs text-[var(--red)] mt-1">Masukkan jumlah yang benar</div>}
            </div>
            <div className="mb-4">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Tanggal</label>
              <input type="date" value={debtDate} onChange={(e) => setDebtDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddDebt(false)} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
                Batal
              </button>
              <button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--green)] text-white text-sm font-medium">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Bayar */}
      {payTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <form onSubmit={handleConfirmPay} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-ledger text-lg mb-1">{payTarget === "ALL" ? "Tandai semua lunas" : payMode === "lunas" ? "Tandai lunas" : "Bayar sebagian"}</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              {payTarget === "ALL" ? (
                (() => {
                  const items = debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0);
                  const total = items.reduce((s, i) => s + remainingOf(i), 0);
                  return `${items.length} barang, total ${formatRupiah(total)}. Semua akan ditandai lunas penuh.`;
                })()
              ) : (
                <>
                  Sisa hutang {payTarget.item || ""}: {formatRupiah(remainingOf(payTarget))}
                  {payMode === "lunas" ? " — akan ditandai lunas penuh." : ""}
                </>
              )}
            </p>
            {payMode !== "lunas" && (
              <div className="mb-3">
                <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Jumlah dibayar (Rp)</label>
                <input type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm" />
                {payAmountError && <div className="text-xs text-[var(--red)] mt-1">Masukkan jumlah yang benar (maks. sisa hutang)</div>}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Siapa yang menerima uangnya?</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {["Saya", "Istri", "Anak"].map((name) => (
                  <div
                    key={name}
                    onClick={() => {
                      setReceiver(name);
                      setReceiverOther("");
                    }}
                    className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer ${receiver === name ? "bg-[var(--gold)] border-[var(--gold)] text-white" : "border-[var(--paper-line)]"}`}
                  >
                    {name}
                  </div>
                ))}
              </div>
              <input
                value={receiverOther}
                onChange={(e) => {
                  setReceiverOther(e.target.value);
                  if (e.target.value.trim()) setReceiver("");
                }}
                placeholder="Atau ketik nama lain"
                className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm mt-2"
              />
              {receiverError && <div className="text-xs text-[var(--red)] mt-1">Pilih atau isi nama penerima</div>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPayTarget(null)} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
                Batal
              </button>
              <button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--green)] text-white text-sm font-medium">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
