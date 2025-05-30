const request = require('supertest');
const app = require('../test-server');

describe('Pruebas de materias', () => {
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

  test('GET /api/materias - Obtener lista de materias', async () => {
    const response = await request(app)
      .get('/api/materias')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/materias - Crear nueva materia', async () => {
    const response = await request(app)
      .post('/api/materias')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Matemáticas Avanzadas',
        sigla: 'MAT101',
        semestre: 1,
        id_mencion: 1,
        descripcion: 'Materia de matemáticas avanzadas'
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
