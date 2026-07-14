import React, { useState, useEffect } from "react";
import { Save, ShieldAlert, Database, Check, AlertTriangle } from "lucide-react";
import { Pengaturan, UserSession } from "../types";

interface SettingsViewProps {
  session: UserSession;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onThemeChange: (theme: "emerald" | "blue" | "teal" | "slate") => void;
}

export default function SettingsView({ session, showToast, onThemeChange }: SettingsViewProps) {
  const [settings, setSettings] = useState<Pengaturan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [backupLoading, setBackupLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = () => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching settings:", err);
        showToast("Gagal memuat pengaturan", "error");
        setLoading(false);
      });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (session.role !== "Administrator") {
      showToast("Hanya Administrator yang dapat mengubah pengaturan", "error");
      return;
    }
    if (!settings) return;

    setSaving(true);
    fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(settings),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Update failed");
        return res.json();
      })
      .then((data) => {
        setSettings(data);
        onThemeChange(data.warnaTema);
        showToast("Pengaturan berhasil disimpan!", "success");
        setSaving(false);
      })
      .catch((err) => {
        console.error("Error saving settings:", err);
        showToast("Gagal menyimpan pengaturan", "error");
        setSaving(false);
      });
  };

  const triggerBackup = () => {
    setBackupLoading(true);
    fetch("/api/backup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast(`Backup berhasil! Disimpan sebagai: ${data.file}`, "success");
        } else {
          showToast("Gagal melakukan backup", "error");
        }
        setBackupLoading(false);
      })
      .catch((err) => {
        console.error("Backup trigger failed:", err);
        showToast("Error saat melakukan backup database", "error");
        setBackupLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isAdmin = session.role === "Administrator";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-indigo-500/10">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Pengaturan Sistem &amp; Instansi
        </h2>
        <p className="text-indigo-100 mt-2 text-sm max-w-2xl leading-relaxed">
          Atur data profil Puskesmas Boyan Tanjung, nomor urutan awal surat tugas, format kop surat resmi, serta manajemen backup data instansi.
        </p>
      </div>

      {!isAdmin && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-slate-700 dark:text-slate-300 flex gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Mode Peninjau (Read-Only):</span> Anda masuk sebagai <strong className="text-indigo-600 dark:text-indigo-400">{session.role}</strong>. Hanya akun Administrator yang dapat memperbarui pengaturan instansi atau melakukan backup manual.
          </div>
        </div>
      )}

      {settings && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Profil Instansi Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                Profil &amp; Kontak Instansi
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nama Instansi</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    required
                    value={settings.namaInstansi}
                    onChange={(e) => setSettings({ ...settings, namaInstansi: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Alamat Instansi</label>
                  <textarea
                    rows={3}
                    disabled={!isAdmin}
                    required
                    value={settings.alamat}
                    onChange={(e) => setSettings({ ...settings, alamat: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Telepon</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={settings.telepon}
                      onChange={(e) => setSettings({ ...settings, telepon: e.target.value })}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      disabled={!isAdmin}
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Website</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Pejabat Penandatangan & Format Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                Pejabat &amp; Aturan Surat
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nama Kepala Puskesmas</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    required
                    value={settings.namaKepalaPuskesmas}
                    onChange={(e) => setSettings({ ...settings, namaKepalaPuskesmas: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">NIP Kepala Puskesmas</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    required
                    value={settings.nipKepala}
                    onChange={(e) => setSettings({ ...settings, nipKepala: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Jabatan Penandatangan</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    required
                    value={settings.penandatangan}
                    onChange={(e) => setSettings({ ...settings, penandatangan: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">No. Awal ST</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      required
                      value={settings.nomorAwalSurat}
                      onChange={(e) => setSettings({ ...settings, nomorAwalSurat: e.target.value })}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Format Nomor Surat</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      required
                      value={settings.formatNomorSurat}
                      onChange={(e) => setSettings({ ...settings, formatNomorSurat: e.target.value })}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Links & Branding Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                Logo Kop Surat &amp; Tema UI
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Logo Kabupaten (Kapuas Hulu)</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    required
                    value={settings.logoKabupaten}
                    onChange={(e) => setSettings({ ...settings, logoKabupaten: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                  />
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-slate-400 text-[10px]">Preview:</span>
                    {settings.logoKabupaten && (
                      <img src={settings.logoKabupaten} alt="Kabupaten" className="h-6 object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Logo Puskesmas</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    required
                    value={settings.logoPuskesmas}
                    onChange={(e) => setSettings({ ...settings, logoPuskesmas: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:text-slate-200"
                  />
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-slate-400 text-[10px]">Preview:</span>
                    {settings.logoPuskesmas && (
                      <img src={settings.logoPuskesmas} alt="Puskesmas" className="h-6 object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Warna Tema Aplikasi</label>
                  <div className="flex gap-4 mt-1">
                    {(["emerald", "blue", "teal", "slate"] as const).map((color) => (
                      <label key={color} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          disabled={!isAdmin}
                          name="warnaTema"
                          value={color}
                          checked={settings.warnaTema === color}
                          onChange={() => setSettings({ ...settings, warnaTema: color })}
                          className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="capitalize text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <span className={`inline-block w-3 h-3 rounded-full ${
                            color === "emerald" ? "bg-emerald-500" :
                            color === "blue" ? "bg-blue-500" :
                            color === "teal" ? "bg-teal-500" : "bg-slate-500"
                          }`} />
                          {color}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Database & Backup Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
                <Database className="h-4.5 w-4.5 text-slate-500" />
                Pemeliharaan Database
              </h3>
              
              <div className="space-y-4">
                <div className="bg-indigo-50 dark:bg-slate-950/40 p-4 rounded-xl border border-indigo-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-400 mb-1">Backup Berjadwal Mingguan</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                    Sistem ini terintegrasi dengan penjadwalan trigger otomatis mingguan di Google Apps Script yang menduplikasi 
                    data sheet ke folder Backup di Google Drive Anda setiap hari Minggu pukul 23:59 WIB.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Backup Server Instan</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Trigger pencadangan file database internal ke server server lokal instan sebagai cadangan redundansi berkas.
                  </p>
                  
                  <button
                    type="button"
                    onClick={triggerBackup}
                    disabled={backupLoading || !isAdmin}
                    className="w-full mt-2 inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                  >
                    {backupLoading ? (
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></span>
                    ) : (
                      <Database className="h-3.5 w-3.5" />
                    )}
                    <span>Trigger Backup Database</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {isAdmin && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Simpan Seluruh Pengaturan</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
