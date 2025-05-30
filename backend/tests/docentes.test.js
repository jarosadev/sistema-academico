const request = require('supertest');
const app = require('../test-server');

describe('Pruebas de docentes', () => {
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

  test('GET /api/docentes - Obtener lista de docentes', async () => {
    const response = await request(app)
      .get('/api/docentes')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data.docentes)).toBe(true);
  });

  test('POST /api/docentes - Crear nuevo docente', async () => {
    const response = await request(app)
      .post('/api/docentes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Ana',
        apellido: 'Gómez',
        ci: '87654321',
        especialidad: 'Matemáticas',
        telefono: '70123456',
        id_usuario: 1,
        activo: true
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
