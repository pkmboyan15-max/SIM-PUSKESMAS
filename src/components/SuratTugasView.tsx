import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, Plus, Search, Calendar, MapPin, Users, Printer, Eye, 
  Trash2, X, Check, ArrowRight, ClipboardCopy, QrCode, AlertCircle, Sparkles
} from "lucide-react";
import { SuratTugas, Kegiatan, Pegawai, Pengaturan, UserSession } from "../types";

interface SuratTugasViewProps {
  session: UserSession;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onNavigateToSPPD: (stNomor: string, idPegawai: string) => void;
}

export default function SuratTugasView({ session, showToast, onNavigateToSPPD }: SuratTugasViewProps) {
  const [suratList, setSuratList] = useState<SuratTugas[]>([]);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [settings, setSettings] = useState<Pengaturan | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Create Form State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [nomorSurat, setNomorSurat] = useState<string>("");
  const [tanggalSurat, setTanggalSurat] = useState<string>("");
  const [selectedKegId, setSelectedKegId] = useState<string>("");
  const [dasarSurat, setDasarSurat] = useState<string>("");
  const [maksud, setMaksud] = useState<string>("");
  const [tempat, setTempat] = useState<string>("");
  const [tanggalBerangkat, setTanggalBerangkat] = useState<string>("");
  const [tanggalKembali, setTanggalKembali] = useState<string>("");
  const [lamaHari, setLamaHari] = useState<number>(1);
  const [penandatangan, setPenandatangan] = useState<string>("");
  const [selectedPegIds, setSelectedPegIds] = useState<string[]>([]);

  // Preview / Print states
  const [activePrintSurat, setActivePrintSurat] = useState<SuratTugas | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resST, resKeg, resPeg, resSet] = await Promise.all([
        fetch("/api/surattugas").then(r => r.json()),
        fetch("/api/kegiatan").then(r => r.json()),
        fetch("/api/pegawai").then(r => r.json()),
        fetch("/api/settings").then(r => r.json())
      ]);

      setSuratList(resST);
      setKegiatanList(resKeg);
      setPegawaiList(resPeg.filter((p: Pegawai) => p.status === "Aktif"));
      setSettings(resSet);
      setPenandatangan(resSet.namaKepalaPuskesmas || "");
    } catch (err) {
      console.error("Error loading Surat Tugas references:", err);
      showToast("Gagal memuat referensi data", "error");
    } finally {
      setLoading(false);
    }
  };

  const getNextNomorSurat = () => {
    fetch("/api/surattugas/next-number")
      .then(res => res.json())
      .then(data => {
        setNomorSurat(data.nomorSurat);
      })
      .catch(err => {
        console.error("Error getting serial number:", err);
      });
  };

  const openCreateModal = () => {
    getNextNomorSurat();
    const todayStr = new Date().toISOString().split("T")[0];
    setTanggalSurat(todayStr);
    setSelectedKegId("");
    setDasarSurat("");
    setMaksud("");
    setTempat("");
    setTanggalBerangkat(todayStr);
    setTanggalKembali(todayStr);
    setLamaHari(1);
    setSelectedPegIds([]);
    setIsCreateOpen(true);
  };

  // Auto populate from selected Kegiatan
  const handleKegiatanChange = (kegId: string) => {
    setSelectedKegId(kegId);
    const keg = kegiatanList.find(k => k.id === kegId);
    if (keg) {
      setDasarSurat(keg.dasarKegiatan);
      setMaksud(keg.namaKegiatan);
      setTempat(keg.tempat);
      setTanggalBerangkat(keg.tanggalMulai);
      setTanggalKembali(keg.tanggalSelesai);
      
      // Calculate duration
      calculateDuration(keg.tanggalMulai, keg.tanggalSelesai);
    }
  };

  const handleDateChange = (start: string, end: string) => {
    setTanggalBerangkat(start);
    setTanggalKembali(end);
    calculateDuration(start, end);
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return;
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = eDate.getTime() - sDate.getTime();
    if (diffTime < 0) {
      setLamaHari(1);
      return;
    }
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setLamaHari(diffDays);
  };

  const handlePegawaiToggle = (pegId: string) => {
    if (selectedPegIds.includes(pegId)) {
      setSelectedPegIds(selectedPegIds.filter(id => id !== pegId));
    } else {
      setSelectedPegIds([...selectedPegIds, pegId]);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorSurat || !tanggalSurat || !selectedKegId || selectedPegIds.length === 0) {
      showToast("Mohon isi seluruh kolom wajib dan pilih minimal 1 petugas", "error");
      return;
    }

    const payload = {
      surat: {
        nomorSurat,
        tanggalSurat,
        idKegiatan: selectedKegId,
        dasarSurat,
        maksud,
        tempat,
        tanggalBerangkat,
        tanggalKembali,
        penandatangan,
        status: "Aktif"
      },
      petugasIds: selectedPegIds
    };

    fetch("/api/surattugas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error || "Gagal membuat surat") });
        return res.json();
      })
      .then(() => {
        showToast("Surat Tugas sukses dibuat!", "success");
        setIsCreateOpen(false);
        fetchData();
      })
      .catch(err => {
        showToast(err.message, "error");
      });
  };

  const handleDelete = (nomor: string) => {
    if (session.role !== "Administrator") {
      showToast("Hanya Administrator yang memiliki akses hapus berkas", "error");
      return;
    }

    if (window.confirm(`Hapus Surat Tugas "${nomor}" beserta rincian petugas dan data SPPD terkait? Tindakan ini tidak dapat dibatalkan.`)) {
      fetch(`/api/surattugas/${encodeURIComponent(nomor)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error("Gagal menghapus");
          return res.json();
        })
        .then(() => {
          showToast("Surat Tugas & SPPD berhasil diarsipkan/dihapus", "success");
          fetchData();
        })
        .catch(err => {
          console.error("Delete failed:", err);
          showToast("Gagal menghapus berkas", "error");
        });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getVerificationUrl = (nomor: string) => {
    const origin = window.location.origin;
    return `${origin}/verify?no=${encodeURIComponent(nomor)}`;
  };

  const getQrCodeUrl = (nomor: string) => {
    const url = getVerificationUrl(nomor);
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}`;
  };

  // Search and Filters
  const filteredSurat = suratList.filter(s => {
    const matchSearch = 
      s.nomorSurat.toLowerCase().includes(search.toLowerCase()) ||
      s.namaKegiatan.toLowerCase().includes(search.toLowerCase()) ||
      s.tempat.toLowerCase().includes(search.toLowerCase()) ||
      (s.petugas && s.petugas.some(p => p.nama.toLowerCase().includes(search.toLowerCase()) || p.NIP.includes(search)));

    const matchStatus = filterStatus === "" || s.status === filterStatus;

    return matchSearch && matchStatus;
  });

  const canEdit = session.role === "Administrator" || session.role === "Operator";
  const isAdmin = session.role === "Administrator";

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Administrasi Surat Tugas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Terbitkan surat penugasan resmi kolektif atau personal untuk kegiatan luar gedung Puskesmas
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-sm shrink-0"
          >
            <FileText className="h-4 w-4" />
            <span>Terbitkan Surat Tugas</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Cari berdasarkan nomor surat, nama pegawai, NIP, atau nama kegiatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="relative shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none text-xs font-medium pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 w-full"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif / Berjalan</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
          <X className="absolute right-3 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Surat List Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 no-print">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredSurat.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 no-print">
          <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
          <p className="text-sm font-medium">Tidak ada Surat Tugas ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Belum ada surat diterbitkan atau ubah kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">No. Surat / Tanggal</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Maksud Kegiatan</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Petugas Terdaftar</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Lokasi &amp; Tanggal</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredSurat.map((s) => (
                  <tr key={s.nomorSurat} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 font-mono select-all bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {s.nomorSurat}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Terbit: {s.tanggalSurat}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-300 line-clamp-2">{s.maksud}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">Kegiatan: {s.namaKegiatan}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {s.petugas && s.petugas.map((p) => (
                          <div key={p.idPegawai} className="flex items-center justify-between gap-4 text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{p.nama}</span>
                            
                            {canEdit && (
                              <button
                                onClick={() => onNavigateToSPPD(s.nomorSurat, p.idPegawai)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5 shrink-0"
                                title="Konfigurasi SPPD untuk staf ini"
                              >
                                <span>Buat SPPD</span>
                                <ArrowRight className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0 text-slate-400" /> <span className="truncate max-w-[120px]">{s.tempat}</span></div>
                        <div className="font-medium text-[11px]">
                          {s.tanggalBerangkat === s.tanggalKembali 
                            ? s.tanggalBerangkat 
                            : `${s.tanggalBerangkat} sd ${s.tanggalKembali}`}
                        </div>
                        <div className="text-[10px] text-slate-400">{s.lamaHari} Hari Dinas</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-5 ${
                        s.status === "Selesai" 
                          ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" 
                          : s.status === "Aktif" 
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400" 
                          : "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setActivePrintSurat(s);
                            setIsPreviewOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all"
                          title="Cetak &amp; Preview Surat"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(s.nomorSurat)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                            title="Hapus / Arsipkan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE DIALOG MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-indigo-500/10">
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                <Sparkles className="h-5 w-5" />
                Terbitkan Surat Tugas Baru
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-white hover:opacity-80">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 font-sans">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pilih Referensi Agenda Kegiatan *</label>
                  <select
                    required
                    value={selectedKegId}
                    onChange={(e) => handleKegiatanChange(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  >
                    <option value="">-- Pilih Kegiatan --</option>
                    {kegiatanList.map(k => (
                      <option key={k.id} value={k.id}>{k.namaKegiatan} ({k.tempat})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nomor Surat Tugas (Otomatis)</label>
                  <input
                    type="text"
                    required
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tanggal Terbit Surat *</label>
                  <input
                    type="date"
                    required
                    value={tanggalSurat}
                    onChange={(e) => setTanggalSurat(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Penandatangan Surat *</label>
                  <input
                    type="text"
                    required
                    value={penandatangan}
                    onChange={(e) => setPenandatangan(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Dasar Menugaskan (Konsideran Surat)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Dasar hukum / administrasi..."
                  value={dasarSurat}
                  onChange={(e) => setDasarSurat(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Maksud / Perihal Perjalanan Dinas</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Maksud pengabdian / penugasan..."
                  value={maksud}
                  onChange={(e) => setMaksud(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tempat Tujuan</label>
                  <input
                    type="text"
                    required
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tanggal Berangkat</label>
                  <input
                    type="date"
                    required
                    value={tanggalBerangkat}
                    onChange={(e) => handleDateChange(e.target.value, tanggalKembali)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tanggal Kembali</label>
                  <input
                    type="date"
                    required
                    value={tanggalKembali}
                    onChange={(e) => handleDateChange(tanggalBerangkat, e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-800 dark:text-indigo-400">Total Hari Perjalanan Dinas (Lama Hari):</span>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-950 px-3 py-1 rounded-lg border border-indigo-100 dark:border-slate-800">
                  {lamaHari} Hari
                </span>
              </div>

              {/* Multi Select Pegawai */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Pilih Staf / Pegawai yang Ditugaskan (Multi-select) *
                </label>
                
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-950">
                  {pegawaiList.map(peg => {
                    const isSelected = selectedPegIds.includes(peg.id);
                    return (
                      <div 
                        key={peg.id} 
                        onClick={() => handlePegawaiToggle(peg.id)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-xs transition-colors ${
                          isSelected ? "bg-indigo-50/60 dark:bg-indigo-950/20" : "hover:bg-slate-100/50"
                        }`}
                      >
                        <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"
                        }`}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{peg.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">NIP: {peg.NIP} | {peg.jabatan}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Pilih satu atau lebih pegawai yang akan diberangkatkan dinas luar.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  Terbitkan Surat Tugas
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW / GOVERNMENT-STLYED PRINT OUT DIALOG */}
      {isPreviewOpen && activePrintSurat && settings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:p-0 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none max-h-[90vh] print:max-h-full flex flex-col">
            
            {/* Action Bar inside Preview */}
            <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 shrink-0 no-print">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Pratinjau Cetak Surat Tugas</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Surat Tugas</span>
                </button>

                <button 
                  onClick={() => setIsPreviewOpen(false)} 
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Print Layout Area */}
            <div className="p-12 overflow-y-auto flex-1 bg-white dark:bg-white text-black dark:text-black print-container">
              
              <div ref={printAreaRef} className="max-w-[210mm] mx-auto text-[13px] leading-relaxed font-sans select-text">
                
                {/* KOP SURAT */}
                <div className="flex items-center justify-between pb-4 border-b-4 border-double border-black">
                  <img 
                    src={settings.logoKabupaten} 
                    alt="Logo Kab" 
                    className="h-20 w-16 object-contain" 
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="text-center flex-1 px-4 space-y-1">
                    <h1 className="text-base font-bold uppercase leading-none">Pemerintah Kabupaten Kapuas Hulu</h1>
                    <h2 className="text-lg font-bold uppercase leading-none text-slate-800 dark:text-slate-800">Dinas Kesehatan</h2>
                    <h3 className="text-xl font-bold uppercase leading-none select-all">{settings.namaInstansi}</h3>
                    <p className="text-[10px] leading-tight text-slate-600 italic">
                      {settings.alamat} <br />
                      Telp: {settings.telepon} | Email: {settings.email} | Website: {settings.website}
                    </p>
                  </div>

                  <img 
                    src={settings.logoPuskesmas} 
                    alt="Logo Pkm" 
                    className="h-16 w-16 object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* JUDUL SURAT */}
                <div className="text-center mt-6 space-y-1">
                  <h2 className="text-lg font-bold tracking-wider underline uppercase">Surat Tugas</h2>
                  <p className="text-xs font-mono">Nomor : {activePrintSurat.nomorSurat}</p>
                </div>

                {/* DASAR MENUGASKAN */}
                <div className="mt-6 flex gap-4 text-justify items-start">
                  <span className="font-semibold shrink-0 w-20">Dasar :</span>
                  <div className="flex-1 space-y-1">
                    <p>{activePrintSurat.dasarSurat}</p>
                  </div>
                </div>

                {/* MENUGASKAN */}
                <div className="text-center mt-6">
                  <h3 className="font-bold uppercase tracking-wider text-xs">M E N U G A S K A N :</h3>
                </div>

                <div className="mt-4 flex gap-4 items-start">
                  <span className="font-semibold shrink-0 w-20">Kepada :</span>
                  <div className="flex-1">
                    
                    <table className="w-full border border-black text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black">
                          <th className="px-3 py-2 border-r border-black font-semibold text-center w-8">No</th>
                          <th className="px-3 py-2 border-r border-black font-semibold">Nama / NIP</th>
                          <th className="px-3 py-2 border-r border-black font-semibold">Pangkat / Golongan</th>
                          <th className="px-3 py-2 font-semibold">Jabatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {activePrintSurat.petugas && activePrintSurat.petugas.map((peg, idx) => {
                          // Find full employee record for pangkat info
                          const fullPeg = pegawaiList.find(pl => pl.id === peg.idPegawai);
                          return (
                            <tr key={peg.idPegawai} className="border-b border-black">
                              <td className="px-3 py-2 border-r border-black text-center">{idx + 1}</td>
                              <td className="px-3 py-2 border-r border-black">
                                <div className="font-semibold">{peg.nama}</div>
                                <div className="text-[10px] text-slate-600 font-mono">NIP. {peg.NIP}</div>
                              </td>
                              <td className="px-3 py-2 border-r border-black">{fullPeg ? fullPeg.pangkat : "-"}</td>
                              <td className="px-3 py-2">{peg.jabatan}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                  </div>
                </div>

                {/* UNTUK / MAKSUD */}
                <div className="mt-6 flex gap-4 text-justify items-start">
                  <span className="font-semibold shrink-0 w-20">Untuk :</span>
                  <div className="flex-1 space-y-3">
                    <p>1. {activePrintSurat.maksud}.</p>
                    <p>2. Pelaksanaan penugasan dinas luar ini berlangsung di <strong>{activePrintSurat.tempat}</strong> selama <strong>{activePrintSurat.lamaHari}</strong> hari, terhitung dari tanggal <strong>{activePrintSurat.tanggalBerangkat}</strong> sampai dengan <strong>{activePrintSurat.tanggalKembali}</strong>.</p>
                    <p>3. Melaporkan hasil pelaksanaan tugas dinas tersebut kepada Kepala Puskesmas setelah selesai dilaksanakan.</p>
                    <p>4. Melaksanakan tugas dengan penuh tanggung jawab.</p>
                  </div>
                </div>

                {/* SIGNATURE SECTION */}
                <div className="mt-12 flex justify-between items-start">
                  
                  {/* QR Code and verification box */}
                  <div className="border border-slate-300 rounded-xl p-3 flex gap-3 max-w-xs bg-slate-50 print:bg-white text-slate-500 text-[9px] leading-tight">
                    <img 
                      src={getQrCodeUrl(activePrintSurat.nomorSurat)} 
                      alt="Verification QR" 
                      className="h-16 w-16 shrink-0 border border-slate-200 p-1 bg-white" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1 font-mono">
                      <p className="font-bold text-[10px] text-indigo-700">VERIFIKASI DIGITAL</p>
                      <p>Scan QR Code untuk memvalidasi keaslian dokumen tugas Puskesmas Boyan Tanjung.</p>
                      <p className="text-[8px] text-slate-400 uppercase select-all">{activePrintSurat.nomorSurat}</p>
                    </div>
                  </div>

                  {/* Sign block */}
                  <div className="text-center w-64 space-y-1">
                    <p>Boyan Tanjung, {activePrintSurat.tanggalSurat}</p>
                    <p className="font-semibold uppercase text-xs">{settings.penandatangan}</p>
                    
                    <div className="h-20 flex items-center justify-center">
                      {/* Signature simulation */}
                      <div className="border-b border-dashed border-slate-400 w-32 h-6 text-slate-300 italic select-none">
                        Tanda Tangan Digital
                      </div>
                    </div>
                    
                    <p className="font-bold underline">{settings.namaKepalaPuskesmas}</p>
                    <p className="text-xs font-mono leading-none">NIP. {settings.nipKepala}</p>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
