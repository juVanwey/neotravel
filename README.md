# NeoTravel

Prototype d'automatisation du processus commercial de NeoTravel : captation du lead, qualification par agent IA, calcul de devis déterministe, envoi par email avec PDF joint et relances automatiques.

Projet réalisé dans le cadre du **MSc MSI Epitech** — 1 semaine, équipe de 5.

---

## Stack

| Brique                 | Outil                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| Front / Chatbot        | Next.js (déployé sur Vercel)                                       |
| Orchestration agent IA | n8n Cloud                                                          |
| Modèle IA              | Claude Sonnet via Vercel AI Gateway                                |
| Calcul devis           | `calculer_devis()` — nœud Code n8n (JS déterministe)               |
| Génération PDF         | Endpoint Next.js `/api/pdf` (jsPDF)                                |
| Base de données & CRM  | Airtable (5 tables : Demandes, Devis, Matrices, Relances, Clients) |
| Dashboard pilotage     | Airtable Interface                                                 |
| Envoi emails           | Nœud Send Email n8n (SMTP Gmail)                                   |
| Relances automatiques  | Schedule Trigger n8n + Wait node                                   |

---

## Règle d'or

> **Le prix ne transite jamais par le LLM.**  
> L'agent IA collecte les informations et décide quoi faire. `calculer_devis()` calcule le prix de manière déterministe, documentée et auditable. Mêmes paramètres = même résultat, toujours.

---

## Prérequis

- Node.js v18 ou supérieur
- Un compte n8n Cloud (trial 14 jours gratuit)
- Un compte Airtable (gratuit)
- Un compte Vercel (gratuit) pour le déploiement
- Un compte Gmail avec mot de passe d'application activé (pour l'envoi des emails)

---

## Lancer le projet en local

Cloner le repo et installer les dépendances :

```bash
git clone https://github.com/juVanwey/neotravel.git
cd neotravel
npm install
```

Copier le fichier d'environnement et remplir les variables :

```bash
cp .env.example .env.local
```

Lancer le serveur de développement :

```bash
npm run dev
```

Le site est accessible sur `http://localhost:3000`.

---

## Variables d'environnement

| Variable              | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `N8N_WEBHOOK_URL`     | URL du webhook n8n qui reçoit les messages du chat               |
| `NEXT_PUBLIC_APP_URL` | URL publique du site déployé : `https://neotravel-mu.vercel.app` |
| `SMTP_HOST`           | `smtp.gmail.com`                                                 |
| `SMTP_PORT`           | `465`                                                            |
| `SMTP_USER`           | Adresse Gmail expéditeur                                         |
| `SMTP_PASSWORD`       | Mot de passe d'application Gmail (16 caractères)                 |

---

## Tester le moteur de tarification

```bash
node lib/calculer_devis.js
```

Lance les 5 cas nominaux et 5 cas limites. Tous doivent passer avant toute modification du moteur.

---

## Tester le workflow n8n

```powershell
Invoke-WebRequest -Uri "https://xxx.app.n8n.cloud/webhook-test/neotravel-lead" `
  -Method POST -ContentType "application/json" `
  -Body '{"message": "Bonjour, je veux un car pour 40 personnes de Marseille a Lyon le 15 aout 2026", "sessionId": "test-001"}'
```

---

## Structure du projet

```
neotravel/
├── app/
│   ├── page.tsx              # Landing page prospect avec chatbot
│   └── api/
│       ├── chat/             # Route API → webhook n8n
│       ├── devis/            # Endpoint POST /api/devis (expose calculer_devis)
│       └── pdf/              # Endpoint POST /api/pdf (génération PDF jsPDF)
├── lib/
│   └── calculer_devis.js     # Moteur de tarification déterministe + tests
├── n8n-exports/
│   └── workflow-agent-principal.json  # Workflow n8n de production
└── .env.local                # Variables secrètes (jamais sur Git)
```

---

## Architecture

```
Prospect (chatbot Next.js)
        ↓ webhook POST
    Agent IA (n8n Cloud)
    [Claude via Vercel AI Gateway]
        ↓
  Nœud Code — calculer_devis()
  [prix déterministe, jamais le LLM]
        ↓
  ┌─────────────────────────────┐
  │  Airtable CRM               │
  │  Demandes · Devis · Relances│
  └─────────────────────────────┘
        ↓
  Email devis PDF (Gmail SMTP)
        ↓
  Relances J+3 / J+7 (Wait node)
        ↓
  Dashboard Airtable
```

### 4 branches du workflow

| Statut                   | Déclenchement                                                        |
| ------------------------ | -------------------------------------------------------------------- |
| `complet`                | Toutes les infos collectées → calcul devis → email PDF               |
| `incomplet`              | Infos manquantes → question au prospect                              |
| `cas_complexe`           | Trajet international, >85 passagers, négociation → alerte commercial |
| `cas_incomplet_escalade` | Prospect bloqué → alerte commercial                                  |

---

## IDs Airtable

| Table    | ID                  |
| -------- | ------------------- |
| Base     | `appGGAlQWuG2wb5kd` |
| Demandes | `tblZivQRw7GW1jawF` |
| Matrices | `tble61z76YfAGFU0y` |
| Devis    | `tblv2r0FCkW1SUYtK` |
| Relances | `tblgiAeSOwD70OAJW` |
| Clients  | `tbloAwcQJxmcvybYq` |

---

## Équipe

Projet réalisé par **Chaimaa Bella**, **Ivan Pecora**, **Julie Vanweydeveldt**, **Leaticia Ouachem**, **Suzanne Werberg-Moller**.

MSc Management des Systèmes d'Information — Epitech 2026
