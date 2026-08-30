"use client";

import DebtItemRow from "./DebtItemRow";
import DoneReceiptCard from "./DoneReceiptCard";

// Tab switcher "Berjalan" / "Selesai" plus daftar transaksinya, di halaman
// detail pelanggan. Tab "Berjalan" menampilkan satu DebtItemRow per grup
// transaksi yang masih ada sisa hutang. Tab "Selesai" mengelompokkan barang
// yang lunas berdasarkan MOMEN PEMBAYARAN (satu aksi pelunasan = satu struk),
// bukan berdasarkan invoice asal — supaya "Tandai semua lunas" yang melunasi
// barang dari beberapa invoice/tanggal berbeda sekaligus tetap tampil
// sebagai satu struk gabungan. Pengelompokan ini murni presentasional
// (turunan dari `doneItems`), jadi dihitung di sini, bukan di page.jsx.
//
// Props:
// - activeTab: "berjalan" | "selesai"
// - onTabChange(tab)
// - ongoingGroups: grup transaksi yang masih berjalan (lihat page.jsx untuk bentuknya)
// - doneItems: daftar debt_item mentah yang sudah lunas
// - onOpenDetail(groupKey): dipanggil saat kartu transaksi berjalan diklik
export default function DebtHistoryTabs({ activeTab, onTabChange, ongoingGroups, doneItems, onOpenDetail }) {
  const doneGroups = groupDoneItemsByPayment(doneItems);

  return (
    <>
      <div className="relative flex bg-[var(--card)] border border-[var(--paper-line)] rounded-xl p-1 mb-3.5 text-sm font-medium">
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[var(--ink)] shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: activeTab === "berjalan" ? "translateX(0%)" : "translateX(calc(100% + 8px))" }}
        />
        <div
          onClick={() => onTabChange("berjalan")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 text-center py-2.5 rounded-lg cursor-pointer select-none transition-colors duration-200 ${
            activeTab === "berjalan" ? "text-[var(--paper)]" : "text-[var(--ink-soft)]"
          }`}
        >
          Berjalan
          {ongoingGroups.length > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === "berjalan" ? "bg-white/20 text-[var(--paper)]" : "bg-[var(--red-soft)] text-[var(--red)]"
              }`}
            >
              {ongoingGroups.length}
            </span>
          )}
        </div>
        <div
          onClick={() => onTabChange("selesai")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 text-center py-2.5 rounded-lg cursor-pointer select-none transition-colors duration-200 ${
            activeTab === "selesai" ? "text-[var(--paper)]" : "text-[var(--ink-soft)]"
          }`}
        >
          Selesai
          {doneItems.length > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === "selesai" ? "bg-white/20 text-[var(--paper)]" : "bg-[var(--green-soft)] text-[var(--green)]"
              }`}
            >
              {doneItems.length}
            </span>
          )}
        </div>
      </div>

      {activeTab === "berjalan" ? (
        <div className="flex flex-col gap-2.5">
          {ongoingGroups.length === 0 && (
            <div className="text-center py-10 text-sm text-[var(--ink-soft)]">Tidak ada hutang berjalan.</div>
          )}
          {ongoingGroups.map((g) => (
            <DebtItemRow key={g.key} group={g} onClick={() => onOpenDetail(g.key)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {doneGroups.length === 0 && (
            <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-3.5 text-center py-8 text-sm text-[var(--ink-soft)]">
              Belum ada transaksi yang lunas.
            </div>
          )}
          {doneGroups.map((g) => (
            <DoneReceiptCard key={g.key} group={g} />
          ))}
        </div>
      )}
    </>
  );
}

// Beberapa baris payment yang dibuat lewat satu insert batch (mis. bayar
// banyak item sekaligus) punya nilai paid_at yang persis sama (Postgres
// mengevaluasi now() sekali per statement), jadi timestamp itu dipakai
// sebagai kunci pengelompokan. Item lama tanpa data payment (kasus langka)
// jatuh ke kunci per-item supaya tidak salah gabung.
function groupDoneItemsByPayment(doneItems) {
  const groups = [];
  const groupByKey = new Map();
  doneItems.forEach((it) => {
    const lastPayment = (it.payments || []).slice().sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0];
    const paidAtIso = lastPayment ? lastPayment.paid_at : null;
    const lunasDate = paidAtIso ? new Date(paidAtIso) : new Date(it.date);
    const lunasDateStr = lunasDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const receivedBy = lastPayment ? lastPayment.received_by : null;
    const key = paidAtIso ? `${paidAtIso}__${receivedBy || ""}` : `no-payment__${it.id}`;
    if (!groupByKey.has(key)) {
      const group = { key, lunasDate, lunasDateStr, receivedBy, invoiceNos: new Set(), items: [] };
      groupByKey.set(key, group);
      groups.push(group);
    }
    const group = groupByKey.get(key);
    if (it.invoice_no) group.invoiceNos.add(it.invoice_no);
    group.items.push(it);
  });

  // Struk terbaru tampil paling atas.
  groups.sort((a, b) => b.lunasDate - a.lunasDate);

  return groups.map((g) => {
    const groupTotal = g.items.reduce((s, it) => s + Number(it.amount || 0), 0);
    // Satu struk gabungan bisa berasal dari beberapa invoice asal (mis. hutang
    // dari 3 tanggal berbeda yang dilunasi sekaligus). Tampilkan nomornya kalau
    // cuma dari 1 invoice; kalau lebih dari 1, tampilkan jumlahnya saja supaya
    // tetap ringkas seperti struk asli.
    const invoiceNoDisplay =
      g.invoiceNos.size === 0 ? "-" : g.invoiceNos.size === 1 ? [...g.invoiceNos][0] : `${g.invoiceNos.size} invoice digabung`;
    return { ...g, groupTotal, invoiceNoDisplay };
  });
}
