"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";

export function AccountActions() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function removeAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, confirmation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Akun belum dapat dihapus.");
      localStorage.removeItem("assistant-reminder:last-planner");
      localStorage.removeItem("assistant-reminder:last-user");
      location.replace(result.next || "/register");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Akun belum dapat dihapus.");
      setPending(false);
    }
  }

  return (
    <section className="profile-section account-section">
      <div className="section-heading"><span>04</span><div><h2>Data dan akun</h2><p>Unduh salinan data atau hapus akun secara permanen.</p></div></div>
      <div className="account-export">
        <div><strong>Ekspor data</strong><p>File JSON berisi profil, target, tugas, rutinitas, jadwal, dan riwayat yang terkait dengan akunmu.</p></div>
        <a className="secondary-button" href="/api/account/export" download><Download size={16} />Unduh data</a>
      </div>
      <details className="danger-zone">
        <summary><Trash2 size={16} /> Hapus akun</summary>
        <form onSubmit={removeAccount}>
          <p>Tindakan ini permanen. Ekspor data terlebih dahulu bila masih diperlukan.</p>
          <div className="form-grid two">
            <label>Kata sandi<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <label>Ketik HAPUS<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} pattern="HAPUS" required /></label>
          </div>
          {message && <p className="form-message error" role="alert">{message}</p>}
          <button className="danger-button" disabled={pending || confirmation !== "HAPUS"}>{pending ? "Menghapus…" : "Hapus akun permanen"}</button>
        </form>
      </details>
    </section>
  );
}
