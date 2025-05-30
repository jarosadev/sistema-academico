const request = require('supertest');
const app = require('../test-server');

describe('Pruebas de notas', () => {
  let adminToken = '';
  let estudianteToken = '';
  let docenteToken = '';
  let inscripcionId = '';
    const uniqueCI = `CI${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const uniqueCorreoEstudiante = `estudiante.${Date.now()}${Math.floor(Math.random() * 10000)}@test.com`;

    beforeAll(async () => {
      // Login como administrador para crear materias y estudiantes
      const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          correo: 'admin@umsa.edu.bo',
          password: 'Admin123!'
        });
      if (!adminLoginRes.body.data || !adminLoginRes.body.data.tokens) {
        throw new Error('Admin login failed');
      }
      adminToken = adminLoginRes.body.data.tokens.access_token;

      // Login como estudiante para crear inscripciones
      const estudianteLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          correo: 'juan.perez@example.com',
          password: 'TestPassword123!'
        });
      if (!estudianteLoginRes.body.data || !estudianteLoginRes.body.data.tokens) {
        throw new Error('Estudiante login failed');
      }
      estudianteToken = estudianteLoginRes.body.data.tokens.access_token;

      // Login como docente para crear notas
      const docenteLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          correo: 'juan.perez1@example.com',
          password: 'TestPassword123!'
        });
      if (!docenteLoginRes.body.data || !docenteLoginRes.body.data.tokens) {
        throw new Error('Docente login failed');
      }
      docenteToken = docenteLoginRes.body.data.tokens.access_token;

  // Crear materia usando token de administrador
  const materiaRes = await request(app)
    .post('/api/materias')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: `Materia Test ${Date.now()}${Math.floor(Math.random() * 10000)}`,
      sigla: uniqueSigla,
      semestre: 1,
      id_mencion: 1,
      descripcion: 'Materia para pruebas'
    });
  if (!materiaRes.body.data || !materiaRes.body.data.id_materia) {
    console.error('Materia creation response:', materiaRes.body);
    throw new Error('Materia creation failed');
  }
  const materiaId = materiaRes.body.data.id_materia;


      // Crear estudiante usando token de administrador
      const estudianteRes = await request(app)
        .post('/api/estudiantes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Estudiante',
          apellido: 'Test',
          ci: uniqueCI,
          fecha_nacimiento: '2000-01-01',
          direccion: 'Test 123',
          telefono: '70123456',
          correo: uniqueCorreoEstudiante,
          password: 'TestPassword123!',
          id_mencion: 1,
          estado_academico: 'activo'
        });
      if (!estudianteRes.body.data || !estudianteRes.body.data.id_estudiante) {
        throw new Error('Estudiante creation failed');
      }
      const estudianteId = estudianteRes.body.data.id_estudiante;

      // Crear inscripcion usando token de estudiante
      const inscripcionRes = await request(app)
        .post('/api/inscripciones')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .send({
          id_estudiante: estudianteId,
          id_materia: materiaId,
          gestion: 2025,
          paralelo: 'A'
        });
      if (!inscripcionRes.body.data || !inscripcionRes.body.data.id_inscripcion) {
        throw new Error('Inscripcion creation failed');
      }
      inscripcionId = inscripcionRes.body.data.id_inscripcion;
    });


  test('GET /api/notas - Obtener lista de notas', async () => {
    const response = await request(app)
      .get('/api/notas')
      .set('Authorization', `Bearer ${docenteToken}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/notas - Crear nueva nota', async () => {
    const response = await request(app)
      .post('/api/notas')
      .set('Authorization', `Bearer ${docenteToken}`)
      .send({
        id_inscripcion: inscripcionId,
        calificacion: 85.5,
        tipo_evaluacion: 'parcial1',
        observaciones: 'Nota de prueba'
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
