import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Usuario } from '../modelos/modelo-usuario';
import { Token } from '../modelos/modelo-token';
import * as bcrypt from 'bcrypt';
export class UsuariosController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.crear_usuario = this.crear_usuario.bind(this);
        this.listar_usuarios = this.listar_usuarios.bind(this);
        this.ver_profesores = this.ver_profesores.bind(this);
        this.listar_alumnos = this.listar_alumnos.bind(this);
        this.cambiar_contraseña = this.cambiar_contraseña.bind(this);
    }

    public cambiar_contraseña(req: Request, res:Response){
        const claveVieja: string = req.body.claveVieja;
        const newPass: string = req.body.claveNueva;
        const token: Token = res.locals;
        const query = `SELECT clave FROM usuarios WHERE id = $1`;
        this.db.one(query, [token.id_usuario])
        .then((data) => {
            bcrypt.compare(claveVieja, data.clave, (err, same) => {
                if (err) {
                    res.status(500).json({
                        error: err,
                        mensaje: "Ocurrio un error al comparar las claves"
                    });
                }
                else if (same) {
                    bcrypt.hash(newPass, 10, (error, hash) => {
                        this.db.none(`UPDATE usuarios SET clave = $1 WHERE id =$2`, [hash, token.id_usuario])
                        .then( () => {
                            res.status(200).json({
                                mensaje: "Modificación de contraseña exitosa",
                            });
                        })
                        .catch( (err) => {
                            res.status(500).json(err);
                        })
                    })
                } else {
                    res.status(400).json({
                        mensaje: "La contraseña no coincide",
                    });
                }
            })
        })
        .catch( (err) => {
            res.status(500).json(err);
        })
    }
    public crear_usuario(req: Request, res: Response) {
        const usuario: Usuario = req.body.usuario;
        bcrypt.hash(usuario.dni, 10, (error, hash) => {
            const query = `
                INSERT INTO usuarios ( email, dni, clave, nombre, apellido, fecha_nacimiento, fecha_alta, id_rol, telefono) 
                VALUES ($1, $2, $3, $4, $5, $6, current_timestamp, $7, $8) 
                RETURNING ID`;
            this.db.one(query, [ usuario.email, usuario.dni, hash, usuario.nombre, 
                usuario.apellido, usuario.fecha_nacimiento , usuario.id_rol, usuario.telefono])
            .then((data) => {
                if (usuario.id_rol === 4) {
                    this.db.one('INSERT INTO profesores (id_usuario) VALUES ($1) RETURNING ID', [data.id])
                        .then((data) => {
                            res.status(200).json({
                                mensaje: "El usuario se creo correctamente",
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).json(err);
                        });
                } else if (usuario.id_rol === 5) {
                    this.db.one('INSERT INTO alumnos (id_usuario) VALUES ($1) RETURNING ID', [data.id])
                        .then((data) => {
                            res.status(200).json({
                                mensaje: "El usuario se creo correctamente",
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).json(err);
                        });
                } else {
                    res.status(200).json({
                        mensaje: "El usuario se creo correctamente",
                    });
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json(err);
            });
        });   
    }
    public listar_usuarios(req: Request, res: Response) {
        this.db.manyOrNone(`
            SELECT U.id, U.nombre, U.apellido, U.email, U.fecha_nacimiento, U.fecha_alta, R.nombre AS rol
            FROM usuarios U
            INNER JOIN roles R ON U.id_rol = R.id`)
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json(err);
            });
    }
    public ver_profesores(req: Request, res: Response) {
        const query = `
            SELECT p.id, u.email, u.nombre, u.apellido, u.fecha_nacimiento, u.fecha_alta 
            FROM usuarios u
            INNER JOIN profesores p on p.id_usuario = u.id
            WHERE u.id_rol = 4`;
        this.db.manyOrNone(query)
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json(err);
            });
    }
    public listar_alumnos(req: Request, res: Response) {
        this.db.manyOrNone(`
        SELECT alumnos.id, usuarios.nombre, usuarios.apellido FROM alumnos
        inner join usuarios on usuarios.id = alumnos.id_usuario`)
        .then((data) => {
            res.status(200).json(data);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
    }
}
