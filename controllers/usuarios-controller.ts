import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Usuario } from '../modelos/modelo-usuario';
import { Token } from '../modelos/modelo-token';
import { Alumno } from '../modelos/modelo-alumno';
import * as bcrypt from 'bcrypt';
import { HelperService } from '../servicios/helper';
export class UsuariosController {
    private db: IDatabase<any>;
    private helper: HelperService;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.helper = new HelperService(db);
        // Usuarios
        this.listar_usuarios = this.listar_usuarios.bind(this);
        this.crear_usuario = this.crear_usuario.bind(this);
        this.editar_usuario = this.editar_usuario.bind(this);
        this.eliminar_usuario = this.eliminar_usuario.bind(this);
        this.activar_usuario = this.activar_usuario.bind(this);
        this.desactivar_usuario = this.desactivar_usuario.bind(this);
        // Profesores
        this.listar_profesores = this.listar_profesores.bind(this);
        this.listar_profesores_por_dia = this.listar_profesores_por_dia.bind(this);
        this.listar_profesores_por_anio = this.listar_profesores_por_anio.bind(this);
        // Alumnos
        this.listar_alumnos = this.listar_alumnos.bind(this);
        this.listar_alumnos_por_carrera = this.listar_alumnos_por_carrera.bind(this);
        this.crear_alumno = this.crear_alumno.bind(this);
        this.editar_alumno = this.editar_alumno.bind(this);
        this.eliminar_alumno = this.eliminar_alumno.bind(this);
        // Otros
        this.cambiar_contraseña = this.cambiar_contraseña.bind(this);
        this.resetear_contraseña = this.resetear_contraseña.bind(this);
        this.listar_roles = this.listar_roles.bind(this);
        this.avance_academico = this.avance_academico.bind(this);
    }

    // Usuarios    
    public async listar_usuarios(req: Request, res: Response) {
        try {
            const query = `
                SELECT U.id, U.nombre, U.apellido, U.email, U.fecha_nacimiento, U.fecha_alta, U.telefono, U.dni, R.nombre AS rol, U.domicilio, U.activo
                FROM usuarios U
                INNER JOIN roles R ON U.id_rol = R.id
                ORDER BY U.apellido, U.nombre`;
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
    public async crear_usuario(req: Request, res: Response) {
        try {
            const usuario: Usuario = req.body.usuario;
            usuario.email = usuario.email.toLowerCase();
            usuario.dni = usuario.dni.split('.').join('').split(' ').join();
            const hash = await bcrypt.hash(usuario.dni, 10);
            const query = `
                INSERT INTO usuarios (email, dni, clave, nombre, apellido, fecha_nacimiento, id_rol, telefono, domicilio, fecha_alta) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, current_timestamp) 
                RETURNING ID`;
            const result = await this.db.one(query, [usuario.email, usuario.dni, hash, usuario.nombre,
                usuario.apellido, usuario.fecha_nacimiento, usuario.id_rol, usuario.telefono, usuario.domicilio]);
            const id_usuario = result.id;
            if (usuario.id_rol === 4) {
                await this.db.none('INSERT INTO profesores (id_usuario) VALUES ($1)', [id_usuario])
            }
            res.status(200).json({
                mensaje: "El usuario se creo correctamente",
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al crear el usuario',
                error
            });
        }
    }
    public async editar_usuario(req: Request, res: Response) {
        try {
            const a: Usuario = req.body.usuario;
            a.email = a.email.toLowerCase();
            a.dni = a.dni.split('.').join('').split(' ').join();
            if (a) {
                const query = `
                    UPDATE usuarios SET 
                        nombre = $1, 
                        apellido = $2, 
                        dni = $3, 
                        email = $4,
                        telefono = $5,
                        fecha_nacimiento = $6,
                        domicilio = $7
                    WHERE id = $8;`;
                await this.db.none(query, [a.nombre, a.apellido, a.dni, a.email, a.telefono, a.fecha_nacimiento, a.domicilio, a.id]);
                res.status(200).json({
                    mensaje: 'El usuario se editó correctamente'
                });
            } else {
                res.status(400).json({
                    mensaje: 'Datos inválidos',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al editar el usuario',
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
    public async activar_usuario(req: Request, res: Response) {
        try {
            const id_usuario = +req.params.id_usuario;
            if (id_usuario) {
                const query = `
                    UPDATE usuarios SET activo = true WHERE id = $1;`;
                await this.db.none(query, [id_usuario]);
                res.status(200).json({
                    mensaje: 'El usuario se activó correctamente'
                });
            } else {
                res.status(400).json({
                    mensaje: 'Datos inválidos',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al activar el usuario',
                error
            });
        }
    }
    public async desactivar_usuario(req: Request, res: Response) {
        try {
            const id_usuario = +req.params.id_usuario;
            if (id_usuario) {
                const query = `
                    UPDATE usuarios SET activo = false WHERE id = $1;`;
                await this.db.none(query, [id_usuario]);
                res.status(200).json({
                    mensaje: 'El usuario se desactivó correctamente'
                });
            } else {
                res.status(400).json({
                    mensaje: 'Datos inválidos',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al desactivar el usuario',
                error
            });
        }
    }
    // Profesores
    public async listar_profesores(req: Request, res: Response) {
        try {
            const query = `
                SELECT p.id, u.email, u.nombre, u.apellido, u.fecha_nacimiento, u.dni, u.fecha_alta, CONCAT(u.apellido, ', ', u.nombre) AS nombre_completo
                FROM usuarios u
                INNER JOIN profesores p on p.id_usuario = u.id
                WHERE u.id_rol = 4
                ORDER BY u.apellido, u.nombre`;
            const profesores = await this.db.manyOrNone(query);
            res.json(profesores);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los profesores',
                error
            });
        }
    }
    public async listar_profesores_por_dia(req: Request, res: Response) {
        try {
            const anio = req.params.anio;
            const dia = req.params.dia;
            const query = `
            SELECT p.id, u.email, u.nombre, u.apellido, u.dni, CONCAT(u.apellido, ', ', u.nombre) AS nombre_completo,
                json_agg(json_build_object( 
                    'dia', h.dia, 
                    'hora_inicio', h.hora_inicio, 
                    'modulos', h.modulos, 
                    'materia', m.nombre, 
                    'anio', m.anio,
                    'carrera', ca.nombre
                ) ORDER BY h.dia, h.hora_inicio) AS detalle
            FROM usuarios u
            INNER JOIN profesores p ON p.id_usuario = u.id
            INNER JOIN cursadas c ON c.id_profesor = p.id
            LEFT JOIN horarios h ON h.id_cursada = c.id
            INNER JOIN materias m ON m.id = c.id_materia
            INNER JOIN carreras ca ON ca.id = m.id_carrera
            WHERE u.id_rol = 4
            AND c.anio = $1
            AND h.dia = $2
            GROUP BY p.id, u.email, u.nombre, u.apellido, u.dni, CONCAT(u.apellido, ', ', u.nombre)
            ORDER BY u.apellido, u.nombre;`;
            const profesores = await this.db.manyOrNone(query, [anio, dia]);
            res.json(profesores);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los profesores del dia',
                error
            });
        }
    }
    public async listar_profesores_por_anio(req: Request, res: Response) {
        try {
            const anio = req.params.anio;
            const query = `
                SELECT p.id, u.email, u.nombre, u.apellido, u.dni, CONCAT(u.apellido, ', ', u.nombre) AS nombre_completo,
                    json_agg(json_build_object( 
                        'dia', h.dia, 
                        'hora_inicio', h.hora_inicio, 
                        'modulos', h.modulos, 
                        'materia', m.nombre, 
                        'anio', m.anio,
                        'carrera', ca.nombre
                    ) ORDER BY h.dia, h.hora_inicio) AS detalle
                FROM usuarios u
                INNER JOIN profesores p ON p.id_usuario = u.id
                INNER JOIN cursadas c ON c.id_profesor = p.id
                LEFT JOIN horarios h ON h.id_cursada = c.id
                INNER JOIN materias m ON m.id = c.id_materia
                INNER JOIN carreras ca ON ca.id = m.id_carrera
                WHERE u.id_rol = 4
                AND c.anio = $1
                GROUP BY p.id, u.email, u.nombre, u.apellido, u.dni, CONCAT(u.apellido, ', ', u.nombre)
                ORDER BY u.apellido, u.nombre;`;
            const profesores = await this.db.manyOrNone(query, [anio]);
            res.json(profesores);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los profesores del año',
                error
            });
        }
    }
    // Alumnos
    public async listar_alumnos(req: Request, res: Response) {
        try {
            const query = `
                SELECT a.id AS id_alumno, u.nombre, u.apellido, u.dni, u.fecha_nacimiento, u.email, u.telefono, ca.cohorte, c.nombre AS carrera, 
                    concat(u.apellido, ', ', u.nombre) AS nombre_completo, u.domicilio, ic.libro, ic.folio
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
                mensaje: 'Ocurrio un error al listar los alumnos',
                error
            });
        }
    }
    public async listar_alumnos_por_carrera(req: Request, res: Response) {
        try {
            const id_carrera = +req.params.id_carrera;
            const query = `
                SELECT a.id AS id_alumno, u.nombre, u.apellido, u.dni, u.fecha_nacimiento, u.email, u.telefono, ca.cohorte, c.nombre AS carrera, 
                    concat(u.apellido, ', ', u.nombre) AS nombre_completo
                FROM alumnos a
                INNER JOIN usuarios u ON u.id = a.id_usuario
                LEFT JOIN inscripciones_carreras ic ON ic.id_alumno = a.id
                LEFT JOIN carreras_abiertas ca ON ca.id = ic.id_carrera_abierta
                LEFT JOIN carreras c ON c.id = ca.id_carrera
                WHERE c.id = $1
                ORDER BY u.apellido, u.nombre;`
            const alumnos = await this.db.manyOrNone(query, [id_carrera]);
            res.json(alumnos);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los alumnos de la carrera',
                error
            });
        }
    }
    public async crear_alumno(req: Request, res: Response) {
        try {
            const usuario: Usuario = req.body.usuario;
            usuario.email = usuario.email.toLowerCase();
            usuario.dni = usuario.dni.split('.').join('').split(' ').join();
            const id_carrera_abierta = +req.body.id_carrera_abierta;
            if (usuario) {
                const hash = await bcrypt.hash(usuario.dni, 10);
                usuario.id_rol = 5;
                let query = `
                    INSERT INTO usuarios (email, dni, clave, nombre, apellido, fecha_nacimiento, fecha_alta, id_rol, telefono, domicilio) 
                    VALUES ($1, $2, $3, $4, $5, $6, current_timestamp, $7, $8, $9) 
                    RETURNING ID`;
                let result = await this.db.one(query, [usuario.email, usuario.dni, hash, usuario.nombre,
                usuario.apellido, usuario.fecha_nacimiento, usuario.id_rol, usuario.telefono, usuario.domicilio]);
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
    public async editar_alumno(req: Request, res: Response) {
        try {
            const a: Alumno = req.body.alumno;
            a.email = a.email.toLowerCase();
            a.dni = a.dni.split('.').join('').split(' ').join();
            if (a) {
                let query = `SELECT id_usuario FROM alumnos WHERE id = $1`;
                let result = await this.db.one(query, [a.id_alumno]);
                const id_usuario = result.id_usuario;
                query = `
                    UPDATE usuarios SET 
                        nombre = $1, 
                        apellido = $2, 
                        dni = $3, 
                        email = $4,
                        telefono = $5,
                        fecha_nacimiento = $6,
                        domicilio = $7
                    WHERE id = $8;`;
                result = await this.db.none(query, [a.nombre, a.apellido, a.dni, a.email, a.telefono, a.fecha_nacimiento, a.domicilio, id_usuario]);
                res.status(200).json({
                    mensaje: 'El alumno se editó correctamente'
                });
            } else {
                res.status(400).json({
                    mensaje: 'Datos inválidos',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al editar el alumno',
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
    // Contraseña
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
                mensaje: 'Ocurrio un error al cambiar la contraseña',
                error
            });
        }
    }
    public async resetear_contraseña(req: Request, res: Response) {
        try {
            const id_usuario = req.params.id_usuario;
            let query = `SELECT dni FROM usuarios WHERE id = $1`;
            const result = await this.db.one(query, [id_usuario]);
            const dni = result.dni;
            const hash = await bcrypt.hash(dni, 10);
            query = `UPDATE usuarios SET clave = $1 WHERE id = $2`;
            await this.db.none(query, [hash, id_usuario]);
            res.status(200).json({
                mensaje: "Reseteo de contraseña exitoso",
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al resetear la contraseña',
                error
            });
        }
    }
    // Roles
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
    // Avance Academico
    public async avance_academico(req: Request, res: Response) {
        try {
            let id_alumno;
            if (+req.params.id_alumno) {
                id_alumno = +req.params.id_alumno
            } else {
                const token: Token = res.locals.token;
                id_alumno = +token.id_alumno;
            }
            if (id_alumno) {
                const query = `
                    SELECT c.nombre AS carrera, c.nombre_corto, c.resolucion, ca.cohorte, us.apellido, us.nombre, us.dni, us.telefono, us.fecha_nacimiento, us.domicilio, ica.libro, ica.folio,
                        json_agg(json_build_object( 
                            'materia', ma.nombre, 
                            'anio', ma.anio, 
                            'nota_cuat_1', c1.nota_cuat_1, 
                            'nota_cuat_2', c1.nota_cuat_2, 
                            'nota_recuperatorio', c1.nota_recuperatorio, 
                            'asistencia', c1.asistencia, 
                            'final', c2.nota,
                            'libro', c2.libro,
                            'folio', c2.folio
                        ) ORDER BY ma.anio, ma.nombre) AS materias
                    FROM alumnos al
                    INNER JOIN usuarios us ON us.id = al.id_usuario               
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
                        INNER JOIN tipos_materias tm ON tm.id = ma.id_tipo
                        LEFT JOIN avance_academico aa ON aa.id_inscripcion_cursada = icu.id
                        WHERE icu.id_alumno = $1
                        AND ((aa.nota_cuat_1 >=4 and aa.nota_cuat_2 >=4) OR (aa.nota_recuperatorio >=4))
                        AND aa.asistencia >= tm.asistencia
                    ) c1 ON c1.id_materia = ma.id
                    LEFT JOIN (
                        SELECT ma.id AS id_materia, fi.nota, fi.libro, fi.folio
                        FROM inscripciones_mesa ime
                        INNER JOIN mesas me ON me.id = ime.id_mesa
                        INNER JOIN materias ma ON ma.id = me.id_materia
                        LEFT JOIN finales fi ON fi.id_inscripcion_mesa = ime.id
                        WHERE ime.id_alumno = $1
                        AND fi.nota >= 4 
                    ) c2 ON c2.id_materia = ma.id
                    WHERE al.id = $1
                    GROUP BY c.nombre, c.nombre_corto, c.resolucion, ca.cohorte, us.apellido, us.nombre, us.dni, us.telefono, us.fecha_nacimiento, us.domicilio, ica.libro, ica.folio
                    ORDER BY c.nombre`;
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
