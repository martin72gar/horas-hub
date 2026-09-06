-- Struktur pengurus lengkap per punguan. Dipisah dari punguan_users karena
-- sebagian besar pengurus (komisaris, penasehat) tidak punya akun login.
ALTER TABLE punguans ADD COLUMN IF NOT EXISTS pengurus jsonb;

UPDATE punguans SET pengurus = '{
  "judul": "Pengurus Parsadaan Toga Siregar, Boru, Bere Jakarta Utara",
  "periode": "2024-2028",
  "entries": [
    { "jabatan": "Ketua Umum", "orang": ["R. Siregar/br. Butarbutar (Op. Nicholas)"] },
    { "jabatan": "Ketua I", "orang": ["R. Siregar/br. Sianturi (A. Rebecca)"] },
    { "jabatan": "Ketua II", "orang": ["Y. Siregar/br. Rambe (A. Laras)"] },
    { "jabatan": "Sekretaris Umum", "orang": ["A. Siregar/br. Sitinjak (A. Putra)"] },
    { "jabatan": "Sekretaris I", "orang": ["A. Siregar/br. Simanjuntak (A. Raisa)"] },
    { "jabatan": "Sekretaris II", "orang": ["O. Siregar/br. Tampubolon"] },
    { "jabatan": "Bendahara Umum", "orang": ["M. Sitorus/br. Siregar (A. Thessa)"] },
    { "jabatan": "Bendahara I", "orang": ["J. Samosir/br. Siregar (A. Valeri)"] },
    { "jabatan": "Komisaris I", "wilayah": "Cilincing-Kb Baru", "orang": ["P. Simatupang/br. Siregar (A. David)", "H. Siregar/br. Sitompul (A. Leni)"] },
    { "jabatan": "Komisaris II", "wilayah": "Semper-Sukapura", "orang": ["A. Siregar/br. Sirait (A. Yuni)"] },
    { "jabatan": "Komisaris III", "wilayah": "Lagoa-Jaya-Kalibaru", "orang": ["M. Sitanggang/br. Siregar (A. Oktavia)"] },
    { "jabatan": "Komisaris IV", "wilayah": "Plumpang B-Alur Laut-Walang", "orang": ["B. Siregar/br. Tambunan (Op. Si Jonathan)"] },
    { "jabatan": "Komisaris V", "wilayah": "Tanah Merah Koramil-STM Walang", "orang": ["B. Siregar/br. Sihombing (A. Angel)"] },
    { "jabatan": "Komisaris VI", "wilayah": "Tanah Merah Atas", "orang": ["F. Siregar/br. Sinurat (A. Prancis)"] },
    { "jabatan": "Komisaris VII", "wilayah": "Kelapa Gading-Kodamar", "orang": ["St. SM. Siregar/br. Tambunan (A. Gideon)"] },
    { "jabatan": "Komisaris VIII", "wilayah": "Swasembada-Warakas-Papanggo", "orang": ["J. Siregar/br. Sipahutar (A. Priska)", "M. Siregar/br. Siahaan (A. Christine)"] },
    { "jabatan": "Komisaris IX", "wilayah": "Ancol-Pademangan-Sunter Podomoro", "orang": ["H. Siregar/br. Tamba (A. Ester)", "R. Hutasoit/br. Siregar (A. Adi Candra)"] },
    { "jabatan": "Penasehat", "orang": ["Drs. T. Siregar, MM/br. Sibarani (Op. Alecia)"] }
  ]
}'::jsonb
WHERE slug = 'patogar-jakut';
