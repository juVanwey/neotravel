import Link from "next/link";
import { LandingChat } from "@/components/LandingChat";
import { OpenAssistantButton } from "@/components/OpenAssistantButton";

const mono = "var(--font-jetbrains), monospace";
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

      {/* BOARD STRIP */}
      <div style={{ background: "var(--navy)", color: "#fff" }}>
        <div style={{ ...wrap, padding: "0 clamp(16px,4vw,40px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            {[
              ["1 → 85", "Passagers par demande"],
              ["~10 s", "Pour un devis détaillé"],
              ["TVA 10 %", "Transport de voyageurs"],
            ].map(([big, small], i) => (
              <div
                key={big}
                style={{
                  padding: "30px clamp(14px,2.5vw,32px)",
                  paddingLeft: i === 0 ? 0 : undefined,
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,.14)" : undefined,
                }}
              >
                <div style={{ fontWeight: 900, fontSize: "var(--text-3xl)", color: "var(--accent)" }}>{big}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "#9fb0cc", marginTop: 6, textTransform: "uppercase", letterSpacing: ".03em", fontWeight: 600 }}>{small}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* D'OÙ VIENT CHAQUE EURO */}
      <section style={{ ...wrap, padding: "clamp(40px,5vw,56px) clamp(16px,4vw,40px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 36, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "clamp(28px,4vw,42px)", lineHeight: 1, textTransform: "uppercase", letterSpacing: "-.02em", marginBottom: 16 }}>
            D&apos;où vient chaque euro.
          </div>
          <p style={{ fontSize: "var(--text-md)", lineHeight: 1.55, color: "var(--muted)", fontWeight: 500, margin: "0 0 22px" }}>
            On ne sort pas un chiffre magique. On affiche le calcul, ligne par ligne : base, marge,
            saison, urgence, capacité, options. Puis TVA et TTC.
          </p>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <span className="nt-r-sm" style={{ background: "var(--navy)", color: "#fff", padding: "6px 12px", fontFamily: mono, fontSize: "var(--text-2xs)", fontWeight: 700 }}>CASCADE</span>
            <span className="nt-r-sm" style={{ background: "var(--accent)", color: "var(--navy)", padding: "6px 12px", fontFamily: mono, fontSize: "var(--text-2xs)", fontWeight: 700 }}>RÉF. VÉRIFIABLE</span>
            <span className="nt-r-sm" style={{ border: "2px solid var(--bd)", padding: "5px 11px", fontFamily: mono, fontSize: "var(--text-2xs)", fontWeight: 700 }}>AUDITABLE</span>
          </div>
        </div>

        <div className="nt-card nt-r-md nt-clip" style={{ border: "2px solid var(--bd)" }}>
          <div style={{ background: "var(--navy)", color: "#fff", padding: "11px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 800, fontSize: "var(--text-base)", textTransform: "uppercase", letterSpacing: ".03em" }}>Devis · exemple</span>
            <span style={{ fontFamily: mono, fontSize: "var(--text-2xs)", color: "var(--accent)" }}>#NT-4471</span>
          </div>
          <div style={{ padding: 18, fontFamily: mono, fontSize: "var(--text-sm)", fontWeight: 500, background: "var(--bg)" }}>
            {[
              ["Base · 100 km", "580,00 €", false],
              ["Aller-retour ×2", "+ 580,00 €", true],
              ["Marge +15 %", "+ 174,00 €", true],
              ["Capacité 49 pers.", "0,00 €", false],
            ].map(([l, v, bold]) => (
              <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span>{l}</span>
                <span style={{ fontWeight: bold ? 700 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--navy)", color: "#fff", padding: "15px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={{ fontWeight: 700, fontSize: "var(--text-base)", textTransform: "uppercase", letterSpacing: ".03em" }}>Total TTC</span>
            <span className="nt-num" style={{ fontWeight: 900, fontSize: "var(--text-3xl)", color: "var(--accent)", lineHeight: 0.85 }}>1 466,30 €</span>
          </div>
        </div>
      </section>

      {/* TWO TOOLS */}
      <section style={{ ...wrap, padding: "0 clamp(16px,4vw,40px) clamp(40px,5vw,56px)" }}>
        <div style={{ fontWeight: 800, fontSize: "clamp(24px,3.4vw,34px)", textTransform: "uppercase", letterSpacing: "-.02em", marginBottom: 22 }}>
          Deux outils, un seul moteur
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          <Link href="/devis" className="nt-card nt-r-md" style={cardBox}>
            <ToolInner glyph="=" title="Le simulateur" cta="Ouvrir le simulateur →">
              Trajet, groupe, options. Le devis se recompose en direct, ligne par ligne, vous voyez
              d&apos;où vient chaque euro.
            </ToolInner>
          </Link>
          <OpenAssistantButton className="nt-card nt-r-md" style={{ ...cardBox, textAlign: "left", width: "100%" }}>
            <ToolInner glyph="~" title="Devis en 1 phrase" cta="Décrire mon besoin →">
              Décrivez en une phrase. Il qualifie, complète, puis interroge le{" "}
              <strong>même moteur déterministe</strong>, jamais d&apos;invention.
            </ToolInner>
          </OpenAssistantButton>
        </div>
      </section>

      {/* WHY FAIR */}
      <div style={{ background: "var(--navy)", color: "#fff" }}>
        <section style={{ ...wrap, padding: "clamp(40px,5vw,56px) clamp(16px,4vw,40px)" }}>
          <div style={{ fontWeight: 800, fontSize: "clamp(24px,3.4vw,34px)", textTransform: "uppercase", letterSpacing: "-.02em", marginBottom: 26 }}>
            Pourquoi ce prix est juste
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 22 }}>
            {[
              ["01", "Déterministe", "Mêmes entrées, même prix. Aucune variable cachée, aucune négo à la tête du client."],
              ["02", "Transparent", "Chaque euro est expliqué : base, marge, coefficients, options, avant TVA et TTC."],
              ["03", "Auditable", "Référence sur chaque devis. Relancez le calcul un mois après : même résultat au centime."],
            ].map(([n, t, p]) => (
              <div key={n}>
                <div style={{ fontWeight: 900, fontSize: "var(--text-4xl)", color: "var(--accent)", lineHeight: 0.85, marginBottom: 12 }}>{n}</div>
                <div style={{ fontWeight: 800, fontSize: "var(--text-lg)", textTransform: "uppercase", marginBottom: 9 }}>{t}</div>
                <p style={{ fontSize: "var(--text-base)", lineHeight: 1.55, color: "#9fb0cc", margin: 0 }}>{p}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* COEFFICIENTS */}
      <section style={{ ...wrap, padding: "clamp(40px,5vw,56px) clamp(16px,4vw,40px)" }}>
        <div style={{ fontWeight: 800, fontSize: "clamp(24px,3.4vw,34px)", textTransform: "uppercase", letterSpacing: "-.02em", marginBottom: 22 }}>
          Les coefficients, en clair
        </div>
        <div className="nt-r-md nt-clip" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", border: "2px solid var(--bd)" }}>
          <CoeffCell title="SAISONNALITÉ">
            Mai–juin : <Strong>+15 %</Strong>
            <br />Mars/avr./juil. : +10 %
            <br />Jan/fév/août/nov : −7 %
          </CoeffCell>
          <CoeffCell title="URGENCE · DÉLAI">
            &lt; 48 h : <Strong>+10 %</Strong>
            <br />&lt; 7 j : +5 % · &lt; 3 mois : −5 %
            <br />&gt; 3 mois : −10 %
          </CoeffCell>
          <CoeffCell title="CAPACITÉ · PLACES">
            1–19 : −5 % · 20–53 : 0 %
            <br />54–63 : +15 % · 64–67 : +20 %
            <br />68–85 : <Strong>+40 %</Strong>
          </CoeffCell>
        </div>
      </section>
    </div>
  );
}

const cardBox: React.CSSProperties = {
  border: "2px solid var(--bd)",
  padding: 28,
  background: "var(--surface)",
  textDecoration: "none",
  color: "var(--ink)",
  display: "block",
};

function ToolInner({ glyph, title, cta, children }: { glyph: string; title: string; cta: string; children: React.ReactNode }) {
  return (
    <>
      <div className="nt-r-sm" style={{ display: "inline-flex", width: 44, height: 44, background: "var(--accent)", border: "2px solid var(--navy)", color: "var(--navy)", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-2xl)", marginBottom: 16 }}>
        {glyph}
      </div>
      <div style={{ fontWeight: 800, fontSize: "var(--text-xl)", textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
      <p style={{ fontSize: "var(--text-md)", lineHeight: 1.55, color: "var(--muted)", fontWeight: 500, margin: "0 0 16px" }}>{children}</p>
      <span style={{ fontWeight: 800, textTransform: "uppercase", fontSize: "var(--text-sm)", letterSpacing: ".02em" }}>{cta}</span>
    </>
  );
}

function CoeffCell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 22, borderBottom: "2px solid var(--line)" }}>
      <div style={{ fontFamily: mono, fontSize: "var(--text-xs)", fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid var(--accent)" }}>{title}</div>
      <div style={{ fontFamily: mono, fontSize: "var(--text-sm)", lineHeight: 1.9, color: "var(--muted)" }}>{children}</div>
    </div>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "var(--ink)" }}>{children}</strong>;
}
