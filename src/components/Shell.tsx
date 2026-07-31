"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import styles from "./Shell.module.css";

const navGroups = [
  {
    label: "Manage",
    links: [
      { href: "/producers", label: "Producers" },
      { href: "/sites", label: "Sequestration sites" },
    ],
  },
  {
    label: "Record",
    links: [
      { href: "/transactions", label: "Transactions" },
      { href: "/transactions/new/in", label: "Record incoming" },
      { href: "/transactions/new/out", label: "Record outgoing" },
    ],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>Feedstock Dashboard</span>
        <UserButton />
      </header>
      <nav aria-label="Main" className={styles.nav}>
        <button
          type="button"
          className={styles.navToggle}
          aria-expanded={isMenuOpen}
          aria-controls="main-nav-menu"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{isMenuOpen ? "✕" : "☰"}</span>
        </button>
        <div
          id="main-nav-menu"
          className={
            isMenuOpen
              ? `${styles.navMenu} ${styles.navMenuOpen}`
              : styles.navMenu
          }
        >
          {navGroups.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              <span className={styles.navGroupLabel}>{group.label}</span>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
