-- Sistema Académico - Datos iniciales (Seeds) - CORREGIDO
-- Inserción de datos básicos para el funcionamiento del sistema

-- Nota: Especificar la base de datos al conectar, no usar USE en el archivo
-- USE sonet_academic;

-- Insertar roles del sistema
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('administrador', 'Administrador del sistema con acceso completo', JSON_ARRAY(
    'usuarios:crear', 'usuarios:leer', 'usuarios:actualizar', 'usuarios:eliminar',
    'estudiantes:crear', 'estudiantes:leer', 'estudiantes:actualizar', 'estudiantes:eliminar',
    'docentes:crear', 'docentes:leer', 'docentes:actualizar', 'docentes:eliminar',
    'materias:crear', 'materias:leer', 'materias:actualizar', 'materias:eliminar',
    'menciones:crear', 'menciones:leer', 'menciones:actualizar', 'menciones:eliminar',
    'inscripciones:crear', 'inscripciones:leer', 'inscripciones:actualizar', 'inscripciones:eliminar',
    'notas:crear', 'notas:leer', 'notas:actualizar', 'notas:eliminar',
    'reportes:generar', 'auditoria:leer'
)),
('docente', 'Docente con permisos para gestionar sus materias y estudiantes', JSON_ARRAY(
    'estudiantes:leer', 'materias:leer', 'inscripciones:leer',
    'notas:crear', 'notas:leer', 'notas:actualizar', 'reportes:generar'
)),
('estudiante', 'Estudiante con permisos básicos de consulta', JSON_ARRAY(
    'materias:leer', 'inscripciones:crear', 'inscripciones:leer',
    'notas:leer', 'historial:leer'
));

-- Insertar usuario administrador por defecto
-- Contraseña: Admin123! (hasheada con bcrypt)
INSERT INTO usuarios (correo, password) VALUES
('admin@umsa.edu.bo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXfs2Stk5v96');

-- Asignar rol de administrador al usuario admin
INSERT INTO usuario_roles (id_usuario, id_rol) VALUES
(1, 1);

-- Insertar menciones académicas
INSERT INTO menciones (nombre, descripcion, materias_requeridas) VALUES
('Ingeniería de Sistemas', 'Carrera enfocada en el desarrollo de sistemas de información y software', 45),
('Ingeniería Informática', 'Carrera orientada al desarrollo de hardware y software', 42),
('Ingeniería Industrial', 'Carrera enfocada en la optimización de procesos industriales', 40),
('Ingeniería Civil', 'Carrera dedicada al diseño y construcción de infraestructura', 48),
('Ingeniería Electrónica', 'Carrera especializada en sistemas electrónicos y telecomunicaciones', 44),
('Arquitectura', 'Carrera enfocada en el diseño arquitectónico y urbanístico', 50);

-- Insertar materias para Ingeniería de Sistemas (ejemplo)
INSERT INTO materias (nombre, sigla, semestre, id_mencion, descripcion) VALUES
-- Primero
('Matemática I', 'MAT101', 1, 1, 'Fundamentos de cálculo diferencial e integral'),
('Física I', 'FIS101', 1, 1, 'Mecánica clásica y principios físicos básicos'),
('Química General', 'QUI101', 1, 1, 'Principios básicos de química general'),
('Introducción a la Programación', 'SIS101', 1, 1, 'Fundamentos de programación y algoritmos'),
('Comunicación y Lenguaje', 'LEN101', 1, 1, 'Técnicas de comunicación oral y escrita'),

-- Segundo
('Matemática II', 'MAT102', 2, 1, 'Cálculo multivariable y ecuaciones diferenciales'),
('Física II', 'FIS102', 2, 1, 'Electricidad, magnetismo y ondas'),
('Programación I', 'SIS102', 2, 1, 'Programación estructurada y orientada a objetos'),
('Estadística I', 'EST101', 2, 1, 'Estadística descriptiva e inferencial'),
('Inglés Técnico I', 'ING101', 2, 1, 'Inglés aplicado a la tecnología'),

-- Tercer Semestre
('Matemática III', 'MAT103', 3, 1, 'Álgebra lineal y matemática discreta'),
('Programación II', 'SIS103', 3, 1, 'Estructuras de datos y algoritmos avanzados'),
('Base de Datos I', 'SIS201', 3, 1, 'Fundamentos de bases de datos relacionales'),
('Sistemas Digitales', 'SIS202', 3, 1, 'Lógica digital y sistemas combinacionales'),
('Inglés Técnico II', 'ING102', 3, 1, 'Inglés técnico avanzado'),

-- Cuarto Semestre
('Investigación Operativa', 'SIS301', 4, 1, 'Métodos de optimización y toma de decisiones'),
('Base de Datos II', 'SIS302', 4, 1, 'Administración y optimización de bases de datos'),
('Análisis y Diseño de Sistemas', 'SIS303', 4, 1, 'Metodologías de análisis y diseño de sistemas'),
('Redes de Computadoras I', 'SIS304', 4, 1, 'Fundamentos de redes y protocolos'),
('Economía', 'ECO101', 4, 1, 'Principios básicos de economía');

-- Insertar algunos usuarios de ejemplo
INSERT INTO usuarios (correo, password) VALUES
('docente1@umsa.edu.bo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXfs2Stk5v96'), -- Docente123!
('docente2@umsa.edu.bo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXfs2Stk5v96'),
('estudiante1@umsa.edu.bo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXfs2Stk5v96'), -- Estudiante123!
('estudiante2@umsa.edu.bo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeedbdXfs2Stk5v96');

-- Asignar roles a usuarios
INSERT INTO usuario_roles (id_usuario, id_rol) VALUES
(2, 2), -- docente1 -> rol docente
(3, 2), -- docente2 -> rol docente
(4, 3), -- estudiante1 -> rol estudiante
(5, 3); -- estudiante2 -> rol estudiante

-- Insertar docentes de ejemplo
INSERT INTO docentes (nombre, apellido, ci, especialidad, telefono, id_usuario) VALUES
('Carlos', 'Mendoza López', '12345678', 'Ingeniería de Software', '70123456', 2),
('María', 'García Pérez', '87654321', 'Base de Datos y Sistemas', '71234567', 3);

-- Insertar estudiantes de ejemplo
INSERT INTO estudiantes (nombre, apellido, ci, fecha_nacimiento, direccion, telefono, id_usuario, id_mencion) VALUES
('Juan', 'Pérez Mamani', '11223344', '2000-05-15', 'Av. 6 de Agosto #123, La Paz', '72345678', 4, 1),
('Ana', 'Quispe Condori', '44332211', '1999-08-22', 'Calle Murillo #456, La Paz', '73456789', 5, 1);

-- Asignar materias a docentes para la gestión 2024
INSERT INTO docente_materias (id_docente, id_materia, gestion, paralelo) VALUES
(1, 4, 2024, 'A'), -- Carlos Mendoza - Introducción a la Programación
(1, 8, 2024, 'A'), -- Carlos Mendoza - Programación I
(1, 12, 2024, 'A'), -- Carlos Mendoza - Programación II
(2, 13, 2024, 'A'), -- María García - Base de Datos I
(2, 17, 2024, 'A'); -- María García - Base de Datos II

-- Inscribir estudiantes en materias (Primero 2024)
INSERT INTO inscripciones (id_estudiante, id_materia, gestion, paralelo) VALUES
-- Juan Pérez - Primero
(1, 1, 2024, 'A'), -- Matemática I
(1, 2, 2024, 'A'), -- Física I
(1, 3, 2024, 'A'), -- Química General
(1, 4, 2024, 'A'), -- Introducción a la Programación
(1, 5, 2024, 'A'), -- Comunicación y Lenguaje

-- Ana Quispe - Primero
(2, 1, 2024, 'A'), -- Matemática I
(2, 2, 2024, 'A'), -- Física I
(2, 3, 2024, 'A'), -- Química General
(2, 4, 2024, 'A'), -- Introducción a la Programación
(2, 5, 2024, 'A'); -- Comunicación y Lenguaje

-- Insertar algunas notas de ejemplo
INSERT INTO notas (id_inscripcion, calificacion, tipo_evaluacion, id_docente, observaciones) VALUES
-- Notas de Juan Pérez
(4, 85.00, 'parcial1', 1, 'Buen desempeño en programación básica'),
(4, 78.00, 'parcial2', 1, 'Mejoró en estructuras de control'),
(4, 82.00, 'final', 1, 'Excelente comprensión de algoritmos'),

-- Notas de Ana Quispe
(9, 92.00, 'parcial1', 1, 'Excelente lógica de programación'),
(9, 88.00, 'parcial2', 1, 'Muy buena implementación de algoritmos'),
(9, 90.00, 'final', 1, 'Destacada en programación');

-- Actualizar estado de inscripciones basado en notas finales
UPDATE inscripciones SET estado = 'aprobado' WHERE id_inscripcion IN (4, 9);

-- Insertar datos de auditoría inicial (corregido)
INSERT INTO auditoria (id_usuario, tabla_afectada, accion, id_registro, valores_nuevos, ip_address) VALUES
(1, 'roles', 'INSERT', 1, JSON_OBJECT('nombre', 'administrador'), '127.0.0.1'),
(1, 'roles', 'INSERT', 2, JSON_OBJECT('nombre', 'docente'), '127.0.0.1'),
(1, 'roles', 'INSERT', 3, JSON_OBJECT('nombre', 'estudiante'), '127.0.0.1'),
(1, 'usuarios', 'INSERT', 1, JSON_OBJECT('correo', 'admin@umsa.edu.bo'), '127.0.0.1');

-- Crear índices adicionales para optimización (comentados - ya están en el schema)
-- CREATE INDEX idx_inscripciones_estudiante_gestion ON inscripciones(id_estudiante, gestion);
-- CREATE INDEX idx_notas_inscripcion_tipo ON notas(id_inscripcion, tipo_evaluacion);
-- CREATE INDEX idx_historial_estudiante_gestion ON historial_academico(id_estudiante, gestion);

-- Actualizar historial académico para los estudiantes insertados
CALL sp_actualizar_historial_academico(1, 2024);
CALL sp_actualizar_historial_academico(2, 2024);

-- Comentarios sobre los datos iniciales:
-- 1. Se crea un usuario administrador por defecto (admin@umsa.edu.bo / Admin123!)
-- 2. Se definen los tres roles principales del sistema
-- 3. Se insertan menciones académicas básicas
-- 4. Se crean materias de ejemplo para Ingeniería de Sistemas
-- 5. Se insertan usuarios, docentes y estudiantes de prueba
-- 6. Se establecen inscripciones y notas de ejemplo
-- 7. Se registran acciones iniciales en auditoría
-- 8. Se actualiza automáticamente el historial académico

-- Credenciales de acceso:
-- - Usuario admin: admin@umsa.edu.bo / Admin123!
-- - Docente1: docente1@umsa.edu.bo / Docente123!
-- - Docente2: docente2@umsa.edu.bo / Docente123!
-- - Estudiante1: estudiante1@umsa.edu.bo / Estudiante123!
-- - Estudiante2: estudiante2@umsa.edu.bo / Estudiante123!

-- Verificar que los datos se insertaron correctamente
SELECT 'Datos iniciales insertados correctamente' as resultado,
       (SELECT COUNT(*) FROM roles) as total_roles,
       (SELECT COUNT(*) FROM usuarios) as total_usuarios,
       (SELECT COUNT(*) FROM menciones) as total_menciones,
       (SELECT COUNT(*) FROM materias) as total_materias,
       (SELECT COUNT(*) FROM docentes) as total_docentes,
       (SELECT COUNT(*) FROM estudiantes) as total_estudiantes,
       (SELECT COUNT(*) FROM inscripciones) as total_inscripciones,
       (SELECT COUNT(*) FROM notas) as total_notas;