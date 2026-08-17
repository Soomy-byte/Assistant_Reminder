"use client";

import {
  AlarmClock,
  ArrowRight,
  Bell,
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Inbox,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Repeat2,
  RotateCcw,
  Settings,
  Sparkles,
  Target,
  TimerReset,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AgendaItem = {
  id: number;
  time: string;
  endTime: string;
  title: string;
  category: string;
  duration: string;
  tone: "green" | "amber" | "blue" | "violet";
  fixed?: boolean;
  completed?: boolean;
};

const initialAgenda: AgendaItem[] = [
  {
    id: 1,
    time: "08.00",
    endTime: "09.30",
    title: "Finalisasi rancangan halaman utama",
    category: "Deep work",
    duration: "1j 30m",
    tone: "green",
    completed: true,
  },
  {
    id: 2,
    time: "10.00",
    endTime: "10.45",
    title: "Rapat evaluasi mingguan",
    category: "Rutinitas tetap",
    duration: "45m",
    tone: "blue",
    fixed: true,
  },
  {
    id: 3,
    time: "13.30",
    endTime: "15.00",
    title: "Menyusun laporan progres proyek",
    category: "Prioritas tinggi",
    duration: "1j 30m",
    tone: "amber",
  },
  {
    id: 4,
    time: "16.15",
    endTime: "17.00",
    title: "Olahraga ringan",
    category: "Personal",
    duration: "45m",
    tone: "violet",
  },
];

const navigation = [
  { label: "Hari ini", icon: LayoutDashboard, active: true },
  { label: "Minggu", icon: CalendarDays },
  { label: "Tugas", icon: ListTodo, badge: "7" },
  { label: "Rutinitas", icon: Repeat2 },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ displayName: string | null; email: string; timezone: string } | null>(null);
  const [agenda, setAgenda] = useState(initialAgenda);
  const [brainDumpOpen, setBrainDumpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          window.location.replace("/login");
          return null;
        }
        const result = await response.json();
        if (!result.user.onboardingCompleted) {
          window.location.replace("/onboarding");
          return null;
        }
        return result.user;
      })
      .then((value) => value && setUser(value))
      .catch(() => window.location.replace("/login"));
  }, []);

  const completedCount = agenda.filter((item) => item.completed).length;
  const progress = Math.round((completedCount / agenda.length) * 100);
  const remainingMinutes = agenda
    .filter((item) => !item.completed)
    .reduce((sum, item) => {
      const [startHour, startMinute] = item.time.split(".").map(Number);
      const [endHour, endMinute] = item.endTime.split(".").map(Number);
      return sum + endHour * 60 + endMinute - (startHour * 60 + startMinute);
    }, 0);

  const remainingLabel = useMemo(() => {
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return `${hours}j ${minutes ? `${minutes}m` : ""}`.trim();
  }, [remainingMinutes]);

  const todayLabel = useMemo(() => {
    if (!user) return "Memuat tanggal…";
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: user.timezone,
    }).format(new Date());
  }, [user]);

  const displayName = user?.displayName || user?.email.split("@")[0] || "Teman";
  const firstName = displayName.split(" ")[0];
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  function toggleComplete(id: number) {
    setAgenda((items) =>
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  }

  if (!user) {
    return <main className="dashboard-loading"><Sparkles size={22} /> Menyiapkan ruang minggumu…</main>;
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            <Sparkles size={19} strokeWidth={2.4} />
          </div>
          <div>
            <strong>Weekly</strong>
            <span>AI Assistant</span>
          </div>
          <button
            className="icon-button mobile-only"
            aria-label="Tutup menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <button className="brain-dump-button" onClick={() => setBrainDumpOpen(true)}>
          <BrainCircuit size={19} />
          <span>Brain Dump</span>
          <span className="shortcut">⌘ B</span>
        </button>

        <nav className="main-nav" aria-label="Navigasi utama">
          <p className="nav-label">Perencana</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button className={item.active ? "nav-item active" : "nav-item"} key={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => router.push("/settings")}>
            <Settings size={18} />
            <span>Pengaturan</span>
          </button>
          <div className="profile-card">
            <div className="avatar">{initials}</div>
            <div>
              <strong>{displayName}</strong>
              <span>{user.timezone}</span>
            </div>
            <button className="profile-logout" aria-label="Keluar" title="Keluar" onClick={logout}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          aria-label="Tutup menu"
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <section className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            aria-label="Buka menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="date-control">
            <CalendarDays size={17} />
            <span>{todayLabel}</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" aria-label="Notifikasi">
              <Bell size={19} />
              <span />
            </button>
            <button className="primary-button compact" onClick={() => setBrainDumpOpen(true)}>
              <Plus size={17} />
              Tambah rencana
            </button>
          </div>
        </header>

        <div className="content-wrap">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">Agenda hari ini</p>
              <h1>Selamat datang, {firstName}.</h1>
              <p>Empat blok sudah disusun. Kamu punya ruang yang cukup untuk menyelesaikannya.</p>
            </div>
            <div className="weather-chip" aria-label="Waktu fokus tersisa">
              <TimerReset size={18} />
              <div>
                <span>Sisa fokus</span>
                <strong>{remainingLabel}</strong>
              </div>
            </div>
          </section>

          <section className="summary-grid" aria-label="Ringkasan hari ini">
            <article className="summary-card progress-summary">
              <div className="progress-ring" style={{ "--progress": `${progress}%` } as React.CSSProperties}>
                <span>{progress}%</span>
              </div>
              <div>
                <span className="summary-label">Progres hari ini</span>
                <strong>{completedCount} dari {agenda.length} selesai</strong>
                <small>Ritmemu masih sesuai rencana</small>
              </div>
            </article>
            <article className="summary-card">
              <div className="summary-icon green"><Target size={20} /></div>
              <div>
                <span className="summary-label">Fokus utama</span>
                <strong>Laporan progres</strong>
                <small>Mulai pukul 13.30</small>
              </div>
            </article>
            <article className="summary-card">
              <div className="summary-icon amber"><Inbox size={20} /></div>
              <div>
                <span className="summary-label">Belum dijadwalkan</span>
                <strong>3 tugas</strong>
                <small>2 mendekati deadline</small>
              </div>
            </article>
          </section>

          <div className="dashboard-grid">
            <section className="panel agenda-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Urutan waktumu</p>
                  <h2>Agenda</h2>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => showToast("Proposal jadwal baru siap diperiksa.")}
                >
                  <RotateCcw size={16} />
                  Susun ulang
                </button>
              </div>

              <div className="agenda-list">
                {agenda.map((item, index) => (
                  <article
                    className={`agenda-item ${item.completed ? "completed" : ""}`}
                    key={item.id}
                  >
                    <div className="time-column">
                      <strong>{item.time}</strong>
                      <span>{item.endTime}</span>
                    </div>
                    <div className="timeline-column" aria-hidden="true">
                      <span className={`timeline-dot ${item.tone}`} />
                      {index !== agenda.length - 1 && <span className="timeline-line" />}
                    </div>
                    <div className={`agenda-card tone-${item.tone}`}>
                      <button
                        className="complete-toggle"
                        aria-label={item.completed ? `Buka kembali ${item.title}` : `Selesaikan ${item.title}`}
                        onClick={() => toggleComplete(item.id)}
                      >
                        {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                      <div className="agenda-copy">
                        <div className="agenda-title-row">
                          <h3>{item.title}</h3>
                          {item.fixed && <span className="fixed-badge">Tetap</span>}
                        </div>
                        <div className="agenda-meta">
                          <span>{item.category}</span>
                          <span><Clock3 size={13} /> {item.duration}</span>
                        </div>
                      </div>
                      <button className="icon-button mini" aria-label={`Opsi ${item.title}`}>
                        <MoreHorizontal size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <button className="add-inline-button" onClick={() => setBrainDumpOpen(true)}>
                <Plus size={17} /> Tambah blok waktu
              </button>
            </section>

            <aside className="right-column">
              <section className="panel focus-panel">
                <div className="panel-header compact-header">
                  <div>
                    <p className="eyebrow">Berikutnya</p>
                    <h2>Siapkan fokus</h2>
                  </div>
                  <span className="start-badge">13.30</span>
                </div>
                <div className="focus-visual">
                  <div className="focus-orbit orbit-one" />
                  <div className="focus-orbit orbit-two" />
                  <div className="focus-center"><AlarmClock size={24} /></div>
                </div>
                <h3>Menyusun laporan progres proyek</h3>
                <p>Blok fokus 90 menit dengan jeda bebas gangguan.</p>
                <button className="primary-button full" onClick={() => showToast("Mode fokus akan tersedia pada fase berikutnya.") }>
                  Mulai saat waktunya <ArrowRight size={16} />
                </button>
              </section>

              <section className="panel unscheduled-panel">
                <div className="panel-header compact-header">
                  <div>
                    <p className="eyebrow">Inbox</p>
                    <h2>Belum dijadwalkan</h2>
                  </div>
                  <button className="text-button">Lihat semua</button>
                </div>
                <div className="mini-task-list">
                  <button className="mini-task">
                    <span className="priority-dot urgent" />
                    <span><strong>Revisi proposal klien</strong><small>Deadline besok · 60m</small></span>
                    <ChevronRight size={16} />
                  </button>
                  <button className="mini-task">
                    <span className="priority-dot medium" />
                    <span><strong>Beli kebutuhan mingguan</strong><small>Fleksibel · 45m</small></span>
                    <ChevronRight size={16} />
                  </button>
                  <button className="mini-task">
                    <span className="priority-dot low" />
                    <span><strong>Rapikan arsip digital</strong><small>Tanpa deadline · 30m</small></span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>

      <nav className="mobile-bottom-nav" aria-label="Navigasi mobile">
        <button className="active"><LayoutDashboard size={20} /><span>Hari ini</span></button>
        <button><CalendarDays size={20} /><span>Minggu</span></button>
        <button className="mobile-brain-button" onClick={() => setBrainDumpOpen(true)} aria-label="Buka Brain Dump"><Sparkles size={22} /></button>
        <button><ListTodo size={20} /><span>Tugas</span></button>
        <button onClick={() => router.push("/settings")}><Settings size={20} /><span>Atur</span></button>
      </nav>

      {brainDumpOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setBrainDumpOpen(false)}>
          <section
            className="brain-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="brain-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-icon"><BrainCircuit size={22} /></div>
              <div>
                <p className="eyebrow">Brain Dump</p>
                <h2 id="brain-title">Ceritakan rencanamu</h2>
              </div>
              <button className="icon-button" aria-label="Tutup" onClick={() => setBrainDumpOpen(false)}><X size={19} /></button>
            </div>
            <p className="modal-description">Tulis semua kegiatan dengan bahasamu sendiri. Kamu akan memeriksa hasilnya sebelum jadwal disimpan.</p>
            <label className="brain-input-label" htmlFor="brain-input">Rencana minggu ini</label>
            <textarea
              id="brain-input"
              autoFocus
              placeholder="Contoh: Selesaikan laporan 2 jam sebelum Jumat, olahraga Rabu dan Sabtu pagi, lalu beli pakan kucing sepulang kerja..."
            />
            <div className="input-hints">
              <span><Check size={14} /> Cantumkan durasi</span>
              <span><Check size={14} /> Sebutkan deadline</span>
              <span><Check size={14} /> Tambahkan waktu favorit</span>
            </div>
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setBrainDumpOpen(false)}>Batal</button>
              <button
                className="primary-button"
                onClick={() => {
                  setBrainDumpOpen(false);
                  showToast("Brain Dump tersimpan sebagai draf untuk tahap pemeriksaan.");
                }}
              >
                <Sparkles size={16} /> Uraikan rencana
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}</div>}
    </main>
  );
}
