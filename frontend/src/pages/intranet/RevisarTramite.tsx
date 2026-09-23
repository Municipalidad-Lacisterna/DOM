import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EstadoBadge from "../../components/EstadoBadge";
import VisorPDF from "../../components/VisorPDF";
import { api } from "../../lib/api";
import type {
  BandejaItem,
  Documento,
  FaseTramite,
  SolicitudOut,
  TipoTramite,
} from "../../lib/types";

type Aviso = { tipo: "ok" | "err"; texto: string } | null;

/**
 * Vista de revisión del funcionario (Fase 4).
 * Muestra los datos del trámite + visor PDF + acciones condicionales
 * según el estado de la solicitud.
 */
export default function RevisarTramite() {
  const { id } = useParams<{ id: string }>();
  const solicitudId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  // Optimización: si venimos de la bandeja, usar el item sin refetch
  const inicial = (location.state as { item?: BandejaItem } | null)?.item;

  const [solicitud, setSolicitud] = useState<BandejaItem | null>(inicial ?? null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [fases, setFases] = useState<FaseTramite[]>([]);
  const [cargando, setCargando] = useState(!inicial);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [mostrarObs, setMostrarObs] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  // ── Estado de edición del trámite ────────────────────────────────
  const [editando, setEditando] = useState(false);
  const [tipos, setTipos] = useState<TipoTramite[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    rut: "",
    nombres: "",
    email: "",
    rol_sii: "",
    direccion: "",
    id_tipo: 0,
  });

  // ── Cargar detalle de la solicitud (si no vino desde la bandeja) ──
  const cargarSolicitud = useCallback(() => {
    api
      .get<BandejaItem>(`/solicitudes/${solicitudId}`)
      .then((s) => {
        setSolicitud(s);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [solicitudId]);

  useEffect(() => {
    if (!inicial) cargarSolicitud();
  }, [inicial, cargarSolicitud]);

  // ── Cargar documentos adjuntos ──────────────────────────────────
  useEffect(() => {
    api
      .get<Documento[]>(`/documentos/solicitud/${solicitudId}`)
      .then(setDocumentos)
      .catch(() => setDocumentos([]));
  }, [solicitudId]);

  // ── Cargar fases del flujo del tipo de trámite ──────────────────
  useEffect(() => {
    if (!solicitud?.id_tipo) return;
    api
      .get<FaseTramite[]>(`/tipos-tramite/${solicitud.id_tipo}/fases`)
      .then(setFases)
      .catch(() => setFases([]));
  }, [solicitud?.id_tipo]);

  // ── Cargar catálogo de tipos al abrir el editor ──────────────────
  useEffect(() => {
    if (!editando) return;
    api
      .get<TipoTramite[]>("/tipos-tramite")
      .then(setTipos)
      .catch(() => setTipos([]));
  }, [editando]);

  // ── Cambiar estado (PUT /solicitudes/{id}/estado) ────────────────
  const cambiarEstado = async (estadoNuevo: string, observacionesEnvio?: string) => {
    setEnviando(true);
    setAviso(null);
    try {
      const res = await api.put<SolicitudOut>(`/solicitudes/${solicitudId}/estado`, {
        estado_nuevo: estadoNuevo,
        observaciones: observacionesEnvio ?? null,
      });
      setSolicitud((s) => (s ? { ...s, estado_actual: res.estado_actual } : s));
      setMostrarObs(false);
      setObservaciones("");
      setAviso({ tipo: "ok", texto: `Trámite actualizado a "${res.estado_actual}".` });
    } catch (e) {
      setAviso({ tipo: "err", texto: e instanceof Error ? e.message : "Error inesperado" });
    } finally {
      setEnviando(false);
    }
  };

  // ── Abrir editor con los datos actuales ──────────────────────────
  const abrirEditor = () => {
    if (!solicitud) return;
    setForm({
      rut: solicitud.solicitante_rut,
      nombres: solicitud.solicitante_nombres,
      email: solicitud.solicitante_email,
      rol_sii: solicitud.predio_rol_sii,
      direccion: solicitud.predio_direccion,
      id_tipo: solicitud.id_tipo,
    });
    setAviso(null);
    setEditando(true);
  };

  // ── Guardar edición (PUT /solicitudes/{id}) ──────────────────────
  const guardarEdicion = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await api.put<BandejaItem>(`/solicitudes/${solicitudId}`, {
        solicitante: {
          rut: form.rut.trim(),
          nombres: form.nombres.trim(),
          email: form.email.trim(),
        },
        predio: {
          rol_sii: form.rol_sii.trim(),
          direccion: form.direccion.trim(),
        },
        id_tipo: Number(form.id_tipo),
      });
      setSolicitud(res);
      setEditando(false);
      setAviso({ tipo: "ok", texto: "Trámite editado correctamente." });
    } catch (e) {
      setAviso({ tipo: "err", texto: e instanceof Error ? e.message : "Error inesperado" });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <p className="text-sm text-slate-400">Cargando trámite…</p>;

  if (error && !solicitud) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        ⚠️ {error}
      </div>
    );
  }

  if (!solicitud) return null;

  const Fila = ({ etiqueta, valor }: { etiqueta: string; valor: string }) => (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <span className="text-slate-500">{etiqueta}</span>
      <span className="text-right font-medium text-slate-800">{valor}</span>
    </div>
  );

  const enRevision = solicitud.estado_actual === "En Revisión";
  const ingresado = solicitud.estado_actual === "Ingresado";

  // Mapear estado actual → índice de fase activa (0 = primera fase)
  const indiceFaseActiva = (() => {
    if (fases.length === 0) return -1;
    switch (solicitud.estado_actual) {
      case "Aprobado":
      case "Finalizado":
        return fases.length - 1;
      case "En Revisión":
        return Math.min(1, fases.length - 1);
      case "En Corrección":
        return 0;
      default:
        return 0;
    }
  })();

  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={() => navigate("/intranet/bandeja")}
        className="mb-4 text-sm text-slate-500 hover:text-slate-800"
      >
        ← Volver a la bandeja
      </button>

      {/* Avisos */}
      {aviso && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            aviso.tipo === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {aviso.tipo === "ok" ? "✅" : "⚠️"} {aviso.texto}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Columna izquierda: datos ─────────────────────────────── */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900">{solicitud.tipo_tramite}</h1>
                <p className="font-mono text-xs text-slate-500">{solicitud.numero_ingreso}</p>
              </div>
              <EstadoBadge estado={solicitud.estado_actual} />
            </div>
            <div className="px-6 py-4">
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Solicitante
              </h2>
              <Fila etiqueta="Nombre" valor={solicitud.solicitante_nombres} />
              <Fila etiqueta="RUT" valor={solicitud.solicitante_rut} />
              <Fila etiqueta="Email" valor={solicitud.solicitante_email} />

              <h2 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Predio
              </h2>
              <Fila etiqueta="Rol SII" valor={solicitud.predio_rol_sii} />
              <Fila etiqueta="Dirección" valor={solicitud.predio_direccion} />

              <h2 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Trámite
              </h2>
              <Fila etiqueta="Departamento" valor={solicitud.depto_responsable} />
              <Fila
                etiqueta="Ingresado"
                valor={
                  solicitud.fecha_creacion
                    ? new Date(solicitud.fecha_creacion).toLocaleString("es-CL")
                    : "—"
                }
              />
            </div>
          </div>

          {/* ── Acciones según estado ──────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Acciones</h2>

            <button
              onClick={() => (editando ? setEditando(false) : abrirEditor())}
              disabled={enviando || guardando}
              className="mb-3 w-full rounded-lg border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {editando ? "✕ Cancelar edición" : "✏️ Editar trámite"}
            </button>

            {ingresado && (
              <button
                onClick={() => cambiarEstado("En Revisión")}
                disabled={enviando}
                className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                📥 Tomar en revisión
              </button>
            )}

            {enRevision && (
              <div className="space-y-2.5">
                <button
                  onClick={() => cambiarEstado("Aprobado")}
                  disabled={enviando}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  ✅ Aprobar trámite
                </button>
                <button
                  onClick={() => setMostrarObs(true)}
                  disabled={enviando}
                  className="w-full rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  📝 Emitir observaciones
                </button>
              </div>
            )}

            {/* Panel de observaciones (Emitir observaciones) */}
            {mostrarObs && (
              <div className="mt-3 space-y-3 rounded-lg border border-orange-200 bg-orange-50/50 p-4">
                <label className="block text-sm font-medium text-slate-700">
                  Observaciones para el ciudadano
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={4}
                    placeholder="Ej: Falta el plano de emplazamiento firmado por el arquitecto…"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => cambiarEstado("En Corrección", observaciones)}
                    disabled={enviando || !observaciones.trim()}
                    className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {enviando ? "Enviando…" : "Enviar al ciudadano"}
                  </button>
                  <button
                    onClick={() => {
                      setMostrarObs(false);
                      setObservaciones("");
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* ── Editor de datos del trámite ─────────────────────── */}
            {editando && (
              <div className="mt-3 space-y-3 rounded-lg border border-sky-200 bg-sky-50/50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Editar datos del trámite
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    RUT del solicitante
                    <input
                      value={form.rut}
                      onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
                      placeholder="11111111-1"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Nombre completo
                    <input
                      value={form.nombres}
                      onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
                      placeholder="Nombre Apellido"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                    Email del solicitante
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="correo@ejemplo.cl"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Rol SII del predio
                    <input
                      value={form.rol_sii}
                      onChange={(e) => setForm((f) => ({ ...f, rol_sii: e.target.value }))}
                      placeholder="1234-5"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Dirección del predio
                    <input
                      value={form.direccion}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, direccion: e.target.value }))
                      }
                      placeholder="Av. Ejemplo 123"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                    Tipo de trámite
                    <select
                      value={form.id_tipo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, id_tipo: Number(e.target.value) }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    >
                      {tipos.length === 0 && <option value={0}>Cargando tipos…</option>}
                      {tipos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre} — {t.depto_responsable}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={guardarEdicion}
                    disabled={
                      guardando || !form.rut.trim() || !form.nombres.trim() || !form.email.trim()
                    }
                    className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {guardando ? "Guardando…" : "💾 Guardar cambios"}
                  </button>
                  <button
                    onClick={() => setEditando(false)}
                    disabled={guardando}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Columna derecha: documentos ──────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Documentos adjuntos</h2>
          {documentos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              Esta solicitud no tiene documentos subidos todavía.
            </div>
          ) : (
            documentos.map((doc) => (
              <VisorPDF key={doc.id} documentoId={doc.id} nombre={doc.tipo_documento} />
            ))
          )}
        </div>
      </div>

      {/* ── Flujo del trámite (fases del tipo) ───────────────────── */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Flujo del trámite</h2>
        {fases.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No hay un flujo definido para este tipo de trámite.
          </p>
        ) : (
          <ol className="mt-4 space-y-0">
            {fases.map((f, i) => {
              const completada = i < indiceFaseActiva;
              const activa = i === indiceFaseActiva;
              return (
                <li key={f.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < fases.length - 1 && (
                    <span
                      className={`absolute left-[13px] top-6 h-full w-0.5 ${
                        i < indiceFaseActiva ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                    />
                  )}
                  <span
                    className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      completada
                        ? "bg-emerald-500 text-white"
                        : activa
                          ? "bg-amber-500 text-white ring-4 ring-amber-100"
                          : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {completada ? "✓" : i + 1}
                  </span>
                  <div className="pt-0.5">
                    <p
                      className={`text-sm font-medium ${
                        completada || activa ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {f.nombre_fase}
                    </p>
                    {f.responsable && (
                      <p className="text-xs text-slate-500">{f.responsable}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}