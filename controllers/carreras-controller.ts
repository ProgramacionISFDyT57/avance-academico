import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Carrera } from '../modelos/modelo-carrera';
import { CarreraAbierta } from '../modelos/modelo-carreraabierta';
import { InscripcionCarrera } from '../modelos/modelo-inscripcioncarrera';
export class CarrerasController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.borrar_inscripcion_carrera = this.borrar_inscripcion_carrera.bind(this);
        this.crear_inscripcion_carrera = this.crear_inscripcion_carrera.bind(this);
        this.ver_carreras = this.ver_carreras.bind(this);
        this.ver_carrera = this.ver_carrera.bind(this);
        this.crear_carrera = this.crear_carrera.bind(this);
        this.modificar_carrera = this.modificar_carrera.bind(this);
        this.borrar_carrera = this.borrar_carrera.bind(this);
        this.ver_carreras_abiertas = this.ver_carreras_abiertas.bind(this);
        this.crear_carreras_abiertas = this.crear_carreras_abiertas.bind(this);
    }

    public borrar_inscripcion_carrera(req: Request, res: Response) {
        if (+req.params.id_inscripcion) {
            this.db.none(`DELETE FROM inscripciones_carreras WHERE id = $1`, req.params.id_inscripcion)
                .then(() => {
                    res.json({
                        mensaje: 'Inscripción borrada correctamente',
                        datos: null
                    })
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({
                        mensaje: err.detail,
                        datos: err
                    })
                })
        } else {
            res.status(400).json({
                mensaje: 'Faltan datos',
                datos: null
            })
        }
    }
    public crear_inscripcion_carrera(req: Request, res: Response) {
        const ca: InscripcionCarrera = req.body.inscripcion_carrera;
        this.db.oneOrNone(`SELECT id FROM inscripciones_carreras 
                    WHERE id_alumno = $1 AND id_carrera_abierta = $2`, [ca.id_alumno, ca.id_carrera_abierta])
            .then((data) => {
                if (data) {
                    res.status(400).json({
                        mensaje: 'Ya se encuentra inscripto en la carrera',
                        datos: null
                    });
                } else {
                    this.db.oneOrNone(`
                                SELECT id FROM carreras_abiertas
                                FROM carreras_abiertas CA
                                WHERE CURRENT_TIMESTAMP BETWEEN CA.fecha_inicio AND CA.fecha_limite
                                AND id = $1`, [ca.id_carrera_abierta])
                        .then((data) => {
                            if (data) {
                                this.db.one(`INSERT INTO inscripciones_carreras (id_alumno, id_carrera_abierta) 
                                    VALUES ($1, $2) RETURNING ID`, [ca.id_alumno, ca.id_carrera_abierta])
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
                            } else {
                                res.status(400).json({
                                    mensaje: 'La carrera no se encuentra abierta',
                                    datos: null
                                });
                            }
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).json({
                                mensaje: err,
                                datos: null
                            });
                        });
                }
            })
    }
    public ver_carreras(req: Request, res: Response) {
        const query = `
            SELECT c.id, c.nombre, c.duracion, c.cantidad_materias, COUNT(m.id) AS materias_cargadas
            FROM carreras c
            LEFT JOIN materias m ON m.id_carrera = c.id
            GROUP BY c.id, c.nombre, c.duracion, c.cantidad_materias
            ORDER BY nombre ASC;`
        this.db.manyOrNone(query)
            .then(datos => {
                res.json(datos);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({
                    mensaje: err.detail,
                    datos: err
                })
            })
    }
    public ver_carrera(req: Request, res: Response) {
        const id = req.params.id;
        const query = 'SELECT id, nombre, duracion, cantidad_materias FROM carreras WHERE id = $1;'
        this.db.one(query, id)
            .then(datos => {
                res.json(datos);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            })
    }
    public crear_carrera(req: Request, res: Response) {
        const carrera: Carrera = req.body.carrera;
        this.db.one('INSERT INTO carreras (nombre, duracion, cantidad_materias) VALUES ($1, $2, $3) RETURNING ID;',
            [carrera.nombre, carrera.duracion, carrera.cantidad_materias])
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
    public modificar_carrera(req: Request, res: Response) {
        const id = +req.params.id;
        const carrera: Carrera = req.body.carrera;
        if (id) {
            this.db.none('UPDATE carreras SET nombre = $1, duracion = $2, cantidad_materias = $3 WHERE id = $4', [carrera.nombre, carrera.duracion, carrera.cantidad_materias, id])
                .then(() => {
                    res.status(200).json({
                        mensaje: null,
                        datos: null
                    });
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({
                        mensaje: err,
                        datos: null
                    });
                });
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto',
                datos: null
            });
        }
    }
    public borrar_carrera(req: Request, res: Response) {
        const id = +req.params.id;
        if (id) {
            this.db.none('DELETE FROM carreras WHERE id = $1', [id])
                .then((data) => {
                    res.status(200).json({
                        mensaje: null,
                        datos: data
                    });
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({
                        mensaje: err,
                        datos: null
                    });
                });
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto',
                datos: null
            });
        }
    }
    public ver_carreras_abiertas(req: Request, res: Response) {
        this.db.manyOrNone(`
            SELECT CA.id, C.nombre, C.duracion
            FROM carreras_abiertas CA
            INNER JOIN carreras C ON C.id = CA.id_carrera
            WHERE current_timestamp BETWEEN CA.fecha_inicio AND CA.fecha_limite
            ORDER BY C.nombre`)
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
    public crear_carreras_abiertas(req: Request, res: Response) {
        const ca: CarreraAbierta = req.body.carreras_abiertas;
        const año = new Date().getFullYear();
        if (ca.cohorte < año) {
            res.status(400).json({
                mensaje: 'La cohorte no puede ser menor que el año actual',
            });
        } else {
            const fecha_inicio = new Date(ca.fecha_inicio);
            const fecha_limite = new Date(ca.fecha_limite);
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
                    const query1 = `SELECT id FROM carreras_abiertas WHERE id_carrera = $1 AND cohorte = $2`;
                    this.db.oneOrNone(query1, [ca.id_carrera, ca.cohorte])
                        .then((data) => {
                            if (data) {
                                res.status(400).json({
                                    mensaje: 'Ya está  abierta la carrera en la cohorte seleccionada',
                                });
                            } else {
                                const query2 = `
                                    INSERT INTO carreras_abiertas (id_carrera, cohorte, fecha_inicio, fecha_limite) 
                                    VALUES ($1, $2, $3, $4) RETURNING ID`;
                                this.db.one(query2, [ca.id_carrera, ca.cohorte, ca.fecha_inicio, ca.fecha_limite])
                                    .then((data) => {
                                        res.status(200).json({
                                            mensaje: 'Se abrió la inscripción a carrera correctamente'
                                        });
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
}