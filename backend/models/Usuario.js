const { executeQuery, executeTransaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const { authConfig } = require('../config/auth');
const { createError } = require('../middleware/errorHandler');
const { HTTP_STATUS, MENSAJES_ERROR } = require('../config/constants');

class Usuario {
    constructor(data) {
        this.id_usuario = data.id_usuario;
        this.correo = data.correo;
        this.password = data.password;
        this.activo = data.activo;
        this.ultimo_acceso = data.ultimo_acceso;
        this.intentos_fallidos = data.intentos_fallidos;
        this.bloqueado_hasta = data.bloqueado_hasta;
        this.token_recuperacion = data.token_recuperacion;
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
        this.roles = data.roles || [];
    }

    // Crear nuevo usuario
    static async create(userData) {
        try {
            // Verificar si el correo ya existe
            const existingUser = await this.findByEmail(userData.correo);
            if (existingUser) {
                throw createError(
                    'El correo electrónico ya está registrado',
                    HTTP_STATUS.CONFLICT,
                    'EMAIL_EXISTS'
                );
            }

            // Hashear contraseña
            const hashedPassword = await bcrypt.hash(userData.password, authConfig.bcryptRounds);

            // Crear usuario en transacción
            const queries = [
                {
                    query: 'INSERT INTO usuarios (correo, password) VALUES (?, ?)',
                    params: [userData.correo, hashedPassword]
                }
            ];

            // Si se proporcionan roles, agregarlos
            if (userData.roles && userData.roles.length > 0) {
                for (const roleId of userData.roles) {
                    queries.push({
                        query: 'INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (LAST_INSERT_ID(), ?)',
                        params: [roleId]
                    });
                }
            }

            const results = await executeTransaction(queries);
            const userId = results[0].insertId;

            return await this.findById(userId);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw createError(
                    'El correo electrónico ya está registrado',
                    HTTP_STATUS.CONFLICT,
                    'EMAIL_EXISTS'
                );
            }
            throw error;
        }
    }

    // Buscar usuario por ID con roles
    static async findById(id) {
        try {
            const query = `
                SELECT 
                    u.*,
                    JSON_ARRAYAGG(
                        CASE 
                            WHEN r.id_rol IS NOT NULL THEN
                                JSON_OBJECT(
                                    'id_rol', r.id_rol,
                                    'nombre', r.nombre,
                                    'descripcion', r.descripcion,
                                    'permisos', r.permisos
                                )
                            ELSE NULL
                        END
                    ) as roles
                FROM usuarios u
                LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
                LEFT JOIN roles r ON ur.id_rol = r.id_rol AND r.activo = TRUE
                WHERE u.id_usuario = ?
                GROUP BY u.id_usuario
            `;

            const results = await executeQuery(query, [id]);
            
            if (results.length === 0) {
                return null;
            }

            const userData = results[0];
            
            // Parsear roles si vienen como string
            if (typeof userData.roles === 'string') {
                userData.roles = JSON.parse(userData.roles);
            }
            
            // Filtrar roles nulos
            userData.roles = userData.roles.filter(role => role !== null);

            return new Usuario(userData);
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuario por correo electrónico
    static async findByEmail(email) {
        try {
            const query = `
                SELECT 
                    u.*,
                    JSON_ARRAYAGG(
                        CASE 
                            WHEN r.id_rol IS NOT NULL THEN
                                JSON_OBJECT(
                                    'id_rol', r.id_rol,
                                    'nombre', r.nombre,
                                    'descripcion', r.descripcion,
                                    'permisos', r.permisos
                                )
                            ELSE NULL
                        END
                    ) as roles
                FROM usuarios u
                LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
                LEFT JOIN roles r ON ur.id_rol = r.id_rol AND r.activo = TRUE
                WHERE u.correo = ?
                GROUP BY u.id_usuario
            `;

            const results = await executeQuery(query, [email]);
            
            if (results.length === 0) {
                return null;
            }

            const userData = results[0];
            
            // Parsear roles si vienen como string
            if (typeof userData.roles === 'string') {
                userData.roles = JSON.parse(userData.roles);
            }
            
            // Filtrar roles nulos
            userData.roles = userData.roles.filter(role => role !== null);

            return new Usuario(userData);
        } catch (error) {
            throw error;
        }
    }

    // Obtener todos los usuarios con paginación
    static async findAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                activo = null,
                sort = 'asc'
            } = options;

            const offset = (page - 1) * limit;
            let whereClause = 'WHERE 1=1';
            const params = [];

            // Filtro de búsqueda
            if (search) {
                whereClause += ' AND u.correo LIKE ?';
                params.push(`%${search}%`);
            }

            // Filtro por estado activo
            if (activo !== null) {
                whereClause += ' AND u.activo = ?';
                params.push(activo);
            }

            // Consulta principal
            const query = `
                SELECT 
                    u.*,
                    JSON_ARRAYAGG(
                        CASE 
                            WHEN r.id_rol IS NOT NULL THEN
                                JSON_OBJECT(
                                    'id_rol', r.id_rol,
                                    'nombre', r.nombre,
                                    'descripcion', r.descripcion
                                )
                            ELSE NULL
                        END
                    ) as roles
                FROM usuarios u
                LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
                LEFT JOIN roles r ON ur.id_rol = r.id_rol AND r.activo = TRUE
                ${whereClause}
                GROUP BY u.id_usuario
                ORDER BY u.correo ${sort.toUpperCase()}
                LIMIT ? OFFSET ?
            `;

            params.push(limit, offset);
            const results = await executeQuery(query, params);

            // Consulta para contar total
            const countQuery = `
                SELECT COUNT(DISTINCT u.id_usuario) as total
                FROM usuarios u
                ${whereClause}
            `;

            const countParams = params.slice(0, -2); // Remover limit y offset
            const countResults = await executeQuery(countQuery, countParams);
            const total = countResults[0].total;

            // Procesar resultados
            const usuarios = results.map(userData => {
                // Parsear roles si vienen como string
                if (typeof userData.roles === 'string') {
                    userData.roles = JSON.parse(userData.roles);
                }
                
                // Filtrar roles nulos
                userData.roles = userData.roles.filter(role => role !== null);
                
                return new Usuario(userData);
            });

            return {
                usuarios,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Actualizar usuario
    static async update(id, updateData) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw createError(
                    'Usuario no encontrado',
                    HTTP_STATUS.NOT_FOUND,
                    'USER_NOT_FOUND'
                );
            }

            const allowedFields = ['activo'];
            const updates = [];
            const params = [];

            // Construir consulta de actualización
            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = ?`);
                    params.push(value);
                }
            }

            if (updates.length === 0) {
                throw createError(
                    'No hay campos válidos para actualizar',
                    HTTP_STATUS.BAD_REQUEST,
                    'NO_VALID_FIELDS'
                );
            }

            params.push(id);
            const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`;
            
            await executeQuery(query, params);
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    // Actualizar contraseña
    static async updatePassword(id, currentPassword, newPassword) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw createError(
                    'Usuario no encontrado',
                    HTTP_STATUS.NOT_FOUND,
                    'USER_NOT_FOUND'
                );
            }

            // Verificar contraseña actual
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                throw createError(
                    'Contraseña actual incorrecta',
                    HTTP_STATUS.BAD_REQUEST,
                    'INVALID_CURRENT_PASSWORD'
                );
            }

            // Hashear nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, authConfig.bcryptRounds);

            const query = 'UPDATE usuarios SET password = ? WHERE id_usuario = ?';
            await executeQuery(query, [hashedPassword, id]);

            return { message: 'Contraseña actualizada exitosamente' };
        } catch (error) {
            throw error;
        }
    }

    // Verificar contraseña
    async verifyPassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    // Incrementar intentos fallidos
    static async incrementFailedAttempts(id) {
        try {
            const query = `
                UPDATE usuarios 
                SET intentos_fallidos = intentos_fallidos + 1,
                    bloqueado_hasta = CASE 
                        WHEN intentos_fallidos + 1 >= ? THEN DATE_ADD(NOW(), INTERVAL ? MINUTE)
                        ELSE bloqueado_hasta
                    END
                WHERE id_usuario = ?
            `;
            
            await executeQuery(query, [
                authConfig.maxLoginAttempts,
                authConfig.lockoutTime,
                id
            ]);
        } catch (error) {
            throw error;
        }
    }

    // Resetear intentos fallidos
    static async resetFailedAttempts(id) {
        try {
            const query = `
                UPDATE usuarios 
                SET intentos_fallidos = 0, bloqueado_hasta = NULL 
                WHERE id_usuario = ?
            `;
            
            await executeQuery(query, [id]);
        } catch (error) {
            throw error;
        }
    }

    // Asignar roles a usuario
    static async assignRoles(userId, roleIds) {
        try {
            const queries = [
                {
                    query: 'DELETE FROM usuario_roles WHERE id_usuario = ?',
                    params: [userId]
                }
            ];

            // Agregar nuevos roles
            for (const roleId of roleIds) {
                queries.push({
                    query: 'INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?)',
                    params: [userId, roleId]
                });
            }

            await executeTransaction(queries);
            return await this.findById(userId);
        } catch (error) {
            throw error;
        }
    }

    // Eliminar usuario (soft delete)
    static async delete(id) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw createError(
                    'Usuario no encontrado',
                    HTTP_STATUS.NOT_FOUND,
                    'USER_NOT_FOUND'
                );
            }

            const query = 'UPDATE usuarios SET activo = FALSE WHERE id_usuario = ?';
            await executeQuery(query, [id]);

            return { message: 'Usuario desactivado exitosamente' };
        } catch (error) {
            throw error;
        }
    }

    // Método para serializar (excluir contraseña)
    toJSON() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
}

module.exports = Usuario;
