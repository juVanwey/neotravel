"use client";

import Link from "next/link";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const mono = "var(--font-jetbrains), monospace";

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

type Msg =
  | { id: number; kind: "user"; text: string }
  | { id: number; kind: "botText"; text: string }
  | { id: number; kind: "quote"; ht: string; tva: string; ttc: string; ref: string }
  | { id: number; kind: "missing"; items: { label: string; sub: string }[] }
  | { id: number; kind: "complex"; text: string; ref: string };

const SUGGESTIONS = [
  "49 personnes, Lyon → Annecy aller-retour, 100 km, le 18 septembre",
  "On voudrait un car pour un séminaire en mai",
  "120 personnes, tour d'Italie sur 6 jours, 2 cars, départ Marseille",
];

const prettyField = (f: string) => f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const GREETING_TEXT =
  "Bonjour ! Décrivez votre besoin (groupe, trajet, dates) et je vous chiffre un devis, ou je vous dis ce qu'il me manque.";

let counter = 100;
const nid = () => ++counter;
const newSession = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(nid());

export interface ChatPanelHandle {
  send: (message: string) => void;
}

/**
 * Panneau de conversation autonome (logique + UI). Remplit 100 % de son conteneur.
 * Réutilisé par la page et par le popover ; expose send() via ref pour les messages
 * pré-remplis (champ du hero, CTA…).
 */
export const ChatPanel = forwardRef<ChatPanelHandle, { onClose?: () => void; onReply?: (data: unknown) => void }>(
  function ChatPanel({ onClose, onReply }, ref) {
  const [messages, setMessages] = useState<Msg[]>([{ id: 1, kind: "botText", text: GREETING_TEXT }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const session = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(m: string) => void>(() => {});

  useEffect(() => {
    session.current = newSession();
  }, []);

  function reset() {
    session.current = newSession();
    setInput("");
    setTyping(false);
    setMessages([{ id: nid(), kind: "botText", text: GREETING_TEXT }]);
  }

  // Expose send() au widget (messages pré-remplis), toujours avec le dernier état.
  sendRef.current = send;
  useImperativeHandle(ref, () => ({ send: (m: string) => sendRef.current(m) }), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || typing) return;

    const history = messages
      .filter((m): m is Extract<Msg, { kind: "user" | "botText" }> => m.kind === "user" || m.kind === "botText")
      .map((m) => ({ role: m.kind === "user" ? "user" : "assistant", content: m.text }));

    setMessages((m) => [...m, { id: nid(), kind: "user", text }]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: session.current, history }),
      });
      const data = await res.json();
      onReply?.(data);
      setMessages((m) => [...m, ...mapReply(data)]);
    } catch {
      setMessages((m) => [...m, { id: nid(), kind: "botText", text: "Une erreur réseau est survenue. Réessayez." }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "var(--bg)", border: "1.5px solid var(--line)", borderRadius: 22, overflow: "hidden" }}>
      {/* header */}
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 11, background: "var(--navy)", color: "#fff" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--accent)", color: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-lg)" }}>N</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "var(--text-md)" }}>Assistant NeoTravel</div>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "#a9b6cc", display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
            <span className="nt-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#5dd08a" }} />En ligne · répond au moteur
          </div>
        </div>
        <button onClick={reset} aria-label="Réinitialiser la conversation" title="Nouvelle conversation" className="nt-btn" style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: "var(--text-xl)", cursor: "pointer", lineHeight: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ↻
        </button>
        {onClose && (
          <button onClick={onClose} aria-label="Fermer l'assistant" className="nt-btn" style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: "var(--text-md)", cursor: "pointer", lineHeight: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        )}
      </div>

      {/* messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12, background: "var(--surface)" }}>
        {messages.map((m) => (
          <div key={m.id} className="nt-msg" style={{ display: "flex", flexDirection: "column" }}>
            <Bubble m={m} />
          </div>
        ))}
        {messages.length <= 1 && !typing && (
          <div style={{ margin: "auto", textAlign: "center", maxWidth: 280, padding: "8px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--ink)" }} />
              <span style={{ width: 90, height: 2, margin: "0 8px", background: "repeating-linear-gradient(90deg,var(--muted),var(--muted) 6px,transparent 6px,transparent 11px)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--bd)" }} />
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
              Décrivez votre trajet en une phrase, ou choisissez un exemple ci-dessous.
            </p>
          </div>
        )}
        {typing && (
          <div className="nt-msg" style={{ alignSelf: "flex-start", background: "var(--bg)", border: "1px solid var(--line)", padding: "13px 16px", display: "flex", gap: 5, alignItems: "center", borderRadius: "18px 18px 18px 5px" }}>
            {[0, 0.15, 0.3].map((d) => (
              <span key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--muted)", animation: `nt-bounce 1s infinite ${d}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* suggestions + input */}
      <div style={{ borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
        <div style={{ display: "flex", gap: 8, padding: "12px 14px 0", flexWrap: "wrap" }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="nt-btn" style={{ border: "1px solid var(--line)", borderRadius: 99, padding: "7px 13px", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", background: "var(--surface)", color: "var(--muted)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.length > 42 ? s.slice(0, 40) + "…" : s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Décrivez votre besoin…"
            aria-label="Votre message"
            style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 99, padding: "12px 16px", fontSize: "var(--text-base)", color: "var(--ink)" }}
          />
          <button onClick={() => send(input)} aria-label="Envoyer" className="nt-btn" style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-lg)", cursor: "pointer", border: "none", flexShrink: 0 }}>↑</button>
        </div>
      </div>
    </div>
  );
});

function mapReply(data: unknown): Msg[] {
  const d = (data ?? {}) as Record<string, unknown>;
  const msg = typeof d.message === "string" ? d.message : "";

  if (d.success === true && typeof d.prix_ttc === "number") {
    const ht = Number(d.prix_ht);
    const ttc = Number(d.prix_ttc);
    const tva = Math.max(0, ttc - ht);
    return [
      { id: nid(), kind: "botText", text: msg || "Voici votre devis :" },
      { id: nid(), kind: "quote", ht: eur(ht), tva: eur(tva), ttc: eur(ttc), ref: `#NT-${Math.floor(1000 + Math.random() * 9000)}` },
    ];
  }

  if (d.statut === "cas_complexe" || d.statut === "cas_incomplet_escalade") {
    return [
      { id: nid(), kind: "complex", text: msg || "Votre demande est transmise à un conseiller NeoTravel.", ref: `#NT-CX-${Math.floor(1000 + Math.random() * 9000)}` },
    ];
  }

  if (d.success === false) {
    const champs = Array.isArray(d.champs_manquants) ? (d.champs_manquants as string[]) : [];
    const out: Msg[] = [{ id: nid(), kind: "botText", text: msg || "Il me manque quelques informations." }];
    if (champs.length) {
      out.push({ id: nid(), kind: "missing", items: champs.map((c) => ({ label: prettyField(c), sub: "à préciser" })) });
    }
    return out;
  }

  return [{ id: nid(), kind: "botText", text: msg || "Désolé, je n'ai pas pu traiter la demande." }];
}

function Bubble({ m }: { m: Msg }) {
  if (m.kind === "user") {
    return (
      <div style={{ alignSelf: "flex-end", maxWidth: "82%", background: "var(--navy)", color: "#fff", padding: "11px 15px", fontSize: "var(--text-base)", lineHeight: 1.45, borderRadius: "18px 18px 5px 18px" }}>
        {m.text}
      </div>
    );
  }

  if (m.kind === "botText") {
    return (
      <div style={{ alignSelf: "flex-start", maxWidth: "88%", background: "var(--bg)", border: "1px solid var(--line)", padding: "11px 15px", fontSize: "var(--text-base)", lineHeight: 1.45, borderRadius: "18px 18px 18px 5px" }}>
        {m.text}
      </div>
    );
  }

  if (m.kind === "quote") {
    return (
      <div style={{ alignSelf: "stretch", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "13px 16px 11px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "var(--text-base)" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--ok)" }} />Devis chiffré
          </span>
          <span style={{ fontFamily: mono, fontSize: "var(--text-2xs)", color: "var(--muted)" }}>{m.ref}</span>
        </div>
        <div style={{ padding: "14px 16px 16px" }}>
          <Row label="Sous-total HT" value={m.ht} />
          <Row label="TVA 10 %" value={m.tva} pb={11} />
          <div style={{ background: "var(--navy)", color: "#fff", borderRadius: 12, padding: "13px 15px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", textTransform: "uppercase", letterSpacing: ".02em" }}>Total TTC</span>
            <span className="nt-num" style={{ fontWeight: 900, fontSize: "var(--text-2xl)", color: "var(--accent)", lineHeight: 0.82 }}>{m.ttc}</span>
          </div>
          <Link href="/devis" className="nt-btn" style={{ display: "block", marginTop: 11, background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)", textAlign: "center", padding: 11, borderRadius: 99, fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none" }}>
            Ouvrir dans le simulateur →
          </Link>
          <div style={{ fontFamily: mono, fontSize: "var(--text-2xs)", fontWeight: 500, color: "var(--muted)", marginTop: 10, textAlign: "center" }}>
            calculé par le moteur, identique au simulateur
          </div>
        </div>
      </div>
    );
  }

  if (m.kind === "missing") {
    return (
      <div style={{ alignSelf: "stretch", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "13px 16px 11px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--line)", fontWeight: 700, fontSize: "var(--text-base)" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--warn)" }} />Informations à compléter
        </div>
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {m.items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, border: "1.5px solid var(--muted)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>{it.label}</div>
                <div style={{ fontSize: "var(--text-2xs)", fontFamily: mono, color: "var(--muted)" }}>{it.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ alignSelf: "stretch", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
      <div style={{ padding: "13px 16px 11px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--line)", fontWeight: 700, fontSize: "var(--text-base)" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--danger)" }} />Transmis à un conseiller
      </div>
      <div style={{ padding: "14px 16px" }}>
        <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, fontWeight: 500, margin: "0 0 12px", color: "var(--muted)" }}>{m.text}</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: "var(--text-xs)", fontWeight: 600, padding: "6px 0", borderTop: "1px solid var(--line)", color: "var(--muted)" }}>
          <span>Réponse sous</span><span style={{ color: "var(--ink)", fontWeight: 700 }}>24 h ouvrées</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: "var(--text-xs)", fontWeight: 600, padding: "6px 0", color: "var(--muted)" }}>
          <span>Dossier</span><span style={{ color: "var(--ink)", fontWeight: 700 }}>{m.ref}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, pb = 3 }: { label: string; value: string; pb?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: "var(--text-xs)", fontWeight: 600, padding: `3px 0 ${pb}px`, color: "var(--muted)" }}>
      <span>{label}</span>
      <span style={{ color: "var(--ink)" }}>{value}</span>
    </div>
  );
}
