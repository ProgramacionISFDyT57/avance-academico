import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Carrera } from '../modelos/modelo-carrera';
import { CarreraAbierta } from '../modelos/modelo-carreraabierta';
import { HelperService } from '../servicios/helper';
import { Token } from '../modelos/modelo-token';

export class CarrerasController {
    private db: IDatabase<any>;
    private helper: HelperService;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.helper = new HelperService(db);

        // Carreras
        this.listar_carreras = this.listar_carreras.bind(this);
        this.crear_carrera = this.crear_carrera.bind(this);
        this.modificar_carrera = this.modificar_carrera.bind(this);
        this.borrar_carrera = this.borrar_carrera.bind(this);
        // Carreras Abiertas
        this.ver_carreras_abiertas = this.ver_carreras_abiertas.bind(this);
        this.ver_carreras_abiertas_hoy = this.ver_carreras_abiertas_hoy.bind(this);
        this.crear_carreras_abiertas = this.crear_carreras_abiertas.bind(this);
        this.eliminar_carrera_abierta = this.eliminar_carrera_abierta.bind(this);
        // Inscripciones a carreras
        this.listar_inscriptos_carrera = this.listar_inscriptos_carrera.bind(this);
        this.crear_inscripcion_carrera = this.crear_inscripcion_carrera.bind(this);
        this.borrar_inscripcion_carrera = this.borrar_inscripcion_carrera.bind(this);
        //
        this.asignar_libro_folio = this.asignar_libro_folio.bind(this);
    }

    // Carreras
    public async listar_carreras(req: Request, res: Response) {
        try {
            const query = `
            SELECT c.id, c.nombre, c.nombre_corto, c.resolucion, c.duracion, c.cantidad_materias, c.descripcion, COUNT(m.id) AS materias_cargadas
            FROM carreras c
            LEFT JOIN materias m ON m.id_carrera = c.id
            GROUP BY c.id, c.nombre, c.nombre_corto, c.resolucion, c.duracion, c.cantidad_materias, c.descripcion
            ORDER BY nombre ASC;`
            const carreras = await this.db.manyOrNone(query);
            res.json(carreras);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrió un error al listar las carreras',
                error
            });
        }
    }
    public async crear_carrera(req: Request, res: Response) {
        try {
            const carrera: Carrera = req.body.carrera;
            const query = 'INSERT INTO carreras (nombre, nombre_corto, duracion, cantidad_materias, resolucion, descripcion) VALUES ($1, $2, $3, $4, $5, $6);';
            await this.db.none(query, [carrera.nombre, carrera.nombre_corto, carrera.duracion, carrera.cantidad_materias, carrera.resolucion, carrera.descripcion]);
            res.status(200).json({
                mensaje: 'Se creó la carrera correctamente'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrió un error al crear la carrera',
                error
            });
        }
    }
    public async modificar_carrera(req: Request, res: Response) {
        try {
            const id = +req.params.id;
            const carrera: Carrera = req.body.carrera;
            if (id) {
                const query = 'UPDATE carreras SET nombre = $1, nombre_corto = $2, duracion = $3, cantidad_materias = $4, resolucion = $5, descripcion = $6 WHERE id = $7';
                await this.db.none(query, [carrera.nombre, carrera.nombre_corto, carrera.duracion, carrera.cantidad_materias, carrera.resolucion, carrera.descripcion, id]);
                res.status(200).json({
                    mensaje: 'La carrera se modificó correctamente',
                });
            } else {
                res.status(400).json({
                    mensaje: 'ID de carrera incorrecto',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al modificar la carrera',
                error
            });
        }
    }
    public async borrar_carrera(req: Request, res: Response) {
        try {
            const id = +req.params.id;
            const query = `DELETE FROM carreras WHERE id = $1';`
            await this.db.none(query, [id]);
            res.status(200).json({
                mensaje: 'La carrera se eliminó correctamente'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrió un error al eliminar la carrera',
                error
            });
        }
    }

    // Carreras Abiertas
    public ver_carreras_abiertas(req: Request, res: Response) {
        const query = `
            SELECT CA.id, C.nombre, C.resolucion, C.duracion, CA.cohorte, CA.fecha_inicio, CA.fecha_limite,
                COUNT(ic.id) AS cant_inscriptos
            FROM carreras_abiertas CA
            INNER JOIN carreras C ON C.id = CA.id_carrera
            LEFT JOIN inscripciones_carreras ic ON ic.id_carrera_abierta = CA.id
            GROUP BY CA.id, C.nombre, C.resolucion, C.duracion, CA.cohorte, CA.fecha_inicio, CA.fecha_limite
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
            SELECT CA.id, C.nombre, C.resolucion, C.duracion, CA.cohorte, CA.fecha_inicio, CA.fecha_limite
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
            if (ca.cohorte < (año - 6)) {
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
                        let result = await this.db.oneOrNone(query, [ca.id_carrera, ca.cohorte]);
                        if (result) {
                            res.status(400).json({
                                mensaje: 'Ya está abierta la carrera en la cohorte seleccionada',
                            });
                        } else {
                            query = `
                                INSERT INTO carreras_abiertas (id_carrera, cohorte, fecha_inicio, fecha_limite) 
                                VALUES ($1, $2, $3, $4);`;
                            await this.db.none(query, [ca.id_carrera, ca.cohorte, ca.fecha_inicio, ca.fecha_limite]);
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

    // Inscripciones a carreras
    public async borrar_inscripcion_carrera(req: Request, res: Response) {
        try {
            const id_inscripcion = +req.params.id_inscripcion;
            if (id_inscripcion) {
                let query = `
                    SELECT ic.id_alumno, ca.id_carrera
                    FROM inscripciones_carreras ic
                    INNER JOIN carreras_abiertas ca ON ca.id = ic.id_carrera_abierta
                    WHERE ic.id = $1`;
                let result = await this.db.one(query, id_inscripcion);
                const id_alumno = result.id_alumno;
                const id_carrera = result.id_carrera;
                query = `
                    SELECT ic.id 
                    FROM inscripciones_cursadas ic
                    INNER JOIN cursadas cu ON cu.id = ic.id_cursada
                    INNER JOIN materias ma ON ma.id = cu.id_materia
                    WHERE id_alumno = $1
                    AND ma.id_carrera = $2`;
                result = await this.db.manyOrNone(query, [id_alumno, id_carrera]);
                if (result.length === 0) {
                    query = `DELETE FROM inscripciones_carreras WHERE id = $1;`;
                    await this.db.none(query, id_inscripcion);
                    res.json({
                        mensaje: 'Inscripción a carrera borrada correctamente',
                    });
                } else {
                    res.status(400).json({
                        mensaje: 'No se puede eliminar un alumno con inscripciones a cursadas',
                    });
                }
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
                    SELECT us.apellido, us.nombre, us.dni, ic.fecha_inscripcion, ic.libro, ic.folio, c.nombre AS carrera, ic.id AS id_inscripcion_carrera, ca.cohorte
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

    //
    public async asignar_libro_folio(req: Request, res: Response) {
        try {
            const id_inscripcion = +req.params.id_inscripcion;
            const libro = +req.body.libro;
            const folio = +req.body.folio;
            const query = `UPDATE inscripciones_carreras SET libro = $1, folio = $2 WHERE id = $3;`;
            await this.db.none(query, [libro, folio, id_inscripcion]);
            res.status(200).json({
                mensaje: 'Se asignó correctamente el libro y folio'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al asigar el libro y folio',
                error
            });
        }
    }
}