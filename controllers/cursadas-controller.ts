import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Cursada } from '../modelos/modelo-cursada';
import { Avance } from '../modelos/modelo-avance-academico';

export class CursadasController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.crear_cursada = this.crear_cursada.bind(this);
        this.listar_cursadas_aprobadas = this.listar_cursadas_aprobadas.bind(this);
        this.cursadas_abiertas_alumno = this.cursadas_abiertas_alumno.bind(this);
        this.crear_avance = this.crear_avance.bind(this);
    }
    public crear_cursada(req: Request, res: Response) {
        const cursada: Cursada = req.body.cursada;
        const año = new Date().getFullYear();
        if (cursada.año < año) {
            res.status(400).json({
                mensaje: 'El año no puede ser menor que el año actual',
            });
        } else {
            const fecha_inicio = new Date(cursada.fecha_inicio);
            const fecha_limite = new Date(cursada.fecha_limite);
            if (fecha_inicio > fecha_limite) {
                res.status(400).json({
                    mensaje: 'La fecha de inicio no puede ser superior a la fecha límite',
                });
            } else {
                const fecha_actual = new Date();
                if (fecha_actual > fecha_limite) {
                    res.status(400).json({
                        mensaje: 'La fecha límite no puede ser menor a la actual',
                    });
                } else {
                    const query1 = `SELECT id FROM cursadas WHERE id_materia = $1 AND anio = $2`;
                    this.db.oneOrNone(query1, [cursada.id_materia, cursada.año])
                        .then((data) => {
                            if (data) {
                                res.status(400).json({
                                    mensaje: 'La cursada ya se encuentra abierta para inscripción',
                                });
                            } else {
                                const query2 = `INSERT INTO cursadas (id_materia, id_profesor, anio, fecha_inicio, fecha_limite) 
                                    VALUES ($1, $2, $3, $4, $5) RETURNING ID`
                                this.db.one(query2, [cursada.id_materia, cursada.id_profesor, cursada.año, cursada.fecha_inicio, cursada.fecha_limite])
                                    .then((data) => {
                                        res.status(200).json(data);
                                    })
                                    .catch((err) => {
                                        console.error(err);
                                        res.status(500).json(err);
                                    });
                            }
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).json(err);
                        });
                }
            }

        }

    }
    public listar_cursadas_aprobadas(req: Request, res: Response) {
        const id = req.params.id;
        this.db.manyOrNone(`select materias.nombre  from avance_academico aa
            inner join incripciones_cursadas ic on inscripciones_cursadas.id = avance_academico.id_incripcion_cursada
            inner join cursadas c ON c.id_matertia = m.id
            inner join tipos_materias tm ON tm.id = m.id_tipo
            inner join Incripciones_cursadas ic ON ic.id_cursada = c.id
            where ic.id_alumno = $1
            AND ((aa.nota_cuat_1 >=4 and aa.nota_cuat_2 >=4) OR (aa.nota_recuperatorio >=4))
            AND ((tm.id = 2 AND aa.asistencia >= 80) OR (tm.id != 2 AND aa.asistencia >= 60))`, [id])
            .then(resultado => {
                res.status(200).json(resultado);
            })
            .catch(err => {
                console.error(err);
                res.status(200).json({
                    mensaje: err,
                    datos: null
                });
            });
    }
    public cursadas_abiertas_alumno(req: Request, res: Response) {
        const id_alumno: number = req.params.id_alumno;
        // Buscar las cursadas abiertas de las carreras donde esta inscripto el alumno 
        // y no la tiene aprobada y si tiene las correlativas o no tiene correlativas
        this.db.manyOrNone(`
            SELECT M.id, M.nombre, M.anio FROM materias M
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
                res.status(200).json(data);
                })
            .catch((err) => {
                console.error(err);
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    }
    public crear_avance(req: Request, res: Response) {
        const avance: Avance = req.body.avance_academico;
        if (avance.nota_cuat_1 > 4 && avance.nota_cuat_2 > 4 && avance.nota_recuperatorio != null) {
            res.status(400).json({
                mensaje: 'No es posible tener nota de recuperatorio con los dos cuatrimestres aprobados',
                datos: null
            })
        } else if (avance.nota_cuat_1 < 4 && avance.nota_cuat_2 < 4 && avance.nota_recuperatorio != null) {
            res.status(400).json({
                mensaje: 'No es posible tener nota de recuperatorio con los dos cuatrimestres desaprobados',
                datos: null
            })
        } else if (avance.nota_cuat_1 % 1 !== 0 || avance.nota_cuat_2 % 1 !== 0 || avance.nota_recuperatorio % 1 !== 0) {
            res.status(400).json({
                mensaje: 'Las notas deben ser números enteros',
                datos:null
            })
        } else if (avance.nota_cuat_1 < 1 || avance.nota_cuat_2 < 1 || avance.nota_recuperatorio < 1 || avance.nota_recuperatorio > 10 || avance.nota_cuat_1 > 10 || avance.nota_cuat_2 > 10) {
            res.status(400).json({
                mensaje: 'Las notas deben ser entre 1 y 10',
                datos:null
            })
        } else {
            this.db.one(`INSERT INTO avance_academico (id_inscripcion_cursada, nota_cuat_1, nota_cuat_2, nota_recuperatorio, asistencia) 
                VALUES ($1, $2, $3, $4, $5) RETURNING ID`,
                [avance.id_inscripcion_cursada, avance.nota_cuat_1, avance.nota_cuat_2, avance.nota_recuperatorio, avance.asistencia])
                .then((data) => {
                   res.status(200).json(data);
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({
                        mensaje: err,
                        datos: null
                    });
                });
        }
    }

}