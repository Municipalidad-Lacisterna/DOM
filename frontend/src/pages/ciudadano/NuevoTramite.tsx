import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import {
  type Documento,
  type SolicitanteIngreso,
  type SolicitudIngreso,
  type SolicitudOut,
  type TipoTramite,
} from "../../lib/types";

/**
 * Catálogo de tipos de trámite: se consume desde GET /api/tipos-tramite
 * (Fase 4). Se muestra un skeleton mientras carga la lista.
 */

interface Formulario {
  rut: string;
  nombres: string;
  email: string;
  rol_sii: string;
  direccion: string;
  id_tipo: string;
}

const INICIAL: Formulario = {
  rut: "",
  nombres: "",
  email: "",
  rol_sii: "",
  direccion: "",
  id_tipo: "1",
};

export default function NuevoTramite() {
  const [form, setForm] = useState<Formulario>(INICIAL);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<SolicitudOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docEstado, setDocEstado] = useState<"ok" | "err" | null>(null);

  // ── Catálogo de tipos de trámite (desde el backend) ─────────────────
  const [tipos, setTipos] = useState<TipoTramite[]>([]);
  const [cargandoTipos, setCargandoTipos] = useState(true);

  useEffect(() => {
    let activo = true;
    api
      .get<TipoTramite[]>("/tipos-tramite")
      .then((lista) => {
        if (!activo) return;
        setTipos(lista);
        // Selecciona el primer tipo por defecto si existe
        if (lista.length > 0) {
          setForm((f) => ({ ...f, id_tipo: String(lista[0].id) }));
        }
      })
      .catch((err) => {
        if (!activo) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo");
      })
      .finally(() => {
        if (activo) setCargandoTipos(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const setCampo = (campo: keyof Formulario) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Solo se permiten archivos PDF.");
      e.target.value = "";
      return;
    }
    setArchivo(file);
    setError(null);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultado(null);

    const payload: SolicitudIngreso = {
      solicitante: {
        rut: form.rut,
        nombres: form.nombres,
        email: form.email,
      } satisfies SolicitanteIngreso,
      predio: { rol_sii: form.rol_sii, direccion: form.direccion },
      id_tipo: Number(form.id_tipo),
    };

    setEnviando(true);
    setDocEstado(null);
    try {
      const res = await api.post<SolicitudOut>("/solicitudes/ingreso", payload);
      setResultado(res);
      setForm(INICIAL);

      if (archivo) {
        const formData = new FormData();
        formData.append("id_solicitud", String(res.id));
        formData.append("tipo_documento", "Adjunto ciudadano");
        formData.append("archivo", archivo);
        try {
          await api.postForm<Documento>("/documentos/upload", formData);
          setDocEstado("ok");
        } catch {
          setDocEstado("err");
        }
      }

      setArchivo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setEnviando(false);
    }
  };

  const inputClase =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Nuevo trámite</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete los datos y adjunte la documentación en PDF.
        </p>
      </div>

      {/* Confirmación de éxito */}
      {resultado && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <p className="font-semibold">✅ Trámite ingresado correctamente</p>
          <p className="mt-1">
            Su número de ingreso es{" "}
            <span className="font-mono font-bold text-emerald-900">{resultado.numero_ingreso}</span>.
            Puede hacer seguimiento con este folio.
          </p>
          {docEstado === "ok" && (
            <p className="mt-1">📎 PDF adjunto subido correctamente.</p>
          )}
          <Link
            to={`/estado?folio=${resultado.numero_ingreso}`}
            className="mt-2 inline-block font-semibold text-emerald-900 underline"
          >
            Consultar el estado de mi trámite →
          </Link>
        </div>
      )}

      {/* Aviso: trámite creado pero el PDF no subió */}
      {resultado && docEstado === "err" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ El trámite se creó (folio{" "}
          <span className="font-mono font-bold">{resultado.numero_ingreso}</span>), pero el PDF no
          se pudo subir. Intente adjuntarlo nuevamente o acuda a la DOM.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={enviar} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* ── Datos del solicitante ─────────────────────────────────── */}
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            1 · Datos del solicitante
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                RUT <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClase}
                placeholder="12.345.678-k"
                value={form.rut}
                onChange={setCampo("rut")}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClase}
                placeholder="Juan Pérez González"
                value={form.nombres}
                onChange={setCampo("nombres")}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={inputClase}
                placeholder="juan@correo.cl"
                value={form.email}
                onChange={setCampo("email")}
                required
              />
            </div>
          </div>
        </fieldset>

        {/* ── Datos del predio ──────────────────────────────────────── */}
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            2 · Datos del predio
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Rol SII <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClase}
                placeholder="1234-5"
                value={form.rol_sii}
                onChange={setCampo("rol_sii")}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Dirección <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClase}
                placeholder="Av. Siempre Viva 742"
                value={form.direccion}
                onChange={setCampo("direccion")}
                required
              />
            </div>
          </div>
        </fieldset>

        {/* ── Trámite + adjunto ─────────────────────────────────────── */}
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            3 · Trámite y adjuntos
          </legend>
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tipo de trámite <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClase}
                value={form.id_tipo}
                onChange={setCampo("id_tipo")}
                required
                disabled={cargandoTipos || tipos.length === 0}
              >
                {cargandoTipos ? (
                  <option value="">Cargando catálogo…</option>
                ) : tipos.length === 0 ? (
                  <option value="">Sin tipos disponibles</option>
                ) : (
                  tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} — {t.depto_responsable}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Documentos adjuntos (PDF)
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 transition-colors hover:border-sky-400 hover:bg-sky-50">
                <span className="flex items-center gap-2">
                  📎 {archivo ? archivo.name : "Haga clic para adjuntar un PDF"}
                </span>
                {archivo && (
                  <span className="text-xs text-slate-400">
                    {(archivo.size / 1024).toFixed(0)} KB
                  </span>
                )}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={manejarArchivo}
                  className="hidden"
                />
              </label>
              <p className="mt-1.5 text-xs text-slate-400">
                El PDF se sube al servidor al ingresar el trámite y queda disponible para la
                revisión de la DOM.
              </p>
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={enviando || cargandoTipos || tipos.length === 0}
          className="w-full rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {cargandoTipos
            ? "Cargando catálogo…"
            : enviando
              ? "Enviando…"
              : "Ingresar trámite"}
        </button>
      </form>
    </div>
  );
}