"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

export function RegisterForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const data = new FormData(event.currentTarget);

    if (data.get("password") !== data.get("passwordConfirmation")) {
      setMessage("Konfirmasi kata sandi tidak sama.");
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: data.get("displayName"),
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Akun belum dapat dibuat.");
      window.location.assign(result.next || "/onboarding");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Akun belum dapat dibuat.");
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Mulai dari sini"
      title="Buat ruang produktifmu"
      description="Siapkan akun privat. Setelah ini kita sesuaikan zona waktu dan ritme fokusmu."
      footer={<p>Sudah punya akun? <Link href="/login">Masuk</Link></p>}
    >
      <form className="auth-form" onSubmit={submit}>
        <label>Nama panggilan<input name="displayName" autoComplete="name" placeholder="Contoh: Alex" minLength={2} required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="nama@email.com" required /></label>
        <label>Kata sandi<input name="password" type="password" autoComplete="new-password" placeholder="Minimal 10 karakter" minLength={10} required /></label>
        <label>Ulangi kata sandi<input name="passwordConfirmation" type="password" autoComplete="new-password" placeholder="Ketik sekali lagi" minLength={10} required /></label>
        <p className="field-hint">Gunakan huruf besar, huruf kecil, dan angka.</p>
        {message && <p className="form-message error" role="alert">{message}</p>}
        <button className="primary-button auth-submit" disabled={pending}>{pending ? "Membuat akun…" : "Buat akun"}</button>
      </form>
    </AuthShell>
  );
}
