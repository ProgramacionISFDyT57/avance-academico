import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Cursada } from '../modelos/modelo-cursada';
import { Avance } from '../modelos/modelo-avance-academico';
import { Token } from '../modelos/modelo-token';
import { HelperService } from '../servicios/helper';

export class CursadasController {
    private db: IDatabase<any>;
    private helper: HelperService;
    private log: string = '';

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.helper = new HelperService(db);
        this.crear_cursada = this.crear_cursada.bind(this);
        this.listar_cursadas_abiertas = this.listar_cursadas_abiertas.bind(this);
        this.eliminar_cursada = this.eliminar_cursada.bind(this);

        this.ver_cursadas_abiertas_alumno = this.ver_cursadas_abiertas_alumno.bind(this);
        this.listar_cursadas_aprobadas = this.listar_cursadas_aprobadas.bind(this);

        this.cargar_notas_cursada = this.cargar_notas_cursada.bind(this);
        this.eliminar_notas_cursada = this.eliminar_notas_cursada.bind(this);
        this.crear_inscripcion_cursada = this.crear_inscripcion_cursada.bind(this);
        this.eliminar_inscripcion_cursada = this.eliminar_inscripcion_cursada.bind(this);
        this.listar_inscriptos_cursada = this.listar_inscriptos_cursada.bind(this);
    }
    public async crear_cursada(req: Request, res: Response) {
        try {
            const cursada: Cursada = req.body.cursada;
            const año = new Date().getFullYear();
            if (cursada.año < año) {
                res.status(400).json({
                    mensaje: 'El año no puede ser menor que el año actual',
                });
            } else {
                const fecha_inicio = new Date(cursada.fecha_inicio);
                const fecha_limite = new Date(cursada.fecha_limite);
                if (fecha_inicio > fecha_limite) {
                    res.status(400).json({
                        mensaje: 'La fecha de inicio no puede ser superior a la fecha límite',
                    });
                } else {
                    const fecha_actual = new Date();
                    if (fecha_actual > fecha_limite) {
                        res.status(400).json({
                            mensaje: 'La fecha límite no puede ser menor a la actual',
                        });
                    } else {
                        let query = `SELECT id FROM cursadas WHERE id_materia = $1 AND anio = $2;`;
                        const data = await this.db.oneOrNone(query, [cursada.id_materia, cursada.año]);
                        if (data) {
                            res.status(400).json({
                                mensaje: 'La cursada ya se encuentra abierta para inscripción',
                            });
                        } else {
                            query = `
                                INSERT INTO cursadas (id_materia, id_profesor, anio, fecha_inicio, fecha_limite) 
                                VALUES ($1, $2, $3, $4, $5);`;
                            await this.db.none(query, [cursada.id_materia, cursada.id_profesor, cursada.año, cursada.fecha_inicio, cursada.fecha_limite]);
                            res.json({
                                mensaje: 'Se creo la cursada correctamente'
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al crear la cursada',
                error
            });
        }
    }
    public listar_cursadas_aprobadas(req: Request, res: Response) {
        const token: Token = res.locals.token;
        const id_alumno = token.id_alumno;
        const query = `
            SELECT m.nombre
            FROM avance_academico aa
            INNER JOIN inscripciones_cursadas ic ON ic.id = aa.id_inscripcion_cursada
            INNER JOIN cursadas c ON c.id = ic.id_cursada
            INNER JOIN materias m ON m.id = c.id_materia
            INNER JOIN tipos_materias tm ON tm.id = m.id_tipo
            WHERE ic.id_alumno = $1
            AND ((aa.nota_cuat_1 >=4 and aa.nota_cuat_2 >=4) OR (aa.nota_recuperatorio >=4))
            AND ((tm.id = 2 AND aa.asistencia >= 80) OR (tm.id != 2 AND aa.asistencia >= 60))`;
        this.db.manyOrNone(query, [id_alumno])
            .then(resultado => {
                res.status(200).json(resultado);
            })
            .catch(err => {
                console.error(err);
                res.status(200).json(err);
            });
    }
    public ver_cursadas_abiertas_alumno(req: Request, res: Response) {
        const id_alumno: number = req.params.id_alumno;
        // Buscar las cursadas abiertas de las carreras donde esta inscripto el alumno 
        // y no la tiene aprobada y si tiene las correlativas o no tiene correlativas
        this.db.manyOrNone(`
            SELECT M.id, M.nombre, M.anio FROM materias M
            INNER JOIN cursadas C ON M.id = C.id_materia
            LEFT JOIN correlativas CO ON CO.id_materia = M.id
            WHERE M.id_carrera IN (
                SELECT CA.id_carrera FROM carreras_abiertas CA
                INNER JOIN inscripciones_carreras IC ON IC.id_carrera_abierta = CA.id
                WHERE IC.id_alumno = $1
                )
            AND current_timestamp BETWEEN C.fecha_inicio AND fecha_limite
            AND M.id NOT IN (
                SELECT M.id FROM materias M
                INNER JOIN cursadas C ON c.id_materia = M.id
                INNER JOIN inscripciones_cursadas IC ON IC.id_cursada = C.id
                INNER JOIN avance_academico AA ON AA.id_inscripcion_cursada = IC,id
                INNER JOIN tipos_materias TM ON TM.id = M.id_tipo
                WHERE IC.id_alumno = $1
                AND ( (AA.nota_cuat_1 >= 4 AND AA.nota_cuat_1 >= 4) OR (AA.nota_recuperatorio >= 4 ) )
                AND ( (TM.id = 2 AND AA.asistencia >= 80) OR (TM.id != 2 AND AA.asistencia >= 60) )
                )
            AND ( CO.id_correlativa IN (
                SELECT M.id FROM materias M
                INNER JOIN cursadas C ON c.id_materia = M.id
                INNER JOIN inscripciones_cursadas IC ON IC.id_cursada = C.id
                INNER JOIN avance_academico AA ON AA.id_inscripcion_cursada = IC,id
                INNER JOIN tipos_materias TM ON TM.id = M.id_tipo
                WHERE IC.id_alumno = $1
                AND ( (AA.nota_cuat_1 >= 4 AND AA.nota_cuat_1 >= 4) OR (AA.nota_recuperatorio >= 4 ) )
                AND ( (TM.id = 2 AND AA.asistencia >= 80) OR (TM.id != 2 AND AA.asistencia >= 60) )
                ) 
                OR CO.id_correlativa IS NULL )
            ORDER BY M.nombre`, [id_alumno])
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json(err);
            });
    }
    public async listar_cursadas_abiertas(req: Request, res: Response) {
        try {
            const token: Token = res.locals.token;
            const id_alumno = +token.id_alumno;
            let query;
            let cursadas;
            if (id_alumno) {
                // Muestra las cursadas de la/s carreras del alumno
                query = `
                    SELECT cu.id, cu.anio AS anio_cursada, cu.fecha_inicio, cu.fecha_limite, 
                        M.nombre AS materia, M.anio AS anio_materia, c.nombre AS carrera,
                        CONCAT_WS(', ', U.apellido, U.nombre) AS profesor, ic2.id AS id_inscripcion_cursada,
                        aa.nota_cuat1, aa.nota_cuat2, aa.recuperatorio, aa.asistencia 
                    FROM cursadas cu
                    INNER JOIN materias M ON M.id = cu.id_materia
                    INNER JOIN carreras c ON c.id = M.id_carrera
                    INNER JOIN carreras_abiertas ca ON ca.id_carrera = c.id
                    INNER JOIN inscripciones_carreras ica ON ica.id_carrera_abierta = ca.id
                    LEFT JOIN profesores P ON P.id = cu.id_profesor
                    LEFT JOIN usuarios U ON U.id = P.id_usuario
                    LEFT JOIN inscripciones_cursadas ic ON ic.id_cursada = cu.id
                    LEFT JOIN inscripciones_cursadas ic2 ON ic2.id_cursada = cu.id AND ic2.id_alumno = $1
                    LEFT JOIN avance_academico aa ON aa.id_inscripcion_cursada = ic2.id
                    WHERE ica.id_alumno = $1
                    AND cu.anio >= ca.cohorte
                    ORDER BY cu.anio DESC, c.nombre, M.anio, M.nombre`;
                    cursadas = await this.db.manyOrNone(query, [id_alumno]);
            } else {
                // Muestra todas las cursadas
                query = `
                    SELECT C.id, C.anio AS anio_cursada, C.fecha_inicio, C.fecha_limite, 
                        M.nombre AS materia, M.anio AS anio_materia, ca.nombre AS carrera,
                        CONCAT_WS(', ', U.apellido, U.nombre) AS profesor,
                        COUNT(ic.id) AS cant_inscriptos
                    FROM cursadas C
                    INNER JOIN materias M ON M.id = C.id_materia
                    INNER JOIN carreras ca ON ca.id = M.id_carrera
                    LEFT JOIN profesores P ON P.id = C.id_profesor
                    LEFT JOIN usuarios U ON U.id = P.id_usuario
                    LEFT JOIN inscripciones_cursadas ic ON ic.id_cursada = C.id
                    GROUP BY C.id, C.anio, C.fecha_inicio, C.fecha_limite, 
                        M.nombre, M.anio, ca.nombre, 
                        CONCAT_WS(', ', U.apellido, U.nombre)
                    ORDER BY C.anio DESC, ca.nombre, M.anio, M.nombre`;
                cursadas = await this.db.manyOrNone(query);
            }
            res.status(200).json(cursadas);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar las cursada',
                error
            });
        }
    }
    public async eliminar_cursada(req: Request, res: Response) {
        try {
            const id_cursada = +req.params.id_cursada;
            const query = 'DELETE FROM cursadas WHERE id = $1;'
            await this.db.none(query, [id_cursada]);
            res.status(200).json({
                mensaje: 'Se eliminó la cursada',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar la cursada',
                error
            });
        }
    }

    private notas_validas(avance: Avance) {
        if (avance.nota_cuat_1 >= 4 && avance.nota_cuat_2 >= 4 && avance.nota_recuperatorio) {
            return 'No es posible tener nota de recuperatorio con los dos cuatrimestres aprobados';
        } else if (avance.nota_cuat_1 < 4 && avance.nota_cuat_2 < 4 && avance.nota_recuperatorio) {
            return 'No es posible tener nota de recuperatorio con los dos cuatrimestres desaprobados';
        } else if (avance.nota_cuat_1 % 1 !== 0 || avance.nota_cuat_2 % 1 !== 0 || avance.nota_recuperatorio % 1 !== 0) {
            return 'Las notas deben ser números enteros';
        } else if ( 
            ((avance.nota_cuat_1) && (avance.nota_cuat_1 < 1 || avance.nota_cuat_1 > 10)) ||
            ((avance.nota_cuat_2) && (avance.nota_cuat_2 < 1 || avance.nota_cuat_2 > 10)) ||
            ((avance.nota_recuperatorio) && (avance.nota_recuperatorio < 1 || avance.nota_recuperatorio > 10)) 
        ) {
            return 'Las notas deben ser entre 1 y 10';
        } else {
            return true;
        }
    }

    private asistencia_valida(avance: Avance) {
        if (avance.asistencia) {
            if (avance.asistencia < 0 || avance.asistencia > 100) {
                return 'La asistencia debe ser un número entero entre 0 y 100';
            } else if (avance.asistencia % 1 !== 0 || avance.asistencia % 1 !== 0) {
                return 'La asistencia debe ser un número entero entre 0 y 100';
            }
        }
        return true;
    }

    public async cargar_notas_cursada(req: Request, res: Response) {
        try {
            const avance: Avance = req.body.avance_academico;
            const notas_validas = this.notas_validas(avance);
            if (notas_validas === true) {
                const asistencia_valida = this.asistencia_valida(avance);
                if (asistencia_valida === true) {
                    const query =
                        `INSERT INTO avance_academico (id_inscripcion_cursada, nota_cuat_1, nota_cuat_2, nota_recuperatorio, asistencia) 
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (id_inscripcion_cursada) 
                        DO UPDATE 
                            SET nota_cuat_1 = EXCLUDED.nota_cuat_1,
                                nota_cuat_2 = EXCLUDED.nota_cuat_2,
                                nota_recuperatorio = EXCLUDED.nota_recuperatorio,
                                asistencia = EXCLUDED.asistencia;`;
                    await this.db.none(query, [avance.id_inscripcion_cursada, avance.nota_cuat_1, avance.nota_cuat_2, avance.nota_recuperatorio, avance.asistencia])
                    res.status(200).json({
                        mensaje: 'Se cargaron correctamente las notas de la cursada'
                    });
                } else {
                    res.status(400).json({
                        mensaje: asistencia_valida
                    });    
                }
            } else {
                res.status(400).json({
                    mensaje: notas_validas
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar la cursada',
                error
            });
        }
    }
    public async eliminar_notas_cursada(req: Request, res: Response) {
        try {
            const id_inscripcion_cursada = +req.params.id_inscripcion_cursada;
            const query = 'DELETE FROM avance_academico WHERE id_inscripcion_cursada = $1;'
            await this.db.none(query, [id_inscripcion_cursada]);
            res.status(200).json({
                mensaje: 'Se eliminaron las notas de la cursada',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar las notas de la cursada',
                error
            });
        }
    }

    private async get_id_materia(id_cursada: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT ma.id
                    FROM cursadas cu
                    INNER JOIN materias ma ON ma.id = cu.id_materia
                    WHERE cu.id = $1;`
                const mesa = await this.db.one(query, id_cursada);
                resolve(mesa.id);
            } catch (error) {
                reject(error);
            }
        });
    }

    private async realizar_inscripcion_cursada(id_alumno: number, id_cursada: number, cursa: boolean, equivalencia: boolean) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `INSERT INTO inscripciones_cursadas (id_alumno, id_cursada, cursa, equivalencia, fecha_inscripcion) 
                                VALUES ($1, $2, $3, $4, current_timestamp);`
                await this.db.none(query, [id_alumno, id_cursada, cursa, equivalencia]);
                resolve();
            } catch (error) {
                reject(error);
            }
        })
    }

    public async crear_inscripcion_cursada(req: Request, res: Response) {
        try {
            const id_cursada = +req.body.id_cursada;
            const cursa = req.body.cursa;
            const equivalencia = req.body.equivalencia;
            const token: Token = res.locals.token;
            const id_alumno = token.id_alumno;
            if (id_alumno) {
                if (id_cursada) {
                    const cursada_abierta = await this.helper.cursada_abierta(id_cursada);
                    if (cursada_abierta === true) {
                        const id_materia = await this.get_id_materia(id_cursada);
                        const correlativas_aprobadas = await this.helper.cursadas_correlativas_aprobadas(id_materia, id_alumno);
                        this.log = 'cursadas correlativas aprobadas';
                        if (correlativas_aprobadas) {
                            if (!cursa) {
                                const permite_libre = await this.helper.permite_inscripcion_libre(id_materia);
                                this.log = 'permite inscripcion libre';
                                if (permite_libre) {
                                    await this.realizar_inscripcion_cursada(id_alumno, id_cursada, cursa, equivalencia);
                                    res.status(200).json({
                                        mensaje: 'Inscripción a cursada creada!',
                                    });
                                } else {
                                    res.status(400).json({
                                        mensaje: 'La materia no permite inscripción libre',
                                    });
                                }
                            } else {
                                await this.realizar_inscripcion_cursada(id_alumno, id_cursada, cursa, equivalencia);
                                res.status(200).json({
                                    mensaje: 'Inscripción a cursada creada!',
                                });
                            }
                        } else {
                            res.status(400).json({
                                mensaje: 'No posee las correlativas aprobadas',
                            });
                        }
                    } else {
                        res.status(400).json({
                            mensaje: cursada_abierta,
                        });
                    }
                } else {
                    res.status(400).json({
                        mensaje: 'ID de cursada inválido',
                    });
                }
            } else {
                res.status(400).json({
                    mensaje: 'El usuario no es un alumno',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al crear la inscripcion a la cursada',
                error,
                log: this.log
            });
        }
    }

    public async eliminar_inscripcion_cursada(req: Request, res: Response) {
        try {
            const token: Token = res.locals.token;
            const id_alumno = token.id_alumno;
            const id_inscripcion_cursada = +req.params.id_inscripcion_cursada;
            if (id_alumno) {
                if (id_inscripcion_cursada) {
                    const id_cursada = await this.helper.get_id_cursada(id_inscripcion_cursada);
                    const cursada_abierta = await this.helper.cursada_abierta(id_cursada);
                    if (cursada_abierta) {
                        const query = 'DELETE FROM inscripciones_cursadas WHERE id = $1 AND id_alumno = $2;'
                        await this.db.none(query, [id_inscripcion_cursada, id_alumno]);
                        res.status(200).json({
                            mensaje: 'Se eliminó la inscripción a la cursada',
                        });
                    } else {
                        res.status(400).json({
                            mensaje: 'Solo se puede eliminar la inscripción durante el periodo de inscripción',
                            error: cursada_abierta
                        });    
                    }
                } else {
                    res.status(400).json({
                        mensaje: 'ID de cursada inválido',
                    });
                }
            } else {
                res.status(400).json({
                    mensaje: 'El usuario no es un alumno',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar la inscripción a la cursada',
                error
            });
        }
    }

    public async listar_inscriptos_cursada(req: Request, res: Response) {
        try {
            const id_cursada = +req.params.id_cursada;
            if (id_cursada) {
                const query = `
                    SELECT us.apellido, us.nombre, us.dni, ic.fecha_inscripcion, ma.nombre AS materia, cu.anio AS anio_cursada,
                        aa.nota_cuat_1, aa.nota_cuat_2, aa.nota_recuperatorio, aa.asistencia, ic.id AS id_inscripcion_cursada,
                        ic.cursa, ic.equivalencia, c.nombre AS carrera
                    FROM cursadas cu
                    INNER JOIN materias ma ON ma.id = cu.id_materia
                    INNER JOIN carreras c ON c.id = ma.id_carrera
                    INNER JOIN inscripciones_cursadas ic ON ic.id_cursada = cu.id
                    INNER JOIN alumnos al ON al.id = ic.id_alumno
                    INNER JOIN usuarios us ON us.id = al.id_usuario
                    LEFT JOIN avance_academico aa ON aa.id_inscripcion_cursada = ic.id
                    WHERE cu.id = $1
                    ORDER BY us.apellido, us.nombre;`;
                const inscriptos = await this.db.manyOrNone(query, [id_cursada]);
                res.status(200).json(inscriptos);
            } else {
                res.status(400).json({
                    mensaje: 'ID de cursada inválido'
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los inscriptos a la cursada',
                error
            });
        }
    }

}