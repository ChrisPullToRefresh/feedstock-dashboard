import { connection } from "next/server";
import { list as listTransactions } from "@/lib/transactions";
import { list as listProducers } from "@/lib/producers";
import { list as listSites } from "@/lib/sequestrationSites";
import {
  TransactionList,
  type TransactionListItem,
} from "@/components/TransactionList";

export default async function TransactionsPage() {
  await connection();
  const [transactions, producers, sites] = await Promise.all([
    listTransactions(),
    listProducers(),
    listSites(),
  ]);

  const producerNames = new Map(producers.map((p) => [p.id, p.name]));
  const siteNames = new Map(sites.map((s) => [s.id, s.name]));

  const items: TransactionListItem[] = transactions.map((transaction) => ({
    ...transaction,
    producerName:
      transaction.producer_id !== null
        ? (producerNames.get(transaction.producer_id) ?? null)
        : null,
    siteName:
      transaction.site_id !== null
        ? (siteNames.get(transaction.site_id) ?? null)
        : null,
  }));

  return (
    <div>
      <h1>Transaction history</h1>
      <TransactionList transactions={items} />
    </div>
  );
}
