export class InscripcionCarrera {
    id: number;
    id_alumno: number;
    id_carrera_abierta: number;
    fecha: string;
}
export class Cursada {
    id: number;
    id_materia: number;
    id_profesor: number;
    año: number;
    fecha_inicio: string;
    fecha_limite: string;
}
