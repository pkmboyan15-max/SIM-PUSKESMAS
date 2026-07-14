import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json({ limit: '10mb' }));

// Helper to hash password
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Default Seed Data
const DEFAULT_DATABASE = {
  users: [
    { username: "admin", passwordHash: hashPassword("admin123"), role: "Administrator", name: "Administrator Utama" },
    { username: "operator", passwordHash: hashPassword("operator123"), role: "Operator", name: "Operator Admin" },
    { username: "viewer", passwordHash: hashPassword("viewer123"), role: "Viewer", name: "Viewer Umum" }
  ],
  pegawai: [
    { id: "PEG-001", NIP: "198001012005011001", nama: "dr. H. Ade Hermanto", pangkat: "Pembina / IVa", jabatan: "Kepala Puskesmas", unitKerja: "Puskesmas Boyan Tanjung", noHP: "081254321098", email: "ade.hermanto@gmail.com", status: "Aktif" },
    { id: "PEG-002", NIP: "198512122008012003", nama: "Sri Wahyuni, A.Md.Keb", pangkat: "Penata / IIIc", jabatan: "Bidan Koordinator", unitKerja: "Puskesmas Boyan Tanjung", noHP: "081345678901", email: "sri.wahyuni@gmail.com", status: "Aktif" },
    { id: "PEG-003", NIP: "199003152015031002", nama: "Ahmad Fauzi, A.Md.Kep", pangkat: "Penata Muda / IIIa", jabatan: "Perawat Penyelia", unitKerja: "Puskesmas Boyan Tanjung", noHP: "081567890123", email: "ahmad.fauzi@gmail.com", status: "Aktif" },
    { id: "PEG-004", NIP: "198807202010012004", nama: "Rina Astuti, S.KM", pangkat: "Penata Tk. I / IIId", jabatan: "Penyuluh Kesehatan", unitKerja: "Puskesmas Boyan Tanjung", noHP: "081298765432", email: "rina.astuti@gmail.com", status: "Aktif" },
    { id: "PEG-005", NIP: "199505052020011001", nama: "Budi Santoso", pangkat: "Pengatur / IIc", jabatan: "Staf Administrasi Umum", unitKerja: "Puskesmas Boyan Tanjung", noHP: "081312345678", email: "budi.santoso@gmail.com", status: "Aktif" },
    { id: "PEG-006", NIP: "199208082016022001", nama: "dr. Linda Wijaya", pangkat: "Penata Muda Tk. I / IIIb", jabatan: "Dokter Gigi", unitKerja: "Puskesmas Boyan Tanjung", noHP: "082155667788", email: "linda.wijaya@gmail.com", status: "Aktif" },
    { id: "PEG-007", NIP: "199703122021022002", nama: "Melati Indah, A.Md.Far", pangkat: "Pengatur / IIc", jabatan: "Asisten Apoteker", unitKerja: "Puskesmas Boyan Tanjung", noHP: "081399882211", email: "melati.indah@gmail.com", status: "Aktif" }
  ],
  kegiatan: [
    { id: "KEG-001", namaKegiatan: "BIAS (Bulan Imunisasi Anak Sekolah)", dasarKegiatan: "Rencana Kerja Operasional Imunisasi Puskesmas Tahun 2026", tempat: "SD Negeri 01 Boyan Tanjung", kabupaten: "Kapuas Hulu", provinsi: "Kalimantan Barat", tanggalMulai: "2026-07-15", tanggalSelesai: "2026-07-15", sumberDana: "BOK", keterangan: "Pelaksanaan BIAS Campak dan DT" },
    { id: "KEG-002", namaKegiatan: "Posyandu Balita & Lansia Terintegrasi", dasarKegiatan: "Program Promosi Kesehatan & Kesehatan Keluarga Triwulan III", tempat: "Posyandu Cempaka Desa Nanga Boyan", kabupaten: "Kapuas Hulu", provinsi: "Kalimantan Barat", tanggalMulai: "2026-07-18", tanggalSelesai: "2026-07-18", sumberDana: "BOK", keterangan: "Pelayanan kesehatan dasar, imunisasi, dan penimbangan balita" },
    { id: "KEG-003", namaKegiatan: "Rapat Koordinasi Evaluasi Program Dinkes", dasarKegiatan: "Undangan Kepala Dinas Kesehatan Kapuas Hulu No. 440/567/DK-KH/2026", tempat: "Aula Dinas Kesehatan Kapuas Hulu", kabupaten: "Kapuas Hulu", provinsi: "Kalimantan Barat", tanggalMulai: "2026-07-22", tanggalSelesai: "2026-07-24", sumberDana: "APBD", keterangan: "Evaluasi capaian indikator kesehatan semester I" },
    { id: "KEG-004", namaKegiatan: "Penyuluhan Pencegahan DBD dan Fogging Mandiri", dasarKegiatan: "Instruksi Penanggulangan KLB DBD Kecamatan Boyan Tanjung", tempat: "Balai Desa Mujan", kabupaten: "Kapuas Hulu", provinsi: "Kalimantan Barat", tanggalMulai: "2026-07-28", tanggalSelesai: "2026-07-28", sumberDana: "APBD", keterangan: "Sosialisasi gerakan 3M Plus dan pemberantasan sarang nyamuk" }
  ],
  suratTugas: [
    {
      nomorSurat: "440/001/ST/PT-BT/VII/2026",
      tanggalSurat: "2026-07-14",
      idKegiatan: "KEG-001",
      namaKegiatan: "BIAS (Bulan Imunisasi Anak Sekolah)",
      dasarSurat: "Rencana Kerja Operasional Imunisasi Puskesmas Tahun 2026",
      maksud: "Melakukan pemeriksaan kesehatan dan imunisasi BIAS Campak/DT pada siswa SD",
      tempat: "SD Negeri 01 Boyan Tanjung",
      tanggalBerangkat: "2026-07-15",
      tanggalKembali: "2026-07-15",
      lamaHari: 1,
      penandatangan: "dr. H. Ade Hermanto",
      status: "Selesai",
      linkPdf: "",
      timestamp: "2026-07-14T08:30:00Z"
    },
    {
      nomorSurat: "440/002/ST/PT-BT/VII/2026",
      tanggalSurat: "2026-07-17",
      idKegiatan: "KEG-002",
      namaKegiatan: "Posyandu Balita & Lansia Terintegrasi",
      dasarSurat: "Program Promosi Kesehatan & Kesehatan Keluarga Triwulan III",
      maksud: "Melaksanakan pelayanan posyandu balita dan lansia serta penyuluhan gizi",
      tempat: "Posyandu Cempaka Desa Nanga Boyan",
      tanggalBerangkat: "2026-07-18",
      tanggalKembali: "2026-07-18",
      lamaHari: 1,
      penandatangan: "dr. H. Ade Hermanto",
      status: "Aktif",
      linkPdf: "",
      timestamp: "2026-07-17T09:15:00Z"
    }
  ],
  detailSuratTugas: [
    { nomorSurat: "440/001/ST/PT-BT/VII/2026", idPegawai: "PEG-002", nama: "Sri Wahyuni, A.Md.Keb", NIP: "198512122008012003", jabatan: "Bidan Koordinator" },
    { nomorSurat: "440/001/ST/PT-BT/VII/2026", idPegawai: "PEG-003", nama: "Ahmad Fauzi, A.Md.Kep", NIP: "199003152015031002", jabatan: "Perawat Penyelia" },
    { nomorSurat: "440/002/ST/PT-BT/VII/2026", idPegawai: "PEG-004", nama: "Rina Astuti, S.KM", NIP: "198807202010012004", jabatan: "Penyuluh Kesehatan" },
    { nomorSurat: "440/002/ST/PT-BT/VII/2026", idPegawai: "PEG-005", nama: "Budi Santoso", NIP: "199505052020011001", jabatan: "Staf Administrasi Umum" }
  ],
  sppd: [
    {
      nomorSPPD: "001/SPPD/PT-BT/VII/2026",
      nomorSuratTugas: "440/001/ST/PT-BT/VII/2026",
      idPegawai: "PEG-002",
      nama: "Sri Wahyuni, A.Md.Keb",
      maksudPerjalanan: "Melakukan pemeriksaan kesehatan dan imunisasi BIAS Campak/DT pada siswa SD",
      tempatTujuan: "SD Negeri 01 Boyan Tanjung",
      tanggalBerangkat: "2026-07-15",
      tanggalKembali: "2026-07-15",
      lamaHari: 1,
      transportasi: "Sepeda Motor Dinas",
      sumberDana: "BOK",
      nomorSPD: "SPD/BOK/001/2026",
      instansiTujuan: "SD Negeri 01 Boyan Tanjung",
      pejabatTujuan: "Kepala Sekolah SD Negeri 01",
      keterangan: "Selesai dilaksanakan dengan tertib",
      linkPdf: ""
    },
    {
      nomorSPPD: "002/SPPD/PT-BT/VII/2026",
      nomorSuratTugas: "440/001/ST/PT-BT/VII/2026",
      idPegawai: "PEG-003",
      nama: "Ahmad Fauzi, A.Md.Kep",
      maksudPerjalanan: "Melakukan pemeriksaan kesehatan dan imunisasi BIAS Campak/DT pada siswa SD",
      tempatTujuan: "SD Negeri 01 Boyan Tanjung",
      tanggalBerangkat: "2026-07-15",
      tanggalKembali: "2026-07-15",
      lamaHari: 1,
      transportasi: "Sepeda Motor Dinas",
      sumberDana: "BOK",
      nomorSPD: "SPD/BOK/002/2026",
      instansiTujuan: "SD Negeri 01 Boyan Tanjung",
      pejabatTujuan: "Kepala Sekolah SD Negeri 01",
      keterangan: "Selesai dilaksanakan",
      linkPdf: ""
    }
  ],
  pengaturan: {
    namaInstansi: "Puskesmas Boyan Tanjung",
    alamat: "Jl. Lintas Selatan, Kecamatan Boyan Tanjung, Kabupaten Kapuas Hulu, Kalimantan Barat, Kode Pos 78757",
    telepon: "0812-3456-7890",
    email: "pkmboyantanjung@gmail.com",
    website: "puskesmasboyantanjung.go.id",
    logoKabupaten: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Coat_of_arms_of_Kapuas_Hulu_Regency.png",
    logoPuskesmas: "https://upload.wikimedia.org/wikipedia/commons/3/36/Logo_Puskesmas_Kemenkes_RI.png",
    namaKepalaPuskesmas: "dr. H. Ade Hermanto",
    nipKepala: "198001012005011001",
    penandatangan: "Kepala Puskesmas Boyan Tanjung",
    nomorAwalSurat: "001",
    formatNomorSurat: "440/[NOMOR]/ST/PT-BT/[BULAN]/[TAHUN]",
    warnaTema: "emerald"
  },
  auditLogs: [
    { tanggal: "2026-07-13T21:30:00.000Z", user: "admin", aktivitas: "Inisialisasi sistem database utama", ip: "127.0.0.1" },
    { tanggal: "2026-07-14T08:00:00.000Z", user: "admin", aktivitas: "Menambahkan Pegawai Baru dr. Linda Wijaya", ip: "127.0.0.1" },
    { tanggal: "2026-07-14T08:45:00.000Z", user: "operator", aktivitas: "Membuat Surat Tugas 440/001/ST/PT-BT/VII/2026", ip: "127.0.0.1" },
    { tanggal: "2026-07-14T09:00:00.000Z", user: "operator", aktivitas: "Membuat SPPD Sri Wahyuni dan Ahmad Fauzi", ip: "127.0.0.1" }
  ]
};

// Database state
let db = { ...DEFAULT_DATABASE };

// Load database
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
      console.log("Database successfully loaded from", DB_FILE);
    } else {
      saveDatabase();
      console.log("New database created and seeded at", DB_FILE);
    }
  } catch (err) {
    console.error("Error loading database:", err);
  }
}

// Save database
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

loadDatabase();

// Audit log helper
function addAuditLog(user: string, aktivitas: string, req: express.Request) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || "Unknown";
  db.auditLogs.unshift({
    tanggal: new Date().toISOString(),
    user,
    aktivitas,
    ip
  });
  // Limit audit logs to last 200
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  saveDatabase();
}

// Middleware for authentication validation (simple mock session token header)
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized access. No session key provided." });
  }
  const token = authHeader.replace("Bearer ", "");
  const [username, role] = Buffer.from(token, 'base64').toString('ascii').split(":");
  
  const user = db.users.find(u => u.username === username);
  if (!user || user.role !== role) {
    return res.status(401).json({ error: "Invalid session token." });
  }
  
  (req as any).user = user;
  next();
}

// Middleware for Admin role checking
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "Administrator") {
    return res.status(403).json({ error: "Access denied. Requires Administrator role." });
  }
  next();
}

// API Routes

// Authentication Endpoints
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Username tidak ditemukan" });
  }

  const inputHash = hashPassword(password);
  if (user.passwordHash !== inputHash) {
    return res.status(401).json({ error: "Password salah" });
  }

  // Generate simple token (base64 of username:role)
  const token = Buffer.from(`${user.username}:${user.role}`).toString('base64');
  
  addAuditLog(user.username, "Login sukses ke dalam sistem", req);
  
  res.json({
    token,
    username: user.username,
    role: user.role,
    name: user.name
  });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const user = (req as any).user;
  addAuditLog(user.username, "Logout dari sistem", req);
  res.json({ success: true });
});

// GET Current System Status / Settings
app.get("/api/settings", (req, res) => {
  res.json(db.pengaturan);
});

// UPDATE Settings (Admin Only)
app.put("/api/settings", requireAuth, requireAdmin, (req, res) => {
  const user = (req as any).user;
  db.pengaturan = { ...db.pengaturan, ...req.body };
  saveDatabase();
  addAuditLog(user.username, "Memperbarui pengaturan instansi", req);
  res.json(db.pengaturan);
});

// GET Dashboard Statistics
app.get("/api/dashboard/stats", (req, res) => {
  const totalPegawai = db.pegawai.length;
  const currentYear = new Date().getFullYear();
  
  const totalSuratTugasTahunIni = db.suratTugas.filter(s => {
    const year = new Date(s.tanggalSurat).getFullYear();
    return year === currentYear;
  }).length;

  const totalSPPD = db.sppd.length;

  const currentMonth = new Date().getMonth(); // 0-11
  const suratTugasBulanIni = db.suratTugas.filter(s => {
    const date = new Date(s.tanggalSurat);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  }).length;

  // Aggregate monthly data for Chart
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const suratPerBulan = months.map((month, idx) => {
    const countST = db.suratTugas.filter(s => {
      const d = new Date(s.tanggalSurat);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    }).length;
    
    const countSPPD = db.sppd.filter(s => {
      const st = db.suratTugas.find(t => t.nomorSurat === s.nomorSuratTugas);
      if (!st) return false;
      const d = new Date(st.tanggalSurat);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    }).length;

    return { name: month, SuratTugas: countST, SPPD: countSPPD };
  });

  // Top employees by travel frequency
  const travelCountMap: Record<string, { nama: string, count: number }> = {};
  db.pegawai.forEach(p => {
    travelCountMap[p.id] = { nama: p.nama, count: 0 };
  });
  
  db.detailSuratTugas.forEach(d => {
    if (travelCountMap[d.idPegawai]) {
      travelCountMap[d.idPegawai].count += 1;
    }
  });

  const pegawaiSeringBertugas = Object.values(travelCountMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Transportation Frequency
  const transCountMap: Record<string, number> = {};
  db.sppd.forEach(s => {
    const trans = s.transportasi || "Lain-lain";
    transCountMap[trans] = (transCountMap[trans] || 0) + 1;
  });
  const transportasiTerbanyak = Object.entries(transCountMap).map(([name, count]) => ({ name, count }));

  // Budget Source / Sumber Dana Frequency
  const danaCountMap: Record<string, number> = {};
  db.kegiatan.forEach(k => {
    const dana = k.sumberDana || "Lainnya";
    danaCountMap[dana] = (danaCountMap[dana] || 0) + 1;
  });
  const kegiatanSumberDana = Object.entries(danaCountMap).map(([name, value]) => ({ name, value }));

  res.json({
    totalPegawai,
    totalSuratTugasTahunIni,
    totalSPPD,
    suratTugasBulanIni,
    suratPerBulan,
    pegawaiSeringBertugas,
    transportasiTerbanyak,
    kegiatanSumberDana,
    recentLogs: db.auditLogs.slice(0, 10)
  });
});

// PEGAWAI CRUD
app.get("/api/pegawai", (req, res) => {
  res.json(db.pegawai);
});

app.post("/api/pegawai", requireAuth, (req, res) => {
  const user = (req as any).user;
  const item = { ...req.body };
  
  if (!item.NIP || !item.nama) {
    return res.status(400).json({ error: "NIP dan Nama pegawai wajib diisi" });
  }

  // Generate ID
  const nextId = "PEG-" + String(db.pegawai.length + 1).padStart(3, '0');
  item.id = nextId;
  item.status = item.status || "Aktif";

  db.pegawai.push(item);
  saveDatabase();
  addAuditLog(user.username, `Menambahkan Pegawai Baru: ${item.nama} (${item.NIP})`, req);
  res.status(201).json(item);
});

app.put("/api/pegawai/:id", requireAuth, (req, res) => {
  const user = (req as any).user;
  const idx = db.pegawai.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Pegawai tidak ditemukan" });
  }

  db.pegawai[idx] = { ...db.pegawai[idx], ...req.body };
  saveDatabase();
  addAuditLog(user.username, `Mengubah data pegawai: ${db.pegawai[idx].nama}`, req);
  res.json(db.pegawai[idx]);
});

app.delete("/api/pegawai/:id", requireAuth, requireAdmin, (req, res) => {
  const user = (req as any).user;
  const idx = db.pegawai.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Pegawai tidak ditemukan" });
  }

  const p = db.pegawai[idx];
  db.pegawai.splice(idx, 1);
  saveDatabase();
  addAuditLog(user.username, `Menghapus pegawai: ${p.nama}`, req);
  res.json({ success: true });
});

// IMPORT PEGAWAI (BULK)
app.post("/api/pegawai/bulk", requireAuth, (req, res) => {
  const user = (req as any).user;
  const list = req.body;
  if (!Array.isArray(list)) {
    return res.status(400).json({ error: "Data harus berupa list array" });
  }

  let importedCount = 0;
  list.forEach(item => {
    if (!item.NIP || !item.nama) return;
    const existing = db.pegawai.find(p => p.NIP === item.NIP);
    if (existing) {
      // update
      Object.assign(existing, item);
    } else {
      // create
      const nextId = "PEG-" + String(db.pegawai.length + 1).padStart(3, '0');
      db.pegawai.push({
        id: nextId,
        NIP: item.NIP,
        nama: item.nama,
        pangkat: item.pangkat || "Pembina / IVa",
        jabatan: item.jabatan || "Staff",
        unitKerja: item.unitKerja || "Puskesmas Boyan Tanjung",
        noHP: item.noHP || "-",
        email: item.email || "-",
        status: item.status || "Aktif"
      });
    }
    importedCount++;
  });

  saveDatabase();
  addAuditLog(user.username, `Mengimpor bulk data ${importedCount} pegawai`, req);
  res.json({ success: true, count: importedCount });
});


// KEGIATAN CRUD
app.get("/api/kegiatan", (req, res) => {
  res.json(db.kegiatan);
});

app.post("/api/kegiatan", requireAuth, (req, res) => {
  const user = (req as any).user;
  const item = { ...req.body };
  
  if (!item.namaKegiatan || !item.dasarKegiatan || !item.tempat) {
    return res.status(400).json({ error: "Nama Kegiatan, Dasar Kegiatan, dan Tempat wajib diisi" });
  }

  const nextId = "KEG-" + String(db.kegiatan.length + 1).padStart(3, '0');
  item.id = nextId;

  db.kegiatan.push(item);
  saveDatabase();
  addAuditLog(user.username, `Menambahkan Kegiatan Baru: ${item.namaKegiatan}`, req);
  res.status(201).json(item);
});

app.put("/api/kegiatan/:id", requireAuth, (req, res) => {
  const user = (req as any).user;
  const idx = db.kegiatan.findIndex(k => k.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Kegiatan tidak ditemukan" });
  }

  db.kegiatan[idx] = { ...db.kegiatan[idx], ...req.body };
  saveDatabase();
  addAuditLog(user.username, `Mengubah data kegiatan: ${db.kegiatan[idx].namaKegiatan}`, req);
  res.json(db.kegiatan[idx]);
});

app.delete("/api/kegiatan/:id", requireAuth, requireAdmin, (req, res) => {
  const user = (req as any).user;
  const idx = db.kegiatan.findIndex(k => k.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Kegiatan tidak ditemukan" });
  }

  const k = db.kegiatan[idx];
  db.kegiatan.splice(idx, 1);
  saveDatabase();
  addAuditLog(user.username, `Menghapus kegiatan: ${k.namaKegiatan}`, req);
  res.json({ success: true });
});

// IMPORT KEGIATAN (BULK)
app.post("/api/kegiatan/bulk", requireAuth, (req, res) => {
  const user = (req as any).user;
  const list = req.body;
  if (!Array.isArray(list)) {
    return res.status(400).json({ error: "Data harus berupa list array" });
  }

  let importedCount = 0;
  list.forEach(item => {
    if (!item.namaKegiatan) return;
    const nextId = "KEG-" + String(db.kegiatan.length + 1).padStart(3, '0');
    db.kegiatan.push({
      id: nextId,
      namaKegiatan: item.namaKegiatan,
      dasarKegiatan: item.dasarKegiatan || "Rencana Kerja",
      tempat: item.tempat || "Puskesmas",
      kabupaten: item.kabupaten || "Kapuas Hulu",
      provinsi: item.provinsi || "Kalimantan Barat",
      tanggalMulai: item.tanggalMulai || new Date().toISOString().split("T")[0],
      tanggalSelesai: item.tanggalSelesai || new Date().toISOString().split("T")[0],
      sumberDana: item.sumberDana || "BOK",
      keterangan: item.keterangan || "-"
    });
    importedCount++;
  });

  saveDatabase();
  addAuditLog(user.username, `Mengimpor bulk data ${importedCount} kegiatan`, req);
  res.json({ success: true, count: importedCount });
});


// SURAT TUGAS CRUD + DETAIL PEG
app.get("/api/surattugas", (req, res) => {
  // Join surattugas with detailSuratTugas
  const result = db.suratTugas.map(st => {
    const petugas = db.detailSuratTugas.filter(det => det.nomorSurat === st.nomorSurat);
    return { ...st, petugas };
  });
  res.json(result);
});

// Generate Auto Nomor Surat
app.get("/api/surattugas/next-number", (req, res) => {
  const currentYear = new Date().getFullYear();
  const monthsRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const currentMonthRoman = monthsRoman[new Date().getMonth()];
  
  // Find highest serial number for current year
  let maxNum = parseInt(db.pengaturan.nomorAwalSurat) - 1;
  if (isNaN(maxNum)) maxNum = 0;

  db.suratTugas.forEach(s => {
    const parts = s.nomorSurat.split("/");
    if (parts.length >= 2) {
      const serialStr = parts[1];
      const serial = parseInt(serialStr, 10);
      const yearStr = parts[parts.length - 1];
      if (!isNaN(serial) && yearStr === String(currentYear)) {
        if (serial > maxNum) {
          maxNum = serial;
        }
      }
    }
  });

  const nextSerial = String(maxNum + 1).padStart(3, "0");
  const format = db.pengaturan.formatNomorSurat || "440/[NOMOR]/ST/PT-BT/[BULAN]/[TAHUN]";
  const nomorSurat = format
    .replace("[NOMOR]", nextSerial)
    .replace("[BULAN]", currentMonthRoman)
    .replace("[TAHUN]", String(currentYear));

  res.json({ nomorSurat, nextSerial });
});

app.post("/api/surattugas", requireAuth, (req, res) => {
  const user = (req as any).user;
  const { surat, petugasIds } = req.body;

  if (!surat.nomorSurat || !surat.tanggalSurat || !surat.idKegiatan || !petugasIds || petugasIds.length === 0) {
    return res.status(400).json({ error: "Nomor Surat, Tanggal, Kegiatan, dan Petugas wajib diisi" });
  }

  // Check duplicate
  const dup = db.suratTugas.find(s => s.nomorSurat === surat.nomorSurat);
  if (dup) {
    return res.status(400).json({ error: "Nomor Surat sudah terdaftar dalam sistem" });
  }

  // Populate data from Kegiatan
  const keg = db.kegiatan.find(k => k.id === surat.idKegiatan);
  if (!keg) {
    return res.status(404).json({ error: "Kegiatan tidak ditemukan" });
  }

  // Calculate duration
  const start = new Date(surat.tanggalBerangkat || keg.tanggalMulai);
  const end = new Date(surat.tanggalKembali || keg.tanggalSelesai);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const newSurat = {
    nomorSurat: surat.nomorSurat,
    tanggalSurat: surat.tanggalSurat,
    idKegiatan: keg.id,
    namaKegiatan: keg.namaKegiatan,
    dasarSurat: surat.dasarSurat || keg.dasarKegiatan,
    maksud: surat.maksud || keg.keterangan || keg.namaKegiatan,
    tempat: surat.tempat || keg.tempat,
    tanggalBerangkat: surat.tanggalBerangkat || keg.tanggalMulai,
    tanggalKembali: surat.tanggalKembali || keg.tanggalSelesai,
    lamaHari: isNaN(diffDays) ? 1 : diffDays,
    penandatangan: surat.penandatangan || db.pengaturan.namaKepalaPuskesmas,
    status: surat.status || "Aktif",
    linkPdf: "",
    timestamp: new Date().toISOString()
  };

  db.suratTugas.push(newSurat);

  // Insert Detail Pegawai
  const details: any[] = [];
  petugasIds.forEach((pId: string) => {
    const peg = db.pegawai.find(p => p.id === pId);
    if (peg) {
      const detail = {
        nomorSurat: newSurat.nomorSurat,
        idPegawai: peg.id,
        nama: peg.nama,
        NIP: peg.NIP,
        jabatan: peg.jabatan
      };
      db.detailSuratTugas.push(detail);
      details.push(detail);
    }
  });

  saveDatabase();
  addAuditLog(user.username, `Membuat Surat Tugas baru: ${newSurat.nomorSurat}`, req);
  res.status(201).json({ ...newSurat, petugas: details });
});

app.delete("/api/surattugas/:nomor(*)", requireAuth, requireAdmin, (req, res) => {
  const user = (req as any).user;
  const nomor = req.params.nomor;

  const idx = db.suratTugas.findIndex(s => s.nomorSurat === nomor);
  if (idx === -1) {
    return res.status(404).json({ error: "Surat Tugas tidak ditemukan" });
  }

  db.suratTugas.splice(idx, 1);
  // Clear details
  db.detailSuratTugas = db.detailSuratTugas.filter(d => d.nomorSurat !== nomor);
  // Clear linked SPPDs
  db.sppd = db.sppd.filter(s => s.nomorSuratTugas !== nomor);

  saveDatabase();
  addAuditLog(user.username, `Menghapus Surat Tugas & SPPD terkait: ${nomor}`, req);
  res.json({ success: true });
});


// SPPD CRUD
app.get("/api/sppd", (req, res) => {
  res.json(db.sppd);
});

// Create SPPD automatically from Surat Tugas
app.post("/api/sppd", requireAuth, (req, res) => {
  const user = (req as any).user;
  const { nomorSuratTugas, idPegawai, transportasi, sumberDana, nomorSPD, instansiTujuan, pejabatTujuan, keterangan } = req.body;

  if (!nomorSuratTugas || !idPegawai) {
    return res.status(400).json({ error: "Nomor Surat Tugas dan Pegawai wajib ditentukan" });
  }

  const st = db.suratTugas.find(s => s.nomorSurat === nomorSuratTugas);
  if (!st) {
    return res.status(404).json({ error: "Surat Tugas tidak ditemukan" });
  }

  const peg = db.pegawai.find(p => p.id === idPegawai);
  if (!peg) {
    return res.status(404).json({ error: "Pegawai tidak ditemukan" });
  }

  // Check duplicate SPPD for this employee on this Surat Tugas
  const dup = db.sppd.find(s => s.nomorSuratTugas === nomorSuratTugas && s.idPegawai === idPegawai);
  if (dup) {
    return res.status(400).json({ error: `SPPD untuk ${peg.nama} pada surat tugas ini sudah ada` });
  }

  // Generate Nomor SPPD
  const currentYear = new Date().getFullYear();
  let maxSppdNum = 0;
  db.sppd.forEach(s => {
    const parts = s.nomorSPPD.split("/");
    if (parts.length > 0) {
      const num = parseInt(parts[0], 10);
      if (!isNaN(num)) {
        maxSppdNum = Math.max(maxSppdNum, num);
      }
    }
  });

  const nextSppdNum = String(maxSppdNum + 1).padStart(3, "0");
  const nomorSPPD = `${nextSppdNum}/SPPD/PT-BT/VII/${currentYear}`; // Follow government index style

  const newSppd = {
    nomorSPPD,
    nomorSuratTugas: st.nomorSurat,
    idPegawai: peg.id,
    nama: peg.nama,
    maksudPerjalanan: st.maksud,
    tempatTujuan: st.tempat,
    tanggalBerangkat: st.tanggalBerangkat,
    tanggalKembali: st.tanggalKembali,
    lamaHari: st.lamaHari,
    transportasi: transportasi || "Sepeda Motor Dinas",
    sumberDana: sumberDana || "BOK",
    nomorSPD: nomorSPD || `SPD/BOK/${nextSppdNum}/${currentYear}`,
    instansiTujuan: instansiTujuan || st.tempat,
    pejabatTujuan: pejabatTujuan || "Kepala Instansi Terkait",
    keterangan: keterangan || "Melaksanakan tugas pelayanan kesehatan",
    linkPdf: ""
  };

  db.sppd.push(newSppd);
  saveDatabase();
  addAuditLog(user.username, `Membuat SPPD Baru: ${nomorSPPD} untuk ${peg.nama}`, req);
  res.status(201).json(newSppd);
});

app.delete("/api/sppd/:nomor(*)", requireAuth, requireAdmin, (req, res) => {
  const user = (req as any).user;
  const nomor = req.params.nomor;

  const idx = db.sppd.findIndex(s => s.nomorSPPD === nomor);
  if (idx === -1) {
    return res.status(404).json({ error: "SPPD tidak ditemukan" });
  }

  const s = db.sppd[idx];
  db.sppd.splice(idx, 1);
  saveDatabase();
  addAuditLog(user.username, `Menghapus SPPD: ${nomor}`, req);
  res.json({ success: true });
});


// PUBLIC SCAN/VERIFICATION ENDPOINT
app.get("/api/verify", (req, res) => {
  const query = req.query.no as string;
  if (!query) {
    return res.status(400).json({ valid: false, error: "Nomor surat tidak disertakan" });
  }

  // Can verify either Surat Tugas or SPPD
  const st = db.suratTugas.find(s => s.nomorSurat === query);
  if (st) {
    const petugas = db.detailSuratTugas.filter(d => d.nomorSurat === st.nomorSurat);
    return res.json({
      valid: true,
      tipe: "Surat Tugas",
      nomor: st.nomorSurat,
      tanggal: st.tanggalSurat,
      maksud: st.maksud,
      tempat: st.tempat,
      lamaHari: st.lamaHari,
      tanggalBerangkat: st.tanggalBerangkat,
      tanggalKembali: st.tanggalKembali,
      status: st.status,
      petugas: petugas.map(p => `${p.nama} (${p.jabatan})`),
      instansi: db.pengaturan.namaInstansi,
      alamat: db.pengaturan.alamat,
      penandatangan: st.penandatangan
    });
  }

  const sppd = db.sppd.find(s => s.nomorSPPD === query || s.nomorSPD === query);
  if (sppd) {
    return res.json({
      valid: true,
      tipe: "SPPD (Surat Perintah Perjalanan Dinas)",
      nomor: sppd.nomorSPPD,
      nomorSuratTugas: sppd.nomorSuratTugas,
      nama: sppd.nama,
      maksud: sppd.maksudPerjalanan,
      tempat: sppd.tempatTujuan,
      lamaHari: sppd.lamaHari,
      tanggalBerangkat: sppd.tanggalBerangkat,
      tanggalKembali: sppd.tanggalKembali,
      transportasi: sppd.transportasi,
      sumberDana: sppd.sumberDana,
      nomorSPD: sppd.nomorSPD,
      status: "Valid",
      instansi: db.pengaturan.namaInstansi,
      alamat: db.pengaturan.alamat,
      penandatangan: db.pengaturan.namaKepalaPuskesmas
    });
  }

  res.json({ valid: false, error: "Nomor surat atau SPPD tidak terdaftar di sistem Puskesmas Boyan Tanjung" });
});


// BACKUP ENDPOINT
app.post("/api/backup", requireAuth, requireAdmin, (req, res) => {
  const user = (req as any).user;
  const backupDir = path.join(process.cwd(), "backup");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `database-backup-${timestamp}.json`);
  
  fs.writeFileSync(backupFile, JSON.stringify(db, null, 2), "utf-8");
  addAuditLog(user.username, `Memicu backup database manual ke ${path.basename(backupFile)}`, req);
  
  res.json({ success: true, file: path.basename(backupFile) });
});


// GOOGLE APPS SCRIPT CODE PROVIDER
app.get("/api/apps-script-code", (req, res) => {
  const code = {
    "Code.gs": `/**
 * @license
 * Puskesmas Boyan Tanjung GAS Admin System
 */

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
      .setTitle("SIM ST-SPPD Puskesmas Boyan Tanjung")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
`,
    "Config.gs": `/**
 * Configuration variables and Sheet initializers
 */
var CONFIG = {
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
  INSTANSI: "Puskesmas Boyan Tanjung",
  ALAMAT: "Jl. Lintas Selatan, Kecamatan Boyan Tanjung, Kapuas Hulu, Kalimantan Barat",
  KEPALA: "dr. H. Ade Hermanto",
  NIP_KEPALA: "198001012005011001",
  FORMAT_NOMOR: "440/[NOMOR]/ST/PT-BT/[BULAN]/[TAHUN]"
};

function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheets = ["Pegawai", "Kegiatan", "Surat Tugas", "Detail Surat Tugas", "SPPD", "Pengaturan", "Audit Log"];
  var headers = {
    "Pegawai": ["ID Pegawai", "NIP", "Nama", "Pangkat/Golongan", "Jabatan", "Unit Kerja", "No HP", "Email", "Status"],
    "Kegiatan": ["ID Kegiatan", "Nama Kegiatan", "Dasar Kegiatan", "Tempat", "Kabupaten", "Provinsi", "Tanggal Mulai", "Tanggal Selesai", "Sumber Dana", "Keterangan"],
    "Surat Tugas": ["Nomor Surat", "Tanggal Surat", "ID Kegiatan", "Nama Kegiatan", "Dasar Surat", "Maksud", "Tempat", "Tanggal Berangkat", "Tanggal Kembali", "Lama Hari", "Penandatangan", "Status", "Link PDF", "Timestamp"],
    "Detail Surat Tugas": ["Nomor Surat", "ID Pegawai", "Nama", "NIP", "Jabatan"],
    "SPPD": ["Nomor SPPD", "Nomor Surat Tugas", "ID Pegawai", "Nama", "Maksud Perjalanan", "Tempat Tujuan", "Tanggal Berangkat", "Tanggal Kembali", "Lama Hari", "Transportasi", "Sumber Dana", "Nomor SPD", "Link PDF"],
    "Pengaturan": ["Kunci", "Nilai"],
    "Audit Log": ["Timestamp", "User", "Aktivitas", "IP"]
  };
  
  sheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers[name]);
      sheet.getRange(1, 1, 1, headers[name].length).setFontWeight("bold").setBackground("#d1e7dd");
    }
  });
  
  // Seed Pengaturan
  var settingSheet = ss.getSheetByName("Pengaturan");
  if (settingSheet.getLastRow() <= 1) {
    settingSheet.appendRow(["Nama Instansi", CONFIG.INSTANSI]);
    settingSheet.appendRow(["Alamat", CONFIG.ALAMAT]);
    settingSheet.appendRow(["Kepala Puskesmas", CONFIG.KEPALA]);
    settingSheet.appendRow(["NIP Kepala", CONFIG.NIP_KEPALA]);
    settingSheet.appendRow(["Format Nomor", CONFIG.FORMAT_NOMOR]);
  }
}
`,
    "Pegawai.gs": `/**
 * Pegawai database CRUD controllers
 */
function getPegawaiList() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pegawai");
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j].replace(/\\s+/g, '')] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function addPegawai(p) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pegawai");
  var nextId = "PEG-" + String(sheet.getLastRow()).padStart(3, '0');
  sheet.appendRow([
    nextId,
    p.NIP,
    p.nama,
    p.pangkat,
    p.jabatan,
    p.unitKerja,
    p.noHP,
    p.email,
    "Aktif"
  ]);
  logActivity("admin", "Menambahkan Pegawai " + p.nama);
  return {success: true};
}
`,
    "SuratTugas.gs": `/**
 * Surat Tugas generator and controller
 */
function createSuratTugas(st, petugasIds) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetST = ss.getSheetByName("Surat Tugas");
  var sheetDetail = ss.getSheetByName("Detail Surat Tugas");
  
  // Calculate next sequence
  var nomor = st.nomorSurat;
  
  sheetST.appendRow([
    nomor,
    st.tanggalSurat,
    st.idKegiatan,
    st.namaKegiatan,
    st.dasarSurat,
    st.maksud,
    st.tempat,
    st.tanggalBerangkat,
    st.tanggalKembali,
    st.lamaHari,
    st.penandatangan,
    "Aktif",
    "",
    new Date()
  ]);
  
  // Add detailed staff links
  var employees = getPegawaiList();
  petugasIds.forEach(function(id) {
    var emp = employees.find(function(e) { return e.IDPegawai === id; });
    if (emp) {
      sheetDetail.appendRow([
        nomor,
        emp.IDPegawai,
        emp.Nama,
        emp.NIP,
        emp.Jabatan
      ]);
    }
  });
  
  logActivity("admin", "Membuat Surat Tugas " + nomor);
  return { success: true, nomor: nomor };
}
`,
    "SPPD.gs": `/**
 * SPPD database CRUD controllers
 */
function createSPPD(sppd) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SPPD");
  sheet.appendRow([
    sppd.nomorSPPD,
    sppd.nomorSuratTugas,
    sppd.idPegawai,
    sppd.nama,
    sppd.maksudPerjalanan,
    sppd.tempatTujuan,
    sppd.tanggalBerangkat,
    sppd.tanggalKembali,
    sppd.lamaHari,
    sppd.transportasi,
    sppd.sumberDana,
    sppd.nomorSPD,
    ""
  ]);
  logActivity("admin", "Membuat SPPD " + sppd.nomorSPPD + " untuk " + sppd.nama);
  return { success: true };
}
`,
    "PDF.gs": `/**
 * HTML Template Renderer & PDF Export
 */
function generatePdfBlob(htmlContent, filename) {
  var htmlOutput = HtmlService.createHtmlOutput(htmlContent);
  var pdfBlob = htmlOutput.getAs('application/pdf').setName(filename + ".pdf");
  return pdfBlob;
}

function backupDatabaseToDrive() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var file = DriveApp.getFileById(ss.getId());
  var folder = DriveApp.getRootFolder();
  var backupName = ss.getName() + " - Backup " + Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  file.makeCopy(backupName, folder);
}
`,
    "Utils.gs": `/**
 * System logs and general utilities
 */
function logActivity(user, activity) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Audit Log");
    sheet.appendRow([
      new Date(),
      user,
      activity,
      "Google Apps Script Session"
    ]);
  } catch(e) {}
}
`,
    "index.html": `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>SIM ST-SPPD Puskesmas Boyan Tanjung</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', sans-serif; }
    </style>
  </head>
  <body class="bg-slate-50 text-slate-800">
    <div class="min-h-screen flex flex-col">
      <!-- Navbar -->
      <header class="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">P</div>
          <div>
            <h1 class="text-base font-bold leading-none">Puskesmas Boyan Tanjung</h1>
            <p class="text-[10px] text-slate-400 mt-0.5">Sistem Informasi Surat Tugas & SPPD</p>
          </div>
        </div>
        <div class="text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-indigo-400 font-semibold">
          Google Sheets Integrated
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Sidebar Navigation -->
        <aside class="md:col-span-1 space-y-2">
          <button onclick="switchTab('pegawai')" id="nav-pegawai" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500 shadow-sm flex items-center gap-2">
            👨‍💼 Kelola Pegawai
          </button>
          <button onclick="switchTab('kegiatan')" id="nav-kegiatan" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:bg-slate-100 flex items-center gap-2">
            📅 Agenda Kegiatan
          </button>
          <button onclick="switchTab('surat')" id="nav-surat" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:bg-slate-100 flex items-center gap-2">
            📄 Surat Tugas
          </button>
        </aside>

        <!-- Dynamic Sheets Content -->
        <section class="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
          <!-- Pegawai Tab -->
          <div id="tab-pegawai" class="tab-content space-y-4">
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-bold text-slate-800">Daftar Pegawai / Staf Puskesmas</h2>
              <button onclick="alert('Modul form input akan disinkronisasi ke Google Sheet')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all">
                + Tambah Pegawai
              </button>
            </div>
            <div class="overflow-x-auto border border-slate-100 rounded-xl">
              <table class="min-w-full text-sm">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-slate-600">ID</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-600">Nama Lengkap</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-600">NIP</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-600">Jabatan</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody id="pegawai-list-tbody" class="divide-y divide-slate-100">
                  <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-slate-400">Memuat data pegawai langsung dari Spreadsheet...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Kegiatan Tab -->
          <div id="tab-kegiatan" class="tab-content space-y-4 hidden">
            <h2 class="text-lg font-bold text-slate-800">Daftar Agenda Kegiatan</h2>
            <div class="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 border border-slate-100">
              Modul agenda kegiatan dan surat keputusan terintegrasi langsung dengan database Google Sheets Anda.
            </div>
          </div>

          <!-- Surat Tugas Tab -->
          <div id="tab-surat" class="tab-content space-y-4 hidden">
            <h2 class="text-lg font-bold text-slate-800">Arsip Penerbitan Surat Tugas</h2>
            <div class="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 border border-slate-100">
              Data digital Surat Tugas dan SPPD yang diterbitkan oleh sistem administrasi Puskesmas.
            </div>
          </div>
        </section>
      </main>
    </div>

    <script>
      function switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('tab-' + tabId).classList.remove('hidden');
        document.querySelectorAll('aside button').forEach(el => {
          el.className = "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:bg-slate-100 flex items-center gap-2";
        });
        document.getElementById('nav-' + tabId).className = "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500 shadow-sm flex items-center gap-2";
      }

      window.onload = function() {
        if (typeof google !== 'undefined') {
          google.script.run.withSuccessHandler(showPegawai).getPegawaiList();
        } else {
          // Fallback static testing
          showPegawai([
            { IDPegawai: "PEG-001", Nama: "dr. H. Ade Hermanto", NIP: "198001012005011001", Jabatan: "Kepala Puskesmas", Status: "Aktif" },
            { IDPegawai: "PEG-002", Nama: "Sri Wahyuni, A.Md.Keb", NIP: "198512122008012003", Jabatan: "Bidan Koordinator", Status: "Aktif" }
          ]);
        }
      };

      function showPegawai(list) {
        var tbody = document.getElementById('pegawai-list-tbody');
        if (!list || list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Tidak ada data pegawai.</td></tr>';
          return;
        }
        var html = '';
        for (var i = 0; i < list.length; i++) {
          var p = list[i];
          html += '<tr class="hover:bg-slate-50/50">' +
            '<td class="px-4 py-3 font-mono text-xs text-slate-500">' + (p.IDPegawai || '') + '</td>' +
            '<td class="px-4 py-3 font-semibold text-slate-800">' + (p.Nama || '') + '</td>' +
            '<td class="px-4 py-3 text-slate-600">' + (p.NIP || '') + '</td>' +
            '<td class="px-4 py-3 text-slate-600">' + (p.Jabatan || '') + '</td>' +
            '<td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">' + (p.Status || 'Aktif') + '</span></td>' +
            '</tr>';
        }
        tbody.innerHTML = html;
      }
    </script>
  </body>
</html>`
  };

  res.json(code);
});


// Serve React build in production, otherwise Vite dev server handles everything
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Puskesmas Boyan Tanjung System running on port ${PORT}`);
  });
}

startServer();
