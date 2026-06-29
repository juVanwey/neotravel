import Link from "next/link";
import { LandingChat } from "@/components/LandingChat";
const wrap: React.CSSProperties = { width: "min(1160px,100%)", margin: "0 auto" };

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section
        className="nt-rise"
        style={{
          ...wrap,
          padding: "clamp(40px,6vw,72px) clamp(16px,4vw,40px) clamp(40px,5vw,60px)",
          position: "relative",
        }}
      >
        <div
          className="nt-r-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--accent)",
            color: "var(--navy)",
            padding: "8px 13px",
            fontSize: "var(--text-xs)",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: ".03em",
            marginBottom: 24,
          }}
        >
          ▲ Prix 100% déterministe
        </div>

        <h1
          style={{
            fontWeight: 800,
            fontSize: "clamp(34px,6.2vw,66px)",
            lineHeight: 0.98,
            letterSpacing: "-.02em",
            textTransform: "uppercase",
            margin: "0 0 22px",
            maxWidth: 880,
          }}
        >
          Le prix de votre car,{" "}
          <span
            style={{
              background: "var(--accent)",
              color: "var(--navy)",
              padding: "0 8px",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            calculé devant vous.
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(15px,2vw,18px)",
            lineHeight: 1.5,
            maxWidth: 680,
            margin: "0 0 28px",
            color: "var(--muted)",
            fontWeight: 500,
          }}
        >
          Décrivez votre besoin en une phrase : l&apos;assistant qualifie la demande et coche les
          informations au fil de l&apos;échange. Aucune IA ne fixe le prix, il reste 100 %
          déterministe.
        </p>

        <LandingChat />

        <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", marginTop: 16 }}>
          Vous préférez les détails ?{" "}
          <Link
            href="/devis"
            style={{ color: "var(--ink)", fontWeight: 700, textDecoration: "underline", textDecorationColor: "var(--accent)", textUnderlineOffset: 3 }}
          >
            Ouvrir le simulateur →
          </Link>
        </p>
      </section>

    </div>
  );
}
