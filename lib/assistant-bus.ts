/**
 * Petit bus d'événement pour ouvrir l'assistant (popover) depuis n'importe quel
 * composant, sans contexte ni prop drilling. Le widget écoute "neo:open-assistant".
 */
export const OPEN_ASSISTANT_EVENT = "neo:open-assistant";

export function openAssistant(message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT, { detail: { message } }));
}
