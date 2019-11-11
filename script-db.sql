-- Database generated with pgModeler (PostgreSQL Database Modeler).
-- pgModeler  version: 0.9.1
-- PostgreSQL version: 10.0
-- Project Site: pgmodeler.io
-- Model Author: ---


-- Database creation must be done outside a multicommand file.
-- These commands were put in this file only as a convenience.
-- -- object: instituto | type: DATABASE --
-- -- DROP DATABASE IF EXISTS instituto;
-- CREATE DATABASE instituto;
-- -- ddl-end --
-- 

-- object: public.materias | type: TABLE --
-- DROP TABLE IF EXISTS public.materias CASCADE;
CREATE TABLE public.materias(
	id serial NOT NULL,
	nombre text NOT NULL,
	anio smallint,
	horas smallint,
	id_carrera smallint NOT NULL,
	id_tipo smallint NOT NULL,
	CONSTRAINT materias_pk PRIMARY KEY (id)

);

-- object: public.carreras | type: TABLE --
-- DROP TABLE IF EXISTS public.carreras CASCADE;
CREATE TABLE public.carreras(
	id serial NOT NULL,
	nombre text NOT NULL,
	nombre_corto text,
	duracion smallint,
	cantidad_materias smallint,
	resolucion text,
	descripcion text,
	CONSTRAINT carreras_pk PRIMARY KEY (id)

);

-- object: public.correlativas | type: TABLE --
-- DROP TABLE IF EXISTS public.correlativas CASCADE;
CREATE TABLE public.correlativas(
	id_materia smallint NOT NULL,
	id_correlativa smallint NOT NULL,
	CONSTRAINT correlativas_pk PRIMARY KEY (id_materia,id_correlativa)

);

-- object: public.tipos_materias | type: TABLE --
-- DROP TABLE IF EXISTS public.tipos_materias CASCADE;
CREATE TABLE public.tipos_materias(
	id serial NOT NULL,
	nombre text NOT NULL,
	libre boolean NOT NULL DEFAULT true,
	asistencia smallint NOT NULL DEFAULT 60,
	CONSTRAINT tipos_materias_pk PRIMARY KEY (id),
	CONSTRAINT tipo_materia_nombre_uq UNIQUE (nombre)

);

-- object: public.alumnos | type: TABLE --
-- DROP TABLE IF EXISTS public.alumnos CASCADE;
CREATE TABLE public.alumnos(
	id serial NOT NULL,
	id_usuario smallint NOT NULL,
	CONSTRAINT alumnos_pk PRIMARY KEY (id),
	CONSTRAINT id_usuario_uq UNIQUE (id_usuario)

);

-- object: public.inscripciones_carreras | type: TABLE --
-- DROP TABLE IF EXISTS public.inscripciones_carreras CASCADE;
CREATE TABLE public.inscripciones_carreras(
	id serial NOT NULL,
	id_alumno smallint NOT NULL,
	id_carrera_abierta smallint NOT NULL,
	fecha_inscripcion timestamp,
	libro smallint,
	folio smallint,
	CONSTRAINT inscripcion_carreras_pk PRIMARY KEY (id),
	CONSTRAINT unique_alumnos_por_insc UNIQUE (id_alumno,id_carrera_abierta)

);

-- object: public.inscripciones_cursadas | type: TABLE --
-- DROP TABLE IF EXISTS public.inscripciones_cursadas CASCADE;
CREATE TABLE public.inscripciones_cursadas(
	id serial NOT NULL,
	id_alumno smallint,
	id_cursada smallint,
	cursa bool,
	equivalencia boolean,
	fecha_inscripcion timestamp,
	recursa boolean NOT NULL DEFAULT false,
	CONSTRAINT alumnos_x_materia_pk PRIMARY KEY (id),
	CONSTRAINT unique_insc_cursadas UNIQUE (id_alumno,id_cursada)

);

-- object: public.finales | type: TABLE --
-- DROP TABLE IF EXISTS public.finales CASCADE;
CREATE TABLE public.finales(
	id_inscripcion_mesa smallint NOT NULL,
	nota smallint,
	libro smallint,
	folio smallint,
	CONSTRAINT finales_pk PRIMARY KEY (id_inscripcion_mesa)

);

-- object: public.avance_academico | type: TABLE --
-- DROP TABLE IF EXISTS public.avance_academico CASCADE;
CREATE TABLE public.avance_academico(
	id_inscripcion_cursada smallint NOT NULL,
	nota_cuat_1 smallint,
	nota_cuat_2 smallint,
	nota_recuperatorio smallint,
	asistencia smallint,
	CONSTRAINT avance_academico_pk PRIMARY KEY (id_inscripcion_cursada)

);

-- object: public.usuarios | type: TABLE --
-- DROP TABLE IF EXISTS public.usuarios CASCADE;
CREATE TABLE public.usuarios(
	id serial NOT NULL,
	email text NOT NULL,
	clave text NOT NULL,
	nombre text NOT NULL,
	apellido text NOT NULL,
	fecha_alta timestamp NOT NULL,
	id_rol smallint NOT NULL,
	activo boolean NOT NULL DEFAULT true,
	fecha_nacimiento timestamp,
	telefono text,
	domicilio text,
	CONSTRAINT usuarios_email_uq UNIQUE (email),
	CONSTRAINT usuarios_pk PRIMARY KEY (id)

);

-- object: public.roles | type: TABLE --
-- DROP TABLE IF EXISTS public.roles CASCADE;
CREATE TABLE public.roles(
	id serial NOT NULL,
	nombre text NOT NULL,
	CONSTRAINT roles_pk PRIMARY KEY (id)

);

-- object: public.mesas | type: TABLE --
-- DROP TABLE IF EXISTS public.mesas CASCADE;
CREATE TABLE public.mesas(
	id serial NOT NULL,
	id_materia smallint,
	fecha_inicio timestamp,
	fecha_limite timestamp,
	fecha_examen timestamp,
	id_profesor smallint,
	id_vocal1 smallint,
	id_vocal2 smallint,
	CONSTRAINT mesas_pk PRIMARY KEY (id)

);

-- object: public.inscripciones_mesa | type: TABLE --
-- DROP TABLE IF EXISTS public.inscripciones_mesa CASCADE;
CREATE TABLE public.inscripciones_mesa(
	id serial NOT NULL,
	id_mesa smallint,
	id_alumno smallint,
	fecha_inscripcion timestamp,
	libre boolean NOT NULL DEFAULT false,
	CONSTRAINT inscripciones_mesa_pk PRIMARY KEY (id)

);

-- object: public.profesores | type: TABLE --
-- DROP TABLE IF EXISTS public.profesores CASCADE;
CREATE TABLE public.profesores(
	id serial NOT NULL,
	id_usuario smallint,
	CONSTRAINT profesores_pk PRIMARY KEY (id)

);

-- object: public.cursadas | type: TABLE --
-- DROP TABLE IF EXISTS public.cursadas CASCADE;
CREATE TABLE public.cursadas(
	id serial NOT NULL,
	id_materia smallint,
	id_profesor smallint,
	anio smallint,
	fecha_inicio timestamp,
	fecha_limite timestamp,
	CONSTRAINT cursadas_pk PRIMARY KEY (id)

);

-- object: public.carreras_abiertas | type: TABLE --
-- DROP TABLE IF EXISTS public.carreras_abiertas CASCADE;
CREATE TABLE public.carreras_abiertas(
	id serial NOT NULL,
	id_carrera smallint,
	cohorte smallint,
	fecha_inicio timestamp,
	fecha_limite timestamp,
	CONSTRAINT inscripciones_carreras_pk PRIMARY KEY (id),
	CONSTRAINT unique_insc_carreras UNIQUE (id_carrera,cohorte)

);

-- object: public.horarios | type: TABLE --
-- DROP TABLE IF EXISTS public.horarios CASCADE;
CREATE TABLE public.horarios(
	id_cursada integer NOT NULL,
	dia smallint NOT NULL,
	hora_inicio text NOT NULL,
	modulos smallint NOT NULL,
	CONSTRAINT horarios_pk PRIMARY KEY (id_cursada,dia)

);

-- object: id_carrera_fk | type: CONSTRAINT --
-- ALTER TABLE public.materias DROP CONSTRAINT IF EXISTS id_carrera_fk CASCADE;
ALTER TABLE public.materias ADD CONSTRAINT id_carrera_fk FOREIGN KEY (id_carrera)
REFERENCES public.carreras (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_tipo_fk | type: CONSTRAINT --
-- ALTER TABLE public.materias DROP CONSTRAINT IF EXISTS id_tipo_fk CASCADE;
ALTER TABLE public.materias ADD CONSTRAINT id_tipo_fk FOREIGN KEY (id_tipo)
REFERENCES public.tipos_materias (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_materia_fk | type: CONSTRAINT --
-- ALTER TABLE public.correlativas DROP CONSTRAINT IF EXISTS id_materia_fk CASCADE;
ALTER TABLE public.correlativas ADD CONSTRAINT id_materia_fk FOREIGN KEY (id_materia)
REFERENCES public.materias (id) MATCH FULL
ON DELETE CASCADE ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_materia_necesaria_fk | type: CONSTRAINT --
-- ALTER TABLE public.correlativas DROP CONSTRAINT IF EXISTS id_materia_necesaria_fk CASCADE;
ALTER TABLE public.correlativas ADD CONSTRAINT id_materia_necesaria_fk FOREIGN KEY (id_correlativa)
REFERENCES public.materias (id) MATCH FULL
ON DELETE CASCADE ON UPDATE NO ACTION;
-- ddl-end --

-- object: alumnos_usuarios_fk | type: CONSTRAINT --
-- ALTER TABLE public.alumnos DROP CONSTRAINT IF EXISTS alumnos_usuarios_fk CASCADE;
ALTER TABLE public.alumnos ADD CONSTRAINT alumnos_usuarios_fk FOREIGN KEY (id_usuario)
REFERENCES public.usuarios (id) MATCH FULL
ON DELETE CASCADE ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_alumno_fk | type: CONSTRAINT --
-- ALTER TABLE public.inscripciones_carreras DROP CONSTRAINT IF EXISTS id_alumno_fk CASCADE;
ALTER TABLE public.inscripciones_carreras ADD CONSTRAINT id_alumno_fk FOREIGN KEY (id_alumno)
REFERENCES public.alumnos (id) MATCH FULL
ON DELETE CASCADE ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_inscripcion_fk | type: CONSTRAINT --
-- ALTER TABLE public.inscripciones_carreras DROP CONSTRAINT IF EXISTS id_inscripcion_fk CASCADE;
ALTER TABLE public.inscripciones_carreras ADD CONSTRAINT id_inscripcion_fk FOREIGN KEY (id_carrera_abierta)
REFERENCES public.carreras_abiertas (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_alumno | type: CONSTRAINT --
-- ALTER TABLE public.inscripciones_cursadas DROP CONSTRAINT IF EXISTS id_alumno CASCADE;
ALTER TABLE public.inscripciones_cursadas ADD CONSTRAINT id_alumno FOREIGN KEY (id_alumno)
REFERENCES public.alumnos (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_cursada | type: CONSTRAINT --
-- ALTER TABLE public.inscripciones_cursadas DROP CONSTRAINT IF EXISTS id_cursada CASCADE;
ALTER TABLE public.inscripciones_cursadas ADD CONSTRAINT id_cursada FOREIGN KEY (id_cursada)
REFERENCES public.cursadas (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: finales_inscripcion_fk | type: CONSTRAINT --
-- ALTER TABLE public.finales DROP CONSTRAINT IF EXISTS finales_inscripcion_fk CASCADE;
ALTER TABLE public.finales ADD CONSTRAINT finales_inscripcion_fk FOREIGN KEY (id_inscripcion_mesa)
REFERENCES public.inscripciones_mesa (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: avance_academico_fk | type: CONSTRAINT --
-- ALTER TABLE public.avance_academico DROP CONSTRAINT IF EXISTS avance_academico_fk CASCADE;
ALTER TABLE public.avance_academico ADD CONSTRAINT avance_academico_fk FOREIGN KEY (id_inscripcion_cursada)
REFERENCES public.inscripciones_cursadas (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: usuarios_roles_pk | type: CONSTRAINT --
-- ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_roles_pk CASCADE;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_roles_pk FOREIGN KEY (id_rol)
REFERENCES public.roles (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: mesas_materias_fk | type: CONSTRAINT --
-- ALTER TABLE public.mesas DROP CONSTRAINT IF EXISTS mesas_materias_fk CASCADE;
ALTER TABLE public.mesas ADD CONSTRAINT mesas_materias_fk FOREIGN KEY (id_materia)
REFERENCES public.materias (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: mesas_profesor_fk | type: CONSTRAINT --
-- ALTER TABLE public.mesas DROP CONSTRAINT IF EXISTS mesas_profesor_fk CASCADE;
ALTER TABLE public.mesas ADD CONSTRAINT mesas_profesor_fk FOREIGN KEY (id_profesor)
REFERENCES public.profesores (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: mesas_vocal1_fk | type: CONSTRAINT --
-- ALTER TABLE public.mesas DROP CONSTRAINT IF EXISTS mesas_vocal1_fk CASCADE;
ALTER TABLE public.mesas ADD CONSTRAINT mesas_vocal1_fk FOREIGN KEY (id_vocal1)
REFERENCES public.profesores (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: mesas_vocal2_fk | type: CONSTRAINT --
-- ALTER TABLE public.mesas DROP CONSTRAINT IF EXISTS mesas_vocal2_fk CASCADE;
ALTER TABLE public.mesas ADD CONSTRAINT mesas_vocal2_fk FOREIGN KEY (id_vocal2)
REFERENCES public.profesores (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: inscripciones_mesa_mesa_fk | type: CONSTRAINT --
-- ALTER TABLE public.inscripciones_mesa DROP CONSTRAINT IF EXISTS inscripciones_mesa_mesa_fk CASCADE;
ALTER TABLE public.inscripciones_mesa ADD CONSTRAINT inscripciones_mesa_mesa_fk FOREIGN KEY (id_mesa)
REFERENCES public.mesas (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: inscripciones_mesa_alumno_fk | type: CONSTRAINT --
-- ALTER TABLE public.inscripciones_mesa DROP CONSTRAINT IF EXISTS inscripciones_mesa_alumno_fk CASCADE;
ALTER TABLE public.inscripciones_mesa ADD CONSTRAINT inscripciones_mesa_alumno_fk FOREIGN KEY (id_alumno)
REFERENCES public.alumnos (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: profesores_usuarios_fk | type: CONSTRAINT --
-- ALTER TABLE public.profesores DROP CONSTRAINT IF EXISTS profesores_usuarios_fk CASCADE;
ALTER TABLE public.profesores ADD CONSTRAINT profesores_usuarios_fk FOREIGN KEY (id_usuario)
REFERENCES public.usuarios (id) MATCH FULL
ON DELETE CASCADE ON UPDATE NO ACTION;
-- ddl-end --

-- object: cursadas_materias_fk | type: CONSTRAINT --
-- ALTER TABLE public.cursadas DROP CONSTRAINT IF EXISTS cursadas_materias_fk CASCADE;
ALTER TABLE public.cursadas ADD CONSTRAINT cursadas_materias_fk FOREIGN KEY (id_materia)
REFERENCES public.materias (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: cursadas_profesor_fk | type: CONSTRAINT --
-- ALTER TABLE public.cursadas DROP CONSTRAINT IF EXISTS cursadas_profesor_fk CASCADE;
ALTER TABLE public.cursadas ADD CONSTRAINT cursadas_profesor_fk FOREIGN KEY (id_profesor)
REFERENCES public.profesores (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_carrera_fk | type: CONSTRAINT --
-- ALTER TABLE public.carreras_abiertas DROP CONSTRAINT IF EXISTS id_carrera_fk CASCADE;
ALTER TABLE public.carreras_abiertas ADD CONSTRAINT id_carrera_fk FOREIGN KEY (id_carrera)
REFERENCES public.carreras (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE NO ACTION;
-- ddl-end --

-- object: horarios_cursada_fk | type: CONSTRAINT --
-- ALTER TABLE public.horarios DROP CONSTRAINT IF EXISTS horarios_cursada_fk CASCADE;
ALTER TABLE public.horarios ADD CONSTRAINT horarios_cursada_fk FOREIGN KEY (id_cursada)
REFERENCES public.cursadas (id) MATCH FULL
ON DELETE CASCADE ON UPDATE NO ACTION;
-- ddl-end --




INSERT INTO roles (id, nombre) VALUES (1, 'admin');
INSERT INTO roles (id, nombre) VALUES (2, 'directivo');
INSERT INTO roles (id, nombre) VALUES (3, 'preceptor');
INSERT INTO roles (id, nombre) VALUES (4, 'profesor');
INSERT INTO roles (id, nombre) VALUES (5, 'alumno');

INSERT INTO tipos_materias (id, nombre) VALUES (1, 'Curricular');
INSERT INTO tipos_materias (id, nombre) VALUES (2, 'Practica');
INSERT INTO tipos_materias (id, nombre) VALUES (3, 'Taller');
INSERT INTO tipos_materias (id, nombre) VALUES (4, 'Seminario');

-- usuario admin con contraseña instituto2018
INSERT INTO usuarios (email, clave, nombre, apellido, fecha_nacimiento, fecha_alta, id_rol) VALUES
 ('admin', '$2a$10$Ye12IjOx6le1tlhnSBqiNu0v7dmHj7inuvjJXwaRgm9N10.35ZC7q', 'Admin', 'Admin', current_timestamp, current_timestamp, 1); 


ALTER TABLE usuarios ADD COLUMN dni text;
UPDATE usuarios SET dni = '1234';
ALTER TABLE usuarios ALTER COLUMN dni SET NOT NULL;
ALTER TABLE usuarios ADD COLUMN telefono text;

ALTER TABLE carreras ADD COLUMN descripcion text;

-- Agregar CASCADE al borrar materias con correlativas
 
alter table correlativas drop constraint id_materia_fk;
alter table correlativas drop constraint id_materia_necesaria_fk;
alter table correlativas add constraint id_materia_fk foreign key (id_materia) references materias (id) on delete cascade;
alter table correlativas add constraint id_materia_necesaria_fk foreign key (id_correlativa) references materias (id) on delete cascade;
