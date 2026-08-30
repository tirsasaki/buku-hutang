"use client";

import { useMemo } from "react";
import { remainingOf } from "../lib/debt-utils";

// Menggabungkan seluruh kalkulasi turunan (derived data) dari data mentah
// customers/debtItems/creditTx yang dipakai di HomePage: saldo per pelanggan,
// ringkasan total, dan pengelompokan transaksi berjalan pelanggan yang
// sedang dibuka. Semua murni hasil hitung dari state di atas, tidak ada
// efek samping, jadi ditaruh di satu tempat supaya page.jsx tidak penuh
// logic dan cukup fokus merangkai tampilan.
export function useCustomerDerivedData({ customers, debtItems, creditTx, selectedCustomerId, detailGroupKey }) {
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
  function creditBalanceForCustomer(custId) {
    return creditTx.filter((c) => c.customer_id === custId).reduce((s, c) => s + Number(c.amount), 0);
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const totalUnpaid = customers.reduce((s, c) => s + balanceForCustomer(c.id), 0);
  const countUnpaid = customers.filter((c) => balanceForCustomer(c.id) > 0).length;
  const totalCustomers = customers.length;
  const countLunas = totalCustomers - countUnpaid;
  const unpaidRatio = totalCustomers > 0 ? Math.round((countUnpaid / totalCustomers) * 100) : 0;

  const { ongoingGroups, doneItems } = useMemo(() => {
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
    const groups = [];
    const groupByKey = new Map();
    ongoingItems.forEach((it) => {
      const key = it.invoice_no || `${it.date}__${it.kasir || ""}`;
      if (!groupByKey.has(key)) {
        const group = {
          key,
          date: it.date,
          kasir: it.kasir || null,
          // Nomor invoice asli (INV-YYYYMMDD-0001). Data lama sebelum fitur ini
          // dibuat belum punya invoice_no, jadi dipakaikan kode sementara.
          trxNo: it.invoice_no || "TRX-" + String(it.id).replace(/-/g, "").slice(0, 8).toUpperCase(),
          items: [],
        };
        groupByKey.set(key, group);
        groups.push(group);
      }
      groupByKey.get(key).items.push(it);
    });

    return { ongoingGroups: groups, doneItems };
  }, [selectedCustomer, debtItems]);

  const detailGroup = detailGroupKey ? ongoingGroups.find((g) => g.key === detailGroupKey) : null;

  return {
    balanceForCustomer,
    lastActivityFor,
    creditBalanceForCustomer,
    selectedCustomer,
    totalUnpaid,
    countUnpaid,
    totalCustomers,
    countLunas,
    unpaidRatio,
    ongoingGroups,
    doneItems,
    detailGroup,
  };
}
