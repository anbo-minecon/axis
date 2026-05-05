// components/dashboard/MensajesClient.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PusherClient from "pusher-js";
import { cn } from "@/lib/utils";
import { ChatWindow } from "@/components/shared/ChatWindow";
import {
  MessageSquare, X, ChevronRight, Loader2,
  AlertCircle, Search,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface OtroUsuario {
  id: string;
  nombre: string;
  imagen: string | null;
  rol: string;
}

interface ConversacionItem {
  id: string;
  otro: OtroUsuario;
  ultimoMensaje: string | null;
  ultimoMensajeEn: string | null;
  noLeidos: number;
}

const ROL_LABEL: Record<string, string> = {
  ADMIN:   "Administrador",
  DOCENTE: "Docente",
};

const ROL_COLOR: Record<string, string> = {
  ADMIN:   "bg-purple-500",
  DOCENTE: "bg-blue-500",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function Avatar({ nombre, imagen, rol }: { nombre: string; imagen: string | null; rol: string }) {
  const bg = ROL_COLOR[rol] ?? "bg-gray-500";
  if (imagen) {
    return (
      <img
        src={imagen}
        alt={nombre}
        className="h-10 w-10 rounded-full object-cover shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0", bg)}>
      {getInitials(nombre)}
    </div>
  );
}

function fmtHora(iso: string) {
  const d   = new Date(iso);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) {
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

// ── Panel principal del estudiante ─────────────────────────────────────────
export function MensajesClient({ userId }: { userId: string }) {
  const [conversaciones, setConversaciones] = useState<ConversacionItem[]>([]);
  const [staff, setStaff]                   = useState<OtroUsuario[]>([]);
  const [loadingConvs, setLoadingConvs]     = useState(true);
  const [loadingStaff, setLoadingStaff]     = useState(true);
  const [convActiva, setConvActiva]         = useState<string | null>(null);
  const [otroActivo, setOtroActivo]         = useState<OtroUsuario | null>(null);
  const [busqueda, setBusqueda]             = useState("");
  const [iniciando, setIniciando]           = useState<string | null>(null);
  const [tab, setTab]                       = useState<"conversaciones" | "nuevo">("conversaciones");
  const [totalNoLeidos, setTotalNoLeidos]   = useState(0);
  const pusherRef                           = useRef<PusherClient | null>(null);

  // Cargar conversaciones
  const cargarConversaciones = useCallback(async () => {
    try {
      const r = await fetch("/api/chat/conversaciones");
      const d = await r.json();
      const convs = d.conversaciones ?? [];
      setConversaciones(convs);
      setTotalNoLeidos(convs.reduce((a: number, c: ConversacionItem) => a + c.noLeidos, 0));
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // Cargar staff
  const cargarStaff = useCallback(async () => {
    try {
      const r = await fetch("/api/chat/usuarios");
      const d = await r.json();
      setStaff(d.usuarios ?? []);
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    cargarConversaciones();
    cargarStaff();
  }, [cargarConversaciones, cargarStaff]);

  // Pusher — notificaciones de nuevos mensajes
  useEffect(() => {
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    pusherRef.current = pusher;

    const ch = pusher.subscribe(`usuario-${userId}`);
    ch.bind("nueva-notificacion", () => {
      cargarConversaciones();
    });

    return () => {
      ch.unbind_all();
      pusher.unsubscribe(`usuario-${userId}`);
      pusher.disconnect();
    };
  }, [userId, cargarConversaciones]);

  // Iniciar o abrir conversación con un usuario del staff
  const abrirConConvExistente = (conv: ConversacionItem) => {
    setConvActiva(conv.id);
    setOtroActivo(conv.otro);
  };

  const iniciarConversacion = async (usuario: OtroUsuario) => {
    setIniciando(usuario.id);
    try {
      const r = await fetch("/api/chat/conversaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinatarioId: usuario.id }),
      });
      const d = await r.json();
      if (!r.ok) return;
      setConvActiva(d.conversacionId);
      setOtroActivo(usuario);
      setTab("conversaciones");
      cargarConversaciones();
    } finally {
      setIniciando(null);
    }
  };

  const staffFiltrado = staff.filter((u) =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    ROL_LABEL[u.rol]?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── Vista con conversación abierta ──
  if (convActiva && otroActivo) {
    return (
      <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
        <ChatWindow
          conversacionId={convActiva}
          userId={userId}
          otroUsuario={otroActivo}
          onBack={() => {
            setConvActiva(null);
            setOtroActivo(null);
            cargarConversaciones();
          }}
        />
      </div>
    );
  }

  // ── Lista de conversaciones ──
  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)]">Mensajes</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Comunícate con admins y docentes
          </p>
        </div>
        {totalNoLeidos > 0 && (
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
            {totalNoLeidos}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-[var(--bg-card)] p-1.5">
        {[
          { id: "conversaciones", label: "Conversaciones" },
          { id: "nuevo",          label: "Nuevo mensaje" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-semibold transition",
              tab === t.id
                ? "bg-blue-600 text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Conversaciones ── */}
      {tab === "conversaciones" && (
        <div className="space-y-2">
          {loadingConvs ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : conversaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20">
                <MessageSquare className="h-7 w-7 text-blue-400" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Sin conversaciones</p>
              <p className="text-xs text-[var(--text-muted)]">
                Inicia un nuevo mensaje con un admin o docente.
              </p>
              <button
                onClick={() => setTab("nuevo")}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Nuevo mensaje
              </button>
            </div>
          ) : (
            conversaciones.map((conv) => (
              <button
                key={conv.id}
                onClick={() => abrirConConvExistente(conv)}
                className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-[var(--bg-card)] px-4 py-3.5 hover:border-blue-500/40 hover:bg-blue-500/5 transition text-left"
              >
                <div className="relative">
                  <Avatar nombre={conv.otro.nombre} imagen={conv.otro.imagen} rol={conv.otro.rol} />
                  {conv.noLeidos > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                      {conv.noLeidos > 9 ? "9+" : conv.noLeidos}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-sm font-bold truncate", conv.noLeidos > 0 ? "text-white" : "text-[var(--text-primary)]")}>
                      {conv.otro.nombre}
                    </p>
                    {conv.ultimoMensajeEn && (
                      <p className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {fmtHora(conv.ultimoMensajeEn)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {ROL_LABEL[conv.otro.rol] ?? conv.otro.rol}
                  </p>
                  {conv.ultimoMensaje && (
                    <p className={cn(
                      "text-xs truncate mt-0.5",
                      conv.noLeidos > 0 ? "text-blue-300 font-medium" : "text-[var(--text-muted)]"
                    )}>
                      {conv.ultimoMensaje}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
              </button>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Nuevo mensaje ── */}
      {tab === "nuevo" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar admin o docente..."
              className="w-full rounded-2xl border border-white/10 bg-[var(--bg-card)] pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {loadingStaff ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : staffFiltrado.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-gray-700" />
              <p className="text-sm text-gray-500">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="space-y-2">
              {staffFiltrado.map((u) => (
                <button
                  key={u.id}
                  onClick={() => iniciarConversacion(u)}
                  disabled={iniciando === u.id}
                  className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-[var(--bg-card)] px-4 py-3.5 hover:border-blue-500/40 hover:bg-blue-500/5 transition text-left disabled:opacity-60"
                >
                  <Avatar nombre={u.nombre} imagen={u.imagen} rol={u.rol} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{u.nombre}</p>
                    <p className="text-xs text-[var(--text-muted)]">{ROL_LABEL[u.rol] ?? u.rol}</p>
                  </div>
                  {iniciando === u.id
                    ? <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}