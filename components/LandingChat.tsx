"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { DetectedInfo, type FieldStatus } from "@/components/DetectedInfo";

/**
 * Conversation centrale de la landing (wireframe 1) + panneau « infos détectées »
 * (wireframe 2). Le panneau se met à jour à partir des champs_manquants renvoyés
 * par l'agent n8n : tout ce qui n'est pas listé comme manquant est considéré collecté.
 */
const FIELDS: { label: string; tokens: string[] }[] = [
  { label: "Société / contact", tokens: ["societe", "société", "nom", "contact", "entreprise"] },
  { label: "Email", tokens: ["email", "mail", "e-mail"] },
  { label: "Téléphone", tokens: ["telephone", "téléphone", "tel", "phone"] },
  { label: "Ville de départ", tokens: ["depart", "départ", "ville_depart", "ville de départ"] },
  { label: "Ville d'arrivée", tokens: ["arrivee", "arrivée", "destination", "ville_arrivee"] },
  { label: "Date de départ", tokens: ["date"] },
  { label: "Passagers", tokens: ["passager", "nb_passagers", "nombre", "effectif"] },
  { label: "Aller / retour", tokens: ["aller", "retour", "trajet"] },
];

function statusesFrom(data: Record<string, unknown> | null): FieldStatus[] {
  if (!data) return FIELDS.map(() => "pending");
  // Devis chiffré → tout est collecté
  if (data.success === true && typeof data.prix_ttc === "number") return FIELDS.map(() => "ok");
  // Incomplet → on lit les champs manquants
  if (Array.isArray(data.champs_manquants)) {
    const manquants = (data.champs_manquants as string[]).map((c) => String(c).toLowerCase());
    return FIELDS.map((f) =>
      f.tokens.some((t) => manquants.some((m) => m.includes(t))) ? "missing" : "ok",
    );
  }
  return FIELDS.map(() => "pending");
}

export function LandingChat() {
  const [statuses, setStatuses] = useState<FieldStatus[]>(FIELDS.map(() => "pending"));
  const [touched, setTouched] = useState(false);

  function onReply(data: unknown) {
    const next = statusesFrom((data ?? {}) as Record<string, unknown>);
    setStatuses(next);
    setTouched(true);
  }

  const fields = FIELDS.map((f, i) => ({ label: f.label, status: statuses[i] }));

  return (
    <div className="nt-landing-chat">
      <div style={{ height: "min(58vh, 480px)", minHeight: 400 }}>
        <ChatPanel onReply={onReply} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <DetectedInfo fields={fields} />
        <p style={{ fontSize: "var(--text-xs)", lineHeight: 1.5, color: "var(--muted)", margin: "2px 4px 0" }}>
          {touched
            ? "Ces informations sont extraites de votre message. Le devis n'est calculé qu'une fois le dossier complet."
            : "Décrivez votre besoin : l'assistant coche les informations au fil de la conversation."}
        </p>
      </div>
    </div>
  );
}
