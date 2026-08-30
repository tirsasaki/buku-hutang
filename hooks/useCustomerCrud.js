"use client";

import { useState } from "react";

// Menggabungkan seluruh handler CRUD sederhana untuk pelanggan & hutang
// (tambah pelanggan, tambah hutang satu/banyak barang, hapus hutang, hapus
// pelanggan, ganti nomor WA) beserta state visibility modal terkaitnya.
// Polanya sama semua: panggil debtActions.x() lalu fetchAll(), jadi
// dikumpulkan di satu hook supaya page.jsx tidak penuh handler serupa.
//
// deleteCustomer tidak menyentuh state selectedCustomerId di page.jsx
// secara langsung -- ia memanggil onCustomerDeleted() sebagai callback,
// supaya hook ini tidak perlu tahu detail state yang dikelola di luar dirinya.
export function useCustomerCrud({ debtActions, fetchAll, debtItems, selectedCustomerId, onCustomerDeleted }) {
  const [showAddCust, setShowAddCust] = useState(false);
  const [showEditPhone, setShowEditPhone] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);

  // Dipanggil oleh AddCustomerModal saat form valid & disubmit.
  // payload = { name, phone }
  async function handleAddCustomer(payload) {
    await debtActions.addCustomer(payload);
    setShowAddCust(false);
    fetchAll();
  }

  // Dipanggil oleh AddDebtModal saat form satu barang valid & disubmit.
  // payload = { item, qty, amount, date, kasir }
  async function handleConfirmAddDebt(payload) {
    const invoiceNo = await debtActions.getNextInvoiceNo(payload.date, debtItems);
    await debtActions.addDebt({
      customerId: selectedCustomerId,
      item: payload.item,
      qty: payload.qty,
      amount: payload.amount,
      date: payload.date,
      kasir: payload.kasir,
      invoiceNo,
    });
    setShowAddDebt(false);
    fetchAll();
  }

  // Dipanggil oleh BulkDebtModal saat form banyak barang valid & disubmit.
  // payload = { customerId, date, kasir, items: [{ item, qty, amount }] }
  async function handleConfirmAddDebtBulk(payload) {
    const invoiceNo = await debtActions.getNextInvoiceNo(payload.date, debtItems);
    const rows = payload.items.map((row) => ({
      customer_id: payload.customerId,
      item: row.item,
      qty: row.qty,
      amount: row.amount,
      date: payload.date,
      kasir: payload.kasir,
      invoice_no: invoiceNo,
    }));

    await debtActions.addDebtBulk(rows);
    fetchAll();
  }

  async function deleteDebtItem(itemId) {
    if (!confirm("Hapus catatan hutang ini beserta riwayat pembayarannya?")) return;
    await debtActions.deleteDebtItem(itemId);
    fetchAll();
  }

  async function deleteCustomer(cust) {
    if (!confirm(`Hapus pelanggan "${cust.name}" beserta seluruh riwayat hutangnya? Tindakan ini tidak bisa dibatalkan.`)) return;
    await debtActions.deleteCustomer(cust.id);
    onCustomerDeleted?.();
    fetchAll();
  }

  async function handleSavePhone(phone) {
    await debtActions.updateCustomerPhone(selectedCustomerId, phone);
    setShowEditPhone(false);
    fetchAll();
  }

  return {
    showAddCust,
    setShowAddCust,
    showEditPhone,
    setShowEditPhone,
    showAddDebt,
    setShowAddDebt,
    handleAddCustomer,
    handleConfirmAddDebt,
    handleConfirmAddDebtBulk,
    deleteDebtItem,
    deleteCustomer,
    handleSavePhone,
  };
}
