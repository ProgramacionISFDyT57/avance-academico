import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { TipoMateria } from "../modelos/modelo-tipomateria";
import { Materia } from "../modelos/modelo-materia"

export class MateriasController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.ver_tipos_materias = this.ver_tipos_materias.bind(this);
        this.crear_tipo_materia = this.crear_tipo_materia.bind(this);
        this.modificar_tipo_materia = this.modificar_tipo_materia.bind(this);
        this.borrar_tipo_materia = this.borrar_tipo_materia.bind(this);
        this.ver_materias = this.ver_materias.bind(this);
        this.materias_por_carrera = this.materias_por_carrera.bind(this);
        this.crear_materia = this.crear_materia.bind(this);
        this.modificar_materia = this.modificar_materia.bind(this);
        this.borrar_materia = this.borrar_materia.bind(this);
        this.crear_correlativas = this.crear_correlativas.bind(this);
        this.borrar_correlativas = this.borrar_correlativas.bind(this);
    }

    // Tipos de materias
    public ver_tipos_materias(req: Request, res: Response) {
        this.db.manyOrNone('SELECT id, nombre FROM tipos_materias ORDER BY nombre')
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
    public crear_tipo_materia(req: Request, res: Response) {
        const tipo_materia: TipoMateria = req.body.tipo_materia;
        this.db.one('INSERT INTO tipos_materias (nombre) VALUES ($1) RETURNING ID', [tipo_materia.nombre])
            .then((data) => {
                res.status(200).json({
                    mensaje: 'Se creo el tipo de materia ' + tipo_materia.nombre,
                    datos: data
                });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
    public modificar_tipo_materia(req: Request, res: Response) {
        const id = +req.params.id;
        const tipo_materia: TipoMateria = req.body.tipo_materia;
        if (id) {
            this.db.none('UPDATE tipos_materias SET nombre = $1 WHERE id = $2', [tipo_materia.nombre, id])
                .then(() => {
                    res.status(200).json({
                        mensaje: 'Se modificó el tipo de materia',
                    });
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json(error);
                });
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto'
            });
        }
    }
    public borrar_tipo_materia(req: Request, res: Response) {
        const id = +req.params.id;
        if (id) {
            this.db.none('DELETE FROM tipos_materias WHERE id = $1', [id])
                .then(() => {
                    res.status(200).json({
                        mensaje: "Se eliminó el tipo de materia",
                    });
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json(error);
                });
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto',
            });
        }
    }
    // Materias    
    public ver_materias(req: Request, res: Response) {
        const query = `
            SELECT m.id, m.nombre, m.anio, tm.nombre AS tipo_materia, c.nombre AS carrera, json_agg(json_build_object( 'materia', mc.nombre)) AS correlativas
            FROM materias m
            INNER JOIN tipos_materias tm ON tm.id = m.id_tipo
            INNER JOIN carreras c ON c.id = m.id_carrera
            INNER JOIN correlativas co ON co.id_materia = m.id
            INNER JOIN materias mc ON mc.id = co.id_correlativa
            GROUP BY m.id, m.nombre, m.anio, tm.nombre, c.nombre
            ORDER BY c.nombre, m.anio, m.nombre`;
        this.db.manyOrNone(query)
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
    public materias_por_carrera(req: Request, res: Response) {
        const id_carrera = req.params.id_carrera;
        const query = `
            SELECT m.id, m.nombre, m.anio, tm.nombre AS tipo_materia
            FROM materias m
            INNER JOIN tipos_materias tm ON tm.id = m.id_tipo
            WHERE id_carrera = $1
            ORDER BY m.anio, m.nombre`;
        this.db.manyOrNone(query, id_carrera)
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
    private crear_correlativa(id_materia: number, id_correlativa: number) {
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
                    if (resultado2.anio > resultado1.anio) {
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
        this.db.one(`INSERT INTO materias (nombre, anio, id_carrera, id_tipo) VALUES ($1, $2, $3, $4) RETURNING ID`, [materia.nombre, materia.año, materia.id_carrera, materia.id_tipo])
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
    public modificar_materia(req: Request, res: Response) {
        const id = +req.params.id;
        const materia: Materia = req.body.materia;
        if (id) {
            this.db.none(`UPDATE materias SET (nombre, anio, id_carrera, id_tipo) VALUES ($1, $2, $3, $4) WHERE id = $5`, [materia.nombre, materia.año, materia.id_carrera, materia.id_tipo, id])
                .then(() => {
                    res.status(200).json({
                        mensaje: "Se modificó la materia",
                    });
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json(error);
                });
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto',
            });
        }
    }
    public borrar_materia(req: Request, res: Response) {
        const id = +req.params.id;
        if (id) {
            this.db.none('DELETE FROM materias WHERE id = $1', [id])
                .then(() => {
                    res.status(200).json({
                        mensaje: "Se eliminó la materia",
                    });
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json(error);
                });
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto',
            });
        }
    }
    public crear_correlativas(req: Request, res: Response) {
        const id_materia = req.body.id_materia
        const id_correlativa = req.body.id_correlativa
        this.db.one(`SELECT id_carrera, anio 
            FROM materias WHERE id =$1`, [id_materia])
            .then(resultado1 => {
                this.db.one(`SELECT id_carrera, anio
                    FROM materias WHERE id =$2`, [id_correlativa])
                    .then(resultado2 => {
                        if (resultado1.id_carrera === resultado2.id_carrera) {
                            if (resultado2.año > resultado1.año) {
                                this.db.none(`INSERT INTO correlativas (id_materia, id_correlativa) 
                                    VALUES ($1, $2)`, [id_materia, id_correlativa])
                                    .then(() => {
                                        res.status(200).json({
                                            mensaje: 'Se creo la correlativa correctamente',
                                        });
                                    })
                            } else {
                                res.status(400).json({
                                    mensaje: 'Correlativa ilógica',
                                })
                            }
                        }
                        else {
                            res.status(400).json({
                                mensaje: 'Materias de diferentes carreras',
                            })
                        }
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).json(error);
                    });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
    public borrar_correlativas(req: Request, res: Response) {
        const id_materia = req.body.id_materia
        const id_correlativa = req.body.id_correlativa
        const query = `DELETE FROM corrrelativas WHERE id_materia =$1 AND id_correlativa = $2`;
        this.db.none(query, [id_materia, id_correlativa])
            .then(() => {
                res.status(200).json({
                    mensaje: 'Se elimino la correlativa correctamente',
                });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
    public ver_correlativas(req: Request, res: Response) {
        const id_materia = req.params.id_materia
        const query = `
            SELECT M.id, M.nombre, M.anio, M.id_carrera, M.id_tipo
            FROM materias M 
            INNER JOIN correlativas C ON C.id_materia = M.id
            WHERE C.id_materia = $1 ORDER BY anio`;
        this.db.manyOrNone(query, [id_materia])
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
}
