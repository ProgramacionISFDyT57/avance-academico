

create table if not exists carreras
(
	id serial not null
		constraint carreras_pk
			primary key,
	nombre text not null,
	duracion smallint,
	cantidad_materias smallint,
	constraint carreras_nombre_uq
		unique (nombre, id)
)
;

create table if not exists tipos_materias
(
	id serial not null
		constraint tipos_materias_pk
			primary key,
	nombre text not null
		constraint tipo_materia_nombre_uq
			unique
)
;

create table if not exists materias
(
	id serial not null
		constraint materias_pk
			primary key,
	nombre text not null
		constraint materias_name
			unique,
	anio smallint,
	id_carrera smallint not null
		constraint id_carrera_fk
			references carreras,
	id_tipo smallint not null
		constraint id_tipo_fk
			references tipos_materias
)
;


create table if not exists correlativas
(
	id_materia smallint not null
		constraint id_materia_fk
			references materias,
	id_correlativa smallint not null
		constraint id_materia_necesaria_fk
			references materias,
	constraint correlativas_pk
		primary key (id_materia, id_correlativa)
)
;

create table if not exists roles
(
	id serial not null
		constraint roles_pk
			primary key,
	nombre text not null
)
;

create table if not exists usuarios
(
	id serial not null
		constraint usuarios_pk
			primary key,
	email text not null
		constraint usuarios_email_uq
			unique,
	clave text not null,
	nombre text not null,
	apellido text not null,
	fecha_nacimiento timestamp not null,
	fecha_alta timestamp not null,
	id_rol smallint not null
		constraint usuarios_roles_pk
			references roles
)
;


create table if not exists alumnos
(
	id serial not null
		constraint alumnos_pk
			primary key,
	id_usuario smallint not null
		constraint id_usuario_uq
			unique
		constraint alumnos_usuarios_fk
			references usuarios
)
;


create table if not exists profesores
(
	id serial not null
		constraint profesores_pk
			primary key,
	id_usuario smallint
		constraint profesores_usuarios_fk
			references usuarios
)
;


create table if not exists mesas
(
	id serial not null
		constraint mesas_pk
			primary key,
	id_materia smallint
		constraint mesas_materias_fk
			references materias,
	fecha_inicio timestamp,
	fecha_limite timestamp,
	fecha_examen timestamp,
	id_profesor smallint
		constraint mesas_profesor_fk
			references profesores,
	id_vocal1 smallint
		constraint mesas_vocal1_fk
			references profesores,
	id_vocal2 smallint
		constraint mesas_vocal2_fk
			references profesores
)
;


create table if not exists cursadas
(
	id serial not null
		constraint cursadas_pk
			primary key,
	id_materia smallint
		constraint cursadas_materias_fk
			references materias,
	id_profesor smallint
		constraint cursadas_profesor_fk
			references profesores,
	anio smallint,
	fecha_inicio timestamp,
	fecha_limite timestamp
)
;


create table if not exists inscripciones_cursadas
(
	id serial not null
		constraint alumnos_x_materia_pk
			primary key,
	id_alumno smallint
		constraint id_alumno
			references alumnos,
	id_cursada smallint
		constraint id_cursada
			references cursadas,
	cursa boolean,
	equivalencia boolean,
	fecha_inscripcion timestamp,
	constraint unique_insc_cursadas
		unique (id_alumno, id_cursada)
)
;

create table if not exists avance_academico
(
	id_inscripcion_cursada smallint not null
		constraint avance_academico_pk
			primary key
		constraint avance_academico_fk
			references inscripciones_cursadas,
	nota_cuat_1 smallint,
	nota_cuat_2 smallint,
	nota_recuperatorio smallint,
	asistencia smallint
)
;


create table if not exists carreras_abiertas
(
	id serial not null
		constraint inscripciones_carreras_pk
			primary key,
	id_carrera smallint
		constraint id_carrera_fk
			references carreras,
	cohorte smallint,
	fecha_inicio timestamp,
	fecha_limite timestamp,
	constraint unique_insc_carreras
		unique (id_carrera, cohorte)
)
;


create table if not exists inscripciones_carreras
(
	id serial not null
		constraint inscripcion_carreras_pk
			primary key,
	id_alumno smallint not null
		constraint id_alumno_fk
			references alumnos,
	id_carrera_abierta smallint not null
		constraint id_inscripcion_fk
			references carreras_abiertas,
	fecha_inscripcion timestamp,
	constraint unique_alumnos_por_insc
		unique (id_alumno, id_carrera_abierta)
)
;


create table if not exists inscripciones_mesa
(
	id serial not null
		constraint inscripciones_mesa_pk
			primary key,
	id_mesa smallint
		constraint inscripciones_mesa_mesa_fk
			references mesas,
	id_alumno smallint
		constraint inscripciones_mesa_alumno_fk
			references alumnos,
	fecha_inscripcion timestamp
)
;


create table if not exists finales
(
	id_inscripcion_mesa smallint not null
		constraint finales_pk
			primary key
		constraint finales_inscripcion_fk
			references inscripciones_mesa,
	nota smallint,
	libro smallint,
	folio smallint
)
;

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
 ('admin', '$2a$10$lLMVdJxEQgwM5qPaXgwqoeuJO2j8mRaugwrhlBd7yo06ZuH83hrbW', 'Admin', 'Admin', current_timestamp, current_timestamp, 1); 

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
