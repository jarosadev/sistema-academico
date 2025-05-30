const request = require('supertest');
const app = require('../test-server');

describe('Pruebas de estudiantes', () => {
  let token = '';
  const uniqueCI = `${Date.now()}`.substring(0, 8);

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

  test('GET /api/estudiantes - Obtener lista de estudiantes', async () => {
    const response = await request(app)
      .get('/api/estudiantes')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/estudiantes - Crear nuevo estudiante', async () => {
    const response = await request(app)
      .post('/api/estudiantes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Juan',
        apellido: 'Pérez',
        ci: uniqueCI,
        fecha_nacimiento: '2000-01-01',
        direccion: 'Calle Falsa 123',
        telefono: '70123456',
        correo: 'juan.perez@example.com',
        password: 'TestPassword123!',
        id_mencion: 1,
        estado_academico: 'activo'
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });

});
