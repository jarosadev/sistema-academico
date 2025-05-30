const request = require('supertest');
const app = require('../test-server');

describe('Pruebas de menciones', () => {
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

  test('GET /api/menciones - Obtener lista de menciones', async () => {
    const response = await request(app)
      .get('/api/menciones')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/menciones - Crear nueva mención', async () => {
    const response = await request(app)
      .post('/api/menciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Mención de prueba',
        descripcion: 'Descripción de prueba',
        materias_requeridas: 5
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
