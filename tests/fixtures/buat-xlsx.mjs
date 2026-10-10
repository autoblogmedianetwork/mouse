/**
 * Regenerasi fixture .xlsx (dipakai test unit lib/impor/xlsx.test.ts).
 *
 * Fixture dibuat manual, tanpa dependency: ZIP disusun sendiri dengan
 * zlib bawaan Node. Dua variasi penting:
 * - tiktok-orders.xlsx memakai deflate (metode 8) seperti ekspor asli,
 * - shopee-stored.xlsx memakai stored (metode 0) untuk menguji jalur salinan.
 *
 * Jalankan: node tests/fixtures/buat-xlsx.mjs
 */
import { deflateRawSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const diSini = dirname(fileURLToPath(import.meta.url));

const CRC_TABEL = (() => {
  const tabel = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabel[i] = c >>> 0;
  }
  return tabel;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABEL[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Susun ZIP dari daftar { nama, isi } dengan metode 0 atau 8. */
function buatZip(entri, metode) {
  const lokal = [];
  const pusat = [];
  let offset = 0;

  for (const { nama, isi } of entri) {
    const dataMentah = Buffer.from(isi, "utf8");
    const termampatkan = metode === 8 ? deflateRawSync(dataMentah) : dataMentah;
    const crc = crc32(dataMentah);
    const namaBuf = Buffer.from(nama, "utf8");

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(metode, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(termampatkan.length, 18);
    header.writeUInt32LE(dataMentah.length, 22);
    header.writeUInt16LE(namaBuf.length, 26);
    header.writeUInt16LE(0, 28);
    lokal.push(header, namaBuf, termampatkan);

    const pusatEntri = Buffer.alloc(46);
    pusatEntri.writeUInt32LE(0x02014b50, 0);
    pusatEntri.writeUInt16LE(20, 4);
    pusatEntri.writeUInt16LE(20, 6);
    pusatEntri.writeUInt16LE(0, 8);
    pusatEntri.writeUInt16LE(metode, 10);
    pusatEntri.writeUInt16LE(0, 12);
    pusatEntri.writeUInt16LE(0, 14);
    pusatEntri.writeUInt32LE(crc, 16);
    pusatEntri.writeUInt32LE(termampatkan.length, 20);
    pusatEntri.writeUInt32LE(dataMentah.length, 24);
    pusatEntri.writeUInt16LE(namaBuf.length, 28);
    pusatEntri.writeUInt16LE(0, 30);
    pusatEntri.writeUInt16LE(0, 32);
    pusatEntri.writeUInt16LE(0, 34);
    pusatEntri.writeUInt16LE(0, 36);
    pusatEntri.writeUInt32LE(0, 38);
    pusatEntri.writeUInt32LE(offset, 42);
    pusat.push(pusatEntri, namaBuf);

    offset += header.length + namaBuf.length + termampatkan.length;
  }

  const isiLokal = Buffer.concat(lokal);
  const isiPusat = Buffer.concat(pusat);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entri.length, 8);
  eocd.writeUInt16LE(entri.length, 10);
  eocd.writeUInt32LE(isiPusat.length, 12);
  eocd.writeUInt32LE(isiLokal.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([isiLokal, isiPusat, eocd]);
}

/** Serial Excel untuk tanggal UTC tertentu (epoch 1899-12-30). */
function serial(tanggal) {
  const epoch = Date.UTC(1899, 11, 30);
  const ms = Date.parse(`${tanggal}T00:00:00Z`);
  return Math.round((ms - epoch) / 86_400_000);
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK = `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Orders" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
<cellXfs count="3">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
</styleSheet>`;

const SHARED = `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="8" uniqueCount="8">
<si><t>Order ID</t></si>
<si><t>Product Name</t></si>
<si><t>SKU ID</t></si>
<si><t>Quantity</t></si>
<si><t>Order Amount</t></si>
<si><t>Commission</t></si>
<si><t>Order Status</t></si>
<si><t>Order created time</t></si>
</sst>`;

// Kolom: A OrderID, B Product(inline), C SKU, D Qty, E Amount, F Commission,
// G Status(inline), H Created(date), I Rate(percent)
const SHEET = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="s"><v>4</v></c><c r="F1" t="s"><v>5</v></c><c r="G1" t="s"><v>6</v></c><c r="H1" t="s"><v>7</v></c><c r="I1" t="inlineStr"><is><t>Commission Rate</t></is></c></row>
<row r="2"><c r="A2" t="inlineStr"><is><t>5778abc001</t></is></c><c r="B2" t="inlineStr"><is><t>Kaos Polos Oversize &amp; Nyaman</t></is></c><c r="C2" t="inlineStr"><is><t>SKU-OVR-BLK-L</t></is></c><c r="D2"><v>2</v></c><c r="E2"><v>189000</v></c><c r="F2"><v>12285</v></c><c r="G2" t="inlineStr"><is><t>Completed</t></is></c><c r="H2" s="1"><v>${serial("2026-09-20")}</v></c><c r="I2" s="2"><v>0.065</v></c></row>
<row r="3"><c r="A3" t="inlineStr"><is><t>5778abc002</t></is></c><c r="B3" t="inlineStr"><is><t>Celana Chino Slim</t></is></c><c r="D3"><v>1</v></c><c r="E3"><v>325000</v></c><c r="F3"><v>21125</v></c><c r="G3" t="inlineStr"><is><t>Settled</t></is></c><c r="H3" s="1"><v>${serial("2026-09-21")}</v></c><c r="I3" s="2"><v>0.065</v></c></row>
<row r="4"><c r="A4" t="inlineStr"><is><t>5778abc003</t></is></c><c r="B4" t="inlineStr"><is><t>Topi Baseball</t></is></c><c r="C4" t="inlineStr"><is><t>SKU-CAP-01</t></is></c><c r="D4"><v>1</v></c><c r="E4"><v>85000</v></c><c r="F4"><v>5525</v></c><c r="G4" t="inlineStr"><is><t>Refunded</t></is></c><c r="H4" s="1"><v>${serial("2026-09-22")}</v></c><c r="I4" s="2"><v>0.065</v></c></row>
</sheetData>
</worksheet>`;

const ENTRI = [
  { nama: "[Content_Types].xml", isi: CONTENT_TYPES },
  { nama: "_rels/.rels", isi: ROOT_RELS },
  { nama: "xl/workbook.xml", isi: WORKBOOK },
  { nama: "xl/_rels/workbook.xml.rels", isi: WORKBOOK_RELS },
  { nama: "xl/styles.xml", isi: STYLES },
  { nama: "xl/sharedStrings.xml", isi: SHARED },
  { nama: "xl/worksheets/sheet1.xml", isi: SHEET },
];

writeFileSync(join(diSini, "tiktok-orders.xlsx"), buatZip(ENTRI, 8));
writeFileSync(join(diSini, "shopee-stored.xlsx"), buatZip(ENTRI, 0));
console.log("Fixture .xlsx dibuat: tiktok-orders.xlsx (deflate), shopee-stored.xlsx (stored).");
