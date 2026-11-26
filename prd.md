# 📄 SPESIFIKASI KEBUTUHAN PRODUK (PRD) & MASTER CONTEXT: SAJAK
## SISTEM REKAPITULASI PAJAK SATUAN PENDIDIKAN & UNIT KERJA DINAS
### DINAS PENDIDIKAN PROVINSI SUMATERA UTARA

================================================================================
ZONA ATAS: SPESIFIKASI KEBUTUHAN PRODUK (BLUEPRINT AWAL)
================================================================================

## 1. Identitas Produk & Problem Statement
* **Nama Sistem:** SAJAK (Sistem Rekapitulasi Pajak)
* **Pemilik Produk:** Dinas Pendidikan Provinsi Sumatera Utara
* **Target Pengguna:**
  1. Bendahara Sekolah (SMA, SMK, SLB Negeri se-Sumatera Utara)
  2. Bendahara & Pengelola Keuangan Unit Kerja Dinas (14 Cabang Dinas, Sekretariat, Bidang SMA, SMK, PKLK, PTK, dan UPTD TIK)
  3. Administrator Keuangan Dinas Pendidikan Provinsi Sumatera Utara
* **Problem Statement:**
  Sebelum adanya SAJAK, rekapitulasi pemotongan dan penyetoran pajak belanja sekolah (BOSP, BPOPP, DAK, APBD) dilakukan secara terpisah-pisah, lambat, rentan salah hitung, serta menyulitkan pemantauan kepatuhan Nomor Transaksi Penerimaan Negara (NTPN) dan integrasi akun Coretax DJP (NITKU 22 digit). SAJAK mendigitalisasi seluruh rantai pelaporan pajak sekolah secara terpusat, real-time, dan akuntabel.

## 2. Peran Pengguna & Hak Akses (Role Matrix)
1. **OPERATOR (Sekolah):**
   * Login menggunakan 8 digit NPSN dan password.
   * Wajib melengkapi & menyimpan Profil Satuan Pendidikan (KPA, Bendahara, NITKU, Alamat) sebelum menginput pajak.
   * Input transaksi pajak belanja (ATK, Modal, Jasa, Makan Minum, SIPLah, dll.).
   * Melihat riwayat transaksi mandiri, mencetak bukti rekapitulasi, dan melakukan Susul NTPN.
   * Import BKU ARKAS secara massal.
2. **UNIT_DINAS (Cabang Dinas Wilayah I s/d XIV & Bidang Dinas):**
   * Login menggunakan kode unit (misal: `CABDIS01` s/d `CABDIS14`, `SEKRETARIAT`, `BID-SMA`, dll.).
   * Mengelola Profil Unit Kerja Dinas (KPA, PPTK, BPP, Wilayah Binaan).
   * Input pajak unit kerja dinas.
   * Khusus Akun Cabang Dinas: Mengakses tab **Monitoring Sekolah Binaan** untuk memantau kelengkapan profil, login aktif, status transaksi, dan kepatuhan NTPN sekolah di wilayah binaannya secara presisi (tanpa salah wilayah).
3. **ADMIN (Dinas Pendidikan Provinsi):**
   * Hak akses penuh terhadap seluruh data sekolah dan unit dinas se-Sumatera Utara.
   * Dashboard Overview & Statistik Provinsi.
   * Radar Kepatuhan Sekolah & Unit Dinas (pencarian, filter Cabdis/status, dan modal ringkasan profil lengkap).
   * Rekonsiliasi Pajak Keseluruhan (Ekspor Excel berstandar BPK / Inspektorat).
   * Manajemen Akun (Reset password, aktivasi/blokir, tambah akun, generate massal dari Data NPSN).
   * Fitur Pemisahan Arsip Transaksi Tahunan (*speed & scale innovation*).

## 3. Arsitektur & Lingkungan Kerja
* **Platform:** Google Apps Script Web App (Standalone / Container-Bound).
* **Database:** Google Sheets terintegrasi (multi-tab: `GOOGLE FORM REKAP PAJAK`, `FORM PEMBUATAN SUB UNIT`, `AKUN OPERATOR`, `MASTER REFERENSI`, `DATA NPSN`, `SUB UNIT SEKOLAH`, `SUB UNIT BIDANG-CABDIS`, `BPMP`, `BP21`, `BPPU`).
* **Frontend:** Single Page Application (SPA) responsif Tailwind CSS, Font Inter, komponen visual Anti-AI, Fluid Table Typography, Micro-Interactions, dan zero-dependency modern JavaScript.
* **Keamanan:** Session Token berbasis `CacheService` dengan fingerprint enkripsi, proteksi multi-role, dan pemisahan hak akses per NPSN/Wilayah Cabdis.

## 4. Alur Kerja Aplikasi (User Flow)
1. **Login:** Pengguna memasukkan username/NPSN dan password.
2. **Pengecekan Profil:** Jika akun belum melengkapi profil (`!hasProfil`), sistem wajib mengarahkan ke tab Profil Unit Kerja/Satuan Pendidikan. Jika sudah lengkap, mendarat di formulir Input Pajak.
3. **Perekaman Pajak:** Pengguna memilih jenis pengadaan, mengisi rekanan (auto-fill dari Master Rekanan), memilih jenis pajak BPP (otomatis cascading kode objek pajak Coretax), menghitung nilai pajak, dan menyimpan transaksi ke Google Sheets dengan mekanisme penguncian (*LockService*).
4. **Monitoring & Rekonsiliasi:** Cabdis memantau sekolah binaannya, Admin memantau kepatuhan provinsi dan mengunduh paket audit Excel.

================================================================================
ZONA BAWAH: MASTER CONTEXT & LOGIKA SISTEM TERKINI (LIVING CONTEXT)
================================================================================

## 1. Pemetaan Indeks Kolom Baku (0-Based Index Mapping)

### A. Tabel `GOOGLE FORM REKAP PAJAK` (`COL_REKAP` - 25 Kolom, A s/d Y)
* `0 (A)`: Nomor Urut Transaksi (`NO`)
* `1 (B)`: 8 Digit NPSN / Kode Unit (`NPSN`)
* `2 (C)`: Nama Satuan Pendidikan / Unit (`NAMA_SEKOLAH`)
* `3 (D)`: Nomor Sub Unit Coretax / NITKU 22 Digit (`CORETAX`)
* `4 (E)`: Kabupaten / Kota / Wilayah Binaan (`KAB_KOTA`)
* `5 (F)`: Cabang Dinas Pendidikan (`CABDIN`)
* `6 (G)`: Uraian Belanja / Transaksi (`URAIAN`)
* `7 (H)`: Jenis Pengadaan Barang/Jasa (`JENIS_PENGADAAN`)
* `8 (I)`: Nama Toko / Rekanan Penyedia (`NAMA_REKANAN`)
* `9 (J)`: Alamat Rekanan (`ALAMAT_REKANAN`)
* `10 (K)`: NPWP / NIK Rekanan 16 Digit (`NPWP_REKANAN`)
* `11 (L)`: Tanggal Buku Kas / Belanja (`BPP_TANGGAL`)
* `12 (M)`: Kategori Jenis Pajak BPP (`BPP_JENIS_PAJAK`: PPh 21, 22, 23, 4(2), PPN)
* `13 (N)`: Nilai Nominal Pajak (`NILAI_PAJAK`)
* `14 (O)`: Rincian / Kode Objek Pajak Coretax (`JENIS_PAJAK_RINCIAN`)
* `15 (P)`: Tanggal Kode Billing (`TGL_BILLING`)
* `16 (Q)`: Nomor Kode Billing Pajak (`NO_BILLING`)
* `17 (R)`: Nomor Faktur Pajak (`NO_FAKTUR`)
* `18 (S)`: Nomor Bukti Potong (`NO_BUPOT`)
* `19 (T)`: Nomor Transaksi Penerimaan Negara (`NTPN`)
* `20 (U)`: Tanggal Setor NTPN (`TGL_SETOR`)
* `21 (V)`: Sumber Dana Belanja (`SUMBER_DANA`)
* `22 (W)`: Keterangan Transaksi (`KET`)
* `23 (X)`: Nilai Belanja Bruto (`NILAI_BELANJA`)
* `24 (Y)`: Tautan Bukti Setor / Nota (`LINK_BUKTI`)

### B. Tabel `FORM PEMBUATAN SUB UNIT` (`COL_UNIT` - 27 Kolom, A s/d AA)
* `0..2`: NO, NPSN, NAMA_SEKOLAH
* `3..7`: ALAMAT, KELURAHAN, KECAMATAN, KAB_KOTA, PROVINSI
* `8..11`: NAMA_KASEK, NIK_KASEK, NAMA_BENDAHARA, NIK_BENDAHARA
* `12..15`: CABDIN, KET, CORETAX (NITKU 22 Digit), TIPE (SMA/SMK/SLB)
* `16..18`: NIP_KPA, PANGKAT_KPA, JABATAN_KPA
* `19..21`: NIP_BPP, PANGKAT_BPP, JABATAN_BPP
* `22..26`: NAMA_PPTK, NIP_PPTK, NIK_PPTK, PANGKAT_PPTK, JABATAN_PPTK

### C. Tabel `AKUN OPERATOR` (`COL_AKUN` - 7 Kolom, A s/d G)
* `0`: USERNAME, `1`: PASSWORD, `2`: NPSN, `3`: NAMA_OPERATOR, `4`: STATUS, `5`: ROLE, `6`: LAST_LOGIN

### D. Tabel `MASTER REFERENSI` (`COL_MASTER` - 7 Kolom, A s/d G)
* `0`: JENIS_PENGADAAN, `1`: BPP_PAJAK, `2`: RINCIAN_PAJAK, `3`: SUMBER_DANA, `4`: REKANAN_NAMA, `5`: REKANAN_ALAMAT, `6`: REKANAN_NPWP

## 2. Pemetaan Resmi 14 Wilayah Cabang Dinas (CABDIS_OFFICIAL_MAP)
* Wilayah I: Medan, Deli Serdang
* Wilayah II: Binjai, Langkat
* Wilayah III: Tebing Tinggi, Serdang Bedagai
* Wilayah IV: Karo, Dairi, Pakpak Bharat
* Wilayah V: Tanjungbalai, Asahan, Batu Bara
* Wilayah VI: Pematangsiantar, Simalungun
* Wilayah VII: Labuhanbatu, Labuhanbatu Utara, Labuhanbatu Selatan
* Wilayah VIII: Toba, Samosir
* Wilayah IX: Humbang Hasundutan, Tapanuli Utara
* Wilayah X: Sibolga, Tapanuli Tengah
* Wilayah XI: Padangsidimpuan, Tapanuli Selatan, Mandailing Natal
* Wilayah XII: Padang Lawas, Padang Lawas Utara
* Wilayah XIII: Gunungsitoli, Nias, Nias Utara
* Wilayah XIV: Nias Selatan, Nias Barat

## 3. Logika Bisnis & Formula Perhitungan Pajak
1. **PPh 21:** Tarif 5% / 15% / PTKP sesuai status NPWP dan bruto.
2. **PPh 22:** Tarif 1.5% untuk belanja barang non-SIPLah di atas Rp 2.000.000 (tidak dipungut jika SIPLah atau di bawah batas).
3. **PPh 23:** Tarif 2% untuk jasa teknik, manajemen, konsultan, dan sewa selain tanah/bangunan.
4. **PPh 4(2):** Tarif 0.5% (UMKM PP 55/2022) atau tarif sewa tanah/bangunan 10%.
5. **PPN:** Tarif 11% / 12% sesuai ketentuan belanja kena pajak di atas Rp 2.000.000.
6. **SIPLah Exemption:** Sesuai PMK 58/2022, transaksi SIPLah dipungut marketplace; sistem mencatat nilai belanja dan nomor invoice dengan pajak disetor Rp 0.

## 4. Catatan Riwayat Audit & Perbaikan Arsitektur (Changelog Terkini)
* **Status Audit:** 12 Bug Kritis & 5 Optimasi Skalabilitas Berhasil Diimplementasikan 100% (44/44 Test Passed).
* **Hotfix Pasca-Audit (5 Bug Kritis `code.gs` Selesai 100% - 54/54 Test Passed):**
  1. *Eliminasi Infinite Recursion*: Memperbaiki baris pertama `getActiveSpreadsheet_()` memanggil `SpreadsheetApp.getActiveSpreadsheet()` secara langsung sehingga proses login dan pembacaan sheet lancar kembali.
  2. *Token Sesi `issuedAt` & Selective Revocation*: `createSessionToken_()` menyematkan `account.issuedAt = Date.now()`, dan `getSessionAccount_()` membandingkan timestamp anulir `revokedTs > account.issuedAt` sehingga user yang baru di-reset/diaktifkan tidak terkunci selama 6 jam.
  3. *Restorasi Simpan Satuan & Massal*: Menyelaraskan seluruh properti payload transaksi (`uraianKegiatan`, `nilaiPajakSetor`, `namaPerusahaan`, `tanggalBilling`), validasi format NPWP & No. Billing & Link Bukti, auto-binding profil resmi Coretax, format akuntansi `#,##0`, Micro-Locking instan, dan kontrak return `{ status: 'success', isEdit, rekapNo, savedRecord, updatedHistory }`.
  4. *Rekonstruksi Ekspor Rekonsiliasi BPK*: Mengalirkan parameter `{ taxes: taxRows }` ke `getFilteredAdminTransactions_()` dan memulihkan generator dokumen Excel murni (.xls) 3 bagian (Rekap Cabdis, Rekap Sumber Dana, Buku Besar 25 Kolom Lengkap) dengan proteksi format teks & nominal.
  5. *Dropdown Coretax & Kalkulator Pajak*: Menambahkan properti `label`, `kategoriBpp` via `mapJenisObjekToBppCategory_()`, memformat `tarif` sebagai string persentase (e.g. `'2%'`) agar `hitungPajakOtomatis()` tidak melempar TypeError, serta menaikkan versi cache RAM menjadi `SAJAK_MASTER_CHUNKED_V5`.
* **Perbaikan Lintas Berkas:**
  1. *Crash Login `sekolahList`*: Standarisasi objek master data dan pengamanan defensive string checking di frontend.
  2. *Dual-Contract Master Data*: Mengembalikan pasangan alias lengkap (`rekanan`/`rekananList`/`rekananMap`, `objekPajak`/`objekPajakList`, `wilayahBinaan`/`wilayahBinaanList`, `subUnitDinas`/`subUnitDinasByCode`, `npsnMap`).
  3. *Cache Chunking RAM*: Serialisasi `JSON.stringify()` otomatis pada data non-string dan pembacaan paralel instan via `cache.getAll()`.
  4. *Susul NTPN Massal*: Penambahan atribut `data-rowidx` pada elemen checkbox tabel riwayat dan fallback pencarian berbasis Nomor Transaksi + NPSN di backend.
  5. *Monitoring Wilayah Cabang Dinas*: Penyelarasan value dropdown status kepatuhan, koreksi referensi ID `#tbodyCabdisMonitoring`, penambahan state array terfilter `cabdisFilteredSchools`, dan proteksi klik ringkasan profil sekolah (Kepala Sekolah & Bendahara).
  6. *Import BKU ARKAS Massal*: Penyelarasan atribut return `savedCount` dan `count`.
  7. *Sub Unit Dinas & Penamaan Tab*: Normalisasi huruf besar `.toUpperCase()` pada `matchUnitDinasCodes_` dan penambahan alias toleran `SUB UNIT BIDANG-CABDIS` pada `getSheetCaseInsensitive_`.
  8. *Safe Database Migration*: Penghapusan perintah destruktif `deleteColumns` pada `setup.gs` demi menjamin idempotensi database 100%.
  9. *Paket Rekonsiliasi Pajak BPK*: Pemetaan parameter `tahun` ke rentang tanggal `startDate`/`endDate`, penyeragaman filter `cabdis` ke `cabdin`, serta eliminasi pembacaan ganda yang mubazir.
  10. *Daftar Sheet Arsip*: Penyelarasan atribut `archiveSheets` (`sheetName`, `name`, `rowCount`).
  11. *Pesan Sukses Arsip*: Penyertaan atribut `archiveSheetName` pada return object `archivePriorYearTransactions()`.
  12. *Deteksi Tanggal Sel Date*: Konversi otomatis objek `Date` Google Sheets menggunakan `formatDateIso()` saat mengekstrak tahun buku kas dan tahun setor.
* **Optimasi Performa & Konkurensi:**
  1. *Zero-Sheet Session Validation*: Validasi token login langsung dari `CacheService` RAM tanpa menyentuh sheet `Akun Operator` pada setiap request API.
  2. *Micro-Locking*: Pemanggilan `SpreadsheetApp.flush()` dan pelepasan `lock.releaseLock()` segera setelah operasi tulis selesai (sebelum query baca data riwayat).
  3. *Lazy Loading Pasca-Login*: Penyerahan waktu render halaman kepada client terlebih dahulu (`initialHistory: null`) dan pemanggilan riwayat pajak secara asinkron di latar belakang (< 1 detik response login).
  4. *Penyeragaman Koneksi Spreadsheet*: Seluruh pemanggilan spreadsheet diarahkan melalui fungsi tersentralisasi `getActiveSpreadsheet_()` dan `getSheet_()`.
  5. *Revocation Sesi Real-Time*: Anulir token instan via `revokeAccountSessionCache_` saat terjadi perubahan password, status dinonaktifkan, atau penghapusan akun oleh admin.
### Pembaruan Sprint 2: Penuntasan 7 Bug Logika & Runtime Lintas Berkas (23 November 2026)
* **Penuntasan Bug Kritis Backend & Frontend:**
  1. *Perbaikan Parameter `normalizeAmount_`*: Menghilangkan crash fatal (`NaN`) pada penyimpanan formulir satuan (`simpanDataRekap`) dan impor massal BKU ARKAS (`simpanBatchDataRekap`) dengan melengkapi 2 parameter (`label` dan `value`).
  2. *Sanitasi Tanda Petik Tunggal (`'`)*: Menghapus kebocoran tanda petik pada objek tanda terima (`savedRecord`) melalui `stripQuote_` di `buildTransaction_()`, memulihkan deteksi otomatis `isSiplah` (`ntpnVal === 'SIPLAH'`) dan kebersihan tampilan cetak struk.
  3. *Harmonisasi Standar Jenis Pajak BPP*: Menyeragamkan label jenis pajak di `code.gs` (`defaultBppPajak`) dan `index.html` (`taxOptions`, parser BKU, dan fungsi kalkulasi) ke format resmi: `'PPh Pasal 21'`, `'PPh Pasal 22'`, `'PPh Pasal 23'`, `'PPh Pasal 4(2)'`, dan `'PPN'`.
  4. *Peningkatan Kuota Paginasi Ekspor & Kolom Bukti Excel*: Menaikkan batas paginasi backend dari 100 menjadi 5.000 baris untuk kebutuhan cetak BPP bulanan/ekspor Excel, serta memperbaiki kolom No. Bukti pada ekspor Excel dari `item.noBukti` menjadi `item.noArkas || item.no`.
  5. *Sanitasi Tag Case-Insensitive & Spesifik Peran*: Mencegah penumpukan tag `[SIPLah]` ganda saat edit berulang dengan perbandingan case-insensitive, serta membedakan tag otomatis: Unit Dinas (`[SIPD:]` & `[E-Katalog]`) dan Sekolah (`[ARKAS:]` & `[SIPLah]`).
  6. *Validasi Strict Digit Lock & Keamanan Sesi*: Menerapkan validasi wajib NPWP (15–16 digit), No. Billing (15 digit), Tanggal Billing untuk transaksi non-SIPLah, perlindungan race condition `expectedRecordNo`, pencatatan audit log `EDIT_TRANSAKSI`, revokasi sesi instan saat admin menghapus akun, dan pembersihan cache `SAJAK_MASTER_CHUNKED_V5` di `setup.gs`.
  7. *Penyempurnaan Deteksi E-Katalog, Rekanan Riwayat, Presisi Tarif, & Modal Arsip*: Mendeteksi transaksi `E-KATALOG` pada monitoring sekolah dan cabang dinas, menggabungkan rekanan unik dari riwayat 1.000 transaksi ke dropdown master, membulatkan presisi kalkulasi tarif desimal, dan mengembalikan respons bertipe `info` pada modul arsip tahun berjalan / data kosong.
* **Status Arsitektur Monolith 3 Berkas:**
  Sistem SAJAK beroperasi 100% pada 3 berkas inti Google Apps Script: `code.gs` (Backend API & Database Handler), `setup.gs` (Inisialisasi & Migrasi Database), dan `index.html` (Frontend UI/UX SPA). Seluruh skrip pembantu di direktori `scratch/` difungsikan murni untuk verifikasi dan audit lokal.
### Pembaruan Sprint 3: Transisi Arsitektur Modular (8 Berkas) & Penuntasan Bug Monitoring Cabdis (24 November 2026)
* **Arsitektur Modular 8 Berkas Resmi:**
  Sistem SAJAK kini terstruktur secara modular menjadi 8 berkas yang saling terintegrasi melalui scriptlet Google Apps Script (`<?!= include('...'); ?>`):
  1. `code.gs`: Backend API, routing, manipulasi spreadsheet, autentikasi sesi token di RAM (CacheService), dan pemetaan kolom 0-based.
  2. `setup.gs`: Inisialisasi basis data, migrasi kolom non-destruktif (*safe migrate*), proteksi leading zero, dan pembersihan cache master V5.
  3. `index.html`: Template rangka utama Single Page Application (SPA), modal, kartu metrik, dan penyertaan modular (*modular includes*).
  4. `css.html`: Definisi styling CSS murni, scrollbar kustom, aturan cetak printer BPP bulanan, dan animasi interaksi UI.
  5. `logos.html`: Aset vektor logo SVG (Pemerintah Provinsi Sumatera Utara, Tut Wuri Handayani, dan Coretax DJP).
  6. `js_core.html`: Modul frontend inti: runtime safe server runner (`callGasServer_`), toast notifikasi mengambang, sesi autentikasi, navigasi tab, dan deteksi akun Cabdis multi-format.
  7. `js_operator.html`: Modul form transaksi, buku rekanan, impor BKU ARKAS cerdas, kalkulasi tarif PMK 59/2022 dari DPP, sinkronisasi invoice SIPLah, serta cetak dokumen BPP bulanan.
  8. `js_monitoring_admin.html`: Modul pengawasan Cabdis (menampilkan wilayah binaan resmi), radar kepatuhan sekolah, ekspor paket rekonsiliasi BPK, validasi XML komentar Excel, dan manajemen akun.

* **Penuntasan Kasus Cabdis 13 & Deteksi 14 Cabang Dinas:**
  - Fungsi `extractCabdisNumber_` mengenali angka murni 1–14, format Romawi I–XIV, variasi awalan (`Cabang Dinas`, `Cabdis`, `Cabdin`, `Wilayah`, `Wil.`, `CD`), dan pemisah garis bawah (`CABDIS_13`).
  - Fungsi `resolveCabdisScopeInfo_` menggabungkan wilayah binaan kustom dengan daftar resmi `CABDIS_OFFICIAL_MAP` tanpa menimpa daftar resmi (Cabdis 13 selalu mencakup Gunungsitoli, Nias, dan Nias Utara).
  - Fungsi `isSchoolInCabdisScope_` melakukan normalisasi nama daerah tanpa spasi/tanda baca dan menjaga batas presisi antara Nias induk (Cabdis 13) melawan Nias Selatan & Nias Barat (Cabdis 14).
  - Pembacaan sheet `DATA NPSN` dilakukan secara dinamis dengan mitigasi *merged cells* (*carry-forward*).

### Pembaruan Sprint 4: Smart Cascading Filter 14 Cabdis, Umpan Balik Loading Radar Kepatuhan, & Sanitasi Entitas Palsu (24 November 2026)
* **Smart Cascading Filter 14 Cabang Dinas (Rekap Transaksi & Radar Kepatuhan):**
  - Implementasi pemetaan frontend `CABDIS_KABKOTA_MAP` yang mencakup 14 Cabang Dinas ke Kabupaten/Kota binaan masing-masing.
  - Pada **Rekap Transaksi**, saat Admin memilih Cabang Dinas (misal Wilayah I), dropdown Kabupaten/Kota (`adminTxKabKota`) secara reaktif hanya menampilkan daerah binaan terkait (Kota Medan dan Kab. Deli Serdang). Memilih "Semua Cabang Dinas" mengembalikan daftar lengkap 33 Kabupaten/Kota.
  - Pada **Radar Kepatuhan / Entitas Sekolah**, ditambahkan elemen `<select id="adminSchoolKabKota">` dengan tata letak grid responsif 5 kolom. Pemilihan Cabang Dinas (`adminSchoolCabdin`) menyaring opsi Kabupaten/Kota secara otomatis, dan fungsi backend `getAdminSchools()` diperbarui menerima parameter `kabKotaFilter` untuk memfilter data sekolah/unit kerja secara presisi.
* **Umpan Balik Visual & Toast Notifikasi Loading Radar Kepatuhan:**
  - Saat filter aktif dipilih pada Radar Kepatuhan, isi tabel `adminSchoolBody` seketika digantikan indikator loading emerald spinner (*"Menyaring data radar kepatuhan..."*), menghilangkan efek antarmuka terasa beku (*frozen*).
  - Sistem menampilkan toast info mikro instan (*"Sedang memfilter data radar kepatuhan..."*) dan toast sukses setelah data selesai dimuat (*"Ditemukan X data unit/sekolah"*).
  - Sinkronisasi badge filter aktif (`adminSchoolFilterPills`) dan pemulihan filter instan via `resetAdminSchoolFilters()`.
* **Sanitasi Entitas Palsu "Provinsi Sumatera Utara tahun 2026":**
  - Pada `code.gs`: Menambahkan proteksi sanitasi string pada `getNormalizedNpsnSchools_()`, `registerSchoolEntry()`, dan `getAdminSchools()` untuk menolak baris judul dokumen, kop spreadsheet, atau baris metadata bertuliskan `"PROVINSI SUMATERA UTARA"`, `"PEMERINTAH PROVINSI"`, `"DINAS PENDIDIKAN"`, `"TAHUN 202"`, `"CABANG WILAYAH"`, atau `"SATUAN PENDIDIKAN"`.
  - Pada `js_core.html`: Menerapkan sanitasi serupa pada `populateMasterDropdowns()` saat menyusun `datalistSekolah` sehingga teks judul/tahun tidak pernah muncul sebagai opsi sekolah di antarmuka pengguna.

### Pembaruan Sprint 5: Restorasi Integritas DOM Tree, Eliminasi Kebocoran Layar Login, & Proporsi Lebar Tabel Radar Kepatuhan (24 November 2026)
* **Restorasi Integritas Struktur DOM `index.html`:**
  - Mengeliminasi duplikasi dua tag penutup `</div></div>` berlebih pada grid filter `adminTabSchools` yang sebelumnya memotong struktur dokumen secara prematur dan melempar tabel Radar Kepatuhan keluar dari kontainer `#adminTabSchools` dan `#appView`.
  - Mengembalikan keabsahan hierarki dokumen HTML hingga mencapai status valid mutlak: **0 Mismatched Tags & 0 Orphan Tags**.
* **Eliminasi 100% Kebocoran Latar Belakang Layar Login:**
  - Karena seluruh hierarki komponen sistem kini terbungkus rapat di dalam `<div id="appView" class="hidden">`, saat pengguna mengakses Web App pada layar login (`#loginView`), latar belakang aplikasi 100% bersih tanpa ada satu pun tabel, formulir, atau konten internal yang bocor atau terlihat di belakang kartu login.
* **Proporsi & Penyesuaian Lebar Tabel Radar Kepatuhan:**
  - Tabel data sekolah kembali terkunci di dalam kontainer utama `<main id="adminDashboard" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`, mengeliminasi pembentangan liar 100% selebar monitor (1920px).
  - Menerapkan proporsi lebar definitif persentase pada seluruh 6 kolom header tabel (`Nama Sekolah 28%`, `Cabang Dinas 18%`, `Status Profil 18%`, `Pejabat 16%`, `Transaksi 10%`, `Pajak Setor 10%`) dengan batas minimal responsif `min-w-[900px]`, menghasilkan tampilan yang padat, proporsional, rapi, dan mudah dibaca di layar laptop maupun PC desktop.

### Pembaruan Sprint 6: Retensi Permanen 14 Cabang Dinas & Smart Cascading pada Rekap Transaksi (24 November 2026)
* **Retensi Permanen 14 Cabang Dinas Resmi (`adminTxCabdin`):**
  - Mengeliminasi penimpaan opsi dropdown secara destruktif oleh `populateAdminTxDropdowns()` yang sebelumnya hanya mengambil Cabdis dari transaksi yang sudah tercatat (sehingga Cabdis dengan transaksi $0$ seperti Wilayah II, VIII, dan XII hilang).
  - Mengintegrasikan konstanta resmi `DEFAULT_OFFICIAL_CABDIS` (14 Cabang Dinas Wilayah I s/d XIV) dan `allMasterCabdinList` pada `populateAdminFilters()` dan `populateAdminTxDropdowns()`.
  - Seluruh 14 Cabdis kini **selalu tampil permanen** di dropdown Rekap Transaksi, memungkinkan Admin memverifikasi transaksi untuk wilayah mana pun secara konsisten.
* **Integrasi Penuh Smart Cascading Filter Rekap Transaksi (`adminTxKabKota`):**
  - Dropdown Kabupaten/Kota (`adminTxKabKota`) disinkronkan secara reaktif melalui `updateSmartKabKotaFilter(curCab, 'adminTxKabKota')`, sehingga saat Cabdis dipilih (misal Wilayah II), dropdown daerah binaannya (Kota Binjai & Kab. Langkat) selalu muncul akurat terlepas dari status data transaksi.
  - Pemanenan dinamis dari transaksi aktif hanya difokuskan untuk memperkaya opsi jenis pajak BPP (`adminTxBpp`) dan sumber dana (`adminTxDana`) tanpa mengurangi data referensi master.

### Pembaruan Sprint 7: Penyelarasan Buku Panduan SAJAK & Ilustrasi SVG (26 November 2026)
* **Pembaruan `BUKU_PANDUAN_SAJAK.md` (Versi 3.1):**
  - Menyelaraskan alur login (label `Username / NPSN / Kode Unit`, `Password / Kata Sandi`, pill `Portal Satuan Pendidikan & Unit Kerja Dinas`, tombol `[Masuk ke Sistem →]`).
  - Menyeragamkan nomenklatur pajak BPP resmi (`PPh Pasal 21/22/23/4(2)`, `PPN`) dan sumber dana (`BOSP Reguler/Kinerja/Afirmasi`, `BPOPP (Provinsi)`).
  - Memperbarui menu Cabang Dinas menjadi `[🏛️ Monitoring Cabdis]` dengan cakupan 14 Cabang Dinas resmi.
  - Memperbarui Bab IV Portal Admin sesuai 4 tab terbaru (`Ringkasan`, `Rekap Transaksi`, `Radar Kepatuhan`, `Akun`), fitur `📊 Rekonsiliasi Keseluruhan`, `📦 Arsip Tahun`, Filter 5 Kolom Radar Kepatuhan + loading instan, serta retensi permanen 14 Cabdis & Smart Cascading Filter (Cabdis ➡️ Kab/Kota).
* **Pembaruan Ilustrasi SVG (`assets/screenshots/`):**
  - Menggambar ulang `07_dashboard_admin.svg` agar mencerminkan tampilan terbaru 4 tab Admin, tombol `📊 Rekonsiliasi Keseluruhan` & `📦 Arsip Tahun`, filter 5 kolom Radar Kepatuhan, dan tabel 6 kolom proporsional.
  - Menyelaraskan label pajak (`PPN`) dan sumber dana (`BOSP Reguler`) pada `04_kalkulator_pajak_bagian_c_d_e.svg` dan `05_riwayat_dan_cetak_bpp.svg`.




