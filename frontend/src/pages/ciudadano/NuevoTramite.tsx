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
  uso_suelo: string;
  superficie: string;
  descripcion_proyecto: string;
  profesional: string;
}

const INICIAL: Formulario = {
  rut: "",
  nombres: "",
  email: "",
  rol_sii: "",
  direccion: "",
  id_tipo: "",
  uso_suelo: "Residencial / Habitacional",
  superficie: "",
  descripcion_proyecto: "",
  profesional: "",
};

export default function NuevoTramite() {
  const [form, setForm] = useState<Formulario>(INICIAL);
  const [deptoSeleccionado, setDeptoSeleccionado] = useState("");
  const [archivos, setArchivos] = useState<{file: File, tipo: string}[]>([]);
  const [tipoAdjuntoActual, setTipoAdjuntoActual] = useState("Planos");
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
    const files = Array.from(e.target.files ?? []);
    if (files.some(f => !f.name.toLowerCase().endsWith(".pdf"))) {
      setError("Solo se permiten archivos PDF.");
      e.target.value = "";
      return;
    }
    setArchivos((prev) => [...prev, ...files.map(file => ({ file, tipo: tipoAdjuntoActual }))]);
    setError(null);
    e.target.value = "";
  };

  const eliminarArchivo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
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

      if (archivos.length > 0) {
        let errores = 0;
        for (const file of archivos) {
          const formData = new FormData();
          formData.append("id_solicitud", String(res.id));
          formData.append("tipo_documento", file.tipo);
          formData.append("archivo", file.file);
          try {
            await api.postForm<Documento>("/documentos/upload", formData);
          } catch {
            errores++;
          }
        }
        setDocEstado(errores === 0 ? "ok" : "err");
      }

      setArchivos([]);
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
          <p className="font-semibold">Trámite ingresado correctamente</p>
          <p className="mt-1">
            Su número de ingreso es{" "}
            <span className="font-mono font-bold text-emerald-900">{resultado.numero_ingreso}</span>.
            Puede hacer seguimiento con este folio.
          </p>
          {docEstado === "ok" && (
            <p className="mt-1">Documentos adjuntos subidos correctamente.</p>
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
          El trámite se creó (folio{" "}
          <span className="font-mono font-bold">{resultado.numero_ingreso}</span>), pero algunos o todos los PDFs no
          se pudieron subir. Acuda a la DOM o contacte soporte.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
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
            3 · Departamento, trámite y formulario en línea
          </legend>
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                1. Seleccionar Departamento Destino <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClase}
                value={deptoSeleccionado}
                onChange={(e) => {
                  const depto = e.target.value;
                  setDeptoSeleccionado(depto);
                  const filtrados = tipos.filter(t => t.depto_responsable === depto);
                  if (filtrados.length > 0) {
                    setForm(f => ({ ...f, id_tipo: String(filtrados[0].id) }));
                  } else {
                    setForm(f => ({ ...f, id_tipo: "" }));
                  }
                }}
                required
              >
                <option value="">-- Seleccione el departamento municipal --</option>
                {Array.from(new Set(tipos.map(t => t.depto_responsable))).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {deptoSeleccionado && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  2. Tipo de trámite ({deptoSeleccionado}) <span className="text-red-500">*</span>
                </label>
                <select
                  className={inputClase}
                  value={form.id_tipo}
                  onChange={setCampo("id_tipo")}
                  required
                >
                  <option value="">-- Seleccione el tipo de trámite --</option>
                  {tipos
                    .filter(t => t.depto_responsable === deptoSeleccionado)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Formulario dinámico para rellenar en la misma página */}
            {deptoSeleccionado && form.id_tipo && (
              <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50/60 p-5 space-y-4">
                <div className="border-b border-sky-200 pb-2">
                  <h4 className="text-sm font-bold text-sky-950">
                    Formulario oficial: {tipos.find(t => String(t.id) === form.id_tipo)?.nombre}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Complete los campos requeridos para este expediente directamente en la plataforma.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Uso de suelo / Destino principal
                    </label>
                    <select
                      className={inputClase}
                      value={form.uso_suelo}
                      onChange={setCampo("uso_suelo")}
                    >
                      <option value="Residencial / Habitacional">Residencial / Habitacional</option>
                      <option value="Comercial / Servicios">Comercial / Servicios</option>
                      <option value="Equipamiento Comunitario">Equipamiento Comunitario</option>
                      <option value="Industrial / Bodegaje">Industrial / Bodegaje</option>
                      <option value="Espacio Público / Vial">Espacio Público / Vial</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Superficie a edificar o intervenir (m²)
                    </label>
                    <input
                      className={inputClase}
                      placeholder="Ej: 140.5"
                      value={form.superficie}
                      onChange={setCampo("superficie")}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Profesional competente responsable (Arquitecto / Ingeniero)
                  </label>
                  <input
                    className={inputClase}
                    placeholder="Nombre completo y RUT del profesional patrocinante"
                    value={form.profesional}
                    onChange={setCampo("profesional")}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Memoria descriptiva y justificación técnica del proyecto
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Detalle el alcance de la obra, modificaciones estructurales o antecedentes relevantes..."
                    value={form.descripcion_proyecto}
                    onChange={(e) => setForm(f => ({ ...f, descripcion_proyecto: e.target.value }))}
                  />
                </div>
              </div>
            )}


            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Documentos adjuntos (PDF)
              </label>
              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={tipoAdjuntoActual}
                    onChange={(e) => setTipoAdjuntoActual(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Formulario MINVU">Formulario MINVU</option>
                    <option value="Planos">Planos de Arquitectura/Especialidades</option>
                    <option value="Certificados">Certificados Anexos</option>
                    <option value="Otro">Otro Documento</option>
                  </select>
                  
                  <label className="flex-1 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700">
                    <span className="flex items-center gap-2">
                      Seleccionar PDFs
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      onChange={manejarArchivo}
                      className="hidden"
                    />
                  </label>
                </div>
                
                                {archivos.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {archivos.map((item, i) => (
                      <li key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                        <div>
                          <span className="font-semibold text-slate-700 mr-2">[{item.tipo}]</span>
                          <span className="truncate max-w-[150px] inline-block align-bottom" title={item.file.name}>{item.file.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{(item.file.size / 1024).toFixed(0)} KB</span>
                          <button
                            type="button"
                            onClick={() => eliminarArchivo(i)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Los PDFs se suben al servidor al ingresar el trámite y quedan disponibles para la
                revisión de la DOM. Puedes seleccionar varios.
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