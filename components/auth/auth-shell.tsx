import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Tentang AI Weekly Assistant">
        <div className="auth-brand">
          <span className="brand-mark"><Sparkles size={20} /></span>
          <span><strong>Weekly</strong><small>AI Assistant</small></span>
        </div>
        <div className="auth-story-copy">
          <p className="eyebrow">Rencana yang realistis</p>
          <h1>Susun minggu yang mengikuti kapasitasmu.</h1>
          <p>Ubah semua yang ada di kepala menjadi tugas, rutinitas, dan blok fokus tanpa membuat jadwal saling bertabrakan.</p>
        </div>
        <div className="auth-trust-row">
          <span>Data privat per akun</span>
          <span>Waktu lokal akurat</span>
          <span>Kamu tetap memegang kendali</span>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-card">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="auth-description">{description}</p>
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </section>
    </main>
  );
}
