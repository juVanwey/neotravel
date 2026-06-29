// Nœud Code n8n — Génération PDF devis NeoTravel (PDF 1.4 pur, sans librairie)
// Entrées : $node["Code"].json.donnees  |  $node["Calculer devis"].json
// Sortie  : { pdf_base64, filename, ref }

const donnees = $node["Code"].json.donnees;
const devis   = $node["Calculer devis"].json;
const meta    = devis.meta || {};

function genRef() {
  const d = new Date();
  return 'NTR-' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0')
       + String(d.getDate()).padStart(2,'0') + '-' + Math.floor(1000+Math.random()*9000);
}
function eur(n) {
  const [i,d] = Math.abs(n||0).toFixed(2).split('.');
  return (n<0?'-':'') + i.replace(/\B(?=(\d{3})+(?!\d))/g,' ') + ',' + d + ' EUR';
}
// Garde ASCII imprimable, échappe les caractères spéciaux PDF
function s(v) {
  return String(v||'').replace(/[^\x20-\x7E]/g,'?').replace(/[()\\]/g,'\\$&');
}
function stripPct(str) {
  return (str||'').replace(/\s*\([+-]?\d+(\.\d+)?%\)/g,'').replace(/\s*[>→]\s*[+-]?\d+(\.\d+)?%/g,'');
}

const ref = genRef();

// Lignes de texte : [texte, x, y_depuis_bas, taille]
const rows = [
  ['DEVIS NEOTRAVEL',                                                       50, 800, 18],
  ['Ref: ' + ref + '   Date: ' + new Date().toLocaleDateString('fr-FR'),    50, 775, 10],
  ['Client : ' + s(donnees.nom),                                             50, 748, 11],
  ['Email  : ' + s(donnees.email),                                           50, 734, 10],
  ['Trajet : ' + s(donnees.ville_depart) + ' > ' + s(donnees.ville_arrivee),50, 720, 10],
  ['Distance : ' + (meta.distance_km||'-') + ' km   Passagers : ' + (meta.nb_passagers||'-'), 50, 706, 10],
  ['Detail du calcul :',                                                     50, 680, 12],
];

(devis.lignes||[])
  .filter(l => !l.libelle.includes('SOUS-TOTAL') && !l.libelle.startsWith('TVA'))
  .forEach((l, i) => {
    rows.push([s(stripPct(l.libelle)) + ' : ' + eur(l.montant), 60, 660 - i*16, 10]);
  });

rows.push(['Sous-total HT : ' + eur(devis.prix_ht),  50, 200, 10]);
rows.push(['TVA 10%       : ' + eur(devis.tva),       50, 186, 10]);
rows.push(['TOTAL TTC     : ' + eur(devis.prix_ttc),  50, 168, 13]);
rows.push(["Offre valable 30 jours. Tarifs soumis a disponibilite.", 50, 140, 9]);

// Contenu du stream PDF (opérateurs BT/ET)
const stream = rows.map(([txt, x, y, sz]) =>
  `BT /F1 ${sz} Tf ${x} ${y} Td (${txt}) Tj ET`
).join('\n') + '\n';

const streamLen = Buffer.byteLength(stream, 'latin1');

const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n'
           + '/Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n';
const obj4 = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}endstream\nendobj\n`;

const hdr = '%PDF-1.4\n';
let pos = hdr.length;
const off1 = pos; pos += obj1.length;
const off2 = pos; pos += obj2.length;
const off3 = pos; pos += obj3.length;
const off4 = pos; pos += obj4.length;
const xrefPos = pos;

const z = n => String(n).padStart(10,'0');
const xref    = 'xref\n0 5\n0000000000 65535 f \n'
              + z(off1) + ' 00000 n \n'
              + z(off2) + ' 00000 n \n'
              + z(off3) + ' 00000 n \n'
              + z(off4) + ' 00000 n \n';
const trailer = 'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';

const pdf_base64 = Buffer.from(hdr + obj1 + obj2 + obj3 + obj4 + xref + trailer, 'latin1').toString('base64');
const filename   = 'devis-NeoTravel-' + ref + '.pdf';

return [{ json: { pdf_base64: String(pdf_base64), filename: String(filename), ref: String(ref) } }];
