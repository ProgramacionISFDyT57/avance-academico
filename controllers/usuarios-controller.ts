import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Usuario } from '../modelos/modelo-usuario';
import * as bcrypt from 'bcrypt';
export class UsuariosController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.crear_usuario = this.crear_usuario.bind(this);
        this.listar_usuarios = this.listar_usuarios.bind(this);
        this.ver_profesores = this.ver_profesores.bind(this);
        this.listar_alumnos = this.listar_alumnos.bind(this);
    }

    public crear_usuario(req: Request, res: Response) {
        const usuario: Usuario = req.body.usuario;
        bcrypt.hash(usuario.clave, 10, (error, hash) => {
            this.db.one(`INSERT INTO usuarios ( email, clave, nombre, apellido, fecha_nacimiento, fecha_alta, id_rol) 
            VALUES ($1, $2, $3, $4, $5, current_timestamp, $6) 
            RETURNING ID`, [ usuario.email, hash, usuario.nombre, usuario.apellido, usuario.fecha_nacimiento , usuario.id_rol])
            .then((data) => {
                if (usuario.id_rol === 4) {
                    this.db.one('INSERT INTO profesores (id_usuario) VALUES ($1) RETURNING ID', [data.id])
                        .then((data) => {
                            res.status(200).json({
                                mensaje: null,
                                datos: data
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).json({
                                mensaje: err,
                                datos: null
                            });
                        })
                } else if (usuario.id_rol === 5) {
                    this.db.one('INSERT INTO alumnos (id_usuario) VALUES ($1) RETURNING ID', [data.id])
                        .then((data) => {
                            res.status(200).json({
                                mensaje: null,
                                datos: data
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).json({
                                mensaje: err,
                                datos: null
                            });
                        });
                } else {
                    res.status(200).json({
                        mensaje: null,
                        datos: data
                    });
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
        });   
    }
    public listar_usuarios(req: Request, res: Response) {
        this.db.manyOrNone(`
            SELECT U.id, U.nombre, U.apellido, U.email, U.fecha_nacimiento, U.fecha_alta, R.nombre 
            FROM usuarios U
            INNER JOIN roles R ON U.id_rol = R.id`)
            .then((data) => {
                res.status(200).json({
                    mensaje: null,
                    datos: data
                });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    }
    public ver_profesores(req: Request, res: Response) {
        this.db.manyOrNone(`
            SELECT id, email, nombre, apellido, fecha_nacimiento, fecha_alta 
            FROM usuarios WHERE id_rol = 4`)
            .then((data) => {
                res.status(200).json({
                    mensaje: null,
                    datos: data
                });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    }
    public listar_alumnos(req: Request, res: Response) {
        this.db.manyOrNone(`
        SELECT alumnos.id, usuarios.nombre, usuarios.apellido FROM alumnos
        inner join usuarios on usuarios.id = alumnos.id_usuario`)
        .then((data) => {
            res.status(200).json({
                mensaje: null,
                datos: data
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        });
    }
}