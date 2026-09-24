import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import EstadoBadge from "../../components/EstadoBadge";
import type { BandejaItem } from "../../lib/types";

export default function ConsultarEstado() {
  const [params] = useSearchParams();
  const [folio, setFolio] = useState(params.get("folio") ?? "");
  const [datos, setDatos] = useState<BandejaItem | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Vuelve a la pantalla anterior; si no hay historial, cae a la Home.
  // No puede rebotar: /estado no redirige a sí mismo.
  const volver = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const consultar = async (e: FormEvent) => {
    e.preventDefault();
    const codigo = folio.trim();
    if (!codigo) return;
    setBuscando(true);
    setError(null);
    setDatos(null);
    try {
      const res = await api.get<BandejaItem>(
        `/solicitudes/estado/${encodeURIComponent(codigo)}`,
      );
      setDatos(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar el trámite");
    } finally {
      setBuscando(false);
    }
  };

  const fecha = datos && datos.fecha_creacion
    ? new Date(datos.fecha_creacion).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const inputClase =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-xl px-4">
        <button
          type="button"
          onClick={volver}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-sky-700"
        >
          ← Volver
        </button>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Consultar estado de mi trámite
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingrese el código de seguimiento que recibió al crear su trámite.
          </p>
        </div>

        <form
          onSubmit={consultar}
          className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <input
            className={inputClase}
            placeholder="DOM-2026-001"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={buscando}
            className="shrink-0 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:bg-slate-300"
          >
            {buscando ? "Consultando…" : "Consultar"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {datos && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Código de seguimiento
                </p>
                <p className="mt-0.5 font-mono text-lg font-bold text-slate-900">
                  {datos.numero_ingreso}
                </p>
              </div>
              <EstadoBadge estado={datos.estado_actual} />
            </div>
            <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tipo de trámite
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">
                  {datos.tipo_tramite}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Departamento
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">
                  {datos.depto_responsable}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Fecha de ingreso
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">{fecha}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Predio
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">
                  {datos.predio_direccion}
                  {datos.predio_rol_sii ? ` · Rol ${datos.predio_rol_sii}` : ""}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-slate-400">
              Guarde bien su código de seguimiento: es su comprobante para consultar el
              estado del trámite en el portal.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Aún no tiene un trámite?{" "}
          <Link
            to="/ciudadano/nuevo-tramite"
            className="font-semibold text-sky-700 underline"
          >
            Ingrese uno nuevo
          </Link>
        </p>
      </div>
    </div>
  );
}