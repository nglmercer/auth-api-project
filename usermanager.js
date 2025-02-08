import bcrypt from 'bcrypt';
import StorageManager from './utils.js';

export default class UserManager {
  constructor() {
    this.storage = new StorageManager('usuarios.json', './data');
    this.users = this.storage.JSONget('users') || {};
  }

  // Guardar los usuarios en el archivo
  saveUsers() {
    this.storage.JSONset('users', this.users);
  }

  // Crear un nuevo usuario
  async createUser(username, email, password, permissions = [], roles = []) {
    if (!username || !email || !password) {
      throw new Error('El username, email y la contraseña son obligatorios');
    }

    if (this.users[username]) {
      throw new Error('El username ya existe');
    }

    const emailExistente = Object.values(this.users).find(user => user.email === email);
    if (emailExistente) {
      throw new Error('El email ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    this.users[username] = {
      username,
      email,
      password: hashedPassword,
      permissions,
      roles,
    };

    this.saveUsers();
    return { message: 'Usuario registrado exitosamente' };
  }

  // Eliminar un usuario
  async deleteUser(username, password) {
    if (!username || !password) {
      throw new Error('El nombre de usuario y la contraseña son obligatorios');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Contraseña incorrecta');
    }

    delete this.users[username];
    this.saveUsers();
    return { message: 'Cuenta eliminada exitosamente' };
  }

  // Cambiar la contraseña de un usuario
  async changePassword(username, currentPassword, newPassword) {
    if (!username || !currentPassword || !newPassword) {
      throw new Error('El nombre de usuario, la contraseña actual y la nueva contraseña son obligatorios');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      throw new Error('Contraseña actual incorrecta');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    this.saveUsers();
    return { message: 'Contraseña cambiada exitosamente' };
  }

  // Asignar permisos a un usuario
  assignPermissions(username, permissions) {
    if (!username || !permissions) {
      throw new Error('El nombre de usuario y los permisos son obligatorios');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.permissions = permissions;
    this.saveUsers();
    return { message: 'Permisos actualizados exitosamente' };
  }

  // Asignar roles a un usuario
  assignRoles(username, roles) {
    if (!username || !roles) {
      throw new Error('El nombre de usuario y los roles son obligatorios');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.roles = roles;
    this.saveUsers();
    return { message: 'Roles actualizados exitosamente' };
  }

  // Obtener información de un usuario
  getUser(username) {
    if (!username) {
      throw new Error('El nombre de usuario es obligatorio');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  // Obtener todos los usuarios
  getAllUsers() {
    return this.users;
  }
}
/*
import express from 'express';
import jwt from 'jsonwebtoken';
import UserManager from './UserManager.js'; // Importar la clase UserManager

const router = express.Router();
const JWT_SECRET = 'YOUR_TOKEN_HERE';
const userManager = new UserManager(); // Crear una instancia de UserManager

// Ruta para registrar un usuario
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const result = await userManager.createUser(username, email, password);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Ruta para eliminar un usuario
router.delete('/delete-account', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await userManager.deleteUser(username, password);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Ruta para cambiar la contraseña
router.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    const result = await userManager.changePassword(username, currentPassword, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Ruta para obtener todos los usuarios (solo para administradores)
router.get('/users', (req, res) => {
  try {
    const users = userManager.getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
*/