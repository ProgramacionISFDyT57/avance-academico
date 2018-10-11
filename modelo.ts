export class TipoMateria {
    id: number;
    nombre: string;
    año: number;
}
export class Materia {
    id: number;
    nombre: string;
    año: number;
    id_carrera: number;
    id_tipo: number;
}
export class Carrera {
    id: number;
    nombre: string;
    duracion: number;
    cantidad_materias: number;
}
export class CarreraAbierta {
    id: number;
    id_carrera: number;
    cohorte: number;
    fecha_inicio: string;
    fecha_limite: string;
}
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