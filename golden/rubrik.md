# Rubrik Penilaian Golden Set

Skor per kriteria 1 sampai 5. Penilaian dilakukan manual oleh pemilik proyek, tanpa melihat versi prompt.

| Kriteria | 1 | 3 | 5 |
|---|---|---|---|
| Kesesuaian deskripsi | Banyak fakta tidak ada di deskripsi | Sebagian besar sesuai, ada satu-dua detail mengarang | Semua fakta bisa ditelusuri ke deskripsi |
| Bahasa Indonesia kasual | Kaku, terjemahan, atau campur bahasa | Bisa dibaca, tapi terasa seperti tulisan formal | Terdengar seperti orang bicara di Threads atau TikTok |
| Tanpa klaim tak terbukti | Ada klaim berlebihan atau harga | Ada satu klaim yang perlu dicek | Tidak ada klaim tanpa dasar, ada klaim yang ditandai |
| Variasi antarstatus | Semua status mirip bentuk dan panjangnya | Sebagian variasi | Panjang, bentuk, dan pembuka berbeda, sesuai Anti AI Slop |
| Kepatuhan karakter | Ada status melewati 500 karakter setelah retry | Lolos, tapi ada yang mepet batas | Semua status jauh di bawah batas dan sesuai pengaturan |

## Catatan penilaian
- Kepatuhan karakter juga diperiksa otomatis. Skor manual hanya untuk kualitas, bukan untuk menghitung karakter.
- Jika JSON gagal validasi, produk dianggap gagal di semua kriteria dan tidak dinilai manual.
- Simpan alasan untuk setiap skor di bawah 3.
