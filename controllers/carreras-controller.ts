import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Carrera } from '../modelos/modelo-carrera';
import { CarreraAbierta } from '../modelos/modelo-carreraabierta';
import { HelperService } from '../servicios/helper';

export class CarrerasController {
    private db: IDatabase<any>;
    private helper: HelperService;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.helper = new HelperService(db);
        this.borrar_inscripcion_carrera = this.borrar_inscripcion_carrera.bind(this);
        this.crear_inscripcion_carrera = this.crear_inscripcion_carrera.bind(this);
        this.listar_inscriptos_carrera = this.listar_inscriptos_carrera.bind(this);
        this.ver_carreras = this.ver_carreras.bind(this);
        this.ver_carrera = this.ver_carrera.bind(this);
        this.crear_carrera = this.crear_carrera.bind(this);
        this.modificar_carrera = this.modificar_carrera.bind(this);
        this.borrar_carrera = this.borrar_carrera.bind(this);
        this.ver_carreras_abiertas = this.ver_carreras_abiertas.bind(this);
        this.ver_carreras_abiertas_hoy = this.ver_carreras_abiertas_hoy.bind(this);
        this.crear_carreras_abiertas = this.crear_carreras_abiertas.bind(this);
        this.eliminar_carrera_abierta = this.eliminar_carrera_abierta.bind(this);
    }

    public async borrar_inscripcion_carrera(req: Request, res: Response) {
        try {
            const id_inscripcion = +req.params.id_inscripcion;
            if (id_inscripcion) {
                const query = `DELETE FROM inscripciones_carreras WHERE id = $1;`;
                await this.db.none(query, id_inscripcion);
                res.json({
                    mensaje: 'Inscripción a carrera borrada correctamente',
                });
            } else {
                res.status(400).json({
                    mensaje: 'ID de inscripción inválido',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar la inscripción de la carrera',
                error
            });
        }
    }
    public async crear_inscripcion_carrera(req: Request, res: Response) {
        try {
            const id_carrera_abierta = +req.body.id_carrera_abierta;
            const id_alumno = +req.body.id_alumno;
            if (id_alumno) {
                if (id_carrera_abierta) {
                    const carrera_abierta = await this.helper.carrera_abierta(id_carrera_abierta);
                    if (carrera_abierta === true) {
                        const query = `INSERT INTO inscripciones_carreras (id_alumno, id_carrera_abierta, fecha_inscripcion) 
                            VALUES ($1, $2, current_timestamp) RETURNING ID`;
                        await this.db.one(query, [id_alumno, id_carrera_abierta]);
                        res.status(200).json({
                            mensaje: 'Se inscribio correctamente el alumno a la carrera'
                        });
                    } else {
                        res.status(400).json({
                            mensaje: carrera_abierta,
                        });
                    }
                } else {
                    res.status(400).json({
                        mensaje: 'ID de carrera abierta inválido, se espera id_carrera_abierta',
                    });
                }
            } else {
                res.status(400).json({
                    mensaje: 'ID de alumno, se espera id_alumno',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al crear la inscripcion a la cursada',
                error
            });
        }
    }
    public async listar_inscriptos_carrera(req: Request, res: Response) {
        try {
            const id_carrera_abierta = +req.params.id_carrera_abierta;
            if (id_carrera_abierta) {
                const query = `
                    SELECT us.apellido, us.nombre, us.dni, ic.fecha_inscripcion, c.nombre AS carrera, ic.id AS id_inscripcion_carrera
                    FROM carreras_abiertas ca
                    INNER JOIN carreras c ON c.id = ca.id_carrera
                    INNER JOIN inscripciones_carreras ic ON ic.id_carrera_abierta = ca.id
                    INNER JOIN alumnos al ON al.id = ic.id_alumno
                    INNER JOIN usuarios us ON us.id = al.id_usuario
                    WHERE ca.id = $1
                    ORDER BY us.apellido, us.nombre;`;
                const inscriptos = await this.db.manyOrNone(query, [id_carrera_abierta]);
                res.status(200).json(inscriptos);
            } else {
                res.status(400).json({
                    mensaje: 'ID de carrera abierta inválido',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los inscriptos a la carrera',
                error
            });
        }
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
        const query = `
            SELECT c.id, c.nombre, c.duracion, c.cantidad_materias, COUNT(m.id) AS materias_cargadas
            FROM carreras c
            LEFT JOIN materias m ON m.id_carrera = c.id
            WHERE c.id = $1
            GROUP BY c.id, c.nombre, c.duracion, c.cantidad_materias;`
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
                        mensaje: 'La carrera se eliminó correctamente'
                    });
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json({
                        mensaje: 'Ocurrió un error al eliminar la carrera',
                        error
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
        const query = `
            SELECT CA.id, C.nombre, C.duracion, CA.cohorte, CA.fecha_inicio, CA.fecha_limite,
                COUNT(ic.id) AS cant_inscriptos
            FROM carreras_abiertas CA
            INNER JOIN carreras C ON C.id = CA.id_carrera
            LEFT JOIN inscripciones_carreras ic ON ic.id_carrera_abierta = CA.id
            GROUP BY CA.id, C.nombre, C.duracion, CA.cohorte, CA.fecha_inicio, CA.fecha_limite
            ORDER BY CA.cohorte DESC, C.nombre`;
        this.db.manyOrNone(query)
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json(err);
            });
    }
    public ver_carreras_abiertas_hoy(req: Request, res: Response) {
        const query = `
            SELECT CA.id, C.nombre, C.duracion, CA.cohorte, CA.fecha_inicio, CA.fecha_limite
            FROM carreras_abiertas CA
            INNER JOIN carreras C ON C.id = CA.id_carrera
            WHERE current_timestamp BETWEEN CA.fecha_inicio AND CA.fecha_limite
            ORDER BY C.nombre`;
        this.db.manyOrNone(query)
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json(err);
            });
    }
    public async crear_carreras_abiertas(req: Request, res: Response) {
        try {
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
                            mensaje: 'La fecha límite no puede ser menor a la fecha actual',
                        });
                    } else {
                        let query = `SELECT id FROM carreras_abiertas WHERE id_carrera = $1 AND cohorte = $2`;
                        let result = await this.db.oneOrNone(query, [ca.id_carrera, ca.cohorte])
                        if (result) {
                            res.status(400).json({
                                mensaje: 'Ya está abierta la carrera en la cohorte seleccionada',
                            });
                        } else {
                            query = `
                                INSERT INTO carreras_abiertas (id_carrera, cohorte, fecha_inicio, fecha_limite) 
                                VALUES ($1, $2, $3, $4);`;
                            await this.db.none(query, [ca.id_carrera, ca.cohorte, ca.fecha_inicio, ca.fecha_limite])
                            res.status(200).json({
                                mensaje: 'Se abrió la inscripción a la carrera correctamente'
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al abrir la carrera',
                error
            });
        }
    }
    public async eliminar_carrera_abierta(req: Request, res: Response) {
        try {
            const id_carrera_abierta = +req.params.id_carrera_abierta;
            const query = 'DELETE FROM carreras_abiertas WHERE id = $1;'
            await this.db.none(query, [id_carrera_abierta]);
            res.status(200).json({
                mensaje: 'Se eliminó la carrera abierta',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar la carrera abierta',
                error
            });
        }
    }
}