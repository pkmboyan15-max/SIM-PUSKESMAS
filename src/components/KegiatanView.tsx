import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Edit, Trash2, Search, Filter, Download, Upload, X, 
  CalendarDays, MapPin, DollarSign, FileSpreadsheet, Check, AlertCircle 
} from "lucide-react";
import { Kegiatan, UserSession } from "../types";

interface KegiatanViewProps {
  session: UserSession;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function KegiatanView({ session, showToast }: KegiatanViewProps) {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Kegiatan | null>(null);

  // Import/Export states
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [namaKegiatan, setNamaKegiatan] = useState<string>("");
  const [dasarKegiatan, setDasarKegiatan] = useState<string>("");
  const [tempat, setTempat] = useState<string>("");
  const [kabupaten, setKabupaten] = useState<string>("Kapuas Hulu");
  const [provinsi, setProvinsi] = useState<string>("Kalimantan Barat");
  const [tanggalMulai, setTanggalMulai] = useState<string>("");
  const [tanggalSelesai, setTanggalSelesai] = useState<string>("");
  const [sumberDana, setSumberDana] = useState<string>("BOK");
  const [keterangan, setKeterangan] = useState<string>("");

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const fetchKegiatan = () => {
    setLoading(true);
    fetch("/api/kegiatan")
      .then((res) => res.json())
      .then((data) => {
        setKegiatan(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading activities:", err);
        showToast("Gagal memuat data kegiatan", "error");
        setLoading(false);
      });
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNamaKegiatan("");
    setDasarKegiatan("");
    setTempat("");
    setKabupaten("Kapuas Hulu");
    setProvinsi("Kalimantan Barat");
    
    const todayStr = new Date().toISOString().split("T")[0];
    setTanggalMulai(todayStr);
    setTanggalSelesai(todayStr);
    setSumberDana("BOK");
    setKeterangan("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: Kegiatan) => {
    setEditingItem(item);
    setNamaKegiatan(item.namaKegiatan);
    setDasarKegiatan(item.dasarKegiatan);
    setTempat(item.tempat);
    setKabupaten(item.kabupaten);
    setProvinsi(item.provinsi);
    setTanggalMulai(item.tanggalMulai);
    setTanggalSelesai(item.tanggalSelesai);
    setSumberDana(item.sumberDana);
    setKeterangan(item.keterangan);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKegiatan || !dasarKegiatan || !tempat || !tanggalMulai || !tanggalSelesai) {
      showToast("Mohon lengkapi kolom yang wajib diisi", "error");
      return;
    }

    const payload = {
      namaKegiatan,
      dasarKegiatan,
      tempat,
      kabupaten,
      provinsi,
      tanggalMulai,
      tanggalSelesai,
      sumberDana,
      keterangan
    };

    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/kegiatan/${editingItem.id}` : "/api/kegiatan";

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error || "Gagal menyimpan") });
        return res.json();
      })
      .then(() => {
        showToast(editingItem ? "Data kegiatan berhasil diubah" : "Kegiatan baru berhasil dibuat", "success");
        setIsModalOpen(false);
        fetchKegiatan();
      })
      .catch((err) => {
        showToast(err.message, "error");
      });
  };

  const handleDelete = (id: string, name: string) => {
    if (session.role !== "Administrator") {
      showToast("Hanya Administrator yang dapat menghapus kegiatan", "error");
      return;
    }

    if (window.confirm(`Hapus kegiatan "${name}"? Surat Tugas dan SPPD yang dikaitkan mungkin akan terpengaruh.`)) {
      fetch(`/api/kegiatan/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Gagal menghapus");
          return res.json();
        })
        .then(() => {
          showToast("Data kegiatan berhasil dihapus", "success");
          fetchKegiatan();
        })
        .catch((err) => {
          console.error("Delete failed:", err);
          showToast("Gagal menghapus data kegiatan", "error");
        });
    }
  };

  // CSV Export Engine
  const handleExportCSV = () => {
    if (kegiatan.length === 0) return;

    const BOM = "\uFEFF";
    const headers = ["ID Kegiatan", "Nama Kegiatan", "Dasar Kegiatan", "Tempat", "Kabupaten", "Provinsi", "Tanggal Mulai", "Tanggal Selesai", "Sumber Dana", "Keterangan"];
    
    const rows = filteredKegiatan.map((k) => [
      k.id,
      k.namaKegiatan,
      k.dasarKegiatan,
      k.tempat,
      k.kabupaten,
      k.provinsi,
      k.tanggalMulai,
      k.tanggalSelesai,
      k.sumberDana,
      k.keterangan,
    ]);

    const csvContent = 
      BOM + 
      [headers.join(";"), ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Data_Kegiatan_Puskesmas_BoyanTanjung_${new Date().getFullYear()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Berhasil mengekspor data kegiatan ke Excel/CSV!", "success");
  };

  // CSV Import parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      processImportData(text);
    };
    reader.readAsText(file);
  };

  const handlePasteImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) {
      showToast("Teks paste data kosong", "error");
      return;
    }
    processImportData(importText);
  };

  const processImportData = (rawText: string) => {
    try {
      const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        showToast("Format data tidak valid. Minimal harus terdapat header dan 1 baris data.", "error");
        return;
      }

      const headerLine = lines[0];
      const delimiter = headerLine.includes(";") ? ";" : ",";
      const parsedList: any[] = [];
      const today = new Date().toISOString().split("T")[0];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(delimiter).map(val => val.replace(/^["']|["']$/g, "").trim());
        
        if (cols.length >= 1 && cols[1]) {
          parsedList.push({
            namaKegiatan: cols[1],
            dasarKegiatan: cols[2] || "Rencana Kerja",
            tempat: cols[3] || "Puskesmas Boyan Tanjung",
            kabupaten: cols[4] || "Kapuas Hulu",
            provinsi: cols[5] || "Kalimantan Barat",
            tanggalMulai: cols[6] || today,
            tanggalSelesai: cols[7] || today,
            sumberDana: cols[8] || "BOK",
            keterangan: cols[9] || "-"
          });
        }
      }

      if (parsedList.length === 0) {
        showToast("Tidak ada data kegiatan valid yang bisa diimpor", "error");
        return;
      }

      fetch("/api/kegiatan/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(parsedList),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            showToast(`Berhasil mengimpor ${data.count} kegiatan!`, "success");
            setIsImportOpen(false);
            setImportText("");
            fetchKegiatan();
          } else {
            showToast("Gagal mengimpor data kegiatan", "error");
          }
        });

    } catch (err) {
      console.error("Import processing error:", err);
      showToast("Kesalahan membaca file. Pastikan format CSV valid.", "error");
    }
  };

  // Filter & Search Logic
  const filteredKegiatan = kegiatan.filter((k) => {
    const matchSearch =
      k.namaKegiatan.toLowerCase().includes(search.toLowerCase()) ||
      k.dasarKegiatan.toLowerCase().includes(search.toLowerCase()) ||
      k.tempat.toLowerCase().includes(search.toLowerCase()) ||
      k.sumberDana.toLowerCase().includes(search.toLowerCase());

    const year = new Date(k.tanggalMulai).getFullYear().toString();
    const matchYear = filterYear === "" || year === filterYear;
    
    const matchLocation = filterLocation === "" || k.kabupaten.toLowerCase() === filterLocation.toLowerCase();

    return matchSearch && matchYear && matchLocation;
  });

  // Extract years and locations dynamically
  const years = Array.from(new Set(kegiatan.map((k) => new Date(k.tanggalMulai).getFullYear().toString()))).sort().reverse();
  const locations = Array.from(new Set(kegiatan.map((k) => k.kabupaten))).filter(Boolean);

  const canEdit = session.role === "Administrator" || session.role === "Operator";
  const isAdmin = session.role === "Administrator";

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Database Agenda Kegiatan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Daftar rencana kerja, posyandu, imunisasi, dan kegiatan dinas luar Puskesmas Boyan Tanjung
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kegiatan</span>
            </button>
          )}

          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>Impor Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama kegiatan, dasar surat, lokasi, atau sumber anggaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex gap-2">
          {/* Year Filter */}
          <div className="relative">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="appearance-none text-xs font-medium pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="">Semua Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Location Filter */}
          <div className="relative">
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="appearance-none text-xs font-medium pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="">Semua Kabupaten</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid display (Bento style for Kegiatan as cards are usually more rich for calendar entries) */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredKegiatan.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
          <p className="text-sm font-medium">Tidak ada agenda kegiatan ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Ubah filter pencarian atau buat kegiatan luar gedung baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKegiatan.map((k) => (
            <div key={k.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    {k.id}
                  </span>
                  
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400">
                    <DollarSign className="h-3 w-3" />
                    {k.sumberDana}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {k.namaKegiatan}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2 font-sans italic">
                    Dasar: "{k.dasarKegiatan}"
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-50 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>
                      {k.tanggalMulai === k.tanggalSelesai 
                        ? k.tanggalMulai 
                        : `${k.tanggalMulai} s/d ${k.tanggalSelesai}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {k.tempat}, {k.kabupaten}
                    </span>
                  </div>
                </div>

                {k.keterangan && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 p-2 rounded-xl mt-1 line-clamp-2">
                    {k.keterangan}
                  </p>
                )}
              </div>

              {canEdit && (
                <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <button
                    onClick={() => openEditModal(k)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all text-xs font-medium flex items-center gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Ubah</span>
                  </button>
                  
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(k.id, k.namaKegiatan)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-xs font-medium flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CRUD Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-500/10">
              <h3 className="font-bold text-lg">
                {editingItem ? "Ubah Rincian Agenda Kegiatan" : "Buat Agenda Kegiatan Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:opacity-80">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BIAS Campak dan Polio SDN 01 Boyan Tanjung"
                  value={namaKegiatan}
                  onChange={(e) => setNamaKegiatan(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Dasar Kegiatan (Surat Undangan/RKA)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Surat Undangan Kepala Dinas Kesehatan Kabupaten Kapuas Hulu Nomor: 440/123/..."
                  value={dasarKegiatan}
                  onChange={(e) => setDasarKegiatan(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tempat Tujuan Pelaksanaan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Aula Desa Mujan"
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sumber Dana</label>
                  <select
                    value={sumberDana}
                    onChange={(e) => setSumberDana(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  >
                    <option value="BOK">BOK (Bantuan Operasional Kesehatan)</option>
                    <option value="APBD">APBD Kabupaten Kapuas Hulu</option>
                    <option value="JKN">JKN (Jaminan Kesehatan Nasional)</option>
                    <option value="Puskesmas">Mandiri Puskesmas / Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Kabupaten</label>
                  <input
                    type="text"
                    required
                    value={kabupaten}
                    onChange={(e) => setKabupaten(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Provinsi</label>
                  <input
                    type="text"
                    required
                    value={provinsi}
                    onChange={(e) => setProvinsi(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Keterangan / Deskripsi Pelaksanaan</label>
                <textarea
                  rows={2}
                  placeholder="Instruksi tambahan, logistik, atau keterangan lain..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  {editingItem ? "Simpan Perubahan" : "Simpan Kegiatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL PANEL MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in-50">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-500/10">
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                <FileSpreadsheet className="h-5 w-5" />
                Impor Data Agenda Kegiatan dari Excel / CSV
              </h3>
              <button onClick={() => setIsImportOpen(false)} className="text-white hover:opacity-80">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-xs leading-relaxed space-y-1">
                <p className="font-semibold">Format Kolom Spreadsheet:</p>
                <p>Kolom di dalam berkas Excel/CSV Anda harus mengikuti tata urutan berikut:</p>
                <code className="block bg-white dark:bg-slate-950 p-1.5 rounded mt-1 font-mono font-bold select-all text-[10px] text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                  ID Kegiatan ; Nama Kegiatan ; Dasar Kegiatan ; Tempat ; Kabupaten ; Provinsi ; Tanggal Mulai ; Tanggal Selesai ; Sumber Dana ; Keterangan
                </code>
              </div>

              {/* Drag and Drop area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 dark:border-slate-700 dark:hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/50 transition-colors"
              >
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pilih Berkas CSV / Spreadsheet</p>
                <p className="text-xs text-slate-400 mt-1">Dukung file format .csv dengan pemisah koma atau titik koma</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".csv,.txt" 
                  className="hidden" 
                />
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">Atau Paste Teks Spreadsheet</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <form onSubmit={handlePasteImport} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Paste Baris Data (CSV / Tab-Delimited)</label>
                  <textarea
                    rows={4}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="KEG-01;Posyandu Desa Nanga Boyan;Program Promosi Kesehatan;Posyandu Desa Nanga Boyan;Kapuas Hulu;Kalimantan Barat;2026-07-18;2026-07-18;BOK;Pelayanan rutin"
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsImportOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Proses Impor Teks</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
