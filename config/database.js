/**
 * Configuración de Base de Datos
 * Sistema de almacenamiento basado en JSON
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Crear directorio de datos si no existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Crear archivo de usuarios si no existe
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
}

/**
 * Leer todos los usuarios
 */
const getUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data).users;
    } catch (error) {
        console.error('Error al leer usuarios:', error);
        return [];
    }
};

/**
 * Guardar usuarios
 */
const saveUsers = (users) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
        return true;
    } catch (error) {
        console.error('Error al guardar usuarios:', error);
        return false;
    }
};

/**
 * Buscar usuario por email
 */
const findUserByEmail = (email) => {
    const users = getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

/**
 * Buscar usuario por ID
 */
const findUserById = (id) => {
    const users = getUsers();
    return users.find(user => user.id === id);
};

/**
 * Crear nuevo usuario
 */
const createUser = (userData) => {
    const users = getUsers();
    users.push(userData);
    return saveUsers(users);
};

/**
 * Actualizar usuario
 */
const updateUser = (id, updateData) => {
    const users = getUsers();
    const index = users.findIndex(user => user.id === id);

    if (index === -1) return false;

    users[index] = { ...users[index], ...updateData };
    return saveUsers(users);
};

/**
 * Eliminar usuario
 */
const deleteUser = (id) => {
    const users = getUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    return saveUsers(filteredUsers);
};

module.exports = {
    getUsers,
    saveUsers,
    findUserByEmail,
    findUserById,
    createUser,
    updateUser,
    deleteUser
};
