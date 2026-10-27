import { z } from "zod";

export const ID_OCUPACIONES = [
  "almacen",
  "atencion_telefonica",
  "caja_comercial",
  "caja_financiera",
  "housekeeping",
  "lavanderia",
  "limpieza",
  "salon_comidas",
  "trabajador_hogar",
] as const;

export const URL_CAPACITA_T = "https://capacitacionlaboral.trabajo.gob.pe/";

export const esquemaElemento = z.object({
  id: z.string().regex(/^[A-Z]\d{7}-\d+-E\d+$/),
  texto: z.string().min(10),
});

export const esquemaEstandar = z.object({
  codigo: z.string().regex(/^[A-Z]\d{7}-\d+$/),
  rol: z.enum(["operativo", "supervisor"]),
  descripcion: z.string().min(10),
  elementos: z.array(esquemaElemento).min(1),
});

export const esquemaOcupacion = z.object({
  id: z.enum(ID_OCUPACIONES),
  codigo: z.string().regex(/^[A-Z]\d{7}$/),
  nombre: z.string().min(3),
  nombreCorto: z.string().min(3),
  puestos: z.array(z.string().min(2)).min(1),
  proposito: z.string().min(20),
  norma: z.string().min(5),
  pdf: z.string().regex(/^fuentes\/perfiles\/[a-z_]+_[A-Z]\d{7}\.pdf$/),
  estandares: z.array(esquemaEstandar).min(1),
  demanda: z.object({
    nivel: z.enum(["alta", "media", "baja"]),
    tipo: z.literal("referencial"),
  }),
});

export const esquemaOcupaciones = z.array(esquemaOcupacion).length(9);

export const esquemaCompetencia = z.object({
  id: z.string().regex(/^C\d{2}$/),
  nombre: z.string().min(3),
  tipo: z.enum(["tecnica", "transversal"]),
  descripcionSencilla: z.string().min(10),
  palabrasClave: z.array(z.string().regex(/^[a-z]+( [a-z]+)*$/)).min(1),
});

export const esquemaCompetencias = z.array(esquemaCompetencia).length(30);

export const esquemaMapeo = z.record(z.string(), z.record(z.string(), z.array(z.string()).min(1)));

export const esquemaCurso = z.object({
  tema: z.string().min(3),
  url: z.literal(URL_CAPACITA_T),
  horasReferenciales: z.number().int().min(4).max(10),
});

export const esquemaCursos = z.record(z.string(), esquemaCurso);

export const esquemaContexto = z.object({
  informalidadNacional: z.number().min(0).max(100),
  periodo: z.string().min(5),
  anterior: z.number().min(0).max(100),
  fuente: z.string().min(10),
});

export type Elemento = z.infer<typeof esquemaElemento>;
export type Estandar = z.infer<typeof esquemaEstandar>;
export type Ocupacion = z.infer<typeof esquemaOcupacion>;
export type Competencia = z.infer<typeof esquemaCompetencia>;
export type Mapeo = z.infer<typeof esquemaMapeo>;
export type Curso = z.infer<typeof esquemaCurso>;
export type Cursos = z.infer<typeof esquemaCursos>;
export type Contexto = z.infer<typeof esquemaContexto>;
