// components/developer/DeveloperLogin.tsx
"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  email: string;
  password: string;
}

export function DeveloperLogin() {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/developer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Credenciales inválidas");
        return;
      }
      const data = await response.json();
      localStorage.setItem("developer_token", data.token);
      localStorage.setItem("developer_user", JSON.stringify(data.usuario));
      router.push("/developer/dashboard");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f1117",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      padding: 16,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(#2a334718 1px,transparent 1px),linear-gradient(90deg,#2a334718 1px,transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%,#000 40%,transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%,#000 40%,transparent 100%)",
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "20%", left: "20%", width: 300, height: 300, background: "radial-gradient(circle,rgba(59,130,246,.06) 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 400, height: 400, background: "radial-gradient(circle,rgba(139,92,246,.05) 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            borderRadius: 10,
            marginBottom: 16,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 12L2 7M12 12l10-5M12 12v10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 600, margin: "0 0 4px", letterSpacing: -0.5 }}>
            Panel de Desarrollador
          </h1>
          <p style={{ color: "#546280", fontSize: 12, margin: 0 }}>
            acceso restringido — solo personal autorizado
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#161b27",
          border: "1px solid #2a3347",
          borderRadius: 12,
          padding: 28,
        }}>
          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 18,
              background: "rgba(239,68,68,.1)",
              border: "1px solid rgba(239,68,68,.25)",
              color: "#ef4444",
              padding: "10px 14px",
              borderRadius: 7,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#8fa0bc", marginBottom: 6, letterSpacing: ".4px" }}>
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="dev@example.com"
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "#1e2535",
                  border: "1px solid #2a3347",
                  borderRadius: 7,
                  color: "#e2e8f0",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color .15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#2a3347")}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#8fa0bc", marginBottom: 6, letterSpacing: ".4px" }}>
                CONTRASEÑA
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "9px 38px 9px 12px",
                    background: "#1e2535",
                    border: "1px solid #2a3347",
                    borderRadius: 7,
                    color: "#e2e8f0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color .15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a3347")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#546280", padding: 0, display: "flex" }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                background: loading ? "#1e2535" : "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                border: "none",
                borderRadius: 7,
                color: loading ? "#546280" : "#fff",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
                transition: "opacity .15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid #546280", borderTopColor: "#8fa0bc", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }} />
                  verificando...
                </>
              ) : (
                "→ Acceder"
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #2a3347", fontSize: 10, color: "#546280", textAlign: "center", lineHeight: 1.7 }}>
            acceso solo para desarrolladores autorizados<br />
            los intentos de acceso son registrados y auditados
          </div>
        </div>

        {/* Version */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#344060" }}>
          axis pre-icfes · dev console v2.4.1
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}