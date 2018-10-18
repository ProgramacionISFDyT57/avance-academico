import {IDatabase} from 'pg-promise';
import {Request, Response} from 'express';

export class CarrerasController {
    private db:IDatabase<any>;

    constructor(db:IDatabase<any>) {
        this.db = db;
        this.BorrarInscripcionCarrera = this.BorrarInscripcionCarrera.bind(this);
        this.VerCarreras = this.VerCarreras.bind(this);
    }

    public BorrarInscripcionCarrera(req:Request, res:Response) {
        if (req.params.id_inscripcion) {
            this.db.none(`
                DELETE FROM inscripciones_carreras WHERE id = $1;
            `, req.params.id_inscripcion)
                .then(() => {
                    res.json({
                        mensaje: 'Inscripción borrada correctamente',
                        datos: null
                    })
                })
                .catch(err => {
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

    public VerCarreras(req: Request, res: Response) {
        this.db.manyOrNone('SELECT id, nombre, duracion, cantidad_materias FROM carreras ORDER BY nombre ASC;')
        .then(datos => {
            res.json({
                mensaje: 'Listado de materias',
                datos: datos
            })
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                mensaje: err.detail,
                datos: err
            })
        })
    }
}