"use client";

import { useState } from "react";
import { notifyError } from "../lib/notify";

// Menggabungkan seluruh handler CRUD sederhana untuk pelanggan & hutang
// (tambah pelanggan, tambah hutang banyak barang sekaligus dari tab Kasir,
// hapus hutang, hapus pelanggan, ganti nomor WA) beserta state visibility
// modal terkaitnya. Polanya sama semua: panggil debtActions.x() lalu
// fetchAll(), jadi dikumpulkan di satu hook supaya page.jsx tidak penuh
// handler serupa.
//
// Catatan: tidak ada lagi alur tambah-hutang satu-barang dari halaman
// detail pelanggan -- semua penambahan hutang (baik satu maupun banyak
// barang) sekarang lewat tab Kasir saja, supaya nomor invoice & alur
// pencatatan konsisten satu pintu. Tombol "Tambah hutang baru" di halaman
// detail pelanggan mengarahkan ke tab Kasir dengan pelanggan sudah
// terisi otomatis (lihat goToKasirForCustomer di page.jsx).
//
// deleteCustomer tidak menyentuh state selectedCustomerId di page.jsx
// secara langsung -- ia memanggil onCustomerDeleted() sebagai callback,
// supaya hook ini tidak perlu tahu detail state yang dikelola di luar dirinya.
//
// Penghapusan (hutang & pelanggan) tidak lagi pakai confirm() browser
// bawaan. Sebagai gantinya hook ini menyimpan "target yang menunggu
// konfirmasi" (pendingDeleteItemId / pendingDeleteCustomer). page.jsx
// merender <ConfirmModal> berdasarkan target itu, mirip pola
// showSignOutConfirm + SignOutConfirmModal yang sudah ada.
export function useCustomerCrud({ debtActions, fetchAll, debtItems, selectedCustomerId, onCustomerDeleted }) {
  const [showAddCust, setShowAddCust] = useState(false);
  const [showEditPhone, setShowEditPhone] = useState(false);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState(null);
  const [pendingDeleteCustomer, setPendingDeleteCustomer] = useState(null);
  const [addDebtSuccess, setAddDebtSuccess] = useState(null);

  // Dipanggil oleh AddCustomerModal saat form valid & disubmit.
  // payload = { name, phone }
  async function handleAddCustomer(payload) {
    const { error } = await debtActions.addCustomer(payload);
    if (error) {
      notifyError("Gagal menambah pelanggan: " + error.message);
      return;
    }
    setShowAddCust(false);
    fetchAll();
  }

  // Dipanggil oleh BulkDebtModal saat form banyak barang valid & disubmit.
  // payload = { customerId, customerName, date, kasir, items: [{ item, qty, amount }] }
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

    const { error } = await debtActions.addDebtBulk(rows);
    if (error) {
      notifyError("Gagal menambah catatan hutang: " + error.message);
      return;
    }
    setAddDebtSuccess({
      customerId: payload.customerId,
      customerName: payload.customerName || "",
      kasir: payload.kasir,
      itemCount: payload.items.length,
      total: payload.items.reduce((s, row) => s + (Number(row.amount) || 0), 0),
    });
    fetchAll();
  }

  function dismissAddDebtSuccess() {
    setAddDebtSuccess(null);
  }

  // Dipanggil oleh tombol "Hapus" pada catatan hutang -- membuka ConfirmModal,
  // belum menghapus apa pun.
  function requestDeleteDebtItem(itemId) {
    setPendingDeleteItemId(itemId);
  }

  function cancelDeleteDebtItem() {
    setPendingDeleteItemId(null);
  }

  // Dipanggil oleh ConfirmModal saat tombol konfirmasi diklik.
  async function confirmDeleteDebtItem() {
    const itemId = pendingDeleteItemId;
    setPendingDeleteItemId(null);
    const { error } = await debtActions.deleteDebtItem(itemId);
    if (error) {
      notifyError("Gagal menghapus catatan hutang: " + error.message);
      return;
    }
    fetchAll();
  }

  // Dipanggil oleh tombol "Hapus pelanggan ini" -- membuka ConfirmModal,
  // belum menghapus apa pun.
  function requestDeleteCustomer(cust) {
    setPendingDeleteCustomer(cust);
  }

  function cancelDeleteCustomer() {
    setPendingDeleteCustomer(null);
  }

  // Dipanggil oleh ConfirmModal saat tombol konfirmasi diklik.
  async function confirmDeleteCustomer() {
    const cust = pendingDeleteCustomer;
    setPendingDeleteCustomer(null);
    const { error } = await debtActions.deleteCustomer(cust.id);
    if (error) {
      notifyError("Gagal menghapus pelanggan: " + error.message);
      return;
    }
    onCustomerDeleted?.();
    fetchAll();
  }

  async function handleSavePhone(phone) {
    const { error } = await debtActions.updateCustomerPhone(selectedCustomerId, phone);
    if (error) {
      notifyError("Gagal menyimpan nomor WA: " + error.message);
      return;
    }
    setShowEditPhone(false);
    fetchAll();
  }

  return {
    showAddCust,
    setShowAddCust,
    showEditPhone,
    setShowEditPhone,
    handleAddCustomer,
    handleConfirmAddDebtBulk,
    pendingDeleteItemId,
    requestDeleteDebtItem,
    cancelDeleteDebtItem,
    confirmDeleteDebtItem,
    pendingDeleteCustomer,
    requestDeleteCustomer,
    cancelDeleteCustomer,
    confirmDeleteCustomer,
    handleSavePhone,
    addDebtSuccess,
    dismissAddDebtSuccess,
  };
}
