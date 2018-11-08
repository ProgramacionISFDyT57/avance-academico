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
        const email: string =  req.body.mail;
        const clave: string =  req.body.clave;
        this.db.oneOrNone(`
            SELECT id, id_rol, clave FROM usuarios
            WHERE email = $1
            `, [email])
        .then( (data) => {
            if (data) {
                bcrypt.compare(clave, data.clave, (err, same) => {
                    if (err) {
                        res.status(500).json({
                            mensaje: err,
                            datos: null
                        });
                    } else if (same) {
                        const token: Token = {
                            id_usuario: data.id,
                            id_rol: data.id_rol
                        }
                        jwt.sign(token, process.env.JWT, (jwt) => {
                            res.status(200).json({
                                mensaje: null,
                                datos: jwt
                            });
                        });
                    } else {
                        res.status(401).json({
                            mensaje: 'Email o contraseña incorrectos',
                            datos: null
                        });
                    }
                });
            } else {
                res.status(401).json({
                    mensaje: 'Email o contraseña incorrectos',
                    datos: null
                });
            }
        })
        .catch( (err) => {
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        })
    }

    public chequear_roles(id_roles: number[]) {
        return (req: Request, res: Response, next: NextFunction) => {
            const token = req.get('x-access-token');
            jwt.verify(token, process.env.JWT, (err, decoded: Token) => {
                if (err) {
                    res.status(401).json({
                        mensaje: 'Token inválido',
                        datos: null
                    })
                } else {
                    if (id_roles.indexOf(decoded.id_rol) != -1){
                    // if (id_roles.includes(decoded.id_rol)){
                        res.locals = decoded;
                        next();
                    } else {
                        res.status(403).json({
                            mensaje: 'Acceso no permitido',
                            datos: null
                        })
                    }
                }
            });
        }
    }

}