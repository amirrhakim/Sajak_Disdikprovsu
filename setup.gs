/**
 * ============================================================================
 * SAJAK (Sistem Rekapitulasi Pajak) - Script Inisialisasi & Safe Migration
 * File: setup.gs
 * Dinas Pendidikan Provinsi Sumatera Utara
 *
 * ATURAN SAFE MIGRATE (NON-DESTRUKTIF):
 * Script ini mengecek eksistensi sheet & isi data terlebih dahulu.
 * Jika data sudah ada, script DILARANG menghapus/clear() data pengguna;
 * hanya menambahkan kolom yang kurang, memperbarui header, dan melengkapi
 * akun UNIT_DINAS yang belum terdaftar.
 * ============================================================================
 */

var SETUP_HEADER_BG = '#047857';
var SETUP_UNIT_DINAS = [
  ['CABDIS01', 'Cabang Dinas Wilayah I'], ['CABDIS02', 'Cabang Dinas Wilayah II'],
  ['CABDIS03', 'Cabang Dinas Wilayah III'], ['CABDIS04', 'Cabang Dinas Wilayah IV'],
  ['CABDIS05', 'Cabang Dinas Wilayah V'], ['CABDIS06', 'Cabang Dinas Wilayah VI'],
  ['CABDIS07', 'Cabang Dinas Wilayah VII'], ['CABDIS08', 'Cabang Dinas Wilayah VIII'],
  ['CABDIS09', 'Cabang Dinas Wilayah IX'], ['CABDIS10', 'Cabang Dinas Wilayah X'],
  ['CABDIS11', 'Cabang Dinas Wilayah XI'], ['CABDIS12', 'Cabang Dinas Wilayah XII'],
  ['CABDIS13', 'Cabang Dinas Wilayah XIII'], ['CABDIS14', 'Cabang Dinas Wilayah XIV'],
  ['SEKRETARIAT', 'Sekretariat Dinas Pendidikan'],
  ['BID-SMA', 'Bidang Pembinaan SMA'], ['BID-SMK', 'Bidang Pembinaan SMK'],
  ['BID-PKLK', 'Bidang PKLK'], ['BID-PTK', 'Bidang PTK'],
  ['UPTD-TIK', 'UPTD TIK']
];

/**
 * Menerapkan gaya visual baku header (Emerald #047857, teks putih tebal)
 */
function setupStyleHeader_(range) {
  range.setBackground(SETUP_HEADER_BG).setFontColor('#FFFFFF').setFontWeight('bold');
}

/**
 * Memastikan jumlah kolom fisik sheet mencukupi tanpa menyentuh baris data
 */
function setupEnsureColumns_(sheet, minColumns) {
  var maxCols = sheet.getMaxColumns();
  if (maxCols < minColumns) {
    sheet.insertColumnsAfter(maxCols, minColumns - maxCols);
  }
}

/**
 * Menyelaraskan judul sel header pada baris 1 secara non-destruktif
 */
function setupHeaderCell_(sheet, col, title) {
  var cell = sheet.getRange(1, col);
  if (String(cell.getDisplayValue() || '').trim() !== title) {
    cell.setValue(title);
  }
  setupStyleHeader_(cell);
}

/**
 * Fungsi utama inisialisasi & migrasi aman (Safe Migration) Database SAJAK
 */
function setupDatabase() {
  try {
    var ss = typeof getActiveSpreadsheet_ === 'function'
      ? getActiveSpreadsheet_()
      : SpreadsheetApp.getActiveSpreadsheet();

    if (!ss) {
      throw new Error('Spreadsheet database SAJAK tidak ditemukan. Pastikan script terhubung ke Spreadsheet.');
    }

    // 1. Tab GOOGLE FORM REKAP PAJAK (25 Kolom: A s/d Y)
    var headersRekap = [
      'NO', 'NPSN', 'NAMA SEKOLAH', 'NO. SUB UNIT CORETAX', 'KAB/KOTA', 'CABANG DINAS',
      'URAIAN KEGIATAN', 'JENIS PENGADAAN', 'PERUSAHAAN/PENERIMA CV/UD/PT/TOKO',
      'PERUSAHAAN/PENERIMA ALAMAT', 'PERUSAHAAN/PENERIMA NPWP', 'BUKU PEMBANTU PAJAK TANGGAL',
      'BUKU PEMBANTU PAJAK JENIS PAJAK', 'NILAI PAJAK SETOR', 'JENIS PAJAK',
      'TANGGAL BILLING PAJAK', 'TRANSAKSI PEMBAYARAN PAJAK NO BILLING',
      'TRANSAKSI PEMBAYARAN PAJAK NO. FAKTUR', 'TRANSAKSI PEMBAYARAN PAJAK NO.BUKTI POTONG (BUPOT)',
      'TRANSAKSI PEMBAYARAN PAJAK NTPN', 'TRANSAKSI PEMBAYARAN PAJAK SETOR TANGGAL',
      'SUMBER DANA', 'KET', 'NILAI BELANJA', 'LINK BUKTI DOKUMEN'
    ];
    var sheetRekap = ss.getSheetByName('GOOGLE FORM REKAP PAJAK');
    if (!sheetRekap) {
      sheetRekap = ss.insertSheet('GOOGLE FORM REKAP PAJAK');
      setupEnsureColumns_(sheetRekap, headersRekap.length);
      sheetRekap.getRange(1, 1, 1, headersRekap.length).setValues([headersRekap]);
      setupStyleHeader_(sheetRekap.getRange(1, 1, 1, headersRekap.length));
      sheetRekap.setFrozenRows(1);
    } else {
      // Safe Migrate: hanya pastikan jumlah kolom & header tanpa menghapus data eksisting
      setupEnsureColumns_(sheetRekap, headersRekap.length);
      setupHeaderCell_(sheetRekap, 14, 'NILAI PAJAK SETOR');
      setupHeaderCell_(sheetRekap, 24, 'NILAI BELANJA');
      setupHeaderCell_(sheetRekap, 25, 'LINK BUKTI DOKUMEN');
      if (sheetRekap.getFrozenRows() < 1) sheetRekap.setFrozenRows(1);
    }

    // 2. Tab FORM PEMBUATAN SUB UNIT (27 Kolom: A s/d AA)
    var headersUnit = [
      'NO', 'NPSN', 'NAMA SEKOLAH', 'ALAMAT SEKOLAH', 'KELURAHAN/DESA', 'KECAMATAN',
      'KAB/KOTA', 'PROVINSI', 'NAMA KEPALA SEKOLAH / KPA', 'NIK KEPALA SEKOLAH / KPA',
      'NAMA BENDAHARA / BPP', 'NIK BENDAHARA / BPP', 'CABANG DINAS', 'KET', 'NO. SUB UNIT CORETAX',
      'TIPE SEKOLAH',
      'NIP KPA', 'PANGKAT/GOL KPA', 'JABATAN KPA',
      'NIP BENDAHARA', 'PANGKAT/GOL BENDAHARA', 'JABATAN BENDAHARA',
      'NAMA PPTK', 'NIP PPTK', 'NIK PPTK', 'PANGKAT/GOL PPTK', 'JABATAN PPTK'
    ];
    var sheetUnit = ss.getSheetByName('FORM PEMBUATAN SUB UNIT');
    if (!sheetUnit) {
      sheetUnit = ss.insertSheet('FORM PEMBUATAN SUB UNIT');
      setupEnsureColumns_(sheetUnit, headersUnit.length);
      sheetUnit.getRange(1, 1, 1, headersUnit.length).setValues([headersUnit]);
      setupStyleHeader_(sheetUnit.getRange(1, 1, 1, headersUnit.length));
      sheetUnit.setFrozenRows(1);
    } else {
      // Safe Migrate: selaraskan seluruh header 27 kolom tanpa menyentuh baris data
      setupEnsureColumns_(sheetUnit, headersUnit.length);
      for (var u = 0; u < headersUnit.length; u++) {
        setupHeaderCell_(sheetUnit, u + 1, headersUnit[u]);
      }
      if (sheetUnit.getFrozenRows() < 1) sheetUnit.setFrozenRows(1);
    }

    // 3. Tab Akun Operator (7 Kolom: A s/d G)
    var headersAkun = ['USERNAME', 'PASSWORD', 'NPSN', 'NAMA OPERATOR', 'STATUS', 'ROLE', 'LOGIN TERAKHIR'];
    var sheetAkun = ss.getSheetByName('Akun Operator');
    if (!sheetAkun) {
      sheetAkun = ss.insertSheet('Akun Operator');
      setupEnsureColumns_(sheetAkun, headersAkun.length);
      // Proteksi leading zero dengan tanda petik tunggal pada kode/username/password
      var initialAccounts = [
        headersAkun,
        ["'10210455", "'pajak2026", "'10210455", 'Operator SMAN 1 Medan', 'AKTIF', 'OPERATOR', ''],
        ["'admin", "'adminpajak2026", "'ADMIN", 'Administrator Pajak Disdik Provsu', 'AKTIF', 'ADMIN', '']
      ];
      sheetAkun.getRange(1, 1, initialAccounts.length, headersAkun.length).setValues(initialAccounts);
      setupStyleHeader_(sheetAkun.getRange(1, 1, 1, headersAkun.length));
      sheetAkun.setFrozenRows(1);
    } else {
      setupEnsureColumns_(sheetAkun, headersAkun.length);
      var roleHeader = String(sheetAkun.getRange(1, 6).getDisplayValue() || '').trim().toUpperCase();
      var loginHeader = String(sheetAkun.getRange(1, 7).getDisplayValue() || '').trim().toUpperCase();
      if (!roleHeader || roleHeader === 'ROLE') {
        setupHeaderCell_(sheetAkun, 6, 'ROLE');
      }
      if (!loginHeader || loginHeader === 'LOGIN TERAKHIR') {
        setupHeaderCell_(sheetAkun, 7, 'LOGIN TERAKHIR');
      }
      if (sheetAkun.getFrozenRows() < 1) sheetAkun.setFrozenRows(1);

      // Lengkapi kolom ROLE yang masih kosong secara batch menggunakan getDisplayValues()
      if (sheetAkun.getLastRow() >= 2) {
        var roleRange = sheetAkun.getRange(2, 6, sheetAkun.getLastRow() - 1, 1);
        var roleValues = roleRange.getDisplayValues();
        var changedRoles = false;
        for (var akunIdx = 0; akunIdx < roleValues.length; akunIdx++) {
          if (!String(roleValues[akunIdx][0] || '').trim()) {
            roleValues[akunIdx][0] = 'OPERATOR';
            changedRoles = true;
          }
        }
        if (changedRoles) {
          roleRange.setValues(roleValues);
        }
      }
    }

    // 3b. Penyediaan otomatis 20 akun UNIT_DINAS (non-destruktif, tidak menimpa akun eksisting)
    var created = seedUnitDinasAccounts_(sheetAkun);

    // 4. Tab Master Referensi (7 Kolom: A s/d G)
    var sheetMaster = ss.getSheetByName('Master Referensi');
    var headersMaster = [
      'JENIS PENGADAAN', 'BPP JENIS PAJAK (KOLOM 13)', 'JENIS PAJAK RINCIAN (KOLOM 15)', 'SUMBER DANA',
      'REKANAN NAMA', 'REKANAN ALAMAT', 'REKANAN NPWP'
    ];
    if (!sheetMaster) {
      sheetMaster = ss.insertSheet('Master Referensi');
      setupEnsureColumns_(sheetMaster, headersMaster.length);
      sheetMaster.getRange(1, 1, 1, headersMaster.length).setValues([headersMaster]);
      setupStyleHeader_(sheetMaster.getRange(1, 1, 1, headersMaster.length));
      sheetMaster.setFrozenRows(1);

      // Data dummy / contoh awal khusus di setup.gs dengan proteksi leading zero pada NPWP 16 digit
      var sampleMaster = [
        ['Barang', 'PPh Pasal 21', 'PPh 21 - Pegawai Tetap / Honor', 'BOS Reguler', 'CV Berkah Jaya', 'Jl. Setia Budi No. 12, Medan', "'0123456789012345"],
        ['Jasa Lainnya', 'PPh Pasal 22', 'PPh 22 - Belanja Barang Pemerintah', 'BOS Kinerja', 'UD Maju Mandiri', 'Jl. Sudirman No. 45, Lubuk Pakam', "'0987654321098765"],
        ['Konstruksi', 'PPh Pasal 23', 'PPh 23 - Jasa Sewa / Katering / Lainnya', 'APBD', 'PT Sentosa Abadi', 'Jl. Binjai KM 10', "'0234567890123456"],
        ['Konsultansi', 'PPh Pasal 4(2)', 'PPh Final Pasal 4 Ayat 2 - Jasa Konstruksi / Sewa Tanah', 'Komite', '', '', ''],
        ['PPN', 'PPN', 'PPN Dalam Negeri (Faktur Pajak)', 'Lainnya', '', '', '']
      ];
      sheetMaster.getRange(2, 1, sampleMaster.length, headersMaster.length).setValues(sampleMaster);
    } else {
      // Safe Migrate: cukup update struktur header 7 kolom tanpa menghapus data eksisting
      setupEnsureColumns_(sheetMaster, headersMaster.length);
      for (var m = 0; m < headersMaster.length; m++) {
        setupHeaderCell_(sheetMaster, m + 1, headersMaster[m]);
      }
      if (sheetMaster.getFrozenRows() < 1) sheetMaster.setFrozenRows(1);
    }

    // 5. Bersihkan seluruh cache Master Data agar perubahan langsung sinkron
    clearSetupMasterCache_();

    // Sinkronisasi paksa seluruh penulisan ke Google Sheets
    SpreadsheetApp.flush();

    var waktuSelesai = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    Logger.log(
      '[' + waktuSelesai + ' WIB] Safe Migration selesai! Seluruh tab sudah selaras ' +
      '(Rekap 25 kolom, Sub Unit 27 kolom, Akun 7 kolom, Master 7 kolom). ' +
      'Akun UNIT_DINAS baru dibuat: ' + created + '.'
    );
  } catch (err) {
    Logger.log('Gagal menjalankan setupDatabase(): ' + (err.message || String(err)));
    throw err;
  }
}

/**
 * Menambahkan 20 akun UNIT_DINAS secara batch jika belum terdaftar (idempoten & aman leading zero)
 */
function seedUnitDinasAccounts_(sheetAkun) {
  var existing = {};
  if (sheetAkun.getLastRow() >= 2) {
    var rows = sheetAkun.getRange(2, 1, sheetAkun.getLastRow() - 1, 3).getDisplayValues();
    for (var i = 0; i < rows.length; i++) {
      var uKey = String(rows[i][0] || '').trim().toUpperCase();
      var nKey = String(rows[i][2] || '').trim().toUpperCase();
      if (uKey) existing[uKey] = true;
      if (nKey) existing[nKey] = true;
    }
  }

  var toAdd = [];
  var logLines = [];
  for (var k = 0; k < SETUP_UNIT_DINAS.length; k++) {
    var code = SETUP_UNIT_DINAS[k][0];
    var name = SETUP_UNIT_DINAS[k][1];
    if (existing[code]) continue;
    var password = Utilities.getUuid().replace(/-/g, '').substring(0, 12);
    // Gunakan tanda petik tunggal agar kode & password selalu tersimpan sebagai teks murni
    toAdd.push(["'" + code, "'" + password, "'" + code, name, 'AKTIF', 'UNIT_DINAS', '']);
    logLines.push(code + ' | ' + password + ' | ' + name);
  }

  if (toAdd.length) {
    sheetAkun.getRange(sheetAkun.getLastRow() + 1, 1, toAdd.length, 7).setValues(toAdd);
    Logger.log('KREDENSIAL AWAL UNIT_DINAS (username | password | unit):\n' + logLines.join('\n'));
  }
  return toAdd.length;
}

/**
 * Helper pembersihan cache master chunked & legacy
 */
function clearSetupMasterCache_() {
  try {
    if (typeof clearMasterDataCache_ === 'function') {
      clearMasterDataCache_();
      return;
    }
    var cache = CacheService.getScriptCache();
    cache.remove('SAJAK_MASTER_CACHE_V3');
    ['SAJAK_MASTER_CHUNKED_V5', 'SAJAK_MASTER_CHUNKED_V4'].forEach(function(baseKey) {
      var meta = cache.get(baseKey + '_META');
      var keys = [baseKey, baseKey + '_META'];
      if (meta) {
        try {
          var mObj = JSON.parse(meta);
          if (mObj && mObj.count) {
            for (var k = 0; k < mObj.count; k++) keys.push(baseKey + '_' + k);
          }
        } catch (ce) {}
      }
      cache.removeAll(keys);
    });
  } catch (e) {}
}