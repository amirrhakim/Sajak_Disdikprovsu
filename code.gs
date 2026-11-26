/**
 * ============================================================================
 * SAJAK (Sistem Rekapitulasi Pajak) - Backend Google Apps Script (code.gs)
 * Dinas Pendidikan Provinsi Sumatera Utara
 * ============================================================================
 */

/**
 * Helper pengaman string HTML untuk laporan spreadsheet & dokumen web
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
var escapehtml = escapeHtml;

/**
 * KONSTANTA PEMETAAN INDEKS KOLOM (0-BASED INDEX MAPPING)
 */
var COL_REKAP = {
  NO: 0, NPSN: 1, NAMA_SEKOLAH: 2, CORETAX: 3, KAB_KOTA: 4, CABDIN: 5,
  URAIAN: 6, JENIS_PENGADAAN: 7, NAMA_REKANAN: 8, ALAMAT_REKANAN: 9, NPWP_REKANAN: 10,
  BPP_TANGGAL: 11, BPP_JENIS_PAJAK: 12, NILAI_PAJAK: 13, JENIS_PAJAK_RINCIAN: 14,
  TGL_BILLING: 15, NO_BILLING: 16, NO_FAKTUR: 17, NO_BUPOT: 18, NTPN: 19,
  TGL_SETOR: 20, SUMBER_DANA: 21, KET: 22, NILAI_BELANJA: 23, LINK_BUKTI: 24
};
var REKAP_COLS = 25;

var COL_UNIT = {
  NO: 0, NPSN: 1, NAMA_SEKOLAH: 2, ALAMAT: 3, KELURAHAN: 4, KECAMATAN: 5,
  KAB_KOTA: 6, PROVINSI: 7, NAMA_KASEK: 8, NIK_KASEK: 9, NAMA_BENDAHARA: 10,
  NIK_BENDAHARA: 11, CABDIN: 12, KET: 13, CORETAX: 14, TIPE: 15,
  NIP_KPA: 16, PANGKAT_KPA: 17, JABATAN_KPA: 18,
  NIP_BPP: 19, PANGKAT_BPP: 20, JABATAN_BPP: 21,
  NAMA_PPTK: 22, NIP_PPTK: 23, NIK_PPTK: 24, PANGKAT_PPTK: 25, JABATAN_PPTK: 26
};
var UNIT_COLS = 27;

var COL_MASTER = {
  JENIS_PENGADAAN: 0, BPP_PAJAK: 1, RINCIAN_PAJAK: 2, SUMBER_DANA: 3,
  REKANAN_NAMA: 4, REKANAN_ALAMAT: 5, REKANAN_NPWP: 6
};
var MASTER_COLS = 7;

var COL_AKUN = {
  USERNAME: 0, PASSWORD: 1, NPSN: 2, NAMA_OPERATOR: 3, STATUS: 4, ROLE: 5, LAST_LOGIN: 6
};

var COL_DATA_NPSN = {
  NPSN_ALT: 0, NO: 1, CABDIN: 2, KAB_KOTA: 3, NPSN: 4, NAMA_SEKOLAH: 5, JENJANG: 6, STATUS: 7, KECAMATAN: 8
};

var COL_SUB_SEKOLAH = {
  NO: 0, NITKU: 1, JENIS_TKU: 2, NAMA_TKU: 3, ALAMAT: 4, KAB_KOTA: 5, KECAMATAN: 6, KELURAHAN: 7, PROVINSI: 8
};

var COL_SUB_DINAS = {
  NO: 0, NAMA_TKU: 1, WILAYAH: 2, NITKU: 3
};

var COL_OBJEK_PAJAK = {
  NO: 0, KODE: 1, NAMA: 2, JENIS: 3, SIFAT: 4, TARIF: 5, KET: 6
};

var TIPE_SEKOLAH_VALID = ['SMA', 'SMK', 'SLB'];
var DINAS_PUSAT_CODES = ['SEKRETARIAT', 'BID-SMA', 'BID-SMK', 'BID-PKLK', 'BID-PTK', 'UPTD-TIK'];

/**
 * Peta Resmi 14 Cabang Dinas Pendidikan Provinsi Sumatera Utara
 * Menghubungkan Nomor Wilayah (1..14), Angka Romawi (I..XIV), dan Kabupaten/Kota binaan.
 */
var CABDIS_OFFICIAL_MAP = [
  { num: 1,  roman: 'I',    name: 'Cabang Dinas Wilayah I',    kabKota: ['MEDAN', 'DELI SERDANG'] },
  { num: 2,  roman: 'II',   name: 'Cabang Dinas Wilayah II',   kabKota: ['BINJAI', 'LANGKAT'] },
  { num: 3,  roman: 'III',  name: 'Cabang Dinas Wilayah III',  kabKota: ['TEBING TINGGI', 'SERDANG BEDAGAI'] },
  { num: 4,  roman: 'IV',   name: 'Cabang Dinas Wilayah IV',   kabKota: ['KARO', 'DAIRI', 'PAKPAK BHARAT'] },
  { num: 5,  roman: 'V',    name: 'Cabang Dinas Wilayah V',    kabKota: ['TANJUNGBALAI', 'ASAHAN', 'BATU BARA'] },
  { num: 6,  roman: 'VI',   name: 'Cabang Dinas Wilayah VI',   kabKota: ['PEMATANGSIANTAR', 'SIMALUNGUN'] },
  { num: 7,  roman: 'VII',  name: 'Cabang Dinas Wilayah VII',  kabKota: ['LABUHANBATU', 'LABUHANBATU UTARA', 'LABUHANBATU SELATAN'] },
  { num: 8,  roman: 'VIII', name: 'Cabang Dinas Wilayah VIII', kabKota: ['TOBA', 'SAMOSIR'] },
  { num: 9,  roman: 'IX',   name: 'Cabang Dinas Wilayah IX',   kabKota: ['HUMBANG HASUNDUTAN', 'TAPANULI UTARA'] },
  { num: 10, roman: 'X',    name: 'Cabang Dinas Wilayah X',    kabKota: ['SIBOLGA', 'TAPANULI TENGAH'] },
  { num: 11, roman: 'XI',   name: 'Cabang Dinas Wilayah XI',   kabKota: ['PADANGSIDIMPUAN', 'TAPANULI SELATAN', 'MANDAILING NATAL'] },
  { num: 12, roman: 'XII',  name: 'Cabang Dinas Wilayah XII',  kabKota: ['PADANG LAWAS', 'PADANG LAWAS UTARA'] },
  { num: 13, roman: 'XIII', name: 'Cabang Dinas Wilayah XIII', kabKota: ['GUNUNGSITOLI', 'NIAS', 'NIAS UTARA'] },
  { num: 14, roman: 'XIV',  name: 'Cabang Dinas Wilayah XIV',  kabKota: ['NIAS SELATAN', 'NIAS BARAT'] }
];

/* ===================== MESIN DETEKSI WILAYAH CABANG DINAS ===================== */

/**
 * Menormalkan nama Kabupaten/Kota dengan menghapus awalan Kab/Kota dan karakter non-alfanumerik
 * agar variasi penulisan seperti "GUNUNG SITOLI" dan "GUNUNGSITOLI" selalu cocok.
 */
function normalizeRegionCompact_(str) {
  if (!str) return '';
  var s = String(str).toUpperCase().trim();
  s = s.replace(/\bKABUPATEN\b/g, ' ')
       .replace(/\bKAB\.?\b/g, ' ')
       .replace(/\bKOTA\b/g, ' ')
       .replace(/[^A-Z0-9]/g, '');
  return s;
}

/**
 * Mengekstrak Nomor Cabang Dinas (1 s/d 14) secara presisi dari berbagai format teks:
 * - Angka murni: "13", "01"
 * - Awalan baku & variasi: "CABDIS13", "CABDIS_13", "CABDIS 13", "Cabang Dinas Pendidikan Wilayah 13",
 *   "Cabang Dinas 13", "Wil. 13", "CD 13", "CABDIN-13"
 * - Angka Romawi: "Wilayah XIII", "Cabang Dinas Pendidikan Wilayah XIII", "Cabdis XIII", atau "XIII" mandiri
 */
function extractCabdisNumber_(str) {
  if (str === null || str === undefined) return 0;
  var s = String(str).toUpperCase().trim();
  if (!s) return 0;

  // 1. Angka Arab murni (misal kolom CABDIN berisi "13" atau "01")
  var mPureNum = s.match(/^0*(\d{1,2})$/);
  if (mPureNum) {
    var nPure = Number(mPureNum[1]);
    if (nPure >= 1 && nPure <= 14) return nPure;
  }

  // 2. Angka Arab dengan awalan Cabang Dinas / Cabdis / Cabdin / Wilayah / Wil / CD
  var mPrefixNum = s.match(/(?:CABANG\s+DINAS(?:\s+PENDIDIKAN)?|CABDIS|CABDIN|WILAYAH|WIL\.?|CD\.?)[-\s_.]*(?:(?:PENDIDIKAN|WILAYAH|WIL\.?)[-\s_.]*)*0*(\d{1,2})\b/i);
  if (mPrefixNum) {
    var nPref = Number(mPrefixNum[1]);
    if (nPref >= 1 && nPref <= 14) return nPref;
  }

  // 3. Angka Romawi terurut dari terpanjang ke terpendek untuk mencegah bentrok substring
  var orderedRomans = [
    ['XIV', 14], ['XIII', 13], ['XII', 12], ['XI', 11], ['X', 10],
    ['IX', 9],   ['VIII', 8],  ['VII', 7],  ['VI', 6],  ['IV', 4],
    ['V', 5],    ['III', 3],   ['II', 2],   ['I', 1]
  ];

  // 3a. Romawi mandiri (misal sel berisi "XIII" saja)
  for (var r0 = 0; r0 < orderedRomans.length; r0++) {
    if (s === orderedRomans[r0][0]) return orderedRomans[r0][1];
  }

  // 3b. Romawi didahului kata kunci Cabang Dinas / Wilayah / Wil / Cabdis / Cabdin / CD
  for (var r = 0; r < orderedRomans.length; r++) {
    var rom = orderedRomans[r][0];
    var rReg = new RegExp('(?:CABANG\\s+DINAS(?:\\s+PENDIDIKAN)?|CABDIS|CABDIN|WILAYAH|WIL\\.?|CD\\.?)[-\\s_.]*(?:(?:PENDIDIKAN|WILAYAH|WIL\\.?)[-\\s_.]*)*' + rom + '(?:\\b|$)', 'i');
    if (rReg.test(s)) return orderedRomans[r][1];
  }

  return 0;
}

/**
 * Resolves Cabdis Context (Nomor Wilayah, Romawi, Nama Baku, dan Daftar Kabupaten/Kota binaan)
 * Menggabungkan daftar resmi CABDIS_OFFICIAL_MAP dengan daftar kustom profil agar tidak pernah kehilangan wilayah binaan.
 */
function resolveCabdisScopeInfo_(account, profile) {
  if (account && account.role === 'ADMIN') {
    return { isAdmin: true, name: 'Semua Cabang Dinas', num: 0, roman: '', kabKota: [] };
  }

  var candidates = [
    account ? text_(account.npsn) : '',
    account ? text_(account.username) : '',
    account ? text_(account.namaOperator) : '',
    profile ? text_(profile.namaSekolah) : '',
    profile ? text_(profile.cabangDinas) : ''
  ];

  var targetNum = 0;
  for (var c = 0; c < candidates.length; c++) {
    var n = extractCabdisNumber_(candidates[c]);
    if (n >= 1 && n <= 14) {
      targetNum = n;
      break;
    }
  }

  if (targetNum >= 1 && targetNum <= 14) {
    var def = CABDIS_OFFICIAL_MAP[targetNum - 1];
    // Selalu mulai dari peta resmi agar wilayah binaan tidak hilang walau profil hanya berisi 1 kota kantor
    var mergedKab = def.kabKota.slice();
    var seenCompact = {};
    for (var d = 0; d < mergedKab.length; d++) {
      seenCompact[normalizeRegionCompact_(mergedKab[d])] = true;
    }

    if (profile && (profile.wilayahBinaan || profile.kabKota)) {
      var wStr = String(profile.wilayahBinaan || profile.kabKota).toUpperCase();
      var parts = wStr.split(/[,;\/&\-]+|\bDAN\b/i);
      for (var p = 0; p < parts.length; p++) {
        var clean = parts[p]
          .trim()
          .replace(/^KAB(\.|UPATEN)?\s+/i, '')
          .replace(/^KOTA\s+/i, '')
          .trim();
        var comp = normalizeRegionCompact_(clean);
        if (clean && comp && !seenCompact[comp]) {
          seenCompact[comp] = true;
          mergedKab.push(clean);
        }
      }
    }

    return {
      isAdmin: false,
      num: def.num,
      roman: def.roman,
      name: def.name,
      kabKota: mergedKab
    };
  }

  var fallbackName = profile && profile.namaSekolah ? profile.namaSekolah : (account && account.namaOperator ? account.namaOperator : 'Cabang Dinas');
  return {
    isAdmin: false,
    num: 0,
    roman: '',
    name: fallbackName,
    kabKota: []
  };
}

/**
 * Memeriksa apakah sebuah sekolah masuk dalam cakupan pengawasan Cabdis secara presisi.
 * Mendukung pencocokan nomor Cabdis maupun normalisasi nama Kabupaten/Kota (termasuk variasi spasi & singkatan).
 */
function isSchoolInCabdisScope_(schoolCabdin, schoolKabKota, cabdisInfo) {
  if (!cabdisInfo) return false;
  if (cabdisInfo.isAdmin) return true;
  if (!cabdisInfo.num) return false;

  // 1. Pencocokan langsung via nomor Cabang Dinas (1..14)
  var schoolCabNum = extractCabdisNumber_(schoolCabdin);
  if (schoolCabNum > 0) {
    return schoolCabNum === cabdisInfo.num;
  }

  // 2. Fallback pencocokan via Kabupaten/Kota dengan normalisasi spasi & tanda baca
  var kabUpper = String(schoolKabKota || '').toUpperCase().trim();
  var kabCompact = normalizeRegionCompact_(kabUpper);
  if (!kabCompact || !cabdisInfo.kabKota || cabdisInfo.kabKota.length === 0) {
    return false;
  }

  for (var k = 0; k < cabdisInfo.kabKota.length; k++) {
    var targetCompact = normalizeRegionCompact_(cabdisInfo.kabKota[k]);
    if (!targetCompact) continue;

    if (targetCompact === 'NIAS') {
      // Kab. Nias induk (Cabdis XIII) — pisahkan tegas dari Nias Utara, Nias Selatan, dan Nias Barat
      if (kabCompact.indexOf('NIAS') !== -1 &&
          kabCompact.indexOf('SELATAN') === -1 &&
          kabCompact.indexOf('BARAT') === -1 &&
          kabCompact.indexOf('UTARA') === -1) {
        return true;
      }
    } else if (targetCompact === 'LABUHANBATU') {
      // Kab. Labuhanbatu induk — pisahkan dari Labura dan Labusel
      if ((kabCompact.indexOf('LABUHANBATU') !== -1) &&
          kabCompact.indexOf('UTARA') === -1 &&
          kabCompact.indexOf('SELATAN') === -1) {
        return true;
      }
    } else if (targetCompact === 'LABUHANBATUUTARA') {
      if (kabCompact.indexOf('LABUHANBATUUTARA') !== -1 || kabCompact.indexOf('LABURA') !== -1) return true;
    } else if (targetCompact === 'LABUHANBATUSELATAN') {
      if (kabCompact.indexOf('LABUHANBATUSELATAN') !== -1 || kabCompact.indexOf('LABUSEL') !== -1) return true;
    } else if (targetCompact === 'TAPANULISELATAN') {
      if (kabCompact.indexOf('TAPANULISELATAN') !== -1 || kabCompact.indexOf('TAPSEL') !== -1) return true;
    } else if (targetCompact === 'TAPANULIUTARA') {
      if (kabCompact.indexOf('TAPANULIUTARA') !== -1 || kabCompact.indexOf('TAPUT') !== -1) return true;
    } else if (targetCompact === 'TAPANULITENGAH') {
      if (kabCompact.indexOf('TAPANULITENGAH') !== -1 || kabCompact.indexOf('TAPTENG') !== -1) return true;
    } else if (targetCompact === 'MANDAILINGNATAL') {
      if (kabCompact.indexOf('MANDAILINGNATAL') !== -1 || kabCompact.indexOf('MADINA') !== -1) return true;
    } else if (targetCompact === 'PADANGLAWASUTARA') {
      if (kabCompact.indexOf('PADANGLAWASUTARA') !== -1 || kabCompact.indexOf('PALUTA') !== -1) return true;
    } else if (targetCompact === 'PADANGLAWAS') {
      if ((kabCompact.indexOf('PADANGLAWAS') !== -1 && kabCompact.indexOf('UTARA') === -1) || kabCompact.indexOf('PALAS') !== -1) return true;
    } else if (targetCompact === 'HUMBANGHASUNDUTAN') {
      if (kabCompact.indexOf('HUMBANGHASUNDUTAN') !== -1 || kabCompact.indexOf('HUMBAHAS') !== -1) return true;
    } else if (targetCompact === 'SERDANGBEDAGAI') {
      if (kabCompact.indexOf('SERDANGBEDAGAI') !== -1 || kabCompact.indexOf('SERGAI') !== -1) return true;
    } else if (targetCompact === 'PEMATANGSIANTAR') {
      if (kabCompact.indexOf('PEMATANGSIANTAR') !== -1 || kabCompact.indexOf('SIANTAR') !== -1) return true;
    } else if (targetCompact === 'PADANGSIDIMPUAN') {
      if (kabCompact.indexOf('PADANGSIDIMPUAN') !== -1 || kabCompact.indexOf('SIDIMPUAN') !== -1) return true;
    } else if (targetCompact === 'GUNUNGSITOLI') {
      if (kabCompact.indexOf('GUNUNGSITOLI') !== -1 || kabCompact.indexOf('GUSIT') !== -1) return true;
    } else if (targetCompact === 'TOBA') {
      if (kabCompact.indexOf('TOBA') !== -1) return true;
    } else {
      if (kabCompact.indexOf(targetCompact) !== -1) return true;
    }
  }

  return false;
}

/* ===================== KONEKSI SPREADSHEET CERDAS & AMAN ===================== */

var SPREADSHEET_ID = ''; // Opsional: Isi ID spreadsheet jika skrip dijalankan mandiri (Standalone)

function getActiveSpreadsheet_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss && ss.getId()) return ss;
  } catch (e) {}

  try {
    var props = PropertiesService.getScriptProperties();
    var propId = props.getProperty('SPREADSHEET_ID');
    if (propId) return SpreadsheetApp.openById(propId);
    var propUrl = props.getProperty('SPREADSHEET_URL');
    if (propUrl) return SpreadsheetApp.openByUrl(propUrl);
  } catch (e) {}

  if (typeof SPREADSHEET_ID === 'string' && SPREADSHEET_ID.trim()) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch (e) {}
  }

  try {
    var files = DriveApp.getFilesByName('SAJAK');
    if (files.hasNext()) return SpreadsheetApp.open(files.next());
  } catch (e) {}

  return null;
}

function getSheetCaseInsensitive_(ss, targetName) {
  if (!ss) return null;
  var sheet = ss.getSheetByName(targetName);
  if (sheet) return sheet;

  var cleanTarget = String(targetName || '').toUpperCase().trim().replace(/\s+/g, ' ');
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sName = sheets[i].getName().toUpperCase().trim().replace(/\s+/g, ' ');
    if (sName === cleanTarget) return sheets[i];
  }

  var aliasMap = {
    'GOOGLE FORM REKAP PAJAK': ['REKAP PAJAK', 'REKAP_PAJAK', 'DATA REKAP', 'REKAP', 'GOOGLE FORM'],
    'FORM PEMBUATAN SUB UNIT': ['SUB UNIT', 'PROFIL SEKOLAH', 'PROFIL', 'DATA PROFIL', 'PEMBUATAN SUB UNIT'],
    'AKUN OPERATOR': ['AKUN', 'OPERATOR', 'USERS', 'PENGGUNA'],
    'MASTER REFERENSI': ['MASTER', 'REFERENSI', 'DATA REFERENSI', 'LEMBAR2'],
    'DATA NPSN': ['NPSN', 'MASTER NPSN', 'DATA_NPSN', 'LEMBAR1'],
    'SUB UNIT SEKOLAH': ['SUB_UNIT_SEKOLAH', 'UNIT SEKOLAH', 'SEKOLAH CORETAX'],
    'FORM PEMBUATAN SUB UNIT DINAS': ['SUB UNIT BIDANG-CABDIS', 'SUB UNIT BIDANG CABDIS', 'SUB UNIT DINAS', 'UNIT DINAS', 'CABDIS', 'CABANG DINAS'],
    'LOG OPERATOR': ['LOG', 'LOGS', 'AKTIVITAS']
  };

  var aliases = aliasMap[cleanTarget] || [];
  for (var a = 0; a < aliases.length; a++) {
    var aliasClean = aliases[a].toUpperCase().trim();
    for (var j = 0; j < sheets.length; j++) {
      var curName = sheets[j].getName().toUpperCase().trim().replace(/\s+/g, ' ');
      if (curName === aliasClean || curName.indexOf(aliasClean) !== -1) {
        return sheets[j];
      }
    }
  }

  return null;
}

function getSheet_(name) {
  try {
    var ss = getActiveSpreadsheet_();
    if (!ss) return null;
    return getSheetCaseInsensitive_(ss, name);
  } catch (err) {
    return null;
  }
}

/**
 * Membaca data sheet secara batch menggunakan getDisplayValues() agar tanggal/kode digit
 * selalu bertipe string murni tanpa risiko pergeseran zona waktu atau hilang leading zero.
 */
function getSafeSheetValues_(sheet, startRow, startCol, maxCols, minHeaderRow) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < startRow || lastCol < startCol) return [];

  var numRows = lastRow - startRow + 1;
  var availableCols = lastCol - startCol + 1;
  var numCols = maxCols > 0 ? Math.min(availableCols, maxCols) : availableCols;

  var values = sheet.getRange(startRow, startCol, numRows, numCols).getDisplayValues();

  if (maxCols > 0) {
    for (var r = 0; r < values.length; r++) {
      var row = values[r];
      if (row.length < maxCols) {
        var pad = new Array(maxCols - row.length);
        for (var p = 0; p < pad.length; p++) pad[p] = '';
        values[r] = row.concat(pad);
      }
    }
  }

  return values;
}

/**
 * Parser fallback baris sekolah bila header tidak standar.
 * Urutan prioritas: NPSN (8 digit) -> Nama Sekolah (SMAN/SMKN/SLB) -> Cabdin -> Kab/Kota.
 * Pengecekan Nama Sekolah dilakukan SEBELUM Kab/Kota agar nama seperti "SMAN 1 MEDAN" tidak salah masuk ke Kab/Kota.
 */
function parseSchoolRow_(row) {
  var npsn = '', nama = '', cabdin = '', kabKota = '';

  for (var c = 0; c < row.length; c++) {
    var val = String(row[c] || '').trim();
    if (!val) continue;

    if (!npsn && /^\d{8}$/.test(val)) {
      npsn = val;
      continue;
    }

    if (!nama && /\b(?:SMAN|SMKN|SLBN|SMA|SMK|SLB|SDLB|SMPLB|SMALB|SEKOLAH)\b/i.test(val)) {
      nama = val;
      continue;
    }

    if (!cabdin && (/(?:CABANG\s+DINAS|CABDIS|CABDIN|WILAYAH\s+[IVXLCDM\d]+|WIL\.?\s*[IVXLCDM\d]+)/i.test(val))) {
      cabdin = val;
      continue;
    }

    if (!kabKota && (/(?:^|\s)(?:KAB\.?|KABUPATEN|KOTA)\s+[A-Z\s]+/i.test(val) ||
        /(?:MEDAN|DELI\s*SERDANG|BINJAI|LANGKAT|TEBING\s*TINGGI|SERDANG\s*BEDAGAI|KARO|DAIRI|PAKPAK\s*BHARAT|ASAHAN|BATU\s*BARA|TANJUNG\s*BALAI|PEMATANG\s*SIANTAR|SIMALUNGUN|LABUHAN\s*BATU|LABURA|LABUSEL|TOBA|SAMOSIR|HUMBANG|TAPANULI|TAPUT|TAPTENG|SIBOLGA|TAPSEL|PADANG\s*SIDIMPUAN|MANDAILING|MADINA|PADANG\s*LAWAS|PALUTA|GUNUNG\s*SITOLI|NIAS)/i.test(val))) {
      kabKota = val;
      continue;
    }

    if (!nama && val.length > 5 && !/^\d+$/.test(val)) {
      nama = val;
    }
  }

  return { npsn: npsn, namaSekolah: nama, cabangDinas: cabdin, kabKota: kabKota };
}

/**
 * Pembaca dinamis & tahan perubahan struktur untuk tab DATA NPSN.
 * - Membaca seluruh kolom (tidak terpotong 9 kolom)
 * - Mendeteksi indeks kolom secara dinamis dari baris header (baris 1 s/d 3)
 * - Menerapkan carry-forward nilai Cabdin & Kab/Kota jika baris kosong akibat merged cells
 * - Fallback otomatis ke parseSchoolRow_() apabila ada baris yang tidak sesuai peta kolom
 */
function getNormalizedNpsnSchools_(npsnSheet) {
  var sheet = npsnSheet || getSheet_('DATA NPSN');
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 2) return [];

  var allRows = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  var headerRowIdx = -1;
  var colIdx = {
    npsn: -1,
    npsnAlt: -1,
    nama: -1,
    cabdin: -1,
    kabKota: -1,
    jenjang: -1,
    kecamatan: -1
  };

  // Cari baris header di 3 baris teratas
  var maxScanHeader = Math.min(3, allRows.length);
  for (var hr = 0; hr < maxScanHeader; hr++) {
    var rHead = allRows[hr];
    var score = 0;
    var tmpIdx = { npsn: -1, npsnAlt: -1, nama: -1, cabdin: -1, kabKota: -1, jenjang: -1, kecamatan: -1 };
    for (var hc = 0; hc < rHead.length; hc++) {
      var h = String(rHead[hc] || '').toUpperCase().trim().replace(/\s+/g, ' ');
      if (!h) continue;
      if (h.indexOf('NPSN') !== -1) {
        if (tmpIdx.npsn === -1) tmpIdx.npsn = hc;
        else if (tmpIdx.npsnAlt === -1) tmpIdx.npsnAlt = hc;
        score++;
      } else if (h.indexOf('NAMA SEKOLAH') !== -1 || h.indexOf('SATUAN PENDIDIKAN') !== -1 || h === 'SEKOLAH' || h === 'NAMA') {
        if (tmpIdx.nama === -1) tmpIdx.nama = hc;
        score++;
      } else if (h.indexOf('CABANG DINAS') !== -1 || h.indexOf('CABDIN') !== -1 || h.indexOf('CABDIS') !== -1 || h === 'WILAYAH') {
        if (tmpIdx.cabdin === -1) tmpIdx.cabdin = hc;
        score++;
      } else if (h.indexOf('KAB') !== -1 || h.indexOf('KOTA') !== -1) {
        if (tmpIdx.kabKota === -1) tmpIdx.kabKota = hc;
        score++;
      } else if (h.indexOf('JENJANG') !== -1 || h.indexOf('BENTUK') !== -1 || h.indexOf('TIPE') !== -1) {
        if (tmpIdx.jenjang === -1) tmpIdx.jenjang = hc;
      } else if (h.indexOf('KECAMATAN') !== -1) {
        if (tmpIdx.kecamatan === -1) tmpIdx.kecamatan = hc;
      }
    }
    if (score >= 2) {
      headerRowIdx = hr;
      colIdx = tmpIdx;
      break;
    }
  }

  // Fallback ke konstanta bawaan COL_DATA_NPSN jika header tidak lengkap
  if (headerRowIdx === -1) {
    headerRowIdx = 0;
    colIdx = {
      npsn: COL_DATA_NPSN.NPSN,
      npsnAlt: COL_DATA_NPSN.NPSN_ALT,
      nama: COL_DATA_NPSN.NAMA_SEKOLAH,
      cabdin: COL_DATA_NPSN.CABDIN,
      kabKota: COL_DATA_NPSN.KAB_KOTA,
      jenjang: COL_DATA_NPSN.JENJANG,
      kecamatan: COL_DATA_NPSN.KECAMATAN
    };
  } else {
    if (colIdx.npsn === -1 && lastCol > COL_DATA_NPSN.NPSN) colIdx.npsn = COL_DATA_NPSN.NPSN;
    if (colIdx.npsnAlt === -1) colIdx.npsnAlt = COL_DATA_NPSN.NPSN_ALT;
    if (colIdx.nama === -1 && lastCol > COL_DATA_NPSN.NAMA_SEKOLAH) colIdx.nama = COL_DATA_NPSN.NAMA_SEKOLAH;
    if (colIdx.cabdin === -1 && lastCol > COL_DATA_NPSN.CABDIN) colIdx.cabdin = COL_DATA_NPSN.CABDIN;
    if (colIdx.kabKota === -1 && lastCol > COL_DATA_NPSN.KAB_KOTA) colIdx.kabKota = COL_DATA_NPSN.KAB_KOTA;
  }

  var results = [];
  var lastCabdin = '';
  var lastKabKota = '';

  for (var r = headerRowIdx + 1; r < allRows.length; r++) {
    var row = allRows[r];
    var rawNpsn = (colIdx.npsn >= 0 && colIdx.npsn < row.length) ? text_(row[colIdx.npsn]).replace(/^'+/, '') : '';
    var rawNpsnAlt = (colIdx.npsnAlt >= 0 && colIdx.npsnAlt < row.length) ? text_(row[colIdx.npsnAlt]).replace(/^'+/, '') : '';
    var npsn = /^\d{8}$/.test(rawNpsn) ? rawNpsn : (/^\d{8}$/.test(rawNpsnAlt) ? rawNpsnAlt : (rawNpsn || rawNpsnAlt));

    var nama = (colIdx.nama >= 0 && colIdx.nama < row.length) ? text_(row[colIdx.nama]) : '';
    var cabdin = (colIdx.cabdin >= 0 && colIdx.cabdin < row.length) ? text_(row[colIdx.cabdin]) : '';
    var kabKota = (colIdx.kabKota >= 0 && colIdx.kabKota < row.length) ? text_(row[colIdx.kabKota]) : '';
    var jenjang = (colIdx.jenjang >= 0 && colIdx.jenjang < row.length) ? text_(row[colIdx.jenjang]) : '';
    var kecamatan = (colIdx.kecamatan >= 0 && colIdx.kecamatan < row.length) ? text_(row[colIdx.kecamatan]) : '';

    // Jika masih ada data kunci yang kosong, lengkapi dengan fallback parser
    if (!npsn || !nama || (!cabdin && !kabKota)) {
      var fallback = parseSchoolRow_(row);
      if (!npsn && fallback.npsn) npsn = fallback.npsn;
      if (!nama && fallback.namaSekolah) nama = fallback.namaSekolah;
      if (!cabdin && fallback.cabangDinas) cabdin = fallback.cabangDinas;
      if (!kabKota && fallback.kabKota) kabKota = fallback.kabKota;
    }

    // Lewati baris kosong total atau baris subheader berulang
    if (!nama && !npsn) continue;
    if (nama.toUpperCase() === 'NAMA SEKOLAH' || npsn.toUpperCase() === 'NPSN') continue;

    // Sanitasi judul dokumen / header / metadata lembar kerja (contoh: "Provinsi Sumatera Utara tahun 2026")
    var namaUpper = String(nama || '').toUpperCase().trim();
    if (namaUpper.indexOf('PROVINSI SUMATERA UTARA') !== -1 ||
        namaUpper.indexOf('PEMERINTAH PROVINSI') !== -1 ||
        namaUpper.indexOf('DINAS PENDIDIKAN') !== -1 ||
        namaUpper.indexOf('TAHUN 202') !== -1 ||
        namaUpper.indexOf('CABANG WILAYAH') !== -1 ||
        namaUpper === 'SATUAN PENDIDIKAN') {
      continue;
    }

    // Carry-forward untuk sheet yang menggunakan merged cells pada kolom Cabdin / KabKota
    if (cabdin) {
      lastCabdin = cabdin;
    } else if (lastCabdin && !kabKota) {
      cabdin = lastCabdin;
    }
    if (kabKota) {
      lastKabKota = kabKota;
    } else if (lastKabKota && cabdin === lastCabdin) {
      kabKota = lastKabKota;
    }

    // Jika Cabdin masih kosong namun ada Kab/Kota, coba tebak dari peta resmi jika cocok
    var finalCabdin = normalizeCabdinName_(cabdin);
    if (!finalCabdin && kabKota) {
      for (var cm = 0; cm < CABDIS_OFFICIAL_MAP.length; cm++) {
        var cDef = CABDIS_OFFICIAL_MAP[cm];
        if (isSchoolInCabdisScope_('', kabKota, { isAdmin: false, num: cDef.num, kabKota: cDef.kabKota })) {
          finalCabdin = cDef.name;
          break;
        }
      }
    }

    results.push({
      npsn: npsn,
      namaSekolah: nama,
      cabangDinas: finalCabdin,
      kabKota: kabKota,
      jenjang: jenjang,
      kecamatan: kecamatan
    });
  }

  return results;
}

function testSpreadsheetConnection() {
  try {
    var ss = getActiveSpreadsheet_();
    if (!ss) return { success: false, message: 'Spreadsheet tidak ditemukan.' };
    var sheets = ss.getSheets().map(function(s) { return s.getName(); });
    return {
      success: true,
      name: ss.getName(),
      id: ss.getId(),
      sheets: sheets
    };
  } catch (err) {
    return { success: false, message: err.message || String(err) };
  }
}

/**
 * Entry point Web App menggunakan HtmlService.createTemplateFromFile agar siap untuk arsitektur modular
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Sistem Rekapitulasi Pajak Satuan Pendidikan')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Helper modular untuk menyertakan potongan HTML/CSS/JS via scriptlet <?!= include('namafile'); ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ===================== HELPER UMUM & VALIDASI ===================== */

function formatDateTime_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    if (isNaN(value.getTime())) return '';
    return Utilities.formatDate(value, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
  }
  return String(value).trim();
}

/**
 * Menormalkan berbagai format tanggal (Date, yyyy-MM-dd, dd/MM/yyyy, dd-MM-yyyy) ke format ISO yyyy-MM-dd
 */
function formatDateIso(val) {
  if (!val) return '';
  if (Object.prototype.toString.call(val) === '[object Date]') {
    if (isNaN(val.getTime())) return '';
    return Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  var s = String(val).trim();
  if (!s) return '';

  // Sudah ISO yyyy-MM-dd (atau yyyy/MM/dd)
  var mIso = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (mIso) {
    return mIso[1] + '-' + ('0' + mIso[2]).slice(-2) + '-' + ('0' + mIso[3]).slice(-2);
  }

  // Format dd/MM/yyyy atau dd-MM-yyyy
  var mId = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (mId) {
    var d1 = Number(mId[1]);
    var d2 = Number(mId[2]);
    // Jika angka kedua > 12 berarti format MM/dd/yyyy (locale US), tukar hari dan bulan
    if (d2 > 12 && d1 <= 12) {
      return mId[3] + '-' + ('0' + d1).slice(-2) + '-' + ('0' + d2).slice(-2);
    }
    return mId[3] + '-' + ('0' + d2).slice(-2) + '-' + ('0' + d1).slice(-2);
  }

  return s;
}

/**
 * Mengurai nominal angka dari cell Spreadsheet yang dibaca melalui getDisplayValues()
 * Aman untuk locale Indonesia (1.500.000,00) maupun internasional (1,500,000.00)
 */
function parseSheetAmount_(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isFinite(val) ? val : 0;
  var s = String(val).trim().replace(/^Rp\.?\s*/i, '').replace(/\s+/g, '');
  if (!s) return 0;

  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, '');
  } else if (/^-?\d+,\d+$/.test(s)) {
    s = s.replace(',', '.');
  } else {
    s = s.replace(/[^0-9.\-]/g, '');
  }

  var n = Number(s);
  return isFinite(n) ? n : 0;
}

function normalizeRole_(value) {
  var role = String(value || 'OPERATOR').trim().toUpperCase();
  if (role === 'ADMIN' || role === 'UNIT_DINAS') return role;
  return 'OPERATOR';
}

function text_(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function isCabdisCode_(code) {
  var v = text_(code);
  return /^(?:CABDIS|CABDIN)[-\s_]*\d+$/i.test(v) || /CABANG\s+DINAS/i.test(v);
}

/**
 * Memeriksa apakah suatu kode termasuk Unit Kerja Dinas (baik 14 Cabdis maupun 6 Unit Kantor Pusat)
 */
function isUnitDinasCode_(code) {
  var v = text_(code).toUpperCase();
  if (!v) return false;
  if (isCabdisCode_(v)) return true;
  return DINAS_PUSAT_CODES.indexOf(v) !== -1;
}

function assertDigits_(label, value, min, max) {
  var v = text_(value);
  var ok = /^\d+$/.test(v) && v.length >= min && v.length <= max;
  if (!ok) {
    throw new Error(label + (min === max ? ' harus tepat ' + min + ' digit angka.' : ' harus ' + min + ' sampai ' + max + ' digit angka.'));
  }
  return v;
}

function assertRequired_(label, value) {
  var v = text_(value);
  if (!v) throw new Error(label + ' wajib diisi.');
  return v;
}

function normalizeAmount_(label, value) {
  var n = typeof value === 'number' ? value : parseSheetAmount_(value);
  if (!isFinite(n) || n < 0) throw new Error(label + ' harus berupa angka tidak negatif.');
  return n;
}

function maskIdentity_(value) {
  var t = text_(value);
  return t ? '••••' + t.slice(-4) : '';
}

function normalizeSchoolName_(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function canonicalSchoolKey_(value) {
  var s = normalizeSchoolName_(value);
  if (!s) return '';
  s = s.replace(/^SMA NEGERI\b/, 'SMAN')
       .replace(/^SMK NEGERI\b/, 'SMKN')
       .replace(/^SLB NEGERI\b/, 'SLBN')
       .replace(/^SDLB NEGERI\b/, 'SDLBN')
       .replace(/[^A-Z0-9 ]/g, ' ')
       .replace(/\s+/g, ' ')
       .trim();
  return s;
}

function normalizeCabdinName_(val) {
  var v = text_(val);
  if (!v) return '';
  var num = extractCabdisNumber_(v);
  if (num >= 1 && num <= 14) {
    return CABDIS_OFFICIAL_MAP[num - 1].name;
  }
  if (/^wilayah\s+/i.test(v)) return 'Cabang Dinas ' + v;
  return v;
}

/**
 * Membersihkan tag terstruktur lama ([ARKAS:], [SIPD:], [SIPLah], [E-Katalog], [INV:])
 * pada kolom keterangan sebelum menyusun ulang agar edit transaksi tidak meninggalkan tag basi.
 */
function stripStructuredKetTags_(ket) {
  var clean = text_(ket);
  if (!clean) return '';
  clean = clean
    .replace(/\[(?:ARKAS|SIPD|INV):\s*[^\]]*\]/gi, ' ')
    .replace(/\[(?:SIPLAH|E-KATALOG)\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean;
}

/* ===================== SESI & AUTENTIKASI ===================== */

function createSessionToken_(account) {
  account = account || {};
  account.issuedAt = Date.now();
  var token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('SAJAK_SESSION_' + token, JSON.stringify(account), 21600);
  return token;
}

function passwordFingerprint_(password) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password || '').trim(), Utilities.Charset.UTF_8);
  return bytes.map(function(value) {
    var hex = (value & 0xff).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function revokeAccountSessionCache_(identifier) {
  try {
    if (!identifier) return;
    var cache = CacheService.getScriptCache();
    cache.put('SAJAK_REVOKED_' + text_(identifier).toUpperCase(), String(Date.now()), 21600);
  } catch (e) {}
}

function getSessionAccount_(sessionToken) {
  if (!sessionToken) return null;
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get('SAJAK_SESSION_' + text_(sessionToken));
    if (!cached) return null;

    var account = JSON.parse(cached);
    if (!account || !account.username) return null;

    // Cek apakah sesi akun ini telah dianulir SETELAH token sesi diterbitkan
    var uKey = text_(account.username).toUpperCase();
    var nKey = text_(account.npsn).toUpperCase();
    var revokedU = cache.get('SAJAK_REVOKED_' + uKey);
    var revokedN = nKey ? cache.get('SAJAK_REVOKED_' + nKey) : null;
    var revokedTs = Math.max(Number(revokedU || 0), Number(revokedN || 0));
    if (revokedTs > 0 && revokedTs > Number(account.issuedAt || 0)) {
      cache.remove('SAJAK_SESSION_' + text_(sessionToken));
      return null;
    }

    return account;
  } catch (err) {
    return null;
  }
}

function requireAdminSession_(sessionToken) {
  var account = getSessionAccount_(sessionToken);
  if (!account || account.role !== 'ADMIN') throw new Error('Sesi admin tidak valid atau telah berakhir. Silakan login kembali.');
  return account;
}

function logoutSession(sessionToken) {
  var token = text_(sessionToken);
  if (token) CacheService.getScriptCache().remove('SAJAK_SESSION_' + token);
  return { status: 'success' };
}

function loginOperator(username, password) {
  try {
    var ss = getActiveSpreadsheet_();
    if (!ss) {
      return { status: 'error', message: 'Spreadsheet database SAJAK tidak ditemukan.' };
    }
    var sheet = getSheetCaseInsensitive_(ss, 'Akun Operator');
    if (!sheet) {
      return { status: 'error', message: 'Tab Akun Operator belum ada. Jalankan setupDatabase() di setup.gs terlebih dahulu.' };
    }
    if (text_(sheet.getRange(1, COL_AKUN.ROLE + 1).getDisplayValue()).toUpperCase() !== 'ROLE' ||
        text_(sheet.getRange(1, COL_AKUN.LAST_LOGIN + 1).getDisplayValue()).toUpperCase() !== 'LOGIN TERAKHIR') {
      return { status: 'error', message: 'Struktur akun belum dimigrasikan. Jalankan setupDatabase() terlebih dahulu.' };
    }
    var rekapSheet = getSheetCaseInsensitive_(ss, 'GOOGLE FORM REKAP PAJAK');
    var unitSheet = getSheetCaseInsensitive_(ss, 'FORM PEMBUATAN SUB UNIT');
    if (rekapSheet && rekapSheet.getLastColumn() === 24) {
      rekapSheet.insertColumnsAfter(24, 1);
      var c25 = rekapSheet.getRange(1, 25);
      c25.setValue('LINK BUKTI DOKUMEN').setBackground('#047857').setFontColor('#FFFFFF').setFontWeight('bold');
      SpreadsheetApp.flush();
    }
    if (!rekapSheet || rekapSheet.getLastColumn() < REKAP_COLS || !unitSheet || unitSheet.getLastColumn() < UNIT_COLS) {
      return { status: 'error', message: 'Struktur database belum dimigrasikan ke versi terbaru. Jalankan setupDatabase() terlebih dahulu.' };
    }

    var lastRow = sheet.getLastRow();
    var data = lastRow >= 2 ? sheet.getRange(1, 1, lastRow, 7).getDisplayValues() : [];
    var cleanUser = text_(username);
    var cleanPass = text_(password);

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var u = text_(row[COL_AKUN.USERNAME]);
      var p = text_(row[COL_AKUN.PASSWORD]);
      var npsn = text_(row[COL_AKUN.NPSN]);
      var namaOp = text_(row[COL_AKUN.NAMA_OPERATOR]);
      var status = text_(row[COL_AKUN.STATUS]).toUpperCase();
      var role = normalizeRole_(row[COL_AKUN.ROLE]);

      if (u === cleanUser && p === cleanPass) {
        if (status !== 'AKTIF') {
          return { status: 'error', message: 'Akun Anda berstatus NONAKTIF. Silakan hubungi Admin.' };
        }
        var loginStamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
        sheet.getRange(i + 1, COL_AKUN.LAST_LOGIN + 1).setValue("'" + loginStamp);
        SpreadsheetApp.flush();

        var sessionToken = createSessionToken_({
          username: u,
          npsn: npsn,
          namaOperator: namaOp,
          role: role,
          credentialFingerprint: passwordFingerprint_(p)
        });
        var master = getMasterData();

        if (role === 'ADMIN') {
          return {
            status: 'success', role: 'ADMIN', sessionToken: sessionToken,
            admin: { username: u, nama: namaOp }, master: master
          };
        }

        var profil = getProfilSekolahDataByNpsn_(npsn);
        var prefill = buildDefaultProfilePrefill_(npsn, namaOp, role, master);

        return {
          status: 'success',
          role: role,
          sessionToken: sessionToken,
          operator: {
            username: u, npsn: npsn, namaOperator: namaOp,
            isCabdis: isCabdisCode_(npsn) || isCabdisCode_(u) || /CABANG\s+DINAS/i.test(namaOp),
            hasProfil: profil !== null, profil: profil, prefill: prefill
          },
          master: master,
          initialHistory: null
        };
      }
    }
    return { status: 'error', message: 'Username/NPSN atau Password yang Anda masukkan salah!' };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function changeOwnPassword(sessionToken, oldPassword, newPassword) {
  var lock = LockService.getScriptLock();
  try {
    var account = getSessionAccount_(sessionToken);
    if (!account) throw new Error('Sesi tidak valid atau telah berakhir. Silakan login kembali.');
    lock.waitLock(10000);
    var oldPass = text_(oldPassword);
    var newPass = text_(newPassword);
    if (newPass.length < 8) throw new Error('Password baru minimal 8 karakter.');
    if (newPass === oldPass) throw new Error('Password baru harus berbeda dari password lama.');
    var sheet = getSheet_('Akun Operator');
    if (!sheet) throw new Error('Tab Akun Operator tidak ditemukan.');
    var lastRow = sheet.getLastRow();
    var rows = lastRow >= 2 ? sheet.getRange(1, 1, lastRow, 7).getDisplayValues() : [];
    for (var i = 1; i < rows.length; i++) {
      if (text_(rows[i][COL_AKUN.USERNAME]) !== account.username) continue;
      if (text_(rows[i][COL_AKUN.PASSWORD]) !== oldPass) throw new Error('Password lama tidak sesuai.');
      // Proteksi leading zero dengan tanda petik tunggal
      sheet.getRange(i + 1, COL_AKUN.PASSWORD + 1).setValue("'" + newPass);
      SpreadsheetApp.flush();
      CacheService.getScriptCache().remove('SAJAK_SESSION_' + text_(sessionToken));
      var newToken = createSessionToken_({
        username: account.username,
        npsn: account.npsn,
        namaOperator: account.namaOperator || '',
        role: account.role,
        credentialFingerprint: passwordFingerprint_(newPass)
      });
      if (account.role === 'ADMIN') logAdminAction_(account.username, 'UBAH_PASSWORD_SENDIRI', account.username);
      return { status: 'success', sessionToken: newToken };
    }
    throw new Error('Akun tidak ditemukan.');
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/* ===================== PROFIL (SEKOLAH & UNIT DINAS) ===================== */

function getProfilSekolahByNpsn(npsn, sessionToken) {
  try {
    var account = getSessionAccount_(sessionToken);
    if (!account) return { status: 'error', message: 'Sesi tidak valid atau telah berakhir.' };
    var cleanNpsn = text_(npsn);

    if (account.role !== 'ADMIN' && account.npsn !== cleanNpsn) {
      if (account.role === 'UNIT_DINAS') {
        var profileCab = getProfilSekolahDataByNpsn_(account.npsn);
        var cabScope = resolveCabdisScopeInfo_(account, profileCab);
        var targetSchoolProf = getProfilSekolahDataByNpsn_(cleanNpsn);
        var schoolCab = targetSchoolProf ? targetSchoolProf.cabangDinas : '';
        var schoolKab = targetSchoolProf ? targetSchoolProf.kabKota : '';
        if (!schoolCab && !schoolKab) {
          var npsnSchools = getNormalizedNpsnSchools_();
          for (var i = 0; i < npsnSchools.length; i++) {
            if (npsnSchools[i].npsn === cleanNpsn) {
              schoolCab = npsnSchools[i].cabangDinas;
              schoolKab = npsnSchools[i].kabKota;
              break;
            }
          }
        }
        if (!cabScope.isAdmin && !isSchoolInCabdisScope_(schoolCab, schoolKab, cabScope)) {
          return { status: 'error', message: 'Akses ditolak: Sekolah di luar wilayah binaan Anda.' };
        }
      } else {
        return { status: 'error', message: 'Akses ditolak.' };
      }
    }

    var prof = getProfilSekolahDataByNpsn_(cleanNpsn);
    return { status: 'success', profil: prof };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function buildProfileObject_(r, rowIdx) {
  var g = function(idx) { return text_(r[idx]).replace(/^'+/, ''); };
  var code = g(COL_UNIT.NPSN);
  var isCab = isCabdisCode_(code);
  return {
    rowIdx: rowIdx,
    npsn: code,
    namaSekolah: g(COL_UNIT.NAMA_SEKOLAH),
    alamatSekolah: g(COL_UNIT.ALAMAT),
    kelurahan: g(COL_UNIT.KELURAHAN),
    kecamatan: g(COL_UNIT.KECAMATAN),
    kabKota: g(COL_UNIT.KAB_KOTA),
    wilayahBinaan: isCab ? g(COL_UNIT.KAB_KOTA) : '',
    provinsi: g(COL_UNIT.PROVINSI) || 'Sumatera Utara',
    namaKasek: g(COL_UNIT.NAMA_KASEK),
    nikKasek: g(COL_UNIT.NIK_KASEK),
    namaBendahara: g(COL_UNIT.NAMA_BENDAHARA),
    nikBendahara: g(COL_UNIT.NIK_BENDAHARA),
    cabangDinas: g(COL_UNIT.CABDIN),
    ket: g(COL_UNIT.KET),
    subUnitCoretax: g(COL_UNIT.CORETAX),
    tipeSekolah: g(COL_UNIT.TIPE),
    nipKpa: g(COL_UNIT.NIP_KPA), pangkatKpa: g(COL_UNIT.PANGKAT_KPA), jabatanKpa: g(COL_UNIT.JABATAN_KPA),
    nipBpp: g(COL_UNIT.NIP_BPP), pangkatBpp: g(COL_UNIT.PANGKAT_BPP), jabatanBpp: g(COL_UNIT.JABATAN_BPP),
    namaPptk: g(COL_UNIT.NAMA_PPTK), nipPptk: g(COL_UNIT.NIP_PPTK), nikPptk: g(COL_UNIT.NIK_PPTK),
    pangkatPptk: g(COL_UNIT.PANGKAT_PPTK), jabatanPptk: g(COL_UNIT.JABATAN_PPTK),
    namaKpa: g(COL_UNIT.NAMA_KASEK), nikKpa: g(COL_UNIT.NIK_KASEK),
    namaBpp: g(COL_UNIT.NAMA_BENDAHARA), nikBpp: g(COL_UNIT.NIK_BENDAHARA)
  };
}

function getProfilSekolahDataByNpsn_(npsn) {
  if (!npsn) return null;
  var sheet = getSheet_('FORM PEMBUATAN SUB UNIT');
  if (!sheet) return null;

  var rows = getSafeSheetValues_(sheet, 2, 1, UNIT_COLS, 1);
  var targetNpsn = text_(npsn);

  for (var i = 0; i < rows.length; i++) {
    if (text_(rows[i][COL_UNIT.NPSN]) === targetNpsn) {
      return buildProfileObject_(rows[i], i + 2);
    }
  }

  var upperTarget = targetNpsn.toUpperCase();
  for (var j = 0; j < rows.length; j++) {
    if (text_(rows[j][COL_UNIT.NPSN]).toUpperCase() === upperTarget) {
      return buildProfileObject_(rows[j], j + 2);
    }
  }

  return null;
}

function buildDefaultProfilePrefill_(npsnOrCode, namaOperator, role, master) {
  var code = text_(npsnOrCode);
  var base = {
    npsn: code,
    namaSekolah: '',
    tipeSekolah: '',
    subUnitCoretax: '',
    alamatSekolah: '',
    kelurahan: '',
    kecamatan: '',
    kabKota: '',
    wilayahBinaan: '',
    cabangDinas: '',
    provinsi: 'Sumatera Utara'
  };
  if (!master) return base;

  if (role === 'UNIT_DINAS') {
    var uKey = code.toUpperCase();
    var isCab = isCabdisCode_(uKey);
    base.namaSekolah = namaOperator || code;
    base.cabangDinas = isCab ? (namaOperator || code) : 'Dinas Pendidikan Provsu';
    if (master.subUnitDinasByCode && master.subUnitDinasByCode[uKey]) {
      var dInfo = master.subUnitDinasByCode[uKey];
      base.subUnitCoretax = dInfo.nitku || '';
      if (dInfo.alamat) base.alamatSekolah = dInfo.alamat;
      if (isCab && dInfo.wilayah) {
        base.wilayahBinaan = dInfo.wilayah;
        base.kabKota = dInfo.wilayah;
      }
    }
    return base;
  }

  if (master.npsnMap && master.npsnMap[code]) {
    var sInfo = master.npsnMap[code];
    base.namaSekolah = sInfo.nama || '';
    base.tipeSekolah = sInfo.tipe || '';
    base.kabKota = sInfo.kabKota || '';
    base.cabangDinas = sInfo.cabdin || '';
    base.kecamatan = sInfo.kecamatan || '';
    base.kelurahan = sInfo.kelurahan || '';
    base.alamatSekolah = sInfo.alamat || '';
    base.subUnitCoretax = sInfo.nitku || '';
  }
  return base;
}

function nextSequenceNo_(sheet) {
  var lastRow = sheet.getLastRow();
  var maxNo = 0;
  if (lastRow > 1) {
    var nos = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
    for (var i = 0; i < nos.length; i++) {
      var n = parseSheetAmount_(nos[i][0]);
      if (!isNaN(n) && n > maxNo) maxNo = n;
    }
  }
  return maxNo + 1;
}

function upsertProfileRow_(sheet, npsn, values) {
  var existing = getProfilSekolahDataByNpsn_(npsn);
  if (existing) {
    values[0] = parseSheetAmount_(sheet.getRange(existing.rowIdx, 1).getDisplayValue()) || nextSequenceNo_(sheet);
    sheet.getRange(existing.rowIdx, 1, 1, values.length).setValues([values]);
  } else {
    values[0] = nextSequenceNo_(sheet);
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
  }
}

function simpanProfilSekolah(formData, sessionToken) {
  var lock = LockService.getScriptLock();
  try {
    var account = getSessionAccount_(sessionToken);
    if (!account || account.role !== 'OPERATOR') throw new Error('Sesi operator tidak valid atau telah berakhir. Silakan login kembali.');
    formData = formData || {};
    var npsn = assertDigits_('NPSN', formData.npsn, 8, 8);
    if (npsn !== account.npsn) throw new Error('Akses ditolak: Anda hanya dapat mengubah profil sekolah sendiri.');
    var tipe = text_(formData.tipeSekolah).toUpperCase();
    if (TIPE_SEKOLAH_VALID.indexOf(tipe) === -1) throw new Error('Tipe Sekolah harus SMA, SMK, atau SLB.');

    var values = new Array(UNIT_COLS);
    for (var z = 0; z < UNIT_COLS; z++) values[z] = '';
    values[COL_UNIT.NPSN] = "'" + npsn;
    values[COL_UNIT.NAMA_SEKOLAH] = assertRequired_('Nama Sekolah', formData.namaSekolah);
    values[COL_UNIT.ALAMAT] = assertRequired_('Alamat Sekolah', formData.alamatSekolah);
    values[COL_UNIT.KELURAHAN] = assertRequired_('Kelurahan/Desa', formData.kelurahan);
    values[COL_UNIT.KECAMATAN] = assertRequired_('Kecamatan', formData.kecamatan);
    values[COL_UNIT.KAB_KOTA] = assertRequired_('Kabupaten/Kota', formData.kabKota);
    values[COL_UNIT.PROVINSI] = text_(formData.provinsi) || 'Sumatera Utara';
    values[COL_UNIT.NAMA_KASEK] = assertRequired_('Nama Kepala Sekolah', formData.namaKasek);
    values[COL_UNIT.NIK_KASEK] = "'" + assertDigits_('NIK Kepala Sekolah', formData.nikKasek, 16, 16);
    values[COL_UNIT.NAMA_BENDAHARA] = assertRequired_('Nama Bendahara', formData.namaBendahara);
    values[COL_UNIT.NIK_BENDAHARA] = "'" + assertDigits_('NIK Bendahara', formData.nikBendahara, 16, 16);
    values[COL_UNIT.CABDIN] = assertRequired_('Cabang Dinas', formData.cabangDinas);
    values[COL_UNIT.KET] = text_(formData.ket);
    values[COL_UNIT.CORETAX] = "'" + assertDigits_('No. Sub Unit Coretax', formData.subUnitCoretax, 16, 22);
    values[COL_UNIT.TIPE] = tipe;

    lock.waitLock(10000);
    var sheet = getSheet_('FORM PEMBUATAN SUB UNIT');
    if (!sheet) throw new Error('Tab FORM PEMBUATAN SUB UNIT tidak ditemukan.');
    upsertProfileRow_(sheet, npsn, values);
    SpreadsheetApp.flush();
    clearMasterDataCache_();
    return { status: 'success', message: 'Profil Satuan Pendidikan berhasil disimpan!', profil: getProfilSekolahDataByNpsn_(npsn) };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function simpanProfilUnitDinas(formData, sessionToken) {
  var lock = LockService.getScriptLock();
  try {
    var account = getSessionAccount_(sessionToken);
    if (!account || account.role !== 'UNIT_DINAS') throw new Error('Sesi unit dinas tidak valid atau telah berakhir. Silakan login kembali.');
    formData = formData || {};
    var kode = text_(formData.npsn);
    if (kode !== account.npsn) throw new Error('Akses ditolak: Anda hanya dapat mengubah profil unit kerja sendiri.');

    var isCab = isCabdisCode_(kode);
    var namaUnit = assertRequired_('Nama Unit Kerja', formData.namaSekolah);
    var wilayahBinaan = isCab ? assertRequired_('Wilayah Binaan', formData.wilayahBinaan) : '';

    var values = new Array(UNIT_COLS);
    for (var z = 0; z < UNIT_COLS; z++) values[z] = '';
    values[COL_UNIT.NPSN] = "'" + kode;
    values[COL_UNIT.NAMA_SEKOLAH] = namaUnit;
    values[COL_UNIT.ALAMAT] = assertRequired_('Alamat Unit Kerja', formData.alamatSekolah);
    values[COL_UNIT.KELURAHAN] = '';
    values[COL_UNIT.KECAMATAN] = '';
    values[COL_UNIT.KAB_KOTA] = isCab ? wilayahBinaan : '';
    values[COL_UNIT.PROVINSI] = text_(formData.provinsi) || 'Sumatera Utara';
    values[COL_UNIT.CABDIN] = isCab ? namaUnit : 'Dinas Pendidikan Provsu';
    values[COL_UNIT.KET] = text_(formData.ket);
    values[COL_UNIT.CORETAX] = "'" + assertDigits_('No. Sub Unit Coretax', formData.subUnitCoretax, 16, 22);
    values[COL_UNIT.TIPE] = 'UNIT DINAS';

    // KPA
    values[COL_UNIT.NAMA_KASEK] = assertRequired_('Nama KPA', formData.namaKpa);
    values[COL_UNIT.NIK_KASEK] = "'" + assertDigits_('NIK KPA', formData.nikKpa, 16, 16);
    values[COL_UNIT.NIP_KPA] = "'" + assertDigits_('NIP KPA', formData.nipKpa, 18, 18);
    values[COL_UNIT.PANGKAT_KPA] = assertRequired_('Pangkat/Gol KPA', formData.pangkatKpa);
    values[COL_UNIT.JABATAN_KPA] = assertRequired_('Jabatan KPA', formData.jabatanKpa);

    // PPTK
    values[COL_UNIT.NAMA_PPTK] = assertRequired_('Nama PPTK', formData.namaPptk);
    values[COL_UNIT.NIK_PPTK] = "'" + assertDigits_('NIK PPTK', formData.nikPptk, 16, 16);
    values[COL_UNIT.NIP_PPTK] = "'" + assertDigits_('NIP PPTK', formData.nipPptk, 18, 18);
    values[COL_UNIT.PANGKAT_PPTK] = assertRequired_('Pangkat/Gol PPTK', formData.pangkatPptk);
    values[COL_UNIT.JABATAN_PPTK] = assertRequired_('Jabatan PPTK', formData.jabatanPptk);

    // BPP
    values[COL_UNIT.NAMA_BENDAHARA] = assertRequired_('Nama BPP', formData.namaBpp);
    values[COL_UNIT.NIK_BENDAHARA] = "'" + assertDigits_('NIK BPP', formData.nikBpp, 16, 16);
    values[COL_UNIT.NIP_BPP] = "'" + assertDigits_('NIP BPP', formData.nipBpp, 18, 18);
    values[COL_UNIT.PANGKAT_BPP] = assertRequired_('Pangkat/Gol BPP', formData.pangkatBpp);
    values[COL_UNIT.JABATAN_BPP] = assertRequired_('Jabatan BPP', formData.jabatanBpp);

    lock.waitLock(10000);
    var sheet = getSheet_('FORM PEMBUATAN SUB UNIT');
    if (!sheet) throw new Error('Tab FORM PEMBUATAN SUB UNIT tidak ditemukan.');
    upsertProfileRow_(sheet, kode, values);
    SpreadsheetApp.flush();
    clearMasterDataCache_();
    return { status: 'success', message: 'Profil Unit Kerja berhasil disimpan!', profil: getProfilSekolahDataByNpsn_(kode) };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/* ===================== CHUNKED MULTI-KEY CACHE (80 KB) ===================== */

var MASTER_CACHE_KEY = 'SAJAK_MASTER_CHUNKED_V5';

function putChunkedCache_(baseKey, data, expirationInSeconds) {
  try {
    expirationInSeconds = expirationInSeconds || 21600;
    var str = typeof data === 'string' ? data : JSON.stringify(data);
    if (!str) return;

    var cache = CacheService.getScriptCache();
    var chunkSize = 80000;
    var totalChunks = Math.ceil(str.length / chunkSize);
    var chunks = {};
    chunks[baseKey + '_META'] = JSON.stringify({ count: totalChunks, totalLen: str.length });
    for (var i = 0; i < totalChunks; i++) {
      chunks[baseKey + '_' + i] = str.substring(i * chunkSize, (i + 1) * chunkSize);
    }
    cache.putAll(chunks, expirationInSeconds);
  } catch (err) {}
}

function getChunkedCache_(baseKey) {
  try {
    var cache = CacheService.getScriptCache();
    var metaStr = cache.get(baseKey + '_META');
    if (!metaStr) return null;

    var meta = JSON.parse(metaStr);
    if (!meta || !meta.count || isNaN(meta.count)) return null;

    var keys = [];
    for (var i = 0; i < meta.count; i++) {
      keys.push(baseKey + '_' + i);
    }

    var chunkMap = cache.getAll(keys);
    var fullStr = '';
    for (var j = 0; j < meta.count; j++) {
      var part = chunkMap[baseKey + '_' + j];
      if (!part) return null;
      fullStr += part;
    }
    return JSON.parse(fullStr);
  } catch (err) {
    return null;
  }
}

/**
 * Membersihkan seluruh potongan cache Master Data agar perubahan profil/rekanan baru langsung sinkron
 */
function clearMasterDataCache_() {
  try {
    var cache = CacheService.getScriptCache();
    var metaStr = cache.get(MASTER_CACHE_KEY + '_META');
    var keys = [MASTER_CACHE_KEY + '_META', MASTER_CACHE_KEY, 'SAJAK_MASTER_CACHE_V3'];
    if (metaStr) {
      var meta = JSON.parse(metaStr);
      if (meta && meta.count) {
        for (var i = 0; i < meta.count; i++) keys.push(MASTER_CACHE_KEY + '_' + i);
      }
    }
    cache.removeAll(keys);
  } catch (err) {}
}

function getMasterData() {
  var cached = getChunkedCache_(MASTER_CACHE_KEY);
  if (cached && typeof cached === 'object') {
    if (cached.pengadaan && cached.pengadaan.length > 0 && cached.sekolahList && cached.sekolahList.length > 0) {
      return cached;
    }
  }

  var defaultPengadaan = [
    'Belanja Alat Tulis Kantor (ATK)', 'Belanja Bahan Habis Pakai', 'Belanja Modal Peralatan dan Mesin',
    'Belanja Pemeliharaan Gedung & Bangunan', 'Belanja Cetak dan Penggandaan', 'Belanja Makanan dan Minuman',
    'Belanja Jasa Tenaga Ahli/Instruktur', 'Belanja Jasa Langganan Daya & Jasa', 'Belanja Modal Aset Tetap Lainnya', 'Belanja Operasional Lainnya'
  ];
  var defaultBppPajak = ['PPh Pasal 21', 'PPh Pasal 22', 'PPh Pasal 23', 'PPh Pasal 4(2)', 'PPN'];
  var defaultSumberDana = [
    'BOSP Reguler', 'BOSP Kinerja', 'BOSP Afirmasi', 'BPOPP (Provinsi)',
    'APBD UP/GU', 'APBD TU', 'APBD LS Gaji/Tunjangan', 'APBD LS Pihak Ketiga', 'DAK Fisik'
  ];
  var defaultKabKota = [
    'KAB. ASAHAN', 'KAB. BATU BARA', 'KAB. DAIRI', 'KAB. DELI SERDANG', 'KAB. HUMBANG HASUNDUTAN',
    'KAB. KARO', 'KAB. LABUHANBATU', 'KAB. LABUHANBATU SELATAN', 'KAB. LABUHANBATU UTARA', 'KAB. LANGKAT',
    'KAB. MANDAILING NATAL', 'KAB. NIAS', 'KAB. NIAS BARAT', 'KAB. NIAS SELATAN', 'KAB. NIAS UTARA',
    'KAB. PADANG LAWAS', 'KAB. PADANG LAWAS UTARA', 'KAB. PAKPAK BHARAT', 'KAB. SAMOSIR', 'KAB. SERDANG BEDAGAI',
    'KAB. SIMALUNGUN', 'KAB. TAPANULI SELATAN', 'KAB. TAPANULI TENGAH', 'KAB. TAPANULI UTARA', 'KAB. TOBA',
    'KOTA BINJAI', 'KOTA GUNUNGSITOLI', 'KOTA MEDAN', 'KOTA PADANGSIDIMPUAN', 'KOTA PEMATANGSIANTAR',
    'KOTA SIBOLGA', 'KOTA TANJUNGBALAI', 'KOTA TEBING TINGGI'
  ];
  var defaultCabdin = [
    'Cabang Dinas Wilayah I', 'Cabang Dinas Wilayah II', 'Cabang Dinas Wilayah III', 'Cabang Dinas Wilayah IV',
    'Cabang Dinas Wilayah V', 'Cabang Dinas Wilayah VI', 'Cabang Dinas Wilayah VII', 'Cabang Dinas Wilayah VIII',
    'Cabang Dinas Wilayah IX', 'Cabang Dinas Wilayah X', 'Cabang Dinas Wilayah XI', 'Cabang Dinas Wilayah XII',
    'Cabang Dinas Wilayah XIII', 'Cabang Dinas Wilayah XIV'
  ];

  var pengadaanSet = {}, bppPajakSet = {}, rincianPajakList = [], sumberDanaSet = {};
  var rekananList = [], rekananMap = {}, kabKotaSet = {}, cabdinSet = {}, wilayahBinaanSet = {};
  var subUnitSekolahByNpsn = {}, subUnitDinasByCode = {}, npsnMap = {}, objekPajakList = [];
  var seenNpsn = {}, sekolahList = [], kantorPusatInfo = null;

  defaultPengadaan.forEach(function(p) { pengadaanSet[p] = true; });
  defaultBppPajak.forEach(function(b) { bppPajakSet[b] = true; });
  defaultSumberDana.forEach(function(s) { sumberDanaSet[s] = true; });
  defaultKabKota.forEach(function(k) { kabKotaSet[k] = true; });
  defaultCabdin.forEach(function(c) { cabdinSet[c] = true; });

  // 1a. Gabungkan rekanan unik dari maksimal 1.000 baris transaksi terakhir
  var rekapSheet = getSheet_('GOOGLE FORM REKAP PAJAK');
  if (rekapSheet) {
    var rLast = rekapSheet.getLastRow();
    if (rLast >= 2) {
      var rStart = Math.max(2, rLast - 1000 + 1);
      var rRows = getSafeSheetValues_(rekapSheet, rStart, 1, REKAP_COLS, rStart - 1);
      for (var rx = 0; rx < rRows.length; rx++) {
        var rkRow = rRows[rx];
        var rNama = text_(rkRow[COL_REKAP.NAMA_REKANAN]);
        var rKey = rNama.toUpperCase();
        if (rNama && !rekananMap[rKey]) {
          var rAlamat = text_(rkRow[COL_REKAP.ALAMAT_REKANAN]);
          var rNpwp = text_(rkRow[COL_REKAP.NPWP_REKANAN]).replace(/^'+/, '');
          var rkObj = { nama: rNama, alamat: rAlamat, npwp: rNpwp };
          rekananList.push(rkObj);
          rekananMap[rKey] = rkObj;
        }
      }
    }
  }

  // 1b. Sheet Master Referensi (cegah duplikasi rekanan yang sudah masuk dari transaksi)
  var mSheet = getSheet_('MASTER REFERENSI');
  if (mSheet) {
    var mRows = getSafeSheetValues_(mSheet, 2, 1, MASTER_COLS, 1);
    for (var i = 0; i < mRows.length; i++) {
      var r = mRows[i];
      var pengadaan = text_(r[COL_MASTER.JENIS_PENGADAAN]);
      var bppPajak = text_(r[COL_MASTER.BPP_PAJAK]);
      var rincianPajak = text_(r[COL_MASTER.RINCIAN_PAJAK]);
      var sumberDana = text_(r[COL_MASTER.SUMBER_DANA]);
      var rekananNama = text_(r[COL_MASTER.REKANAN_NAMA]);
      var rekananAlamat = text_(r[COL_MASTER.REKANAN_ALAMAT]);
      var rekananNpwp = text_(r[COL_MASTER.REKANAN_NPWP]).replace(/^'+/, '');

      if (pengadaan) pengadaanSet[pengadaan] = true;
      if (bppPajak) bppPajakSet[bppPajak] = true;
      if (rincianPajak && rincianPajakList.indexOf(rincianPajak) === -1) rincianPajakList.push(rincianPajak);
      if (sumberDana) sumberDanaSet[sumberDana] = true;
      if (rekananNama) {
        var mKey = rekananNama.toUpperCase();
        if (!rekananMap[mKey]) {
          var rObj = { nama: rekananNama, alamat: rekananAlamat, npwp: rekananNpwp };
          rekananList.push(rObj);
          rekananMap[mKey] = rObj;
        } else {
          if (!rekananMap[mKey].alamat && rekananAlamat) rekananMap[mKey].alamat = rekananAlamat;
          if (!rekananMap[mKey].npwp && rekananNpwp) rekananMap[mKey].npwp = rekananNpwp;
        }
      }
    }
  }

  // 2. Data Sub Unit Sekolah (NITKU & Alamat Resmi dari Coretax)
  var subSekSheet = getSheet_('SUB UNIT SEKOLAH');
  if (subSekSheet) {
    var subRows = getSafeSheetValues_(subSekSheet, 4, 1, 9, 3);
    for (var k = 0; k < subRows.length; k++) {
      var sr = subRows[k];
      var nitkuVal = text_(sr[COL_SUB_SEKOLAH.NITKU]).replace(/^'+/, '');
      var npsnKey = '';
      if (nitkuVal.length >= 8) {
        var prefix8 = nitkuVal.substring(0, 8);
        if (/^\d{8}$/.test(prefix8)) npsnKey = prefix8;
      }
      if (!npsnKey) {
        var nMatch = text_(sr[COL_SUB_SEKOLAH.NAMA_TKU]).match(/\b\d{8}\b/);
        if (nMatch) npsnKey = nMatch[0];
      }
      if (!npsnKey) continue;
      subUnitSekolahByNpsn[npsnKey] = {
        nitku: nitkuVal,
        namaTku: text_(sr[COL_SUB_SEKOLAH.NAMA_TKU]),
        alamat: text_(sr[COL_SUB_SEKOLAH.ALAMAT]),
        kabKota: text_(sr[COL_SUB_SEKOLAH.KAB_KOTA]),
        kecamatan: text_(sr[COL_SUB_SEKOLAH.KECAMATAN]),
        kelurahan: text_(sr[COL_SUB_SEKOLAH.KELURAHAN]),
        provinsi: text_(sr[COL_SUB_SEKOLAH.PROVINSI])
      };
    }
  }

  function registerSchoolEntry(npsn, namaSekolah, kabKota, cabdin, tipe, alamat, kelurahan, kecamatan, nitku) {
    if (!npsn || !namaSekolah || seenNpsn[npsn]) return;
    var upperNama = String(namaSekolah || '').toUpperCase().trim();
    if (upperNama.indexOf('PROVINSI SUMATERA UTARA') !== -1 ||
        upperNama.indexOf('PEMERINTAH PROVINSI') !== -1 ||
        upperNama.indexOf('DINAS PENDIDIKAN') !== -1 ||
        upperNama.indexOf('TAHUN 202') !== -1 ||
        upperNama.indexOf('CABANG WILAYAH') !== -1) {
      return;
    }
    seenNpsn[npsn] = true;

    var sSub = subUnitSekolahByNpsn[npsn] || {};
    var finalNitku = nitku || sSub.nitku || '';
    var finalAlamat = alamat || sSub.alamat || '';
    var finalKel = kelurahan || sSub.kelurahan || '';
    var finalKec = kecamatan || sSub.kecamatan || '';
    var finalKab = kabKota || sSub.kabKota || '';
    var finalCab = normalizeCabdinName_(cabdin || '');
    var upperNama = namaSekolah.toUpperCase();
    var finalTipe = tipe || (upperNama.indexOf('SMK') !== -1 ? 'SMK' : (upperNama.indexOf('SLB') !== -1 ? 'SLB' : 'SMA'));

    if (finalKab) kabKotaSet[finalKab] = true;
    if (finalCab) cabdinSet[finalCab] = true;

    var sEntry = {
      npsn: npsn,
      nama: namaSekolah,
      namaSekolah: namaSekolah,
      tipe: finalTipe,
      cabdin: finalCab,
      cabangDinas: finalCab,
      kabKota: finalKab,
      nitku: finalNitku,
      alamat: finalAlamat,
      kelurahan: finalKel,
      kecamatan: finalKec
    };

    sekolahList.push(sEntry);
    npsnMap[npsn] = sEntry;
  }

  // 3. Data NPSN & Wilayah menggunakan pembaca dinamis (tahan perubahan urutan kolom / merged cells)
  var npsnSchools = getNormalizedNpsnSchools_();
  for (var j = 0; j < npsnSchools.length; j++) {
    var ns = npsnSchools[j];
    registerSchoolEntry(ns.npsn, ns.namaSekolah, ns.kabKota, ns.cabangDinas, ns.jenjang, '', '', ns.kecamatan, '');
  }

  // 4. Data dari sheet Profil (FORM PEMBUATAN SUB UNIT)
  var pSheet = getSheet_('FORM PEMBUATAN SUB UNIT');
  if (pSheet) {
    var pRows = getSafeSheetValues_(pSheet, 2, 1, UNIT_COLS, 1);
    for (var pr = 0; pr < pRows.length; pr++) {
      var prow = pRows[pr];
      var pnpsn = text_(prow[COL_UNIT.NPSN]).replace(/^'+/, '');
      var pnama = text_(prow[COL_UNIT.NAMA_SEKOLAH]);
      var pkab = text_(prow[COL_UNIT.KAB_KOTA]);
      var pcab = text_(prow[COL_UNIT.CABDIN]);
      var pcoretax = text_(prow[COL_UNIT.CORETAX]).replace(/^'+/, '');
      var palamat = text_(prow[COL_UNIT.ALAMAT]);
      var pkel = text_(prow[COL_UNIT.KELURAHAN]);
      var pkec = text_(prow[COL_UNIT.KECAMATAN]);
      var ptipe = text_(prow[COL_UNIT.TIPE]);

      if (/^\d{8}$/.test(pnpsn) && pnama) {
        if (!seenNpsn[pnpsn]) {
          registerSchoolEntry(pnpsn, pnama, pkab, pcab, ptipe, palamat, pkel, pkec, pcoretax);
        } else if (npsnMap[pnpsn]) {
          if (pcoretax && !npsnMap[pnpsn].nitku) npsnMap[pnpsn].nitku = pcoretax;
          if (palamat && !npsnMap[pnpsn].alamat) npsnMap[pnpsn].alamat = palamat;
          if (pkel && !npsnMap[pnpsn].kelurahan) npsnMap[pnpsn].kelurahan = pkel;
          if (pkec && !npsnMap[pnpsn].kecamatan) npsnMap[pnpsn].kecamatan = pkec;
        }
      }
    }
  }

  // 5. Data Sub Unit Dinas (SUB UNIT BIDANG-CABDIS)
  var subDinSheet = getSheet_('FORM PEMBUATAN SUB UNIT DINAS');
  if (subDinSheet) {
    var dinRows = getSafeSheetValues_(subDinSheet, 2, 1, 4, 1);
    for (var m = 0; m < dinRows.length; m++) {
      var dr = dinRows[m];
      var nitkuDinas = text_(dr[COL_SUB_DINAS.NITKU]).replace(/^'+/, '');
      var wilayahVal = text_(dr[COL_SUB_DINAS.WILAYAH]);
      var mappedCodes = matchUnitDinasCodes_(dr[COL_SUB_DINAS.NAMA_TKU], wilayahVal);
      for (var mc = 0; mc < mappedCodes.length; mc++) {
        var uCode = mappedCodes[mc];
        var isCab = isCabdisCode_(uCode);
        if (isCab && wilayahVal) wilayahBinaanSet[wilayahVal] = true;
        subUnitDinasByCode[uCode] = {
          nitku: nitkuDinas,
          namaTku: text_(dr[COL_SUB_DINAS.NAMA_TKU]),
          wilayah: isCab ? wilayahVal : '',
          alamat: !isCab && kantorPusatInfo ? kantorPusatInfo.alamat : ''
        };
      }
    }
  }

  // Default Wilayah Binaan dari CABDIS_OFFICIAL_MAP
  CABDIS_OFFICIAL_MAP.forEach(function(cabDef) {
    var wStr = cabDef.kabKota.join(', ');
    wilayahBinaanSet[wStr] = true;
    var cCode = 'CABDIS' + (cabDef.num < 10 ? '0' : '') + cabDef.num;
    if (!subUnitDinasByCode[cCode]) {
      subUnitDinasByCode[cCode] = {
        nitku: '',
        namaTku: cabDef.name,
        wilayah: wStr,
        alamat: ''
      };
    }
  });

  // 6. Objek Pajak (BPMP, BP21, BPPU)
  var taxTabs = ['BPMP', 'BP21', 'BPPU'];
  var seenKodeObjek = {};
  for (var t = 0; t < taxTabs.length; t++) {
    var tSheet = getSheet_(taxTabs[t]);
    if (!tSheet) continue;
    var tRows = getSafeSheetValues_(tSheet, 4, 1, 7, 3);
    for (var rk = 0; rk < tRows.length; rk++) {
      var row = tRows[rk];
      var kodeObjek = text_(row[COL_OBJEK_PAJAK.KODE]);
      var namaObjek = text_(row[COL_OBJEK_PAJAK.NAMA]);
      if (!kodeObjek || !namaObjek || seenKodeObjek[kodeObjek]) continue;
      seenKodeObjek[kodeObjek] = true;

      var rawTarif = text_(row[COL_OBJEK_PAJAK.TARIF]);
      var tarifStr = '';
      if (rawTarif) {
        if (rawTarif.indexOf('%') !== -1) {
          tarifStr = rawTarif;
        } else {
          var numVal = parseSheetAmount_(rawTarif);
          if (numVal > 0 && numVal < 1) {
            tarifStr = (Math.round(numVal * 10000) / 100) + '%';
          } else if (numVal > 0) {
            tarifStr = numVal + '%';
          } else {
            tarifStr = rawTarif;
          }
        }
      }
      var jObjek = text_(row[COL_OBJEK_PAJAK.JENIS]) || taxTabs[t];
      var katBpp = mapJenisObjekToBppCategory_(kodeObjek, jObjek);

      objekPajakList.push({
        kode: kodeObjek,
        nama: namaObjek,
        label: kodeObjek + ' - ' + namaObjek,
        kategoriBpp: katBpp,
        jenis: jObjek,
        sifat: text_(row[COL_OBJEK_PAJAK.SIFAT]),
        tarif: tarifStr,
        keterangan: text_(row[COL_OBJEK_PAJAK.KET])
      });
    }
  }

  var sortedSekolah = sekolahList.sort(function(a, b) {
    return (a.nama || a.namaSekolah || '').localeCompare(b.nama || b.namaSekolah || '');
  });

  var result = {
    pengadaan: Object.keys(pengadaanSet).sort(),
    bppPajak: Object.keys(bppPajakSet).sort(),
    rincianPajak: rincianPajakList.sort(),
    sumberDana: Object.keys(sumberDanaSet).sort(),
    rekanan: rekananList,
    rekananList: rekananList,
    rekananMap: rekananMap,
    kabKota: Object.keys(kabKotaSet).sort(),
    cabdin: Object.keys(cabdinSet).sort(),
    wilayahBinaan: Object.keys(wilayahBinaanSet).sort(),
    wilayahBinaanList: Object.keys(wilayahBinaanSet).sort(),
    subUnitSekolah: subUnitSekolahByNpsn,
    subUnitDinas: subUnitDinasByCode,
    subUnitDinasByCode: subUnitDinasByCode,
    npsnMap: npsnMap,
    sekolahList: sortedSekolah,
    objekPajak: objekPajakList,
    objekPajakList: objekPajakList,
    kantorPusat: kantorPusatInfo
  };

  putChunkedCache_(MASTER_CACHE_KEY, result, 21600);
  return result;
}

function matchUnitDinasCodes_(rawNamaTku, rawWilayah) {
  var namaTkuUpper = String(rawNamaTku || '').toUpperCase();
  var wilayahUpper = String(rawWilayah || '').toUpperCase();
  var combined = (namaTkuUpper + ' ' + wilayahUpper).trim();
  var out = [];
  if (combined.indexOf('SEKRETARIAT') !== -1) out.push('SEKRETARIAT');
  if (combined.indexOf('KETENAGAAN') !== -1 || combined.indexOf('PTK') !== -1) out.push('BID-PTK');
  if (combined.indexOf('MENENGAH ATAS') !== -1 || /\bSMA\b/.test(combined)) out.push('BID-SMA');
  if (combined.indexOf('KEJURUAN') !== -1 || /\bSMK\b/.test(combined)) out.push('BID-SMK');
  if (combined.indexOf('PENDIDIKAN KHUSUS') !== -1 || combined.indexOf('PKLK') !== -1) out.push('BID-PKLK');
  if (combined.indexOf('UPTD') !== -1 || combined.indexOf('TIK') !== -1) out.push('UPTD-TIK');

  var cabNum = extractCabdisNumber_(combined);
  if (cabNum >= 1 && cabNum <= 14) {
    out.push('CABDIS' + (cabNum < 10 ? '0' : '') + cabNum);
  }
  return out;
}

function mapJenisObjekToBppCategory_(kode, jenis) {
  var j = String(jenis || '').toUpperCase();
  var k = String(kode || '');
  if (k.indexOf('21-') === 0 || j.indexOf('21') !== -1) return 'PPh Pasal 21';
  if (k.indexOf('22-') === 0 || j.indexOf('22') !== -1) return 'PPh Pasal 22';
  if (k.indexOf('24-') === 0 || j.indexOf('23') !== -1) return 'PPh Pasal 23';
  if (k.indexOf('28-') === 0 || j.indexOf('4 AYAT 2') !== -1 || j.indexOf('4(2)') !== -1 || j.indexOf('15') !== -1) return 'PPh Pasal 4(2)';
  return '';
}

/* ===================== TRANSAKSI PAJAK ===================== */

function simpanDataRekap(formData, sessionToken) {
  var lock = LockService.getScriptLock();
  try {
    var account = getSessionAccount_(sessionToken);
    if (!account) throw new Error('Sesi tidak valid atau telah berakhir. Silakan login kembali.');
    formData = formData || {};

    if (account.role !== 'ADMIN' && text_(formData.npsn) !== account.npsn) {
      throw new Error('Akses ditolak: Anda hanya dapat merekam transaksi untuk unit sendiri.');
    }

    var editRow = Number(formData.editRowIdx);
    var isEdit = !isNaN(editRow) && editRow >= 2;

    if (account.role === 'ADMIN' && !isEdit) {
      throw new Error('Admin hanya dapat mengoreksi transaksi yang sudah ada.');
    }

    var npsn = text_(formData.npsn || account.npsn);
    if (!npsn) throw new Error('NPSN atau Kode Unit kerja wajib diisi.');

    var uraian = text_(formData.uraianKegiatan || formData.uraian);
    if (!uraian) throw new Error('Uraian kegiatan belanja wajib diisi.');

    var jenisPengadaan = text_(formData.jenisPengadaan);
    if (!jenisPengadaan) throw new Error('Jenis pengadaan barang/jasa wajib dipilih.');

    var namaRekanan = text_(formData.namaPerusahaan || formData.namaRekanan);
    if (!namaRekanan) throw new Error('Nama rekanan / toko penyedia wajib diisi.');

    var alamatRekanan = text_(formData.alamatPerusahaan || formData.alamatRekanan);
    var npwpRekanan = text_(formData.npwpPerusahaan || formData.npwpRekanan);

    var bppTanggal = text_(formData.bppTanggal);
    if (!bppTanggal) throw new Error('Tanggal BPP / Buku Kas wajib diisi.');

    var bppJenisPajak = text_(formData.bppJenisPajak);
    if (!bppJenisPajak) throw new Error('Jenis pajak BPP wajib dipilih.');

    var nilaiBelanja = normalizeAmount_('Nilai Belanja', formData.nilaiBelanja);
    var nilaiPajak = normalizeAmount_('Nilai Pajak Setor', formData.nilaiPajakSetor !== undefined ? formData.nilaiPajakSetor : formData.nilaiPajak);
    var jenisPajakRincian = text_(formData.jenisPajakRincian);

    var tglBilling = text_(formData.tanggalBilling || formData.tglBilling);
    var noBilling = text_(formData.noBilling);
    var noFaktur = text_(formData.noFaktur);
    var noBupot = text_(formData.noBupot);
    var ntpn = text_(formData.ntpn).toUpperCase();
    var tglSetor = text_(formData.tanggalSetor || formData.tglSetor);
    var sumberDana = text_(formData.sumberDana);
    if (!sumberDana) throw new Error('Sumber dana belanja wajib dipilih.');

    var linkBukti = text_(formData.linkBukti);
    if (linkBukti && !/^https?:\/\//i.test(linkBukti)) {
      throw new Error('Link Bukti Dokumen harus diawali http:// atau https://');
    }

    // Deteksi unit dinas mencakup 14 Cabdis dan 6 unit kantor pusat (aman saat Admin mengedit)
    var isUnit = account.role === 'UNIT_DINAS' || isUnitDinasCode_(npsn);
    var jalurInput = text_(formData.jalurBelanja).toUpperCase();
    var isSiplah = jalurInput === 'SIPLAH' ||
                   (jalurInput !== 'NON_SIPLAH' && (
                     noBilling.toUpperCase().indexOf('SIPLAH') !== -1 ||
                     noBilling.toUpperCase().indexOf('E-KATALOG') !== -1 ||
                     ntpn === 'SIPLAH' ||
                     ntpn === 'E-KATALOG'
                   ));

    if (!isSiplah) {
      if (!npwpRekanan) {
        throw new Error('NPWP Perusahaan/Rekanan wajib diisi untuk transaksi non-SIPLah.');
      }
      var cleanNpwp = npwpRekanan.replace(/\D/g, '');
      if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
        throw new Error('NPWP Perusahaan/Rekanan harus tepat 15 atau 16 digit angka.');
      }
      npwpRekanan = cleanNpwp;

      if (!noBilling) {
        throw new Error('Nomor Kode Billing Pajak wajib diisi.');
      }
      var cleanBilling = noBilling.replace(/\D/g, '');
      if (cleanBilling.length !== 15) {
        throw new Error('Nomor Kode Billing Pajak harus tepat 15 digit angka.');
      }
      noBilling = cleanBilling;

      if (!tglBilling) {
        throw new Error('Tanggal Kode Billing wajib diisi.');
      }
    } else {
      if (npwpRekanan) {
        var cleanNpwpOpt = npwpRekanan.replace(/\D/g, '');
        if (cleanNpwpOpt.length === 15 || cleanNpwpOpt.length === 16) {
          npwpRekanan = cleanNpwpOpt;
        }
      }
    }

    if (ntpn && ntpn !== 'SIPLAH' && ntpn !== 'E-KATALOG') {
      if (ntpn.length !== 16 || !/^[A-Z0-9]{16}$/.test(ntpn)) {
        throw new Error('NTPN harus berupa 16 karakter alfanumerik.');
      }
    }

    // Bersihkan tag terstruktur lama sebelum merakit ulang kolom KET agar edit tidak meninggalkan tag basi
    var baseKet = stripStructuredKetTags_(formData.ket);
    var noArkas = text_(formData.noArkas);
    var noInvoiceSiplah = isSiplah ? text_(formData.noInvoiceSiplah) : '';
    var ketParts = [];
    if (isSiplah) ketParts.push(isUnit ? '[E-Katalog]' : '[SIPLah]');
    if (noArkas) ketParts.push((isUnit ? '[SIPD: ' : '[ARKAS: ') + noArkas + ']');
    if (baseKet) ketParts.push(baseKet);
    if (noInvoiceSiplah) ketParts.push('[INV: ' + noInvoiceSiplah + ']');
    var ket = ketParts.join(' ').trim();

    var prof = getProfilSekolahDataByNpsn_(npsn);
    var namaSekolah = (prof && prof.namaSekolah) ? prof.namaSekolah : text_(formData.namaSekolah || account.namaOperator);
    var subUnitCoretax = (prof && prof.subUnitCoretax) ? prof.subUnitCoretax : text_(formData.subUnitCoretax);
    var kabKota = (prof && prof.kabKota) ? prof.kabKota : text_(formData.kabKota);
    var cabangDinas = (prof && prof.cabangDinas) ? prof.cabangDinas : text_(formData.cabangDinas);

    lock.waitLock(20000);
    var sheet = getSheet_('GOOGLE FORM REKAP PAJAK');
    if (!sheet) throw new Error('Tab GOOGLE FORM REKAP PAJAK tidak ditemukan.');

    if (isEdit && editRow > sheet.getLastRow()) {
      throw new Error('Baris transaksi yang diedit tidak ditemukan.');
    }

    if (isEdit && formData.expectedRecordNo) {
      var curRecordNo = parseSheetAmount_(sheet.getRange(editRow, COL_REKAP.NO + 1).getDisplayValue());
      if (curRecordNo !== Number(formData.expectedRecordNo)) {
        throw new Error('Konflik data: Transaksi telah diubah oleh operator lain. Silakan muat ulang halaman.');
      }
    }

    var noVal = isEdit ? parseSheetAmount_(sheet.getRange(editRow, COL_REKAP.NO + 1).getDisplayValue()) : nextSequenceNo_(sheet);

    var row = new Array(REKAP_COLS);
    for (var z = 0; z < REKAP_COLS; z++) row[z] = '';

    row[COL_REKAP.NO] = noVal;
    row[COL_REKAP.NPSN] = "'" + npsn;
    row[COL_REKAP.NAMA_SEKOLAH] = namaSekolah;
    row[COL_REKAP.CORETAX] = "'" + subUnitCoretax;
    row[COL_REKAP.KAB_KOTA] = kabKota;
    row[COL_REKAP.CABDIN] = cabangDinas;
    row[COL_REKAP.URAIAN] = uraian;
    row[COL_REKAP.JENIS_PENGADAAN] = jenisPengadaan;
    row[COL_REKAP.NAMA_REKANAN] = namaRekanan;
    row[COL_REKAP.ALAMAT_REKANAN] = alamatRekanan;
    row[COL_REKAP.NPWP_REKANAN] = npwpRekanan ? ("'" + npwpRekanan) : '';
    row[COL_REKAP.BPP_TANGGAL] = "'" + bppTanggal;
    row[COL_REKAP.BPP_JENIS_PAJAK] = bppJenisPajak;
    row[COL_REKAP.NILAI_PAJAK] = nilaiPajak;
    row[COL_REKAP.JENIS_PAJAK_RINCIAN] = jenisPajakRincian;
    row[COL_REKAP.TGL_BILLING] = tglBilling ? ("'" + tglBilling) : '';
    row[COL_REKAP.NO_BILLING] = noBilling ? ("'" + noBilling) : '';
    row[COL_REKAP.NO_FAKTUR] = noFaktur ? ("'" + noFaktur) : '';
    row[COL_REKAP.NO_BUPOT] = noBupot ? ("'" + noBupot) : '';
    row[COL_REKAP.NTPN] = ntpn ? ("'" + ntpn) : '';
    row[COL_REKAP.TGL_SETOR] = tglSetor ? ("'" + tglSetor) : '';
    row[COL_REKAP.SUMBER_DANA] = sumberDana;
    row[COL_REKAP.KET] = ket;
    row[COL_REKAP.NILAI_BELANJA] = nilaiBelanja;
    row[COL_REKAP.LINK_BUKTI] = linkBukti;

    var targetRowIdx = isEdit ? editRow : (sheet.getLastRow() + 1);
    if (isEdit) {
      var currentOwner = text_(sheet.getRange(editRow, COL_REKAP.NPSN + 1).getDisplayValue());
      if (account.role !== 'ADMIN' && currentOwner !== account.npsn) {
        throw new Error('Akses ditolak: Anda tidak memiliki izin mengedit baris transaksi ini.');
      }
      sheet.getRange(editRow, 1, 1, REKAP_COLS).setValues([row]);
    } else {
      sheet.getRange(targetRowIdx, 1, 1, REKAP_COLS).setValues([row]);
    }

    sheet.getRange(targetRowIdx, COL_REKAP.NILAI_PAJAK + 1).setNumberFormat('#,##0');
    sheet.getRange(targetRowIdx, COL_REKAP.NILAI_BELANJA + 1).setNumberFormat('#,##0');

    if (account.role === 'ADMIN') {
      logAdminAction_(account.username, isEdit ? 'EDIT_TRANSAKSI' : 'TAMBAH_TRANSAKSI', 'No ' + noVal + ' NPSN ' + npsn);
    }

    SpreadsheetApp.flush();
    try { lock.releaseLock(); } catch (e) {}

    // Bersihkan cache master agar rekanan baru langsung muncul di auto-fill
    if (!isEdit) clearMasterDataCache_();

    var savedRecord = buildTransaction_(row, targetRowIdx);

    var updatedHistory = null;
    try {
      updatedHistory = getRiwayatPajakData_(npsn, 1, 10, '', '');
    } catch (e) {}

    return {
      status: 'success',
      isEdit: isEdit,
      rekapNo: noVal,
      savedRecord: savedRecord,
      updatedHistory: updatedHistory,
      message: isEdit ? 'Data pajak berhasil diperbarui.' : 'Data pajak berhasil disimpan ke database SAJAK.'
    };
  } catch (err) {
    try { lock.releaseLock(); } catch (e) {}
    return { status: 'error', message: err.message || String(err) };
  }
}

function buildTransaction_(r, rowIdx) {
  function stripQuote_(val) {
    return text_(val).replace(/^'+/, '').trim();
  }

  var pajak = parseSheetAmount_(r[COL_REKAP.NILAI_PAJAK]);
  var belanja = parseSheetAmount_(r[COL_REKAP.NILAI_BELANJA]);
  var ketVal = stripQuote_(r[COL_REKAP.KET]);
  var noBillingVal = stripQuote_(r[COL_REKAP.NO_BILLING]);
  var ntpnVal = stripQuote_(r[COL_REKAP.NTPN]).toUpperCase();
  var jPengadaanVal = stripQuote_(r[COL_REKAP.JENIS_PENGADAAN]);

  var isSiplah = noBillingVal.toUpperCase().indexOf('SIPLAH') !== -1 ||
                 noBillingVal.toUpperCase().indexOf('E-KATALOG') !== -1 ||
                 ntpnVal === 'SIPLAH' ||
                 ntpnVal === 'E-KATALOG' ||
                 ketVal.toUpperCase().indexOf('[SIPLAH]') !== -1 ||
                 ketVal.toUpperCase().indexOf('[E-KATALOG]') !== -1 ||
                 jPengadaanVal.toUpperCase().indexOf('SIPLAH') !== -1 ||
                 jPengadaanVal.toUpperCase().indexOf('E-KATALOG') !== -1;

  var mArkas = ketVal.match(/\[(?:ARKAS|SIPD):\s*([^\]]+)\]/i);
  var noArkas = mArkas ? mArkas[1].trim() : '';

  var mInv = ketVal.match(/\[INV:\s*([^\]]+)\]/i);
  var noInvoice = mInv ? mInv[1].trim() : '';
  if (!noInvoice && isSiplah) {
    var mBillInv = noBillingVal.match(/(?:SIPLah|E-Katalog):\s*(.+)/i);
    if (mBillInv) noInvoice = mBillInv[1].trim();
  }

  return {
    rowIdx: rowIdx,
    no: parseSheetAmount_(r[COL_REKAP.NO]) || stripQuote_(r[COL_REKAP.NO]),
    npsn: stripQuote_(r[COL_REKAP.NPSN]),
    namaSekolah: stripQuote_(r[COL_REKAP.NAMA_SEKOLAH]),
    subUnitCoretax: stripQuote_(r[COL_REKAP.CORETAX]),
    kabKota: stripQuote_(r[COL_REKAP.KAB_KOTA]),
    cabangDinas: stripQuote_(r[COL_REKAP.CABDIN]),
    uraianKegiatan: stripQuote_(r[COL_REKAP.URAIAN]),
    jenisPengadaan: jPengadaanVal,
    namaPerusahaan: stripQuote_(r[COL_REKAP.NAMA_REKANAN]),
    alamatPerusahaan: stripQuote_(r[COL_REKAP.ALAMAT_REKANAN]),
    npwpPerusahaan: stripQuote_(r[COL_REKAP.NPWP_REKANAN]),
    bppTanggal: formatDateIso(stripQuote_(r[COL_REKAP.BPP_TANGGAL])),
    bppJenisPajak: stripQuote_(r[COL_REKAP.BPP_JENIS_PAJAK]),
    nilaiPajakSetor: isNaN(pajak) ? 0 : pajak,
    nilaiBelanja: isNaN(belanja) ? 0 : belanja,
    jenisPajakRincian: stripQuote_(r[COL_REKAP.JENIS_PAJAK_RINCIAN]),
    tanggalBilling: formatDateIso(stripQuote_(r[COL_REKAP.TGL_BILLING])),
    noBilling: noBillingVal,
    noFaktur: stripQuote_(r[COL_REKAP.NO_FAKTUR]),
    noBupot: stripQuote_(r[COL_REKAP.NO_BUPOT]),
    ntpn: ntpnVal,
    tanggalSetor: formatDateIso(stripQuote_(r[COL_REKAP.TGL_SETOR])),
    sumberDana: stripQuote_(r[COL_REKAP.SUMBER_DANA]),
    ket: ketVal,
    linkBukti: stripQuote_(r[COL_REKAP.LINK_BUKTI]),
    isSiplah: isSiplah,
    noArkas: noArkas,
    noInvoice: noInvoice,
    noInvoiceSiplah: noInvoice
  };
}

function getRiwayatPajakByNpsn(npsn, page, pageSize, searchQuery, filterJenisPajak, sessionToken) {
  try {
    var account = getSessionAccount_(sessionToken);
    if (!account || (account.role !== 'OPERATOR' && account.role !== 'UNIT_DINAS') || text_(npsn) !== account.npsn) {
      return { status: 'error', message: 'Akses ditolak atau sesi telah berakhir.' };
    }
    return getRiwayatPajakData_(npsn, page, pageSize, searchQuery, filterJenisPajak);
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function getRiwayatPajakData_(npsn, page, pageSize, searchQuery, filterJenisPajak) {
  var sheet = getSheet_('GOOGLE FORM REKAP PAJAK');
  var emptyRes = {
    items: [], totalItems: 0, totalPages: 1, currentPage: 1,
    summary: { totalTransaksi: 0, totalBelanja: 0, totalPajakSetor: 0, lunasNtpn: 0, belumNtpn: 0 }
  };
  if (!sheet || sheet.getLastRow() < 2) return emptyRes;

  var data = getSafeSheetValues_(sheet, 2, 1, REKAP_COLS, 1);
  var target = text_(npsn);
  var q = text_(searchQuery).toLowerCase();
  var fPajak = text_(filterJenisPajak);
  var rows = [];
  var sum = { totalTransaksi: 0, totalBelanja: 0, totalPajakSetor: 0, lunasNtpn: 0, belumNtpn: 0 };

  for (var i = data.length - 1; i >= 0; i--) {
    var r = data[i];
    if (text_(r[COL_REKAP.NPSN]) !== target) continue;
    var item = buildTransaction_(r, i + 2);
    sum.totalTransaksi++;
    sum.totalBelanja += item.nilaiBelanja;
    sum.totalPajakSetor += item.nilaiPajakSetor;
    if (item.ntpn || item.isSiplah) sum.lunasNtpn++; else sum.belumNtpn++;
    if (fPajak && item.bppJenisPajak !== fPajak) continue;
    if (q) {
      var haystack = (item.uraianKegiatan + ' ' + item.namaPerusahaan + ' ' + item.noBilling + ' ' + item.ntpn + ' ' + item.sumberDana + ' ' + item.jenisPajakRincian).toLowerCase();
      if (haystack.indexOf(q) === -1) continue;
    }
    rows.push(item);
  }

  var pSize = Math.min(5000, Math.max(1, Number(pageSize) || 10));
  var totalPages = Math.max(1, Math.ceil(rows.length / pSize));
  var curPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  return {
    items: rows.slice((curPage - 1) * pSize, curPage * pSize),
    totalItems: rows.length, totalPages: totalPages, currentPage: curPage, summary: sum
  };
}

/* ===================== PORTAL ADMIN ===================== */

function logAdminAction_(username, action, detail) {
  var ss = getActiveSpreadsheet_();
  if (!ss) return;
  var sheet = ss.getSheetByName('Log Admin');
  if (!sheet) {
    sheet = ss.insertSheet('Log Admin');
    sheet.appendRow(['WAKTU', 'ADMIN', 'AKSI', 'DETAIL']);
    sheet.getRange(1, 1, 1, 4).setBackground('#047857').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  var stamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
  sheet.appendRow(["'" + stamp, username, action, detail]);
  SpreadsheetApp.flush();
}

function getAdminSourceData_() {
  var accSheet = getSheet_('AKUN OPERATOR');
  var npsnSheet = getSheet_('DATA NPSN');
  var profSheet = getSheet_('FORM PEMBUATAN SUB UNIT');
  var taxSheet = getSheet_('GOOGLE FORM REKAP PAJAK');

  var accounts = accSheet ? getSafeSheetValues_(accSheet, 2, 1, 7, 1) : [];
  var npsnSchools = getNormalizedNpsnSchools_(npsnSheet);
  var profiles = profSheet ? getSafeSheetValues_(profSheet, 2, 1, UNIT_COLS, 1) : [];
  var taxes = taxSheet ? getSafeSheetValues_(taxSheet, 2, 1, REKAP_COLS, 1) : [];

  return { accounts: accounts, npsnSchools: npsnSchools, profiles: profiles, taxes: taxes };
}

function getAdminTaxRows_() {
  var taxSheet = getSheet_('GOOGLE FORM REKAP PAJAK');
  return taxSheet ? getSafeSheetValues_(taxSheet, 2, 1, REKAP_COLS, 1) : [];
}

function isAdminProfileComplete_(profile) {
  return !!profile &&
    text_(profile[COL_UNIT.CORETAX]) !== '' &&
    text_(profile[COL_UNIT.NAMA_KASEK]) !== '' &&
    text_(profile[COL_UNIT.NIK_KASEK]) !== '' &&
    text_(profile[COL_UNIT.NAMA_BENDAHARA]) !== '' &&
    text_(profile[COL_UNIT.NIK_BENDAHARA]) !== '';
}

function isUnitProfileComplete_(profile) {
  if (!isAdminProfileComplete_(profile)) return false;
  var needed = [COL_UNIT.NIP_KPA, COL_UNIT.NIP_BPP, COL_UNIT.NAMA_PPTK, COL_UNIT.NIP_PPTK, COL_UNIT.NIK_PPTK];
  for (var i = 0; i < needed.length; i++) if (text_(profile[needed[i]]) === '') return false;
  return true;
}

function getLoggedInNpsnMap_(accounts) {
  var map = {};
  for (var a = 0; a < accounts.length; a++) {
    var npsn = text_(accounts[a][COL_AKUN.NPSN]);
    if (npsn && normalizeRole_(accounts[a][COL_AKUN.ROLE]) !== 'ADMIN' && text_(accounts[a][COL_AKUN.LAST_LOGIN])) map[npsn] = true;
  }
  return map;
}

function getItemEntityType_(item) {
  var npsn = text_(item.npsn);
  if (isCabdisCode_(npsn) || (item.namaSekolah && item.namaSekolah.toUpperCase().indexOf('CABANG DINAS') !== -1)) {
    return 'CABDIS';
  }
  if (DINAS_PUSAT_CODES.indexOf(npsn.toUpperCase()) !== -1 ||
      (item.cabangDinas && item.cabangDinas.toUpperCase().indexOf('DINAS PENDIDIKAN PROVSU') !== -1) ||
      (item.namaSekolah && (item.namaSekolah.toUpperCase().indexOf('BIDANG') !== -1 ||
                            item.namaSekolah.toUpperCase().indexOf('SEKRETARIAT') !== -1 ||
                            item.namaSekolah.toUpperCase().indexOf('UPTD') !== -1))) {
    return 'DINAS_PUSAT';
  }
  return 'SEKOLAH';
}

function getFilteredAdminTransactions_(data, filters) {
  filters = filters || {};
  var query = text_(filters.q).toLowerCase();
  var result = [];
  for (var i = data.taxes.length - 1; i >= 0; i--) {
    var item = buildTransaction_(data.taxes[i], i + 2);
    if (filters.tipeUnit) {
      var entType = getItemEntityType_(item);
      if (filters.tipeUnit === 'SEKOLAH' && entType !== 'SEKOLAH') continue;
      if (filters.tipeUnit === 'ALL_UNIT' && entType === 'SEKOLAH') continue;
      if (filters.tipeUnit === 'DINAS_PUSAT' && entType !== 'DINAS_PUSAT') continue;
      if (filters.tipeUnit === 'CABDIS' && entType !== 'CABDIS') continue;
    }
    if (filters.cabdin && normalizeCabdinName_(item.cabangDinas) !== normalizeCabdinName_(filters.cabdin)) continue;
    if (filters.kabKota && item.kabKota !== filters.kabKota) continue;
    if (filters.bpp && item.bppJenisPajak !== filters.bpp) continue;
    if (filters.sumberDana && item.sumberDana !== filters.sumberDana) continue;
    if (filters.ntpnStatus === 'LENGKAP' && !item.ntpn && !item.isSiplah) continue;
    if (filters.ntpnStatus === 'BELUM' && (item.ntpn || item.isSiplah)) continue;
    if (filters.startDate && item.bppTanggal < filters.startDate) continue;
    if (filters.endDate && item.bppTanggal > filters.endDate) continue;
    if (query) {
      var searchable = [item.npsn, item.namaSekolah, item.uraianKegiatan, item.namaPerusahaan, item.noBilling, item.ntpn, item.sumberDana, item.jenisPajakRincian, item.ket].join(' ').toLowerCase();
      if (searchable.indexOf(query) === -1) continue;
    }
    result.push(item);
  }
  return result;
}

function getAdminOverview(sessionToken, filters) {
  try {
    requireAdminSession_(sessionToken);
    var data = getAdminSourceData_();
    filters = filters || {};
    var filterTipe = filters.tipe || '';
    var filterCabdinNorm = normalizeCabdinName_(filters.cabdin || '');

    var schools = {};
    if (filterTipe !== 'UNIT_DINAS') {
      for (var n = 0; n < data.npsnSchools.length; n++) {
        var ns = data.npsnSchools[n];
        if (!ns.namaSekolah) continue;
        var nKey = canonicalSchoolKey_(ns.namaSekolah);
        if (!nKey) continue;
        if (!schools[nKey]) {
          schools[nKey] = { nama: ns.namaSekolah, cabdin: ns.cabangDinas, npsn: ns.npsn };
        } else if (ns.npsn && !schools[nKey].npsn) {
          schools[nKey].npsn = ns.npsn;
        }
      }
      for (var pr = 0; pr < data.profiles.length; pr++) {
        var pNpsn = text_(data.profiles[pr][COL_UNIT.NPSN]);
        if (/^\d{8}$/.test(pNpsn)) {
          var pName = text_(data.profiles[pr][COL_UNIT.NAMA_SEKOLAH]);
          var pKey = canonicalSchoolKey_(pName);
          if (pKey && !schools[pKey]) {
            schools[pKey] = {
              nama: pName,
              cabdin: normalizeCabdinName_(data.profiles[pr][COL_UNIT.CABDIN]),
              npsn: pNpsn
            };
          }
        }
      }
    }

    var profileByName = {}, profileByNpsn = {};
    for (var p = 0; p < data.profiles.length; p++) {
      var pk = canonicalSchoolKey_(data.profiles[p][COL_UNIT.NAMA_SEKOLAH]);
      if (pk) profileByName[pk] = data.profiles[p];
      profileByNpsn[text_(data.profiles[p][COL_UNIT.NPSN])] = data.profiles[p];
    }
    var loggedIn = getLoggedInNpsnMap_(data.accounts);

    var totalSekolah = 0, profilLengkap = 0, profilBelumLengkap = 0, sekolahBelumLogin = 0;
    if (filterTipe !== 'UNIT_DINAS') {
      var schoolKeys = Object.keys(schools);
      for (var s = 0; s < schoolKeys.length; s++) {
        var school = schools[schoolKeys[s]];
        if (filterCabdinNorm && normalizeCabdinName_(school.cabdin) !== filterCabdinNorm) continue;
        totalSekolah++;
        var prof = (school.npsn && profileByNpsn[school.npsn]) ? profileByNpsn[school.npsn] : profileByName[schoolKeys[s]];
        if (isAdminProfileComplete_(prof)) profilLengkap++; else profilBelumLengkap++;
        var sn = prof ? text_(prof[COL_UNIT.NPSN]) : school.npsn;
        if (!sn || !loggedIn[sn]) sekolahBelumLogin++;
      }
    }

    var totalUnit = 0, unitLengkap = 0, unitBelumLogin = 0;
    if (filterTipe !== 'SEKOLAH') {
      for (var a = 0; a < data.accounts.length; a++) {
        if (normalizeRole_(data.accounts[a][COL_AKUN.ROLE]) !== 'UNIT_DINAS') continue;
        var code = text_(data.accounts[a][COL_AKUN.NPSN]);
        var up = profileByNpsn[code];
        if (filterCabdinNorm) {
          var uName = up ? text_(up[COL_UNIT.NAMA_SEKOLAH]) : text_(data.accounts[a][COL_AKUN.NAMA_OPERATOR]);
          if (normalizeCabdinName_(uName) !== filterCabdinNorm) continue;
        }
        totalUnit++;
        if (isUnitProfileComplete_(up)) unitLengkap++;
        if (!loggedIn[code]) unitBelumLogin++;
      }
    }

    var txFilter = { cabdin: filters.cabdin || '' };
    if (filterTipe === 'SEKOLAH') txFilter.tipeUnit = 'SEKOLAH';
    else if (filterTipe === 'UNIT_DINAS') txFilter.tipeUnit = 'ALL_UNIT';
    var txs = getFilteredAdminTransactions_(data, txFilter);
    var totalBelanja = 0, totalPajakSetor = 0, nominalNtpn = 0, belumNtpn = 0;
    for (var t = 0; t < txs.length; t++) {
      totalBelanja += txs[t].nilaiBelanja;
      totalPajakSetor += txs[t].nilaiPajakSetor;
      if (txs[t].ntpn || txs[t].isSiplah) nominalNtpn += txs[t].nilaiPajakSetor; else belumNtpn++;
    }

    return {
      status: 'success',
      metrics: {
        totalSekolah: totalSekolah, profilLengkap: profilLengkap, profilBelumLengkap: profilBelumLengkap,
        sekolahBelumLogin: sekolahBelumLogin,
        totalUnit: totalUnit, unitLengkap: unitLengkap, unitBelumLogin: unitBelumLogin,
        totalTransaksi: txs.length, totalBelanja: totalBelanja, totalPajakSetor: totalPajakSetor,
        nominalNtpn: nominalNtpn, transaksiBelumNtpn: belumNtpn
      }
    };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function getAdminTransactions(sessionToken, page, pageSize, filters) {
  try {
    requireAdminSession_(sessionToken);
    var taxRows = getAdminTaxRows_();
    var rows = getFilteredAdminTransactions_({ taxes: taxRows }, filters);
    var reqSize = Number(pageSize);
    var returnAll = reqSize === -1 || reqSize >= 5000;
    var size = returnAll ? Math.max(1, rows.length) : Math.min(200, Math.max(1, reqSize || 20));
    var pages = Math.max(1, Math.ceil(rows.length / size));
    var current = returnAll ? 1 : Math.min(Math.max(1, Number(page) || 1), pages);
    var totalBelanja = 0, totalPajakSetor = 0, belumNtpn = 0;
    for (var i = 0; i < rows.length; i++) {
      totalBelanja += rows[i].nilaiBelanja;
      totalPajakSetor += rows[i].nilaiPajakSetor;
      if (!rows[i].ntpn && !rows[i].isSiplah) belumNtpn++;
    }
    var items = returnAll ? rows : rows.slice((current - 1) * size, current * size);
    return {
      status: 'success', items: items,
      totalItems: rows.length, currentPage: current, totalPages: pages,
      summary: { totalBelanja: totalBelanja, totalPajakSetor: totalPajakSetor, belumNtpn: belumNtpn }
    };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function exportAdminTransactions(sessionToken, filters) {
  try {
    requireAdminSession_(sessionToken);
    var taxRows = getAdminTaxRows_();
    var sheet = getSheet_('GOOGLE FORM REKAP PAJAK');
    var headers = sheet ? sheet.getRange(1, 1, 1, REKAP_COLS).getDisplayValues()[0] : [];
    var rows = getFilteredAdminTransactions_({ taxes: taxRows }, filters);
    var csvRows = [headers];
    for (var i = 0; i < rows.length; i++) {
      var it = rows[i];
      csvRows.push([
        it.no, it.npsn, it.namaSekolah, it.subUnitCoretax, it.kabKota, it.cabangDinas,
        it.uraianKegiatan, it.jenisPengadaan, it.namaPerusahaan, it.alamatPerusahaan,
        it.npwpPerusahaan, it.bppTanggal, it.bppJenisPajak, it.nilaiPajakSetor,
        it.jenisPajakRincian, it.tanggalBilling, it.noBilling, it.noFaktur,
        it.noBupot, it.ntpn, it.tanggalSetor, it.sumberDana, it.ket, it.nilaiBelanja,
        it.linkBukti
      ]);
    }
    var csv = csvRows.map(function(row) {
      return row.map(function(value) {
        var t = String(value === null || value === undefined ? '' : value);
        if (/^\s*[=+\-@]/.test(t)) t = "'" + t;
        return '"' + t.replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\r\n');
    return { status: 'success', csv: csv, count: rows.length };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function getAdminSchools(sessionToken, page, pageSize, search, cabdin, statusFilter, tipeFilter, kabKotaFilter) {
  try {
    requireAdminSession_(sessionToken);
    var data = getAdminSourceData_();
    var schoolMap = {};

    // 1. Sumber data sekolah resmi dari sheet Data NPSN (pembaca dinamis)
    for (var n = 0; n < data.npsnSchools.length; n++) {
      var ns = data.npsnSchools[n];
      if (!ns.namaSekolah) continue;
      var nsUpper = String(ns.namaSekolah).toUpperCase();
      if (nsUpper.indexOf('PROVINSI SUMATERA UTARA') !== -1 || nsUpper.indexOf('TAHUN 202') !== -1) continue;
      var nKey = canonicalSchoolKey_(ns.namaSekolah);
      if (!nKey) continue;
      if (!schoolMap[nKey]) {
        schoolMap[nKey] = {
          npsn: ns.npsn,
          namaSekolah: ns.namaSekolah,
          cabangDinas: ns.cabangDinas,
          kabKota: ns.kabKota
        };
      } else if (ns.npsn && !schoolMap[nKey].npsn) {
        schoolMap[nKey].npsn = ns.npsn;
      }
    }

    // 2. Tambahkan sekolah dari sheet profil jika belum terdaftar di Data NPSN
    for (var pr = 0; pr < data.profiles.length; pr++) {
      var pNpsn = text_(data.profiles[pr][COL_UNIT.NPSN]);
      if (/^\d{8}$/.test(pNpsn)) {
        var pName = text_(data.profiles[pr][COL_UNIT.NAMA_SEKOLAH]);
        var pKey = canonicalSchoolKey_(pName);
        if (pKey && !schoolMap[pKey]) {
          schoolMap[pKey] = {
            npsn: pNpsn,
            namaSekolah: pName,
            cabangDinas: normalizeCabdinName_(data.profiles[pr][COL_UNIT.CABDIN]),
            kabKota: text_(data.profiles[pr][COL_UNIT.KAB_KOTA])
          };
        }
      }
    }

    var profilesByName = {}, profilesByNpsn = {};
    for (var p = 0; p < data.profiles.length; p++) {
      var pk = canonicalSchoolKey_(data.profiles[p][COL_UNIT.NAMA_SEKOLAH]);
      if (pk) profilesByName[pk] = data.profiles[p];
      profilesByNpsn[text_(data.profiles[p][COL_UNIT.NPSN])] = data.profiles[p];
    }

    // Agregasi transaksi termasuk totalBelanja agar modal detail menampilkan nominal belanja riil
    var txByName = {}, txByNpsn = {};
    for (var t = 0; t < data.taxes.length; t++) {
      var tax = data.taxes[t];
      var nominal = parseSheetAmount_(tax[COL_REKAP.NILAI_PAJAK]);
      var belanja = parseSheetAmount_(tax[COL_REKAP.NILAI_BELANJA]);
      var noBillTax = text_(tax[COL_REKAP.NO_BILLING]);
      var ketTax = text_(tax[COL_REKAP.KET]);
      var ntpnTaxUpper = text_(tax[COL_REKAP.NTPN]).toUpperCase();
      var isSiplahTax = noBillTax.toUpperCase().indexOf('SIPLAH') !== -1 ||
                        noBillTax.toUpperCase().indexOf('E-KATALOG') !== -1 ||
                        ntpnTaxUpper === 'SIPLAH' ||
                        ntpnTaxUpper === 'E-KATALOG' ||
                        ketTax.toUpperCase().indexOf('SIPLAH') !== -1 ||
                        ketTax.toUpperCase().indexOf('E-KATALOG') !== -1;
      var hasNtpn = !!ntpnTaxUpper || isSiplahTax;
      var nameKey = canonicalSchoolKey_(tax[COL_REKAP.NAMA_SEKOLAH]);
      var npsnKey = text_(tax[COL_REKAP.NPSN]);
      var maps = [[txByName, nameKey], [txByNpsn, npsnKey]];
      for (var m = 0; m < maps.length; m++) {
        var bucket = maps[m][0], bk = maps[m][1];
        if (!bk) continue;
        if (!bucket[bk]) bucket[bk] = { count: 0, belanja: 0, nominal: 0, paid: 0, unPaidCount: 0 };
        bucket[bk].count++;
        bucket[bk].belanja += belanja;
        bucket[bk].nominal += nominal;
        if (hasNtpn) bucket[bk].paid += nominal;
        else bucket[bk].unPaidCount++;
      }
    }

    var loggedIn = getLoggedInNpsnMap_(data.accounts);
    var query = text_(search).toLowerCase();
    var filterCabdinNorm = normalizeCabdinName_(cabdin || '');
    var items = [];

    function pushItem_(entry) {
      if (filterCabdinNorm && normalizeCabdinName_(entry.cabangDinas) !== filterCabdinNorm) return;
      if (kabKotaFilter) {
        var kEntryNorm = String(entry.kabKota || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        var kFilterNorm = String(kabKotaFilter || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (kFilterNorm && kEntryNorm.indexOf(kFilterNorm) === -1 && kFilterNorm.indexOf(kEntryNorm) === -1) return;
      }
      if (query && (entry.namaSekolah + ' ' + entry.kabKota + ' ' + entry.cabangDinas + ' ' + entry.npsn).toLowerCase().indexOf(query) === -1) return;
      if (statusFilter === 'BELUM_LOGIN' && entry.pernahLogin) return;
      if (statusFilter === 'LENGKAP' && entry.status !== 'LENGKAP') return;
      if (statusFilter === 'BELUM_LENGKAP' && entry.status !== 'BELUM_LENGKAP') return;
      items.push(entry);
    }

    if (tipeFilter !== 'UNIT_DINAS') {
      var keys = Object.keys(schoolMap);
      for (var k = 0; k < keys.length; k++) {
        var school = schoolMap[keys[k]];
        var profile = (school.npsn && profilesByNpsn[school.npsn]) ? profilesByNpsn[school.npsn] : profilesByName[keys[k]];
        var npsn = profile ? text_(profile[COL_UNIT.NPSN]) : school.npsn;
        var tx = (npsn && txByNpsn[npsn]) ? txByNpsn[npsn] : (txByName[keys[k]] || { count: 0, belanja: 0, nominal: 0, paid: 0, unPaidCount: 0 });
        var isComplete = isAdminProfileComplete_(profile);
        pushItem_({
          jenis: 'SEKOLAH', namaSekolah: school.namaSekolah, cabangDinas: school.cabangDinas, kabKota: school.kabKota,
          npsn: npsn, status: isComplete ? 'LENGKAP' : 'BELUM_LENGKAP',
          statusProfil: isComplete ? 'Sudah Lengkap' : 'Belum Lengkap',
          isProfileComplete: isComplete,
          pernahLogin: !!(npsn && loggedIn[npsn]),
          subUnitCoretax: profile ? text_(profile[COL_UNIT.CORETAX]) : '',
          alamatSekolah: profile ? text_(profile[COL_UNIT.ALAMAT]) : '',
          kelurahan: profile ? text_(profile[COL_UNIT.KELURAHAN]) : '',
          kecamatan: profile ? text_(profile[COL_UNIT.KECAMATAN]) : '',
          pejabat1Label: 'Kepala Sekolah', pejabat1: profile ? text_(profile[COL_UNIT.NAMA_KASEK]) : '',
          namaKasek: profile ? text_(profile[COL_UNIT.NAMA_KASEK]) : '',
          pejabat1Id: profile ? maskIdentity_(profile[COL_UNIT.NIK_KASEK]) : '',
          nikKasek: profile ? maskIdentity_(profile[COL_UNIT.NIK_KASEK]) : '',
          nipKpa: profile ? text_(profile[COL_UNIT.NIP_KPA]) : '',
          pangkatKpa: profile ? text_(profile[COL_UNIT.PANGKAT_KPA]) : '',
          pejabat2Label: 'Bendahara', pejabat2: profile ? text_(profile[COL_UNIT.NAMA_BENDAHARA]) : '',
          namaBendahara: profile ? text_(profile[COL_UNIT.NAMA_BENDAHARA]) : '',
          pejabat2Id: profile ? maskIdentity_(profile[COL_UNIT.NIK_BENDAHARA]) : '',
          nikBendahara: profile ? maskIdentity_(profile[COL_UNIT.NIK_BENDAHARA]) : '',
          nipBpp: profile ? text_(profile[COL_UNIT.NIP_BPP]) : '',
          pangkatBpp: profile ? text_(profile[COL_UNIT.PANGKAT_BPP]) : '',
          totalTransaksi: tx.count,
          transaksiBelumNtpn: tx.unPaidCount || 0,
          totalBelanja: tx.belanja,
          totalNominal: tx.nominal,
          nominalDenganNtpn: tx.paid,
          totalPajak: tx.nominal,
          pajakLengkapNtpn: tx.paid,
          pajakBelumNtpn: Math.max(0, tx.nominal - tx.paid)
        });
      }
    }

    if (tipeFilter !== 'SEKOLAH') {
      for (var a = 0; a < data.accounts.length; a++) {
        if (normalizeRole_(data.accounts[a][COL_AKUN.ROLE]) !== 'UNIT_DINAS') continue;
        var code = text_(data.accounts[a][COL_AKUN.NPSN]);
        var up = profilesByNpsn[code];
        var utx = txByNpsn[code] || { count: 0, belanja: 0, nominal: 0, paid: 0, unPaidCount: 0 };
        var isCabUnit = isCabdisCode_(code);
        var isUnitComplete = isUnitProfileComplete_(up);
        var unitName = up && text_(up[COL_UNIT.NAMA_SEKOLAH]) ? text_(up[COL_UNIT.NAMA_SEKOLAH]) : text_(data.accounts[a][COL_AKUN.NAMA_OPERATOR]);
        pushItem_({
          jenis: 'UNIT_DINAS',
          namaSekolah: unitName,
          cabangDinas: isCabUnit ? normalizeCabdinName_(unitName || code) : 'Kantor Pusat Disdik',
          kabKota: isCabUnit && up ? text_(up[COL_UNIT.KAB_KOTA]) : '',
          npsn: code,
          status: isUnitComplete ? 'LENGKAP' : 'BELUM_LENGKAP',
          statusProfil: isUnitComplete ? 'Sudah Lengkap' : 'Belum Lengkap',
          isProfileComplete: isUnitComplete,
          pernahLogin: !!loggedIn[code],
          subUnitCoretax: up ? text_(up[COL_UNIT.CORETAX]) : '',
          alamatSekolah: up ? text_(up[COL_UNIT.ALAMAT]) : '',
          kelurahan: up ? text_(up[COL_UNIT.KELURAHAN]) : '',
          kecamatan: up ? text_(up[COL_UNIT.KECAMATAN]) : '',
          pejabat1Label: 'KPA', pejabat1: up ? text_(up[COL_UNIT.NAMA_KASEK]) : '',
          namaKasek: up ? text_(up[COL_UNIT.NAMA_KASEK]) : '',
          pejabat1Id: up ? maskIdentity_(up[COL_UNIT.NIK_KASEK]) : '',
          nikKasek: up ? maskIdentity_(up[COL_UNIT.NIK_KASEK]) : '',
          nipKpa: up ? text_(up[COL_UNIT.NIP_KPA]) : '',
          pangkatKpa: up ? text_(up[COL_UNIT.PANGKAT_KPA]) : '',
          pejabat2Label: 'BPP', pejabat2: up ? text_(up[COL_UNIT.NAMA_BENDAHARA]) : '',
          namaBendahara: up ? text_(up[COL_UNIT.NAMA_BENDAHARA]) : '',
          pejabat2Id: up ? maskIdentity_(up[COL_UNIT.NIK_BENDAHARA]) : '',
          nikBendahara: up ? maskIdentity_(up[COL_UNIT.NIK_BENDAHARA]) : '',
          nipBpp: up ? text_(up[COL_UNIT.NIP_BPP]) : '',
          pangkatBpp: up ? text_(up[COL_UNIT.PANGKAT_BPP]) : '',
          totalTransaksi: utx.count,
          transaksiBelumNtpn: utx.unPaidCount || 0,
          totalBelanja: utx.belanja,
          totalNominal: utx.nominal,
          nominalDenganNtpn: utx.paid,
          totalPajak: utx.nominal,
          pajakLengkapNtpn: utx.paid,
          pajakBelumNtpn: Math.max(0, utx.nominal - utx.paid)
        });
      }
    }

    items.sort(function(l, r) { return l.namaSekolah.localeCompare(r.namaSekolah); });
    var size = Math.min(100, Math.max(1, Number(pageSize) || 25));
    var pages = Math.max(1, Math.ceil(items.length / size));
    var current = Math.min(Math.max(1, Number(page) || 1), pages);
    return { status: 'success', items: items.slice((current - 1) * size, current * size), totalItems: items.length, currentPage: current, totalPages: pages };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function getAdminAccounts(sessionToken, search) {
  try {
    requireAdminSession_(sessionToken);
    var sheet = getSheet_('Akun Operator');
    if (!sheet || sheet.getLastRow() < 2) return { status: 'success', items: [] };
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getDisplayValues();
    var query = text_(search).toLowerCase();
    var items = [];
    for (var i = 0; i < rows.length; i++) {
      var role = normalizeRole_(rows[i][COL_AKUN.ROLE]);
      if (role === 'ADMIN') continue;
      var account = {
        username: text_(rows[i][COL_AKUN.USERNAME]), npsn: text_(rows[i][COL_AKUN.NPSN]),
        namaOperator: text_(rows[i][COL_AKUN.NAMA_OPERATOR]), role: role,
        status: text_(rows[i][COL_AKUN.STATUS]).toUpperCase(),
        lastLogin: formatDateTime_(rows[i][COL_AKUN.LAST_LOGIN])
      };
      if (query && (account.username + ' ' + account.npsn + ' ' + account.namaOperator + ' ' + account.role).toLowerCase().indexOf(query) === -1) continue;
      items.push(account);
    }
    return { status: 'success', items: items };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function manageAdminOperator(sessionToken, action, payload) {
  var lock = LockService.getScriptLock();
  try {
    var admin = requireAdminSession_(sessionToken);
    lock.waitLock(10000);
    payload = payload || {};
    var sheet = getSheet_('Akun Operator');
    if (!sheet) throw new Error('Tab Akun Operator belum tersedia. Jalankan setupDatabase() terlebih dahulu.');
    var npsn = text_(payload.npsn);

    if (action === 'create') {
      var role = payload.role === 'UNIT_DINAS' ? 'UNIT_DINAS' : 'OPERATOR';
      var username = text_(payload.username || npsn);
      var password = text_(payload.password);
      var name = text_(payload.namaOperator);
      if (role === 'OPERATOR') {
        if (!/^\d{8}$/.test(npsn)) throw new Error('NPSN harus terdiri dari 8 digit.');
      } else {
        npsn = npsn.toUpperCase();
        username = username.toUpperCase();
        if (!/^[A-Z0-9\-_]{3,20}$/.test(npsn)) throw new Error('Kode unit harus 3-20 karakter (huruf, angka, tanda hubung, atau garis bawah).');
      }
      if (!username || !name || password.length < 8) throw new Error('Username, nama, dan password minimal 8 karakter wajib diisi.');

      var existing = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getDisplayValues() : [];
      for (var i = 0; i < existing.length; i++) {
        if (text_(existing[i][COL_AKUN.USERNAME]) === username || text_(existing[i][COL_AKUN.NPSN]) === npsn) {
          throw new Error('Username atau NPSN/kode unit sudah terdaftar.');
        }
      }
      sheet.appendRow(["'" + username, "'" + password, "'" + npsn, name, 'AKTIF', role, '']);
      SpreadsheetApp.flush();
      logAdminAction_(admin.username, 'BUAT_AKUN_' + role, npsn);
      return { status: 'success', message: 'Akun ' + username + ' (' + name + ') berhasil dibuat!' };
    }

    if (!npsn) throw new Error('NPSN/kode unit akun wajib diisi.');
    var accountRows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getDisplayValues() : [];
    var foundRow = 0, foundUsername = '';
    for (var r = 0; r < accountRows.length; r++) {
      if (text_(accountRows[r][COL_AKUN.NPSN]) === npsn && normalizeRole_(accountRows[r][COL_AKUN.ROLE]) !== 'ADMIN') {
        foundRow = r + 2;
        foundUsername = text_(accountRows[r][COL_AKUN.USERNAME]);
        break;
      }
    }
    if (!foundRow) throw new Error('Akun tidak ditemukan.');

    if (action === 'reset') {
      var newPassword = text_(payload.password);
      if (newPassword.length < 8) throw new Error('Password baru minimal 8 karakter.');
      sheet.getRange(foundRow, COL_AKUN.PASSWORD + 1).setValue("'" + newPassword);
      SpreadsheetApp.flush();
      revokeAccountSessionCache_(npsn);
      if (foundUsername) revokeAccountSessionCache_(foundUsername);
      logAdminAction_(admin.username, 'RESET_PASSWORD', npsn);
    } else if (action === 'status') {
      var newStatus = text_(payload.status).toUpperCase();
      if (newStatus !== 'AKTIF' && newStatus !== 'NONAKTIF') throw new Error('Status akun tidak valid.');
      sheet.getRange(foundRow, COL_AKUN.STATUS + 1).setValue(newStatus);
      SpreadsheetApp.flush();
      if (newStatus === 'NONAKTIF') {
        revokeAccountSessionCache_(npsn);
        if (foundUsername) revokeAccountSessionCache_(foundUsername);
      }
      logAdminAction_(admin.username, 'UBAH_STATUS_AKUN', npsn + ' ' + newStatus);
    } else if (action === 'edit') {
      var newName = text_(payload.namaOperator);
      if (!newName) throw new Error('Nama operator wajib diisi.');
      sheet.getRange(foundRow, COL_AKUN.NAMA_OPERATOR + 1).setValue(newName);
      SpreadsheetApp.flush();
      logAdminAction_(admin.username, 'EDIT_AKUN', npsn);
    } else if (action === 'delete') {
      if (foundUsername === admin.username || npsn === admin.npsn) {
        throw new Error('Anda tidak dapat menghapus akun yang sedang Anda gunakan.');
      }
      sheet.deleteRow(foundRow);
      SpreadsheetApp.flush();
      revokeAccountSessionCache_(npsn);
      if (foundUsername) revokeAccountSessionCache_(foundUsername);
      logAdminAction_(admin.username, 'HAPUS_AKUN', foundUsername + ' / ' + npsn);
    } else {
      throw new Error('Aksi pengelolaan akun tidak dikenal.');
    }
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function generateAdminOperatorAccounts(sessionToken) {
  var lock = LockService.getScriptLock();
  try {
    var admin = requireAdminSession_(sessionToken);
    lock.waitLock(15000);
    var data = getAdminSourceData_();

    var existingNpsn = {}, existingUsername = {};
    for (var a = 0; a < data.accounts.length; a++) {
      var accNpsn = text_(data.accounts[a][COL_AKUN.NPSN]);
      var accUser = text_(data.accounts[a][COL_AKUN.USERNAME]);
      if (accUser) existingUsername[accUser] = true;
      if (accNpsn) existingNpsn[accNpsn] = true;
    }

    var candidateSchools = [];
    for (var n = 0; n < data.npsnSchools.length; n++) {
      var ns = data.npsnSchools[n];
      if (/^\d{8}$/.test(ns.npsn) && ns.namaSekolah) {
        candidateSchools.push({ npsn: ns.npsn, nama: ns.namaSekolah });
      }
    }
    for (var p = 0; p < data.profiles.length; p++) {
      var pr = data.profiles[p];
      var pNpsn = text_(pr[COL_UNIT.NPSN]);
      var pName = text_(pr[COL_UNIT.NAMA_SEKOLAH]);
      if (/^\d{8}$/.test(pNpsn) && pName) {
        candidateSchools.push({ npsn: pNpsn, nama: pName });
      }
    }

    var generated = [], used = {};
    for (var c = 0; c < candidateSchools.length; c++) {
      var cand = candidateSchools[c];
      var npsn = cand.npsn;
      if (existingNpsn[npsn] || existingUsername[npsn] || used[npsn]) continue;
      var tempPassword = Utilities.getUuid().replace(/-/g, '').substring(0, 10);
      generated.push(["'" + npsn, "'" + tempPassword, "'" + npsn, 'Operator ' + cand.nama, 'AKTIF', 'OPERATOR', '']);
      used[npsn] = true;
    }

    if (generated.length) {
      var sheet = getSheet_('Akun Operator');
      if (!sheet) throw new Error('Tab Akun Operator belum tersedia. Jalankan setupDatabase() terlebih dahulu.');
      sheet.getRange(sheet.getLastRow() + 1, 1, generated.length, 7).setValues(generated);
      SpreadsheetApp.flush();
      logAdminAction_(admin.username, 'GENERATE_AKUN_OPERATOR', generated.length + ' akun');
    }

    return {
      status: 'success',
      count: generated.length,
      credentials: generated.map(function(row) {
        return {
          npsn: String(row[2]).replace(/^'/, ''),
          username: String(row[0]).replace(/^'/, ''),
          password: String(row[1]).replace(/^'/, ''),
          namaOperator: row[3]
        };
      })
    };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function deleteAdminTransaction(sessionToken, rowIdx, expectedNo, expectedNpsn) {
  var lock = LockService.getScriptLock();
  try {
    var admin = requireAdminSession_(sessionToken);
    lock.waitLock(10000);
    var row = Number(rowIdx);
    var sheet = getSheet_('GOOGLE FORM REKAP PAJAK');
    if (!sheet || row < 2 || row > sheet.getLastRow()) throw new Error('Transaksi tidak ditemukan atau sudah berubah.');
    var reference = sheet.getRange(row, 1, 1, 3).getDisplayValues()[0];
    if (text_(reference[0]) !== text_(expectedNo) || text_(reference[1]) !== text_(expectedNpsn)) {
      throw new Error('Data transaksi telah berubah. Muat ulang daftar sebelum menghapus.');
    }
    sheet.deleteRow(row);
    SpreadsheetApp.flush();
    logAdminAction_(admin.username, 'HAPUS_TRANSAKSI', 'Baris ' + row + ', NO ' + reference[0] + ', NPSN ' + reference[1]);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * INOVASI 1A: Simpan Transaksi Massal dari Hasil Import BKU ARKAS
 */
function simpanBatchDataRekap(items, sessionToken) {
  var lock = LockService.getScriptLock();
  try {
    var account = getSessionAccount_(sessionToken);
    if (!account) throw new Error('Sesi tidak valid atau telah berakhir. Silakan login kembali.');
    if (!items || !items.length) throw new Error('Tidak ada data transaksi yang dikirim.');

    lock.waitLock(30000);
    var sheet = getSheet_('GOOGLE FORM REKAP PAJAK');
    if (!sheet) throw new Error('Tab GOOGLE FORM REKAP PAJAK tidak ditemukan.');

    var nextNo = nextSequenceNo_(sheet);
    var batchRows = [];
    var prof = getProfilSekolahDataByNpsn_(account.npsn);

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var itemNpsn = text_(item.npsn || account.npsn);
      if (account.role !== 'ADMIN' && itemNpsn !== account.npsn) {
        throw new Error('Akses ditolak: NPSN baris ke-' + (i + 1) + ' tidak sesuai dengan akun Anda.');
      }

      var isUnitItem = account.role === 'UNIT_DINAS' || isUnitDinasCode_(itemNpsn);
      var uraian = text_(item.uraianKegiatan || item.uraian);
      var jenisPengadaan = text_(item.jenisPengadaan) || 'Pengadaan Langsung';
      var namaRekanan = text_(item.namaPerusahaan || item.namaRekanan) || 'Rekanan Toko';
      var alamatRekanan = text_(item.alamatPerusahaan || item.alamatRekanan);
      var npwpRekanan = text_(item.npwpPerusahaan || item.npwpRekanan);
      var bppTanggal = text_(item.bppTanggal);
      var bppJenisPajak = text_(item.bppJenisPajak);

      var nilaiBelanja = normalizeAmount_('Nilai Belanja', item.nilaiBelanja);
      var nilaiPajak = normalizeAmount_('Nilai Pajak Setor', item.nilaiPajakSetor !== undefined ? item.nilaiPajakSetor : item.nilaiPajak);
      var jenisPajakRincian = text_(item.jenisPajakRincian);
      var tglBilling = text_(item.tanggalBilling || item.tglBilling);
      var noBilling = text_(item.noBilling);
      var noFaktur = text_(item.noFaktur);
      var noBupot = text_(item.noBupot);
      var ntpn = text_(item.ntpn).toUpperCase();
      var tglSetor = text_(item.tanggalSetor || item.tglSetor);
      var sumberDana = text_(item.sumberDana) || 'BOS Reguler';
      var noArkas = text_(item.noArkas);
      var noInvoiceSiplah = text_(item.noInvoiceSiplah);
      var isSiplah = (text_(item.jalurBelanja).toUpperCase() === 'SIPLAH') ||
                     noBilling.toUpperCase().indexOf('SIPLAH') !== -1 ||
                     ntpn === 'SIPLAH';

      var baseKet = stripStructuredKetTags_(item.ket);
      var ketParts = [];
      if (isSiplah) ketParts.push(isUnitItem ? '[E-Katalog]' : '[SIPLah]');
      if (noArkas) ketParts.push((isUnitItem ? '[SIPD: ' : '[ARKAS: ') + noArkas + ']');
      if (baseKet) ketParts.push(baseKet);
      if (isSiplah && noInvoiceSiplah) ketParts.push('[INV: ' + noInvoiceSiplah + ']');
      var ket = ketParts.join(' ').trim();

      var row = new Array(REKAP_COLS);
      for (var z = 0; z < REKAP_COLS; z++) row[z] = '';

      row[COL_REKAP.NO] = nextNo + i;
      row[COL_REKAP.NPSN] = "'" + itemNpsn;
      row[COL_REKAP.NAMA_SEKOLAH] = item.namaSekolah || (prof && prof.namaSekolah) || '';
      row[COL_REKAP.CORETAX] = "'" + (item.subUnitCoretax || (prof && prof.subUnitCoretax) || '');
      row[COL_REKAP.KAB_KOTA] = item.kabKota || (prof && prof.kabKota) || '';
      row[COL_REKAP.CABDIN] = item.cabangDinas || (prof && prof.cabangDinas) || '';
      row[COL_REKAP.URAIAN] = uraian;
      row[COL_REKAP.JENIS_PENGADAAN] = jenisPengadaan;
      row[COL_REKAP.NAMA_REKANAN] = namaRekanan;
      row[COL_REKAP.ALAMAT_REKANAN] = alamatRekanan;
      row[COL_REKAP.NPWP_REKANAN] = npwpRekanan ? ("'" + npwpRekanan) : '';
      row[COL_REKAP.BPP_TANGGAL] = bppTanggal ? ("'" + bppTanggal) : '';
      row[COL_REKAP.BPP_JENIS_PAJAK] = bppJenisPajak;
      row[COL_REKAP.NILAI_PAJAK] = nilaiPajak;
      row[COL_REKAP.JENIS_PAJAK_RINCIAN] = jenisPajakRincian;
      row[COL_REKAP.TGL_BILLING] = tglBilling ? ("'" + tglBilling) : '';
      row[COL_REKAP.NO_BILLING] = noBilling ? ("'" + noBilling) : '';
      row[COL_REKAP.NO_FAKTUR] = noFaktur ? ("'" + noFaktur) : '';
      row[COL_REKAP.NO_BUPOT] = noBupot ? ("'" + noBupot) : '';
      row[COL_REKAP.NTPN] = ntpn ? ("'" + ntpn) : '';
      row[COL_REKAP.TGL_SETOR] = tglSetor ? ("'" + tglSetor) : '';
      row[COL_REKAP.SUMBER_DANA] = sumberDana;
      row[COL_REKAP.KET] = ket;
      row[COL_REKAP.NILAI_BELANJA] = nilaiBelanja;
      row[COL_REKAP.LINK_BUKTI] = text_(item.linkBukti);

      batchRows.push(row);
    }

    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, batchRows.length, REKAP_COLS).setValues(batchRows);
    sheet.getRange(startRow, COL_REKAP.NILAI_PAJAK + 1, batchRows.length, 1).setNumberFormat('#,##0');
    sheet.getRange(startRow, COL_REKAP.NILAI_BELANJA + 1, batchRows.length, 1).setNumberFormat('#,##0');

    SpreadsheetApp.flush();
    try { lock.releaseLock(); } catch (e) {}
    clearMasterDataCache_();

    return {
      status: 'success',
      count: batchRows.length,
      savedCount: batchRows.length,
      message: 'Berhasil menyimpan ' + batchRows.length + ' transaksi dari BKU ARKAS.'
    };
  } catch (err) {
    try { lock.releaseLock(); } catch (e) {}
    return { status: 'error', message: err.message || String(err) };
  }
}

/**
 * INOVASI 1B: Susul NTPN Massal dengan verifikasi kecocokan NO + NPSN berbasis batch memory
 */
function updateBatchNtpn(updates, sessionToken) {
  var lock = LockService.getScriptLock();
  try {
    var account = getSessionAccount_(sessionToken);
    if (!account) throw new Error('Sesi tidak valid atau telah berakhir. Silakan login kembali.');
    if (!updates || !updates.length) throw new Error('Tidak ada data NTPN yang dikirim.');

    lock.waitLock(20000);
    var sheet = getSheet_('GOOGLE FORM REKAP PAJAK');
    if (!sheet) throw new Error('Tab GOOGLE FORM REKAP PAJAK tidak ditemukan.');

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) throw new Error('Belum ada data transaksi pada database.');

    // Baca kolom NO, NPSN, NTPN, TGL_SETOR sekaligus secara batch
    var totalDataRows = lastRow - 1;
    var keyCols = sheet.getRange(2, 1, totalDataRows, 2).getDisplayValues();
    var ntpnCols = sheet.getRange(2, COL_REKAP.NTPN + 1, totalDataRows, 2).getDisplayValues();

    var rowMapByNo = {};
    for (var r = 0; r < keyCols.length; r++) {
      var rNo = text_(keyCols[r][0]);
      var rNpsn = text_(keyCols[r][1]);
      if (rNo) rowMapByNo[rNo + '_' + rNpsn] = r;
    }

    var successCount = 0;
    var updatedNos = [];

    for (var i = 0; i < updates.length; i++) {
      var u = updates[i];
      var expectedNo = text_(u.no);
      var expectedNpsn = text_(u.npsn || account.npsn);
      var arrayIdx = -1;

      // Verifikasi baris berdasarkan rowIdx hanya jika NO dan NPSN benar-benar cocok
      var candidateRow = Number(u.rowIdx);
      if (!isNaN(candidateRow) && candidateRow >= 2 && candidateRow <= lastRow) {
        var idx = candidateRow - 2;
        if (text_(keyCols[idx][0]) === expectedNo &&
            (account.role === 'ADMIN' || text_(keyCols[idx][1]) === account.npsn)) {
          arrayIdx = idx;
        }
      }

      // Fallback aman ke peta NO + NPSN jika indeks baris bergeser
      if (arrayIdx === -1) {
        var mapKey = expectedNo + '_' + expectedNpsn;
        if (rowMapByNo[mapKey] !== undefined) {
          arrayIdx = rowMapByNo[mapKey];
        }
      }

      if (arrayIdx === -1) continue;

      var rowOwner = text_(keyCols[arrayIdx][1]);
      if (account.role !== 'ADMIN' && rowOwner !== account.npsn) {
        continue;
      }

      var ntpnVal = text_(u.ntpn).toUpperCase();
      if (!ntpnVal || !/^[A-Z0-9]{16}$/.test(ntpnVal)) {
        throw new Error('NTPN pada transaksi #' + expectedNo + ' harus tepat 16 karakter alfanumerik.');
      }
      var tglVal = text_(u.tanggalSetor || formatDateIso(new Date()));

      ntpnCols[arrayIdx][0] = "'" + ntpnVal;
      ntpnCols[arrayIdx][1] = "'" + tglVal;
      successCount++;
      updatedNos.push(expectedNo);
    }

    if (successCount > 0) {
      // Pastikan baris yang tidak disentuh tidak kehilangan tanda petik pada NTPN teks
      for (var k = 0; k < ntpnCols.length; k++) {
        var curNtpn = text_(ntpnCols[k][0]);
        if (curNtpn && curNtpn.charAt(0) !== "'") ntpnCols[k][0] = "'" + curNtpn;
        var curTgl = text_(ntpnCols[k][1]);
        if (curTgl && curTgl.charAt(0) !== "'") ntpnCols[k][1] = "'" + curTgl;
      }
      sheet.getRange(2, COL_REKAP.NTPN + 1, totalDataRows, 2).setValues(ntpnCols);
      if (account.role === 'ADMIN') {
        logAdminAction_(account.username, 'UPDATE_BATCH_NTPN', successCount + ' transaksi (#' + updatedNos.slice(0, 10).join(', #') + ')');
      }
    }

    SpreadsheetApp.flush();
    try { lock.releaseLock(); } catch (e) {}

    return {
      status: 'success',
      count: successCount,
      updatedCount: successCount,
      message: 'Berhasil memperbarui NTPN untuk ' + successCount + ' transaksi.'
    };
  } catch (err) {
    try { lock.releaseLock(); } catch (e) {}
    return { status: 'error', message: err.message || String(err) };
  }
}

/**
 * INOVASI 2A: Dashboard Pengawasan Sekolah Binaan Cabang Dinas (Wilayah I s/d XIV)
 * Menggunakan deteksi dinamis DATA NPSN & normalisasi wilayah binaan presisi.
 */
function getCabdisSchoolMonitoring(sessionToken) {
  try {
    var account = getSessionAccount_(sessionToken);
    if (!account) throw new Error('Sesi tidak valid atau telah berakhir.');
    if (account.role !== 'UNIT_DINAS' && account.role !== 'ADMIN') {
      throw new Error('Akses ditolak: Menu ini khusus untuk Cabang Dinas.');
    }

    var profile = getProfilSekolahDataByNpsn_(account.npsn);
    var cabdisInfo = resolveCabdisScopeInfo_(account, profile);

    var data = getAdminSourceData_();
    var schools = [];
    var seenSchools = {};
    var totalSekolah = 0, profilLengkap = 0, belumLogin = 0;
    var totalBelanja = 0, totalPajakSetor = 0, nominalNtpn = 0, belumNtpn = 0;
    var totalBelumNtpnTx = 0, totalTxSemua = 0;

    var loggedIn = getLoggedInNpsnMap_(data.accounts);
    var profileByNpsn = {}, profileByName = {};
    for (var p = 0; p < data.profiles.length; p++) {
      var pRow = data.profiles[p];
      profileByNpsn[text_(pRow[COL_UNIT.NPSN])] = pRow;
      var pNameKey = canonicalSchoolKey_(pRow[COL_UNIT.NAMA_SEKOLAH]);
      if (pNameKey) profileByName[pNameKey] = pRow;
    }

    var txByNpsn = {}, txByName = {};
    for (var t = 0; t < data.taxes.length; t++) {
      var tax = data.taxes[t];
      var nominal = parseSheetAmount_(tax[COL_REKAP.NILAI_PAJAK]);
      var belanja = parseSheetAmount_(tax[COL_REKAP.NILAI_BELANJA]);
      var noBillTax = text_(tax[COL_REKAP.NO_BILLING]);
      var ketTax = text_(tax[COL_REKAP.KET]);
      var ntpnTaxUpper = text_(tax[COL_REKAP.NTPN]).toUpperCase();
      var isSiplahTax = noBillTax.toUpperCase().indexOf('SIPLAH') !== -1 ||
                        noBillTax.toUpperCase().indexOf('E-KATALOG') !== -1 ||
                        ntpnTaxUpper === 'SIPLAH' ||
                        ntpnTaxUpper === 'E-KATALOG' ||
                        ketTax.toUpperCase().indexOf('SIPLAH') !== -1 ||
                        ketTax.toUpperCase().indexOf('E-KATALOG') !== -1;
      var hasNtpn = !!ntpnTaxUpper || isSiplahTax;
      var npsnKey = text_(tax[COL_REKAP.NPSN]);
      var nameKey = canonicalSchoolKey_(tax[COL_REKAP.NAMA_SEKOLAH]);

      var buckets = [[txByNpsn, npsnKey], [txByName, nameKey]];
      for (var b = 0; b < buckets.length; b++) {
        var map = buckets[b][0], k = buckets[b][1];
        if (!k) continue;
        if (!map[k]) map[k] = { count: 0, belanja: 0, pajak: 0, ntpnPaid: 0, ntpnCount: 0, unPaidCount: 0 };
        map[k].count++;
        map[k].belanja += belanja;
        map[k].pajak += nominal;
        if (hasNtpn) {
          map[k].ntpnPaid += nominal;
          map[k].ntpnCount++;
        } else {
          map[k].unPaidCount++;
        }
      }
    }

    function processSchoolCandidate(sNpsnVal, schoolName, rawCabdin, rawKabKota) {
      if (!schoolName) return;
      var cKey = canonicalSchoolKey_(schoolName);
      if (sNpsnVal && seenSchools[sNpsnVal]) return;
      if (cKey && seenSchools[cKey]) return;

      var prof = (sNpsnVal ? profileByNpsn[sNpsnVal] : null) || (cKey ? profileByName[cKey] : null);
      var schoolCabdin = normalizeCabdinName_(rawCabdin || (prof ? text_(prof[COL_UNIT.CABDIN]) : ''));
      var schoolKabKota = text_(rawKabKota || (prof ? text_(prof[COL_UNIT.KAB_KOTA]) : ''));

      if (!isSchoolInCabdisScope_(schoolCabdin, schoolKabKota, cabdisInfo)) return;

      if (sNpsnVal) seenSchools[sNpsnVal] = true;
      if (cKey) seenSchools[cKey] = true;

      totalSekolah++;

      var kasekOk = !!prof && text_(prof[COL_UNIT.NAMA_KASEK]) !== '' && text_(prof[COL_UNIT.NIK_KASEK]) !== '';
      var bendaharaOk = !!prof && text_(prof[COL_UNIT.NAMA_BENDAHARA]) !== '' && text_(prof[COL_UNIT.NIK_BENDAHARA]) !== '';
      var nitkuVal = prof ? text_(prof[COL_UNIT.CORETAX]) : '';
      var nitkuOk = nitkuVal !== '';
      var isLengkap = kasekOk && bendaharaOk && nitkuOk;

      if (isLengkap) profilLengkap++;
      var isPernahLogin = !!(sNpsnVal && loggedIn[sNpsnVal]);
      if (!isPernahLogin) belumLogin++;

      var txStat = (sNpsnVal ? txByNpsn[sNpsnVal] : null) || (cKey ? txByName[cKey] : null) || { count: 0, belanja: 0, pajak: 0, ntpnPaid: 0, ntpnCount: 0, unPaidCount: 0 };
      var unPaidNominal = Math.max(0, txStat.pajak - txStat.ntpnPaid);
      var unPaidTxCount = txStat.unPaidCount || 0;
      var totalTx = txStat.count || 0;

      totalBelanja += txStat.belanja;
      totalPajakSetor += txStat.pajak;
      nominalNtpn += txStat.ntpnPaid;
      belumNtpn += unPaidNominal;
      totalBelumNtpnTx += unPaidTxCount;
      totalTxSemua += totalTx;

      var statusKepatuhan = '';
      var statusCode = '';

      if (!isLengkap && totalTx === 0) {
        statusKepatuhan = 'Belum Memenuhi Syarat';
        statusCode = 'BELUM_MEMENUHI_SYARAT';
      } else if (totalTx > 0 && (unPaidTxCount > 0 || unPaidNominal > 0)) {
        statusKepatuhan = 'Transaksi Belum Lengkap';
        statusCode = 'TRANSAKSI_BELUM_LENGKAP';
      } else if (isLengkap && totalTx === 0) {
        statusKepatuhan = 'Belum Ada Transaksi';
        statusCode = 'BELUM_ADA_TRANSAKSI';
      } else if (isLengkap && totalTx > 0 && unPaidTxCount === 0) {
        statusKepatuhan = 'Memenuhi Syarat';
        statusCode = 'MEMENUHI_SYARAT';
      } else {
        statusKepatuhan = 'Belum Memenuhi Syarat';
        statusCode = 'BELUM_MEMENUHI_SYARAT';
      }

      schools.push({
        npsn: sNpsnVal,
        namaSekolah: schoolName,
        kabKota: schoolKabKota,
        cabangDinas: schoolCabdin || cabdisInfo.name,
        alamatSekolah: prof ? text_(prof[COL_UNIT.ALAMAT]) : '',
        kelurahan: prof ? text_(prof[COL_UNIT.KELURAHAN]) : '',
        kecamatan: prof ? text_(prof[COL_UNIT.KECAMATAN]) : '',
        pernahLogin: isPernahLogin,
        isProfileComplete: isLengkap,
        hasProfil: isLengkap,
        statusProfil: isLengkap ? 'Sudah Lengkap' : 'Belum Lengkap',
        subUnitCoretax: nitkuVal,
        nitkuOk: nitkuOk,
        kasekOk: kasekOk,
        bendaharaOk: bendaharaOk,
        namaKasek: prof ? text_(prof[COL_UNIT.NAMA_KASEK]) : '',
        nikKasek: prof ? text_(prof[COL_UNIT.NIK_KASEK]) : '',
        nipKpa: prof ? text_(prof[COL_UNIT.NIP_KPA]) : '',
        pangkatKpa: prof ? text_(prof[COL_UNIT.PANGKAT_KPA]) : '',
        namaBendahara: prof ? text_(prof[COL_UNIT.NAMA_BENDAHARA]) : '',
        nikBendahara: prof ? text_(prof[COL_UNIT.NIK_BENDAHARA]) : '',
        nipBpp: prof ? text_(prof[COL_UNIT.NIP_BPP]) : '',
        pangkatBpp: prof ? text_(prof[COL_UNIT.PANGKAT_BPP]) : '',
        namaPptk: prof ? text_(prof[COL_UNIT.NAMA_PPTK]) : '',
        nipPptk: prof ? text_(prof[COL_UNIT.NIP_PPTK]) : '',
        totalTransaksi: totalTx,
        totalBelanja: txStat.belanja,
        totalPajak: txStat.pajak,
        pajakLengkapNtpn: txStat.ntpnPaid,
        nominalNtpn: txStat.ntpnPaid,
        pajakBelumNtpn: unPaidNominal,
        nominalBelumNtpn: unPaidNominal,
        transaksiBelumNtpn: unPaidTxCount,
        statusKepatuhan: statusKepatuhan,
        statusCode: statusCode
      });
    }

    // 1. Baca seluruh sekolah dari tab DATA NPSN menggunakan pembaca dinamis
    for (var n = 0; n < data.npsnSchools.length; n++) {
      var ns = data.npsnSchools[n];
      processSchoolCandidate(ns.npsn, ns.namaSekolah, ns.cabangDinas, ns.kabKota);
    }

    // 2. Baca sekolah dari FORM PEMBUATAN SUB UNIT (jika ada yang belum tercatat di DATA NPSN)
    for (var pr = 0; pr < data.profiles.length; pr++) {
      var pRow = data.profiles[pr];
      var pNpsnVal = text_(pRow[COL_UNIT.NPSN]);
      var pNameVal = text_(pRow[COL_UNIT.NAMA_SEKOLAH]);
      if (/^\d{8}$/.test(pNpsnVal) && pNameVal) {
        processSchoolCandidate(pNpsnVal, pNameVal, pRow[COL_UNIT.CABDIN], pRow[COL_UNIT.KAB_KOTA]);
      }
    }

    schools.sort(function(a, b) {
      return a.namaSekolah.localeCompare(b.namaSekolah);
    });

    return {
      status: 'success',
      cabdisName: cabdisInfo.name,
      wilayahBinaan: cabdisInfo.kabKota,
      metrics: {
        totalSekolah: totalSekolah,
        profilLengkap: profilLengkap,
        belumLogin: belumLogin,
        aktifLogin: Math.max(0, totalSekolah - belumLogin),
        totalBelanja: totalBelanja,
        totalPajakSetor: totalPajakSetor,
        pajakLengkapNtpn: nominalNtpn,
        nominalNtpn: nominalNtpn,
        pajakBelumNtpn: Math.max(0, belumNtpn),
        belumNtpn: Math.max(0, belumNtpn),
        transaksiBelumNtpn: totalBelumNtpnTx,
        totalTransaksi: totalTxSemua,
        persenKepatuhan: totalPajakSetor > 0 ? Math.round((nominalNtpn / totalPajakSetor) * 100) : 0
      },
      schools: schools
    };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function exportPaketRekonsiliasiExcel(sessionToken, filters) {
  try {
    requireAdminSession_(sessionToken);
    filters = filters || {};

    if (filters.tahun) {
      filters.startDate = filters.tahun + '-01-01';
      filters.endDate = filters.tahun + '-12-31';
    }
    if (filters.cabdis && !filters.cabdin) {
      filters.cabdin = filters.cabdis;
    }

    var taxRows = getAdminTaxRows_();
    var txs = getFilteredAdminTransactions_({ taxes: taxRows }, filters);

    var cabdisMap = {};
    for (var c = 1; c <= 14; c++) {
      var cName = CABDIS_OFFICIAL_MAP[c - 1].name;
      cabdisMap[cName] = { nama: cName, belanja: 0, pajak: 0, ntpnPaid: 0, txCount: 0 };
    }
    cabdisMap['Dinas Pendidikan Provsu'] = { nama: 'Kantor Induk Dinas Provsu', belanja: 0, pajak: 0, ntpnPaid: 0, txCount: 0 };

    var danaMap = {};
    var grandBelanja = 0, grandPajak = 0, grandNtpn = 0;

    for (var i = 0; i < txs.length; i++) {
      var item = txs[i];
      var cd = normalizeCabdinName_(item.cabangDinas) || 'Lainnya';
      if (!cabdisMap[cd]) cabdisMap[cd] = { nama: cd, belanja: 0, pajak: 0, ntpnPaid: 0, txCount: 0 };
      cabdisMap[cd].belanja += (item.nilaiBelanja || 0);
      cabdisMap[cd].pajak += (item.nilaiPajakSetor || 0);
      cabdisMap[cd].txCount++;
      if (item.ntpn || item.isSiplah) cabdisMap[cd].ntpnPaid += (item.nilaiPajakSetor || 0);

      var sd = item.sumberDana || 'Lainnya';
      if (!danaMap[sd]) danaMap[sd] = { nama: sd, belanja: 0, pajak: 0, ntpnPaid: 0, txCount: 0 };
      danaMap[sd].belanja += (item.nilaiBelanja || 0);
      danaMap[sd].pajak += (item.nilaiPajakSetor || 0);
      danaMap[sd].txCount++;
      if (item.ntpn || item.isSiplah) danaMap[sd].ntpnPaid += (item.nilaiPajakSetor || 0);

      grandBelanja += (item.nilaiBelanja || 0);
      grandPajak += (item.nilaiPajakSetor || 0);
      if (item.ntpn || item.isSiplah) grandNtpn += (item.nilaiPajakSetor || 0);
    }

    var generatedAt = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
      '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Rekonsiliasi BPK</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
      '<style>' +
      'body { font-family: Calibri, sans-serif; font-size: 11pt; color: #1e293b; }' +
      '.title { font-size: 14pt; font-weight: bold; color: #047857; text-align: left; }' +
      '.subtitle { font-size: 10pt; color: #64748b; margin-bottom: 12px; }' +
      '.sec-hdr { background-color: #065f46; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 6px; }' +
      '.hdr { background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; border: 0.5pt solid #cbd5e1; padding: 6px; }' +
      '.subtotal { background-color: #f1f5f9; font-weight: bold; }' +
      '.txt { mso-number-format:"\\@"; border: 0.5pt solid #cbd5e1; padding: 4px; }' +
      '.num { mso-number-format:"\\#\\,\\#\\#0"; text-align: right; border: 0.5pt solid #cbd5e1; padding: 4px; }' +
      '.pct { mso-number-format:"0\\.0\\%"; text-align: right; border: 0.5pt solid #cbd5e1; padding: 4px; }' +
      'td { border: 0.5pt solid #cbd5e1; padding: 4px; vertical-align: middle; }' +
      '</style></head><body>';

    html += '<div class="title">PEMERINTAH PROVINSI SUMATERA UTARA — DINAS PENDIDIKAN</div>';
    html += '<div class="title" style="font-size:12pt;">PAKET REKONSILIASI PENGAWASAN DAN KEPATUHAN PAJAK DAERAH</div>';
    html += '<div class="subtitle">Digenerate otomatis dari SAJAK pada ' + generatedAt + ' WIB | Kesiapan Audit BPK &amp; Inspektorat Daerah</div><br>';

    // BAGIAN 1: REKAPITULASI PER CABANG DINAS
    html += '<table><tr><td colspan="7" class="sec-hdr">BAGIAN 1: REKAPITULASI KEPATUHAN PAJAK PER CABANG DINAS</td></tr>' +
      '<tr><th class="hdr">No</th><th class="hdr">Cabang Dinas / Lingkup</th><th class="hdr">Jml Transaksi</th><th class="hdr">Nilai Belanja (Rp)</th><th class="hdr">Pajak Setor (Rp)</th><th class="hdr">Lunas NTPN (Rp)</th><th class="hdr">Kepatuhan (%)</th></tr>';
    var cdKeys = Object.keys(cabdisMap);
    var cNo = 1;
    for (var k = 0; k < cdKeys.length; k++) {
      var cObj = cabdisMap[cdKeys[k]];
      var pct = cObj.pajak > 0 ? (cObj.ntpnPaid / cObj.pajak) : 1;
      html += '<tr><td style="text-align:center;">' + (cNo++) + '</td><td>' + escapeHtml(cObj.nama) + '</td><td class="num">' + cObj.txCount + '</td><td class="num">' + cObj.belanja + '</td><td class="num">' + cObj.pajak + '</td><td class="num">' + cObj.ntpnPaid + '</td><td class="pct">' + pct + '</td></tr>';
    }
    var totalPct = grandPajak > 0 ? (grandNtpn / grandPajak) : 1;
    html += '<tr class="subtotal"><td colspan="2" style="text-align:center;">TOTAL KESELURUHAN</td><td class="num">' + txs.length + '</td><td class="num">' + grandBelanja + '</td><td class="num">' + grandPajak + '</td><td class="num">' + grandNtpn + '</td><td class="pct">' + totalPct + '</td></tr></table><br><br>';

    // BAGIAN 2: REKAPITULASI PER SUMBER DANA
    html += '<table><tr><td colspan="6" class="sec-hdr">BAGIAN 2: REKAPITULASI REALISASI PAJAK PER SUMBER DANA</td></tr>' +
      '<tr><th class="hdr">No</th><th class="hdr">Sumber Dana</th><th class="hdr">Jml Transaksi</th><th class="hdr">Total Belanja (Rp)</th><th class="hdr">Total Pajak (Rp)</th><th class="hdr">Lunas NTPN (Rp)</th></tr>';
    var dKeys = Object.keys(danaMap);
    var dNo = 1;
    for (var d = 0; d < dKeys.length; d++) {
      var dObj = danaMap[dKeys[d]];
      html += '<tr><td style="text-align:center;">' + (dNo++) + '</td><td>' + escapeHtml(dObj.nama) + '</td><td class="num">' + dObj.txCount + '</td><td class="num">' + dObj.belanja + '</td><td class="num">' + dObj.pajak + '</td><td class="num">' + dObj.ntpnPaid + '</td></tr>';
    }
    html += '<tr class="subtotal"><td colspan="2" style="text-align:center;">TOTAL KESELURUHAN</td><td class="num">' + txs.length + '</td><td class="num">' + grandBelanja + '</td><td class="num">' + grandPajak + '</td><td class="num">' + grandNtpn + '</td></tr></table><br><br>';

    // BAGIAN 3: RINCIAN 25 KOLOM TRANSAKSI LENGKAP
    html += '<table><tr><td colspan="25" class="sec-hdr">BAGIAN 3: BUKU BESAR TRANSAKSI 25 KOLOM LENGKAP (AUDIT TRAIL)</td></tr><tr>';
    var headers = [
      'NO', 'NPSN', 'NAMA SEKOLAH/UNIT', 'SUB UNIT CORETAX', 'KAB/KOTA', 'CABANG DINAS',
      'URAIAN KEGIATAN', 'JENIS PENGADAAN', 'NAMA REKANAN', 'ALAMAT REKANAN', 'NPWP REKANAN',
      'BPP TANGGAL', 'BPP JENIS PAJAK', 'NILAI PAJAK SETOR (RP)', 'JENIS PAJAK RINCIAN',
      'TGL BILLING', 'NO BILLING PAJAK', 'NO FAKTUR', 'NO BUPOT', 'NTPN', 'TGL SETOR',
      'SUMBER DANA', 'KETERANGAN & BKU', 'NILAI BELANJA (RP)', 'LINK BUKTI DOKUMEN'
    ];
    for (var h = 0; h < headers.length; h++) html += '<th class="hdr">' + headers[h] + '</th>';
    html += '</tr>';

    for (var t = 0; t < txs.length; t++) {
      var it = txs[t];
      html += '<tr>' +
        '<td style="text-align:center;">' + it.no + '</td>' +
        '<td class="txt">' + escapeHtml(it.npsn) + '</td>' +
        '<td>' + escapeHtml(it.namaSekolah) + '</td>' +
        '<td class="txt">' + escapeHtml(it.subUnitCoretax) + '</td>' +
        '<td>' + escapeHtml(it.kabKota) + '</td>' +
        '<td>' + escapeHtml(it.cabangDinas) + '</td>' +
        '<td>' + escapeHtml(it.uraianKegiatan) + '</td>' +
        '<td>' + escapeHtml(it.jenisPengadaan) + '</td>' +
        '<td>' + escapeHtml(it.namaPerusahaan) + '</td>' +
        '<td>' + escapeHtml(it.alamatPerusahaan) + '</td>' +
        '<td class="txt">' + escapeHtml(it.npwpPerusahaan) + '</td>' +
        '<td style="text-align:center;">' + escapeHtml(it.bppTanggal || '-') + '</td>' +
        '<td>' + escapeHtml(it.bppJenisPajak) + '</td>' +
        '<td class="num">' + it.nilaiPajakSetor + '</td>' +
        '<td>' + escapeHtml(it.jenisPajakRincian) + '</td>' +
        '<td style="text-align:center;">' + escapeHtml(it.tanggalBilling || '-') + '</td>' +
        '<td class="txt">' + escapeHtml(it.noBilling || '-') + '</td>' +
        '<td class="txt">' + escapeHtml(it.noFaktur || '-') + '</td>' +
        '<td class="txt">' + escapeHtml(it.noBupot || '-') + '</td>' +
        '<td class="txt">' + escapeHtml(it.ntpn || (it.isSiplah ? 'SIPLah' : '-')) + '</td>' +
        '<td style="text-align:center;">' + escapeHtml(it.tanggalSetor || '-') + '</td>' +
        '<td>' + escapeHtml(it.sumberDana) + '</td>' +
        '<td>' + escapeHtml(it.ket) + '</td>' +
        '<td class="num">' + it.nilaiBelanja + '</td>' +
        '<td>' + (it.linkBukti ? '<a href="' + escapeHtml(it.linkBukti) + '">' + escapeHtml(it.linkBukti) + '</a>' : '-') + '</td>' +
        '</tr>';
    }
    html += '</table></body></html>';

    var fileName = 'Paket_Rekonsiliasi_Pajak_Disdik_Provsu_' + (filters.tahun || formatDateIso(new Date())) + '.xls';

    return {
      status: 'success',
      content: html,
      excelContent: html,
      filename: fileName,
      fileName: fileName,
      count: txs.length
    };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}

function archivePriorYearTransactions(sessionToken, targetYear) {
  var lock = LockService.getScriptLock();
  try {
    var admin = requireAdminSession_(sessionToken);
    var yr = Number(targetYear);
    var currentYear = new Date().getFullYear();
    if (!yr || yr < 2020) {
      throw new Error('Tahun arsip tidak valid.');
    }
    if (yr >= currentYear) {
      return {
        status: 'info',
        message: 'Tahun ' + yr + ' adalah tahun anggaran berjalan aktif. Pemisahan arsip hanya diperkenankan untuk tahun anggaran yang telah berakhir (prior year).'
      };
    }

    lock.waitLock(30000);
    var ss = getActiveSpreadsheet_();
    if (!ss) throw new Error('Spreadsheet database tidak ditemukan.');

    var sourceSheet = getSheet_('GOOGLE FORM REKAP PAJAK');
    if (!sourceSheet) throw new Error('Tab GOOGLE FORM REKAP PAJAK tidak ditemukan.');

    var lastRow = sourceSheet.getLastRow();
    if (lastRow < 2) {
      return { status: 'info', message: 'Sheet rekapitulasi pajak masih kosong.' };
    }

    var displayRows = sourceSheet.getRange(2, 1, lastRow - 1, REKAP_COLS).getDisplayValues();
    var keepRows = [];
    var movedRows = [];

    for (var i = 0; i < displayRows.length; i++) {
      var r = displayRows[i];
      var tglIso = formatDateIso(r[COL_REKAP.BPP_TANGGAL]);
      var tglSetorIso = formatDateIso(r[COL_REKAP.TGL_SETOR]);

      // Kembalikan kolom nominal ke angka murni dan proteksi kolom kode/digit sebagai teks
      var prepared = r.slice();
      prepared[COL_REKAP.NO] = parseSheetAmount_(r[COL_REKAP.NO]) || r[COL_REKAP.NO];
      prepared[COL_REKAP.NPSN] = r[COL_REKAP.NPSN] ? ("'" + text_(r[COL_REKAP.NPSN])) : '';
      prepared[COL_REKAP.CORETAX] = r[COL_REKAP.CORETAX] ? ("'" + text_(r[COL_REKAP.CORETAX])) : '';
      prepared[COL_REKAP.NPWP_REKANAN] = r[COL_REKAP.NPWP_REKANAN] ? ("'" + text_(r[COL_REKAP.NPWP_REKANAN])) : '';
      prepared[COL_REKAP.NILAI_PAJAK] = parseSheetAmount_(r[COL_REKAP.NILAI_PAJAK]);
      prepared[COL_REKAP.NO_BILLING] = r[COL_REKAP.NO_BILLING] ? ("'" + text_(r[COL_REKAP.NO_BILLING])) : '';
      prepared[COL_REKAP.NO_FAKTUR] = r[COL_REKAP.NO_FAKTUR] ? ("'" + text_(r[COL_REKAP.NO_FAKTUR])) : '';
      prepared[COL_REKAP.NO_BUPOT] = r[COL_REKAP.NO_BUPOT] ? ("'" + text_(r[COL_REKAP.NO_BUPOT])) : '';
      prepared[COL_REKAP.NTPN] = r[COL_REKAP.NTPN] ? ("'" + text_(r[COL_REKAP.NTPN])) : '';
      prepared[COL_REKAP.NILAI_BELANJA] = parseSheetAmount_(r[COL_REKAP.NILAI_BELANJA]);

      var isYearMatch = (tglIso && tglIso.indexOf(String(yr)) === 0) ||
                        (tglSetorIso && tglSetorIso.indexOf(String(yr)) === 0);

      if (isYearMatch) {
        movedRows.push(prepared);
      } else {
        keepRows.push(prepared);
      }
    }

    if (!movedRows.length) {
      return {
        status: 'info',
        message: 'Tidak ditemukan transaksi untuk tahun anggaran ' + yr + ' pada sheet aktif.'
      };
    }

    var archiveSheetName = 'ARSIP REKAP PAJAK ' + yr;
    var archiveSheet = ss.getSheetByName(archiveSheetName);
    if (!archiveSheet) {
      archiveSheet = ss.insertSheet(archiveSheetName);
      var headerValues = sourceSheet.getRange(1, 1, 1, REKAP_COLS).getDisplayValues();
      archiveSheet.getRange(1, 1, 1, REKAP_COLS).setValues(headerValues);
      archiveSheet.setFrozenRows(1);
    }

    var arcStart = archiveSheet.getLastRow() + 1;
    archiveSheet.getRange(arcStart, 1, movedRows.length, REKAP_COLS).setValues(movedRows);
    archiveSheet.getRange(arcStart, COL_REKAP.NILAI_PAJAK + 1, movedRows.length, 1).setNumberFormat('#,##0');
    archiveSheet.getRange(arcStart, COL_REKAP.NILAI_BELANJA + 1, movedRows.length, 1).setNumberFormat('#,##0');

    sourceSheet.getRange(2, 1, lastRow - 1, REKAP_COLS).clearContent();
    if (keepRows.length > 0) {
      sourceSheet.getRange(2, 1, keepRows.length, REKAP_COLS).setValues(keepRows);
      sourceSheet.getRange(2, COL_REKAP.NILAI_PAJAK + 1, keepRows.length, 1).setNumberFormat('#,##0');
      sourceSheet.getRange(2, COL_REKAP.NILAI_BELANJA + 1, keepRows.length, 1).setNumberFormat('#,##0');
    }

    if (sourceSheet.getMaxRows() > keepRows.length + 10) {
      var excess = sourceSheet.getMaxRows() - (keepRows.length + 10);
      if (excess > 0) {
        try { sourceSheet.deleteRows(keepRows.length + 11, excess); } catch (e) {}
      }
    }

    logAdminAction_(admin.username, 'ARSIP_TAHUN', movedRows.length + ' transaksi dipindah ke ' + archiveSheetName);
    SpreadsheetApp.flush();
    try { lock.releaseLock(); } catch (e) {}

    return {
      status: 'success',
      archivedCount: movedRows.length,
      archiveSheetName: archiveSheetName,
      message: 'Berhasil mengarsipkan ' + movedRows.length + ' transaksi ke sheet: ' + archiveSheetName
    };
  } catch (err) {
    try { lock.releaseLock(); } catch (e) {}
    return { status: 'error', message: err.message || String(err) };
  }
}

function getArchiveSheetsList(sessionToken) {
  try {
    requireAdminSession_(sessionToken);
    var ss = getActiveSpreadsheet_();
    if (!ss) throw new Error('Spreadsheet database tidak ditemukan.');

    var sheets = ss.getSheets();
    var list = [];
    for (var i = 0; i < sheets.length; i++) {
      var sName = sheets[i].getName();
      if (sName.indexOf('ARSIP REKAP PAJAK') === 0) {
        list.push({
          name: sName,
          sheetName: sName,
          rowCount: Math.max(0, sheets[i].getLastRow() - 1)
        });
      }
    }
    return {
      status: 'success',
      archiveSheets: list,
      items: list
    };
  } catch (err) {
    return { status: 'error', message: err.message || String(err) };
  }
}