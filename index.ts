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
app.get("/usuarios", usuariosController.listar_usuarios);
app.post("/usuarios", usuariosController.crear_usuario);
app.put("/usuarios", usuariosController.cambiar_contraseña);
// PROFESORES
app.get("/profesores", usuariosController.ver_profesores);
// LOGIN
app.post("/login", seguridadController.login);
// TIPOS DE MATERIAS
app.get("/tipos_materia", materiasController.ver_tipos_materias);
app.post("/tipos_materia", materiasController.crear_tipo_materia);
app.put("/tipos_materia/:id", materiasController.modificar_tipo_materia);
app.delete("/tipos_materia/:id", materiasController.borrar_tipo_materia);
// CORRELATIVAS
app.post('/correlativas', materiasController.crear_correlativas);
app.delete('/correlativas', materiasController.borrar_correlativas);
app.get("/correlativas/:id_materia", materiasController.ver_correlativas);
// MATERIAS
app.get("/materias", materiasController.ver_materias);
app.get("/materia/:id", materiasController.ver_materia); //borrar
app.get("/materias_por_carrera/:id_carrera", materiasController.materias_por_carrera);
app.post("/materias", materiasController.crear_materia);
app.put("/materias/:id", materiasController.modificar_materia);
app.delete("/materias/:id", materiasController.borrar_materia);
// CARRERAS
app.get('/carreras', carrerasController.ver_carreras);
app.get('/carrera/:id', carrerasController.ver_carrera); // mmmm
app.post("/carreras", carrerasController.crear_carrera);
app.put("/carreras/:id", carrerasController.modificar_carrera);
app.delete("/carreras/:id", carrerasController.borrar_carrera);
//////////////////////////////////////////////////////////////////////////////////////
// CARRERAS ABIERTAS
//////////////////////////////////////////////////////////////////////////////////////
app.get("/carreras_abiertas", carrerasController.ver_carreras_abiertas);
app.get("/carreras_abiertas_hoy", carrerasController.ver_carreras_abiertas_hoy);
app.post("/carreras_abiertas", carrerasController.crear_carreras_abiertas);
// INSCRIPCIONES A CARRERAS
app.post("/inscripciones_carreras", carrerasController.crear_inscripcion_carrera);
//////////////////////////////////////////////////////////////////////////////////////
// CURSADAS ABIERTAS
//////////////////////////////////////////////////////////////////////////////////////
app.post("/cursadas", cursadasController.crear_cursada);
app.get("/cursadas_abiertas", cursadasController.ver_cursadas_abiertas);
app.get("/cursadas_abiertas/:id_alumno", cursadasController.ver_cursadas_abiertas_alumno);
// LISTAR CURSADAS APROBADAS
app.get("/listar_cursadas_aprobadas/:id", cursadasController.listar_cursadas_aprobadas);
//////////////////////////////////////////////////////////////////////////////////////
// MESAS
//////////////////////////////////////////////////////////////////////////////////////
app.post("/crear_mesa", mesasController.crear_mesa);
app.get("/lista_mesas", mesasController.lista_mesas);
// INSCRIPCIONES MESAS
app.post("/inscripciones_mesas", seguridadController.chequear_roles(['Alumno']), mesasController.crear_inscripcion_mesa);
// 
//////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log("Servidor escuchando en le puerto ", + port);
});
