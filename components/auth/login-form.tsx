"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

export function LoginForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Tidak dapat masuk.");
      window.location.assign(result.next || "/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tidak dapat masuk.");
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Selamat datang kembali"
      title="Masuk ke ruang minggumu"
      description="Lanjutkan dari jadwal dan preferensi yang sudah tersimpan."
      footer={<p>Belum punya akun? <Link href="/register">Daftar gratis</Link></p>}
    >
      <form className="auth-form" onSubmit={submit}>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="nama@email.com" required /></label>
        <label>Kata sandi<input name="password" type="password" autoComplete="current-password" placeholder="Masukkan kata sandi" required /></label>
        <div className="auth-form-meta"><Link href="/forgot-password">Lupa kata sandi?</Link></div>
        {message && <p className="form-message error" role="alert">{message}</p>}
        <button className="primary-button auth-submit" disabled={pending}>{pending ? "Memeriksa…" : "Masuk"}</button>
      </form>
    </AuthShell>
  );
}
