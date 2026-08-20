"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import ThemeSwitcher from "./ThemeSwitcher";

function formatRupiah(n) {
  return "Rp " + Math.round(n || 0).toLocaleString("id-ID");
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

// Menghasilkan warna khas yang konsisten untuk tiap nama pelanggan (hue tetap
// sama selama nama tidak berubah), agar tetap kontras di tema terang maupun gelap.
function customerColor(name) {
  const str = (name || "?").trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 45%)`;
}
function customerInitials(name) {
  const parts = (name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [debtItems, setDebtItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("terbaru");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [activeTab, setActiveTab] = useState("berjalan");
  const [homeTab, setHomeTab] = useState("pelanggan");

  const [showAddCust, setShowAddCust] = useState(false);
  const [showEditPhone, setShowEditPhone] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custNameError, setCustNameError] = useState(false);

  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtItemName, setDebtItemName] = useState("");
  const [debtQty, setDebtQty] = useState(1);
  const [debtAmount, setDebtAmount] = useState("");
  const [debtDate, setDebtDate] = useState("");
  const [debtKasir, setDebtKasir] = useState("");
  const [debtAmountError, setDebtAmountError] = useState(false);

  const [bulkCustomerId, setBulkCustomerId] = useState("");
  const [bulkDate, setBulkDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [bulkKasir, setBulkKasir] = useState("");
  const [bulkItems, setBulkItems] = useState([{ item: "", qty: 1, amount: "" }]);
  const [bulkCustomerError, setBulkCustomerError] = useState(false);
  const [bulkItemErrors, setBulkItemErrors] = useState({});

  const [detailGroupKey, setDetailGroupKey] = useState(null);

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
      kasir: debtKasir.trim() || null,
    });
    setDebtItemName("");
    setDebtQty(1);
    setDebtAmount("");
    setDebtKasir("");
    setShowAddDebt(false);
    fetchAll();
  }

  function resetKasirForm() {
    setBulkCustomerId("");
    setBulkDate(new Date().toISOString().split("T")[0]);
    setBulkKasir("");
    setBulkItems([{ item: "", qty: 1, amount: "" }]);
    setBulkCustomerError(false);
    setBulkItemErrors({});
  }

  function addBulkRow() {
    setBulkItems((rows) => [...rows, { item: "", qty: 1, amount: "" }]);
  }

  function removeBulkRow(idx) {
    setBulkItems((rows) => rows.filter((_, i) => i !== idx));
  }

  function updateBulkRow(idx, field, value) {
    setBulkItems((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  async function handleAddDebtBulk(e) {
    e.preventDefault();
    let hasError = false;

    if (!bulkCustomerId) {
      setBulkCustomerError(true);
      hasError = true;
    } else {
      setBulkCustomerError(false);
    }

    const errors = {};
    bulkItems.forEach((row, idx) => {
      const amt = parseFloat(row.amount);
      if (!amt || amt <= 0 || isNaN(amt)) {
        errors[idx] = true;
        hasError = true;
      }
    });
    setBulkItemErrors(errors);
    if (hasError) return;

    const dateVal = bulkDate || new Date().toISOString().split("T")[0];
    const kasirVal = bulkKasir.trim() || null;
    const rows = bulkItems.map((row) => ({
      customer_id: bulkCustomerId,
      item: row.item.trim(),
      qty: parseInt(row.qty) || 1,
      amount: parseFloat(row.amount),
      date: dateVal,
      kasir: kasirVal,
    }));

    await supabase.from("debt_items").insert(rows);
    resetKasirForm();
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

  function openGroupLunasModal(items) {
    const activeItems = items.filter((i) => remainingOf(i) > 0);
    if (activeItems.length === 0) {
      alert("Transaksi ini sudah lunas semua.");
      return;
    }
    setPayTarget(activeItems);
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

    if (payTarget === "ALL" || Array.isArray(payTarget)) {
      const items =
        payTarget === "ALL"
          ? debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0)
          : payTarget.filter((i) => remainingOf(i) > 0);
      const rows = items.map((it) => ({
        debt_item_id: it.id,
        amount: remainingOf(it),
        received_by: finalReceiver,
      }));
      await supabase.from("payments").insert(rows);
      setPayTarget(null);
      setDetailGroupKey(null);
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

  function selectCustomer(custId) {
    setSelectedCustomerId(custId);
    setActiveTab("berjalan");
  }

  function openEditPhoneModal(cust) {
    setEditPhoneValue(cust.phone || "");
    setShowEditPhone(true);
  }

  async function handleSavePhone(e) {
    e.preventDefault();
    await supabase.from("customers").update({ phone: editPhoneValue.trim() || null }).eq("id", selectedCustomerId);
    setShowEditPhone(false);
    fetchAll();
  }

  // Format struk kasir klasik: kode singkat & rata kolom ala mesin kasir,
  // bukan kalimat panjang. Dibungkus ``` agar WhatsApp merendernya sebagai
  // font monospace (tampilan seperti struk cetak asli).
  function buildWaMessage(cust) {
    const unpaidItems = debtItems.filter((i) => i.customer_id === cust.id && remainingOf(i) > 0);
    if (unpaidItems.length === 0) return null;

    const WIDTH = 28;
    const divider = "-".repeat(WIDTH);
    const doubleLine = "=".repeat(WIDTH);
    const padRight = (label, value) => {
      const gap = Math.max(WIDTH - label.length - value.length, 1);
      return label + " ".repeat(gap) + value;
    };

    const todayStr = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" });

    const itemLines = unpaidItems.map((it) => {
      const qty = it.qty || 1;
      const rem = remainingOf(it);
      const unitPrice = Math.round(rem / qty);
      const name = (it.item || "Barang").toUpperCase();
      const qtyPriceStr = "  " + qty + " x " + unitPrice.toLocaleString("id-ID");
      const totalStr = rem.toLocaleString("id-ID");
      return name + "\n" + padRight(qtyPriceStr, totalStr);
    });

    const total = unpaidItems.reduce((s, it) => s + remainingOf(it), 0);

    const body =
      "STRUK TAGIHAN\n" +
      doubleLine + "\n" +
      "NM   : " + (cust.name || "-") + "\n" +
      "TGL  : " + todayStr + "\n" +
      divider + "\n" +
      itemLines.join("\n") + "\n" +
      divider + "\n" +
      padRight("TOTAL", formatRupiah(total)) + "\n" +
      "STATUS: BLM LUNAS\n" +
      doubleLine;

    return "```\n" + body + "\n```";
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
    .sort((a, b) => {
      if (!a.last && !b.last) return a.name.localeCompare(b.name);
      if (!a.last) return 1;
      if (!b.last) return -1;
      switch (sortBy) {
        case "terlama":
          return new Date(a.last) - new Date(b.last);
        case "nominal-desc":
          return b.balance - a.balance;
        case "nominal-asc":
          return a.balance - b.balance;
        case "nama-az":
          return a.name.localeCompare(b.name);
        case "nama-za":
          return b.name.localeCompare(a.name);
        case "terbaru":
        default:
          return new Date(b.last) - new Date(a.last);
      }
    });

  const totalUnpaid = customers.reduce((s, c) => s + balanceForCustomer(c.id), 0);
  const countUnpaid = customers.filter((c) => balanceForCustomer(c.id) > 0).length;

  const customerItems = selectedCustomer
    ? debtItems
        .filter((i) => i.customer_id === selectedCustomer.id)
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];
  // Transaksi berjalan diurutkan dari yang paling lama ke yang paling baru,
  // sehingga orderan terbaru selalu muncul di paling bawah.
  const ongoingItems = customerItems
    .filter((it) => remainingOf(it) > 0)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const doneItems = customerItems.filter((it) => remainingOf(it) <= 0);

  // Kelompokkan hutang berjalan menjadi "transaksi belanja" berdasarkan
  // tanggal & kasir yang sama (mis. hasil input banyak barang sekaligus),
  // supaya tampil sebagai satu kartu transaksi, bukan per barang.
  const ongoingGroups = (() => {
    const groups = [];
    const groupByKey = new Map();
    ongoingItems.forEach((it) => {
      const key = `${it.date}__${it.kasir || ""}`;
      if (!groupByKey.has(key)) {
        const group = {
          key,
          date: it.date,
          kasir: it.kasir || null,
          trxNo: "TRX-" + String(it.id).replace(/-/g, "").slice(0, 8).toUpperCase(),
          items: [],
        };
        groupByKey.set(key, group);
        groups.push(group);
      }
      groupByKey.get(key).items.push(it);
    });
    return groups;
  })();
  const detailGroup = detailGroupKey ? ongoingGroups.find((g) => g.key === detailGroupKey) : null;

  return (
    <div className={`max-w-xl mx-auto px-4 pt-5 ${!selectedCustomer ? "pb-24" : "pb-10"}`}>
      {!selectedCustomer ? (
        <>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="font-ledger text-2xl">Buku Hutang</h1>
              <p className="text-sm text-[var(--ink-soft)] mt-0.5">Catatan hutang pelanggan</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <button onClick={handleSignOut} className="text-xs text-[var(--ink-soft)] underline">
                Keluar
              </button>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-4 mb-4">
            <div className="text-xs text-[var(--ink-soft)] uppercase tracking-wide">Total belum lunas</div>
            <div className="font-mono-num text-2xl font-semibold text-[var(--red)]">{formatRupiah(totalUnpaid)}</div>
            <div className="text-xs text-[var(--ink-soft)] mt-0.5">{countUnpaid} pelanggan</div>
          </div>

          <div className="flex border border-[var(--paper-line)] rounded-xl overflow-hidden mb-4 text-sm font-medium">
            <div
              onClick={() => setHomeTab("kasir")}
              className={`flex-1 text-center py-2.5 cursor-pointer select-none ${
                homeTab === "kasir" ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--card)] text-[var(--ink-soft)]"
              }`}
            >
              Kasir
            </div>
            <div
              onClick={() => setHomeTab("pelanggan")}
              className={`flex-1 text-center py-2.5 cursor-pointer select-none ${
                homeTab === "pelanggan" ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--card)] text-[var(--ink-soft)]"
              }`}
            >
              Pelanggan
            </div>
          </div>

          {homeTab === "kasir" ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-ledger text-lg">Transaksi piutang baru</h2>
                <span onClick={resetKasirForm} className="text-xs text-[var(--ink-soft)] underline cursor-pointer">
                  Bersihkan form
                </span>
              </div>

              <form onSubmit={handleAddDebtBulk}>
                <div className="mb-3">
                  <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Pelanggan</label>
                  <select
                    value={bulkCustomerId}
                    onChange={(e) => setBulkCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--card)] text-sm"
                  >
                    <option value="">Pilih pelanggan...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {bulkCustomerError && <div className="text-xs text-[var(--red)] mt-1">Pilih pelanggan dulu</div>}
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Tanggal</label>
                  <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm" />
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Kasir (opsional)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {["Saya", "Fuji", "Ibu"].map((name) => (
                      <div
                        key={name}
                        onClick={() => setBulkKasir(name)}
                        className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer ${bulkKasir === name ? "bg-[var(--gold)] border-[var(--gold)] text-white" : "border-[var(--paper-line)]"}`}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                  <input
                    value={bulkKasir}
                    onChange={(e) => setBulkKasir(e.target.value)}
                    placeholder="Atau ketik nama kasir"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm"
                  />
                </div>

                <div className="space-y-3">
                  {bulkItems.map((row, idx) => (
                    <div key={idx} className="border border-[var(--paper-line)] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide">Barang #{idx + 1}</span>
                        {bulkItems.length > 1 && (
                          <span onClick={() => removeBulkRow(idx)} className="text-xs text-[var(--red)] underline cursor-pointer">
                            Hapus
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Barang</label>
                        <input
                          value={row.item}
                          onChange={(e) => updateBulkRow(idx, "item", e.target.value)}
                          placeholder="Contoh: Beras 5kg"
                          className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Qty (pcs)</label>
                          <input
                            type="number"
                            min="1"
                            value={row.qty}
                            onChange={(e) => updateBulkRow(idx, "qty", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Harga total (Rp)</label>
                          <input
                            type="number"
                            min="0"
                            value={row.amount}
                            onChange={(e) => updateBulkRow(idx, "amount", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm"
                          />
                        </div>
                      </div>
                      {bulkItemErrors[idx] && <div className="text-xs text-[var(--red)] mt-1">Masukkan jumlah yang benar</div>}
                    </div>
                  ))}
                </div>

                <div onClick={addBulkRow} className="text-center text-sm text-[var(--gold)] font-semibold mt-3 cursor-pointer select-none">
                  + Tambah barang lain
                </div>

                <button type="submit" className="w-full mt-5 py-2.5 rounded-xl bg-[var(--green)] text-white text-sm font-semibold">
                  Simpan transaksi
                </button>
              </form>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Cari nama pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--card)] text-sm mb-3 outline-none focus:border-[var(--gold)]"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--card)] text-sm mb-4 outline-none focus:border-[var(--gold)]"
              >
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
                <option value="nominal-desc">Nominal terbesar</option>
                <option value="nominal-asc">Nominal terkecil</option>
                <option value="nama-az">Nama A–Z</option>
                <option value="nama-za">Nama Z–A</option>
              </select>

              <div className="flex flex-col gap-2.5">
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-10 text-sm text-[var(--ink-soft)]">Belum ada pelanggan tercatat.</div>
                )}
                {filteredCustomers.map((c) => {
                  const isLunas = c.balance <= 0;
                  const lastStr = c.last
                    ? new Date(c.last).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                    : "Belum ada transaksi";
                  const ccolor = customerColor(c.name);
                  return (
                    <div
                      key={c.id}
                      onClick={() => selectCustomer(c.id)}
                      style={{ borderLeft: `4px solid ${ccolor}` }}
                      className={`bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-3.5 cursor-pointer ${isLunas ? "opacity-70" : ""}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            style={{ backgroundColor: ccolor }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          >
                            {customerInitials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{c.name}</div>
                            <div className="text-xs text-[var(--ink-soft)] mt-0.5">Aktivitas terakhir: {lastStr}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
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
            </>
          )}

          {homeTab === "pelanggan" && (
            <button
              onClick={() => setShowAddCust((v) => !v)}
              title={showAddCust ? "Tutup" : "Tambah pelanggan baru"}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--ink)] text-[var(--paper)] shadow-lg flex items-center justify-center z-30 active:scale-90 transition-transform duration-200"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className={`transition-transform duration-300 ease-out ${showAddCust ? "rotate-45" : "rotate-0"}`}
              >
                <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {homeTab === "kasir" && (
            <button
              onClick={addBulkRow}
              title="Tambah baris barang"
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--gold)] text-white shadow-lg flex items-center justify-center z-30 active:scale-90 transition-transform duration-200"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
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
            <div
              style={{ backgroundColor: customerColor(selectedCustomer.name) }}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-2.5"
            >
              {customerInitials(selectedCustomer.name)}
            </div>
            <div className="font-ledger text-xl mb-1">{selectedCustomer.name}</div>
            <div className="text-xs text-[var(--ink-soft)] mb-2">
              {selectedCustomer.phone && selectedCustomer.phone.trim() ? (
                <>
                  No. WA: {selectedCustomer.phone}{" "}
                  <span onClick={() => openEditPhoneModal(selectedCustomer)} className="underline cursor-pointer">
                    Ubah
                  </span>
                </>
              ) : (
                <span onClick={() => openEditPhoneModal(selectedCustomer)} className="underline cursor-pointer">
                  + Tambah nomor WA
                </span>
              )}
            </div>
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

          <div className="flex border border-[var(--paper-line)] rounded-xl overflow-hidden mb-3.5 text-sm font-medium">
            <div
              onClick={() => setActiveTab("berjalan")}
              className={`flex-1 text-center py-2.5 cursor-pointer select-none ${
                activeTab === "berjalan" ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--card)] text-[var(--ink-soft)]"
              }`}
            >
              Transaksi berjalan{ongoingItems.length > 0 ? ` (${ongoingItems.length})` : ""}
            </div>
            <div
              onClick={() => setActiveTab("selesai")}
              className={`flex-1 text-center py-2.5 cursor-pointer select-none ${
                activeTab === "selesai" ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--card)] text-[var(--ink-soft)]"
              }`}
            >
              Transaksi selesai{doneItems.length > 0 ? ` (${doneItems.length})` : ""}
            </div>
          </div>

          {activeTab === "berjalan" ? (
            <div className="flex flex-col gap-2.5">
              {ongoingGroups.length === 0 && (
                <div className="text-center py-10 text-sm text-[var(--ink-soft)]">Tidak ada hutang berjalan.</div>
              )}
              {ongoingGroups.map((g) => {
                const groupTotal = g.items.reduce((s, it) => s + Number(it.amount || 0), 0);
                const groupPaid = g.items.reduce((s, it) => s + paidAmountOf(it), 0);
                const groupRemaining = groupTotal - groupPaid;
                const isPartial = groupPaid > 0;
                const dateStr = new Date(g.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                return (
                  <div
                    key={g.key}
                    onClick={() => setDetailGroupKey(g.key)}
                    className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl shadow-sm p-4 cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[var(--paper-line)] flex items-center justify-center shrink-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M4 7h16l-1.4 11.3a2 2 0 0 1-2 1.7H7.4a2 2 0 0 1-2-1.7L4 7Z" stroke="var(--gold)" strokeWidth="1.6" strokeLinejoin="round" />
                            <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">Belanja (Piutang)</div>
                          <div className="text-xs text-[var(--ink-soft)] mt-0.5">
                            {g.items.length} barang &middot; {dateStr}
                          </div>
                        </div>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-1.5">
                        <path d="M9 6l6 6-6 6" stroke="var(--ink-soft)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 mt-3 text-xs">
                      <div className="text-[var(--ink-soft)]">No. transaksi</div>
                      <div className="text-right font-mono-num">{g.trxNo}</div>
                      <div className="text-[var(--ink-soft)]">Kasir</div>
                      <div className="text-right">{g.kasir || "-"}</div>
                    </div>

                    <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-dashed border-[var(--paper-line)]">
                      <span className="text-xs text-[var(--ink-soft)]">{isPartial ? "Sisa tagihan" : "Total transaksi"}</span>
                      <span className="font-mono-num text-lg font-semibold text-[var(--red)]">
                        {formatRupiah(Math.max(groupRemaining, 0))}
                      </span>
                    </div>
                    {isPartial && (
                      <div className="text-[11px] text-[var(--green)] mt-1 text-right">Sudah dibayar {formatRupiah(groupPaid)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {doneItems.length === 0 && (
                <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-3.5 text-center py-8 text-sm text-[var(--ink-soft)]">
                  Belum ada transaksi yang lunas.
                </div>
              )}
              {(() => {
                // Kelompokkan barang yang selesai berdasarkan tanggal selesai
                // (tanggal pembayaran lunas terakhir) & kasir yang menerima,
                // lalu render tiap kelompok sebagai satu struk belanja.
                const groups = [];
                const groupByKey = new Map();
                doneItems.forEach((it) => {
                  const lastPayment = (it.payments || []).slice().sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0];
                  const lunasDate = lastPayment ? new Date(lastPayment.paid_at) : new Date(it.date);
                  const lunasDateStr = lunasDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                  const receivedBy = lastPayment ? lastPayment.received_by : null;
                  const key = `${lunasDateStr}__${receivedBy || ""}`;
                  if (!groupByKey.has(key)) {
                    const group = { key, lunasDate, lunasDateStr, receivedBy, items: [] };
                    groupByKey.set(key, group);
                    groups.push(group);
                  }
                  groupByKey.get(key).items.push(it);
                });

                // Struk terbaru tampil paling atas.
                groups.sort((a, b) => b.lunasDate - a.lunasDate);

                return groups.map((g) => {
                  const groupTotal = g.items.reduce((s, it) => s + Number(it.amount || 0), 0);
                  return (
                    <div
                      key={g.key}
                      className="font-mono-num bg-[var(--card)] border border-dashed border-[var(--paper-line)] rounded-lg shadow-sm overflow-hidden"
                    >
                      {/* Kepala struk: tanggal selesai & nama kasir */}
                      <div className="px-3.5 pt-3.5 pb-2.5 text-center border-b border-dashed border-[var(--paper-line)]">
                        <div className="text-[10px] tracking-[0.25em] text-[var(--ink-soft)] uppercase">Struk Pembayaran</div>
                        <div className="text-sm font-semibold mt-1">{g.lunasDateStr}</div>
                        <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">
                          Kasir: {g.receivedBy || "-"}
                        </div>
                      </div>

                      {/* Isi struk: nama produk x jumlah & harga */}
                      <div className="px-3.5 py-2.5 space-y-1.5">
                        {g.items.map((it) => (
                          <div key={it.id} className="flex items-baseline justify-between gap-3">
                            <span className="text-xs leading-relaxed">
                              {it.item || "Hutang"} <span className="text-[var(--ink-soft)]">x{it.qty || 1}</span>
                            </span>
                            <span className="text-xs whitespace-nowrap">{formatRupiah(it.amount)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total struk */}
                      <div className="px-3.5 py-2.5 border-t border-dashed border-[var(--paper-line)] flex items-baseline justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide">Total</span>
                        <span className="text-base font-bold text-[var(--green)] whitespace-nowrap">
                          {formatRupiah(groupTotal)}
                        </span>
                      </div>

                      <div className="px-3.5 pb-3 -mt-0.5 flex justify-center">
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--green-soft)] text-[var(--green)]">
                          Lunas
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          <button
            onClick={() => {
              setDebtItemName("");
              setDebtQty(1);
              setDebtAmount("");
              setDebtDate(new Date().toISOString().split("T")[0]);
              setDebtKasir("");
              setDebtAmountError(false);
              setShowAddDebt(true);
            }}
            title="Tambah hutang baru"
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--ink)] text-[var(--paper)] shadow-lg flex items-center justify-center z-30 active:scale-90 transition-transform duration-200"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>

          <div
            onClick={() => deleteCustomer(selectedCustomer)}
            className="text-center text-sm text-[var(--red)] mt-5 mb-20 cursor-pointer select-none"
          >
            Hapus pelanggan ini
          </div>
        </>
      )}

      {/* Modal: Edit nomor WA */}
      {showEditPhone && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <form onSubmit={handleSavePhone} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-ledger text-lg mb-3">No. WhatsApp pelanggan</h2>
            <div className="mb-4">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">No. WhatsApp</label>
              <input
                value={editPhoneValue}
                onChange={(e) => setEditPhoneValue(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowEditPhone(false)} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
                Batal
              </button>
              <button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--green)] text-white text-sm font-medium">
                Simpan
              </button>
            </div>
          </form>
        </div>
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
            <div className="mb-4">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Kasir (opsional)</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {["Saya", "Fuji", "Ibu"].map((name) => (
                  <div
                    key={name}
                    onClick={() => setDebtKasir(name)}
                    className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer ${debtKasir === name ? "bg-[var(--gold)] border-[var(--gold)] text-white" : "border-[var(--paper-line)]"}`}
                  >
                    {name}
                  </div>
                ))}
              </div>
              <input
                value={debtKasir}
                onChange={(e) => setDebtKasir(e.target.value)}
                placeholder="Atau ketik nama kasir"
                className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] text-sm"
              />
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

      {/* Modal: Detail transaksi belanja (piutang) berjalan */}
      {detailGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[88vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[var(--card)] px-5 pt-5 pb-4 border-b border-[var(--paper-line)] flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold tracking-[0.2em] text-[var(--gold)] uppercase">Belanja (Piutang)</div>
                <div className="font-ledger text-lg mt-0.5 font-mono-num">{detailGroup.trxNo}</div>
                <div className="text-xs text-[var(--ink-soft)] mt-1">
                  {new Date(detailGroup.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  {" · "}Kasir: {detailGroup.kasir || "-"}
                </div>
              </div>
              <div
                onClick={() => setDetailGroupKey(null)}
                className="w-8 h-8 rounded-full bg-[var(--paper-line)] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <line x1="5" y1="5" x2="19" y2="19" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="19" y1="5" x2="5" y2="19" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {detailGroup.items.map((it) => {
                const paid = paidAmountOf(it);
                const remaining = remainingOf(it);
                const pct = it.amount > 0 ? Math.min(100, Math.round((paid / it.amount) * 100)) : 100;
                const sortedPayments = (it.payments || []).slice().sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
                return (
                  <div key={it.id} className="rounded-2xl border border-[var(--paper-line)] p-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">{it.item || "Hutang"}</span>
                      <span className="text-xs text-[var(--ink-soft)] whitespace-nowrap">{it.qty || 1} pcs</span>
                    </div>
                    <div className="text-xs text-[var(--ink-soft)] mt-1">Total: {formatRupiah(it.amount)}</div>
                    <div className="h-1.5 rounded-full bg-[var(--red-soft)] mt-2 overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--green)]" style={{ width: pct + "%" }} />
                    </div>
                    <div className="flex justify-between items-baseline mt-2">
                      <span className="text-xs text-[var(--ink-soft)]">Sisa</span>
                      <span className="font-mono-num text-base font-semibold text-[var(--red)]">
                        {formatRupiah(Math.max(remaining, 0))}
                      </span>
                    </div>
                    {paid > 0 && (
                      <div className="text-xs text-[var(--green)] mt-1">Sudah dibayar sebagian {formatRupiah(paid)}</div>
                    )}
                    <div className="flex gap-2 mt-2.5">
                      <button onClick={() => openPayModal(it, "partial")} className="flex-1 py-1.5 rounded-lg border border-[var(--paper-line)] text-xs font-medium">
                        Bayar sebagian
                      </button>
                      <button onClick={() => openPayModal(it, "lunas")} className="flex-1 py-1.5 rounded-lg bg-[var(--green)] text-white text-xs font-medium">
                        Tandai lunas
                      </button>
                    </div>
                    {sortedPayments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-[var(--paper-line)]">
                        <div className="text-[11px] text-[var(--ink-soft)] uppercase tracking-wide mb-1">Riwayat bayar sebagian</div>
                        {sortedPayments.map((p) => (
                          <div key={p.id} className="text-[11.5px] text-[var(--ink-soft)] mt-0.5">
                            {formatRupiah(p.amount)} &middot; diterima oleh {p.received_by} &middot; tanggal{" "}
                            {new Date(p.paid_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
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

            <div className="px-5 pb-5 pt-3 border-t border-[var(--paper-line)] sticky bottom-0 bg-[var(--card)]">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-xs text-[var(--ink-soft)] uppercase tracking-wide">Total transaksi</span>
                <span className="font-mono-num text-xl font-bold">
                  {formatRupiah(detailGroup.items.reduce((s, it) => s + Number(it.amount || 0), 0))}
                </span>
              </div>
              <button
                onClick={() => openGroupLunasModal(detailGroup.items)}
                className="w-full py-2.5 rounded-xl bg-[var(--green)] text-white text-sm font-semibold"
              >
                Tandai transaksi ini lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bayar */}
      {payTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <form onSubmit={handleConfirmPay} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-ledger text-lg mb-1">{payTarget === "ALL" || Array.isArray(payTarget) ? "Tandai semua lunas" : payMode === "lunas" ? "Tandai lunas" : "Bayar sebagian"}</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              {payTarget === "ALL" || Array.isArray(payTarget) ? (
                (() => {
                  const items =
                    payTarget === "ALL"
                      ? debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0)
                      : payTarget.filter((i) => remainingOf(i) > 0);
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
                {["Saya", "Fuji", "Ibu"].map((name) => (
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
