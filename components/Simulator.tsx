"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SIM, TODAY, urgencyMeta, capacityLabel, type SimInput } from "@/lib/pricing";

const mono = "var(--font-jetbrains), monospace";
const STORAGE = "neotravel.sim";

const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fmtSigned = (n: number) =>
  (n >= 0 ? "+ " : "− ") +
  Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
  " €";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "2px solid var(--bd)",
  fontSize: "var(--text-base)",
  background: "var(--field)",
  color: "var(--ink)",
};

interface Row {
  key: string;
  label: string;
  sub: string;
  delta: string;
  running: string;
  isBase: boolean;
}
interface Result {
  core: Row[];
  options: Row[];
  transport: string;
  ht: string;
  tva: string;
  ttc: string;
}

/** Reconstruit le ledger (libellés + totaux courants) depuis la réponse de /api/devis. */
function processDevis(data: {
  lignes: { libelle: string; montant: number }[];
  prix_ht: number;
  tva: number;
  prix_ttc: number;
}): Result {
  const core: Row[] = [];
  const options: Row[] = [];
  let running = 0;
  let started = false;
  let transport: number | null = null;

  const splitLib = (lib: string): [string, string] => {
    const dash = lib.indexOf(" — ");
    if (dash >= 0) return [lib.slice(0, dash), lib.slice(dash + 3)];
    const par = lib.indexOf(" (");
    if (par >= 0) return [lib.slice(0, par), lib.slice(par + 2).replace(/\)\s*$/, "")];
    return [lib, ""];
  };

  for (const l of data.lignes) {
    const lib = l.libelle;
    if (lib.includes("SOUS-TOTAL") || lib.startsWith("TVA")) continue;

    const isOpt = /^(Guide|Nuit|Péages)/.test(lib);
    if (isOpt && transport === null) transport = running;

    let delta: number;
    if (!started) {
      running = l.montant;
      delta = l.montant;
      started = true;
    } else if (/^Aller\/Retour/.test(lib)) {
      delta = l.montant - running;
      running = l.montant;
    } else if (/^Péages/.test(lib)) {
      delta = 0;
    } else {
      delta = l.montant;
      running += l.montant;
    }

    const [label, sub] = splitLib(lib);
    const row: Row = { key: lib, label, sub, delta: fmtSigned(delta), running: fmt(running), isBase: !isOpt && core.length === 0 };
    (isOpt ? options : core).push(row);
  }

  if (transport === null) transport = running;

  return {
    core,
    options,
    transport: fmt(transport),
    ht: fmt(data.prix_ht),
    tva: fmt(data.tva),
    ttc: fmt(data.prix_ttc),
  };
}

export function Simulator() {
  const [sim, setSim] = useState<SimInput>(DEFAULT_SIM);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Restaure l'état persisté après montage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setSim((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  function patch(p: Partial<SimInput>) {
    setSim((s) => {
      const next = { ...s, ...p };
      try {
        localStorage.setItem(STORAGE, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  // Recalcul via le VRAI moteur backend (/api/devis), debouncé.
  const fetchDevis = useCallback(async (s: SimInput, signal: AbortSignal) => {
    const payload = {
      nb_passagers: Math.min(85, Math.max(1, Math.trunc(s.passengers) || 1)),
      date_depart: s.date,
      date_demande: TODAY,
      distance_km: Math.max(1, Math.trunc(s.distanceKm) || 1),
      aller_retour: s.roundTrip,
      urgence: urgencyMeta(s.date).code,
      options: {
        nb_guides: Math.max(0, Math.trunc(s.guides) || 0),
        nb_jours: Math.max(0, Math.trunc(s.guideDays) || 0),
        nb_nuits_chauffeur: Math.max(0, Math.trunc(s.driverNights) || 0),
        peages_inclus: s.tollsIncluded,
      },
    };
    const res = await fetch("/api/devis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Calcul impossible.");
    return processDevis(data);
  }, []);

  useEffect(() => {
    setPending(true);
    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;
    const t = setTimeout(() => {
      fetchDevis(sim, ctrl.signal)
        .then((r) => {
          setResult(r);
          setError(null);
        })
        .catch((e) => {
          if (e?.name !== "AbortError") setError(e.message || "Erreur réseau.");
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setPending(false);
        });
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [sim, fetchDevis]);

  const urg = urgencyMeta(sim.date);
  const pax = Math.min(85, Math.max(1, Math.trunc(sim.passengers) || 1));
  const dist = Math.max(1, Math.trunc(sim.distanceKm) || 1);
  const ref = `#NT-${pax}${dist}`;

  function copyRef() {
    try {
      navigator.clipboard?.writeText(ref.replace("#", ""));
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div style={{ width: "min(1160px,100%)", margin: "0 auto", padding: "clamp(24px,4vw,40px) clamp(16px,4vw,40px) 60px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: "var(--text-xs)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>▲ Simulateur de devis</div>
          <div style={{ fontWeight: 800, fontSize: "clamp(26px,4vw,38px)", textTransform: "uppercase", letterSpacing: "-.02em", lineHeight: 1 }}>Composez votre trajet</div>
        </div>
        <span className="nt-noprint" style={{ fontFamily: mono, fontSize: "var(--text-xs)", color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: pending ? "var(--warn)" : "var(--ok)", animation: "nt-blink 1.4s infinite" }} />
          {pending ? "RECALCUL…" : "MOTEUR /api/devis · EN DIRECT"}
        </span>
      </div>

      <div className="nt-r-lg nt-clip" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", border: "2px solid var(--bd)" }}>
        {/* FORM */}
        <div className="nt-noprint" style={{ padding: "clamp(22px,3vw,32px)", borderRight: "2px solid var(--bd)", background: "var(--bg)" }}>
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <label style={{ fontWeight: 800, fontSize: "var(--text-md)", textTransform: "uppercase" }}>Passagers</label>
              <span className="nt-num" style={{ fontWeight: 900, fontSize: "var(--text-xl)" }}>{pax} pers.</span>
            </div>
            <input type="range" min={1} max={85} step={1} value={sim.passengers} onChange={(e) => patch({ passengers: Number(e.target.value) })} aria-label="Nombre de passagers" style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: "var(--text-2xs)", fontWeight: 600, marginTop: 8, color: "var(--muted)" }}>
              <span>1</span><span>{capacityLabel(pax)}</span><span>85</span>
            </div>
          </div>

          <div style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <label style={{ fontWeight: 800, fontSize: "var(--text-md)", textTransform: "uppercase" }}>Distance · aller simple</label>
              <span className="nt-num" style={{ fontWeight: 900, fontSize: "var(--text-xl)" }}>{dist} km</span>
            </div>
            <input type="range" min={10} max={700} step={10} value={sim.distanceKm} onChange={(e) => patch({ distanceKm: Number(e.target.value) })} aria-label="Distance en km" style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: "var(--text-2xs)", fontWeight: 600, marginTop: 8, color: "var(--muted)" }}>
              <span>10</span><span>grille ≤180 · puis 2,50/km</span><span>700</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 26 }}>
            <div>
              <label style={{ display: "block", fontWeight: 800, fontSize: "var(--text-sm)", textTransform: "uppercase", marginBottom: 10 }}>Date</label>
              <input type="date" value={sim.date} onChange={(e) => patch({ date: e.target.value })} aria-label="Date de départ" style={{ ...fieldStyle, padding: "11px 12px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 800, fontSize: "var(--text-sm)", textTransform: "uppercase", marginBottom: 10 }}>Trajet</label>
              <div className="nt-r-sm nt-clip" style={{ display: "flex", border: "2px solid var(--bd)", height: 44 }}>
                <button onClick={() => patch({ roundTrip: false })} style={tripBtn(!sim.roundTrip)}>Simple</button>
                <button onClick={() => patch({ roundTrip: true })} style={{ ...tripBtn(sim.roundTrip), borderLeft: "2px solid var(--bd)" }}>A/R</button>
              </div>
            </div>
          </div>

          <div className="nt-r-md" style={{ background: "var(--accent)", border: "2px solid var(--navy)", padding: "13px 15px", marginBottom: 26, display: "flex", alignItems: "center", gap: 13 }}>
            <div className="nt-r-sm" style={{ width: 38, height: 38, background: "var(--navy)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-xl)", flexShrink: 0 }}>!</div>
            <div style={{ color: "var(--navy)" }}>
              <div style={{ fontWeight: 800, fontSize: "var(--text-base)", textTransform: "uppercase" }}>Urgence · {urg.label}</div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>Déduite automatiquement : {urg.note}</div>
            </div>
          </div>

          <div style={{ fontWeight: 800, fontSize: "var(--text-md)", textTransform: "uppercase", marginBottom: 14 }}>Options</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <NumField label="Guides" value={sim.guides} min={0} max={6} onChange={(v) => patch({ guides: v })} />
            <NumField label="Jours guide" value={sim.guideDays} min={0} max={30} onChange={(v) => patch({ guideDays: v })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "end" }}>
            <NumField label="Nuits chauffeur" value={sim.driverNights} min={0} max={20} onChange={(v) => patch({ driverNights: v })} />
            <button onClick={() => patch({ tollsIncluded: !sim.tollsIncluded })} className="nt-r-sm" style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 13px", border: "2px solid var(--bd)", background: "var(--field)", height: 42 }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--ink)" }}>Péages</span>
              <span className="nt-r-sm" style={{ fontFamily: mono, fontSize: "var(--text-xs)", fontWeight: 700, padding: "4px 10px", background: sim.tollsIncluded ? "var(--ok)" : "var(--line)", color: sim.tollsIncluded ? "#fff" : "var(--muted)" }}>
                {sim.tollsIncluded ? "Inclus" : "Exclu"}
              </span>
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, fontFamily: mono, color: "var(--muted)" }}>Guide 80 €/j · nuit 120 €</span>
            <button onClick={() => patch(DEFAULT_SIM)} style={{ fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase", cursor: "pointer", borderBottom: "2px solid var(--accent)", background: "transparent", color: "var(--ink)", padding: 0 }}>↺ Réinitialiser</button>
          </div>
        </div>

        {/* LEDGER */}
        <div style={{ padding: "clamp(22px,3vw,32px)", background: "var(--surface)", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--navy)", color: "#fff", padding: "10px 15px", marginBottom: 14 }}>
            <span style={{ fontWeight: 800, fontSize: "var(--text-md)", textTransform: "uppercase" }}>Devis détaillé</span>
            <span style={{ fontFamily: mono, fontSize: "var(--text-2xs)", color: "var(--accent)" }}>{ref}</span>
          </div>

          {error && (
            <div style={{ border: "2px solid var(--danger)", background: "color-mix(in srgb, var(--danger) 8%, transparent)", color: "var(--danger)", padding: "12px 14px", fontSize: "var(--text-sm)", fontWeight: 600 }}>
              {error}
            </div>
          )}

          {!result && !error && (
            <div style={{ fontFamily: mono, fontSize: "var(--text-sm)", color: "var(--muted)", padding: "20px 0" }}>Calcul en cours…</div>
          )}

          {result && (
            <div style={{ opacity: pending ? 0.55 : 1, transition: "opacity .15s" }}>
              {result.core.map((ln) => (
                <div key={ln.key} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>{ln.label}</div>
                    {ln.sub && <div style={{ fontSize: "var(--text-2xs)", fontFamily: mono, color: "var(--muted)" }}>{ln.sub}</div>}
                  </div>
                  <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {!ln.isBase && <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, fontFamily: mono, marginBottom: 1 }}>{ln.delta}</div>}
                    <div className="nt-num" style={{ fontFamily: mono, fontSize: "var(--text-base)", fontWeight: 700 }}>{ln.running}</div>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "2px solid var(--bd)" }}>
                <span style={{ fontWeight: 800, fontSize: "var(--text-base)", textTransform: "uppercase" }}>S/total transport</span>
                <span className="nt-num" style={{ fontFamily: mono, fontSize: "var(--text-base)", fontWeight: 700 }}>{result.transport}</span>
              </div>

              {result.options.length > 0 && (
                <>
                  <div style={{ fontFamily: mono, fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: ".05em", margin: "14px 0 2px", color: "var(--muted)" }}>OPTIONS (ADDITIVES)</div>
                  {result.options.map((op) => (
                    <div key={op.key} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                      <div>
                        <div style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>{op.label}</div>
                        {op.sub && <div style={{ fontSize: "var(--text-2xs)", fontFamily: mono, color: "var(--muted)" }}>{op.sub}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, fontFamily: mono }}>{op.delta}</div>
                        <div className="nt-num" style={{ fontFamily: mono, fontSize: "var(--text-base)", fontWeight: 700 }}>{op.running}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div className="nt-r-md nt-clip" style={{ marginTop: 16, border: "2px solid var(--bd)", background: "var(--bg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 15px" }}>
                  <span style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>Sous-total HT</span>
                  <span className="nt-num" style={{ fontFamily: mono, fontSize: "var(--text-md)", fontWeight: 700 }}>{result.ht}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0 15px 10px" }}>
                  <span style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>TVA 10 %</span>
                  <span className="nt-num" style={{ fontFamily: mono, fontSize: "var(--text-md)", fontWeight: 700 }}>{result.tva}</span>
                </div>
                <div style={{ background: "var(--navy)", color: "#fff", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", textTransform: "uppercase" }}>Total TTC</span>
                  <span className="nt-num" style={{ fontWeight: 900, fontSize: "clamp(30px,5vw,38px)", color: "var(--accent)", lineHeight: 0.82 }}>{result.ttc}</span>
                </div>
              </div>
            </div>
          )}

          <div className="nt-noprint" style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button className="nt-button nt-button--primary nt-button--lg" style={{ flex: 1, minWidth: 120 }}>Valider →</button>
            <button onClick={copyRef} className="nt-button nt-button--secondary">{copied ? "✓ Copié" : "Copier réf."}</button>
            <button onClick={() => window.print()} className="nt-button nt-button--secondary">Imprimer</button>
          </div>
        </div>
      </div>

      {copied && (
        <div className="nt-r-sm" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--ok)", color: "#fff", padding: "12px 20px", fontWeight: 800, fontSize: "var(--text-sm)", textTransform: "uppercase", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}>
          ✓ Référence copiée
        </div>
      )}
    </div>
  );
}

function tripBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)",
    fontWeight: 800, textTransform: "uppercase", cursor: "pointer", border: "none",
    background: active ? "var(--navy)" : "var(--field)", color: active ? "#fff" : "var(--ink)",
  };
}

function NumField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>{label}</label>
      <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} style={fieldStyle} />
    </div>
  );
}
