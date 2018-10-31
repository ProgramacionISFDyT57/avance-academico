import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Cursada } from '../modelos/modelo-cursada';

export class CursadasController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.crear_cursada = this.crear_cursada.bind(this);
    }
    public crear_cursada(req: Request, res: Response) {
        const cursada: Cursada = req.body.cursada;
        const año = new Date().getFullYear();
        if (cursada.año < año) {
            res.status(400).json({
                mensaje: 'El año no puede ser menor que el año actual',
                datos: null
            });
        } else {
            const fecha_inicio = new Date(cursada.fecha_inicio);
            const fecha_limite = new Date(cursada.fecha_limite);
            if (fecha_inicio > fecha_limite) {
                res.status(400).json({
                    mensaje: 'La fecha de inicio no puede ser superior a la fecha límite',
                    datos: null
                });
            } else {
                const fecha_actual = new Date();
                if (fecha_actual > fecha_limite) {
                    res.status(400).json({
                        mensaje: 'La fecha límite no puede ser menor a la actual',
                        datos: null
                    });
                } else {
                    this.db.oneOrNone(`SELECT id FROM cursadas 
                        WHERE id_materia = $1 AND año = $2`, [cursada.id_materia, cursada.año])
                        .then((data) => {
                            if (data) {
                                res.status(400).json({
                                    mensaje: 'La cursada ya se encuentra abierta para inscripción',
                                    datos: null
                                });
                            } else {
                                this.db.one(`INSERT INTO cursadas (id_materia, id_profesor, año, fecha_inicio, fecha_limite) 
                                VALUES ($1, $2, $3, $4, $5) RETURNING ID`,
                                    [cursada.id_materia, cursada.id_profesor, cursada.año, cursada.fecha_inicio, cursada.fecha_limite])
                                    .then((data) => {
                                        res.status(200).json({
                                            mensaje: null,
                                            datos: data
                                        });
                                    })
                                    .catch((err) => {
                                        res.status(500).json({
                                            mensaje: err,
                                            datos: null
                                        });
                                    });
                            }
                        })
                        .catch((err) => {
                            res.status(500).json({
                                mensaje: err,
                                datos: null
                            });
                        });
                }
            }
        }
    }

    public cursadas_abiertas_alumno(req: Request, res: Response) {
        const id_alumno: number = req.params.id_alumno;
        // Buscar las cursadas abiertas de las carreras donde esta inscripto el alumno 
        // y no la tiene aprobada y si tiene las correlativas o no tiene correlativas
        this.db.manyOrNone(`
            SELECT M.id, M.nombre, M.año FROM materias M
            INNER JOIN cursadas C ON M.id = C.id_materia
            LEFT JOIN correlativas CO ON CO.id_materia = M.id
            WHERE M.id_carrera IN (
                SELECT CA.id_carrera FROM carreras_abiertas CA
                INNER JOIN inscripciones_carreras IC ON IC.id_carrera_abierta = CA.id
                WHERE IC.id_alumno = $1
                )
            AND current_timestamp BETWEEN C.fecha_inicio AND fecha_limite
            AND M.id NOT IN (
                SELECT M.id FROM materias M
                INNER JOIN cursadas C ON c.id_materia = M.id
                INNER JOIN inscripciones_cursadas IC ON IC.id_cursada = C.id
                INNER JOIN avance_academico AA ON AA.id_inscripcion_cursada = IC,id
                INNER JOIN tipos_materias TM ON TM.id = M.id_tipo
                WHERE IC.id_alumno = $1
                AND ( (AA.nota_cuat_1 >= 4 AND AA.nota_cuat_1 >= 4) OR (AA.nota_recuperatorio >= 4 ) )
                AND ( (TM.id = 2 AND AA.asistencia >= 80) OR (TM.id != 2 AND AA.asistencia >= 60) )
                )
            AND ( CO.id_correlativa IN (
                SELECT M.id FROM materias M
                INNER JOIN cursadas C ON c.id_materia = M.id
                INNER JOIN inscripciones_cursadas IC ON IC.id_cursada = C.id
                INNER JOIN avance_academico AA ON AA.id_inscripcion_cursada = IC,id
                INNER JOIN tipos_materias TM ON TM.id = M.id_tipo
                WHERE IC.id_alumno = $1
                AND ( (AA.nota_cuat_1 >= 4 AND AA.nota_cuat_1 >= 4) OR (AA.nota_recuperatorio >= 4 ) )
                AND ( (TM.id = 2 AND AA.asistencia >= 80) OR (TM.id != 2 AND AA.asistencia >= 60) )
                ) 
                OR CO.id_correlativa IS NULL )
            ORDER BY M.nombre`, [id_alumno])
            .then( (data) => {
                res.status(200).json({
                    mensaje: null,
                    datos: data
                });
            })
            .catch((err) => {
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    } 


}