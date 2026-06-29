"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { OpenAssistantButton } from "@/components/OpenAssistantButton";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/devis", label: "Simulateur" },
  { href: "/chat", label: "À propos" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("neotravel.theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <header
      className="nt-noprint"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--bg)",
        borderBottom: "2px solid var(--bd)",
      }}
    >
      <div
        className="nt-header-inner"
        style={{
          width: "min(1160px,100%)",
          margin: "0 auto",
          padding: "14px clamp(16px,4vw,40px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--ink)" }}>
          <div
            className="nt-r-sm"
            style={{
              width: 32,
              height: 32,
              background: "var(--accent)",
              color: "var(--navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "var(--text-lg)",
              border: "2px solid var(--bd)",
            }}
          >
            N
          </div>
          <span style={{ fontWeight: 800, fontSize: "var(--text-xl)", letterSpacing: "-.01em" }}>NEOTRAVEL</span>
        </Link>

        <nav
          className="nt-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(14px,2.4vw,26px)",
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".02em",
          }}
        >
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  paddingBottom: 4,
                  borderBottom: active ? "3px solid var(--accent)" : "3px solid transparent",
                  color: "var(--ink)",
                  textDecoration: "none",
                  opacity: active ? 1 : 0.7,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={toggleTheme}
            title="Basculer clair / sombre"
            className="nt-r-sm nt-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
              border: "2px solid var(--bd)",
              background: "transparent",
              color: "var(--ink)",
              padding: "7px 11px",
              fontSize: "var(--text-2xs)",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {dark ? "☀ Clair" : "☾ Sombre"}
          </button>
          <OpenAssistantButton className="nt-button nt-button--primary nt-button--sm nt-cta-full">
            Devis en 1 phrase →
          </OpenAssistantButton>
        </div>
      </div>
    </header>
  );
}
