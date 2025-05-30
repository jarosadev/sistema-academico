const request = require('supertest');
const app = require('../test-server');

describe('Pruebas de auditoría', () => {
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

  test('GET /api/auditoria/logs - Obtener registros de auditoría', async () => {
    const response = await request(app)
      .get('/api/auditoria/logs')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
