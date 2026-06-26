"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatPanel, type ChatPanelHandle } from "@/components/ChatPanel";
import { OPEN_ASSISTANT_EVENT } from "@/lib/assistant-bus";

/**
 * Assistant global : une bulle en bas à droite qui ouvre le chat en POPOVER sur la
 * page courante (jamais de navigation). Ouvrable aussi via openAssistant() depuis
 * le hero, le CTA, etc. Le panneau reste monté pour préserver la conversation.
 */
export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const panel = useRef<ChatPanelHandle>(null);
  // Sur la landing, la conversation est déjà centrale : pas de bulle (le popover
  // reste accessible via le CTA). Sur les autres pages, la bulle est présente.
  const hideBubble = usePathname() === "/";

  useEffect(() => {
    function onOpen(e: Event) {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message;
      setOpen(true);
      if (message) {
        // léger délai : laisse le popover s'ouvrir avant l'envoi
        setTimeout(() => panel.current?.send(message), 120);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="nt-noprint">
      {/* Bulle (cachée quand le popover est ouvert ou sur la landing) */}
      {!open && !hideBubble && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir l'assistant"
          className="nt-bubble nt-btn"
          style={{
            position: "fixed",
            right: "clamp(16px,4vw,28px)",
            bottom: "clamp(16px,4vw,28px)",
            zIndex: 45,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span className="nt-r-md" style={{ background: "var(--bg)", color: "var(--ink)", border: "2px solid var(--bd)", padding: "9px 13px", fontSize: "var(--text-sm)", fontWeight: 700, boxShadow: "0 6px 18px rgba(0,0,0,.12)", whiteSpace: "nowrap" }}>
            Un devis en une phrase ?
          </span>
          <span className="nt-r-sm" style={{ position: "relative", width: 56, height: 56, background: "var(--accent)", color: "var(--navy)", border: "2px solid var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-2xl)", boxShadow: "0 8px 22px rgba(0,0,0,.22)" }}>
            N
            <span className="nt-pulse" style={{ position: "absolute", top: -3, right: -3, width: 13, height: 13, borderRadius: "50%", background: "#5dd08a", border: "2px solid var(--bg)" }} />
          </span>
        </button>
      )}

      {/* Popover (toujours monté, animé) */}
      <div
        className={`nt-pop ${open ? "nt-pop--open" : ""}`}
        style={{
          position: "fixed",
          right: "clamp(12px,4vw,28px)",
          bottom: "clamp(12px,4vw,28px)",
          zIndex: 46,
          width: "clamp(320px, 92vw, 400px)",
          height: "min(72vh, 580px)",
          maxHeight: "calc(100vh - 24px)",
        }}
      >
        <ChatPanel ref={panel} onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
