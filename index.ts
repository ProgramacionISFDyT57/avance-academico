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
// LOGIN
app.post("/login", seguridadController.login);
// USUARIOS
app.get("/usuarios", seguridadController.chequear_roles(['directivo']), usuariosController.listar_usuarios);
app.post("/usuarios", seguridadController.chequear_roles(['directivo']), usuariosController.crear_usuario);
app.put("/usuarios/:id_usuario", seguridadController.chequear_roles(['directivo']), usuariosController.editar_usuario);
app.put("/usuarios/activar/:id_usuario", seguridadController.chequear_roles(['directivo']), usuariosController.activar_usuario);
app.put("/usuarios/desactivar/:id_usuario", seguridadController.chequear_roles(['directivo']), usuariosController.desactivar_usuario);
app.delete("/usuarios/:id_usuario", seguridadController.chequear_roles(['directivo']), usuariosController.eliminar_usuario);
app.put("/cambio_password", seguridadController.chequear_roles(), usuariosController.cambiar_contraseña);
app.put("/reset_password/:id_usuario", seguridadController.chequear_roles(['admin']), usuariosController.resetear_contraseña);
// PROFESORES
app.get("/profesores", seguridadController.chequear_roles(), usuariosController.listar_profesores);
app.get("/profesores/:anio", seguridadController.chequear_roles(), usuariosController.listar_profesores_por_anio);
app.get("/profesores/:anio/:dia", seguridadController.chequear_roles(), usuariosController.listar_profesores_por_dia);
// ALUMNOS
app.get("/alumnos", seguridadController.chequear_roles(['directivo', 'preceptor']), usuariosController.listar_alumnos);
app.get("/alumnos_por_carrera/:id_carrera", seguridadController.chequear_roles(['directivo', 'preceptor']), usuariosController.listar_alumnos_por_carrera);
app.post("/alumnos", seguridadController.chequear_roles(['directivo', 'preceptor']), usuariosController.crear_alumno);
app.put("/alumnos/:id_alumno", seguridadController.chequear_roles(['directivo', 'preceptor']), usuariosController.editar_alumno);
app.delete("/alumnos/:id_alumno", seguridadController.chequear_roles(['directivo', 'preceptor']), usuariosController.eliminar_alumno);
// ROLES
app.get("/roles", seguridadController.chequear_roles(['directivo']), usuariosController.listar_roles);
// TIPOS DE MATERIAS
app.get("/tipos_materia", seguridadController.chequear_roles(['preceptor', 'directivo']), materiasController.listar_tipos_materias);
app.post("/tipos_materia", seguridadController.chequear_roles(['directivo']), materiasController.crear_tipo_materia);
app.put("/tipos_materia/:id", seguridadController.chequear_roles(['directivo']), materiasController.modificar_tipo_materia);
app.delete("/tipos_materia/:id", seguridadController.chequear_roles(['directivo']), materiasController.borrar_tipo_materia);
// MATERIAS
app.get("/materias", materiasController.listar_materias);
app.get("/materias_por_carrera/:id_carrera", materiasController.materias_por_carrera);
app.post("/materias", seguridadController.chequear_roles(['directivo']), materiasController.crear_materia);
app.put("/materias/:id", seguridadController.chequear_roles(['directivo']), materiasController.modificar_materia);
app.delete("/materias/:id", seguridadController.chequear_roles(['directivo']), materiasController.borrar_materia);
// CARRERAS
app.get('/carreras', carrerasController.listar_carreras);
app.post("/carreras", seguridadController.chequear_roles(['directivo']), carrerasController.crear_carrera);
app.put("/carreras/:id", seguridadController.chequear_roles(['directivo']), carrerasController.modificar_carrera);
app.delete("/carreras/:id", seguridadController.chequear_roles(['directivo']), carrerasController.borrar_carrera);
//////////////////////////////////////////////////////////////////////////////////////
// CARRERAS ABIERTAS
//////////////////////////////////////////////////////////////////////////////////////
app.get("/carreras_abiertas", seguridadController.chequear_roles(['directivo', 'preceptor']), carrerasController.ver_carreras_abiertas);
app.get("/carreras_abiertas_hoy", seguridadController.chequear_roles(['directivo', 'preceptor']), carrerasController.ver_carreras_abiertas_hoy);
app.post("/carreras_abiertas", seguridadController.chequear_roles(['directivo', 'preceptor']), carrerasController.crear_carreras_abiertas);
app.delete("/carreras_abiertas/:id_carrera_abierta", seguridadController.chequear_roles(['directivo', 'preceptor']), carrerasController.eliminar_carrera_abierta);
// INSCRIPCIONES A CARRERAS
app.get("/inscriptos_carrera/:id_carrera_abierta", seguridadController.chequear_roles(['directivo', 'preceptor']), carrerasController.listar_inscriptos_carrera);
app.post("/inscripciones_carreras", seguridadController.chequear_roles(['directivo', 'preceptor']), carrerasController.crear_inscripcion_carrera);
app.put("/inscripciones_carreras/:id_inscripcion", seguridadController.chequear_roles(['directivo', 'preceptor']), carrerasController.asignar_libro_folio);
app.delete("/inscripciones_carreras/:id_inscripcion", seguridadController.chequear_roles(['directivo', 'preceptor']), carrerasController.borrar_inscripcion_carrera);
//////////////////////////////////////////////////////////////////////////////////////
// CURSADAS ABIERTAS
//////////////////////////////////////////////////////////////////////////////////////
app.get("/cursadas_abiertas", seguridadController.chequear_roles(), cursadasController.listar_cursadas);
app.get("/cursadas_abiertas/:anio", seguridadController.chequear_roles(), cursadasController.listar_cursadas);
app.post("/cursadas", seguridadController.chequear_roles(['directivo', 'preceptor']), cursadasController.crear_cursada);
app.put("/cursadas/:id_cursada", seguridadController.chequear_roles(['directivo', 'preceptor']), cursadasController.editar_cursada);
app.delete("/cursadas/:id_cursada", seguridadController.chequear_roles(['directivo', 'preceptor']), cursadasController.eliminar_cursada);
app.get("/horarios/:anio/:id_carrera/:curso", seguridadController.chequear_roles(), cursadasController.horarios);
// INCRIPCIONES CURSADAS
app.get("/inscriptos_cursada2/:id_cursada", seguridadController.chequear_roles(['directivo', 'preceptor']), cursadasController.listar_inscriptos_cursada);
app.get("/planilla_inscriptos_cursada/:id_cursada", seguridadController.chequear_roles(['directivo', 'preceptor']), cursadasController.planilla_inscriptos_cursada);
app.post("/inscripcion_cursada", seguridadController.chequear_roles(['alumno']), cursadasController.crear_inscripcion_cursada);
app.post("/inscribir_alumno_cursada", seguridadController.chequear_roles(['directivo', 'preceptor']), cursadasController.inscribir_alumno_cursada);
app.delete("/inscripcion_cursada_alumno/:id_inscripcion_cursada", seguridadController.chequear_roles(['admin']), cursadasController.eliminar_inscripcion_cursada_alumno);
app.delete("/inscripcion_cursada/:id_inscripcion_cursada", seguridadController.chequear_roles(['alumno']), cursadasController.eliminar_inscripcion_cursada);
// NOTAS CURSADA (AVANCE ACADEMICO)
app.post("/notas_cursada", seguridadController.chequear_roles(['directivo', 'preceptor']), cursadasController.cargar_notas_cursada);
app.delete("/notas_cursada/:id_inscripcion_cursada", seguridadController.chequear_roles(['directivo', 'preceptor']), cursadasController.eliminar_notas_cursada);
//////////////////////////////////////////////////////////////////////////////////////
// MESAS
//////////////////////////////////////////////////////////////////////////////////////
app.get("/lista_mesas", seguridadController.chequear_roles(), mesasController.lista_mesas);
app.get("/lista_mesas/:anio", seguridadController.chequear_roles(), mesasController.lista_mesas);
app.post("/crear_mesa", seguridadController.chequear_roles(['directivo', 'preceptor']), mesasController.crear_mesa);
app.put("/mesas/:id_mesa", seguridadController.chequear_roles(['directivo', 'preceptor']), mesasController.editar_mesa);
app.delete("/mesas/:id_mesa", seguridadController.chequear_roles(['directivo', 'preceptor']), mesasController.eliminar_mesa);
// INSCRIPCIONES MESAS
app.get("/inscriptos_mesa2/:id_mesa", seguridadController.chequear_roles(['directivo', 'preceptor']), mesasController.listar_inscriptos_mesa);
app.get("/acta_volante/:id_mesa", seguridadController.chequear_roles(['directivo', 'preceptor']), mesasController.acta_volante);
app.get("/acta_volante/:id_mesa/:libres", seguridadController.chequear_roles(['directivo', 'preceptor']), mesasController.acta_volante);
app.post("/inscripciones_mesas", seguridadController.chequear_roles(['alumno']), mesasController.crear_inscripcion_mesa);
app.post("/inscribir_alumno_final", seguridadController.chequear_roles(['directivo', 'preceptor']), mesasController.inscribir_alumno_mesa);
app.delete("/inscripcion_mesa_alumno/:id_inscripcion_mesa", seguridadController.chequear_roles(['admin']), mesasController.eliminar_inscripcion_mesa_alumno);
app.delete("/inscripciones_mesas/:id_inscripcion_mesa", seguridadController.chequear_roles(['alumno']), mesasController.eliminar_inscripcion_mesa);
// NOTAS FINALES (AVANCE ACADEMICO)
app.post("/notas_final", seguridadController.chequear_roles(['directivo', 'preceptor']), mesasController.cargar_notas_final);
app.delete("/notas_final/:id_inscripcion_mesa", seguridadController.chequear_roles(['directivo', 'preceptor']), mesasController.eliminar_notas_final);
//////////////////////////////////////////////////////////////////////////////////////
// MESAS
//////////////////////////////////////////////////////////////////////////////////////
app.get("/avance_academico", seguridadController.chequear_roles(['alumno']), usuariosController .avance_academico);
app.get("/avance_academico/:id_alumno", seguridadController.chequear_roles(['directivo', 'preceptor']), usuariosController .avance_academico);
//////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log("Servidor escuchando en le puerto ", + port);
});
