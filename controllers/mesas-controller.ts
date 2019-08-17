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

    private async mesa_abierta(id_mesa: number): Promise<boolean> {
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
                    if (mesa_abierta) {
                        const query = `INSERT INTO inscripciones_mesa (id_mesa, id_alumno, fecha_inscripcion) 
                                        VALUES ($1, $2, current_timestamp);`
                        await this.db.none(query, [id_mesa, id_alumno])
                        res.status(200).json({
                            mensaje: 'Inscripción creada!',
                        });
                    } else {
                        res.status(400).json({
                            mensaje: 'La mesa no se encuentra abierta para inscripción en este momento',
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
            res.status(500).json(error);
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
}