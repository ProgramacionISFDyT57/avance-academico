import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as pg from 'pg-promise';
import { UsuariosController } from './controllers/usuarios-controller';
import { CarrerasController } from './controllers/carreras-controller';
import { MateriasController } from './controllers/materias-controller';
import { CursadasController } from './controllers/cursadas-controller';
import { MesasController } from './controllers/mesas-controller';
const pgp = pg();
const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());
const db = pgp(process.env.DATABASE_URL);
const usuariosController = new UsuariosController(db);
const carrerasController = new CarrerasController(db);
const materiasController = new MateriasController(db);
const cursadasController = new CursadasController(db);
const mesasController = new MesasController(db);
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
// CORRELATIVAS
app.post('/correlativas', materiasController.crear_correlativas);
app.delete('/correlativas', materiasController.borrar_correlativas);
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
// CREAR USUARIOS
app.post("/usuarios", usuariosController.crear_usuario);
// INSCRIPCIONES MESAS
app.post("/inscripciones_mesas", mesasController.crear_inscripcion_mesa);
//
app.listen(port, () => {
    console.log("Servidor escuchando en le puerto ", + port);
});
