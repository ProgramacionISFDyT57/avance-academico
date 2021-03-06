import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { TipoMateria } from "../modelos/modelo-tipomateria";
import { Materia } from "../modelos/modelo-materia"

export class MateriasController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        // Tipos de materias
        this.listar_tipos_materias = this.listar_tipos_materias.bind(this);
        this.crear_tipo_materia = this.crear_tipo_materia.bind(this);
        this.modificar_tipo_materia = this.modificar_tipo_materia.bind(this);
        this.borrar_tipo_materia = this.borrar_tipo_materia.bind(this);
        // Materias
        this.listar_materias = this.listar_materias.bind(this);
        this.materias_por_carrera = this.materias_por_carrera.bind(this);
        this.crear_materia = this.crear_materia.bind(this);
        this.modificar_materia = this.modificar_materia.bind(this);
        this.borrar_materia = this.borrar_materia.bind(this);
    }

    // Tipos de materias
    public async listar_tipos_materias(req: Request, res: Response) {
        try {
            const query = 'SELECT id, nombre, libre, asistencia FROM tipos_materias ORDER BY nombre;';
            const result = await this.db.manyOrNone(query);
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los tipos de materias',
                error
            });
        }
    }
    public async crear_tipo_materia(req: Request, res: Response) {
        try {
            const tm: TipoMateria = req.body.tipo_materia;
            const query = 'INSERT INTO tipos_materias (nombre, libre, asistencia) VALUES ($1, $2, $3)';
            await this.db.none(query, [tm.nombre, tm.libre, tm.asistencia]);
            res.status(200).json({
                mensaje: 'Se creó el tipo de materia'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al crear el tipo de materia',
                error
            });
        }
    }
    public async modificar_tipo_materia(req: Request, res: Response) {
        try {
            const id = +req.params.id;
            const tm: TipoMateria = req.body.tipo_materia;
            const query = 'UPDATE tipos_materias SET nombre = $1, libre = $2, asistencia = $3 WHERE id = $4';
            await this.db.none(query, [tm.nombre, tm.libre, tm.asistencia, id]);
            res.status(200).json({
                mensaje: 'Se modificó el tipo de materia'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al modificar el tipo de materia',
                error
            });
        }
    }
    public async borrar_tipo_materia(req: Request, res: Response) {
        try {
            const id = +req.params.id;
            const tm: TipoMateria = req.body.tipo_materia;
            const query = 'DELETE FROM tipos_materias WHERE id = $1';
            await this.db.none(query, [id]);
            res.status(200).json({
                mensaje: 'Se eliminó el tipo de materia'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar el tipo de materia',
                error
            });
        }
    }
    // Materias
    public listar_materias(req: Request, res: Response) {
        const query = `
            SELECT m.id, m.nombre, m.anio, m.horas, tm.nombre AS tipo_materia, tm.id AS id_tipo, c.nombre AS carrera, c.nombre_corto, c.resolucion, c.id AS id_carrera, c.duracion AS duracion_carrera,
                cu.ultima_cursada, me.ultima_mesa, array_agg(mc.nombre) AS correlativas, array_agg(mc.id) AS id_correlativas
            FROM materias m
            INNER JOIN tipos_materias tm ON tm.id = m.id_tipo
            INNER JOIN carreras c ON c.id = m.id_carrera
            LEFT JOIN correlativas co ON co.id_materia = m.id
            LEFT JOIN materias mc ON mc.id = co.id_correlativa
            LEFT JOIN (
                SELECT max(c.anio) AS ultima_cursada, m.id AS id_materia
                FROM cursadas c
                INNER JOIN materias m ON m.id = c.id_materia
                GROUP BY m.id
            ) cu ON cu.id_materia = m.id
            LEFT JOIN (
                SELECT max(me.fecha_examen) AS ultima_mesa, m.id AS id_materia
                FROM mesas me
                INNER JOIN materias m ON m.id = me.id_materia
                GROUP BY m.id
            ) me ON me.id_materia = m.id
            GROUP BY m.id, m.nombre, m.anio, m.horas, tm.nombre, tm.id, c.nombre, c.nombre_corto, c.resolucion, c.id, c.duracion, cu.ultima_cursada, me.ultima_mesa
            ORDER BY c.nombre, m.anio, m.nombre`;
        this.db.manyOrNone(query)
            .then((materias) => {
                for (const materia of materias) {
                    if (materia.correlativas[0] === null) {
                        materia.correlativas = [];
                        materia.id_correlativas = [];
                    }
                }
                res.status(200).json(materias);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
    public materias_por_carrera(req: Request, res: Response) {
        const id_carrera = req.params.id_carrera;
        const query = `
            SELECT m.id, m.nombre, m.anio, m.horas, tm.nombre AS tipo_materia, c.nombre AS carrera, 
                array_agg(mc.nombre) AS correlativas
            FROM materias m
            INNER JOIN tipos_materias tm ON tm.id = m.id_tipo
            INNER JOIN carreras c ON c.id = m.id_carrera
            LEFT JOIN correlativas co ON co.id_materia = m.id
            LEFT JOIN materias mc ON mc.id = co.id_correlativa
            WHERE m.id_carrera = $1
            GROUP BY m.id, m.nombre, m.anio, m.horas, tm.nombre, c.nombre
            ORDER BY c.nombre, m.anio, m.nombre`;
        this.db.manyOrNone(query, id_carrera)
            .then((materias) => {
                for (const materia of materias) {
                    if (materia.correlativas[0] === null) {
                        materia.correlativas = [];
                    }
                }
                res.status(200).json(materias);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
    private async crear_correlativa(id_materia: number, id_correlativa: number) {
        return new Promise((resolve, reject) => {
            const query = `SELECT id_carrera, anio FROM materias WHERE id = $1`;
            Promise.all([
                this.db.one(query, [id_materia]),
                this.db.one(query, [id_correlativa])
            ]).then(resultados => {
                const resultado1 = resultados[0];
                const resultado2 = resultados[1];
                // Comprueba que las materias sean de la misma carrera
                if (resultado1.id_carrera === resultado2.id_carrera) {
                    // Comprueba que la correlativa sea de un año inferior a la materia
                    if (resultado2.anio < resultado1.anio) {
                        this.db.none(`INSERT INTO correlativas (id_materia, id_correlativa) 
                                    VALUES ($1, $2)`, [id_materia, id_correlativa])
                            .then(() => {
                                resolve();
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    } else {
                        reject('Correlativa ilógica, la correlativa debe ser de un año anterior');
                    }
                }
                else {
                    reject('Materias de diferentes carreras');
                }
            })
                .catch((error) => {
                    reject(error);
                });
        })
    }
    public crear_materia(req: Request, res: Response) {
        const materia: Materia = req.body.materia;
        const query = `INSERT INTO materias (nombre, anio, id_carrera, id_tipo, horas) VALUES ($1, $2, $3, $4, $5) RETURNING ID`;
        this.db.one(query, [materia.nombre, materia.anio, materia.id_carrera, materia.id_tipo, materia.horas])
            .then((data) => {
                if (materia.correlativas && materia.correlativas.length) {
                    const id_materia_creada = data.id;
                    let creadas = 0;
                    for (let correlativa of materia.correlativas) {
                        this.crear_correlativa(id_materia_creada, correlativa)
                            .then(() => {
                                creadas++;
                                if (creadas === materia.correlativas.length) {
                                    res.status(200).json({
                                        mensaje: "Se creó la materia " + materia.nombre + " con " + creadas + " materias correlativas",
                                        datos: data
                                    });
                                }
                            })
                            .catch((error) => {
                                console.error(error);
                                res.status(500).json(error);
                            });
                    }
                } else {
                    res.status(200).json({
                        mensaje: "Se creó la materia " + materia.nombre,
                        datos: data
                    });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
    public async modificar_materia(req: Request, res: Response) {
        try {
            const id = +req.params.id;
            const materia: Materia = req.body.materia;
            if (id) {
                const query = `UPDATE materias SET nombre = $1, anio = $2, horas = $3, id_tipo = $4 WHERE id = $5`;
                await this.db.none(query, [materia.nombre, materia.anio, materia.horas, materia.id_tipo, id]);
                res.status(200).json({
                    mensaje: "Se modificó la materia correctamente",
                });
            } else {
                res.status(400).json({
                    mensaje: 'ID de materia incorrecto',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrió un error al eliminar la materia',
                error
            });
        }
    }
    public async borrar_materia(req: Request, res: Response) {
        try {
            const id = +req.params.id;
            if (id) {
                await this.db.none('DELETE FROM materias WHERE id = $1', [id])
                res.status(200).json({
                    mensaje: "Se eliminó la materia",
                });
            } else {
                res.status(400).json({
                    mensaje: 'ID Incorrecto',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrió un error al eliminar la materia',
                error
            });
        }

    }
}
