# PROYECTO ISFDyT 57

## Sistema para instituto terciario

Este sistema busca brindar una plataforma para la inscripción de alumnos en carreras, materias, finales y solicitud de certificados; logrando reducir la carga de trabajo en un 50%.
Dentro de los objetivos y alcances de este sistema encontrarán:
- Gestión de alumnos, mesas, carreras y materias.
- El alumno podrá realizar la Inscripciones a carreras, materias, finales y solicitar certificados (alumno regular, examen, analítico).
- La persona encargada de verificar el alta de los alumnos (a carreras, materias, finales) generará el alta definitiva corroborando la documentación presentada.
- Los preceptores podrán actualizar el avance académico de los alumnos.
- Los directivos podrán cargar nuevas carreras y materias
- El sistema permitirá generar reportes, formularios, listas de alumnos, etc.

## RUTA [https://avance-academico.herokuapp.com](https://avance-academico.herokuapp.com/)

## Valores Estáticos
### TIPOS DE MATERIAS:
```json
{
	"id": 1,
	"nombre": "Curricular"
}
{
	"id": 2,
	"nombre": "Práctica"
}
{
	"id": 3,
	"nombre": "Taller"
}
{
	"id": 4,
	"nombre": "Seminario"
}
```
### ROLES
```json
{
	"id": 1,
	"nombre": "Admin"
}
{
	"id": 2,
	"nombre": "Directivo"
}
{
	"id": 3,
	"nombre": "Preceptor"
}
{
	"id": 4,
	"nombre": "Profesor"
}
{
	"id": 5,
	"nombre": "Alumno"
}
```

## Autenticación

Todas las rutas (excepto /login) deben recibir el siguiente header:

#### Header
```json 
{
	"x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
}
```

## Login

### `POST /login`

Devuelve token de autenticación requerido para el resto de los Requests

#### Request body
```json
{
	"email": "usuario@mail.com",
	"clave": "1234"
}

```
#### Formato de respuesta
```json
{
	"mensaje": "Sesión iniciada con éxito!",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6I"
}

```

## Usuarios

### `GET /usuarios`

Devuelve el listado de todos los usuarios
#### Requiere rol de acceso
- Directivo
#### Formato de respuesta
```array
[
	{ 
		"id": 1,
		"nombre": "",
		"apellido": "",
		"email": "",
		"fecha_nacimiento": "",
		"fecha_alta": "",
		"rol": ""
	}
]
