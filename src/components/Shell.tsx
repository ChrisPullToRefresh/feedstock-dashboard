import type { ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import styles from "./Shell.module.css";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>Feedstock Dashboard</span>
        <nav aria-label="Main" className={styles.nav}>
          <Link href="/producers">Producers</Link>
          <Link href="/sites">Sequestration sites</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/transactions/new/in">Record incoming</Link>
          <UserButton />
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
