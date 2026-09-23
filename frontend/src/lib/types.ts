/** Tipos espejo de los schemas del backend FastAPI (Fase 2). */

export interface SolicitanteIngreso {
  rut: string;
  nombres: string;
  email: string;
}

export interface PredioIngreso {
  rol_sii: string;
  direccion: string;
}

export interface SolicitudIngreso {
  solicitante: SolicitanteIngreso;
  predio: PredioIngreso;
  id_tipo: number;
}

export interface SolicitudOut {
  id: number;
  numero_ingreso: string;
  estado_actual: string;
  id_solicitante: number;
  id_predio: number;
  id_tipo: number;
  fecha_creacion: string | null;
}

export interface BandejaItem {
  id: number;
  numero_ingreso: string;
  estado_actual: string;
  fecha_creacion: string | null;
  id_tipo: number;
  tipo_tramite: string;
  depto_responsable: string;
  solicitante_rut: string;
  solicitante_nombres: string;
  solicitante_email: string;
  predio_rol_sii: string;
  predio_direccion: string;
}

export interface TipoTramite {
  id: number;
  nombre: string;
  depto_responsable: string;
}

export interface FaseTramite {
  id: number;
  id_tipo: number;
  orden: number;
  nombre_fase: string;
  responsable: string | null;
  descripcion: string | null;
}

export interface Documento {
  id: number;
  id_solicitud: number;
  tipo_documento: string;
  ruta_archivo: string;
  fecha_subida: string | null;
}

export interface Funcionario {
  id: number;
  rut: string;
  departamento: string;
  rol: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  rol: "funcionario";
  funcionario: Funcionario;
}

export const ESTADOS_VALIDOS = [
  "Ingresado",
  "En Revisión",
  "En Corrección",
  "Aprobado",
  "Rechazado",
  "Finalizado",
] as const;