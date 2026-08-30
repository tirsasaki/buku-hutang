"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useLedgerData } from "../hooks/useLedgerData";
import { useDebtActions } from "../hooks/useDebtActions";
import { usePaymentFlow } from "../hooks/usePaymentFlow";
import { useCustomerDerivedData } from "../hooks/useCustomerDerivedData";
import { useCustomerCrud } from "../hooks/useCustomerCrud";
import AppHeader from "../components/AppHeader";
import HomeSummary from "../components/HomeSummary";
import SignOutConfirmModal from "../components/SignOutConfirmModal";
import ConfirmModal from "../components/ConfirmModal";
import AddCustomerModal from "../components/AddCustomerModal";
import TransactionDetailModal from "../components/TransactionDetailModal";
import UseCreditModal from "../components/UseCreditModal";
import PartialPaymentModal from "../components/PartialPaymentModal";
import TransactionSuccessPopup from "../components/TransactionSuccessPopup";
import EditCustomerModal from "../components/EditCustomerModal";
import PaymentModal from "../components/PaymentModal";
import BulkDebtModal from "../components/BulkDebtModal";
import CustomerTab from "../components/CustomerTab";
import CustomerDetailHeader from "../components/CustomerDetailHeader";
import CustomerActions from "../components/CustomerActions";
import DebtHistoryTabs from "../components/DebtHistoryTabs";
import FabButton from "../components/FabButton";
import { DEFAULT_KASIR } from "../lib/debt-utils";
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

  const [detailGroupKey, setDetailGroupKey] = useState(null);

  // Prefill pelanggan saat diarahkan ke tab Kasir dari tombol "Tambah hutang
  // baru" di halaman detail pelanggan (lihat goToKasirForCustomer di bawah).
  // `token` dipakai sebagai key <BulkDebtModal> supaya form kasir "dimulai
  // ulang" bersih tiap kali diarahkan ke sini -- termasuk saat pelanggan yang
  // sama diklik dua kali berturut-turut.
  const [kasirPrefill, setKasirPrefill] = useState(null); // { customerId, token }

  const {
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
  } = useCustomerDerivedData({ customers, debtItems, creditTx, selectedCustomerId, detailGroupKey });

  const {
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
  } = useCustomerCrud({
    debtActions,
    fetchAll,
    debtItems,
    selectedCustomerId,
    onCustomerDeleted: () => setSelectedCustomerId(null),
  });

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
    showBulkPartial,
    openBulkPartialModal,
    closeBulkPartialModal,
    handleConfirmBulkPartial,
  } = usePaymentFlow({
    debtItems,
    debtActions,
    fetchAll,
    selectedCustomerId,
    getCreditBalance: creditBalanceForCustomer,
    onGroupPaid: () => setDetailGroupKey(null),
  });

  function selectCustomer(custId) {
    setSelectedCustomerId(custId);
    setActiveTab("berjalan");
  }

  // Dipanggil oleh tombol "Tambah hutang baru" di halaman detail pelanggan.
  // Penambahan hutang sekarang cuma lewat tab Kasir, jadi tombol ini
  // membawa pengguna ke sana dengan pelanggan yang sedang dibuka sudah
  // otomatis terisi di form, alih-alih membuka modal terpisah.
  function goToKasirForCustomer(custId) {
    setKasirPrefill({ customerId: custId, token: Date.now() });
    setSelectedCustomerId(null);
    setHomeTab("kasir");
  }

  function openEditPhoneModal() {
    setShowEditPhone(true);
  }

  if (checkingAuth || loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">Memuat...</div>;
  }

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
              key={kasirPrefill?.token || "default"}
              customers={customers}
              getCustomerBalance={balanceForCustomer}
              kasirNames={kasirNames}
              initialCustomerId={kasirPrefill?.customerId}
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
            <FabButton
              onClick={() => setShowAddCust((v) => !v)}
              title={showAddCust ? "Tutup" : "Tambah pelanggan baru"}
              rotated={showAddCust}
            />
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
            onPartialPay={openBulkPartialModal}
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

          <FabButton onClick={() => goToKasirForCustomer(selectedCustomer.id)} title="Tambah hutang baru" />

          <div className="flex justify-center mt-6 mb-20">
            <button
              onClick={() => requestDeleteCustomer(selectedCustomer)}
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

      {/* Modal: Konfirmasi hapus catatan hutang */}
      {pendingDeleteItemId && (
        <ConfirmModal
          title="Hapus catatan hutang?"
          message="Catatan hutang ini beserta riwayat pembayarannya akan dihapus."
          confirmLabel="Ya, hapus"
          onConfirm={confirmDeleteDebtItem}
          onClose={cancelDeleteDebtItem}
        />
      )}

      {/* Modal: Konfirmasi hapus pelanggan */}
      {pendingDeleteCustomer && (
        <ConfirmModal
          title="Hapus pelanggan?"
          message={`Pelanggan "${pendingDeleteCustomer.name}" beserta seluruh riwayat hutangnya akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Ya, hapus"
          onConfirm={confirmDeleteCustomer}
          onClose={cancelDeleteCustomer}
        />
      )}

      {/* Modal: Detail transaksi belanja (piutang) berjalan */}
      {detailGroup && (
        <TransactionDetailModal
          group={detailGroup}
          onClose={() => setDetailGroupKey(null)}
          onPayItem={openPayModal}
          onDeleteItem={requestDeleteDebtItem}
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

      {/* Modal: Bayar sebagian (lintas item, hutang paling lama dilunasi dulu) */}
      {showBulkPartial && selectedCustomer && (
        <PartialPaymentModal
          debtItems={debtItems}
          selectedCustomerId={selectedCustomerId}
          kasirNames={kasirNames}
          onConfirm={handleConfirmBulkPartial}
          onClose={closeBulkPartialModal}
        />
      )}

      {/* Popup: Notifikasi sukses setelah transaksi kasir disimpan */}
      <TransactionSuccessPopup
        info={addDebtSuccess}
        onClose={dismissAddDebtSuccess}
        onViewCustomer={(custId) => {
          dismissAddDebtSuccess();
          selectCustomer(custId);
        }}
      />
    </div>
  );
}