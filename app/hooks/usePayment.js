"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { creditBalanceForCustomer, formatRupiah, remainingOf } from "../../lib/ledgerUtils";

export default function usePayment({ debtItems, creditTx, selectedCustomerId, fetchAll, setDetailGroupKey }) {
  const [payTarget, setPayTarget] = useState(null);
  const [payMode, setPayMode] = useState("partial");
  const [payAmount, setPayAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [receiverOther, setReceiverOther] = useState("");
  const [payAmountError, setPayAmountError] = useState(false);
  const [receiverError, setReceiverError] = useState(false);

  const [showUseCredit, setShowUseCredit] = useState(false);
  const [useCreditReceiver, setUseCreditReceiver] = useState("");
  const [useCreditReceiverOther, setUseCreditReceiverOther] = useState("");
  const [useCreditReceiverError, setUseCreditReceiverError] = useState(false);

  function openPayModal(item, mode) {
    setPayTarget(item);
    setPayMode(mode);
    setPayAmount(mode === "lunas" ? String(Math.round(remainingOf(item))) : "");
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
    const total = items.reduce((s, i) => s + remainingOf(i), 0);
    setPayTarget("ALL");
    setPayMode("lunas");
    setPayAmount(String(Math.round(total)));
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
    const total = activeItems.reduce((s, i) => s + remainingOf(i), 0);
    setPayTarget(activeItems);
    setPayMode("lunas");
    setPayAmount(String(Math.round(total)));
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
      const totalRemaining = items.reduce((s, i) => s + remainingOf(i), 0);

      const amount = parseFloat(payAmount);
      if (!amount || amount <= 0 || isNaN(amount) || amount < totalRemaining) {
        setPayAmountError(true);
        return;
      }
      setPayAmountError(false);

      const rows = items.map((it) => ({
        debt_item_id: it.id,
        amount: remainingOf(it),
        received_by: finalReceiver,
      }));
      await supabase.from("payments").insert(rows);

      const overpay = amount - totalRemaining;
      if (overpay > 0) {
        await supabase.from("credit_transactions").insert({
          customer_id: selectedCustomerId,
          amount: overpay,
          note: "Kelebihan bayar - tandai lunas",
        });
      }

      setPayTarget(null);
      setDetailGroupKey(null);
      fetchAll();

      if (overpay > 0) {
        alert(
          `Uang diterima melebihi total tagihan sebesar ${formatRupiah(overpay)}. Kelebihannya sudah disimpan sebagai saldo lebih pelanggan ini, dan bisa dipakai untuk pembayaran berikutnya.`
        );
      }
      return;
    }

    const remaining = remainingOf(payTarget);
    let amount;
    let valid = true;

    amount = parseFloat(payAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      setPayAmountError(true);
      valid = false;
    } else if (payMode === "lunas" && amount < remaining) {
      setPayAmountError(true);
      valid = false;
    } else {
      setPayAmountError(false);
    }
    if (!valid) return;

    const actualPayment = Math.min(amount, remaining);
    const overpay = Math.max(amount - remaining, 0);

    await supabase.from("payments").insert({
      debt_item_id: payTarget.id,
      amount: actualPayment,
      received_by: finalReceiver,
    });

    if (overpay > 0) {
      await supabase.from("credit_transactions").insert({
        customer_id: selectedCustomerId,
        amount: overpay,
        note: `Kelebihan bayar${payTarget.item ? " - " + payTarget.item : ""}`,
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

  function openUseCreditModal() {
    const available = creditBalanceForCustomer(selectedCustomerId, creditTx);
    if (available <= 0) {
      alert("Pelanggan ini tidak memiliki saldo lebih.");
      return;
    }
    const items = debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0);
    if (items.length === 0) {
      alert("Pelanggan ini tidak memiliki hutang aktif untuk dibayar pakai saldo.");
      return;
    }
    setUseCreditReceiver("");
    setUseCreditReceiverOther("");
    setUseCreditReceiverError(false);
    setShowUseCredit(true);
  }

  async function handleConfirmUseCredit(e) {
    e.preventDefault();
    const finalReceiver = useCreditReceiverOther.trim() || useCreditReceiver;
    if (!finalReceiver) {
      setUseCreditReceiverError(true);
      return;
    }
    setUseCreditReceiverError(false);

    let available = creditBalanceForCustomer(selectedCustomerId, creditTx);
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
        paymentRows.push({ debt_item_id: it.id, amount: use, received_by: finalReceiver });
        available -= use;
        totalUsed += use;
      }
    }

    if (totalUsed > 0) {
      await supabase.from("payments").insert(paymentRows);
      await supabase.from("credit_transactions").insert({
        customer_id: selectedCustomerId,
        amount: -totalUsed,
        note: "Dipakai untuk membayar hutang",
      });
    }

    setShowUseCredit(false);
    fetchAll();
  }

  async function deleteDebtItem(itemId) {
    if (!confirm("Hapus catatan hutang ini beserta riwayat pembayarannya?")) return;
    await supabase.from("debt_items").delete().eq("id", itemId);
    fetchAll();
  }

  return {
    payTarget,
    setPayTarget,
    payMode,
    setPayMode,
    payAmount,
    setPayAmount,
    receiver,
    setReceiver,
    receiverOther,
    setReceiverOther,
    payAmountError,
    setPayAmountError,
    receiverError,
    setReceiverError,
    showUseCredit,
    setShowUseCredit,
    useCreditReceiver,
    setUseCreditReceiver,
    useCreditReceiverOther,
    setUseCreditReceiverOther,
    useCreditReceiverError,
    setUseCreditReceiverError,
    openPayModal,
    openBulkLunasModal,
    openGroupLunasModal,
    handleConfirmPay,
    openUseCreditModal,
    handleConfirmUseCredit,
    deleteDebtItem,
  };
}
