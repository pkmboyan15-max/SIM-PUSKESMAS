export interface Pegawai {
  id: string;
  NIP: string;
  nama: string;
  pangkat: string;
  jabatan: string;
  unitKerja: string;
  noHP: string;
  email: string;
  status: "Aktif" | "Tidak Aktif";
}

export interface Kegiatan {
  id: string;
  namaKegiatan: string;
  dasarKegiatan: string;
  tempat: string;
  kabupaten: string;
  provinsi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  sumberDana: string;
  keterangan: string;
}

export interface DetailSuratTugas {
  nomorSurat: string;
  idPegawai: string;
  nama: string;
  NIP: string;
  jabatan: string;
}

export interface SuratTugas {
  nomorSurat: string;
  tanggalSurat: string;
  idKegiatan: string;
  namaKegiatan: string;
  dasarSurat: string;
  maksud: string;
  tempat: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  lamaHari: number;
  penandatangan: string;
  status: "Aktif" | "Selesai" | "Dibatalkan";
  linkPdf?: string;
  timestamp: string;
  petugas?: DetailSuratTugas[];
}

export interface SPPD {
  nomorSPPD: string;
  nomorSuratTugas: string;
  idPegawai: string;
  nama: string;
  maksudPerjalanan: string;
  tempatTujuan: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  lamaHari: number;
  transportasi: string;
  sumberDana: string;
  nomorSPD: string;
  instansiTujuan?: string;
  pejabatTujuan?: string;
  keterangan?: string;
  linkPdf?: string;
}

export interface Pengaturan {
  namaInstansi: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  logoKabupaten: string;
  logoPuskesmas: string;
  namaKepalaPuskesmas: string;
  nipKepala: string;
  penandatangan: string;
  nomorAwalSurat: string;
  formatNomorSurat: string;
  warnaTema: "emerald" | "blue" | "teal" | "slate";
}

export interface AuditLog {
  tanggal: string;
  user: string;
  aktivitas: string;
  ip: string;
}

export interface UserSession {
  token: string;
  username: string;
  role: "Administrator" | "Operator" | "Viewer";
  name: string;
}
