import {IDatabase} from 'pg-promise';
import {Request, Response} from 'express';
import {Mesa} from "../modelo"

export class MesasController {
    private db:IDatabase<any>;

    constructor(db:IDatabase<any>) {
        this.db = db;
        this.crear_inscripcion_mesa = this.crear_inscripcion_mesa.bind(this);
    }

    public crear_inscripcion_mesa(req: Request, res: Response){
        const id_mesa = +req.params.id_mesa;
        const id_alumno = +req.params.id_alumno;
        this.db.one(`INSERT INTO inscripciones_mesa (id_mesa, id_alumno, fecha_inscripcion) 
            VALUES ($1, $2, current_timestamp)`, [id_mesa, id_alumno])
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
    public crear_mesa(req: Request, res: Response){
        const mesa: Mesa = req.body.mesa;
        this.db.one(`INSERT INTO mesas (id_materia, fecha_inicio, fecha_limite, fecha_examen, id_profesor, 
            id_vocal1, id_vocal2) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ID`, [mesa.id_materia, mesa.fecha_inicio, mesa.fecha_limite, mesa.fecha_examen, mesa.id_profesor, mesa.id_vocal1, mesa.id_vocal2])
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