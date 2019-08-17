import { IDatabase } from 'pg-promise';

export class HelperService {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
    }
    
    public  async get_id_materias_correlativas(id_materia: number): Promise<number[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    SELECT co.id_correlativa
                    FROM materias ma
                    INNER JOIN correlativas co ON co.id_materia = ma.id
                    WHERE me.id = $1`;
                const correlativas = await this.db.manyOrNone(query, [id_materia]);
                const ids = [];
                for (const correlativa of correlativas) {
                    ids.push(correlativa.id_correlativa);
                }
                resolve(ids);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async carrera_abierta(id_carrera_abierta: number): Promise<true|string> {
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

    public async mesa_abierta(id_mesa: number): Promise<true|string> {
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

    public async cursada_abierta(id_cursada: number): Promise<true|string> {
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
                const query = `
                    SELECT ma.id
                    FROM materias ma
                    INNER JOIN tipos_materias tm ON tm.id = ma.id_tipo
                    INNER JOIN cursadas cu ON cu.id_materia = ma.id
                    INNER JOIN inscripciones_cursadas ic ON ic.id_cursada = cu.id
                    INNER JOIN avance_academico aa ON aa.id_inscripcion_cursada = ic.id
                    WHERE ma.id = $1
                    AND ic.id_alumno = $2
                    AND ((aa.nota_cuat_1 >=4 and aa.nota_cuat_2 >=4) OR (aa.nota_recuperatorio >=4))
                    AND ((tm.id = 2 AND aa.asistencia >= 80) OR (tm.id != 2 AND aa.asistencia >= 60))`;
                const resultados = await this.db.manyOrNone(query, [id_materia, id_alumno]);
                if (resultados.length) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async finales_correlativos_aprobados(id_materia: number, id_alumno: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {                
                const correlativas = await this.get_id_materias_correlativas(id_materia);
                if (!correlativas.length) {
                    resolve(true);
                } else {
                    let aprobada = true;
                    let i = 0;
                    while (aprobada && i < correlativas.length) {
                        aprobada = await this.final_aprobado(correlativas[i], id_alumno);
                        i++;
                    }
                    if (aprobada) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async cursadas_correlativas_aprobadas(id_materia: number, id_alumno: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {                
                const correlativas = await this.get_id_materias_correlativas(id_materia);
                if (!correlativas.length) {
                    resolve(true);
                } else {
                    let aprobada = true;
                    let i = 0;
                    while (aprobada && i < correlativas.length) {
                        aprobada = await this.cursada_aprobada(correlativas[i], id_alumno);
                        i++;
                    }
                    if (aprobada) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    
}