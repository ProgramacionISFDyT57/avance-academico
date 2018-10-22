import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as pg from 'pg-promise';
import { UsuariosController } from './controllers/usuarios-controller';
import { CarrerasController } from './controllers/carreras-controller';
import { MateriasController } from './controllers/materias-controller';
import { CursadasController } from './controllers/cursadas-controller';
const pgp = pg();
const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());
const db = pgp(process.env.DATABASE_URL);
const usuariosController = new UsuariosController(db);
const carrerasController = new CarrerasController(db);
const materiasController = new MateriasController(db);
const cursadasController = new CursadasController(db);
/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////// RUTAS /////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
// USUARIOS
// app.post("/tipos_materia", usuariosController.crear_usuario);
// TIPOS DE MATERIAS
app.get("/tipos_materia", materiasController.ver_tipos_materias);
app.post("/tipos_materia", materiasController.crear_tipo_materia);
app.put("/tipos_materia/:id", materiasController.modificar_tipo_materia);
app.delete("/tipos_materia/:id", materiasController.borrar_tipo_materia);
// MATERIAS
app.get("/materias", materiasController.ver_materias);
app.post("/materias", materiasController.crear_materia);
app.put("/materias/:id", materiasController.modificar_materia);
app.delete("/materias/:id", materiasController.borrar_materia);
// CARRERA
app.get('/carreras', carrerasController.ver_carreras);
app.post("/carreras", carrerasController.crear_carrera);
app.put("/carreras/:id", carrerasController.modificar_carrera);
app.delete("/carreras/:id", carrerasController.borrar_carrera);
// CARRERAS ABIERTAS
app.get("/carreras_abiertas", carrerasController.ver_carreras_abiertas);
app.post("/carreras_abiertas", carrerasController.crear_carreras_abiertas);
// INSCRIPCIONES A CARRERAS
app.post("/inscripciones_carreras", carrerasController.crear_inscripcion_carrera);
// CURSADAS ABIERTAS
app.post("/cursadas", cursadasController.crear_cursada);
// CORRELAVIVAS
app.post('/correlativas', function (req, res) {
    const idmateria = req.body.mt
    const idcorrelativa = req.body.cr
    db.one(`SELECT id_carrera,año 
        FROM materias WHERE id =$1`, [idmateria])
        .then(resultado1 => {
            db.one(`SELECT id_carrera, año 
                FROM materias WHERE id =$2`, [idcorrelativa])
                .then(resultado2 => {
                    if (resultado1.id_carrera === resultado2.id_carrera) {
                        if (resultado2.año > resultado1.año) {
                            db.none(`INSERT INTO correlativas (id_materia, id_correlativa) 
                                VALUES ($1, $2)`, [idmateria, idcorrelativa])
                                .then((data) => {
                                    res.status(200).json({
                                        mensaje: 'insertado correctamente',
                                        datos: true,
                                    });
                                })
                        } else {
                            res.status(400).json({
                                mensaje: 'Correlativa ilógica',
                                datos: null,
                            })
                        }
                    } else {
                        res.status(400).json({
                            mensaje: 'Materias de diferentes carreras',
                            datos: null,
                        })
                    }
                })
        })

});
// CREAR USUARIOS
app.post("/usuarios", usuariosController.crear_usuario);
//
app.listen(port, () => {
    console.log("Servidor escuchando en le puerto ", + port);
});
