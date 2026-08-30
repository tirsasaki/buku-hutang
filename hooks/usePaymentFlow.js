import { useState } from "react";
import { remainingOf, formatRupiah, allocateOldestFirst } from "../lib/debt-utils";
import { notifyError } from "../lib/notify";

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
  const [showBulkPartial, setShowBulkPartial] = useState(false);

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

  // Buka modal "Bayar sebagian" tingkat pelanggan (dipicu tombol di sebelah
  // "Tandai semua lunas"). Alokasi ke item mana yang dilunasi/dicicil
  // ditentukan lewat allocateOldestFirst() saat form disubmit.
  function openBulkPartialModal() {
    const items = debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0);
    if (items.length === 0) {
      alert("Pelanggan ini tidak memiliki hutang aktif.");
      return;
    }
    setShowBulkPartial(true);
  }

  function closeBulkPartialModal() {
    setShowBulkPartial(false);
  }

  // Dipanggil oleh PartialPaymentModal saat form valid & disubmit. Jumlah
  // yang dibayar dialokasikan ke hutang aktif pelanggan, yang paling lama
  // (tanggal terlama) dilunasi lebih dulu; kelebihan (kalau ada) disimpan
  // sebagai saldo lebih.
  async function handleConfirmBulkPartial({ amount, receivedBy }) {
    const items = debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0);
    const { allocations, totalUsed, leftover } = allocateOldestFirst(items, amount);

    if (totalUsed <= 0) {
      setShowBulkPartial(false);
      return;
    }

    const rows = allocations.map(({ item, amount: use }) => ({
      debt_item_id: item.id,
      amount: use,
      received_by: receivedBy,
    }));

    const { error: payError } = await debtActions.recordPayments(rows);
    if (payError) {
      notifyError("Gagal mencatat pembayaran: " + payError.message);
      return;
    }

    if (leftover > 0) {
      const { error: creditError } = await debtActions.recordCreditTransaction({
        customerId: selectedCustomerId,
        amount: leftover,
        note: "Kelebihan bayar - bayar sebagian",
      });
      if (creditError) {
        notifyError(
          "Pembayaran tersimpan, tapi gagal mencatat kelebihan bayar sebagai saldo lebih: " + creditError.message
        );
        setShowBulkPartial(false);
        fetchAll();
        return;
      }
    }

    setShowBulkPartial(false);
    fetchAll();

    if (leftover > 0) {
      alert(
        `Uang diterima melebihi total tagihan sebesar ${formatRupiah(leftover)}. Kelebihannya sudah disimpan sebagai saldo lebih pelanggan ini, dan bisa dipakai untuk pembayaran berikutnya.`
      );
    }
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
      const { error: payError } = await debtActions.recordPayments(rows);
      if (payError) {
        notifyError("Gagal mencatat pembayaran: " + payError.message);
        return;
      }

      if (overpay > 0) {
        const { error: creditError } = await debtActions.recordCreditTransaction({
          customerId: selectedCustomerId,
          amount: overpay,
          note: "Kelebihan bayar - tandai lunas",
        });
        if (creditError) {
          notifyError(
            "Pembayaran tersimpan, tapi gagal mencatat kelebihan bayar sebagai saldo lebih: " + creditError.message
          );
          setPayTarget(null);
          onGroupPaid?.();
          fetchAll();
          return;
        }
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

    const { error: payError } = await debtActions.recordPayments({
      debt_item_id: target.id,
      amount: actualPayment,
      received_by: receivedBy,
    });
    if (payError) {
      notifyError("Gagal mencatat pembayaran: " + payError.message);
      return;
    }

    if (overpay > 0) {
      const { error: creditError } = await debtActions.recordCreditTransaction({
        customerId: selectedCustomerId,
        amount: overpay,
        note: `Kelebihan bayar${target.item ? " - " + target.item : ""}`,
      });
      if (creditError) {
        notifyError(
          "Pembayaran tersimpan, tapi gagal mencatat kelebihan bayar sebagai saldo lebih: " + creditError.message
        );
        setPayTarget(null);
        fetchAll();
        return;
      }
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
    const available = getCreditBalance(selectedCustomerId);
    const items = debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0);
    const { allocations, totalUsed } = allocateOldestFirst(items, available);
    const paymentRows = allocations.map(({ item, amount: use }) => ({
      debt_item_id: item.id,
      amount: use,
      received_by: receivedBy,
    }));

    if (totalUsed > 0) {
      const { error: payError } = await debtActions.recordPayments(paymentRows);
      if (payError) {
        notifyError("Gagal memakai saldo lebih untuk membayar hutang: " + payError.message);
        return;
      }
      const { error: creditError } = await debtActions.recordCreditTransaction({
        customerId: selectedCustomerId,
        amount: -totalUsed,
        note: "Dipakai untuk membayar hutang",
      });
      if (creditError) {
        notifyError(
          "Pembayaran tersimpan, tapi gagal memperbarui saldo lebih: " + creditError.message
        );
        setShowUseCredit(false);
        fetchAll();
        return;
      }
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
    showBulkPartial,
    openBulkPartialModal,
    closeBulkPartialModal,
    handleConfirmBulkPartial,
  };
}
