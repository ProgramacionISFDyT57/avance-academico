import {IDatabase} from 'pg-promise';
import {Request, Response} from 'express';
import {Mesa} from "../modelos/modelo-mesa"

export class MesasController {
    private db:IDatabase<any>;

    constructor(db:IDatabase<any>) {
        this.db = db;
        this.crear_inscripcion_mesa = this.crear_inscripcion_mesa.bind(this);
        this.lista_mesas = this.lista_mesas.bind(this);
        this.crear_mesa = this.crear_mesa.bind(this);
    }

    public crear_inscripcion_mesa(req: Request, res: Response){
        const id_mesa = +req.body.id_mesa;
        const id_alumno = +req.body.id_alumno;
        this.db.none(`INSERT INTO inscripciones_mesa (id_mesa, id_alumno, fecha_inscripcion) 
            VALUES ($1, $2, current_timestamp);`, [id_mesa, id_alumno])
        .then(() => {
            res.status(200).json({
                mensaje: 'Inscripción creada!',
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
    }
    public lista_mesas(req: Request, res: Response){
        const query = `
            SELECT me.id, ma.nombre AS materia, me.fecha_limite, me.fecha_examen, us.nombre AS Profesor
            FROM mesas me 
            INNER JOIN materias ma ON ma.id = me.id_materia
            INNER JOIN profesores pf ON pf.id = me.id_profesor
            INNER JOIN usuarios us ON us.id = pf.id_usuario
            WHERE me.fecha_limite >= curren_timestamp;`;
        this.db.manyOrNone(query)
        .then((data) => {
            res.status(200).json(data);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
    }
    public crear_mesa(req: Request, res: Response){
        const mesa: Mesa = req.body.mesa;
        this.db.one(`INSERT INTO mesas (id_materia, fecha_inicio, fecha_limite, fecha_examen, id_profesor, 
            id_vocal1, id_vocal2) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [mesa.id_materia, mesa.fecha_inicio, mesa.fecha_limite, mesa.fecha_examen, mesa.id_profesor, mesa.id_vocal1, mesa.id_vocal2])
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