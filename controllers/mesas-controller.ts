import { IDatabase } from 'pg-promise';
import { Request, Response } from 'express';
import { Mesa } from "../modelos/modelo-mesa"
import { Token } from '../modelos/modelo-token';
import { Final } from '../modelos/modelo-final';
import { HelperService } from '../servicios/helper';

export class MesasController {
    private db: IDatabase<any>;
    private helper: HelperService;

    constructor(db: IDatabase<any>) {
        this.db = db;
        this.helper = new HelperService(db);
        // Inscripciones a mesas
        this.crear_inscripcion_mesa = this.crear_inscripcion_mesa.bind(this);
        this.inscribir_alumno_mesa = this.inscribir_alumno_mesa.bind(this);
        this.eliminar_inscripcion_mesa = this.eliminar_inscripcion_mesa.bind(this);
        this.eliminar_inscripcion_mesa_alumno = this.eliminar_inscripcion_mesa_alumno.bind(this);
        this.listar_inscriptos_mesa = this.listar_inscriptos_mesa.bind(this);
        // Mesas
        this.lista_mesas = this.lista_mesas.bind(this);
        this.crear_mesa = this.crear_mesa.bind(this);
        this.editar_mesa = this.editar_mesa.bind(this);
        this.eliminar_mesa = this.eliminar_mesa.bind(this);
        // Notas
        this.cargar_notas_final = this.cargar_notas_final.bind(this);
        this.eliminar_notas_final = this.eliminar_notas_final.bind(this);
        //
        this.acta_volante = this.acta_volante.bind(this);
    }

    private async get_id_materia(id_mesa: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT ma.id
                    FROM mesas me
                    INNER JOIN materias ma ON ma.id = me.id_materia
                    WHERE me.id = $1;`
                const mesa = await this.db.one(query, id_mesa);
                resolve(mesa.id);
            } catch (error) {
                reject(error);
            }
        });
    }
    private async inscribir_alumno_mesa_service(id_mesa: number, id_alumno: number, libre: boolean) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `INSERT INTO inscripciones_mesa (id_mesa, id_alumno, libre, fecha_inscripcion) 
                VALUES ($1, $2, $3, current_timestamp);`
                await this.db.none(query, [id_mesa, id_alumno, libre]);
                resolve();
            } catch (error) {
                reject(error);
            }
        })

    }
    // Inscripciones a mesas
    public async crear_inscripcion_mesa(req: Request, res: Response) {
        try {
            const id_mesa = +req.body.id_mesa;
            const token: Token = res.locals.token;
            const id_alumno = token.id_alumno;
            if (id_alumno) {
                if (id_mesa) {
                    const mesa_abierta = await this.helper.mesa_abierta(id_mesa);
                    if (mesa_abierta === true) {
                        const id_materia = await this.get_id_materia(id_mesa);
                        const fecha_examen = await this.helper.get_fecha_examen(id_mesa);
                        const cursada_libre = await this.helper.final_libre(id_materia, id_alumno, fecha_examen);
                        const cursada_aprobada = await this.helper.cursada_aprobada(id_materia, id_alumno);
                        if (cursada_libre || cursada_aprobada) {
                            const correlativas_aprobadas = await this.helper.finales_correlativos_aprobados(id_materia, id_alumno);
                            if (correlativas_aprobadas === true) {
                                const final_aprobado = await this.helper.final_aprobado(id_materia, id_alumno);
                                if (!final_aprobado) {
                                    if (cursada_libre) {
                                        await this.inscribir_alumno_mesa_service(id_mesa, id_alumno, true);
                                    } else {
                                        await this.inscribir_alumno_mesa_service(id_mesa, id_alumno, false);
                                    }
                                    res.status(200).json({
                                        mensaje: 'Inscripción a final creada!',
                                    });
                                } else {
                                    res.status(400).json({
                                        mensaje: 'Ya posee la materia aprobada',
                                    });
                                }
                            } else {
                                res.status(400).json({
                                    mensaje: 'No posee las siguientes correlativas aprobadas: ' + correlativas_aprobadas,
                                });
                            }
                        } else {
                            res.status(400).json({
                                mensaje: 'No posee la cursada aprobada',
                            });
                        }
                    } else {
                        res.status(400).json({
                            mensaje: mesa_abierta,
                        });
                    }
                } else {
                    res.status(400).json({
                        mensaje: 'ID de mesa inválido',
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
                mensaje: 'Ocurrio un error al crear la inscripción',
                error
            });
        }
    }
    public async inscribir_alumno_mesa(req: Request, res: Response) {
        try {
            const id_mesa = +req.body.id_mesa;
            const id_alumno = +req.body.id_alumno;
            if (id_alumno) {
                if (id_mesa) {
                    const id_materia = await this.get_id_materia(id_mesa);
                    const fecha_examen = await this.helper.get_fecha_examen(id_mesa);
                    const cursada_libre = await this.helper.final_libre(id_materia, id_alumno, fecha_examen);
                    const cursada_aprobada = await this.helper.cursada_aprobada(id_materia, id_alumno);
                    if (cursada_libre || cursada_aprobada) {
                        const correlativas_aprobadas = await this.helper.finales_correlativos_aprobados(id_materia, id_alumno);
                        if (correlativas_aprobadas === true) {
                            const final_aprobado = await this.helper.final_aprobado(id_materia, id_alumno);
                            if (!final_aprobado) {
                                if (cursada_libre) {
                                    await this.inscribir_alumno_mesa_service(id_mesa, id_alumno, true);
                                } else {
                                    await this.inscribir_alumno_mesa_service(id_mesa, id_alumno, false);
                                }
                                res.status(200).json({
                                    mensaje: 'Inscripción a final creada!',
                                });
                            } else {
                                res.status(400).json({
                                    mensaje: 'Ya posee la materia aprobada',
                                });
                            }
                        } else {
                            res.status(400).json({
                                mensaje: 'No posee las siguientes correlativas aprobadas: ' + correlativas_aprobadas,
                            });
                        }
                    } else {
                        res.status(400).json({
                            mensaje: 'No posee la cursada aprobada',
                        });
                    }
                } else {
                    res.status(400).json({
                        mensaje: 'ID de mesa inválido',
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
                mensaje: 'Ocurrio un error al crear la inscripción',
                error
            });
        }
    }
    public async eliminar_inscripcion_mesa(req: Request, res: Response) {
        try {
            const token: Token = res.locals.token;
            const id_alumno = token.id_alumno;
            const id_inscripcion_mesa = +req.params.id_inscripcion_mesa;
            if (id_alumno) {
                if (id_inscripcion_mesa) {
                    const id_mesa = await this.helper.get_id_mesa(id_inscripcion_mesa);
                    const mesa_abierta = await this.helper.mesa_abierta(id_mesa);
                    if (mesa_abierta) {
                        const query = 'DELETE FROM inscripciones_mesa WHERE id = $1 AND id_alumno = $2;'
                        await this.db.none(query, [id_inscripcion_mesa, id_alumno]);
                        res.status(200).json({
                            mensaje: 'Se eliminó la inscripción a la mesa',
                        });
                    } else {
                        res.status(400).json({
                            mensaje: 'Solo se puede eliminar la inscripción durante el periodo de inscripción',
                            error: mesa_abierta
                        });
                    }
                } else {
                    res.status(400).json({
                        mensaje: 'ID de inscripción a mesa inválido',
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
                mensaje: 'Ocurrio un error al eliminar las inscripción a la mesa',
                error
            });
        }
    }
    public async eliminar_inscripcion_mesa_alumno(req: Request, res: Response) {
        try {
            const id_inscripcion_mesa = +req.params.id_inscripcion_mesa;
            if (id_inscripcion_mesa) {
                const query = 'DELETE FROM inscripciones_mesa WHERE id = $1;'
                await this.db.none(query, [id_inscripcion_mesa]);
                res.status(200).json({
                    mensaje: 'Se eliminó la inscripción a la mesa',
                });
            } else {
                res.status(400).json({
                    mensaje: 'ID de inscripción a mesa inválido',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar las inscripción a la mesa',
                error
            });
        }
    }
    public async listar_inscriptos_mesa(req: Request, res: Response) {
        try {
            const id_mesa = +req.params.id_mesa;
            if (id_mesa) {
                const query = `
                SELECT me.id AS id_mesa, me.fecha_examen, ma.nombre AS materia, c.nombre AS carrera, c.id AS id_carrera,
                    json_agg(json_build_object( 
                        'apellido', us.apellido, 
                        'nombre', us.nombre, 
                        'dni', us.dni, 
                        'fecha_inscripcion', im.fecha_inscripcion,
                        'id_inscripcion_mesa', im.id,
                        'nota',  fi.nota,
                        'libro', fi.libro,
                        'folio', fi.folio
                    ) ORDER BY us.apellido, us.nombre) AS inscriptos
                FROM mesas me
                INNER JOIN materias ma ON ma.id = me.id_materia
                INNER JOIN carreras c ON c.id = ma.id_carrera
                LEFT JOIN inscripciones_mesa im ON im.id_mesa = me.id
                LEFT JOIN alumnos al ON al.id = im.id_alumno
                LEFT JOIN usuarios us ON us.id = al.id_usuario
                LEFT JOIN finales fi ON fi.id_inscripcion_mesa = im.id
                WHERE me.id = $1
                GROUP BY me.id, me.fecha_examen, ma.nombre, c.nombre, c.id
                `;
                const inscriptos = await this.db.one(query, [id_mesa]);
                if (inscriptos.inscriptos[0].apellido === null) {
                    inscriptos.inscriptos = [];
                }
                res.status(200).json(inscriptos);
            } else {
                res.status(400).json({
                    mensaje: 'ID de mesa invalido'
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los inscriptos a la mesa',
                error
            });
        }
    }
    // Mesas
    public async lista_mesas(req: Request, res: Response) {
        try {
            const anio = req.params.anio || new Date().getFullYear();
            const token: Token = res.locals.token;
            const id_alumno = +token.id_alumno;
            let query;
            let mesas = [];
            if (id_alumno) {
                query = `
                    SELECT me.id, ma.nombre AS materia, ma.anio AS anio_materia, me.fecha_inicio, me.fecha_limite, 
                        me.fecha_examen, ca.nombre AS carrera, ca.id AS id_carrera, im.id AS id_inscripcion_mesa, ca.nombre_corto, ca.resolucion,
                        CONCAT_WS(', ', us.apellido, us.nombre) AS profesor,
                        CONCAT_WS(', ', us1.apellido, us1.nombre) AS vocal1,
                        CONCAT_WS(', ', us2.apellido, us2.nombre) AS vocal2,
                        fi.nota, fi.libro, fi.folio, ma.id AS id_materia
                    FROM mesas me 
                    INNER JOIN materias ma ON ma.id = me.id_materia
                    INNER JOIN carreras ca ON ca.id = ma.id_carrera
                    INNER JOIN carreras_abiertas caa ON caa.id_carrera = ca.id
                    INNER JOIN inscripciones_carreras ica ON ica.id_carrera_abierta = caa.id
                    LEFT JOIN profesores pf ON pf.id = me.id_profesor
                    LEFT JOIN usuarios us ON us.id = pf.id_usuario
                    LEFT JOIN profesores v1 ON v1.id = me.id_vocal1
                    LEFT JOIN usuarios us1 ON us1.id = v1.id_usuario
                    LEFT JOIN profesores v2 ON v2.id = me.id_vocal2
                    LEFT JOIN usuarios us2 ON us2.id = v2.id_usuario
                    LEFT JOIN inscripciones_mesa im ON im.id_mesa = me.id AND im.id_alumno = $1
                    LEFT JOIN finales fi ON fi.id_inscripcion_mesa = im.id
                    WHERE ica.id_alumno = $1
                    AND current_timestamp BETWEEN me.fecha_inicio AND me.fecha_limite
                    AND date_part('year', me.fecha_examen) >= caa.cohorte
                    ORDER BY me.fecha_examen DESC, ca.nombre, ma.anio, ma.nombre;`;
                const mesasTodas = await this.db.manyOrNone(query, [id_alumno, anio]);
                for (const mesa of mesasTodas) {
                    const finalAprobado = await this.helper.final_aprobado(mesa.id_materia, id_alumno);
                    if (!finalAprobado) {
                        mesas.push(mesa);
                    }
                }
            } else {
                query = `
                    SELECT me.id, ma.nombre AS materia, ma.anio AS anio_materia, me.fecha_inicio, me.fecha_limite, 
                        me.fecha_examen, ca.nombre AS carrera, ca.id AS id_carrera, ca.nombre_corto, ca.resolucion,
                        CONCAT_WS(', ', us.apellido, us.nombre) AS profesor, pf.id AS id_profesor,
                        CONCAT_WS(', ', us1.apellido, us1.nombre) AS vocal1, v1.id AS id_vocal1,
                        CONCAT_WS(', ', us2.apellido, us2.nombre) AS vocal2, v2.id AS id_vocal2,
                        COALESCE(il.inscripciones_libres, 0) AS inscripciones_libres, COALESCE(ir.inscripciones_regulares, 0) AS inscripciones_regulares,
                        (COALESCE(il.inscripciones_libres, 0) + COALESCE(ir.inscripciones_regulares, 0)) AS cant_inscriptos
                    FROM mesas me 
                    LEFT JOIN inscripciones_mesa ic ON ic.id_mesa = me.id
                    INNER JOIN materias ma ON ma.id = me.id_materia
                    INNER JOIN carreras ca ON ca.id = ma.id_carrera
                    LEFT JOIN profesores pf ON pf.id = me.id_profesor
                    LEFT JOIN usuarios us ON us.id = pf.id_usuario
                    LEFT JOIN profesores v1 ON v1.id = me.id_vocal1
                    LEFT JOIN usuarios us1 ON us1.id = v1.id_usuario
                    LEFT JOIN profesores v2 ON v2.id = me.id_vocal2
                    LEFT JOIN usuarios us2 ON us2.id = v2.id_usuario

                    LEFT JOIN (
                        SELECT m.id AS id_mesa, COUNT(im.id) AS inscripciones_libres
                        FROM mesas m
                        LEFT JOIN inscripciones_mesa im ON im.id_mesa = m.id
                        WHERE im.libre = true
                        GROUP BY m.id
                    ) AS il ON il.id_mesa = me.id

                    LEFT JOIN (
                        SELECT m.id AS id_mesa, COUNT(im.id) AS inscripciones_regulares
                        FROM mesas m
                        LEFT JOIN inscripciones_mesa im ON im.id_mesa = m.id
                        WHERE im.libre = false
                        GROUP BY m.id
                    ) AS ir ON ir.id_mesa = me.id
                    WHERE date_part('year', me.fecha_examen) = $1
                    GROUP BY me.id, ma.nombre, ma.anio, me.fecha_inicio, me.fecha_limite, 
                        me.fecha_examen, ca.nombre, ca.id, ca.nombre_corto, ca.resolucion,
                        CONCAT_WS(', ', us.apellido, us.nombre), pf.id,
                        CONCAT_WS(', ', us1.apellido, us1.nombre), v1.id,
                        CONCAT_WS(', ', us2.apellido, us2.nombre), v2.id,
                        il.inscripciones_libres, ir.inscripciones_regulares
                    ORDER BY me.fecha_examen DESC, ca.nombre, ma.anio, ma.nombre`;
                mesas = await this.db.manyOrNone(query, [anio]);
            }
            res.status(200).json(mesas);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar las mesas',
                error
            });
        }
    }
    public crear_mesa(req: Request, res: Response) {
        const mesa: Mesa = req.body.mesa;
        const query = `
            INSERT INTO mesas 
            (id_materia, fecha_inicio, fecha_limite, fecha_examen, id_profesor, id_vocal1, id_vocal2) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
        this.db.one(query, [mesa.id_materia, mesa.fecha_inicio, mesa.fecha_limite, mesa.fecha_examen, mesa.id_profesor, mesa.id_vocal1, mesa.id_vocal2])
            .then((data) => {
                res.status(200).json({
                    mensaje: "Se creó la mesa correctamente"
                });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json(err);
            });
    }
    public async editar_mesa(req: Request, res: Response) {
        try {
            const id_mesa = req.params.id_mesa;
            const mesa: Mesa = req.body.mesa;
            const query = `
                UPDATE mesas SET 
                    fecha_inicio = $1,
                    fecha_limite = $2,
                    fecha_examen = $3,
                    id_profesor = $4,
                    id_vocal1 = $5,
                    id_vocal2 = $6
                WHERE id = $7`;
            await this.db.none(query, [mesa.fecha_inicio, mesa.fecha_limite, mesa.fecha_examen, mesa.id_profesor, mesa.id_vocal1, mesa.id_vocal2, id_mesa])
            res.status(200).json({
                mensaje: "La mesa se editó correctamente"
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al editar la mesa',
                error
            });
        }
    }
    public async eliminar_mesa(req: Request, res: Response) {
        try {
            const id_mesa = +req.params.id_mesa;
            const query = 'DELETE FROM mesas WHERE id = $1;'
            await this.db.none(query, [id_mesa]);
            res.status(200).json({
                mensaje: 'Se eliminó la mesa',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar la mesa',
                error
            });
        }
    }
    // Notas
    private nota_valida(nota: number) {
        if (nota) {
            if (nota % 1 !== 0) {
                return 'La nota debe ser un número entero entre 0 y 10';
            } else if (nota < 0 || nota > 10) {
                return 'La nota debe ser un número entero entre 0 y 10';
            }
        }
        return true;
    }
    public async cargar_notas_final(req: Request, res: Response) {
        try {
            const final: Final = req.body.final;
            const nota_valida = this.nota_valida(final.nota);
            if (nota_valida === true) {
                const query = `
                    INSERT INTO finales (id_inscripcion_mesa, nota, libro, folio) 
                    VALUES ($1, $2, $3, $4) 
                    ON CONFLICT (id_inscripcion_mesa) 
                    DO UPDATE 
                        SET nota = EXCLUDED.nota,
                            libro = EXCLUDED.libro,
                            folio = EXCLUDED.folio;`;
                await this.db.none(query, [final.id_inscripcion_mesa, final.nota, final.libro, final.folio]);
                res.status(200).json({
                    mensaje: 'Se cargo la nota correctamente'
                });
            } else {
                res.status(400).json({
                    mensaje: nota_valida
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al cargar las notas del final',
                error
            });
        }
    }
    public async eliminar_notas_final(req: Request, res: Response) {
        try {
            const id_inscripcion_mesa = +req.params.id_inscripcion_mesa;
            const query = 'DELETE FROM finales WHERE id_inscripcion_mesa = $1;'
            await this.db.none(query, [id_inscripcion_mesa]);
            res.status(200).json({
                mensaje: 'Se eliminó la nota del final',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al eliminar la nota del final',
                error
            });
        }
    }
    //
    public async acta_volante(req: Request, res: Response) {
        try {
            const id_mesa = +req.params.id_mesa;
            let libre: boolean = false;
            if (req.params.libres) {
                libre = true;
            }
            if (id_mesa) {
                const query = `
                    SELECT me.fecha_examen, ma.nombre AS materia, ma.anio AS anio_materia, c.nombre AS carrera, 
                        CONCAT_WS(', ', us0.apellido, us0.nombre) AS profesor,
                        CONCAT_WS(', ', us1.apellido, us1.nombre) AS vocal1,
                        CONCAT_WS(', ', us2.apellido, us2.nombre) AS vocal2,
                        json_agg(json_build_object( 
                            'apellido', us.apellido, 
                            'nombre', us.nombre, 
                            'dni', us.dni, 
                            'cohorte', caa.cohorte
                        ) ORDER BY us.apellido, us.nombre) AS inscriptos
                    FROM mesas me
                    LEFT JOIN profesores pf ON pf.id = me.id_profesor
                    LEFT JOIN usuarios us0 ON us0.id = pf.id_usuario
                    LEFT JOIN profesores v1 ON v1.id = me.id_vocal1
                    LEFT JOIN usuarios us1 ON us1.id = v1.id_usuario
                    LEFT JOIN profesores v2 ON v2.id = me.id_vocal2
                    LEFT JOIN usuarios us2 ON us2.id = v2.id_usuario
                    INNER JOIN materias ma ON ma.id = me.id_materia
                    INNER JOIN carreras c ON c.id = ma.id_carrera
                    LEFT JOIN inscripciones_mesa im ON im.id_mesa = me.id
                    LEFT JOIN alumnos al ON al.id = im.id_alumno
                    LEFT JOIN usuarios us ON us.id = al.id_usuario
                    LEFT JOIN inscripciones_carreras ic ON ic.id_alumno = al.id
                    LEFT JOIN carreras_abiertas caa ON caa.id = ic.id_carrera_abierta
                    WHERE me.id = $1
                    AND im.libre = $2
                    GROUP BY me.fecha_examen, ma.nombre, ma.anio, c.nombre,
                        CONCAT_WS(', ', us0.apellido, us0.nombre),
                        CONCAT_WS(', ', us1.apellido, us1.nombre),
                        CONCAT_WS(', ', us2.apellido, us2.nombre)
                    `;
                const inscriptos = await this.db.oneOrNone(query, [id_mesa, libre]);
                res.status(200).json(inscriptos);
            } else {
                res.status(400).json({
                    mensaje: 'ID de mesa invalido'
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: 'Ocurrio un error al listar los inscriptos a la mesa',
                error
            });
        }
    }
}