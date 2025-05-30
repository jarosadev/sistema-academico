const request = require('supertest');
const app = require('../test-server');

describe('Pruebas de inscripciones', () => {
  let token = '';

  beforeAll(async () => {
    // Login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        correo: 'testuser@example.com',
        password: 'TestPassword123!'
      });
    token = loginRes.body.data.tokens.access_token;
  });

  test('GET /api/inscripciones - Obtener lista de inscripciones', async () => {
    const response = await request(app)
      .get('/api/inscripciones')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/inscripciones - Crear nueva inscripción', async () => {
    const response = await request(app)
      .post('/api/inscripciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_estudiante: 1,
        id_materia: 1,
        gestion: 2025,
        paralelo: 'A'
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
