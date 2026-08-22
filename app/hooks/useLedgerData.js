"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function useLedgerData({ checkingAuth, userId }) {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [debtItems, setDebtItems] = useState([]);
  const [creditTx, setCreditTx] = useState([]);

  const fetchAll = useCallback(async () => {
    const { data: custs } = await supabase.from("customers").select("*").order("name");
    const { data: items } = await supabase
      .from("debt_items")
      .select("*, payments(*)")
      .order("date", { ascending: false });
    const { data: credits } = await supabase
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    setCustomers(custs || []);
    setDebtItems(items || []);
    setCreditTx(credits || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (checkingAuth || !userId) return;
    fetchAll();

    const channel = supabase
      .channel("realtime-ledger-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers", filter: `user_id=eq.${userId}` }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "debt_items", filter: `user_id=eq.${userId}` }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${userId}` }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "credit_transactions", filter: `user_id=eq.${userId}` }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkingAuth, userId, fetchAll]);

  return { loading, customers, debtItems, creditTx, fetchAll };
}