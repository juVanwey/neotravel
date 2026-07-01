import { calculer_devis } from '@/lib/calculer_devis';

// ── Utilitaires ──────────────────────────────────────────────────────────────

function stripPct(str) {
  return (str || '')
    .replace(/\s*\([+-]?\d+(\.\d+)?%\)/g, '')
    .replace(/\s*→\s*[+-]?\d+(\.\d+)?%/g, '');
}

function eur(n) {
  const sign = n < 0 ? '-' : '';
  const [int, dec] = Math.abs(n || 0).toFixed(2).split('.');
  return sign + int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + dec + ' €';
}

function dateFR(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const M = ['janvier','fevrier','mars','avril','mai','juin',
             'juillet','aout','septembre','octobre','novembre','decembre'];
  return String(d.getDate()).padStart(2, '0') + ' ' + M[d.getMonth()] + ' ' + d.getFullYear();
}

function genRef() {
  const d = new Date();
  return 'NTR-' + d.getFullYear()
    + String(d.getMonth() + 1).padStart(2, '0')
    + String(d.getDate()).padStart(2, '0')
    + '-' + Math.floor(1000 + Math.random() * 9000);
}

const CMAP = {
  'à':'a','â':'a','ä':'a','á':'a',
  'è':'e','é':'e','ê':'e','ë':'e',
  'î':'i','ï':'i','í':'i','ì':'i',
  'ô':'o','ö':'o','ó':'o','ò':'o',
  'ù':'u','û':'u','ü':'u','ú':'u',
  'ç':'c','ñ':'n',
  'À':'A','Â':'A','Ä':'A','Á':'A',
  'È':'E','É':'E','Ê':'E','Ë':'E',
  'Î':'I','Ï':'I','Ô':'O','Ö':'O',
  'Ù':'U','Û':'U','Ü':'U','Ç':'C','Ñ':'N',
  '→':'>','–':'-','—':'-',' ':' ',' ':' ',
};
function san(s) {
  if (!s) return '';
  return String(s).split('').map(c => (CMAP[c] !== undefined ? CMAP[c] : c)).join('');
}

// ── Moteur PDF 1.4 ───────────────────────────────────────────────────────────

function buildPDF(devis, prospect) {
  const PW = 595.28, PH = 841.89;
  const mm = v => v * 2.8346;

  const NAVY  = [27,  58,  107];
  const GOLD  = [218, 155, 30 ];
  const WHITE = [255, 255, 255];
  const DARK  = [30,  30,  46 ];
  const GREY  = [107, 114, 128];
  const LGREY = [248, 249, 250];
  const AMBER = [146, 64,  14 ];
  const LBLUE = [200, 215, 240];

  // Largeurs Helvetica (1/1000 em) pour calcul alignement droite
  const HW = {
    ' ':278,'!':278,'"':355,'#':556,'$':556,'%':889,'&':667,"'":222,
    '(':333,')':333,'*':389,'+':584,',':278,'-':333,'.':278,'/':278,
    '0':556,'1':556,'2':556,'3':556,'4':556,'5':556,'6':556,'7':556,'8':556,'9':556,
    ':':278,';':278,'<':584,'=':584,'>':584,'?':556,'@':1015,
    'A':667,'B':667,'C':722,'D':722,'E':667,'F':611,'G':778,'H':722,
    'I':278,'J':500,'K':667,'L':611,'M':833,'N':722,'O':778,'P':667,
    'Q':778,'R':722,'S':667,'T':611,'U':722,'V':667,'W':944,'X':667,
    'Y':667,'Z':611,'[':278,'\\':278,']':278,'^':469,'_':556,
    'a':556,'b':556,'c':500,'d':556,'e':556,'f':278,'g':556,'h':556,
    'i':222,'j':222,'k':500,'l':222,'m':833,'n':556,'o':556,'p':556,
    'q':556,'r':333,'s':500,'t':278,'u':556,'v':500,'w':722,'x':500,
    'y':500,'z':500,'|':260,'€':556,
  };
  const tw = (s, sz) => {
    let w = 0;
    for (const c of String(s || '')) w += (HW[c] || 500);
    return w * sz / 1000;
  };

  // PDF string literal : échappe backslash, parens ; € → \200 (WinAnsi 0x80)
  const ps = s => '(' + String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/€/g, '\\200')
    + ')';

  const ops = [];
  const rgb = (r, g, b) =>
    `${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)}`;

  // Helpers de dessin (coords en mm, origine coin supérieur-gauche)
  const fc  = (r,g,b)  => ops.push(rgb(r,g,b) + ' rg');
  const sco = (r,g,b)  => ops.push(rgb(r,g,b) + ' RG');
  const slw = w        => ops.push(w + ' w');
  const ry  = (y, h)   => PH - mm(y) - mm(h);   // y bas PDF pour rect
  const by  = y        => PH - mm(y);             // baseline PDF pour texte

  function fr(x, y, w, h, r, g, b) {
    fc(r,g,b);
    ops.push(`${mm(x).toFixed(2)} ${ry(y,h).toFixed(2)} ${mm(w).toFixed(2)} ${mm(h).toFixed(2)} re f`);
  }
  function fsr(x, y, w, h, fr_,fg_,fb_, sr_,sg_,sb_, lw) {
    fc(fr_,fg_,fb_); sco(sr_,sg_,sb_); slw(lw || 0.5);
    ops.push(`${mm(x).toFixed(2)} ${ry(y,h).toFixed(2)} ${mm(w).toFixed(2)} ${mm(h).toFixed(2)} re B`);
  }
  function hl(x1, y, x2, lw, r, g, b) {
    sco(r,g,b); slw(lw || 0.5);
    const py = by(y).toFixed(2);
    ops.push(`${mm(x1).toFixed(2)} ${py} m ${mm(x2).toFixed(2)} ${py} l S`);
  }
  // Texte positionné (x, y = baseline depuis le haut en mm)
  function t(str, x, y, fn, sz, r, g, b) {
    fc(r,g,b);
    const s = san(str);
    ops.push(`BT /${fn} ${sz} Tf 1 0 0 1 ${mm(x).toFixed(2)} ${by(y).toFixed(2)} Tm ${ps(s)} Tj ET`);
  }
  // Texte aligné à droite (xr = bord droit en mm)
  function tr(str, xr, y, fn, sz, r, g, b) {
    fc(r,g,b);
    const s = san(str);
    const x = xr - tw(s, sz) / 2.8346;
    ops.push(`BT /${fn} ${sz} Tf 1 0 0 1 ${mm(x).toFixed(2)} ${by(y).toFixed(2)} Tm ${ps(s)} Tj ET`);
  }
  // Texte centré (xc = centre en mm)
  function tc(str, xc, y, fn, sz, r, g, b) {
    fc(r,g,b);
    const s = san(str);
    const x = xc - tw(s, sz) / 2 / 2.8346;
    ops.push(`BT /${fn} ${sz} Tf 1 0 0 1 ${mm(x).toFixed(2)} ${by(y).toFixed(2)} Tm ${ps(s)} Tj ET`);
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  const ref  = genRef();
  const meta = devis.meta || {};
  let y = 0;

  // 1. EN-TÊTE
  fr(0, 0, 210, 38, ...NAVY);
  fr(0, 38, 210, 2, ...GOLD);

  t('NEO',    20,     20, 'F2', 26, ...WHITE);
  t('TRAVEL', 42,     20, 'F2', 26, ...GOLD);
  t('Mobilite groupe - Transferts & Excursions', 20, 29, 'F1', 9, ...LBLUE);

  tr('DEVIS',                                       190, 15, 'F2', 18,  ...WHITE);
  tr('Ref. ' + ref,                                  190, 22, 'F1', 8.5, ...LBLUE);
  tr('Emis le ' + dateFR(new Date().toISOString()),  190, 28, 'F1', 8.5, ...LBLUE);
  tr('Offre valable 30 jours',                       190, 35, 'F2', 8.5, ...GOLD);

  y = 48;

  // 2. BLOCS ADRESSES
  fr(20,  y, 76, 34, ...LGREY);
  fr(114, y, 76, 34, ...LGREY);

  t('NeoTravel SAS', 24, y + 7, 'F2', 8.5, ...NAVY);
  ['15 avenue des Voyageurs', '75008 Paris, France', 'contact@neotravel.fr', '+33 1 23 45 67 89']
    .forEach((l, i) => t(l, 24, y + 13 + i * 5.5, 'F1', 8, ...DARK));

  t('Client / Prospect', 118, y + 7, 'F2', 8.5, ...NAVY);
  [prospect.nom, prospect.entreprise, prospect.email, prospect.telephone]
    .filter(Boolean)
    .forEach((l, i) => t(String(l), 118, y + 13 + i * 5.5, 'F1', 8, ...DARK));

  y += 42;

  // 3. DÉTAILS TRAJET
  t('Details du trajet', 20, y, 'F2', 10, ...NAVY);
  hl(20, y + 3, 64, 0.6, ...GOLD);
  y += 8;

  const tripRows = [
    ['DATE DE DEPART',  dateFR(meta.date_depart  || prospect.date_depart)],
    ['DISTANCE',        String(meta.distance_km  || prospect.distance_km  || '-') + ' km'],
    ['NB. PASSAGERS',   String(meta.nb_passagers || prospect.nb_passagers || '-') + ' personnes'],
    ['TYPE DE TRAJET',  (meta.aller_retour || prospect.aller_retour) ? 'Aller / Retour' : 'Aller simple'],
    ['VILLE DE DEPART', String(prospect.ville_depart  || '-')],
    ['DESTINATION',     String(prospect.ville_arrivee || '-')],
  ];
  tripRows.forEach(([label, val], i) => {
    const cx = 20 + (i % 2) * 86;
    const ry = y + Math.floor(i / 2) * 10;
    t(label, cx, ry,     'F2', 7.5, ...GREY);
    t(val,   cx, ry + 5, 'F1', 9,   ...DARK);
  });
  y += Math.ceil(tripRows.length / 2) * 10 + 8;

  // 4. TABLEAU DE CALCUL
  t('Detail du calcul', 20, y, 'F2', 10, ...NAVY);
  hl(20, y + 3, 62, 0.6, ...GOLD);
  y += 8;

  const RH = 7;
  fr(20, y, 170, RH, ...NAVY);
  t('Description', 24, y + 4.8, 'F2', 8.5, ...WHITE);
  tr('Montant', 186, y + 4.8, 'F2', 8.5, ...WHITE);
  y += RH;

  const lignes = (devis.lignes || []).filter(
    l => !l.libelle.includes('SOUS-TOTAL') && !l.libelle.startsWith('TVA')
  );
  lignes.forEach((ligne, i) => {
    fr(20, y, 170, RH, ...(i % 2 === 0 ? WHITE : LGREY));
    const isBase = i === 0;
    t(stripPct(ligne.libelle), 24, y + 4.8, isBase ? 'F2' : 'F1', 8, ...DARK);
    const m   = ligne.montant || 0;
    const col = m < 0 ? [180, 30, 30] : m === 0 ? GREY : DARK;
    const ms  = m === 0 ? 'Inclus' : (!isBase && m > 0 ? '+' : '') + eur(m);
    tr(ms, 186, y + 4.8, isBase ? 'F2' : 'F1', 8, ...col);
    y += RH;
  });

  hl(20, y, 190, 0.3, ...NAVY);
  y += 6;

  // 5. TOTAUX (boîte ancrée à droite)
  const TW = 82, TX = 108;

  fr(TX, y, TW, 8, ...LGREY);
  t('Sous-total HT', TX + 4, y + 5.5, 'F1', 9, ...DARK);
  tr(eur(devis.prix_ht), TX + TW - 4, y + 5.5, 'F1', 9, ...DARK);
  y += 8;

  fsr(TX, y, TW, 8, 255,255,255, 220,220,220, 0.2);
  t('TVA 10%', TX + 4, y + 5.5, 'F1', 9, ...DARK);
  tr(eur(devis.tva), TX + TW - 4, y + 5.5, 'F1', 9, ...DARK);
  y += 8;

  fr(TX, y, TW, 12, ...NAVY);
  t('TOTAL TTC', TX + 4, y + 8, 'F2', 11, ...WHITE);
  tr(eur(devis.prix_ttc), TX + TW - 4, y + 8, 'F2', 12, ...GOLD);
  y += 18;

  // 6. CONDITIONS
  fsr(20, y, 170, 16, 255,251,235, ...GOLD, 0.4);
  t('Conditions', 24, y + 6, 'F2', 8.5, ...AMBER);
  t("Ce devis est valable 30 jours a compter de sa date d'emission. Tarifs soumis a disponibilite.",
    24, y + 11.5, 'F1', 7.5, 92, 60, 10);

  // 7. FOOTER
  fr(0, 275, 210,  2, ...GOLD);
  fr(0, 277, 210, 20, ...NAVY);
  tc('NeoTravel SAS - 15 avenue des Voyageurs, 75008 Paris',        105, 284, 'F1', 7.5, ...LBLUE);
  tc('contact@neotravel.fr | www.neotravel.fr | +33 1 23 45 67 89', 105, 289, 'F1', 7.5, ...LBLUE);
  tc('MBA MSI Epitech - Projet Academique NeoTravel 2025',           105, 294, 'F1', 7,   ...GOLD);

  // ── Assemblage PDF ─────────────────────────────────────────────────────────
  const cs    = ops.join('\n');
  const csLen = cs.length;

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89]\n'
             + '   /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >>\n'
             + '   /Contents 6 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica'
             + ' /Encoding /WinAnsiEncoding >>\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold'
             + ' /Encoding /WinAnsiEncoding >>\nendobj\n';
  const obj6 = `6 0 obj\n<< /Length ${csLen} >>\nstream\n${cs}\nendstream\nendobj\n`;

  const hdr = '%PDF-1.4\n';
  let pos = hdr.length;
  const off1 = pos; pos += obj1.length;
  const off2 = pos; pos += obj2.length;
  const off3 = pos; pos += obj3.length;
  const off4 = pos; pos += obj4.length;
  const off5 = pos; pos += obj5.length;
  const off6 = pos; pos += obj6.length;
  const xrefPos = pos;

  const z10 = n => String(n).padStart(10, '0');
  const xref = 'xref\n0 7\n'
    + '0000000000 65535 f \n'
    + z10(off1) + ' 00000 n \n'
    + z10(off2) + ' 00000 n \n'
    + z10(off3) + ' 00000 n \n'
    + z10(off4) + ' 00000 n \n'
    + z10(off5) + ' 00000 n \n'
    + z10(off6) + ' 00000 n \n';
  const trailer = 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';

  const pdf_base64 = Buffer.from(
    hdr + obj1 + obj2 + obj3 + obj4 + obj5 + obj6 + xref + trailer,
    'latin1'
  ).toString('base64');

  return { pdf_base64, ref };
}

// ── Route Next.js ─────────────────────────────────────────────────────────────

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

    const devis             = devisInput ?? calculer_devis(params);
    const { pdf_base64, ref } = buildPDF(devis, prospect);
    const filename          = 'devis-NeoTravel-' + ref + '.pdf';

    return Response.json({
      pdf_base64,
      filename,
      ref,
      pdf_data_uri: 'data:application/pdf;base64,' + pdf_base64,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
