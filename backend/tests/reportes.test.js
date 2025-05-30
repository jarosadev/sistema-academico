const request = require('supertest');
const app = require('../test-server');

describe('Pruebas de reportes', () => {
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

  test('GET /api/reportes/general - Obtener reporte general', async () => {
    const response = await request(app)
      .get('/api/reportes/general')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
