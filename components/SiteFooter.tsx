export function SiteFooter() {
  return (
    <>
      <div style={{ background: "var(--navy)", color: "#fff" }}>
        <div
          style={{
            width: "min(1160px,100%)",
            margin: "0 auto",
            padding: "28px clamp(16px,4vw,40px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 800, fontSize: "var(--text-xl)" }}>NEOTRAVEL</span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: "var(--text-xs)",
              color: "#9fb0cc",
            }}
          >
            TRANSPORT DE GROUPE · FRANCE · TVA 10 %
          </span>
        </div>
      </div>
      <div style={{ height: 6, background: "var(--accent)" }} />
    </>
  );
}
