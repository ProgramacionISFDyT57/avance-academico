import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Usuario } from '../modelo';

export class UsuariosController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.crear_usuario = this.crear_usuario.bind(this);
        this.ver_profesores = this.ver_profesores.bind(this);
    }

    public crear_usuario(req: Request, res: Response) {
        const usuario: Usuario = req.body.usuario;
        this.db.one('INSERT INTO usuarios (id, email, clave, nombre, apellido, fecha_nacimiento, fecha_alta, id_rol) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ID', [usuario.id, usuario.email, usuario.clave, usuario.nombre, usuario.apellido, usuario.fecha_nacimiento, usuario.fecha_alta, usuario.id_rol])
            .then((data) => {
                if (data.id_rol === 4) {
                    this.db.one('INSERT INTO profedores (id_usuario) VALUES ($1) RETURNING ID', [usuario.id])
                        .then((data) => {

                        }
                        )
                }
                if (data.id_rol === 5) {
                    this.db.one('INSERT INTO alumnos (id_usuario) VALUES ($1) RETURNING ID', [usuario.id])
                        .then((data) => {

                        }
                        )

                }
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
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    }

}