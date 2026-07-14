import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Edit, Trash2, Search, Filter, Download, Upload, X, 
  UserPlus, Mail, Phone, ShieldAlert, FileSpreadsheet, Check, AlertCircle 
} from "lucide-react";
import { Pegawai, UserSession } from "../types";

interface PegawaiViewProps {
  session: UserSession;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function PegawaiView({ session, showToast }: PegawaiViewProps) {
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filterJabatan, setFilterJabatan] = useState<string>("");
  const [filterUnit, setFilterUnit] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Pegawai | null>(null);
  
  // Import/Export states
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [nip, setNip] = useState<string>("");
  const [nama, setNama] = useState<string>("");
  const [pangkat, setPangkat] = useState<string>("");
  const [jabatan, setJabatan] = useState<string>("");
  const [unitKerja, setUnitKerja] = useState<string>("Puskesmas Boyan Tanjung");
  const [noHP, setNoHP] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"Aktif" | "Tidak Aktif">("Aktif");

  useEffect(() => {
    fetchPegawai();
  }, []);

  const fetchPegawai = () => {
    setLoading(true);
    fetch("/api/pegawai")
      .then((res) => res.json())
      .then((data) => {
        setPegawai(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        showToast("Gagal memuat data pegawai", "error");
        setLoading(false);
      });
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNip("");
    setNama("");
    setPangkat("Penata / IIIc");
    setJabatan("");
    setUnitKerja("Puskesmas Boyan Tanjung");
    setNoHP("");
    setEmail("");
    setStatus("Aktif");
    setIsModalOpen(true);
  };

  const openEditModal = (item: Pegawai) => {
    setEditingItem(item);
    setNip(item.NIP);
    setNama(item.nama);
    setPangkat(item.pangkat);
    setJabatan(item.jabatan);
    setUnitKerja(item.unitKerja);
    setNoHP(item.noHP);
    setEmail(item.email);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip || !nama || !jabatan) {
      showToast("NIP, Nama, dan Jabatan wajib diisi", "error");
      return;
    }

    const payload = { NIP: nip, nama, pangkat, jabatan, unitKerja, noHP, email, status };
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/pegawai/${editingItem.id}` : "/api/pegawai";

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
        showToast(editingItem ? "Data pegawai berhasil diubah!" : "Pegawai baru berhasil ditambahkan!", "success");
        setIsModalOpen(false);
        fetchPegawai();
      })
      .catch((err) => {
        showToast(err.message, "error");
      });
  };

  const handleDelete = (id: string, name: string) => {
    if (session.role !== "Administrator") {
      showToast("Hanya Administrator yang dapat menghapus data", "error");
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus data pegawai "${name}"?`)) {
      fetch(`/api/pegawai/${id}`, {
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
          showToast("Data pegawai berhasil dihapus", "success");
          fetchPegawai();
        })
        .catch((err) => {
          console.error("Delete failed:", err);
          showToast("Gagal menghapus data pegawai", "error");
        });
    }
  };

  // CSV Export Engine (Excel Compatible)
  const handleExportCSV = () => {
    if (pegawai.length === 0) return;
    
    // Add UTF-8 BOM so Excel opens indonesian characters correctly
    const BOM = "\uFEFF";
    const headers = ["ID Pegawai", "NIP", "Nama", "Pangkat/Golongan", "Jabatan", "Unit Kerja", "No HP", "Email", "Status"];
    
    const rows = filteredPegawai.map((p) => [
      p.id,
      p.NIP,
      p.nama,
      p.pangkat,
      p.jabatan,
      p.unitKerja,
      p.noHP,
      p.email,
      p.status,
    ]);

    const csvContent = 
      BOM + 
      [headers.join(";"), ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Data_Pegawai_Puskesmas_BoyanTanjung_${new Date().getFullYear()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Berhasil mengekspor data pegawai ke Excel/CSV!", "success");
  };

  // CSV Import Loader
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
      // Split lines
      const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        showToast("Format data tidak valid. Minimal harus terdapat header dan 1 baris data.", "error");
        return;
      }

      // Check delimiter (comma or semicolon)
      const headerLine = lines[0];
      const delimiter = headerLine.includes(";") ? ";" : ",";
      
      const parsedList: any[] = [];
      
      // Parse CSV simple parser
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // simple quotes splitting
        const cols = line.split(delimiter).map(val => val.replace(/^["']|["']$/g, "").trim());
        
        if (cols.length >= 2) {
          parsedList.push({
            NIP: cols[1] || cols[0], // assume cols[1] is NIP, if cols is shorter, adapt
            nama: cols[2] || cols[1],
            pangkat: cols[3] || "Penata / IIIc",
            jabatan: cols[4] || "Staff",
            unitKerja: cols[5] || "Puskesmas Boyan Tanjung",
            noHP: cols[6] || "-",
            email: cols[7] || "-",
            status: (cols[8] || "Aktif") as "Aktif" | "Tidak Aktif"
          });
        }
      }

      if (parsedList.length === 0) {
        showToast("Tidak ada data valid yang bisa diimpor", "error");
        return;
      }

      // Send to server
      fetch("/api/pegawai/bulk", {
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
            showToast(`Berhasil mengimpor ${data.count} pegawai!`, "success");
            setIsImportOpen(false);
            setImportText("");
            fetchPegawai();
          } else {
            showToast("Gagal mengimpor data pegawai", "error");
          }
        });

    } catch (err) {
      console.error("Import processing error:", err);
      showToast("Kesalahan membaca file. Pastikan format CSV valid.", "error");
    }
  };

  // Filter & Search Logic
  const filteredPegawai = pegawai.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.NIP.toLowerCase().includes(search.toLowerCase()) ||
      p.jabatan.toLowerCase().includes(search.toLowerCase()) ||
      p.unitKerja.toLowerCase().includes(search.toLowerCase());

    const matchJabatan = filterJabatan === "" || p.jabatan.toLowerCase().includes(filterJabatan.toLowerCase());
    const matchUnit = filterUnit === "" || p.unitKerja.toLowerCase().includes(filterUnit.toLowerCase());
    const matchStatus = filterStatus === "" || p.status === filterStatus;

    return matchSearch && matchJabatan && matchUnit && matchStatus;
  });

  // Extract unique roles/departments for filter dropdowns
  const jabatans = Array.from(new Set(pegawai.map((p) => p.jabatan))).filter(Boolean);
  const units = Array.from(new Set(pegawai.map((p) => p.unitKerja))).filter(Boolean);

  const canEdit = session.role === "Administrator" || session.role === "Operator";
  const isAdmin = session.role === "Administrator";

  return (
    <div className="space-y-6">
      {/* Upper Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Database Kepegawaian</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola data staf medis, administrasi, dan bidan Puskesmas Boyan Tanjung
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span>Tambah Pegawai</span>
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

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, NIP, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-2">
          {/* Jabatan Filter */}
          <div className="relative">
            <select
              value={filterJabatan}
              onChange={(e) => setFilterJabatan(e.target.value)}
              className="appearance-none text-xs font-medium pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="">Semua Jabatan</option>
              {jabatans.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Unit Kerja Filter */}
          <div className="relative">
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="appearance-none text-xs font-medium pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="">Semua Unit Kerja</option>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none text-xs font-medium pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
            <Filter className="absolute right-3 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredPegawai.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
          <p className="text-sm font-medium">Tidak ada data pegawai ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Gunakan kata kunci lain atau bersihkan filter di atas.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Pegawai</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Pangkat / Golongan</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Jabatan</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Kontak</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  {canEdit && <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredPegawai.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{p.nama}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">NIP. {p.NIP}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{p.pangkat}</td>
                    <td className="px-5 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.jabatan}</div>
                        <div className="text-xs text-slate-400">{p.unitKerja}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.noHP}</div>
                        <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-5 ${
                        p.status === "Aktif" 
                          ? "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400" 
                          : "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(p.id, p.nama)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-500/10">
              <h3 className="font-bold text-lg">
                {editingItem ? "Ubah Data Pegawai" : "Tambah Pegawai Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:opacity-80">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">NIP (Nomor Induk Pegawai)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 19800101..."
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nama Lengkap &amp; Gelar</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: dr. H. Ade Hermanto"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pangkat / Golongan</label>
                  <input
                    type="text"
                    required
                    placeholder="Pembina / IVa"
                    value={pangkat}
                    onChange={(e) => setPangkat(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Jabatan Kerja</label>
                  <input
                    type="text"
                    required
                    placeholder="Bidan Koordinator / Perawat"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit Kerja / Instansi</label>
                <input
                  type="text"
                  required
                  value={unitKerja}
                  onChange={(e) => setUnitKerja(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">No HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={noHP}
                    onChange={(e) => setNoHP(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="staf@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status Keaktifan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Aktif" | "Tidak Aktif")}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
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
                  {editingItem ? "Simpan Perubahan" : "Simpan Pegawai"}
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
                Impor Data Pegawai dari Excel / CSV
              </h3>
              <button onClick={() => setIsImportOpen(false)} className="text-white hover:opacity-80">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-xs leading-relaxed space-y-1">
                <p className="font-semibold">Format Kolom Spreadsheet:</p>
                <p>Kolom di dalam berkas Excel/CSV Anda harus mengikuti tata urutan berikut:</p>
                <code className="block bg-white dark:bg-slate-950 p-1.5 rounded mt-1 font-mono font-bold select-all text-[10px] text-slate-700 dark:text-slate-300">
                  ID Pegawai ; NIP ; Nama ; Pangkat ; Jabatan ; Unit Kerja ; No HP ; Email ; Status
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
                    placeholder="ID-01;198001012005011001;dr. H. Ade Hermanto;Pembina / IVa;Kepala Puskesmas;Puskesmas Boyan Tanjung;0812...;ade@gmail.com;Aktif"
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
