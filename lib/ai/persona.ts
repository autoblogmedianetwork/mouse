/**
 * Persona for the generate settings (PRD F3a).
 *
 * Personas are data here, not hardcoded options in a component: the settings
 * UI and prompt 03 v2 read the same list. A persona is a generate parameter,
 * so the selected id is stored per draft in `Pengaturan.persona`.
 *
 * No AI call and no API key is involved: this module is plain data + resolvers.
 */

/** Stable ids. `bawaan` is the default (F3a). */
export const PERSONA_IDS = [
  "bawaan",
  "sahabat",
  "ahli",
  "pendongeng",
  "copywriter",
  "pengiklan",
  "komedian",
  "motivator",
  "spesialis-sosmed",
] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];

export interface Persona {
  id: PersonaId;
  /** Label shown in the settings UI. */
  judul: string;
  /** Tone description: helper text in the UI and persona block in the prompt. */
  deskripsi_nada: string;
  ikon: string;
}

/** Default persona; also the fallback for unknown values. */
export const PERSONA_BAWAAN: Persona = {
  id: "bawaan",
  judul: "Bawaan",
  deskripsi_nada:
    "Netral dan hangat. Mengikuti gaya Threads apa adanya tanpa arah nada khusus.",
  ikon: "🙂",
};

export const PERSONA_LIST: Persona[] = [
  PERSONA_BAWAAN,
  {
    id: "sahabat",
    judul: "Sahabat",
    deskripsi_nada:
      "Santai dan akrab, seperti mengobrol dengan teman dekat. Bahasa sehari-hari, boleh sedikit bercanda.",
    ikon: "🤝",
  },
  {
    id: "ahli",
    judul: "Ahli",
    deskripsi_nada:
      "Tenang dan informatif. Menjelaskan fungsi produk secara to the point tanpa bertele-tele.",
    ikon: "🎯",
  },
  {
    // Dikurasi dari dataset Awesome ChatGPT Prompts (ADR 0010): Storyteller.
    id: "pendongeng",
    judul: "Pendongeng",
    deskripsi_nada:
      "Cerita dulu, jualan kemudian. Mulai dari kisah/kondisi sehari-hari yang relatable, ditutup dengan produk sebagai penyelesaiannya.",
    ikon: "📖",
  },
  {
    // Dikurasi dari dataset Awesome ChatGPT Prompts (ADR 0010): Copywriter.
    id: "copywriter",
    judul: "Copywriter",
    deskripsi_nada:
      "Kata-katanya tajam dan hemat. Satu kalimat sudah jadi hook-nya; manis dipesan tapi tidak memaksa.",
    ikon: "✍️",
  },
  {
    // Dikurasi dari dataset Awesome ChatGPT Prompts (ADR 0010): Advertiser.
    id: "pengiklan",
    judul: "Pengiklan",
    deskripsi_nada:
      "Nada kampanye: manfaat disebut duluan, ajakannya tegas, dan tetap tidak melebih-lebihkan data produk.",
    ikon: "🧲",
  },
  {
    // Dikurasi dari dataset Awesome ChatGPT Prompts (ADR 0010): Stand-up Comedian.
    id: "komedian",
    judul: "Komedian",
    deskripsi_nada:
      "Bercanda ringan dari awal sampai akhir utas; boleh self-deprecating, tetapi fakta produk tetap akurat.",
    ikon: "🎭",
  },
  {
    // Dikurasi dari dataset Awesome ChatGPT Prompts (ADR 0010): Motivational Speaker.
    id: "motivator",
    judul: "Motivator",
    deskripsi_nada:
      "Membakar semangat: buka dengan kerepotan yang bikin sakit kepala, lanjut ke jalan keluarnya, produk jadi andalan.",
    ikon: "🔥",
  },
  {
    // Dikurasi dari dataset Awesome ChatGPT Prompts (ADR 0010): Social Media Manager.
    id: "spesialis-sosmed",
    judul: "Spesialis Sosmed",
    deskripsi_nada:
      "Paham algoritma media sosial: hook kuat, hashtag hemat, dan ajakan balik ke komentar. Suaranya khas warganet, bukan iklan lepas.",
    ikon: "📣",
  },
];

/**
 * Drafts saved before the persona data module stored the label ("Bawaan",
 * "Sahabat", "Ahli") instead of the id. Accepted so old local drafts still open.
 */
const LABEL_LAMA: Record<string, PersonaId> = {
  bawaan: "bawaan",
  sahabat: "sahabat",
  ahli: "ahli",
  pendongeng: "pendongeng",
  copywriter: "copywriter",
  pengiklan: "pengiklan",
  komedian: "komedian",
  motivator: "motivator",
  "spesialis-sosmed": "spesialis-sosmed",
};

/**
 * Normalizes any stored persona value to a known id. Unknown values fall back
 * to `bawaan` so a draft saved by an older build never blocks the form.
 */
export function normalkanPersonaId(nilai: string | null | undefined): PersonaId {
  const kunci = (nilai ?? "").trim().toLowerCase();
  return LABEL_LAMA[kunci] ?? PERSONA_BAWAAN.id;
}

/** Resolves a persona by id, or the default when the value is unknown. */
export function ambilPersona(nilai: string | null | undefined): Persona {
  const id = normalkanPersonaId(nilai);
  return PERSONA_LIST.find((p) => p.id === id) ?? PERSONA_BAWAAN;
}

/** One-line persona block for prompt 03 v2 ("Sahabat — santai dan akrab..."). */
export function labelPersonaUntukPrompt(nilai: string | null | undefined): string {
  const persona = ambilPersona(nilai);
  return `${persona.judul} — ${persona.deskripsi_nada}`;
}
