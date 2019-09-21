import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Cursada } from '../modelos/modelo-cursada';
import { Avance } from '../modelos/modelo-avance-academico';
import { Token } from '../modelos/modelo-token';
import { Horario } from '../modelos/modelo-horario';
import { HelperService } from '../servicios/helper';

export class CursadasController {
    private db: IDatabase<any>;
    private helper: HelperService;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.helper = new HelperService(db);
        // Cursadas
        this.crear_cursada = this.crear_cursada.bind(this);
        this.listar_cursadas = this.listar_cursadas.bind(this);
        this.eliminar_cursada = this.eliminar_cursada.bind(this);
        // Inscripciones Cursada
        this.crear_inscripcion_cursada = this.crear_inscripcion_cursada.bind(this);
        this.inscribir_alumno_cursada = this.inscribir_alumno_cursada.bind(this);
        this.eliminar_inscripcion_cursada = this.eliminar_inscripcion_cursada.bind(this);
        this.eliminar_inscripcion_cursada_alumno = this.eliminar_inscripcion_cursada_alumno.bind(this);
        this.listar_inscriptos_cursada = this.listar_inscriptos_cursada.bind(this);
        this.listar_inscriptos_cursada2 = this.listar_inscriptos_cursada2.bind(this);
        this.planilla_inscriptos_cursada = this.planilla_inscriptos_cursada.bind(this);
        // Notas
        this.cargar_notas_cursada = this.cargar_notas_cursada.bind(this);
        this.eliminar_notas_cursada = this.eliminar_notas_cursada.bind(this);

    }
    public async crear_cursada(req: Request, res: Response) {
        try {
            const cursada: Cursada = req.body.cursada;
            const horarios: Horario[] = req.body.horarios;
            const año = new Date().getFullYear();
            if (cursada.año < (año-6)) {
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
                                VALUES ($1, $2, $3, $4, $5) RETURNING ID;`;
                            const resp = await this.db.one(query, [cursada.id_materia, cursada.id_profesor, cursada.año, cursada.fecha_inicio, cursada.fecha_limite]);
                            const id_cursada = resp.id;
                            if (horarios && horarios.length) {
                                for (const horario of horarios) {
                                    query = `INSERT INTO horarios (id_cursada, dia, hora_inicio, modulos) VALUES ($1, $2, $3, $4);`;
                                    await this.db.none(query, [id_cursada, horario.dia, horario.hora_inicio, horario.modulos]);
                                }
                            }
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
    public async listar_cursadas(req: Request, res: Response) {
        try {
            const token: Token = res.locals.token;
            const id_alumno = +token.id_alumno;
            let query;
            let cursadas = [];
            if (id_alumno) {
                // Muestra las cursadas de la/s carreras del alumno
                query = `
                    SELECT cu.id, cu.anio AS anio_cursada, cu.fecha_inicio, cu.fecha_limite, M.id AS id_materia,
                        M.nombre AS materia, M.anio AS anio_materia, c.nombre AS carrera, c.id AS id_carrera,
                        CONCAT_WS(', ', U.apellido, U.nombre) AS profesor, ic2.id AS id_inscripcion_cursada,
                        aa.nota_cuat_1, aa.nota_cuat_2, aa.nota_recuperatorio, aa.asistencia, tm.nombre AS tipo_materia,
                        json_agg(json_build_object( 
                            'dia', h.dia, 
                            'hora_inicio', h.hora_inicio, 
                            'modulos', h.modulos
                        ) ORDER BY h.dia) AS horarios
                    FROM cursadas cu
                    INNER JOIN materias M ON M.id = cu.id_materia
                    INNER JOIN tipos_materias tm ON tm.id = M.id_tipo
                    INNER JOIN carreras c ON c.id = M.id_carrera
                    INNER JOIN carreras_abiertas ca ON ca.id_carrera = c.id
                    INNER JOIN inscripciones_carreras ica ON ica.id_carrera_abierta = ca.id
                    LEFT JOIN profesores P ON P.id = cu.id_profesor
                    LEFT JOIN usuarios U ON U.id = P.id_usuario
                    LEFT JOIN inscripciones_cursadas ic ON ic.id_cursada = cu.id
                    LEFT JOIN inscripciones_cursadas ic2 ON ic2.id_cursada = cu.id AND ic2.id_alumno = $1
                    LEFT JOIN avance_academico aa ON aa.id_inscripcion_cursada = ic2.id
                    LEFT JOIN horarios h ON h.id_cursada = cu.id
                    WHERE ica.id_alumno = $1
                    AND current_timestamp BETWEEN cu.fecha_inicio AND cu.fecha_limite
                    AND cu.anio >= ca.cohorte
                    GROUP BY cu.id, cu.anio, cu.fecha_inicio, cu.fecha_limite, M.id,
                        M.nombre, M.anio, c.nombre, c.id,
                        CONCAT_WS(', ', U.apellido, U.nombre), ic2.id,
                        aa.nota_cuat_1, aa.nota_cuat_2, aa.nota_recuperatorio, aa.asistencia, tm.nombre
                    ORDER BY cu.anio DESC, c.nombre, M.anio, M.nombre`;
                const cursadasTodas = await this.db.manyOrNone(query, [id_alumno]);
                for (const cursada of cursadasTodas) {
                    if (cursada.horarios[0].dia === null) {
                        cursada.horarios = [];
                    }
                    const cursadaAprobada = await this.helper.cursada_aprobada(cursada.id_materia, id_alumno);
                    if (!cursadaAprobada) {
                        cursadas.push(cursada);
                    }
                }
            } else {
                // Muestra todas las cursadas
                query = `
                    SELECT C.id, C.anio AS anio_cursada, C.fecha_inicio, C.fecha_limite, 
                        M.nombre AS materia, M.anio AS anio_materia, ca.nombre AS carrera, ca.id AS id_carrera,
                        CONCAT_WS(', ', U.apellido, U.nombre) AS profesor,
                        COUNT(ic.id) AS cant_inscriptos,
                        json_agg(json_build_object( 
                            'dia', h.dia, 
                            'hora_inicio', h.hora_inicio, 
                            'modulos', h.modulos
                        ) ORDER BY h.dia) AS horarios
                    FROM cursadas C
                    INNER JOIN materias M ON M.id = C.id_materia
                    INNER JOIN carreras ca ON ca.id = M.id_carrera
                    LEFT JOIN profesores P ON P.id = C.id_profesor
                    LEFT JOIN usuarios U ON U.id = P.id_usuario
                    LEFT JOIN inscripciones_cursadas ic ON ic.id_cursada = C.id
                    LEFT JOIN horarios h ON h.id_cursada = C.id
                    GROUP BY C.id, C.anio, C.fecha_inicio, C.fecha_limite, 
                        M.nombre, M.anio, ca.nombre, ca.id,
                        CONCAT_WS(', ', U.apellido, U.nombre)
                    ORDER BY C.anio DESC, ca.nombre, M.anio, M.nombre`;
                cursadas = await this.db.manyOrNone(query);
                for (const cursada of cursadas) {
                    if (cursada.horarios[0].dia === null) {
                        cursada.horarios = [];
                    }
                }
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
                        if (correlativas_aprobadas === true) {
                            if (!cursa) {
                                const permite_libre = await this.helper.permite_inscripcion_libre(id_materia);
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
                                mensaje: 'No posee las siguientes correlativas aprobadas: ' + correlativas_aprobadas,
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
            });
        }
    }

    public async inscribir_alumno_cursada(req: Request, res: Response) {
        try {
            const id_cursada = +req.body.id_cursada;
            const cursa = req.body.cursa;
            const equivalencia = req.body.equivalencia;
            const id_alumno = +req.body.id_alumno;
            if (id_alumno) {
                if (id_cursada) {
                    const id_materia = await this.get_id_materia(id_cursada);
                    const correlativas_aprobadas = await this.helper.cursadas_correlativas_aprobadas(id_materia, id_alumno);
                    if (correlativas_aprobadas === true) {
                        await this.realizar_inscripcion_cursada(id_alumno, id_cursada, cursa, equivalencia);
                        res.status(200).json({
                            mensaje: 'Inscripción a cursada creada!',
                        });
                    } else {
                        res.status(400).json({
                            mensaje: 'No posee las siguientes correlativas aprobadas: ' + correlativas_aprobadas,
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
    public async eliminar_inscripcion_cursada_alumno(req: Request, res: Response) {
        try {
            const id_inscripcion_cursada = +req.params.id_inscripcion_cursada;
            if (id_inscripcion_cursada) {
                const query = 'DELETE FROM inscripciones_cursadas WHERE id = $1;'
                await this.db.none(query, [id_inscripcion_cursada]);
                res.status(200).json({
                    mensaje: 'Se eliminó la inscripción a la cursada',
                });
            } else {
                res.status(400).json({
                    mensaje: 'ID de cursada inválido',
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

    // Borrar
    public async listar_inscriptos_cursada(req: Request, res: Response) {
        try {
            const id_cursada = +req.params.id_cursada;
            if (id_cursada) {
                const query = `
                    SELECT us.apellido, us.nombre, us.dni, ic.fecha_inscripcion, ma.nombre AS materia, cu.anio AS anio_cursada,
                        aa.nota_cuat_1, aa.nota_cuat_2, aa.nota_recuperatorio, aa.asistencia, ic.id AS id_inscripcion_cursada,
                        ic.cursa, ic.equivalencia, c.nombre AS carrera, c.id AS id_carrera
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

    public async listar_inscriptos_cursada2(req: Request, res: Response) {
        try {
            const id_cursada = +req.params.id_cursada;
            if (id_cursada) {
                const query = `
                    SELECT cu.anio AS anio_cursada, ma.nombre AS materia,  c.nombre AS carrera, c.id AS id_carrera,
                        json_agg(json_build_object( 
                            'apellido', us.apellido, 
                            'nombre', us.nombre, 
                            'dni', us.dni, 
                            'fecha_inscripcion', ic.fecha_inscripcion,
                            'id_inscripcion_cursada', ic.id,
                            'cursa', ic.cursa,
                            'equivalencia', ic.equivalencia,
                            'nota_cuat_1',  aa.nota_cuat_1,
                            'nota_cuat_2',  aa.nota_cuat_2,
                            'nota_recuperatorio',  aa.nota_recuperatorio,
                            'asistencia', aa.asistencia
                        ) ORDER BY us.apellido, us.nombre) AS inscriptos
                    FROM cursadas cu
                    INNER JOIN materias ma ON ma.id = cu.id_materia
                    INNER JOIN carreras c ON c.id = ma.id_carrera
                    LEFT JOIN inscripciones_cursadas ic ON ic.id_cursada = cu.id
                    LEFT JOIN alumnos al ON al.id = ic.id_alumno
                    LEFT JOIN usuarios us ON us.id = al.id_usuario
                    LEFT JOIN avance_academico aa ON aa.id_inscripcion_cursada = ic.id
                    WHERE cu.id = $1
                    GROUP BY cu.anio, ma.nombre,  c.nombre, c.id;`;
                const inscriptos = await this.db.one(query, [id_cursada]);
                if (inscriptos.inscriptos[0].apellido === null) {
                    inscriptos.inscriptos = [];
                }
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

    public async planilla_inscriptos_cursada(req: Request, res: Response) {
        try {
            const id_cursada = +req.params.id_cursada;
            if (id_cursada) {
                const query = `
                    SELECT ma.nombre AS materia, ma.anio AS anio_materia, cu.anio AS anio_cursada, c.nombre AS carrera, CONCAT_WS(', ', usp.apellido, usp.nombre) AS profesor,
                        json_agg(json_build_object( 
                            'apellido', us.apellido, 
                            'nombre', us.nombre, 
                            'fecha_inscripcion', ic.fecha_inscripcion, 
                            'cursa', ic.cursa,
                            'cohorte', caa.cohorte
                        ) ORDER BY us.apellido, us.nombre) AS inscriptos
                    FROM cursadas cu
                    INNER JOIN materias ma ON ma.id = cu.id_materia
                    INNER JOIN carreras c ON c.id = ma.id_carrera
                    INNER JOIN inscripciones_cursadas ic ON ic.id_cursada = cu.id
                    INNER JOIN alumnos al ON al.id = ic.id_alumno
                    INNER JOIN usuarios us ON us.id = al.id_usuario
                    INNER JOIN inscripciones_carreras ica ON ica.id_alumno = al.id
                    INNER JOIN carreras_abiertas caa ON caa.id = ica.id_carrera_abierta
                    LEFT JOIN profesores p ON p.id = cu.id_profesor
                    LEFT JOIN usuarios usp ON usp.id = p.id_usuario
                    WHERE cu.id = $1
                    GROUP BY ma.nombre, ma.anio, cu.anio, c.nombre, CONCAT_WS(', ', usp.apellido, usp.nombre)`;
                const inscriptos = await this.db.one(query, [id_cursada]);
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