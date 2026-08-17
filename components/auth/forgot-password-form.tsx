"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [developmentUrl, setDevelopmentUrl] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setDevelopmentUrl("");
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Permintaan belum dapat diproses.");
      setMessage(result.message);
      setDevelopmentUrl(result.developmentResetUrl || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Permintaan belum dapat diproses.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Pemulihan akun"
      title="Atur ulang kata sandi"
      description="Masukkan email akun. Respons dibuat sama untuk email terdaftar maupun tidak agar akun tetap privat."
      footer={<p><Link href="/login">Kembali ke halaman masuk</Link></p>}
    >
      <form className="auth-form" onSubmit={submit}>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="nama@email.com" required /></label>
        {message && <p className="form-message success" role="status">{message}</p>}
        {developmentUrl && <a className="development-link" href={developmentUrl}>Buka tautan reset lokal</a>}
        <button className="primary-button auth-submit" disabled={pending}>{pending ? "Memproses…" : "Buat tautan reset"}</button>
        <p className="field-hint">Saat development, tautan tampil di sini. Di production, tautan akan dikirim oleh layanan email.</p>
      </form>
    </AuthShell>
  );
}
