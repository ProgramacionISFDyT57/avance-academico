import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Mesa } from "../modelos/modelo-mesa"
import { Token } from '../modelos/modelo-token';

export class MesasController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.crear_inscripcion_mesa = this.crear_inscripcion_mesa.bind(this);
        this.lista_mesas = this.lista_mesas.bind(this);
        this.crear_mesa = this.crear_mesa.bind(this);
    }

    private async get_id_materia(id_mesa: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT ma.id
                    FROM mesas me
                    INNER JOIN materias ma ON ma.id = me.id_materia
                    WHERE me.id = $1;`
                const mesa = await this.db.one(query, id_mesa);
                resolve(mesa.id);
            } catch (error) {
                reject(error);
            }
        });
    }

    private async get_id_materias_correlativas(id_materia: number): Promise<number[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT co.id_correlativa
                    FROM materias ma
                    INNER JOIN correlativas co ON co.id_materia = ma.id
                    WHERE me.id = $1`;
                const correlativas = await this.db.manyOrNone(query, [id_materia]);
                const ids = [];
                for (const correlativa of correlativas) {
                    ids.push(correlativa.id_correlativa);
                }
                resolve(ids);
            } catch (error) {
                reject(error);
            }
        });
    }

    private async mesa_abierta(id_mesa: number): Promise<true|string> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT fecha_inicio, fecha_limite
                    FROM mesas
                    WHERE id = $1;`
                const mesa = await this.db.one(query, id_mesa);
                const fecha_actual = new Date().toISOString();
                if (mesa.fecha_inicio < fecha_actual && mesa.fecha_limite > fecha_actual) {
                    resolve(true);
                } else {
                    resolve('La mesa no se encuetra abierta en este momento // Inicio de inscripción: ' + mesa.fecha_inicio + ' // Fin de inscripción: ' + mesa.fecha_limite + ' // Fecha actual: ' + fecha_actual);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    private async cursada_aprobada(id_materia: number, id_alumno: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT ma.id
                    FROM materias ma
                    INNER JOIN tipos_materias tm ON tm.id = ma.id_tipo
                    INNER JOIN cursadas cu ON cu.id_materia = ma.id
                    INNER JOIN inscripciones_cursada ic ON ic.id_cursada = cu.id
                    INNER JOIN avance_academico aa ON aa.id_inscripcion_cursada = ic.id
                    WHERE ma.id = $1
                    AND ic.id_alumno = $2
                    AND ((aa.nota_cuat_1 >=4 and aa.nota_cuat_2 >=4) OR (aa.nota_recuperatorio >=4))
                    AND ((tm.id = 2 AND aa.asistencia >= 80) OR (tm.id != 2 AND aa.asistencia >= 60))`;
                const resultados = await this.db.manyOrNone(query, [id_materia, id_alumno]);
                if (resultados.length) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    private async finales_correlativos_aprobados(id_materia: number, id_alumno: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {                
                const correlativas = await this.get_id_materias_correlativas(id_materia);
                if (!correlativas.length) {
                    resolve(true);
                } else {
                    let aprobada = true;
                    let i = 0;
                    while (aprobada && i < correlativas.length) {
                        aprobada = await this.final_aprobado(correlativas[i], id_alumno);
                        i++;
                    }
                    if (aprobada) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    private async final_aprobado(id_materia: number, id_alumno: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT fi.nota
                    FROM materias ma
                    INNER JOIN mesas me ON me.id_materia = ma.id
                    INNER JOIN inscripciones_mesa im ON im.id_mesa = me.id
                    INNER JOIN finales fi ON fi.id_inscripcion_mesa = im.id
                    WHERE ma.id = $1
                    AND im.id_alumno = $2
                    AND fi.nota >= 4`;
                const result = await this.db.manyOrNone(query, [id_materia, id_alumno]);
                if (result.length) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async crear_inscripcion_mesa(req: Request, res: Response) {
        try {
            const id_mesa = +req.body.id_mesa;
            const token: Token = res.locals.token;
            const id_alumno = token.id_alumno;
            if (id_alumno) {
                if (id_mesa) {
                    const mesa_abierta = await this.mesa_abierta(id_mesa);
                    if (mesa_abierta === true) {
                        const id_materia = await this.get_id_materia(id_mesa);
                        const cursada_aprobada = await this.cursada_aprobada(id_materia, id_alumno);
                        if (cursada_aprobada) {
                            const correlativas_aprobadas = await this.finales_correlativos_aprobados(id_materia, id_alumno);
                            if (correlativas_aprobadas) {
                                const final_aprobado = await this.final_aprobado(id_materia, id_alumno);
                                if (!final_aprobado) {
                                    const query = `INSERT INTO inscripciones_mesa (id_mesa, id_alumno, fecha_inscripcion) 
                                                    VALUES ($1, $2, current_timestamp);`
                                    await this.db.none(query, [id_mesa, id_alumno])
                                    res.status(200).json({
                                        mensaje: 'Inscripción creada!',
                                    });
                                } else {
                                    res.status(400).json({
                                        mensaje: 'Ya posee la materia aprobada',
                                    });
                                }
                            } else {
                                res.status(400).json({
                                    mensaje: 'No posee las correlativas aprobadas',
                                });
                            }
                        } else {
                            res.status(400).json({
                                mensaje: 'No posee la cursada aprobada',
                            });
                        }
                    } else {
                        res.status(400).json({
                            mensaje: mesa_abierta,
                        });
                    }
                } else {
                    res.status(400).json({
                        mensaje: 'ID de mesa invalido',
                    });
                }
            } else {
                res.status(400).json({
                    mensaje: 'El usuario no es un alumno',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al crear la inscripción',
                error
            });
        }
    }

    public lista_mesas(req: Request, res: Response) {
        const query = `
            SELECT me.id, ma.nombre AS materia, ma.anio AS anio_materia, me.fecha_inicio, me.fecha_limite, 
                me.fecha_examen, ca.nombre AS carrera,
                CONCAT_WS(', ', us.apellido, us.nombre) AS profesor,
                CONCAT_WS(', ', us1.apellido, us1.nombre) AS vocal1,
                CONCAT_WS(', ', us2.apellido, us2.nombre) AS vocal2,
                COUNT(ic.id) AS cant_inscriptos
            FROM mesas me 
            LEFT JOIN inscripciones_mesa ic ON ic.id_mesa = me.id
            INNER JOIN materias ma ON ma.id = me.id_materia
            INNER JOIN carreras ca ON ca.id = ma.id_carrera
            LEFT JOIN profesores pf ON pf.id = me.id_profesor
            LEFT JOIN usuarios us ON us.id = pf.id_usuario
            LEFT JOIN profesores v1 ON v1.id = me.id_vocal1
            LEFT JOIN usuarios us1 ON us1.id = v1.id_usuario
            LEFT JOIN profesores v2 ON v2.id = me.id_vocal2
            LEFT JOIN usuarios us2 ON us2.id = v2.id_usuario
            GROUP BY me.id, ma.nombre, ma.anio, me.fecha_inicio, me.fecha_limite,
                me.fecha_examen, ca.nombre,
                CONCAT_WS(', ', us.apellido, us.nombre),
                CONCAT_WS(', ', us1.apellido, us1.nombre),
                CONCAT_WS(', ', us2.apellido, us2.nombre)
            ORDER BY me.fecha_examen DESC, ca.nombre, ma.anio, ma.nombre`;
        this.db.manyOrNone(query)
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json(err);
            });
    }

    public crear_mesa(req: Request, res: Response) {
        const mesa: Mesa = req.body.mesa;
        const query = `
            INSERT INTO mesas 
            (id_materia, fecha_inicio, fecha_limite, fecha_examen, id_profesor, id_vocal1, id_vocal2) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
        this.db.one(query, [mesa.id_materia, mesa.fecha_inicio, mesa.fecha_limite, mesa.fecha_examen, mesa.id_profesor, mesa.id_vocal1, mesa.id_vocal2])
            .then((data) => {
                res.status(200).json({
                    mensaje: "Se creó la mesa correctamente"
                });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json(err);
            });
    }

    public async listar_inscriptos(req: Request, res: Response) {
        try {
            const id_mesa = +req.params.id_mesa;
            if (id_mesa) {
                const query = `
                    SELECT us.apellido, us.nombre, us.dni, im.fecha_inscripcion, ma.nombre AS materia, me.fecha_examen
                    FROM mesas me
                    INNER JOIN materias ma ON ma.id = me.id_materia
                    INNER JOIN inscripciones_mes im ON im.id_mesa = me.id
                    INNER JOIN alumnos al ON al.id = im.id_alumno
                    INNER JOIN usuarios us ON un.id = al.id_usuario
                    WHERE me.id = $1;
                    ORDER BY us.apellido, us.nombre`;
                const inscriptos = await this.db.manyOrNone(query, [id_mesa]);
                res.status(200).json(inscriptos);
            } else {
                res.status(400).json({
                    mensaje: 'ID de mesa invalido'
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los inscriptos a la mesa',
                error
            });
        }
    }

}