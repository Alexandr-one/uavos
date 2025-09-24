"use client";

import { useState } from "react";
import styles from "./header.module.css";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth.context";

export default function Header() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user, isLoading, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <button
          className={styles.burger}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        <Link href="/" className={styles.title}>
          Admin Panel
        </Link>

        {!isLoading && (
          user ? (
            <nav className={`${styles.nav} ${isOpen ? styles.open : ""}`}>
              <Link href="/" className={styles.link}>Main</Link>
              <Link href="/content/" className={styles.link}>Content</Link>
              <Link href="/content/add" className={styles.link}>Add content</Link>
              <button
                className={`${styles.link} ${styles['link-button']}`}
                onClick={logout}
              >
                Logout
              </button>
            </nav>
          ) : (
            <nav className={`${styles.nav} ${isOpen ? styles.open : ""}`}>
              <Link href="/" className={styles.link}>Main</Link>
              <Link href="/login" className={styles.link}>Login</Link>
            </nav>
          )
        )}
      </div>
    </header>
  );
}
