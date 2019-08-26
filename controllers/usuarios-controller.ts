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
        this.eliminar_alumno = this.eliminar_alumno.bind(this);
        this.avance_academico = this.avance_academico.bind(this);
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
            if (usuario) {
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
                            mensaje: 'El alumno se creó correctamente e inscribió a la carrera'
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
            } else {
                res.status(400).json({
                    mensaje: 'Datos inválidos',
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
                SELECT p.id, u.email, u.nombre, u.apellido, u.fecha_nacimiento, u.dni, u.fecha_alta, CONCAT(u.apellido, ', ', u.nombre) AS nombre_completo
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
                SELECT a.id AS id_alumno, u.nombre, u.apellido, u.dni, u.fecha_nacimiento, u.email, u.telefono, ca.cohorte, c.nombre AS carrera
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
            const id_usuario = +req.params.id_usuario;
            let query = `
                SELECT r.nombre AS rol 
                FROM usuarios u 
                INNER JOIN roles r ON r.id = u.id_rol 
                WHERE u.id = $1;`;
            const result = await this.db.one(query, [id_usuario]);
            const rol = result.rol;
            if (rol === 'alumno') {
                query = `DELETE FROM alumnos WHERE id_usuario = $1;`;
                await this.db.none(query, [id_usuario]);
            } else if (rol === 'profesor') {
                query = `DELETE FROM profesores WHERE id_usuario = $1;`;
                await this.db.none(query, [id_usuario]);
            }
            query = `DELETE FROM usuarios WHERE id = $1;`;
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
    public async eliminar_alumno(req: Request, res: Response) {
        try {
            const id_alumno = req.params.id_alumno;
            let query = `SELECT id_usuario FROM alumnos WHERE id = $1`;
            const result = await this.db.one(query, [id_alumno]);
            const id_usuario = result.id_usuario;
            query = `DELETE FROM alumnos WHERE id = $1`;
            await this.db.none(query, [id_alumno]);
            query = `DELETE FROM usuarios WHERE id = $1`;
            await this.db.none(query, [id_usuario]);
            res.json({
                mensaje: 'Se eliminó el alumno'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar el alumno',
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

    public async avance_academico(req: Request, res: Response) {
        try {
            const token: Token = res.locals.token;
            const id_alumno = +token.id_alumno;
            if (id_alumno) {
                const query = `
                    SELECT c.nombre AS carrera, ma.nombre AS materia, ma.anio, ca.cohorte,
                        c1.nota_cuat_1, c1.nota_cuat_2, c1.nota_recuperatorio, c1.asistencia,
                        c2.nota AS final, c2.libro, c2.folio
                    FROM alumnos al                    
                    INNER JOIN inscripciones_carreras ica ON ica.id_alumno = al.id
                    INNER JOIN carreras_abiertas ca ON ca.id = ica.id_carrera_abierta
                    INNER JOIN carreras c ON c.id = ca.id_carrera
                    INNER JOIN materias ma ON ma.id_carrera = c.id
                    LEFT JOIN (
                        SELECT ma.id AS id_materia, aa.nota_cuat_1, aa.nota_cuat_2, 
                            aa.nota_recuperatorio, aa.asistencia
                        FROM inscripciones_cursadas icu
                        INNER JOIN cursadas cu ON cu.id = icu.id_cursada
                        INNER JOIN materias ma ON ma.id = cu.id_materia
                        LEFT JOIN avance_academico aa ON aa.id_inscripcion_cursada = icu.id
                        WHERE icu.id_alumno = $1
                    ) c1 ON c1.id_materia = ma.id
                    LEFT JOIN (
                        SELECT ma.id AS id_materia, fi.nota, fi.libro, fi.folio
                        FROM inscripciones_mesa ime
                        INNER JOIN mesas me ON me.id = ime.id_mesa
                        INNER JOIN materias ma ON ma.id = me.id_materia
                        LEFT JOIN finales fi ON fi.id_inscripcion_mesa = ime.id
                        WHERE ime.id_alumno = $1
                    ) c2 ON c2.id_materia = ma.id
                    WHERE al.id = $1
                    ORDER BY c.nombre, ma.anio, ma.nombre;`;
                const avance = await this.db.manyOrNone(query, [id_alumno]);
                res.json(avance);
            } else {
                res.status(400).json({
                    mensaje: 'El usuario no es un alumno',
                });
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar el avance académico',
                error
            });
        }
    }
}
