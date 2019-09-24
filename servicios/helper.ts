import { IDatabase } from 'pg-promise';
import { CursadaAlumno } from '../modelos/cursada-alumno';
import { Avance } from '../modelos/modelo-avance-academico';

export class HelperService {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
    }

    public notas_validas(avance: Avance) {
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
    public asistencia_valida(avance: Avance) {
        if (avance.asistencia) {
            if (avance.asistencia < 0 || avance.asistencia > 100) {
                return 'La asistencia debe ser un número entero entre 0 y 100';
            } else if (avance.asistencia % 1 !== 0 || avance.asistencia % 1 !== 0) {
                return 'La asistencia debe ser un número entero entre 0 y 100';
            }
        }
        return true;
    }

    public async get_id_materia(id_cursada: number): Promise<number> {
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

    public async realizar_inscripcion_cursada(id_alumno: number, id_cursada: number, cursa: boolean, equivalencia: boolean, recursa: boolean) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `INSERT INTO inscripciones_cursadas (id_alumno, id_cursada, cursa, equivalencia, recursa, fecha_inscripcion) 
                                VALUES ($1, $2, $3, $4, $5, current_timestamp);`
                await this.db.none(query, [id_alumno, id_cursada, cursa, equivalencia, recursa]);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    public async get_id_materias_correlativas(id_materia: number): Promise<{ id: number, nombre: string }[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT co.id_correlativa AS id, ma2.nombre
                    FROM materias ma
                    INNER JOIN correlativas co ON co.id_materia = ma.id
                    INNER JOIN materias ma2 ON ma2.id = co.id_correlativa
                    WHERE ma.id = $1`;
                const correlativas = await this.db.manyOrNone(query, [id_materia]);
                resolve(correlativas);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async get_id_cursada(id_inscripcion_cursada: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT cu.id
                    FROM inscripciones_cursadas ic 
                    INNER JOIN cursadas cu ON cu.id = ic.id_cursada
                    WHERE ic.id = $1`;
                const resultado = await this.db.one(query, [id_inscripcion_cursada]);
                resolve(resultado.id);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async get_año_cursada(id_cursada: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT c.anio
                    FROM cursadas c 
                    WHERE c.id = $1`;
                const resultado = await this.db.one<{anio: number}>(query, [id_cursada]);
                resolve(resultado.anio);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async get_id_mesa(id_inscripcion_mesa: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT me.id
                    FROM inscripciones_mesa im
                    INNER JOIN mesas me ON me.id = im.id_mesa
                    WHERE im.id = $1`;
                const resultado = await this.db.one(query, [id_inscripcion_mesa]);
                resolve(resultado.id);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async get_fecha_examen(id_mesa: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT fecha_examen
                    FROM mesas
                    WHERE id = $1`;
                const resultado = await this.db.one(query, [id_mesa]);
                resolve(resultado.fecha_examen);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async get_id_materia_x_mesa(id_mesa: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT ma.id AS id_materia
                    FROM mesas me
                    INNER JOIN materias ma ON ma.id = me.id_materia
                    WHERE me.id = $1`;
                const resultado = await this.db.one(query, [id_mesa]);
                resolve(resultado.id_materia);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async carrera_abierta(id_carrera_abierta: number): Promise<true | string> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT fecha_inicio, fecha_limite
                    FROM carreras_abiertas
                    WHERE id = $1;`
                const carrera_abierta = await this.db.one(query, id_carrera_abierta);
                const fecha_actual = new Date().getTime();
                const fecha_inicio = new Date(carrera_abierta.fecha_inicio).getTime();
                const fecha_limite = new Date(carrera_abierta.fecha_limite).getTime();
                const fecha_actual_texto = new Date().toLocaleDateString();
                const fecha_inicio_texto = new Date(carrera_abierta.fecha_inicio).toLocaleDateString();
                const fecha_limite_texto = new Date(carrera_abierta.fecha_limite).toLocaleDateString();
                if (fecha_inicio <= fecha_actual) {
                    if (fecha_limite >= fecha_actual) {
                        resolve(true);
                    } else {
                        resolve('Ya finalizó la inscripción a la carrera, fecha límite: ' + fecha_limite_texto + ' // Fecha actual: ' + fecha_actual_texto);
                    }
                } else {
                    resolve('Aun no inició la inscripción a la carrera, fecha de inicio: ' + fecha_inicio_texto + ' // Fecha actual: ' + fecha_actual_texto);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async mesa_abierta(id_mesa: number): Promise<true | string> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT fecha_inicio, fecha_limite
                    FROM mesas
                    WHERE id = $1;`
                const mesa = await this.db.one(query, id_mesa);
                const fecha_actual = new Date().getTime();
                const fecha_inicio = new Date(mesa.fecha_inicio).getTime();
                const fecha_limite = new Date(mesa.fecha_limite).getTime();
                const fecha_actual_texto = new Date().toLocaleDateString();
                const fecha_inicio_texto = new Date(mesa.fecha_inicio).toLocaleDateString();
                const fecha_limite_texto = new Date(mesa.fecha_limite).toLocaleDateString();
                if (fecha_inicio <= fecha_actual) {
                    if (fecha_limite >= fecha_actual) {
                        resolve(true);
                    } else {
                        resolve('Ya finalizó la inscripción a la mesa, fecha límite: ' + fecha_limite_texto + ' // Fecha actual: ' + fecha_actual_texto);
                    }
                } else {
                    resolve('Aun no inició la inscripción a la mesa, fecha de inicio: ' + fecha_inicio_texto + ' // Fecha actual: ' + fecha_actual_texto);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async cursada_abierta(id_cursada: number): Promise<true | string> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT fecha_inicio, fecha_limite
                    FROM cursadas
                    WHERE id = $1;`
                const cursada = await this.db.one(query, id_cursada);
                const fecha_actual = new Date().getTime();
                const fecha_inicio = new Date(cursada.fecha_inicio).getTime();
                const fecha_limite = new Date(cursada.fecha_limite).getTime();
                const fecha_actual_texto = new Date().toLocaleDateString();
                const fecha_inicio_texto = new Date(cursada.fecha_inicio).toLocaleDateString();
                const fecha_limite_texto = new Date(cursada.fecha_limite).toLocaleDateString();
                if (fecha_inicio <= fecha_actual) {
                    if (fecha_limite >= fecha_actual) {
                        resolve(true);
                    } else {
                        resolve('Ya finalizó la inscripción a la cursada, fecha límite: ' + fecha_limite_texto + ' // Fecha actual: ' + fecha_actual_texto);
                    }
                } else {
                    resolve('Aun no inició la inscripción a la cursada, fecha de inicio: ' + fecha_inicio_texto + ' // Fecha actual: ' + fecha_actual_texto);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async final_aprobado(id_materia: number, id_alumno: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT fi.nota
                    FROM materias ma
                    INNER JOIN mesas me ON me.id_materia = ma.id
                    INNER JOIN inscripciones_mesa im ON im.id_mesa = me.id
                    INNER JOIN finales fi ON fi.id_inscripcion_mesa = im.id
                    WHERE ma.id = $1
                    AND im.id_alumno = $2
                    AND fi.nota >= 4`;
                const result = await this.db.manyOrNone(query, [id_materia, id_alumno]);
                if (result.length) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async cursada_aprobada(id_materia: number, id_alumno: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const final_aprobado = await this.final_aprobado(id_materia, id_alumno);
                if (final_aprobado) {
                    resolve(true);
                } else {
                    const query = `
                        SELECT cu.anio
                        FROM materias ma
                        INNER JOIN tipos_materias tm ON tm.id = ma.id_tipo
                        INNER JOIN cursadas cu ON cu.id_materia = ma.id
                        INNER JOIN inscripciones_cursadas ic ON ic.id_cursada = cu.id
                        INNER JOIN avance_academico aa ON aa.id_inscripcion_cursada = ic.id
                        WHERE ma.id = $1
                        AND ic.id_alumno = $2
                        AND ((aa.nota_cuat_1 >=4 and aa.nota_cuat_2 >=4) OR (aa.nota_recuperatorio >=4))
                        AND aa.asistencia >= tm.asistencia;`;
                    const respuesta = await this.db.oneOrNone<{anio: number}>(query, [id_materia, id_alumno]);
                    if (respuesta) {
                        const año_cursada = respuesta.anio;
                        const fecha_limite = new Date('1/5/' + (año_cursada + 6));
                        const fecha_actual = new Date();
                        if (fecha_actual < fecha_limite) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    } else {
                        resolve(false);
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async finales_correlativos_aprobados(id_materia: number, id_alumno: number): Promise<boolean | string> {
        return new Promise(async (resolve, reject) => {
            try {
                const correlativas = await this.get_id_materias_correlativas(id_materia);
                if (!correlativas.length) {
                    resolve(true);
                } else {
                    let respuesta: boolean | string = true;
                    for (const correlativa of correlativas) {
                        const aprobada = await this.final_aprobado(correlativa.id, id_alumno);
                        if (!aprobada) {
                            if (respuesta === true) {
                                respuesta = correlativa.nombre
                            } else {
                                respuesta = respuesta + ', ' + correlativa.nombre;
                            }
                        }
                    }
                    resolve(respuesta);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async cursadas_correlativas_aprobadas(id_materia: number, id_alumno: number): Promise<boolean | string> {
        return new Promise(async (resolve, reject) => {
            try {
                const correlativas = await this.get_id_materias_correlativas(id_materia);
                if (!correlativas.length) {
                    resolve(true);
                } else {
                    let respuesta: boolean | string = true;
                    for (const correlativa of correlativas) {
                        const aprobada = await this.cursada_aprobada(correlativa.id, id_alumno);
                        if (!aprobada) {
                            if (respuesta === true) {
                                respuesta = correlativa.nombre
                            } else {
                                respuesta = respuesta + ', ' + correlativa.nombre;
                            }
                        }
                    }
                    resolve(respuesta);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    private async materia_permite_insc_libre(id_materia: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT tm.libre
                    FROM materias ma
                    INNER JOIN tipos_materias tm ON tm.id = ma.id_tipo
                    WHERE ma.id = $1;`
                const respuesta = await this.db.one<{libre: boolean}>(query, [id_materia]);
                resolve(respuesta.libre);
            } catch (error) {
                reject(error);
            }
        });
    }

    private async cant_materia_anio(id_materia: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT COUNT(m.id) AS cantidad
                    FROM materias m
                    INNER JOIN (
                        SELECT m.anio, m.id_carrera
                        FROM materias m
                        WHERE m.id = $1
                    ) AS m2 ON m2.anio = m.anio AND m2.id_carrera = m.id_carrera;`;
                const respuesta = await this.db.one<{cantidad: number}>(query, [id_materia]);
                resolve(respuesta.cantidad);
            } catch (error) {
                reject(error);
            }
        });
    }

    private async cant_inscripciones_libres(id_alumno: number, año: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT COUNT(ic.id) AS cantidad
                    FROM inscripciones_cursadas ic
                    INNER JOIN cursadas c ON c.id = ic.id_cursada
                    WHERE ic.id_alumno = $1
                    AND ic.cursa = false
                    AND ic.recursa = false
                    AND c.anio = $2`;
                const respuesta = await this.db.one<{cantidad: number}>(query, [id_alumno, año]);
                resolve(respuesta.cantidad);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async recursa(id_materia: number, id_alumno: number, año: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT tm.libre
                    FROM materias m
                    INNER JOIN cursadas c ON c.id_materia = m.id
                    INNER JOIN inscripciones_cursadas ic ON ic.id_cursada = c.id
                    WHERE ma.id = $1
                    AND ic.id_alumno = $2
                    AND c.anio < $3;`
                const respuesta = await this.db.manyOrNone(query, [id_materia, id_alumno, año]);
                if (respuesta.length) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async permite_inscripcion_libre(id_materia: number, id_alumno: number, año: number, recursa: boolean): Promise<true | string> {
        return new Promise(async (resolve, reject) => {
            try {
                const materia_permite = await this.materia_permite_insc_libre(id_materia);
                if (materia_permite) {
                    if (!recursa) {
                        const cant_materias_año = await this.cant_materia_anio(id_materia);
                        const cant_inscripciones_libres = await this.cant_inscripciones_libres(id_alumno, año);
                        const max_insc_libres = Math.ceil(0.3 * cant_materias_año);
                        if (cant_inscripciones_libres < max_insc_libres) {
                            resolve(true);
                        } else {
                            resolve('Superó la maxima cantidad de materias libre este año');
                        }
                    } else {
                        resolve(true);
                    }
                } else {
                    resolve('La materia no permite inscripción libre');
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async final_libre(id_materia: number, id_alumno: number, fecha_examen: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT c.anio
                    FROM inscripciones_cursadas ic
                    INNER JOIN cursadas c ON c.id = ic.id_cursada
                    INNER JOIN materias m ON m.id = c.id_materia
                    WHERE m.id = $1
                    AND ic.cursa = false
                    AND ic.id_alumno = $2;`
                const respuesta = await this.db.oneOrNone(query, [id_materia, id_alumno]);
                if (respuesta) {
                    const año_cursada = respuesta.anio;
                    const fecha_limite = new Date('1/5/' + (año_cursada + 1));
                    const f_examen = new Date(fecha_examen);
                    if (f_examen < fecha_limite) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

}