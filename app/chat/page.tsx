import type { Metadata } from "next";
import Link from "next/link";
import { OpenAssistantButton } from "@/components/OpenAssistantButton";

export const metadata: Metadata = {
  title: "À propos · NeoTravel",
  description:
    "NeoTravel : transport de groupe en autocar avec une tarification 100 % déterministe, transparente et auditable. Notre démarche et l'équipe.",
};

const mono = "var(--font-jetbrains), monospace";
const wrap: React.CSSProperties = { width: "min(1160px,100%)", margin: "0 auto" };

const PRINCIPES = [
  ["Déterministe", "Une seule formule. Mêmes informations en entrée, même prix en sortie, pour tout le monde."],
  ["Sans IA dans le prix", "L'assistant qualifie et reformule, mais ne fixe jamais un tarif. Le calcul reste une fonction auditée."],
  ["Transparent", "Chaque devis s'explique ligne par ligne : base, marge, saison, urgence, capacité, options."],
];

const ETAPES = [
  ["01", "Vous décrivez", "En une phrase à l'assistant, ou via le simulateur : trajet, dates, passagers, options."],
  ["02", "On qualifie", "Les informations sont structurées et vérifiées ; s'il en manque, on vous le dit."],
  ["03", "On chiffre", "Le moteur déterministe calcule le prix HT, la TVA et le TTC, identiques quel que soit le canal."],
  ["04", "On suit", "Devis envoyé, dossier enregistré, relances automatiques. Les cas hors standard passent à un conseiller."],
];

const EQUIPE = ["Chaimaa", "Ivan", "Julie", "Leaticia", "Suzanne"];

export default function AProposPage() {
  return (
    <div>
      {/* INTRO */}
      <section style={{ ...wrap, padding: "clamp(40px,6vw,64px) clamp(16px,4vw,40px) clamp(24px,3vw,32px)" }} className="nt-rise">
        <span className="nt-r-sm" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "var(--navy)", padding: "8px 13px", fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em", marginBottom: 22 }}>
          À propos
        </span>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(30px,5.4vw,56px)", lineHeight: 1, letterSpacing: "-.02em", textTransform: "uppercase", margin: "0 0 20px", maxWidth: 820 }}>
          Le transport de groupe, au prix juste.
        </h1>
        <p style={{ fontSize: "clamp(15px,2vw,18px)", lineHeight: 1.55, maxWidth: 640, margin: 0, color: "var(--muted)", fontWeight: 500 }}>
          NeoTravel affrète des autocars pour des groupes de 1 à 85 personnes. Notre parti pris :
          un prix qu&apos;on peut <strong style={{ color: "var(--ink)" }}>expliquer et reproduire</strong>,
          pas un chiffre négocié à la tête du client.
        </p>
      </section>

      {/* PRINCIPES */}
      <section style={{ ...wrap, padding: "clamp(16px,3vw,28px) clamp(16px,4vw,40px) clamp(36px,5vw,52px)" }}>
        <div className="nt-r-md nt-clip" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", border: "2px solid var(--bd)" }}>
          {PRINCIPES.map(([t, d], i) => (
            <div key={t} className="nt-card" style={{ padding: 24, borderRight: i < 2 ? "2px solid var(--line)" : undefined }}>
              <div style={{ fontFamily: mono, fontSize: "var(--text-xs)", fontWeight: 700, paddingBottom: 8, marginBottom: 12, borderBottom: "2px solid var(--accent)", textTransform: "uppercase" }}>{t}</div>
              <p style={{ fontSize: "var(--text-base)", lineHeight: 1.55, color: "var(--muted)", margin: 0, fontWeight: 500 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT */}
      <div style={{ background: "var(--navy)", color: "#fff" }}>
        <section style={{ ...wrap, padding: "clamp(40px,5vw,56px) clamp(16px,4vw,40px)" }}>
          <div style={{ fontWeight: 800, fontSize: "clamp(24px,3.4vw,34px)", textTransform: "uppercase", letterSpacing: "-.02em", marginBottom: 26 }}>
            Comment ça marche
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24 }}>
            {ETAPES.map(([n, t, d]) => (
              <div key={n}>
                <div style={{ fontWeight: 900, fontSize: "var(--text-4xl)", color: "var(--accent)", lineHeight: 0.85, marginBottom: 12 }}>{n}</div>
                <div style={{ fontWeight: 800, fontSize: "var(--text-lg)", textTransform: "uppercase", marginBottom: 8 }}>{t}</div>
                <p style={{ fontSize: "var(--text-base)", lineHeight: 1.55, color: "#9fb0cc", margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ÉQUIPE */}
      <section style={{ ...wrap, padding: "clamp(40px,5vw,56px) clamp(16px,4vw,40px)" }}>
        <div style={{ fontWeight: 800, fontSize: "clamp(24px,3.4vw,34px)", textTransform: "uppercase", letterSpacing: "-.02em", marginBottom: 8 }}>
          L&apos;équipe
        </div>
        <p style={{ fontSize: "var(--text-base)", color: "var(--muted)", margin: "0 0 22px", fontWeight: 500 }}>
          Prototype réalisé en équipe dans le cadre du MSc 1 Epitech.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {EQUIPE.map((nom) => (
            <div key={nom} className="nt-card nt-r-md" style={{ display: "flex", alignItems: "center", gap: 12, border: "2px solid var(--bd)", padding: "12px 16px" }}>
              <span className="nt-r-sm" style={{ width: 34, height: 34, background: "var(--accent)", color: "var(--navy)", border: "2px solid var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-md)" }}>
                {nom[0]}
              </span>
              <span style={{ fontWeight: 700, fontSize: "var(--text-md)" }}>{nom}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...wrap, padding: "clamp(20px,3vw,28px) clamp(16px,4vw,40px) clamp(48px,6vw,72px)" }}>
        <div className="nt-r-md" style={{ border: "2px solid var(--bd)", background: "var(--surface)", padding: "clamp(24px,4vw,40px)", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "clamp(20px,3vw,28px)", textTransform: "uppercase", letterSpacing: "-.01em" }}>Un trajet en tête ?</div>
            <p style={{ fontSize: "var(--text-md)", color: "var(--muted)", margin: "6px 0 0", fontWeight: 500 }}>Obtenez un prix tout de suite, en une phrase ou via le simulateur.</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <OpenAssistantButton className="nt-button nt-button--primary nt-button--lg">
              Devis en 1 phrase →
            </OpenAssistantButton>
            <Link href="/devis" className="nt-button nt-button--secondary nt-button--lg">
              Ouvrir le simulateur →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
