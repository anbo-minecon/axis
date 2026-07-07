"use client";

// components/developer/DeveloperDashboard.tsx
//
// Dashboard del rol DEVELOPER — versión "órbita".
// Los módulos giran de forma continua alrededor del logo de AXIS.
// Cada módulo navega a su propia ruta separada.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/hooks/useTheme";
import {
  ClipboardList,
  Webhook,
  ScrollText,
  ShieldCheck,
  HardDrive,
  Users,
  Moon,
  Sun,
  LogOut,
  type LucideIcon,
} from "lucide-react";

interface DevModule {
  id: string;
  label: string;
  icon: LucideIcon;
}

// Los 6 módulos del rol Developer, en el orden en que deben aparecer en la órbita.
const MODULES: DevModule[] = [
  { id: "simulacros", label: "Simulacros", icon: ClipboardList },
  { id: "apis", label: "APIs", icon: Webhook },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "auditorias", label: "Auditorías", icon: ShieldCheck },
  { id: "respaldo", label: "Respaldo", icon: HardDrive },
  { id: "usuarios", label: "Usuarios", icon: Users },
];

function getInitials(nombre: string) {
  return nombre
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function DeveloperDashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("Developer");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("developer_token");
    const rawUser = localStorage.getItem("developer_user");

    if (!token) {
      router.replace("/developer/login");
      return;
    }

    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed?.nombre) setUserName(parsed.nombre);
        if (parsed?.email) setUserEmail(parsed.email);
      } catch {
        // ignore
      }
    }

    setReady(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("developer_token");
    localStorage.removeItem("developer_user");
    router.replace("/developer/login");
  };

  if (!ready) {
    return (
      <div className="dd-loading">
        <style>{`
          .dd-loading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: var(--bg-primary);
            color: var(--text-primary);
          }
          .dd-loading-spinner {
            width: 36px;
            height: 36px;
            border: 2px solid var(--border);
            border-top-color: var(--accent-blue);
            border-radius: 50%;
            margin: 0 auto 12px;
            animation: dd-spin 0.8s linear infinite;
          }
          @keyframes dd-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ textAlign: "center" }}>
          <div className="dd-loading-spinner" />
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Cargando dashboard…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="axis-dev-dashboard noise">
      <style>{`
        .axis-dev-dashboard {
          --orbit-radius: clamp(150px, 30vmin, 260px);
          --orbit-duration: 42s;
          --card-w: clamp(108px, 13vmin, 168px);
          --card-pad: clamp(10px, 1.4vmin, 16px);
          --card-icon: clamp(28px, 3.6vmin, 40px);
          --card-font: clamp(11px, 1.3vmin, 14px);

          position: relative;
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-body), sans-serif;
          overflow: hidden;
        }

        /* ── Header ─────────────────────────────────────────────── */
        .dd-header {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px clamp(14px, 3vw, 32px);
          border-bottom: 1px solid var(--border);
          background: var(--bg-primary);
        }

        .dd-header-left {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--bg-card);
        }
        .dd-header-left svg { color: var(--accent-blue); width: 16px; height: 16px; }
        .dd-header-left span {
          font-family: var(--font-display), sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.02em;
        }

        .dd-header-right {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .dd-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .dd-icon-btn:hover {
          color: var(--accent-blue);
          border-color: var(--accent-blue);
        }
        .dd-icon-btn svg { width: 16px; height: 16px; }

        .dd-user {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 5px 12px 5px 5px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--bg-card);
        }
        .dd-user-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent-blue);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .dd-user-meta {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
          max-width: 160px;
        }
        .dd-user-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dd-user-email {
          font-size: 10.5px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Escenario de órbita ────────────────────────────────── */
        .dd-stage {
          position: relative;
          min-height: calc(100vh - 66px);
          display: grid;
          place-items: center;
        }
        .dd-stage::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 44px 44px;
          opacity: 0.4;
          pointer-events: none;
        }

        .orbit-stage {
          position: relative;
          width: 1px;
          height: 1px;
        }

        /* ── Centro: logo AXIS ──────────────────────────────────── */
        .dd-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 2;
        }
        .dd-center-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: clamp(90px, 16vmin, 150px);
          height: clamp(90px, 16vmin, 150px);
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, var(--glow-blue) 0%, transparent 70%);
          animation: dd-pulse 3.2s ease-in-out infinite;
          z-index: -1;
        }
        @keyframes dd-pulse {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(0.94); }
          50%       { opacity: 1;    transform: translate(-50%, -50%) scale(1.06); }
        }
        .dd-center-logo {
          border-radius: 16px;
          box-shadow: 0 0 0 1px var(--border);
        }
        .dd-center-caption {
          font-family: var(--font-display), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--text-muted);
          white-space: nowrap;
        }

        /* ── Anillo giratorio ───────────────────────────────────── */
        .orbit-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          animation: dd-orbit-spin var(--orbit-duration) linear infinite;
        }
        @keyframes dd-orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .orbit-slot {
          position: absolute;
          top: 0;
          left: 0;
          transform: rotate(var(--angle)) translateX(var(--orbit-radius)) rotate(calc(-1 * var(--angle)));
        }

        .orbit-card-spin {
          animation: dd-orbit-spin-reverse var(--orbit-duration) linear infinite;
        }
        @keyframes dd-orbit-spin-reverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }

        .orbit-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: var(--card-w);
          padding: var(--card-pad);
          margin-left: calc(var(--card-w) / -2);
          margin-top: calc(var(--card-w) / -2);
          border-radius: 18px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-primary);
          cursor: pointer;
          text-align: center;
          box-shadow: 0 6px 20px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .orbit-card:hover {
          transform: scale(1.06);
          border-color: var(--accent-blue);
        }
        .orbit-card.is-active {
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 1px var(--accent-blue), 0 10px 28px var(--glow-blue);
        }
        .orbit-card-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--card-icon);
          height: var(--card-icon);
          border-radius: 12px;
          background: var(--glow-blue);
          color: var(--accent-blue);
        }
        .orbit-card-icon svg {
          width: 55%;
          height: 55%;
        }
        .orbit-card-label {
          font-size: var(--card-font);
          font-weight: 600;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        /* Pausar la órbita mientras el usuario interactúa, para poder leer/hacer clic */
        .orbit-stage:hover .orbit-ring,
        .orbit-stage:hover .orbit-card-spin {
          animation-play-state: paused;
        }

        /* ── Responsivo: tarjetas diminutas en pantallas pequeñas ── */
        @media (max-width: 640px) {
          .axis-dev-dashboard {
            --orbit-radius: clamp(96px, 34vmin, 150px);
            --orbit-duration: 34s;
            --card-w: clamp(72px, 20vmin, 96px);
            --card-pad: 8px;
            --card-icon: 24px;
            --card-font: 9.5px;
          }
          .dd-user-meta { display: none; }
          .dd-header-left span { font-size: 12px; }
          .dd-center-caption { font-size: 9px; }
        }

        @media (max-width: 380px) {
          .axis-dev-dashboard {
            --orbit-radius: clamp(80px, 32vmin, 120px);
            --card-w: 66px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-ring, .orbit-card-spin, .dd-center-glow {
            animation: none !important;
          }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="dd-header">
        <div className="dd-header-left">
          <ClipboardList />
          <span>Developer Console</span>
        </div>

        <div className="dd-header-right">
          <button
            type="button"
            className="dd-icon-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>

          <div className="dd-user">
            <span className="dd-user-avatar">{getInitials(userName)}</span>
            <div className="dd-user-meta">
              <span className="dd-user-name">{userName}</span>
              {userEmail && <span className="dd-user-email">{userEmail}</span>}
            </div>
          </div>

          <button
            type="button"
            className="dd-icon-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut />
          </button>
        </div>
      </header>

      {/* ── Escenario con órbita ── */}
      <main className="dd-stage">
        <div className="orbit-stage">
          <div className="dd-center">
            <div className="dd-center-glow" />
            <Image
              src="/images/logo2.png"
              alt="AXIS"
              width={64}
              height={64}
              className="dd-center-logo"
            />
            <span className="dd-center-caption">Developer Console</span>
          </div>

          <div className="orbit-ring">
            {MODULES.map((mod, i) => {
              const angle = (360 / MODULES.length) * i - 90;
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className="orbit-slot"
                  style={{ ["--angle" as any]: `${angle}deg` }}
                >
                  <div className="orbit-card-spin">
                    <button
                      type="button"
                      className="orbit-card"
                      onClick={() => router.push(`/developer/${mod.id}`)}
                    >
                      <span className="orbit-card-icon">
                        <Icon />
                      </span>
                      <span className="orbit-card-label">{mod.label}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}