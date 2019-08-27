export class CursadaAlumno {
    id: number;
    fecha_inicio: string;
    fecha_limite: string;
    anio_cursada: number; 
    materia: string;
    anio_materia: number;
    carrera: string;
    profesor: string;
    id_inscripcion_cursada: number;
    nota_cuat_1: number;
    nota_cuat_2: number;
    nota_recuperatorio: number;
    asistencia: number; 
    aprobada?: boolean;
    tipo_materia: string;
}