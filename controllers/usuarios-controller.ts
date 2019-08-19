import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Usuario } from '../modelos/modelo-usuario';
import { Token } from '../modelos/modelo-token';
import * as bcrypt from 'bcrypt';
import { HelperService } from '../servicios/helper';
export class UsuariosController {
    private db: IDatabase<any>;
    private helper: HelperService;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.helper = new HelperService(db);
        this.crear_usuario = this.crear_usuario.bind(this);
        this.crear_alumno = this.crear_alumno.bind(this);
        this.listar_usuarios = this.listar_usuarios.bind(this);
        this.listar_profesores = this.listar_profesores.bind(this);
        this.listar_alumnos = this.listar_alumnos.bind(this);
        this.cambiar_contraseña = this.cambiar_contraseña.bind(this);
        this.listar_roles = this.listar_roles.bind(this);
        this.eliminar_usuario = this.eliminar_usuario.bind(this);
    }

    public async cambiar_contraseña(req: Request, res: Response) {
        try {
            const claveVieja: string = req.body.claveVieja;
            const newPass: string = req.body.claveNueva;
            const token: Token = res.locals.token;
            const id_usuario = +token.id_usuario;
            let query = `SELECT clave FROM usuarios WHERE id = $1`;
            const result = await this.db.one(query, [id_usuario]);
            const same = await bcrypt.compare(claveVieja, result.clave);
            if (same) {
                const hash = await bcrypt.hash(newPass, 10);
                query = `UPDATE usuarios SET clave = $1 WHERE id = $2`;
                await this.db.none(query, [hash, id_usuario]);
                res.status(200).json({
                    mensaje: "Modificación de contraseña exitosa",
                });
            } else {
                res.status(400).json({
                    mensaje: "La contraseña no coincide",
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al crear el alumno',
                error
            });
        }
    }
    public crear_usuario(req: Request, res: Response) {
        const usuario: Usuario = req.body.usuario;
        bcrypt.hash(usuario.dni, 10, (error, hash) => {
            const query = `
                INSERT INTO usuarios (email, dni, clave, nombre, apellido, fecha_nacimiento, fecha_alta, id_rol, telefono) 
                VALUES ($1, $2, $3, $4, $5, $6, current_timestamp, $7, $8) 
                RETURNING ID`;
            this.db.one(query, [usuario.email, usuario.dni, hash, usuario.nombre,
            usuario.apellido, usuario.fecha_nacimiento, usuario.id_rol, usuario.telefono])
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
    public async crear_alumno(req: Request, res: Response) {
        try {
            const usuario: Usuario = req.body.usuario;
            const id_carrera_abierta = +req.body.id_carrera_abierta;
            const hash = await bcrypt.hash(usuario.dni, 10);
            usuario.id_rol = 5;
            let query = `
                INSERT INTO usuarios (email, dni, clave, nombre, apellido, fecha_nacimiento, fecha_alta, id_rol, telefono) 
                VALUES ($1, $2, $3, $4, $5, $6, current_timestamp, $7, $8) 
                RETURNING ID`;
            let result = await this.db.one(query, [usuario.email, usuario.dni, hash, usuario.nombre,
            usuario.apellido, usuario.fecha_nacimiento, usuario.id_rol, usuario.telefono]);
            const id_usuario = result.id;
            query = 'INSERT INTO alumnos (id_usuario) VALUES ($1) RETURNING ID';
            result = await this.db.one(query, [id_usuario]);
            const id_alumno = result.id;
            if (id_carrera_abierta) {
                const carrera_abierta = await this.helper.carrera_abierta(id_carrera_abierta);
                if (carrera_abierta === true) {
                    query = `INSERT INTO inscripciones_carreras (id_alumno, id_carrera_abierta, fecha_inscripcion) 
                        VALUES ($1, $2, current_timestamp) RETURNING ID`;
                    await this.db.one(query, [id_alumno, id_carrera_abierta]);
                    res.status(200).json({
                        mensaje: 'El alumno se creó correctamente e insscribió a la carrera'
                    });
                } else {
                    res.json({
                        mensaje: 'El alumno se creó correctamente pero no se encuentra la carrera abierta',
                        error: carrera_abierta
                    });
                }
            } else {
                res.json({
                    mensaje: 'El alumno se creó correctamente',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al crear el alumno',
                error
            });
        }
    }
    public async listar_usuarios(req: Request, res: Response) {
        try {
            const query = `
                SELECT U.id, U.nombre, U.apellido, U.email, U.fecha_nacimiento, U.fecha_alta, U.telefono, U.dni, R.nombre AS rol
                FROM usuarios U
                INNER JOIN roles R ON U.id_rol = R.id`;
            const usuarios = await this.db.manyOrNone(query);
            res.json(usuarios);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar el usuario',
                error
            });
        }
    }
    public async listar_profesores(req: Request, res: Response) {
        try {
            const query = `
                SELECT p.id, u.email, u.nombre, u.apellido, u.fecha_nacimiento, u.dni, u.fecha_alta 
                FROM usuarios u
                INNER JOIN profesores p on p.id_usuario = u.id
                WHERE u.id_rol = 4`;
            const profesores = await this.db.manyOrNone(query);
            res.json(profesores);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar el usuario',
                error
            });
        }
    }
    public async listar_alumnos(req: Request, res: Response) {
        try {
            const query = `
                SELECT a.id, u.nombre, u.apellido, u.dni, u.fecha_nacimiento, u.email, u.telefono, ca.cohorte, c.nombre AS carrera
                FROM alumnos a
                INNER JOIN usuarios u ON u.id = a.id_usuario
                LEFT JOIN inscripciones_carreras ic ON ic.id_alumno = a.id
                LEFT JOIN carreras_abiertas ca ON ca.id = ic.id_carrera_abierta
                LEFT JOIN carreras c ON c.id = ca.id_carrera
                ORDER BY u.apellido, u.nombre;`
            const alumnos = await this.db.manyOrNone(query);
            res.json(alumnos);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar el usuario',
                error
            });
        }
    }
    public async eliminar_usuario(req: Request, res: Response) {
        try {
            const id_usuario = req.params.id_usuario;
            const query = `DELETE FROM usuarios WHERE id = $1`;
            await this.db.none(query, [id_usuario]);
            res.json({
                mensaje: 'Se eliminó el usuario'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar el usuario',
                error
            });
        }
    }

    public async listar_roles(req: Request, res: Response) {
        try {
            const query = `SELECT * FROM roles;`
            const roles = await this.db.manyOrNone(query);
            res.status(200).json({
                mensaje: 'Listado de roles',
                datos: roles
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los roles',
                error
            });
        }
    }
}
