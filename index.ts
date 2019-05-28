import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as pg from 'pg-promise';
import { UsuariosController } from './controllers/usuarios-controller';
import { CarrerasController } from './controllers/carreras-controller';
import { MateriasController } from './controllers/materias-controller';
import { CursadasController } from './controllers/cursadas-controller';
import { MesasController } from './controllers/mesas-controller';
import { SeguridadController } from './controllers/seguridad-controller';
const cors = require("cors");
const pgp = pg();
const app = express();
const port = process.env.PORT;
app.use(cors({ origin: true }));
app.use(bodyParser.json());
const db = pgp(process.env.DATABASE_URL);
const usuariosController = new UsuariosController(db);
const carrerasController = new CarrerasController(db);
const materiasController = new MateriasController(db);
const cursadasController = new CursadasController(db);
const mesasController = new MesasController(db);
const seguridadController = new SeguridadController(db);
/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////// RUTAS /////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
app.get("/", (req, res) => {
    res.status(200).end("<h1>Backend Avance Academico</h1>")
});
// USUARIOS
app.put("/usuarios", usuariosController.cambiar_contraseña);
// app.post("/tipos_materia", usuariosController.crear_usuario);
// LOGIN
app.post("/login", seguridadController.login);
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
app.get("/correlativas/:id_materia", materiasController.ver_correlativas);
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
app.get("/cursadas_abiertas/:id_alumno", cursadasController.cursadas_abiertas_alumno);
// USUARIOS
app.get("/usuarios", usuariosController.listar_usuarios);
app.post("/usuarios", usuariosController.crear_usuario);
// INSCRIPCIONES MESAS
app.post("/inscripciones_mesas", mesasController.crear_inscripcion_mesa);
// PROFESORES
app.get("/profesores", usuariosController.ver_profesores);
// MESAS
app.post("/crear_mesa", mesasController.crear_mesa);
app.get("/lista_mesas", mesasController.lista_mesas);
// LISTAR CURSADAS APROBADAS
app.get("/listar_cursadas_aprobadas", cursadasController.listar_cursadas_aprobadas);
// 
app.listen(port, () => {
    console.log("Servidor escuchando en le puerto ", + port);
});
