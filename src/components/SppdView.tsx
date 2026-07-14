import React, { useState, useEffect, useRef } from "react";
import { 
  FileCheck, Plus, Search, Calendar, MapPin, Truck, Printer, Eye, 
  Trash2, X, Check, Landmark, Bookmark, FileSpreadsheet, AlertCircle 
} from "lucide-react";
import { SPPD, SuratTugas, Pegawai, Pengaturan, UserSession } from "../types";

interface SppdViewProps {
  session: UserSession;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  prefillSTNum?: string;
  prefillPegId?: string;
  onClearPrefill: () => void;
}

export default function SppdView({ session, showToast, prefillSTNum, prefillPegId, onClearPrefill }: SppdViewProps) {
  const [sppdList, setSppdList] = useState<SPPD[]>([]);
  const [suratList, setSuratList] = useState<SuratTugas[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [settings, setSettings] = useState<Pengaturan | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Create Form State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedSTNum, setSelectedSTNum] = useState<string>("");
  const [selectedPegId, setSelectedPegId] = useState<string>("");
  
  // Custom fields
  const [transportasi, setTransportasi] = useState<string>("Sepeda Motor Dinas");
  const [sumberDana, setSumberDana] = useState<string>("BOK");
  const [nomorSPD, setNomorSPD] = useState<string>("");
  const [instansiTujuan, setInstansiTujuan] = useState<string>("");
  const [pejabatTujuan, setPejabatTujuan] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");

  // Preview / Print states
  const [activePrintSppd, setActivePrintSppd] = useState<SPPD | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to navigation prefills from Surat Tugas
  useEffect(() => {
    if (prefillSTNum && prefillPegId && suratList.length > 0) {
      handleOpenPrefilledForm(prefillSTNum, prefillPegId);
    }
  }, [prefillSTNum, prefillPegId, suratList]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSppd, resST, resPeg, resSet] = await Promise.all([
        fetch("/api/sppd").then(r => r.json()),
        fetch("/api/surattugas").then(r => r.json()),
        fetch("/api/pegawai").then(r => r.json()),
        fetch("/api/settings").then(r => r.json())
      ]);

      setSppdList(resSppd);
      setSuratList(resST);
      setPegawaiList(resPeg);
      setSettings(resSet);
    } catch (err) {
      console.error("Error loading SPPD references:", err);
      showToast("Gagal memuat referensi data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrefilledForm = (stNum: string, pegId: string) => {
    setSelectedSTNum(stNum);
    setSelectedPegId(pegId);
    
    const st = suratList.find(s => s.nomorSurat === stNum);
    if (st) {
      setSumberDana(st.sumberDana || "BOK");
      setInstansiTujuan(st.tempat);
      setPejabatTujuan("Kepala Instansi");
      setKeterangan("Melaksanakan tugas dinas luar");
      setTransportasi("Sepeda Motor Dinas");
      
      const sequence = sppdList.length + 1;
      const currentYear = new Date().getFullYear();
      setNomorSPD(`SPD/${st.sumberDana || "BOK"}/${String(sequence).padStart(3, "0")}/${currentYear}`);
    }
    
    setIsCreateOpen(true);
    onClearPrefill(); // Clear from parent state so it doesn't trigger again
  };

  const openCreateModal = () => {
    setSelectedSTNum("");
    setSelectedPegId("");
    setTransportasi("Sepeda Motor Dinas");
    setSumberDana("BOK");
    setNomorSPD("");
    setInstansiTujuan("");
    setPejabatTujuan("");
    setKeterangan("");
    setIsCreateOpen(true);
  };

  // When Surat Tugas is selected in form
  const handleSTChange = (stNum: string) => {
    setSelectedSTNum(stNum);
    setSelectedPegId("");
    const st = suratList.find(s => s.nomorSurat === stNum);
    if (st) {
      setSumberDana(st.sumberDana || "BOK");
      setInstansiTujuan(st.tempat);
      setPejabatTujuan("Kepala Instansi Terkait");
      setKeterangan("Melaksanakan tugas pelayanan");
      
      const sequence = sppdList.length + 1;
      const currentYear = new Date().getFullYear();
      setNomorSPD(`SPD/${st.sumberDana || "BOK"}/${String(sequence).padStart(3, "0")}/${currentYear}`);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSTNum || !selectedPegId || !nomorSPD) {
      showToast("Mohon lengkapi seluruh kolom yang wajib diisi", "error");
      return;
    }

    const payload = {
      nomorSuratTugas: selectedSTNum,
      idPegawai: selectedPegId,
      transportasi,
      sumberDana,
      nomorSPD,
      instansiTujuan,
      pejabatTujuan,
      keterangan
    };

    fetch("/api/sppd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error || "Gagal membuat SPPD") });
        return res.json();
      })
      .then(() => {
        showToast("SPPD sukses diterbitkan!", "success");
        setIsCreateOpen(false);
        fetchData();
      })
      .catch(err => {
        showToast(err.message, "error");
      });
  };

  const handleDelete = (nomor: string) => {
    if (session.role !== "Administrator") {
      showToast("Hanya Administrator yang memiliki akses menghapus data", "error");
      return;
    }

    if (window.confirm(`Hapus berkas SPPD "${nomor}"? Tindakan ini tidak dapat dibatalkan.`)) {
      fetch(`/api/sppd/${encodeURIComponent(nomor)}`, {
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
          showToast("SPPD berhasil diarsipkan / dihapus", "success");
          fetchData();
        })
        .catch(err => {
          console.error("Delete failed:", err);
          showToast("Gagal menghapus SPPD", "error");
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
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}`;
  };

  // Search logic
  const filteredSppd = sppdList.filter(s => {
    return (
      s.nomorSPPD.toLowerCase().includes(search.toLowerCase()) ||
      s.nomorSPD.toLowerCase().includes(search.toLowerCase()) ||
      s.nomorSuratTugas.toLowerCase().includes(search.toLowerCase()) ||
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.tempatTujuan.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Find eligible employees for selected Surat Tugas in creation form
  const getEligibleEmployees = () => {
    if (!selectedSTNum) return [];
    const st = suratList.find(s => s.nomorSurat === selectedSTNum);
    if (!st || !st.petugas) return [];
    return st.petugas;
  };

  const canEdit = session.role === "Administrator" || session.role === "Operator";
  const isAdmin = session.role === "Administrator";

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Surat Perintah Perjalanan Dinas (SPPD)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Penerbitan surat perintah perjalanan dinas individu, pelacakan pembebanan anggaran BOK/APBD
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Terbitkan SPPD Baru</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Cari SPPD berdasarkan nomor SPPD, SPD, surat tugas, nama pegawai, atau tujuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* SPPD List Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 no-print">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredSppd.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 no-print">
          <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
          <p className="text-sm font-medium">Tidak ada berkas SPPD ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Gunakan kata kunci pencarian lain atau pilih Surat Tugas untuk memicu pembuatan SPPD.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">No. SPPD / SPD</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Surat Tugas Terkait</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nama Pegawai</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tujuan &amp; Tanggal</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Transport &amp; Anggaran</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredSppd.map((s) => (
                  <tr key={s.nomorSPPD} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 font-mono select-all bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {s.nomorSPPD}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          SPD: {s.nomorSPD}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-500 font-mono truncate max-w-[130px]" title={s.nomorSuratTugas}>
                        {s.nomorSuratTugas}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-300">{s.nama}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs space-y-0.5 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1 font-medium"><MapPin className="h-3 w-3 text-slate-400" /> {s.tempatTujuan}</div>
                        <div>{s.tanggalBerangkat} s/d {s.tanggalKembali}</div>
                        <div className="text-[10px] text-slate-400">{s.lamaHari} Hari Kerja</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300"><Truck className="h-3 w-3 text-slate-400" /> {s.transportasi}</div>
                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 text-[9px] font-bold">
                          DANA {s.sumberDana}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setActivePrintSppd(s);
                            setIsPreviewOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all"
                          title="Cetak &amp; Preview SPPD"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(s.nomorSPPD)}
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

      {/* CREATE SPPD DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-500/10">
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                <FileCheck className="h-5 w-5" />
                Terbitkan Dokumen SPPD Baru
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-white hover:opacity-80">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Surat Tugas Referensi *</label>
                  <select
                    required
                    value={selectedSTNum}
                    onChange={(e) => handleSTChange(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  >
                    <option value="">-- Pilih Surat Tugas --</option>
                    {suratList.map(st => (
                      <option key={st.nomorSurat} value={st.nomorSurat}>{st.nomorSurat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pilih Pegawai *</label>
                  <select
                    required
                    value={selectedPegId}
                    onChange={(e) => setSelectedPegId(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  >
                    <option value="">-- Pilih Staf Ditugaskan --</option>
                    {getEligibleEmployees().map(emp => (
                      <option key={emp.idPegawai} value={emp.idPegawai}>{emp.nama} ({emp.jabatan})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nomor SPD (Otomatis)</label>
                  <input
                    type="text"
                    required
                    value={nomorSPD}
                    onChange={(e) => setNomorSPD(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Transportasi yang Digunakan</label>
                  <input
                    type="text"
                    required
                    value={transportasi}
                    onChange={(e) => setTransportasi(e.target.value)}
                    placeholder="Contoh: Sepeda Motor Dinas / Mobil Ambulans"
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sumber Pembebanan Dana</label>
                  <input
                    type="text"
                    required
                    value={sumberDana}
                    onChange={(e) => setSumberDana(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pejabat yang Menemui / Tujuan</label>
                  <input
                    type="text"
                    required
                    value={pejabatTujuan}
                    onChange={(e) => setPejabatTujuan(e.target.value)}
                    placeholder="Contoh: Kepala Sekolah SD Negeri 01"
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Instansi / Tempat Tujuan Akhir</label>
                <input
                  type="text"
                  required
                  value={instansiTujuan}
                  onChange={(e) => setInstansiTujuan(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Keterangan Lain-Lain</label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Instruksi logistik khusus, akomodasi, dll."
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  Terbitkan SPPD
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PRINT DIALOG PREVIEW - GOVERNMENT FORMAT FOR SPPD */}
      {isPreviewOpen && activePrintSppd && settings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:p-0 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none max-h-[90vh] print:max-h-full flex flex-col">
            
            <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 shrink-0 no-print">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Pratinjau Cetak SPPD Resmi</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Lembaran SPPD</span>
                </button>

                <button 
                  onClick={() => setIsPreviewOpen(false)} 
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Print Area SPPD */}
            <div className="p-12 overflow-y-auto flex-1 bg-white dark:bg-white text-black dark:text-black print-container">
              
              <div ref={printAreaRef} className="max-w-[210mm] mx-auto text-[12px] leading-relaxed font-sans select-text">
                
                {/* Header Kop */}
                <div className="text-right border-b border-black pb-2 text-[10px] font-mono leading-none">
                  <p>Lembar Ke : 1 (Satu)</p>
                  <p>Kode No : SPD-ST-SPPD</p>
                  <p>Nomor : {activePrintSppd.nomorSPPD}</p>
                </div>

                <div className="text-center mt-4">
                  <h1 className="text-md font-bold uppercase tracking-wider">{settings.namaInstansi}</h1>
                  <h2 className="text-sm font-bold tracking-wider underline mt-1">SURAT PERINTAH PERJALANAN DINAS (SPPD)</h2>
                </div>

                {/* Grid Fields Table - Official 2-Column Standard */}
                <table className="w-full mt-6 border border-black border-collapse text-xs text-left">
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold w-10">1</td>
                      <td className="border border-black px-3 py-2 w-1/3">Pejabat Pembuat Komitmen</td>
                      <td className="border border-black px-3 py-2 select-all">{settings.penandatangan}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold">2</td>
                      <td className="border border-black px-3 py-2">Nama Pegawai yang diperintah</td>
                      <td className="border border-black px-3 py-2 font-bold">{activePrintSppd.nama}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold">3</td>
                      <td className="border border-black px-3 py-2">
                        a. Pangkat dan Golongan <br />
                        b. Jabatan / Instansi <br />
                        c. Tingkat Biaya Perjalanan Dinas
                      </td>
                      <td className="border border-black px-3 py-2">
                        a. {pegawaiList.find(p => p.id === activePrintSppd.idPegawai)?.pangkat || "-"}<br />
                        b. {pegawaiList.find(p => p.id === activePrintSppd.idPegawai)?.jabatan || "-"} / {settings.namaInstansi}<br />
                        c. Tingkat C (Dinas Standar)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold">4</td>
                      <td className="border border-black px-3 py-2">Maksud Perjalanan Dinas</td>
                      <td className="border border-black px-3 py-2 text-justify select-all">{activePrintSppd.maksudPerjalanan}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold">5</td>
                      <td className="border border-black px-3 py-2">Alat angkutan / transportasi</td>
                      <td className="border border-black px-3 py-2">{activePrintSppd.transportasi}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold">6</td>
                      <td className="border border-black px-3 py-2">
                        a. Tempat Berangkat <br />
                        b. Tempat Tujuan
                      </td>
                      <td className="border border-black px-3 py-2 font-semibold">
                        a. {settings.namaInstansi} Boyan Tanjung<br />
                        b. {activePrintSppd.tempatTujuan}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold">7</td>
                      <td className="border border-black px-3 py-2">
                        a. Lamanya perjalanan dinas <br />
                        b. Tanggal berangkat <br />
                        c. Tanggal harus kembali
                      </td>
                      <td className="border border-black px-3 py-2">
                        a. {activePrintSppd.lamaHari} Hari <br />
                        b. {activePrintSppd.tanggalBerangkat} <br />
                        c. {activePrintSppd.tanggalKembali}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold">8</td>
                      <td className="border border-black px-3 py-2">
                        Pengikut : Nama / Jabatan
                      </td>
                      <td className="border border-black px-3 py-2 text-slate-400 italic">
                        Tidak ada pengikut (Mandiri)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold">9</td>
                      <td className="border border-black px-3 py-2">
                        Pembebanan Anggaran <br />
                        a. Instansi <br />
                        b. Mata Anggaran / Kode Rekening
                      </td>
                      <td className="border border-black px-3 py-2">
                        <br />
                        a. Dinas Kesehatan Kapuas Hulu<br />
                        b. Dana Anggaran Operasional {activePrintSppd.sumberDana}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center font-bold">10</td>
                      <td className="border border-black px-3 py-2">Keterangan lain-lain</td>
                      <td className="border border-black px-3 py-2 text-slate-700 italic select-all">{activePrintSppd.keterangan || "-"}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Bottom Signature & Verification Info */}
                <div className="mt-8 grid grid-cols-2 gap-10">
                  
                  {/* QR and confirmation block */}
                  <div className="border border-slate-300 rounded-xl p-3 flex gap-3 bg-slate-50 text-slate-500 text-[8px] leading-tight print:bg-white select-none">
                    <img 
                      src={getQrCodeUrl(activePrintSppd.nomorSPPD)} 
                      alt="Verify SPPD QR" 
                      className="h-14 w-14 shrink-0 border border-slate-200 bg-white p-0.5" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5 font-mono">
                      <p className="font-bold text-[9px] text-indigo-700">VERIFIKASI DIGITAL SPPD</p>
                      <p>Pindai QR ini untuk memverifikasi kesahihan SPD &amp; rincian dinas di database server Puskesmas.</p>
                      <p className="text-[7px] text-slate-400 select-all font-bold">{activePrintSppd.nomorSPPD}</p>
                    </div>
                  </div>

                  {/* Sign Box */}
                  <div className="text-center space-y-1 w-64 justify-self-end text-xs">
                    <p>Dikeluarkan di : Boyan Tanjung</p>
                    <p>Pada tanggal : {activePrintSppd.tanggalBerangkat}</p>
                    <p className="font-bold uppercase select-none">{settings.penandatangan}</p>
                    
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-slate-300 text-[10px] italic border-b border-dashed border-slate-400 w-32 pb-0.5">
                        Tanda Tangan Elektronik
                      </span>
                    </div>

                    <p className="font-bold underline text-sm">{settings.namaKepalaPuskesmas}</p>
                    <p className="font-mono text-[10px] leading-none">NIP. {settings.nipKepala}</p>
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
