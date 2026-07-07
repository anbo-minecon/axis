"use client";

import { useEffect, useState } from "react";

export default function PerfilClient({ user }: { user: any }) {
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [telefono, setTelefono] = useState(user?.telefono ?? "");
  const [protegerDocumento, setProtegerDocumento] = useState(user?.protegerDocumento ?? true);
  const [simulacros, setSimulacros] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/simulacros')
      .then(r => r.json())
      .then(d => {
        const exams = d.examenes || [];
        // Mostrar solo simulacros cerrados y con resultado (completados)
        const cerrados = exams.filter((e: any) => e.estado === 'CERRADO' && e.completado);
        setSimulacros(cerrados);
      })
      .catch(() => {});
  }, []);

  const guardarPerfil = async () => {
    try {
      const res = await fetch('/api/dashboard/mi-perfil', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono, protegerDocumento }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      alert('Perfil guardado');
    } catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4">
        <h3 className="font-bold">Mi perfil</h3>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded border px-3 py-2" />
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className="w-full rounded border px-3 py-2" />
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={protegerDocumento} onChange={(e) => setProtegerDocumento(e.target.checked)} /> Proteger identificación (ocultar en boletín)
          </label>
          <div className="pt-2">
            <button onClick={guardarPerfil} className="rounded bg-blue-600 text-white px-3 py-2">Guardar</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h3 className="font-bold">Boletines disponibles</h3>
        <p className="text-sm text-gray-500">Descarga el boletín de cada simulacro cerrado.</p>
        <div className="mt-3 space-y-2">
          {simulacros.length === 0 && <div className="text-sm text-gray-500">Cargando...</div>}
          {simulacros.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between border p-3 rounded">
              <div>
                <div className="font-semibold">{s.nombre}</div>
                <div className="text-xs text-gray-500">{s.materia} · {s.sesiones?.length ? `${s.sesiones.length} sesiones` : `${s.totalPreguntas} preguntas`}</div>
              </div>
              <div>
                {s.completado && <a className="rounded bg-green-600 text-white px-3 py-1" href={`/api/dashboard/boletin/${s.id}`} target="_blank">Descargar</a>}
                {!s.completado && <div className="text-xs text-gray-400">Disponible al cerrar</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
