import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as pg from 'pg-promise';
import { TipoMateria, Materia, Carrera, CarreraAbierta, InscripcionCarrera } from "./modelo";
// import { UsuariosController } from './controller/usuarios';
// import { CarrerasController } from './controller/carreras';
const pgp = pg();
const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());
const cn = {
    host: 'localhost', // 'localhost' is the default;
    port: 5432, // 5432 is the default;
    database: 'instituto',
    user: 'postgres',
    password: '123'
}
const db = pgp(cn);
// const usuariosController = new UsuariosController(db);
// const carrerasController = new CarrerasController(db);
/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////// RUTAS /////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
// USUARIOS
// app.post("/tipos_materia", usuariosController.crear_usuario);
// TIPOS DE MATERIAS
app.get("/tipos_materia", (req, res) => {
    db.manyOrNone('SELECT id, nombre FROM tipos_materias ORDER BY nombre')
        .then((data) => {
            res.status(200).json({
                mensaje: null,
                datos: data
            });
        })
        .catch((err) => {
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        });
});
app.post("/tipos_materia", (req, res) => {
    const tipo_materia: TipoMateria = req.body.tipo_materia;
    db.one('INSERT INTO tipos_materias (nombre) VALUES ($1) RETURNING ID', [tipo_materia.nombre])
        .then((data) => {
            res.status(200).json({
                mensaje: null,
                datos: data
            });
        })
        .catch((err) => {
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        });
});
app.put("/tipos_materia/:id", (req, res) => {
    const id = +req.params.id;
    const tipo_materia: TipoMateria = req.body.tipo_materia;
    if (id) {
        db.none('UPDATE tipos_materias SET (nombre) VALUES ($1) WHERE id = $2', [tipo_materia.nombre, id])
            .then((data) => {
                res.status(200).json({
                    mensaje: null,
                    datos: data
                });
            })
            .catch((err) => {
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    } else {
        res.status(400).json({
            mensaje: 'ID Incorrecto',
            datos: null
        });
    }
});
app.delete("/tipos_materia/:id", (req, res) => {
    const id = +req.params.id;
    if (id) {
        db.none('DELETE FROM tipos_materias WHERE id = $1', [id])
            .then((data) => {
                res.status(200).json({
                    mensaje: null,
                    datos: data
                });
            })
            .catch((err) => {
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    } else {
        res.status(400).json({
            mensaje: 'ID Incorrecto',
            datos: null
        });
    }
});
// MATERIAS
app.get("/materias", (req, res) => {
    db.manyOrNone('SELECT id, nombre, año FROM materias ORDER BY nombre')
        .then((data) => {
            res.status(200).json({
                mensaje: null,
                datos: data
            });
        })
        .catch((err) => {
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        });
});
app.post("/materias", (req, res) => {
    const materia: Materia = req.body.tipo_materia;
    db.one('INSERT INTO materias (nombre, año, id_carrera, id_tipo) VALUES ($1, $2, $3, $4) RETURNING ID', [materia.nombre, materia.año, materia.id_carrera, materia.id_tipo])
        .then((data) => {
            res.status(200).json({
                mensaje: null,
                datos: data
            });
        })
        .catch((err) => {
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        });
});
app.put("/materias/:id", (req, res) => {
    const id = +req.params.id;
    const materia: Materia = req.body.tipo_materia;
    if (id) {
        db.none('UPDATE materias SET (nombre, año, id_carrera, id_tipo) VALUES ($1, $2, $3, $4) WHERE id = $5', [materia.nombre, materia.año, materia.id_carrera, materia.id_tipo, id])
            .then((data) => {
                res.status(200).json({
                    mensaje: null,
                    datos: data
                });
            })
            .catch((err) => {
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    } else {
        res.status(400).json({
            mensaje: 'ID Incorrecto',
            datos: null
        });
    }
});
app.delete("/materias/:id", (req, res) => {
    const id = +req.params.id;
    if (id) {
        db.none('DELETE FROM materias WHERE id = $1', [id])
            .then((data) => {
                res.status(200).json({
                    mensaje: null,
                    datos: data
                });
            })
            .catch((err) => {
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    } else {
        res.status(400).json({
            mensaje: 'ID Incorrecto',
            datos: null
        });
    }
});
// CARRERAS
app.get("/carreras", (req, res) => {
    db.manyOrNone('SELECT id, nombre, duracion, cantidad_materias FROM carreras ORDER BY nombre')
        .then((data) => {
            res.status(200).json({
                mensaje: null,
                datos: data
            });
        })
        .catch((err) => {
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        });
});
app.post("/carreras", (req, res) => {
    const carrera: Carrera = req.body.carrera;
    db.one('INSERT INTO carreras (nombre, duracion, cantidad_materias) VALUES ($1, $2, $3) RETURNING ID;',
        [carrera.nombre, carrera.duracion, carrera.cantidad_materias])
        .then((data) => {
            res.status(200).json({
                mensaje: null,
                datos: data
            });
        })
        .catch((err) => {
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        });
});
app.put("/carreras/:id", (req, res) => {
    const id = +req.params.id;
    const carrera: Carrera = req.body.carrera;
    if (id) {
        db.none('UPDATE carreras SET (nombre, duracion, cantidad_materias) VALUES ($1, $2, $3) WHERE id = $4', [carrera.nombre, carrera.duracion, carrera.cantidad_materias, id])
            .then((data) => {
                res.status(200).json({
                    mensaje: null,
                    datos: data
                });
            })
            .catch((err) => {
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    } else {
        res.status(400).json({
            mensaje: 'ID Incorrecto',
            datos: null
        });
    }
});
app.delete("/carreras/:id", (req, res) => {
    const id = +req.params.id;
    if (id) {
        db.none('DELETE FROM carreras WHERE id = $1', [id])
            .then((data) => {
                res.status(200).json({
                    mensaje: null,
                    datos: data
                });
            })
            .catch((err) => {
                res.status(500).json({
                    mensaje: err,
                    datos: null
                });
            });
    } else {
        res.status(400).json({
            mensaje: 'ID Incorrecto',
            datos: null
        });
    }
});
// CARRERAS ABIERTAS
app.get("/carreras_abiertas", (req, res) => {
    db.manyOrNone(`
        SELECT CA.id, C.nombre, C.duracion
        FROM carreras_abiertas CA
        INNER JOIN carreras C ON C.id = CA.id_carrera
        WHERE CURRENT_TIMESTAMP BETWEEN CA.fecha_inicio AND CA.fecha_limite
        ORDER BY C.nombre`)
        .then((data) => {
            res.status(200).json({
                mensaje: null,
                datos: data
            });
        })
        .catch((err) => {
            res.status(500).json({
                mensaje: err,
                datos: null
            });
        });
});
app.post("/carreras_abiertas", (req, res) => {
    const ca: CarreraAbierta = req.body.carreras_abiertas;
    const año = new Date().getFullYear();
    if (ca.cohorte < año) {
        res.status(400).json({
            mensaje: 'La cohorte no puede ser menor que el año actual',
            datos: null
        });
    } else {
        const fecha_inicio = new Date(ca.fecha_inicio);
        const fecha_limite = new Date(ca.fecha_limite);
        if (fecha_inicio > fecha_limite) {
            res.status(400).json({
                mensaje: 'La fecha de inicio no puede ser superior a la fecha límite',
                datos: null
            });
        } else {
            const fecha_actual = new Date();
            if (fecha_actual > fecha_limite) {
                res.status(400).json({
                    mensaje: 'La fecha límite no puede ser menor a la actual',
                    datos: null
                });
            } else {
                db.oneOrNone(`SELECT id FROM carreras_abiertas 
                            WHERE id_carrera = $1 AND cohorte = $2`, [ca.id_carrera, ca.cohorte])
                    .then((data) => {
                        if (data) {
                            res.status(400).json({
                                mensaje: 'Ya esta abierta la carrera en la cohorte seleccionada',
                                datos: null
                            });
                        } else {
                            db.one(`INSERT INTO carreras_abiertas (id_carrera, cohorte, fecha_inicio, fecha_limite) 
                                    VALUES ($1, $2, $3, $4) RETURNING ID`, [ca.id_carrera, ca.cohorte, ca.fecha_inicio, ca.fecha_limite])
                                .then((data) => {
                                    res.status(200).json({
                                        mensaje: null,
                                        datos: data
                                    });
                                })
                                .catch((err) => {
                                    res.status(500).json({
                                        mensaje: err,
                                        datos: null
                                    });
                                });
                        }
                    })
                    .catch((err) => {
                        res.status(500).json({
                            mensaje: err,
                            datos: null
                        });
                    });
            }
        }
    }
});
// INSCRIPCIONES A CARRERAS
app.post("/inscripciones_carreras", (req, res) => {
    const ca: InscripcionCarrera = req.body.inscripcion_carrera;
    db.oneOrNone(`SELECT id FROM inscripciones_carreras 
                WHERE id_alumno = $1 AND id_carrera_abierta = $2`, [ca.id_alumno, ca.id_carrera_abierta])
        .then((data) => {
            if (data) {
                res.status(400).json({
                    mensaje: 'Ya se encuentra inscripto en la carrera',
                    datos: null
                });
            } else {
                db.oneOrNone(`
                            SELECT id FROM carreras_abiertas
                            FROM carreras_abiertas CA
                            WHERE CURRENT_TIMESTAMP BETWEEN CA.fecha_inicio AND CA.fecha_limite
                            AND id = $1`, [ca.id_carrera_abierta])
                .then((data) => {
                    if (data) {
                        db.one(`INSERT INTO inscripciones_carreras (id_alumno, id_carrera_abierta) 
                                VALUES ($1, $2) RETURNING ID`, [ca.id_alumno, ca.id_carrera_abierta])
                            .then((data) => {
                                res.status(200).json({
                                    mensaje: null,
                                    datos: data
                                });
                            })
                            .catch((err) => {
                                res.status(500).json({
                                    mensaje: err,
                                    datos: null
                                });
                            });
                    } else {
                        res.status(400).json({
                            mensaje: 'La carrera no se encuentra abierta',
                            datos: null
                        });
                    }
                })
                .catch((err) => {
                    res.status(500).json({
                        mensaje: err,
                        datos: null
                    });
                });
            }
        })

});
app.listen(port, () => {
    console.log("Servidor escuchando en le puerto ", + port );
});
