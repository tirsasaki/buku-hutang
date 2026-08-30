"use client";

import { supabase } from "../lib/supabaseClient";

// Hook aksi tulis (CRUD) untuk data hutang, pelanggan, pembayaran, dan
// saldo lebih. Setiap fungsi di sini murni menjalankan query Supabase
// berdasarkan data yang dikirim oleh komponen pemanggil — hook ini TIDAK
// menyimpan state form sendiri. Validasi input, state UI (mis. pesan error,
// modal terbuka/tertutup), dan pemanggilan fetchAll() setelah aksi selesai
// tetap menjadi tanggung jawab komponen (page.jsx).
export function useDebtActions() {
  // Ambil nomor invoice berikutnya (format INV-YYYYMMDD-0001) lewat fungsi
  // di database (public.next_invoice_no) supaya urutannya tetap aman/atomik
  // walau ada beberapa transaksi dibuat hampir bersamaan. Satu invoice dipakai
  // bersama untuk semua barang dalam satu transaksi (mis. input banyak barang
  // sekaligus di kasir). `debtItems` dipakai sebagai fallback lokal (tanpa
  // jaminan anti-tabrakan) kalau RPC gagal atau migrasi database belum jalan.
  async function getNextInvoiceNo(dateVal, debtItems) {
    const d = dateVal || new Date().toISOString().split("T")[0];
    const { data, error } = await supabase.rpc("next_invoice_no", { p_date: d });
    if (error || !data) {
      console.error("Gagal membuat nomor invoice dari database, memakai fallback lokal:", error);
      const compact = d.replace(/-/g, "");
      const prefix = `INV-${compact}-`;
      const existing = (debtItems || [])
        .map((it) => it.invoice_no)
        .filter((no) => no && no.startsWith(prefix))
        .map((no) => parseInt(no.slice(prefix.length), 10))
        .filter((n) => !isNaN(n));
      const next = (existing.length ? Math.max(...existing) : 0) + 1;
      return prefix + String(next).padStart(4, "0");
    }
    return data;
  }

  async function addCustomer({ name, phone }) {
    return supabase.from("customers").insert({ name: name.trim(), phone: (phone || "").trim() || null });
  }

  async function addDebt({ customerId, item, qty, amount, date, kasir, invoiceNo }) {
    return supabase.from("debt_items").insert({
      customer_id: customerId,
      item: item.trim(),
      qty: parseInt(qty) || 1,
      amount,
      date,
      kasir: (kasir || "").trim() || null,
      invoice_no: invoiceNo,
    });
  }

  async function addDebtBulk(rows) {
    return supabase.from("debt_items").insert(rows);
  }

  // rows: satu object payment atau array of payment ({ debt_item_id, amount, received_by })
  async function recordPayments(rows) {
    return supabase.from("payments").insert(rows);
  }

  async function recordCreditTransaction({ customerId, amount, note }) {
    return supabase.from("credit_transactions").insert({ customer_id: customerId, amount, note });
  }

  async function deleteDebtItem(itemId) {
    return supabase.from("debt_items").delete().eq("id", itemId);
  }

  async function deleteCustomer(custId) {
    return supabase.from("customers").delete().eq("id", custId);
  }

  async function updateCustomerPhone(custId, phone) {
    return supabase.from("customers").update({ phone: phone.trim() || null }).eq("id", custId);
  }

  return {
    getNextInvoiceNo,
    addCustomer,
    addDebt,
    addDebtBulk,
    recordPayments,
    recordCreditTransaction,
    deleteDebtItem,
    deleteCustomer,
    updateCustomerPhone,
  };
}
