// components/admin/AdminMensajesClient.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PusherClient from "pusher-js";
import { cn } from "@/lib/utils";
import { ChatWindow } from "@/components/shared/ChatWindow";
import {
  MessageSquare, Search, Loader2, ChevronRight, Users,
} from "lucide-react";

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
  ADMIN:      "Administrador",
  DOCENTE:    "Docente",
  ESTUDIANTE: "Estudiante",
};

const ROL_COLOR: Record<string, string> = {
  ADMIN:      "bg-purple-500",
  DOCENTE:    "bg-blue-500",
  ESTUDIANTE: "bg-green-500",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function fmtHora(iso: string) {
  const d   = new Date(iso);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) {
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function Avatar({ nombre, imagen, rol, size = "md" }: {
  nombre: string; imagen: string | null; rol: string; size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  const bg  = ROL_COLOR[rol] ?? "bg-gray-500";
  if (imagen) {
    return (
      <img src={imagen} alt={nombre}
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

export function AdminMensajesClient({ userId }: { userId: string }) {
  const [conversaciones, setConversaciones] = useState<ConversacionItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [convActiva, setConvActiva]         = useState<string | null>(null);
  const [otroActivo, setOtroActivo]         = useState<OtroUsuario | null>(null);
  const [busqueda, setBusqueda]             = useState("");
  const [filtroRol, setFiltroRol]           = useState<"todos" | "ESTUDIANTE" | "ADMIN" | "DOCENTE">("todos");
  const [totalNoLeidos, setTotalNoLeidos]   = useState(0);
  const pusherRef                           = useRef<PusherClient | null>(null);

  const cargarConversaciones = useCallback(async () => {
    try {
      const r = await fetch("/api/chat/conversaciones");
      const d = await r.json();
      const convs = d.conversaciones ?? [];
      setConversaciones(convs);
      setTotalNoLeidos(convs.reduce((a: number, c: ConversacionItem) => a + c.noLeidos, 0));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarConversaciones(); }, [cargarConversaciones]);

  // Pusher — recibir notificaciones
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

  const convsFiltradas = conversaciones.filter((c) => {
    const matchBusqueda = !busqueda ||
      c.otro.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchRol = filtroRol === "todos" || c.otro.rol === filtroRol;
    return matchBusqueda && matchRol;
  });

  const noLeidosTotal = conversaciones.reduce((a, c) => a + c.noLeidos, 0);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── Panel izquierdo — Lista ── */}
      <div className={cn(
        "flex flex-col border-r border-white/10 bg-[var(--bg-card)]",
        "w-full lg:w-80 shrink-0",
        convActiva ? "hidden lg:flex" : "flex"
      )}>

        {/* Header */}
        <div className="border-b border-white/10 px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-extrabold text-[var(--text-primary)]">Mensajes</h1>
            {noLeidosTotal > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                {noLeidosTotal}
              </span>
            )}
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-xl border border-white/10 bg-[var(--bg-secondary)] pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Filtro por rol */}
          <div className="flex gap-1">
            {[
              { id: "todos",      label: "Todos" },
              { id: "ESTUDIANTE", label: "Estudiantes" },
              { id: "DOCENTE",    label: "Docentes" },
              { id: "ADMIN",      label: "Admins" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroRol(f.id as any)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition",
                  filtroRol === f.id
                    ? "bg-blue-600 text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : convsFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <MessageSquare className="h-8 w-8 text-gray-700" />
              <p className="text-xs font-semibold text-gray-500">
                {conversaciones.length === 0
                  ? "Aún no tienes conversaciones"
                  : "Sin resultados"}
              </p>
            </div>
          ) : (
            convsFiltradas.map((conv) => (
              <button
                key={conv.id}
                onClick={() => { setConvActiva(conv.id); setOtroActivo(conv.otro); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 text-left transition",
                  convActiva === conv.id
                    ? "bg-blue-600/15 border-l-2 border-l-blue-500"
                    : "hover:bg-white/[0.03]"
                )}
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
                    <p className={cn(
                      "text-sm font-bold truncate",
                      conv.noLeidos > 0 ? "text-white" : "text-[var(--text-primary)]"
                    )}>
                      {conv.otro.nombre}
                    </p>
                    {conv.ultimoMensajeEn && (
                      <p className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {fmtHora(conv.ultimoMensajeEn)}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
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
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Panel derecho — Conversación activa ── */}
      <div className={cn(
        "flex-1 flex flex-col",
        !convActiva ? "hidden lg:flex" : "flex"
      )}>
        {convActiva && otroActivo ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20">
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <p className="text-base font-bold text-[var(--text-primary)]">
                Selecciona una conversación
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
                Elige un chat de la lista para ver los mensajes y responder.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}