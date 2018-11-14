import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Usuario } from '../modelos/modelo-usuario';
import {Token } from '../modelos/modelo-token'
import * as bcrypt from 'bcrypt';
export class UsuariosController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.crear_usuario = this.crear_usuario.bind(this);
        this.ver_profesores = this.ver_profesores.bind(this);
        this.listar_alumnos = this.listar_alumnos.bind(this);
        this.cambiar_contraseña = this.cambiar_contraseña.bind(this);
    }
    public cambiar_contraseña(req: Request, res:Response){
        const claveVieja: string = req.body.claveVieja;
        const newPass: string = req.body.nuevaclave;
        const token: Token = res.locals;
        this.db.one(`SELECT clave FROM usuarios WHERE id = $1`, [token.id_usuario])
        .then((data) => {
            bcrypt.compare(claveVieja, data.clave, (err, same) => {
                if(err){
                    res.status(500).json({
                        mensaje: err,
                        datos: null
                    })
                }
                else if(same){
                    bcrypt.hash(newPass, 10, (error, hash) => {
                        this.db.one(`UPDATE usuarios SET clave = $1 WHERE id =$2`, [hash, token])
                        .then((data)=>{
                            res.status(200).json({
                                mensaje: "Modificación de contraseña exitosa",
                                datos: data
                            });
                        })
                    })
                }
            })
        })
        .catch( (err) => {
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        })
    }

    public crear_usuario(req: Request, res: Response) {
        const usuario: Usuario = req.body.usuario;
        bcrypt.hash(usuario.clave, 10, (error, hash) => {
            this.db.one(`INSERT INTO usuarios (id, email, clave, nombre, apellido, fecha_nacimiento, fecha_alta, id_rol) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING ID`, [usuario.id, usuario.email, hash, usuario.nombre, usuario.apellido, usuario.fecha_nacimiento, usuario.fecha_alta, usuario.id_rol])
            .then((data) => {
                if (data.id_rol === 4) {
                    this.db.one('INSERT INTO profedores (id_usuario) VALUES ($1) RETURNING ID', [usuario.id])
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
                        })
                } else if (data.id_rol === 5) {
                    this.db.one('INSERT INTO alumnos (id_usuario) VALUES ($1) RETURNING ID', [usuario.id])
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
                    res.status(200).json({
                        mensaje: "El id_rol ingresado es incorrecto",
                        datos: data
                    });
                }
            })
            .catch((err) => {
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
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
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        });
    }
}