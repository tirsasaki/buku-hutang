"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function useDebtForm({ selectedCustomerId, fetchAll, getNextInvoiceNo }) {
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtItemName, setDebtItemName] = useState("");
  const [debtQty, setDebtQty] = useState(1);
  const [debtUnitPrice, setDebtUnitPrice] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtDate, setDebtDate] = useState("");
  const [debtKasir, setDebtKasir] = useState("");
  const [debtAmountError, setDebtAmountError] = useState(false);

  const [bulkCustomerId, setBulkCustomerId] = useState("");
  const [bulkDate, setBulkDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [bulkKasir, setBulkKasir] = useState("");
  const [bulkItems, setBulkItems] = useState([{ item: "", qty: 1, amount: "", unitPrice: "" }]);
  const [bulkCustomerError, setBulkCustomerError] = useState(false);
  const [bulkItemErrors, setBulkItemErrors] = useState({});
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerPickerSearch, setCustomerPickerSearch] = useState("");

  async function handleAddDebt(e) {
    e.preventDefault();
    const amount = parseFloat(debtAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      setDebtAmountError(true);
      return;
    }
    setDebtAmountError(false);
    const dateVal = debtDate || new Date().toISOString().split("T")[0];
    const invoiceNo = await getNextInvoiceNo(dateVal);
    await supabase.from("debt_items").insert({
      customer_id: selectedCustomerId,
      item: debtItemName.trim(),
      qty: parseInt(debtQty) || 1,
      amount: amount,
      date: dateVal,
      kasir: debtKasir.trim() || null,
      invoice_no: invoiceNo,
    });
    setDebtItemName("");
    setDebtQty(1);
    setDebtUnitPrice("");
    setDebtAmount("");
    setDebtKasir("");
    setShowAddDebt(false);
    fetchAll();
  }

  function handleDebtQtyChange(value) {
    const q = parseInt(value) || 1;
    setDebtQty(value);
    if (q <= 1) {
      setDebtUnitPrice(debtAmount);
    } else {
      const unit = parseFloat(debtUnitPrice) || 0;
      if (unit) setDebtAmount(String(unit * q));
    }
  }

  function handleDebtUnitPriceChange(value) {
    setDebtUnitPrice(value);
    const q = parseInt(debtQty) || 1;
    const unit = parseFloat(value) || 0;
    setDebtAmount(value === "" ? "" : String(unit * q));
  }

  function handleDebtAmountChange(value) {
    setDebtAmount(value);
    const q = parseInt(debtQty) || 1;
    if (q <= 1) setDebtUnitPrice(value);
  }

  function resetKasirForm() {
    setBulkCustomerId("");
    setBulkDate(new Date().toISOString().split("T")[0]);
    setBulkKasir("");
    setBulkItems([{ item: "", qty: 1, amount: "", unitPrice: "" }]);
    setBulkCustomerError(false);
    setBulkItemErrors({});
  }

  function hasKasirData() {
    return (
      !!bulkCustomerId ||
      !!bulkKasir.trim() ||
      bulkItems.some((r) => r.item.trim() || r.amount !== "" || Number(r.qty) !== 1)
    );
  }

  function handleClearKasirForm() {
    if (hasKasirData() && !confirm("Bersihkan seluruh isian transaksi ini?")) return;
    resetKasirForm();
  }

  function addBulkRow() {
    setBulkItems((rows) => [...rows, { item: "", qty: 1, amount: "", unitPrice: "" }]);
  }

  function removeBulkRow(idx) {
    setBulkItems((rows) => rows.filter((_, i) => i !== idx));
  }

  function updateBulkRow(idx, field, value) {
    setBulkItems((rows) =>
      rows.map((r, i) => {
        if (i !== idx) return r;
        const row = { ...r, [field]: value };

        if (field === "qty") {
          const q = parseInt(value) || 1;
          if (q <= 1) {
            row.unitPrice = row.amount;
          } else {
            const unit = parseFloat(row.unitPrice) || 0;
            row.amount = unit ? String(unit * q) : row.amount;
          }
        } else if (field === "unitPrice") {
          const q = parseInt(row.qty) || 1;
          const unit = parseFloat(value) || 0;
          row.amount = value === "" ? "" : String(unit * q);
        } else if (field === "amount") {
          const q = parseInt(row.qty) || 1;
          if (q <= 1) {
            row.unitPrice = value;
          }
        }

        return row;
      })
    );
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
    const invoiceNo = await getNextInvoiceNo(dateVal);
    const rows = bulkItems.map((row) => ({
      customer_id: bulkCustomerId,
      item: row.item.trim(),
      qty: parseInt(row.qty) || 1,
      amount: parseFloat(row.amount),
      date: dateVal,
      kasir: kasirVal,
      invoice_no: invoiceNo,
    }));

    await supabase.from("debt_items").insert(rows);
    resetKasirForm();
    fetchAll();
  }

  return {
    showAddDebt,
    setShowAddDebt,
    debtItemName,
    setDebtItemName,
    debtQty,
    setDebtQty,
    debtUnitPrice,
    setDebtUnitPrice,
    debtAmount,
    setDebtAmount,
    debtDate,
    setDebtDate,
    debtKasir,
    setDebtKasir,
    debtAmountError,
    setDebtAmountError,
    bulkCustomerId,
    setBulkCustomerId,
    bulkDate,
    setBulkDate,
    bulkKasir,
    setBulkKasir,
    bulkItems,
    setBulkItems,
    bulkCustomerError,
    setBulkCustomerError,
    bulkItemErrors,
    setBulkItemErrors,
    showCustomerPicker,
    setShowCustomerPicker,
    customerPickerSearch,
    setCustomerPickerSearch,
    handleAddDebt,
    handleDebtQtyChange,
    handleDebtUnitPriceChange,
    handleDebtAmountChange,
    resetKasirForm,
    hasKasirData,
    handleClearKasirForm,
    addBulkRow,
    removeBulkRow,
    updateBulkRow,
    handleAddDebtBulk,
  };
}
