// components/shared/ChatWindow.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PusherClient from "pusher-js";
import { cn } from "@/lib/utils";
import {
  Send, Loader2, AlertCircle, ArrowLeft, MoreVertical,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Remitente {
  id: string;
  nombre: string;
  imagen: string | null;
  rol: string;
}

interface Mensaje {
  id: string;
  contenido: string;
  creadoEn: string;
  remitente: Remitente;
  conversacionId: string;
}

interface ChatWindowProps {
  conversacionId: string;
  userId: string;
  otroUsuario: { id: string; nombre: string; imagen: string | null; rol: string };
  onBack?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtFecha(iso: string) {
  const d    = new Date(iso);
  const hoy  = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  if (d.toDateString() === hoy.toDateString())  return "Hoy";
  if (d.toDateString() === ayer.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const ROL_LABEL: Record<string, string> = {
  ADMIN:      "Administrador",
  DOCENTE:    "Docente",
  ESTUDIANTE: "Estudiante",
};

const ROL_COLOR: Record<string, string> = {
  ADMIN:      "bg-purple-500",
  DOCENTE:    "bg-blue-500",
  ESTUDIANTE: "bg-green-500",
};

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ nombre, imagen, rol, size = "sm" }: {
  nombre: string; imagen: string | null; rol: string; size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  const bg  = ROL_COLOR[rol] ?? "bg-gray-500";

  if (imagen) {
    return (
      <img
        src={imagen}
        alt={nombre}
        className={cn("rounded-full object-cover shrink-0", dim)}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold text-white shrink-0", dim, bg)}>
      {getInitials(nombre)}
    </div>
  );
}

// ── Burbuja de mensaje ─────────────────────────────────────────────────────
function BurbujaMensaje({ msg, esMio }: { msg: Mensaje; esMio: boolean }) {
  return (
    <div className={cn("flex items-end gap-2 max-w-[80%]", esMio ? "ml-auto flex-row-reverse" : "")}>
      {!esMio && (
        <Avatar nombre={msg.remitente.nombre} imagen={msg.remitente.imagen} rol={msg.remitente.rol} />
      )}
      <div className={cn(
        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
        esMio
          ? "rounded-br-sm bg-blue-600 text-white"
          : "rounded-bl-sm bg-[var(--bg-secondary)] border border-white/10 text-[var(--text-primary)]"
      )}>
        <p style={{ wordBreak: "break-word" }}>{msg.contenido}</p>
        <p className={cn(
          "text-[10px] mt-1 text-right",
          esMio ? "text-blue-200" : "text-[var(--text-muted)]"
        )}>
          {fmtHora(msg.creadoEn)}
        </p>
      </div>
    </div>
  );
}

// ── Separador de fecha ─────────────────────────────────────────────────────
function FechaSeparador({ fecha }: { fecha: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-white/8" />
      <span className="text-[10px] font-semibold text-[var(--text-muted)] px-2">{fecha}</span>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export function ChatWindow({ conversacionId, userId, otroUsuario, onBack }: ChatWindowProps) {
  const [mensajes, setMensajes]   = useState<Mensaje[]>([]);
  const [texto, setTexto]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [enviando, setEnviando]   = useState(false);
  const [error, setError]         = useState("");
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);
  const pusherRef                 = useRef<PusherClient | null>(null);

  // Scroll al último mensaje
  const scrollBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
    }, 50);
  }, []);

  // Cargar mensajes
  const cargarMensajes = useCallback(async () => {
    try {
      const r = await fetch(`/api/chat/conversaciones/${conversacionId}/mensajes`);
      const d = await r.json();
      setMensajes(d.mensajes ?? []);
      scrollBottom(false);
    } catch {
      setError("Error al cargar los mensajes.");
    } finally {
      setLoading(false);
    }
  }, [conversacionId, scrollBottom]);

  useEffect(() => { cargarMensajes(); }, [cargarMensajes]);

  // Pusher — suscribirse al canal de la conversación
  useEffect(() => {
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    pusherRef.current = pusher;

    const channel = pusher.subscribe(`chat-${conversacionId}`);

    channel.bind("nuevo-mensaje", (data: Mensaje) => {
      // Solo agregar si no es un mensaje que ya mandamos nosotros
      setMensajes((prev) => {
        const yaExiste = prev.some((m) => m.id === data.id);
        if (yaExiste) return prev;
        return [...prev, data];
      });
      scrollBottom();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`chat-${conversacionId}`);
      pusher.disconnect();
    };
  }, [conversacionId, scrollBottom]);

  // Enviar mensaje
  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;

    const contenido = texto.trim();
    setTexto("");
    setEnviando(true);

    // Optimistic UI — agregar mensaje localmente de inmediato
    const mensajeTmp: Mensaje = {
      id: `tmp-${Date.now()}`,
      contenido,
      creadoEn: new Date().toISOString(),
      remitente: { id: userId, nombre: "Tú", imagen: null, rol: "" },
      conversacionId,
    };
    setMensajes((prev) => [...prev, mensajeTmp]);
    scrollBottom();

    try {
      const r = await fetch(`/api/chat/conversaciones/${conversacionId}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      });
      const d = await r.json();

      if (!r.ok) {
        // Revertir optimistic
        setMensajes((prev) => prev.filter((m) => m.id !== mensajeTmp.id));
        setTexto(contenido);
        return;
      }

      // Reemplazar tmp con el real
      setMensajes((prev) =>
        prev.map((m) => m.id === mensajeTmp.id ? d.mensaje : m)
      );
    } catch {
      setMensajes((prev) => prev.filter((m) => m.id !== mensajeTmp.id));
      setTexto(contenido);
    } finally {
      setEnviando(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  // Agrupar mensajes por fecha para separadores
  const mensajesConFecha: { tipo: "fecha" | "mensaje"; fecha?: string; msg?: Mensaje }[] = [];
  let fechaActual = "";
  for (const m of mensajes) {
    const fecha = fmtFecha(m.creadoEn);
    if (fecha !== fechaActual) {
      mensajesConFecha.push({ tipo: "fecha", fecha });
      fechaActual = fecha;
    }
    mensajesConFecha.push({ tipo: "mensaje", msg: m });
  }

  return (
    <div className="flex h-full flex-col bg-[var(--bg-primary)]">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-[var(--bg-card)] px-4 py-3 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Avatar nombre={otroUsuario.nombre} imagen={otroUsuario.imagen} rol={otroUsuario.rol} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-primary)] truncate">{otroUsuario.nombre}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {ROL_LABEL[otroUsuario.rol] ?? otroUsuario.rol}
          </p>
        </div>
      </div>

      {/* ── Mensajes ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20">
              <Avatar nombre={otroUsuario.nombre} imagen={otroUsuario.imagen} rol={otroUsuario.rol} size="md" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{otroUsuario.nombre}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Empieza la conversación enviando un mensaje.
              </p>
            </div>
          </div>
        ) : (
          <>
            {mensajesConFecha.map((item, i) =>
              item.tipo === "fecha" ? (
                <FechaSeparador key={`fecha-${i}`} fecha={item.fecha!} />
              ) : (
                <BurbujaMensaje
                  key={item.msg!.id}
                  msg={item.msg!}
                  esMio={item.msg!.remitente.id === userId}
                />
              )
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-white/10 bg-[var(--bg-card)] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition max-h-32"
            style={{ minHeight: "42px" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={handleEnviar}
            disabled={!texto.trim() || enviando}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enviando
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-right">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}