"use client";

import Link from "next/link";
import { Check, ChevronLeft, Clock3, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type ProfileState = {
  email: string;
  displayName: string;
  timezone: string;
  clockFormat: 12 | 24;
  weekStartsOn: number;
  activeDays: number[];
  sleepStart: string;
  sleepEnd: string;
  maximumFocusMinutes: number;
  minimumBreakMinutes: number;
  defaultReminderMinutes: number;
};

const defaults: ProfileState = {
  email: "",
  displayName: "",
  timezone: "Asia/Jakarta",
  clockFormat: 24,
  weekStartsOn: 1,
  activeDays: [1, 2, 3, 4, 5],
  sleepStart: "22:00",
  sleepEnd: "06:00",
  maximumFocusMinutes: 120,
  minimumBreakMinutes: 15,
  defaultReminderMinutes: 15,
};

const days = [
  { value: 1, label: "Sen" },
  { value: 2, label: "Sel" },
  { value: 3, label: "Rab" },
  { value: 4, label: "Kam" },
  { value: 5, label: "Jum" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Min" },
];

const timezones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Singapore"];

export function ProfileForm({ mode }: { mode: "onboarding" | "settings" }) {
  const [profile, setProfile] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace("/login");
          return null;
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Profil belum dapat dimuat.");
        return result.profile as ProfileState;
      })
      .then((value) => value && setProfile(value))
      .catch((error) => setMessage(error instanceof Error ? error.message : "Profil belum dapat dimuat."))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof ProfileState>(key: K, value: ProfileState[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day: number) {
    update(
      "activeDays",
      profile.activeDays.includes(day)
        ? profile.activeDays.filter((value) => value !== day)
        : [...profile.activeDays, day],
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch(mode === "onboarding" ? "/api/onboarding" : "/api/profile", {
        method: mode === "onboarding" ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Preferensi belum dapat disimpan.");

      if (mode === "onboarding") {
        window.location.assign(result.next || "/");
        return;
      }

      setMessage(result.message || "Preferensi berhasil disimpan.");
      setSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preferensi belum dapat disimpan.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <main className="profile-page"><div className="profile-loading">Menyiapkan preferensimu…</div></main>;
  }

  return (
    <main className="profile-page">
      <div className="profile-wrap">
        <header className="profile-header">
          {mode === "settings" && <Link className="back-link" href="/"><ChevronLeft size={17} /> Kembali</Link>}
          <div className="profile-brand"><Sparkles size={18} /><strong>Weekly</strong></div>
          <p className="eyebrow">{mode === "onboarding" ? "Langkah terakhir" : "Profil dan preferensi"}</p>
          <h1>{mode === "onboarding" ? "Sesuaikan ritme minggumu." : "Atur cara asisten bekerja."}</h1>
          <p>{mode === "onboarding" ? "Jawaban ini menjadi batas aman bagi mesin penjadwalan. Semuanya bisa diubah kembali." : "Perubahan akan dipakai ketika jadwal baru disusun pada fase berikutnya."}</p>
        </header>

        <form className="profile-form" onSubmit={submit}>
          <section className="profile-section">
            <div className="section-heading"><span>01</span><div><h2>Identitas dan waktu</h2><p>Nama untuk sapaan dan zona waktu utama.</p></div></div>
            <div className="form-grid two">
              <label>Nama panggilan<input value={profile.displayName} onChange={(event) => update("displayName", event.target.value)} minLength={2} required /></label>
              <label>Email<input value={profile.email} disabled aria-describedby="email-note" /><small id="email-note">Email akun tidak diubah dari sini.</small></label>
              <label>Zona waktu<select value={profile.timezone} onChange={(event) => update("timezone", event.target.value)}>{timezones.map((timezone) => <option key={timezone}>{timezone}</option>)}</select></label>
              <label>Format jam<select value={profile.clockFormat} onChange={(event) => update("clockFormat", Number(event.target.value) as 12 | 24)}><option value={24}>24 jam</option><option value={12}>12 jam</option></select></label>
            </div>
          </section>

          <section className="profile-section">
            <div className="section-heading"><span>02</span><div><h2>Hari aktif dan istirahat</h2><p>Asisten tidak akan menaruh pekerjaan pada waktu tidur.</p></div></div>
            <fieldset className="day-fieldset"><legend>Hari aktif utama</legend><div className="day-picker">{days.map((day) => <button key={day.value} className={profile.activeDays.includes(day.value) ? "selected" : ""} type="button" onClick={() => toggleDay(day.value)}>{profile.activeDays.includes(day.value) && <Check size={13} />}{day.label}</button>)}</div></fieldset>
            <div className="form-grid three">
              <label>Mulai tidur<input type="time" value={profile.sleepStart} onChange={(event) => update("sleepStart", event.target.value)} required /></label>
              <label>Bangun<input type="time" value={profile.sleepEnd} onChange={(event) => update("sleepEnd", event.target.value)} required /></label>
              <label>Awal minggu<select value={profile.weekStartsOn} onChange={(event) => update("weekStartsOn", Number(event.target.value))}><option value={1}>Senin</option><option value={0}>Minggu</option></select></label>
            </div>
          </section>

          <section className="profile-section">
            <div className="section-heading"><span>03</span><div><h2>Batas fokus</h2><p>Durasi maksimum mencegah jadwal terlalu padat.</p></div></div>
            <div className="form-grid three">
              <label>Maksimum fokus<select value={profile.maximumFocusMinutes} onChange={(event) => update("maximumFocusMinutes", Number(event.target.value))}><option value={60}>60 menit</option><option value={90}>90 menit</option><option value={120}>120 menit</option><option value={180}>180 menit</option></select></label>
              <label>Jeda minimum<select value={profile.minimumBreakMinutes} onChange={(event) => update("minimumBreakMinutes", Number(event.target.value))}><option value={5}>5 menit</option><option value={10}>10 menit</option><option value={15}>15 menit</option><option value={30}>30 menit</option></select></label>
              <label>Pengingat default<select value={profile.defaultReminderMinutes} onChange={(event) => update("defaultReminderMinutes", Number(event.target.value))}><option value={0}>Tanpa pengingat</option><option value={5}>5 menit</option><option value={15}>15 menit</option><option value={30}>30 menit</option><option value={60}>60 menit</option></select></label>
            </div>
            <div className="profile-rule"><Clock3 size={17} /><span>Waktu disimpan sebagai menit lokal dan zona IANA sehingga aman saat zona waktu berubah.</span></div>
          </section>

          {message && <p className={`form-message ${success ? "success" : "error"}`} role={success ? "status" : "alert"}>{message}</p>}
          <div className="profile-actions">
            {mode === "settings" && <Link className="secondary-button" href="/">Batal</Link>}
            <button className="primary-button" disabled={pending}>{pending ? "Menyimpan…" : mode === "onboarding" ? "Simpan dan buka dashboard" : "Simpan perubahan"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
