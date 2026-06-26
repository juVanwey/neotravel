"use client";

import { openAssistant } from "@/lib/assistant-bus";

/** Bouton générique qui ouvre l'assistant en popover (avec message pré-rempli optionnel). */
export function OpenAssistantButton({
  message,
  children,
  style,
  className,
  ariaLabel,
}: {
  message?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openAssistant(message)}
      aria-label={ariaLabel}
      className={className}
      style={{ cursor: "pointer", font: "inherit", ...style }}
    >
      {children}
    </button>
  );
}
