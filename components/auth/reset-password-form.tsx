"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

export function ResetPasswordForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("passwordConfirmation")) {
      setMessage("Konfirmasi kata sandi tidak sama.");
      return;
    }

    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password: data.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Kata sandi belum dapat diperbarui.");
      setMessage(result.message);
      setSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kata sandi belum dapat diperbarui.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Keamanan akun"
      title="Buat kata sandi baru"
      description="Tautan hanya dapat dipakai satu kali dan berlaku selama 30 menit."
      footer={<p><Link href="/login">Kembali ke halaman masuk</Link></p>}
    >
      {!token ? (
        <p className="form-message error">Token reset tidak ditemukan. Buat tautan baru dari halaman lupa kata sandi.</p>
      ) : success ? (
        <div className="auth-form"><p className="form-message success">{message}</p><Link className="primary-button auth-submit" href="/login">Masuk sekarang</Link></div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label>Kata sandi baru<input name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
          <label>Ulangi kata sandi<input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={10} required /></label>
          {message && <p className="form-message error" role="alert">{message}</p>}
          <button className="primary-button auth-submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan kata sandi baru"}</button>
        </form>
      )}
    </AuthShell>
  );
}
