import {IDatabase} from 'pg-promise';
import {Request, Response} from 'express';
import {TipoMateria, Materia} from "../modelo";   
export class MateriasController {
    private db:IDatabase<any>;

    constructor(db:IDatabase<any>) {
        this.db = db;
        this.ver_tipos_materias = this.ver_tipos_materias.bind(this);
        this.crear_tipo_materia = this.crear_tipo_materia.bind(this);
        this.modificar_tipo_materia = this.modificar_tipo_materia.bind(this);
        this.ver_materias = this.ver_materias.bind(this);
        this.borrar_tipo_materia = this.borrar_tipo_materia.bind(this);
        this.crear_materia = this.crear_materia.bind(this);
        this.modificar_materia = this.modificar_materia.bind(this);
        this.borrar_materia = this.borrar_materia.bind(this);
    }
    public ver_materias(req: Request, res: Response){
        this.db.manyOrNone(`SELECT id, nombre, 'año' FROM materias ORDER BY nombre`)
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
    public ver_tipos_materias(req: Request, res: Response) {
        this.db.manyOrNone('SELECT id, nombre FROM tipos_materias ORDER BY nombre')
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
    public crear_tipo_materia(req:Request, res: Response) {
        const tipo_materia: TipoMateria = req.body.tipo_materia;
        this.db.one('INSERT INTO tipos_materias (nombre) VALUES ($1) RETURNING ID', [tipo_materia.nombre])
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
    public modificar_tipo_materia(req: Request, res: Response){
        const id = +req.params.id;
        const tipo_materia: TipoMateria = req.body.tipo_materia;
        if (id) {
            this.db.none('UPDATE tipos_materias SET (nombre) VALUES ($1) WHERE id = $2', [tipo_materia.nombre, id])
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
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto',
                datos: null
            });
        }
    }
    public borrar_tipo_materia(req: Request, res: Response){
        const id = +req.params.id;
        if (id) {
            this.db.none('DELETE FROM tipos_materias WHERE id = $1', [id])
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
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto',
                datos: null
            });
        }
    }
    public crear_materia(req: Request, res: Response){
        const materia: Materia = req.body.tipo_materia;
        this.db.one('INSERT INTO materias (nombre, año, id_carrera, id_tipo) VALUES ($1, $2, $3, $4) RETURNING ID', [materia.nombre, materia.año, materia.id_carrera, materia.id_tipo])
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
    public modificar_materia(req: Request, res: Response){
        const id = +req.params.id;
        const materia: Materia = req.body.tipo_materia;
        if (id) {
            this.db.none('UPDATE materias SET (nombre, año, id_carrera, id_tipo) VALUES ($1, $2, $3, $4) WHERE id = $5', [materia.nombre, materia.año, materia.id_carrera, materia.id_tipo, id])
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
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto',
                datos: null
            });
        }
    }
    public borrar_materia(req: Request, res: Response){
        const id = +req.params.id;
        if (id) {
            this.db.none('DELETE FROM materias WHERE id = $1', [id])
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
        } else {
            res.status(400).json({
                mensaje: 'ID Incorrecto',
                datos: null
            });
        }
    }
    public crear_correlativas(req: Request, res: Response){
        const idmateria = req.body.mt
        const idcorrelativa = req.body.cr
        this.db.one(`SELECT id_carrera,año 
            FROM materias WHERE id =$1`, [idmateria])
            .then(resultado1 => {
                this.db.one(`SELECT id_carrera, año 
                    FROM materias WHERE id =$2`, [idcorrelativa])
                    .then(resultado2 => {
                        if (resultado1.id_carrera === resultado2.id_carrera) {
                            if (resultado2.año > resultado1.año) {
                                this.db.none(`INSERT INTO correlativas (id_materia, id_correlativa) 
                                    VALUES ($1, $2)`, [idmateria, idcorrelativa])
                                    .then((data) => {
                                        res.status(200).json({
                                            mensaje: 'insertado correctamente',
                                            datos: true,
                                        });
                                    })
                            } else {
                                res.status(400).json({
                                    mensaje: 'Correlativa ilógica',
                                    datos: null,
                                })
                            }
                        } 
                        else {
                            res.status(400).json({
                                mensaje: 'Materias de diferentes carreras',
                                datos: null,
                            })
                        }
                    })
            })
    }
    public ver_correlativa(req:Request, res: Response){
        this.db.manyOrNone(`SELECT id_materia, id_correlativa FROM correlativas ORDER BY id_materia`)
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
