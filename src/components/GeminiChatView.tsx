import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Trash2, Bot, User, Copy, Check, Info, HelpCircle } from "lucide-react";
import { UserSession } from "../types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model: string;
}

interface ChatbotRole {
  id: string;
  name: string;
  description: string;
  icon: string;
  model: string;
  systemInstruction: string;
  color: string;
  presets: string[];
}

const BOT_ROLES: ChatbotRole[] = [
  {
    id: "admin-helper",
    name: "Asisten Administrasi & Regulasi",
    description: "Membantu membuat maksud perjalanan dinas, merevisi draf surat tugas, dan menjawab regulasi dasar SPPD.",
    icon: "📄",
    model: "gemini-3.5-flash",
    color: "from-indigo-500 to-purple-600 border-indigo-200 dark:border-indigo-900/40",
    systemInstruction: `Anda adalah "Asisten Administrasi & Regulasi Puskesmas Boyan Tanjung", asisten AI yang sopan, profesional, dan sangat memahami seluk beluk administrasi dinas kesehatan, khususnya di wilayah Kapuas Hulu.
Tugas utama Anda:
1. Membantu staf menyusun "Maksud Perjalanan" yang logis, formal, dan sesuai regulasi BOK/APBD.
2. Membantu memvalidasi "Dasar Surat" berdasarkan petunjuk operasional atau aturan dinas.
3. Menjelaskan tata cara pertanggungjawaban SPPD (misal: kwitansi, rincian biaya, transportasi).
4. Selalu gunakan bahasa Indonesia yang formal, santun, taktis, dan mudah dipahami oleh pegawai negeri/tenaga medis.`,
    presets: [
      "Bantu buat draf 'Maksud Perjalanan' untuk kegiatan imunisasi BIAS di daerah terpencil.",
      "Apa saja berkas yang harus dilampirkan dalam pertanggungjawaban SPPD BOK?",
      "Bagaimana aturan pengisian lama hari perjalanan dinas jika berangkat pagi pulang sore?"
    ]
  },
  {
    id: "budget-analyst",
    name: "Pakar Analisis Anggaran (Pro)",
    description: "Melakukan penalaran kompleks tentang alokasi anggaran BOK/APBD, optimasi jadwal petugas, dan kalkulasi biaya dinas.",
    icon: "📊",
    model: "gemini-3.1-pro-preview",
    color: "from-amber-500 to-rose-600 border-amber-200 dark:border-amber-900/40",
    systemInstruction: `Anda adalah "Pakar Analisis Anggaran & Perjalanan Dinas Puskesmas Boyan Tanjung". Anda memiliki kemampuan analisis matematis dan perencanaan logistik yang sangat tinggi.
Tugas utama Anda:
1. Menganalisis efisiensi alokasi biaya perjalanan dinas (uang harian, transport, penginapan) sesuai pagu BOK Puskesmas.
2. Membantu menghitung estimasi pengeluaran perjalanan dinas kolektif untuk tim medis (misalnya tim vaksinasi keliling 5 desa).
3. Memberikan solusi penjadwalan dan rute kunjungan puskesmas keliling agar menghemat bahan bakar dan waktu petugas.
4. Selalu berikan rincian matematis atau poin analisis terstruktur saat menjawab pertanyaan anggaran.`,
    presets: [
      "Hitung estimasi anggaran transport & uang harian untuk tim imunisasi berisi 4 orang selama 3 hari ke Desa Mujan.",
      "Bagaimana mengoptimalkan jadwal Posyandu di 3 desa bertetangga agar bisa digabung dalam 1 surat tugas?",
      "Berikan rekomendasi sumber dana (BOK vs APBD) untuk kegiatan fogging mandiri kecamatan."
    ]
  },
  {
    id: "text-drafter",
    name: "Penyusun Naskah Resmi (Fast)",
    description: "Fokus pada kecepatan respon tinggi untuk koreksi ejaan, penyusunan kop resmi, dan tata bahasa administrasi baku.",
    icon: "⚡",
    model: "gemini-3.1-flash-lite",
    color: "from-emerald-500 to-teal-600 border-emerald-200 dark:border-emerald-900/40",
    systemInstruction: `Anda adalah "Penyusun Naskah Dinas Resmi Puskesmas Boyan Tanjung". Anda sangat ahli dalam tata bahasa Indonesia baku (PUEBI/KBBI) dan standar korespondensi pemerintah.
Tugas utama Anda:
1. Memeriksa kesalahan ketik (typo), kalimat tidak baku, atau format surat yang kurang formal pada draf Surat Tugas.
2. Mengubah kalimat draf mentah menjadi kalimat birokrasi resmi yang sopan dan lugas.
3. Membuat draf kop surat, salam pembuka, dasar hukum, dan bagian penandatangan secara cepat dan presisi.
4. Jawab dengan sangat cepat, to-the-point, dan berikan opsi perbaikan teks secara langsung yang siap disalin oleh staf.`,
    presets: [
      "Perbaiki teks ini agar formal: 'saya mau ijin pergi ngecek posyandu besok sama bidan ani pagi-pagi'.",
      "Buatkan draf teks Dasar Surat untuk surat tugas berdasarkan undangan Dinas Kesehatan.",
      "Format kalimat maksud perjalanan dinas untuk melakukan pelaporan program TB ke Dinkes Kabupaten."
    ]
  }
];

interface GeminiChatViewProps {
  session: UserSession;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function GeminiChatView({ session, showToast }: GeminiChatViewProps) {
  const [activeRoleId, setActiveRoleId] = useState<string>("admin-helper");
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`gemini_chat_history_${session.username}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRole = BOT_ROLES.find((r) => r.id === activeRoleId) || BOT_ROLES[0];

  // Persist chat history
  useEffect(() => {
    localStorage.setItem(
      `gemini_chat_history_${session.username}`,
      JSON.stringify(messages)
    );
  }, [messages, session.username]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Add initial greeting message if empty
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: Message = {
        id: "greet-1",
        role: "assistant",
        content: `Halo **${session.name}**! Saya adalah asisten kecerdasan buatan **${activeRole.name}** untuk Puskesmas Boyan Tanjung. 

Ada yang bisa saya bantu terkait pembuatan draf Surat Tugas, kalkulasi biaya perjalanan dinas, rute kunjungan, atau pemahaman regulasi SPPD hari ini? Silakan pilih salah satu pertanyaan cepat di bawah atau tulis pertanyaan Anda sendiri!`,
        timestamp: new Date(),
        model: activeRole.model
      };
      setMessages([greeting]);
    }
  }, [activeRoleId, messages.length]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
      model: activeRole.model
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content
          })),
          model: activeRole.model,
          roleInstruction: activeRole.systemInstruction
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mendapatkan respon dari server.");
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.text || "Maaf, terjadi kesalahan saat memproses jawaban.",
        timestamp: new Date(),
        model: activeRole.model
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `❌ **Kesalahan Koneksi / API**: \n${error.message || "Tidak dapat terhubung ke server Gemini AI."} \n\n*Silakan pastikan kunci API Gemini sudah terpasang dengan benar di panel Pengaturan.*`,
        timestamp: new Date(),
        model: activeRole.model
      };
      setMessages((prev) => [...prev, errorMsg]);
      showToast(error.message || "Gagal memproses obrolan AI", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua riwayat obrolan ini?")) {
      setMessages([]);
      showToast("Riwayat obrolan berhasil dibersihkan", "info");
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Jawaban berhasil disalin ke papan klip!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper parser to render bold text and linebreaks beautifully
  const renderFormattedText = (text: string) => {
    return text.split("\n").map((paragraph, index) => {
      // Basic markdown bold parser (**text**)
      const boldParts = paragraph.split(/\*\*(.*?)\*\*/g);
      const renderedLine = boldParts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part}</strong>;
        }
        return part;
      });

      return (
        <p key={index} className="mb-2 leading-relaxed text-sm">
          {renderedLine}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Welcome Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
            Asisten AI Administrasi Puskesmas
          </h2>
          <p className="text-indigo-200/95 text-xs md:text-sm max-w-3xl leading-relaxed">
            Didukung oleh teknologi Gemini AI untuk membantu Anda menyusun draf administrasi Surat Tugas, menghitung estimasi anggaran perjalanan dinas dinas Puskesmas Boyan Tanjung, serta memvalidasi kesesuaian draf dengan format tata naskah dinas resmi.
          </p>
        </div>
        <button
          onClick={handleClearChat}
          className="px-3.5 py-2 hover:bg-white/10 text-slate-300 hover:text-red-400 rounded-xl text-xs font-bold transition-all border border-slate-700/50 flex items-center gap-2 shrink-0 self-start md:self-center"
          title="Hapus riwayat obrolan"
        >
          <Trash2 className="h-4 w-4" />
          Bersihkan Sesi
        </button>
      </div>

      {/* Main Grid: Sidebar Role Selector & Chat Box */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Select Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Pilih Karakter AI
            </h3>
            
            <div className="space-y-2.5">
              {BOT_ROLES.map((role) => {
                const isSelected = activeRoleId === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      setActiveRoleId(role.id);
                      setMessages([]); // Auto-clear and trigger fresh greeting
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 ${
                      isSelected
                        ? `bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20`
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{role.icon}</span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight">
                          {role.name}
                        </h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border mt-0.5 inline-block ${
                          role.model.includes("pro")
                            ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30"
                            : role.model.includes("lite")
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30"
                            : "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/30"
                        }`}>
                          {role.model}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model info panel */}
          <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-3.5 border border-slate-200/50 dark:border-slate-850 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex gap-2">
            <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">Saran Pemilihan:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><strong>gemini-3.5-flash</strong>: Sempurna untuk tugas umum & regulasi dasar.</li>
                <li><strong>gemini-3.1-pro-preview</strong>: Optimal untuk perhitungan biaya & analisis logistik rumit.</li>
                <li><strong>gemini-3.1-flash-lite</strong>: Kecepatan tinggi untuk draf tulisan pendek & koreksi ejaan.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Chat Box Area */}
        <div className="lg:col-span-3 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden h-[580px]">
          {/* Chat Header */}
          <div className="bg-slate-50 dark:bg-slate-950/40 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                {activeRole.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-none">
                  {activeRole.name}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                  Aktif • Model: {activeRole.model}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Puskesmas Boyan Tanjung AI
            </div>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar Icon */}
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser 
                      ? "bg-indigo-600 text-white" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40"
                  }`}>
                    {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                  </div>

                  {/* Bubble Container */}
                  <div className="space-y-1">
                    <div className={`rounded-2xl px-4 py-3 shadow-xs border ${
                      isUser
                        ? "bg-indigo-600 text-white border-indigo-700 rounded-tr-none"
                        : "bg-slate-50 dark:bg-slate-950/80 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800 rounded-tl-none"
                    }`}>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {renderFormattedText(message.content)}
                      </div>
                    </div>

                    {/* Metadata & Copy trigger */}
                    <div className={`flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}>
                      <span>
                        {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {!isUser && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => handleCopyText(message.id, message.content)}
                            className="hover:text-indigo-500 flex items-center gap-0.5 font-semibold"
                            title="Salin jawaban ini"
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Loader Indicator */}
            {loading && (
              <div className="flex items-start gap-3 max-w-[80%] mr-auto">
                <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40 flex items-center justify-center shrink-0">
                  <Bot className="h-4.5 w-4.5 animate-bounce" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Presets suggestions */}
          {messages.length <= 1 && (
            <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                Pertanyaan Rekomendasi:
              </p>
              <div className="flex flex-wrap gap-2">
                {activeRole.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(preset)}
                    className="text-left text-xs bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 px-3 py-1.5 rounded-xl transition-all shadow-xs"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box Area */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex gap-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Tulis pertanyaan atau draf perintah tugas untuk ${activeRole.name}...`}
                disabled={loading}
                className="flex-1 text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 shadow-xs"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center shadow-md shrink-0"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
