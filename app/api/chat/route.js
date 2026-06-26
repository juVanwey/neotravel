/**
 * Relais serveur → webhook n8n (agent commercial NeoTravel).
 *
 * Le front n'appelle JAMAIS n8n directement : la route garde l'URL du webhook
 * côté serveur (N8N_WEBHOOK_URL) et renvoie tel quel l'un des 3 statuts de l'agent :
 *   - complet      → { success:true, message, prix_ht, prix_ttc, devise }   (200)
 *   - incomplet    → { success:false, message, champs_manquants:[...] }      (422)
 *   - cas_complexe → { success:true, statut:"cas_complexe", message }        (200)
 *
 * Si N8N_WEBHOOK_URL n'est pas configurée (ex: dev local), la route dégrade
 * proprement avec un message explicite plutôt que de planter.
 */

export async function POST(request) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Requête invalide." },
      { status: 400 }
    );
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json(
      { success: false, message: "Le message ne peut pas être vide." },
      { status: 400 }
    );
  }

  if (!webhookUrl) {
    return Response.json(
      {
        success: false,
        message:
          "L'assistant n'est pas connecté en local (N8N_WEBHOOK_URL absente). " +
          "Vous pouvez utiliser le simulateur de devis en attendant.",
        offline: true,
      },
      { status: 503 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Le workflow n8n keye la mémoire sur body.sessionId (camelCase) et lit le
        // message du prospect ; on envoie plusieurs alias pour coller à sa config.
        sessionId: body?.session_id,
        message,
        chatInput: message,
        history: Array.isArray(body?.history) ? body.history : undefined,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { success: false, message: text || "Réponse inattendue de l'assistant." };
    }

    // Webhook n8n pas encore activé (workflow inactif) → message clair plutôt que
    // l'erreur technique brute de n8n.
    if (res.status === 404 && (data?.code === 404 || /not registered/i.test(data?.message ?? ""))) {
      return Response.json(
        {
          success: false,
          message:
            "L'assistant est en cours d'activation côté n8n. Réessayez dans un instant, ou utilisez le simulateur de devis.",
          offline: true,
        },
        { status: 503 },
      );
    }

    // On relaie le statut HTTP de n8n (200 / 422 / autre) et son corps.
    return Response.json(data, { status: res.status });
  } catch (error) {
    const aborted = error?.name === "AbortError";
    return Response.json(
      {
        success: false,
        message: aborted
          ? "L'assistant met trop de temps à répondre. Réessayez."
          : "Impossible de joindre l'assistant pour le moment.",
      },
      { status: 502 }
    );
  }
}
