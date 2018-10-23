import {IDatabase} from 'pg-promise';
import {Request, Response} from 'express';

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
    
}