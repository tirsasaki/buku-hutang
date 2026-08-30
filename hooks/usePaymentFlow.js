import { useState } from "react";
import { remainingOf, formatRupiah } from "../lib/debt-utils";

// Menggabungkan seluruh alur "bayar hutang" (baik satu barang, satu grup
// transaksi, maupun tandai-semua-lunas) dan "pakai saldo lebih untuk bayar
// hutang" dalam satu hook, karena keduanya sama-sama berujung pada insert
// baris payment + (kadang) credit transaction, lalu fetchAll(). Page.jsx
// cukup memanggil hook ini sekali dan merangkai hasilnya ke PaymentModal /
// UseCreditModal / tombol-tombol terkait.
//
// Params:
// - debtItems, debtActions, fetchAll: dari useLedgerData/useDebtActions di page.jsx
// - selectedCustomerId: id pelanggan yang sedang dibuka
// - getCreditBalance(custId): fungsi hitung saldo lebih pelanggan
// - onGroupPaid(): dipanggil setelah pembayaran grup sukses (page.jsx pakai ini untuk menutup modal detail transaksi)
export function usePaymentFlow({ debtItems, debtActions, fetchAll, selectedCustomerId, getCreditBalance, onGroupPaid }) {
  const [payTarget, setPayTarget] = useState(null);
  const [payInitialMode, setPayInitialMode] = useState("partial");
  const [showUseCredit, setShowUseCredit] = useState(false);

  function openPayModal(item, mode) {
    setPayTarget(item);
    setPayInitialMode(mode);
  }

  function closePayModal() {
    setPayTarget(null);
  }

  function openBulkLunasModal() {
    const items = debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0);
    if (items.length === 0) {
      alert("Pelanggan ini tidak memiliki hutang aktif.");
      return;
    }
    setPayTarget("ALL");
    setPayInitialMode("lunas");
  }

  function openGroupLunasModal(items) {
    const activeItems = items.filter((i) => remainingOf(i) > 0);
    if (activeItems.length === 0) {
      alert("Transaksi ini sudah lunas semua.");
      return;
    }
    setPayTarget(activeItems);
    setPayInitialMode("lunas");
  }

  async function handlePaymentConfirm(payload) {
    if (payload.isGroup) {
      const { items, overpay, receivedBy } = payload;
      const rows = items.map((it) => ({
        debt_item_id: it.id,
        amount: remainingOf(it),
        received_by: receivedBy,
      }));
      await debtActions.recordPayments(rows);

      if (overpay > 0) {
        await debtActions.recordCreditTransaction({
          customerId: selectedCustomerId,
          amount: overpay,
          note: "Kelebihan bayar - tandai lunas",
        });
      }

      setPayTarget(null);
      onGroupPaid?.();
      fetchAll();

      if (overpay > 0) {
        alert(
          `Uang diterima melebihi total tagihan sebesar ${formatRupiah(overpay)}. Kelebihannya sudah disimpan sebagai saldo lebih pelanggan ini, dan bisa dipakai untuk pembayaran berikutnya.`
        );
      }
      return;
    }

    const { target, actualPayment, overpay, receivedBy } = payload;

    await debtActions.recordPayments({
      debt_item_id: target.id,
      amount: actualPayment,
      received_by: receivedBy,
    });

    if (overpay > 0) {
      await debtActions.recordCreditTransaction({
        customerId: selectedCustomerId,
        amount: overpay,
        note: `Kelebihan bayar${target.item ? " - " + target.item : ""}`,
      });
    }

    setPayTarget(null);
    fetchAll();

    if (overpay > 0) {
      alert(
        `Pembayaran melebihi sisa hutang sebesar ${formatRupiah(overpay)}. Kelebihannya sudah disimpan sebagai saldo lebih pelanggan ini, dan bisa dipakai untuk pembayaran berikutnya.`
      );
    }
  }

  // Pakai saldo lebih pelanggan untuk membayar hutang yang masih berjalan,
  // dimulai dari yang paling lama, sampai saldo habis atau hutang lunas semua.
  function openUseCreditModal() {
    const available = getCreditBalance(selectedCustomerId);
    if (available <= 0) {
      alert("Pelanggan ini tidak memiliki saldo lebih.");
      return;
    }
    const items = debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0);
    if (items.length === 0) {
      alert("Pelanggan ini tidak memiliki hutang aktif untuk dibayar pakai saldo.");
      return;
    }
    setShowUseCredit(true);
  }

  function closeUseCreditModal() {
    setShowUseCredit(false);
  }

  // Dipanggil oleh UseCreditModal saat form valid & disubmit.
  async function handleConfirmUseCredit(receivedBy) {
    let available = getCreditBalance(selectedCustomerId);
    const items = debtItems
      .filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const paymentRows = [];
    let totalUsed = 0;
    for (const it of items) {
      if (available <= 0) break;
      const rem = remainingOf(it);
      const use = Math.min(available, rem);
      if (use > 0) {
        paymentRows.push({ debt_item_id: it.id, amount: use, received_by: receivedBy });
        available -= use;
        totalUsed += use;
      }
    }

    if (totalUsed > 0) {
      await debtActions.recordPayments(paymentRows);
      await debtActions.recordCreditTransaction({
        customerId: selectedCustomerId,
        amount: -totalUsed,
        note: "Dipakai untuk membayar hutang",
      });
    }

    setShowUseCredit(false);
    fetchAll();
  }

  return {
    payTarget,
    payInitialMode,
    openPayModal,
    closePayModal,
    openBulkLunasModal,
    openGroupLunasModal,
    handlePaymentConfirm,
    showUseCredit,
    openUseCreditModal,
    closeUseCreditModal,
    handleConfirmUseCredit,
  };
}
