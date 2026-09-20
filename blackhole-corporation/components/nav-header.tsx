import Link from "next/link";
import styles from "./nav-header.module.css";

export function NavHeader({
  active,
  showManageAccounts = false,
}: {
  active?: string;
  showManageAccounts?: boolean;
}) {
  const links = [
    { href: "/dashboard", label: "General" },
    { href: "/realms/estate", label: "Estate" },
    { href: "/realms/academy", label: "Academy" },
    { href: "/realms/syndicate", label: "Syndicate" },
    ...(showManageAccounts
      ? [{ href: "/admin/users", label: "Accounts" }]
      : []),
  ];

  return (
    <header className={styles.header}>
      <span className={styles.wordmark}>Blackhole Corporation</span>
      <nav className={styles.nav}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              active === link.label
                ? `${styles.link} ${styles.active}`
                : styles.link
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
