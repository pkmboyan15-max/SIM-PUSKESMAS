import { useState, useEffect } from "react";
import { 
  Users, FileText, ClipboardCheck, CalendarRange, 
  History, TrendingUp, Compass, Award, Activity 
} from "lucide-react";
import { AuditLog, UserSession } from "../types";

interface DashboardStats {
  totalPegawai: number;
  totalSuratTugasTahunIni: number;
  totalSPPD: number;
  suratTugasBulanIni: number;
  suratPerBulan: { name: string; SuratTugas: number; SPPD: number }[];
  pegawaiSeringBertugas: { nama: string; count: number }[];
  transportasiTerbanyak: { name: string; count: number }[];
  kegiatanSumberDana: { name: string; value: number }[];
  recentLogs: AuditLog[];
}

interface DashboardViewProps {
  session: UserSession;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function DashboardView({ session, showToast }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading dashboard statistics:", err);
        showToast("Gagal memuat statistik dashboard", "error");
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate highest count for scaling charts
  const maxMonthlyVal = Math.max(...stats.suratPerBulan.map(d => Math.max(d.SuratTugas, d.SPPD)), 4);
  const maxTransportVal = Math.max(...stats.transportasiTerbanyak.map(t => t.count), 2);

  return (
    <div className="space-y-6">
      
      {/* Visual Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-500/10">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-sans">
            Halo, {session.name}! 👋
          </h2>
          <p className="text-slate-300 mt-1 text-xs md:text-sm font-light">
            Selamat datang di Sistem Informasi Administrasi Surat Tugas &amp; SPPD Puskesmas Boyan Tanjung.
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur px-3.5 py-1.5 rounded-2xl border border-white/10 shrink-0 text-xs font-mono">
          <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span>Server Status: LIVE</span>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-all flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-xl shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Pegawai Medis</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.totalPegawai}</p>
            <p className="text-[10px] text-indigo-500 font-medium mt-1">Status Keaktifan: 100% Aktif</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-all flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Surat Tugas ({new Date().getFullYear()})</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.totalSuratTugasTahunIni}</p>
            <p className="text-[10px] text-blue-500 font-medium mt-1">Diarsipkan di Google Sheets</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-all flex items-center gap-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-teal-600 rounded-xl shrink-0">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total SPPD Terbit</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.totalSPPD}</p>
            <p className="text-[10px] text-teal-500 font-medium mt-1">Terintegrasi dengan SPD Anggaran</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-all flex items-center gap-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 rounded-xl shrink-0">
            <CalendarRange className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Surat Tugas Bulan Ini</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.suratTugasBulanIni}</p>
            <p className="text-[10px] text-violet-500 font-medium mt-1">Fase Operasional Terkini</p>
          </div>
        </div>

      </div>

      {/* Interactive Charts Panel (Fully responsive SVG charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Double Bar Chart - Surat Tugas vs SPPD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Frekuensi Perjalanan Dinas Bulanan</h3>
              <p className="text-[11px] text-slate-400">Statistik kuantitas Surat Tugas vs SPPD tahun ini</p>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-indigo-500"></span> ST</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-blue-500"></span> SPPD</span>
            </div>
          </div>

          {/* SVG Double Bar Chart */}
          <div className="h-64 flex flex-col justify-between pt-4">
            <div className="flex-1 flex items-end gap-3 md:gap-5 w-full relative">
              
              {/* Chart background horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800/80 w-full h-0"></div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800/80 w-full h-0"></div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800/80 w-full h-0"></div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800/80 w-full h-0"></div>
              </div>

              {stats.suratPerBulan.map((item, idx) => {
                // Scale calculations (minimum 4% height so bars are always visible slightly)
                const heightST = `${Math.max((item.SuratTugas / maxMonthlyVal) * 100, 4)}%`;
                const heightSPPD = `${Math.max((item.SPPD / maxMonthlyVal) * 100, 4)}%`;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group z-10">
                    
                    {/* Hover tooltip */}
                    <div className="absolute bottom-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col font-mono">
                      <span>ST: {item.SuratTugas}</span>
                      <span>SPPD: {item.SPPD}</span>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-4/5 pb-1">
                      {/* ST Bar */}
                      <div 
                        style={{ height: heightST }}
                        className="w-2 md:w-3.5 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                      />
                      {/* SPPD Bar */}
                      <div 
                        style={{ height: heightSPPD }}
                        className="w-2 md:w-3.5 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                      />
                    </div>
                    
                    <span className="text-[10px] font-medium text-slate-400 mt-2 font-sans shrink-0">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transportation Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Jenis Transportasi Terbanyak</h3>
            <p className="text-[11px] text-slate-400">Distribusi pengunaan moda angkutan dinas luar</p>
          </div>

          <div className="space-y-4 pt-2">
            {stats.transportasiTerbanyak.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">Belum ada data perjalanan SPPD</p>
            ) : (
              stats.transportasiTerbanyak.map((item, idx) => {
                const widthPercent = `${(item.count / maxTransportVal) * 100}%`;
                
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="font-bold text-slate-500 font-mono">{item.count} Perjalanan</span>
                    </div>
                    
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        style={{ width: widthPercent }}
                        className={`h-full rounded-full bg-gradient-to-r ${
                          idx === 0 ? "from-indigo-600 to-indigo-400" :
                          idx === 1 ? "from-blue-600 to-blue-400" : "from-slate-500 to-slate-400"
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Lower Section: Leaderboard / Frequent Employees & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Most frequent employees (Leaderboard) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-1 space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-indigo-600" />
              Pegawai Paling Sering Bertugas
            </h3>
            <p className="text-[11px] text-slate-400">Staf medis dengan mobilitas dinas luar tertinggi</p>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {stats.pegawaiSeringBertugas.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">Belum ada penugasan terdaftar</p>
            ) : (
              stats.pegawaiSeringBertugas.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-200" :
                      idx === 1 ? "bg-slate-100 text-slate-800 border border-slate-200" :
                      idx === 2 ? "bg-orange-100 text-orange-800 border border-orange-200" : "bg-slate-50 text-slate-400"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{item.nama}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800 font-mono shrink-0">
                    {item.count} Kali
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Audit Log Stream */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <History className="h-4.5 w-4.5 text-slate-500" />
              Aktivitas Terakhir Sistem (Audit Log)
            </h3>
            <p className="text-[11px] text-slate-400">Log pencatatan audit integritas database real-time</p>
          </div>

          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {stats.recentLogs.map((log, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 text-xs font-sans pb-3 border-b border-slate-50 last:border-b-0 dark:border-slate-800/40">
                <div className="space-y-1">
                  <p className="text-slate-700 dark:text-slate-300 select-all leading-normal">
                    {log.aktivitas}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">@{log.user}</span>
                    <span>•</span>
                    <span className="font-mono">{log.ip}</span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                  {new Date(log.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
