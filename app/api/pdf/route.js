import { jsPDF } from 'jspdf';
import { calculer_devis } from '@/lib/calculer_devis';

// Palette [R, G, B]
const NAVY  = [27, 58, 107];
const GOLD  = [218, 155, 30];
const DARK  = [30, 30, 46];
const GREY  = [107, 114, 128];
const LGREY = [248, 249, 250];
const WHITE = [255, 255, 255];
const AMBER = [146, 64, 14];

const ML = 20;   // margin gauche
const MR = 190;  // margin droite (210 - 20)
const CW = 170;  // largeur contenu

// jsPDF 4.x + Node.js : les polices standard (WinAnsi) ne supportent pas
// les caracteres accentues de facon fiable. On utilise une table de
// substitution explicite — plus robuste que NFD+regex en environnement bundle.
const CHAR_MAP = {
  'à': 'a', 'â': 'a', 'ä': 'a', 'á': 'a',
  'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'î': 'i', 'ï': 'i', 'í': 'i', 'ì': 'i',
  'ô': 'o', 'ö': 'o', 'ó': 'o', 'ò': 'o',
  'ù': 'u', 'û': 'u', 'ü': 'u', 'ú': 'u',
  'ç': 'c', 'ñ': 'n',
  'À': 'A', 'Â': 'A', 'Ä': 'A', 'Á': 'A',
  'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
  'Î': 'I', 'Ï': 'I',
  'Ô': 'O', 'Ö': 'O',
  'Ù': 'U', 'Û': 'U', 'Ü': 'U',
  'Ç': 'C', 'Ñ': 'N',
  '→': '>',
  '–': '-',
  '—': '-',
  ' ': ' ',
  ' ': ' ',
};

function sanitize(str) {
  if (!str) return '';
  return str.split('').map(c => CHAR_MAP[c] !== undefined ? CHAR_MAP[c] : c).join('');
}

function stripPct(str) {
  return str
    .replace(/\s*\([+-]?\d+(\.\d+)?%\)/g, '')  // "(+15%)" ou "(-5%)"
    .replace(/\s*→\s*[+-]?\d+(\.\d+)?%/g, ''); // " → +10%" ou " → -5%"
}

function eur(n) {
  const sign = n < 0 ? '-' : '';
  const abs  = Math.abs(n);
  const [int, dec] = abs.toFixed(2).split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return sign + intFmt + ',' + dec + ' €';
}

function dateFR(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function genRef() {
  const d = new Date();
  const s = String(d.getFullYear())
    + String(d.getMonth() + 1).padStart(2, '0')
    + String(d.getDate()).padStart(2, '0');
  return 'NTR-' + s + '-' + Math.floor(1000 + Math.random() * 9000);
}

function buildPDF(devis, prospect) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ref = genRef();
  let y     = 0;

  // ── 1. EN-TETE ──────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 38, 210, 2, 'F');

  // Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...WHITE);
  doc.text('NEO', ML, 20);
  doc.setTextColor(...GOLD);
  doc.text('TRAVEL', ML + 22, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 215, 240);
  doc.text('Mobilite groupe - Transferts & Excursions', ML, 29);

  // Titre devis (droite)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text('DEVIS', MR, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 215, 240);
  doc.text('Ref. ' + ref, MR, 22, { align: 'right' });
  doc.text(sanitize('Emis le ' + dateFR(devis.meta?.calcule_le || new Date().toISOString())), MR, 28, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text('Offre valable 30 jours', MR, 35, { align: 'right' });

  y = 48;

  // ── 2. BLOCS ADRESSES ───────────────────────────────────
  doc.setFillColor(...LGREY);
  doc.rect(ML, y, 76, 34, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text('NeoTravel SAS', ML + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text('15 avenue des Voyageurs', ML + 4, y + 13);
  doc.text('75008 Paris, France', ML + 4, y + 18.5);
  doc.text('contact@neotravel.fr', ML + 4, y + 24);
  doc.text('+33 1 23 45 67 89', ML + 4, y + 29.5);

  doc.setFillColor(...LGREY);
  doc.rect(114, y, 76, 34, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text('Client / Prospect', 118, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  [prospect.nom, prospect.entreprise, prospect.email, prospect.telephone]
    .filter(Boolean)
    .forEach((line, i) => doc.text(sanitize(line), 118, y + 13 + i * 5.5));

  y += 42;

  // ── 3. DETAILS TRAJET ───────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Details du trajet', ML, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(ML, y + 2, ML + 44, y + 2);
  y += 8;

  const tripRows = [
    ['DATE DE DEPART',  sanitize(dateFR(devis.meta.date_depart))],
    ['DISTANCE',        devis.meta.distance_km + ' km'],
    ['NB. PASSAGERS',   devis.meta.nb_passagers + ' personnes'],
    ['TYPE DE TRAJET',  devis.meta.aller_retour ? 'Aller / Retour' : 'Aller simple'],
    ['VILLE DE DEPART', sanitize(prospect.ville_depart  || '-')],
    ['DESTINATION',     sanitize(prospect.ville_arrivee || '-')],
  ];

  tripRows.forEach(([label, val], i) => {
    const cx = ML + (i % 2) * 86;
    const ry = y + Math.floor(i / 2) * 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text(label, cx, ry);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(val, cx, ry + 5);
  });

  y += Math.ceil(tripRows.length / 2) * 10 + 8;

  // ── 4. TABLEAU DE CALCUL DETAILLE ───────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Detail du calcul', ML, y);
  doc.setDrawColor(...GOLD);
  doc.line(ML, y + 2, ML + 42, y + 2);
  y += 8;

  const ROW_H = 7;

  doc.setFillColor(...NAVY);
  doc.rect(ML, y, CW, ROW_H, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.text('Description', ML + 4, y + 4.8);
  doc.text('Montant', MR - 4, y + 4.8, { align: 'right' });
  y += ROW_H;

  const lignesDetail = devis.lignes.filter(
    l => !l.libelle.includes('SOUS-TOTAL') && !l.libelle.startsWith('TVA')
  );

  lignesDetail.forEach((ligne, i) => {
    doc.setFillColor(...(i % 2 === 0 ? WHITE : LGREY));
    doc.rect(ML, y, CW, ROW_H, 'F');

    const isBase = i === 0;
    doc.setFont('helvetica', isBase ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(sanitize(stripPct(ligne.libelle)), ML + 4, y + 4.8);

    const signe = !isBase && ligne.montant > 0 ? '+' : '';
    const col   = ligne.montant < 0 ? [180, 30, 30] : ligne.montant === 0 ? GREY : DARK;
    doc.setTextColor(...col);
    doc.text(
      ligne.montant === 0 ? 'Inclus' : signe + eur(ligne.montant),
      MR - 4, y + 4.8, { align: 'right' }
    );
    y += ROW_H;
  });

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(ML, y, MR, y);
  y += 6;

  // ── 5. TOTAUX ────────────────────────────────────────────
  const TW = 82;
  const TX = MR - TW;

  doc.setFillColor(...LGREY);
  doc.rect(TX, y, TW, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('Sous-total HT', TX + 4, y + 5.5);
  doc.text(eur(devis.prix_ht), MR - 4, y + 5.5, { align: 'right' });
  y += 8;

  doc.setFillColor(...WHITE);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.rect(TX, y, TW, 8, 'FD');
  doc.setTextColor(...DARK);
  doc.text('TVA 10%', TX + 4, y + 5.5);
  doc.text(eur(devis.tva), MR - 4, y + 5.5, { align: 'right' });
  y += 8;

  doc.setFillColor(...NAVY);
  doc.rect(TX, y, TW, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text('TOTAL TTC', TX + 4, y + 8);
  doc.setTextColor(...GOLD);
  doc.setFontSize(12);
  doc.text(eur(devis.prix_ttc), MR - 4, y + 8, { align: 'right' });
  y += 18;

  // ── 6. MENTION VALIDITE ──────────────────────────────────
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.rect(ML, y, CW, 16, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...AMBER);
  doc.text('Conditions', ML + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(92, 60, 10);
  doc.text(
    "Ce devis est valable 30 jours a compter de sa date d'emission. Tarifs soumis a disponibilite.",
    ML + 4, y + 11.5
  );

  // ── 7. PIED DE PAGE ──────────────────────────────────────
  doc.setFillColor(...GOLD);
  doc.rect(0, 275, 210, 2, 'F');
  doc.setFillColor(...NAVY);
  doc.rect(0, 277, 210, 20, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 215, 240);
  doc.text('NeoTravel SAS - 15 avenue des Voyageurs, 75008 Paris', 105, 284, { align: 'center' });
  doc.text('contact@neotravel.fr | www.neotravel.fr | +33 1 23 45 67 89', 105, 289, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(...GOLD);
  doc.text('MBA MSI Epitech - Projet Academique NeoTravel 2025', 105, 294, { align: 'center' });

  return doc;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { params, prospect = {}, devis: devisInput } = body;

    if (!devisInput && !params) {
      return Response.json(
        { error: 'Fournir soit "devis" (resultat pre-calcule) soit "params" (parametres bruts).' },
        { status: 400 }
      );
    }

    const devis  = devisInput ?? calculer_devis(params);
    const doc    = buildPDF(devis, prospect);
    const buffer = doc.output('arraybuffer');
    const base64 = Buffer.from(buffer).toString('base64');

    return Response.json({
      pdf_base64:   base64,
      pdf_data_uri: 'data:application/pdf;base64,' + base64,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
