"use client";

const mono = "var(--font-jetbrains), monospace";

export type FieldStatus = "ok" | "missing" | "pending";

export interface DetectedField {
  label: string;
  status: FieldStatus;
}

const MARK: Record<FieldStatus, { sign: string; color: string }> = {
  ok: { sign: "✓", color: "var(--ok)" },
  missing: { sign: "⚠", color: "var(--warn)" },
  pending: { sign: "·", color: "var(--muted)" },
};

/** Checklist live des informations collectées vs manquantes (wireframe 2 du cadrage). */
export function DetectedInfo({ fields }: { fields: DetectedField[] }) {
  return (
    <div className="nt-r-md nt-clip" style={{ border: "2px solid var(--bd)", background: "var(--bg)" }}>
      <div style={{ background: "var(--navy)", color: "#fff", padding: "10px 15px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: "var(--text-base)", textTransform: "uppercase", letterSpacing: ".03em" }}>Informations détectées</span>
        <span style={{ fontFamily: mono, fontSize: "var(--text-2xs)", color: "var(--accent)" }}>
          {fields.filter((f) => f.status === "ok").length}/{fields.length}
        </span>
      </div>
      <div style={{ padding: "6px 15px" }}>
        {fields.map((f) => {
          const m = MARK[f.status];
          return (
            <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: f.status === "pending" ? "var(--muted)" : "var(--ink)" }}>{f.label}</span>
              <span style={{ fontFamily: mono, fontSize: "var(--text-base)", fontWeight: 700, color: m.color }}>{m.sign}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
