import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { IDatabase } from 'pg-promise';
import { Request, Response, NextFunction } from 'express';
import { Token } from '../modelos/modelo-token';


export class SeguridadController {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.login = this.login.bind(this);
        this.chequear_roles = this.chequear_roles.bind(this);
    }

    public login(req: Request, res: Response) {
        const email: string = req.body.mail;
        const clave: string = req.body.clave;
        const query = `
            SELECT u.id, u.clave, u.nombre, u.apellido, r.nombre AS rol, a.id AS id_alumno, u.activo
            FROM usuarios u
            INNER JOIN roles r ON r.id = u.id_rol  
            LEFT JOIN alumnos a ON a.id_usuario = u.id
            WHERE u.email = $1`;
        this.db.oneOrNone(query, [email])
            .then((data) => {
                if (data) {
                    if (data.activo) {
                        bcrypt.compare(clave, data.clave, (err, same) => {
                            if (err) {
                                res.status(500).json(err);
                            } else if (same) {
                                const token: Token = {
                                    id_usuario: data.id,
                                    id_alumno: data.id_alumno,
                                    rol: data.rol,
                                }
                                jwt.sign(token, process.env.JWT, (err, jwt) => {
                                    if (err) {
                                        res.status(500).json(err);
                                    } else {
                                        res.status(200).json({
                                            token: jwt,
                                            apellido: data.apellido,
                                            nombre: data.nombre,
                                            rol: data.rol
                                        });
                                    }
                                });

                            } else {
                                res.status(401).json({
                                    mensaje: 'Email o contraseña incorrectos',
                                });
                            }
                        });
                    } else {
                        res.status(401).json({
                            mensaje: 'El usuario se encuentra deshabilitado',
                        });
                    }
                } else {
                    res.status(401).json({
                        mensaje: 'Email o contraseña incorrectos',
                    });
                }
            })
            .catch((err) => {
                res.status(500).json(err);
            })
    }

    public chequear_roles(roles?: string[]) {
        return (req: Request, res: Response, next: NextFunction) => {
            const token = req.get('x-access-token');
            jwt.verify(token, process.env.JWT, (err, decoded: Token) => {
                if (err) {
                    res.status(401).json({
                        mensaje: 'Token inválido',
                    });
                } else {
                    if (decoded.rol === 'admin' || !roles || roles.includes(decoded.rol)) {
                        res.locals.token = decoded;
                        next();
                    } else {
                        res.status(403).json({
                            mensaje: 'Acceso no permitido',
                            rolesAceptados: roles,
                            suRol: decoded.rol
                        });
                    }
                }
            });
        }
    }

}