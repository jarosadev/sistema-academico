const request = require('supertest');
const app = require('../test-server');

describe('Pruebas de autenticación', () => {
  let token = '';
  const uniqueEmail = `testuser_${Date.now()}@example.com`;

  test('POST /api/auth/register - Registrar nuevo usuario', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        correo: uniqueEmail,
        password: 'TestPassword123!',
        roles: [1]
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('POST /api/auth/register - Error al registrar usuario con correo duplicado', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        correo: uniqueEmail,
        password: 'TestPassword123!',
        roles: [1]
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/auth/register - Error al registrar usuario con datos inválidos', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        correo: 'invalid-email',
        password: '123',
        roles: []
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/auth/login - Login con usuario registrado', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        correo: uniqueEmail,
        password: 'TestPassword123!'
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tokens.access_token).toBeDefined();
    token = response.body.data.tokens.access_token;
  });

  test('POST /api/auth/login - Error con credenciales inválidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        correo: uniqueEmail,
        password: 'WrongPassword123!'
      });
    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/auth/profile - Obtener perfil con token válido', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.usuario.correo).toBe(uniqueEmail);
  });

  test('GET /api/auth/profile - Error al obtener perfil sin token', async () => {
    const response = await request(app)
      .get('/api/auth/profile');
    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/auth/profile - Error al obtener perfil con token inválido', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
