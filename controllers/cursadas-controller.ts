import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Cursada } from '../modelos/modelo-cursada';
import { Avance } from '../modelos/modelo-avance-academico';

export class CursadasController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.crear_cursada = this.crear_cursada.bind(this);
        this.crear_avance = this.crear_avance.bind(this);

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

    public crear_avance(req: Request, res: Response) {
        const avance: Avance = req.body.avance_academico;
        if (avance.nota_cuat_1 > 4 && avance.nota_cuat_2 > 4 && avance.nota_recuperatorio != null) {
            res.status(400).json({
                mensaje: 'No es posible tener Nota-Recuperatorio con los do2 cuatrimestres aprovados.'
            })
        }
        if (avance.nota_cuat_1 < 4 && avance.nota_cuat_2 < 4 && avance.nota_recuperatorio != null) {
            res.status(400).json({
                mensaje: 'No es posible tener Nota-Recuperatorio con los do2 cuatrimestres desaprovados.'
            })
        }
        if (avance.nota_cuat_1 % 1 !== 0 || avance.nota_cuat_2 % 1 !== 0 || avance.nota_recuperatorio % 1 !== 0) {
            res.status(400).json({
                mensaje: 'Las notas deben ser Numeros Enteros'
            })
        }
        if (avance.nota_cuat_1 < 0 || avance.nota_cuat_2 < 0 || avance.nota_recuperatorio < 0 || avance.nota_recuperatorio > 10 || avance.nota_cuat_1 > 10 || avance.nota_cuat_2 > 10) {
            res.status(400).json({
                mensaje: 'Las notas deben ser entre 1 y 10'
            })
        }

        this.db.one(`INSERT INTO avance_academico (id_inscripcion_cursada, nota_cuat_1, nota_cuat_2, nota_recuperatorio, asistencia) 
        VALUES ($1, $2, $3, $4, $5) RETURNING ID`,
            [avance.id_inscripcion_cursada, avance.nota_cuat_1, avance.nota_cuat_2, avance.nota_recuperatorio, avance.asistencia])
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
}