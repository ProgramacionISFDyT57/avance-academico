import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Cursada } from '../modelos/modelo-cursada';

export class CursadasController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.crear_cursada = this.crear_cursada.bind(this);
        this.listar_cursadas_aprobadas = this.listar_cursadas_aprobadas.bind(this);

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
    public listar_cursadas_aprobadas(req: Request, res: Response) {
        const id = req.params.id;
        this.db.manyOrNone(`select materias.nombre  from avance_academico
        inner join incripciones_cursadas on inscripciones_cursadas.id = avance_academico.id_incripcion_cursada
        inner join alumnos on alumnos.id  = incripciones_cursadas.id_alumno
        inner join usuarios on usuarios.id = alumnos.id_usuario
        where
        nota_cuat_1 > 4 and nota_cuat_2  > 4 and asistencia >= 60 or
        nota_cuat_1 < 4 and nota_recuperatorio >  4 and nota_cuat_2 >  4  and asistencia >= 60  or
        nota_cuat_1 > 4 and nota_cuat_2 < 4 and nota_ recuperatorio > 4 and asistencia >= 60
        `, [id])

            .then(resultado => {
                res.json(resultado);
                data: resultado;

            })
            .catch(err => {
                console.log('error' + err);
            });
    }

}