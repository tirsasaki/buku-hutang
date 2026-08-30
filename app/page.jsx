"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useLedgerData } from "../hooks/useLedgerData";
import { useDebtActions } from "../hooks/useDebtActions";
import { usePaymentFlow } from "../hooks/usePaymentFlow";
import AppHeader from "../components/AppHeader";
import HomeSummary from "../components/HomeSummary";
import SignOutConfirmModal from "../components/SignOutConfirmModal";
import AddCustomerModal from "../components/AddCustomerModal";
import TransactionDetailModal from "../components/TransactionDetailModal";
import UseCreditModal from "../components/UseCreditModal";
import EditCustomerModal from "../components/EditCustomerModal";
import PaymentModal from "../components/PaymentModal";
import AddDebtModal from "../components/AddDebtModal";
import BulkDebtModal from "../components/BulkDebtModal";
import CustomerTab from "../components/CustomerTab";
import CustomerDetailHeader from "../components/CustomerDetailHeader";
import CustomerActions from "../components/CustomerActions";
import DebtHistoryTabs from "../components/DebtHistoryTabs";
import {
  remainingOf,
  DEFAULT_KASIR,
} from "../lib/debt-utils";
import { shareReceipt, shareReceiptToWa, copyReceiptText } from "../lib/receipt";


export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState(null);
  const { customers, debtItems, creditTx, loading, fetchAll } = useLedgerData({ userId, checkingAuth });
  const debtActions = useDebtActions();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [kasirNames, setKasirNames] = useState(DEFAULT_KASIR);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [activeTab, setActiveTab] = useState("berjalan");
  const [homeTab, setHomeTab] = useState("pelanggan");

  const [showAddCust, setShowAddCust] = useState(false);
  const [showEditPhone, setShowEditPhone] = useState(false);

  const [showAddDebt, setShowAddDebt] = useState(false);

  const [detailGroupKey, setDetailGroupKey] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      } else {
        setUserId(data.session.user.id);
        const savedKasir = data.session.user.user_metadata?.kasir_names;
        setKasirNames(Array.isArray(savedKasir) && savedKasir.length > 0 ? savedKasir : DEFAULT_KASIR);
        setCheckingAuth(false);
      }
    });
  }, [router]);

  async function handleSignOut() {
    setShowSignOutConfirm(false);
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
  function creditBalanceForCustomer(custId) {
    return creditTx.filter((c) => c.customer_id === custId).reduce((s, c) => s + Number(c.amount), 0);
  }

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

  const {
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
  } = usePaymentFlow({
    debtItems,
    debtActions,
    fetchAll,
    selectedCustomerId,
    getCreditBalance: creditBalanceForCustomer,
    onGroupPaid: () => setDetailGroupKey(null),
  });

  async function deleteDebtItem(itemId) {
    if (!confirm("Hapus catatan hutang ini beserta riwayat pembayarannya?")) return;
    await debtActions.deleteDebtItem(itemId);
    fetchAll();
  }

  async function deleteCustomer(cust) {
    if (!confirm(`Hapus pelanggan "${cust.name}" beserta seluruh riwayat hutangnya? Tindakan ini tidak bisa dibatalkan.`)) return;
    await debtActions.deleteCustomer(cust.id);
    setSelectedCustomerId(null);
    fetchAll();
  }

  function selectCustomer(custId) {
    setSelectedCustomerId(custId);
    setActiveTab("berjalan");
  }

  function openEditPhoneModal() {
    setShowEditPhone(true);
  }

  async function handleSavePhone(phone) {
    await debtActions.updateCustomerPhone(selectedCustomerId, phone);
    setShowEditPhone(false);
    fetchAll();
  }

  if (checkingAuth || loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">Memuat...</div>;
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const totalUnpaid = customers.reduce((s, c) => s + balanceForCustomer(c.id), 0);
  const countUnpaid = customers.filter((c) => balanceForCustomer(c.id) > 0).length;
  const totalCustomers = customers.length;
  const countLunas = totalCustomers - countUnpaid;
  const unpaidRatio = totalCustomers > 0 ? Math.round((countUnpaid / totalCustomers) * 100) : 0;

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
    return groups;
  })();
  const detailGroup = detailGroupKey ? ongoingGroups.find((g) => g.key === detailGroupKey) : null;

  return (
    <div className={`max-w-xl mx-auto px-4 pt-5 ${!selectedCustomer ? "pb-24" : "pb-10"}`}>
      {!selectedCustomer ? (
        <>
          <AppHeader onSignOutClick={() => setShowSignOutConfirm(true)} />

          <HomeSummary
            totalUnpaid={totalUnpaid}
            totalCustomers={totalCustomers}
            countUnpaid={countUnpaid}
            countLunas={countLunas}
            unpaidRatio={unpaidRatio}
            homeTab={homeTab}
            onHomeTabChange={setHomeTab}
          />
          {homeTab === "kasir" ? (
            <BulkDebtModal
              customers={customers}
              getCustomerBalance={balanceForCustomer}
              kasirNames={kasirNames}
              onConfirm={handleConfirmAddDebtBulk}
              onOpenAddCustomer={() => setShowAddCust(true)}
            />
          ) : (
            <CustomerTab
              customers={customers}
              getBalance={balanceForCustomer}
              getLastActivity={lastActivityFor}
              getCreditBalance={creditBalanceForCustomer}
              totalCustomers={totalCustomers}
              countUnpaid={countUnpaid}
              countLunas={countLunas}
              onSelectCustomer={selectCustomer}
            />
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

        </>
      ) : (
        <>
          <CustomerDetailHeader
            customer={selectedCustomer}
            balance={balanceForCustomer(selectedCustomer.id)}
            credit={creditBalanceForCustomer(selectedCustomer.id)}
            onBack={() => setSelectedCustomerId(null)}
            onEditPhone={openEditPhoneModal}
          />

          <CustomerActions
            onShare={() => shareReceipt(selectedCustomer, debtItems)}
            onCopyText={() => copyReceiptText(selectedCustomer, debtItems)}
            onShareWa={() => shareReceiptToWa(selectedCustomer, debtItems)}
            onMarkAllPaid={openBulkLunasModal}
            onUseCredit={openUseCreditModal}
            showUseCreditButton={creditBalanceForCustomer(selectedCustomer.id) > 0 && balanceForCustomer(selectedCustomer.id) > 0}
          />

          <DebtHistoryTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            ongoingGroups={ongoingGroups}
            doneItems={doneItems}
            onOpenDetail={setDetailGroupKey}
          />

          <button
            onClick={() => setShowAddDebt(true)}
            title="Tambah hutang baru"
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--ink)] text-[var(--paper)] shadow-lg flex items-center justify-center z-30 active:scale-90 transition-transform duration-200"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex justify-center mt-6 mb-20">
            <button
              onClick={() => deleteCustomer(selectedCustomer)}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--red)] hover:bg-[var(--red-soft)] px-3.5 py-2 rounded-full transition-colors duration-200 select-none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.1A2 2 0 0 1 16.2 21H7.8a2 2 0 0 1-2-1.9L5 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Hapus pelanggan ini
            </button>
          </div>
        </>
      )}

      {/* Modal: Konfirmasi keluar */}
      {showSignOutConfirm && (
        <SignOutConfirmModal onConfirm={handleSignOut} onClose={() => setShowSignOutConfirm(false)} />
      )}

      {/* Modal: Edit nomor WA */}
      {showEditPhone && (
        <EditCustomerModal
          customer={selectedCustomer}
          onSave={handleSavePhone}
          onClose={() => setShowEditPhone(false)}
        />
      )}

      {/* Modal: Tambah pelanggan */}
      {showAddCust && (
        <AddCustomerModal onConfirm={handleAddCustomer} onClose={() => setShowAddCust(false)} />
      )}

      {/* Modal: Tambah hutang */}
      {showAddDebt && (
        <AddDebtModal
          kasirNames={kasirNames}
          onConfirm={handleConfirmAddDebt}
          onClose={() => setShowAddDebt(false)}
        />
      )}

      {/* Modal: Detail transaksi belanja (piutang) berjalan */}
      {detailGroup && (
        <TransactionDetailModal
          group={detailGroup}
          onClose={() => setDetailGroupKey(null)}
          onPayItem={openPayModal}
          onDeleteItem={deleteDebtItem}
          onMarkGroupPaid={openGroupLunasModal}
        />
      )}

      {/* Modal: Bayar */}
      {payTarget && (
        <PaymentModal
          target={payTarget}
          initialMode={payInitialMode}
          debtItems={debtItems}
          selectedCustomerId={selectedCustomerId}
          creditBalance={creditBalanceForCustomer(selectedCustomerId)}
          kasirNames={kasirNames}
          onConfirm={handlePaymentConfirm}
          onClose={closePayModal}
        />
      )}

      {/* Modal: Pakai saldo lebih untuk membayar hutang */}
      {showUseCredit && selectedCustomer && (
        <UseCreditModal
          customer={selectedCustomer}
          availableCredit={creditBalanceForCustomer(selectedCustomer.id)}
          debtItems={debtItems}
          kasirNames={kasirNames}
          onConfirm={handleConfirmUseCredit}
          onClose={closeUseCreditModal}
        />
      )}
    </div>
  );
}