-- Berikut langkah yang umum dan aman untuk menggantikan nilai materi di kolom mat_single_request.material_group_code (sekarang berisi code) menjadi referensi id dari mat_item_group.id. Saya sertakan juga query pemeriksaan sebelum/telah migrasi dan opsi untuk tetap mempertahankan nama kolom lama atau mengganti ke nama baru (disarankan: material_group_id).
-- 
-- - Langkah singkat:
--   1. Cek nilai yang tidak ter-map (unmatched codes).
--   2. Tambah kolom baru untuk menyimpan id (material_group_id).
--   3. Isi kolom baru berdasarkan join dengan mat_item_group (match code -> id).
--   4. Verifikasi hasil.
--   5. (Opsional) Tambah foreign key / index.
--   6. Setelah diverifikasi, hapus kolom lama dan (opsional) rename kolom baru.
-- 
-- SQL untuk seluruh alur (PostgreSQL). Jalankan tiap bagian dan periksa hasil sebelum melanjutkan ke bagian berikutnya.
-- 1) Tampilkan kode yang tidak memiliki pasangan di mat_item_group (cek sebelum migrasi)
SELECT msr.material_group_code,
       COUNT(*) AS occurences
FROM mat_single_request msr
LEFT JOIN mat_item_group mig ON msr.material_group_code = mig.code
WHERE mig.id IS NULL
GROUP BY msr.material_group_code
ORDER BY occurences DESC;

-- 2) Tambah kolom baru untuk menyimpan id (nullable sementara)
ALTER TABLE mat_single_request
ADD COLUMN material_group_id int4;

-- 3) Isi kolom baru berdasarkan match code -> id
UPDATE mat_single_request msr
SET material_group_id = mig.id
FROM mat_item_group mig
WHERE msr.material_group_code = mig.code;

-- 4) Verifikasi jumlah baris dan jumlah yang berhasil di-map
SELECT
  COUNT(*) AS total_rows,
  COUNT(material_group_id) FILTER (WHERE material_group_id IS NOT NULL) AS mapped_rows,
  COUNT(material_group_id) FILTER (WHERE material_group_id IS NULL) AS unmapped_rows
FROM mat_single_request;

-- 5) (Opsional) Lihat beberapa contoh baris yang sudah ter-map
SELECT msr.id, msr.request_no, msr.material_group_code, msr.material_group_id, mig.code AS mg_code, mig."name" AS mg_name
FROM mat_single_request msr
LEFT JOIN mat_item_group mig ON msr.material_group_id = mig.id
LIMIT 50;

-- 6) (Opsional) Tambah index untuk kolom baru agar query menjadi cepat
CREATE INDEX IF NOT EXISTS idx_mat_single_request_material_group_id ON mat_single_request (material_group_id);

-- 7) (Opsional, jika semua sudah OK) Tambah foreign key constraint
-- Pastikan tidak ada unmapped_rows sebelum menjalankan ini; jika ada, perbaiki terlebih dahulu.
ALTER TABLE mat_single_request
ADD CONSTRAINT fk_mat_single_request_item_group
FOREIGN KEY (material_group_id) REFERENCES mat_item_group(id);

-- 8) Pilihan A: Hapus kolom lama dan pakai nama baru material_group_id (direkomendasikan)
ALTER TABLE mat_single_request DROP COLUMN material_group_code;

-- 9) Pilihan B (alternatif): Jika Anda ingin menggantikan kolom lama tetapi mempertahankan nama kolom lama (material_group_code)
--    HATI-HATI: kolom akan berisi id (integer) meskipun nama menunjukkan "code".
--    Jika memilih ini, jalankan setelah Opsi 8 tidak dijalankan:
-- ALTER TABLE mat_single_request RENAME COLUMN material_group_id TO material_group_code;

-- Catatan:
-- - Jangan jalankan langkah 8 atau 9 sampai Anda yakin mapping sudah benar.
-- - Jika Anda memilih men-rename sehingga nama tetap 'material_group_code', pastikan aplikasi/consumer menyesuaikan tipe nilai (sebelumnya string code, sekarang integer id).
-- - Jika ada kode yang tidak ter-map (unmapped_rows > 0), identifikasi dan perbaiki (mis. tambahkan record di mat_item_group atau set material_group_id NULL/ke default) sebelum menambahkan FK dan menghapus kolom lama.
-- Beri tahu saya jika Anda mau:
-- - Saya sertakan skrip yang membuat backup (mis. salin tabel ke mat_single_request_bkp) sebelum migrasi.
-- - Atau Anda ingin saya gunakan nama kolom akhir tetap "material_group_code" (meskipun berisi id) atau nama baru "material_group_id".