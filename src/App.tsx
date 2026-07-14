import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, CalendarRange, FileText, FileCheck, 
  Settings, Code2, ShieldAlert, LogOut, Moon, Sun, Menu, X, Clock, ShieldCheck,
  Sparkles
} from "lucide-react";

// Import custom views
import DashboardView from "./components/DashboardView";
import PegawaiView from "./components/PegawaiView";
import KegiatanView from "./components/KegiatanView";
import SuratTugasView from "./components/SuratTugasView";
import SppdView from "./components/SppdView";
import SettingsView from "./components/SettingsView";
import AppsScriptView from "./components/AppsScriptView";
import VerificationView from "./components/VerificationView";
import GeminiChatView from "./components/GeminiChatView";

// Import Types
import { UserSession } from "./types";

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Navigation Prefill State (For Surat Tugas -> SPPD transition)
  const [prefillSTNum, setPrefillSTNum] = useState<string>("");
  const [prefillPegId, setPrefillPegId] = useState<string>("");

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Public Verification check (Deep linking from QR Code scanner)
  const [isPublicVerify, setIsPublicVerify] = useState<boolean>(false);
  const [verifyQuery, setVerifyQuery] = useState<string>("");

  // Login Form States
  const [loginUsername, setLoginUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check if deep-linked to verify a document (e.g., scanned QR Code)
    const urlParams = new URLSearchParams(window.location.search);
    const verifyNo = urlParams.get("no");
    if (verifyNo) {
      setIsPublicVerify(true);
      setVerifyQuery(verifyNo);
      setActiveTab("verification");
    }

    // Load active session from localStorage if present
    const savedSession = localStorage.getItem("session");
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem("session");
      }
    }

    // Set Theme
    applyTheme(darkMode);

    // Dynamic Clock ticking
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleToggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem("darkMode", String(nextDark));
    applyTheme(nextDark);
    showToast("Tema visual diperbarui", "info");
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      showToast("Username dan password wajib diisi", "error");
      return;
    }

    setLoginLoading(true);
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: loginUsername, password: loginPassword }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.error || "Login gagal") });
        }
        return res.json();
      })
      .then((data) => {
        setSession(data);
        localStorage.setItem("session", JSON.stringify(data));
        showToast(`Selamat datang, ${data.name}!`, "success");
        setLoginLoading(false);
      })
      .catch((err) => {
        showToast(err.message, "error");
        setLoginLoading(false);
      });
  };

  const handleLogout = () => {
    if (!session) return;
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` }
    }).finally(() => {
      setSession(null);
      localStorage.removeItem("session");
      showToast("Anda telah keluar dari sesi sistem", "info");
    });
  };

  // Bridge navigation from Surat Tugas -> SPPD view
  const handleNavigateToSPPD = (stNomor: string, idPegawai: string) => {
    setPrefillSTNum(stNomor);
    setPrefillPegId(idPegawai);
    setActiveTab("sppd");
    showToast("Data Surat Tugas berhasil dialihkan ke SPPD", "info");
  };

  // Render core views dynamically based on sidebar tab
  const renderViewContent = () => {
    if (activeTab === "verification") {
      return <VerificationView initialQuery={verifyQuery} showToast={showToast} />;
    }

    if (!session) return null;

    switch (activeTab) {
      case "dashboard":
        return <DashboardView session={session} showToast={showToast} />;
      case "pegawai":
        return <PegawaiView session={session} showToast={showToast} />;
      case "kegiatan":
        return <KegiatanView session={session} showToast={showToast} />;
      case "surattugas":
        return (
          <SuratTugasView 
            session={session} 
            showToast={showToast} 
            onNavigateToSPPD={handleNavigateToSPPD} 
          />
        );
      case "sppd":
        return (
          <SppdView 
            session={session} 
            showToast={showToast}
            prefillSTNum={prefillSTNum}
            prefillPegId={prefillPegId}
            onClearPrefill={() => {
              setPrefillSTNum("");
              setPrefillPegId("");
            }}
          />
        );
      case "gemini-chat":
        return <GeminiChatView session={session} showToast={showToast} />;
      case "settings":
        return (
          <SettingsView 
            session={session} 
            showToast={showToast} 
            onThemeChange={(color) => showToast(`Tema instansi diatur ke ${color}`, "success")} 
          />
        );
      case "apps-script":
        return <AppsScriptView />;
      default:
        return <DashboardView session={session} showToast={showToast} />;
    }
  };

  // Helper title mapping for Breadcrumb
  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Dashboard Statistik";
      case "pegawai": return "Database Pegawai";
      case "kegiatan": return "Agenda Kegiatan";
      case "surattugas": return "Administrasi Surat Tugas";
      case "sppd": return "Pertanggungjawaban SPPD";
      case "gemini-chat": return "Asisten Pintar Gemini AI";
      case "settings": return "Konfigurasi Pengaturan";
      case "apps-script": return "Apps Script Code Center";
      case "verification": return "E-Verification Portal";
      default: return "SIM Administrasi";
    }
  };

  // Render Public Scanner Verification view if deep-linked or chosen publicly
  if (isPublicVerify) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
        {/* Public Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-8.5 w-8.5 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              P
            </span>
            <div>
              <h1 className="text-sm font-bold leading-none text-slate-800 dark:text-slate-100">Puskesmas Boyan Tanjung</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Sistem Verifikasi QR Code Dokumen</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsPublicVerify(false);
              setVerifyQuery("");
              setActiveTab("dashboard");
            }}
            className="text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
          >
            Masuk Portal SIM
          </button>
        </header>

        {/* Main Public verification container */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
          <VerificationView initialQuery={verifyQuery} showToast={showToast} />
        </main>

        {/* Public Footer */}
        <footer className="py-6 border-t border-slate-100 dark:border-slate-900 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Dinas Kesehatan Kabupaten Kapuas Hulu - Puskesmas Boyan Tanjung
        </footer>

        {/* Global Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-white shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 z-50 ${
            toast.type === "success" ? "bg-emerald-600" :
            toast.type === "error" ? "bg-red-600" : "bg-blue-600"
          }`}>
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  // RENDER LOGIN SCREEN (IF NO ACTIVE SESSION)
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/40 rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Login Kop Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 text-center space-y-2 border-b border-indigo-500/10">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold">
                🩺
              </div>
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider">SIM ST &amp; SPPD</h2>
                <h3 className="text-xs text-slate-300 font-sans uppercase tracking-wider">Puskesmas Boyan Tanjung</h3>
              </div>
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Akun (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="admin / operator / viewer"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kata Sandi (Password)</label>
                <input
                  type="password"
                  required
                  placeholder="Password akun Anda..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                ) : (
                  <span>Masuk Aplikasi</span>
                )}
              </button>

              {/* Login Presets Quick Assist for User */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">Bantuan Login Instan (Sesi Demo)</p>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center font-sans">
                  
                  <button 
                    type="button"
                    onClick={() => { setLoginUsername("admin"); setLoginPassword("admin123"); }}
                    className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-indigo-500 dark:text-slate-400 text-slate-600 font-medium transition-all"
                  >
                    Admin <span className="block text-[8px] opacity-70">admin123</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setLoginUsername("operator"); setLoginPassword("operator123"); }}
                    className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-indigo-500 dark:text-slate-400 text-slate-600 font-medium transition-all"
                  >
                    Operator <span className="block text-[8px] opacity-70">operator123</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setLoginUsername("viewer"); setLoginPassword("viewer123"); }}
                    className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-indigo-500 dark:text-slate-400 text-slate-600 font-medium transition-all"
                  >
                    Viewer <span className="block text-[8px] opacity-70">viewer123</span>
                  </button>

                </div>
              </div>

              {/* Public verification entrance */}
              <button
                type="button"
                onClick={() => setIsPublicVerify(true)}
                className="w-full text-center text-xs text-slate-400 hover:text-indigo-500 hover:underline transition-colors mt-2"
              >
                Buka Portal Verifikasi Dokumen Publik
              </button>

            </form>
          </div>
        </div>

        <footer className="py-4 text-center text-[10px] text-slate-400 font-sans">
          © {new Date().getFullYear()} Puskesmas Boyan Tanjung • Dinas Kesehatan Kabupaten Kapuas Hulu
        </footer>

        {/* Global Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-white shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 z-50 ${
            toast.type === "success" ? "bg-emerald-600" :
            toast.type === "error" ? "bg-red-600" : "bg-blue-600"
          }`}>
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  // RENDER INTERNAL AUTHENTICATED WORKSPACE
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex font-sans select-none print:bg-white print:text-black">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-white border-r border-slate-850 z-40 w-64 transform lg:transform-none lg:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 shadow-xl print:hidden ${
        sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="space-y-6">
          
          {/* Sidebar Top Header Branding */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-md">BT</div>
              <div className="leading-tight">
                <h1 className="font-bold text-sm uppercase tracking-wider text-white">Puskesmas</h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase leading-none">Boyan Tanjung</p>
              </div>
            </div>

            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-slate-800 rounded-xl text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Active User Card Profile */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm uppercase shrink-0">
              {session.username.substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-white truncate">{session.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="inline-block px-2 py-0.5 bg-indigo-900/30 text-indigo-300 text-[8px] font-bold rounded-full uppercase truncate">
                  {session.role}
                </span>
              </div>
            </div>
          </div>

          {/* Nav menu links */}
          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "pegawai", label: "Pegawai Medis", icon: Users },
              { id: "kegiatan", label: "Agenda Kegiatan", icon: CalendarRange },
              { id: "surattugas", label: "Surat Tugas", icon: FileText },
              { id: "sppd", label: "Pertanggungjawaban SPPD", icon: FileCheck },
              { id: "gemini-chat", label: "Asisten AI Gemini", icon: Sparkles },
              { id: "settings", label: "Pengaturan Profil", icon: Settings },
              { id: "apps-script", label: "Apps Script Code", icon: Code2 },
              { id: "verification", label: "Portal Verifikasi", icon: ShieldCheck }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all duration-200 ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-md" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-2 border-t border-slate-800/80 pt-4">
          
          <button
            onClick={handleToggleTheme}
            className="w-full px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl flex items-center gap-2.5 transition-all"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            <span>Mode {darkMode ? "Terang" : "Gelap"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/20 rounded-xl flex items-center gap-2.5 transition-all"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Keluar Sesi</span>
          </button>

        </div>
      </aside>

      {/* Sidebar background overlay on mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden print:hidden"
        />
      )}

      {/* 2. MAIN APPLICATION WORKSPACE CONTAINER */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top bar Navbar */}
        <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between z-20 print:hidden">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="hover:text-slate-600">SIM Puskesmas</span>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-100">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Clock tracker on top bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-950 rounded-xl text-slate-500 dark:text-slate-400 font-mono text-[10px]">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{currentTime.toLocaleTimeString("id-ID")} WIB</span>
            </div>
          </div>
        </header>

        {/* Dynamic view content window */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          {renderViewContent()}
        </main>

        {/* Workspace Footer */}
        <footer className="py-4 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 print:hidden">
          © {new Date().getFullYear()} Puskesmas Boyan Tanjung - Dinas Kesehatan Kabupaten Kapuas Hulu. All database transactions secured.
        </footer>

      </div>

      {/* Global Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-white shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 z-50 ${
          toast.type === "success" ? "bg-indigo-600" :
          toast.type === "error" ? "bg-red-600" : "bg-blue-600"
        }`}>
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
