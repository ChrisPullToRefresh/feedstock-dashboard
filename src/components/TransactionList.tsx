import type { Transaction } from "@/lib/transactions";

export interface TransactionListItem extends Transaction {
  producerName: string | null;
  siteName: string | null;
}

export function TransactionList({
  transactions,
}: {
  transactions: TransactionListItem[];
}) {
  if (transactions.length === 0) {
    return <p>No transactions yet.</p>;
  }

  return (
    <ul>
      {transactions.map((transaction) => {
        const linkedName =
          transaction.direction === "in"
            ? transaction.producerName
            : transaction.siteName;

        return (
          <li key={transaction.id}>
            <span>{transaction.direction}</span>
            <span>{transaction.weight_kg} kg</span>
            <span>{linkedName}</span>
            <time dateTime={transaction.created_at}>
              {new Date(transaction.created_at).toLocaleString()}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
