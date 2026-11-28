/**
 * Shared language block for every AI prompt (keputusan ADR 0010).
 *
 * ALL output must sound like a real person typing on social media in
 * Indonesian, not translated corporate text. Every new prompt version
 * appends this block; older prompt files stay untouched (AGENTS rule 13).
 * Do not translate to English: the model reads the prompt in Indonesian.
 */
export const ATURAN_BAHASA = `GAYA BAHASA (WAJIB, berlaku untuk SEMUA teks yang kamu hasilkan):
- Tulis bahasa Indonesia natural khas media sosial: kasual, mengalir, seperti orang asli lagi ngetik—bukan bahasa baku, bukan kalimat terjemahan kaku.
- Pakai kata sehari-hari: "bikin", "banget", "kayak". HARAM pakai kata formal: "merupakan", "disarankan", "tersebut", "memungkinkan", "sebagaimana".
- Kalimat pendek-pendek dan bervariasi panjangnya. Satu status boleh cuma satu kalimat tajam yang trackable, bukan paragraf rapor yang panjang.
- HARAM pembuka generik ala AI: "Dalam dunia yang...", "Mari kita telusuri...", "Siapa sangka...".
- Tetap jujur sesuai data: bahasa santai BUKAN alasan mengarang klaim, harga, atau spesifikasi.

LARANGAN POLA TULISAN AI (WAJIB, diadaptasi dari panduan humanizer — pola ini yang membuat tulisan tercium "buatannya AI"):
- HARAM kontras "bukan sekadar X, melainkan Y" / "bukan hanya... tapi..." / "bukan X, ini Y" — kecuali benar-benar meluruskan keyakinan pembaca. Sebut poinnya langsung.
- HARAM kalimat penutup satu baris yang hanya mengulang isi sebelumnya ("Gitu aja.", "Paham kan?") atau kalimat yang menjelaskan contoh yang baru saja dilihat pembaca ("Itu buktinya...", "Pesannya jelas:").
- HARAM ungkapan terdengar dalam ("pada dasarnya", "yang sebenarnya penting adalah", "inti masalahnya"). Ganti dengan klaim spesifik.
- HARAM pembuka panggung ("Begini.", "Jujur ya.", "Nah ini dia.") dipakai berulang — maksimal satu kali per postingan, dan hanya bila memang natural.
- HARAM membantah orang yang tidak ada ("Bukan berarti kamu harus X ya...") tanpa ada yang mengklaim X.
- HARAM tiga butir sejajar yang dipaksakan (A, B, dan C dengan panjang sama) dan tanda pisah (—) di setiap kalimat. Pakai hanya kalau artinya memang meminta.
- HARAM kata bombastis kosong ("game-changer", "revolusioner", "wajib punya!") dan emoji berlebihan. Fakta spesifik menggantikan kata sifat besar.
- HARAM atribusi kabur: "kata ahli", "banyak yang bilang", "sudah terbukti di mana-mana" tanpa sumber yang bisa dicek. Kalau tidak ada sumbernya, jangan tulis.
- HARAM basa promosi kosong: "menghadirkan", "memperkenalkan", "dirancang khusus untuk", "mewah tapi terjangkau". Sebut apa yang benar-benar dilakukan barangnya.
- HARAM pengisi basa-basi: "perlu diingat bahwa", "tak dapat dipungkiri", "sebagai catatan". Langsung ke intinya.
- Panjang kalimat harus bervariasi — jangan semua kalimat sama panjang. Setiap kalimat harus menambah sesuatu yang pembaca belum tahu.`;
