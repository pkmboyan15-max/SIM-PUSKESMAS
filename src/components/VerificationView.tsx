import React, { useState, useEffect } from "react";
import { Search, CheckCircle, AlertOctagon, HelpCircle, ShieldCheck, QrCode } from "lucide-react";

interface VerificationViewProps {
  initialQuery?: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

interface VerificationResult {
  valid: boolean;
  tipe?: string;
  nomor?: string;
  nomorSuratTugas?: string;
  tanggal?: string;
  maksud?: string;
  tempat?: string;
  lamaHari?: number;
  tanggalBerangkat?: string;
  tanggalKembali?: string;
  status?: string;
  petugas?: string[];
  nama?: string;
  transportasi?: string;
  sumberDana?: string;
  nomorSPD?: string;
  instansi?: string;
  alamat?: string;
  penandatangan?: string;
  error?: string;
}

export default function VerificationView({ initialQuery, showToast }: VerificationViewProps) {
  const [query, setQuery] = useState<string>(initialQuery || "");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    if (initialQuery) {
      handleVerify(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      showToast("Mohon masukkan nomor dokumen terlebih dahulu", "error");
      return;
    }
    handleVerify(query);
  };

  const handleVerify = (documentNo: string) => {
    setLoading(true);
    setHasSearched(true);
    fetch(`/api/verify?no=${encodeURIComponent(documentNo.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        setResult(data);
        setLoading(false);
        if (data.valid) {
          showToast("Dokumen Terverifikasi VALID!", "success");
        } else {
          showToast("Dokumen TIDAK VALID / Tidak Terdaftar", "error");
        }
      })
      .catch((err) => {
        console.error("Verification failed:", err);
        showToast("Error saat menghubungi server verifikasi", "error");
        setLoading(false);
      });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 font-sans">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 mb-2">
          <ShieldCheck className="h-10 w-10 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Sistem Verifikasi Dokumen Digital
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Validasi keaslian Surat Tugas &amp; SPPD yang diterbitkan secara resmi oleh Puskesmas Boyan Tanjung.
        </p>
      </div>

      {/* Manual search bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Masukkan Nomor Surat Tugas / SPPD / Nomor SPD
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 h-5 w-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: 440/001/ST/PT-BT/VII/2026 atau 001/SPPD/..."
                className="w-full text-sm font-mono pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold shadow-sm shrink-0 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                <ShieldCheck className="h-4.5 w-4.5" />
              )}
              <span>Verifikasi</span>
            </button>
          </div>
        </form>
      </div>

      {/* Verification Output */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : hasSearched && result ? (
        result.valid ? (
          // VALID OUTPUT
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border-2 border-green-500/30 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
            
            <div className="flex items-center gap-3">
              <CheckCircle className="h-10 w-10 text-green-500 shrink-0" />
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 rounded-full mb-1 uppercase tracking-wider">
                  DOKUMEN VALID &amp; TERDAFTAR
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {result.nomor}
                </h3>
              </div>
            </div>

            <div className="border-t border-dashed border-green-500/20 pt-4 space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">Jenis Dokumen</span>
                <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">{result.tipe}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">Nama Instansi</span>
                <span className="col-span-2 text-slate-700 dark:text-slate-300">
                  {result.instansi} <br />
                  <span className="text-xs text-slate-400 font-sans">{result.alamat}</span>
                </span>
              </div>

              {result.petugas && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Staf Ditugaskan</span>
                  <div className="col-span-2 space-y-1">
                    {result.petugas.map((p, idx) => (
                      <div key={idx} className="font-semibold text-slate-800 dark:text-slate-200">{p}</div>
                    ))}
                  </div>
                </div>
              )}

              {result.nama && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Nama Pegawai</span>
                  <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">{result.nama}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">Maksud / Perihal</span>
                <span className="col-span-2 text-slate-700 dark:text-slate-300 text-justify italic font-sans">
                  "{result.maksud}"
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">Tujuan Perjalanan</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-medium">{result.tempat}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">Tanggal Dinas</span>
                <span className="col-span-2 text-slate-700 dark:text-slate-300">
                  {result.tanggalBerangkat} s/d {result.tanggalKembali} ({result.lamaHari} Hari Kerja)
                </span>
              </div>

              {result.transportasi && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Transportasi</span>
                  <span className="col-span-2 text-slate-700 dark:text-slate-300">{result.transportasi}</span>
                </div>
              )}

              {result.nomorSPD && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Nomor SPD</span>
                  <span className="col-span-2 text-slate-700 dark:text-slate-300 font-mono text-xs">{result.nomorSPD}</span>
                </div>
              )}

              {result.sumberDana && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Pembebanan Anggaran</span>
                  <span className="col-span-2 text-slate-700 dark:text-slate-300">DANA {result.sumberDana}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">Penandatangan</span>
                <span className="col-span-2 text-slate-700 dark:text-slate-300 font-bold">{result.penandatangan}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">Status Dokumen</span>
                <span className="col-span-2 text-green-600 font-bold">{result.status || "Aktif"}</span>
              </div>
            </div>

            <div className="text-[10px] text-center text-slate-400 font-mono pt-4 border-t border-green-500/10">
              Dokumen ini diverifikasi secara digital melalui server utama Puskesmas Boyan Tanjung pada {new Date().toLocaleDateString("id-ID")}
            </div>

          </div>
        ) : (
          // INVALID OUTPUT
          <div className="bg-red-50 dark:bg-red-950/10 border-2 border-red-500/20 rounded-2xl p-6 text-center space-y-4 animate-in fade-in-50">
            <AlertOctagon className="h-12 w-12 text-red-500 mx-auto" />
            
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 rounded-full uppercase tracking-wider">
                DOKUMEN TIDAK VALID
              </span>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Verifikasi Gagal</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                Nomor dokumen <strong className="font-mono text-slate-800 dark:text-slate-300 select-all font-bold">"{query}"</strong> tidak terdaftar di database server Puskesmas Boyan Tanjung. Pastikan pengetikan format nomor lengkap benar.
              </p>
            </div>
          </div>
        )
      ) : (
        // Tutorial block before search
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex gap-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans select-none">
          <QrCode className="h-12 w-12 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Bagaimana cara verifikasi?</p>
            <p>1. Pindai/Scan QR Code yang tercetak di sudut kiri bawah Surat Tugas atau SPPD resmi.</p>
            <p>2. Kamera ponsel Anda akan mengarahkan langsung ke halaman tautan verifikasi ini secara otomatis.</p>
            <p>3. Atau, ketikkan secara manual nomor surat lengkap di kotak masukan di atas lalu klik tombol Verifikasi.</p>
          </div>
        </div>
      )}
    </div>
  );
}
