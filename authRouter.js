import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import StorageManager from './utils.js';

const router = express.Router();
const JWT_SECRET = 'YOUR_TOKEN_HERE';
const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};
const storage = new StorageManager('usuarios.json', './data');
const configStorage = new StorageManager('access-config.json', './data');
let accessControl = configStorage.JSONget('accessControl');
const saveAccessControl = () => {
  configStorage.JSONset('accessControl', accessControl);
};

if (!accessControl || isEmptyObject(accessControl)) {
  accessControl = {
    globalAccessEnabled: false,
    timePermissions: {},
    temporaryAccess: {}
  };
  // Guardar las opciones predeterminadas en el archivo
  saveAccessControl();
}

// Replace the global variable with a getter/setter
const getGlobalAccessEnabled = () => accessControl.globalAccessEnabled;
const setGlobalAccessEnabled = (value) => {
  accessControl.globalAccessEnabled = value;
  saveAccessControl();
};

// Middleware para verificar el token JWT en rutas protegidas.
export const verifyToken = (req, res, next) => {
  // If global access is enabled, skip token verification
  if (!getGlobalAccessEnabled()) {
    req.user = { globalAccess: true };
    return next();
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No se proporcionó token' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'El token no es válido o ha expirado' });
    }

    // Check time-based access
    const username = decoded.username;
    const now = new Date();

    // Check timed access
    const timedAccess = accessControl.timePermissions[username];
    if (timedAccess && new Date(timedAccess.expiresAt) < now) {
      delete accessControl.timePermissions[username];
      return res.status(403).json({ error: 'Timed access has expired' });
    }

    // Check temporary access
    const tempAccess = accessControl.temporaryAccess[username];
    if (tempAccess && new Date(tempAccess.expiresAt) < now) {
      delete accessControl.temporaryAccess[username];
      return res.status(403).json({ error: 'Temporary access has expired' });
    }

    req.user = decoded;
    next();
  });
};
let userpermissions = [
  "accounts",
  "file_manager",
  "manage_servers",
  "making_servers",
  "monitor_servers",
  "manage_java",
  "manage_plugins",
  "system_monitoring",
  "system_settings"
]
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  console.log(username, email, password);

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'El username, email y la contraseña son obligatorios' });
  }

  const users = storage.JSONget('users') || {};

  if (users[username]) {
    return res.status(400).json({ error: 'El username ya existe' });
  }

  const emailExistente = Object.values(users).find(user => user.email === email);
  if (emailExistente) {
    return res.status(400).json({ error: 'El email ya está en uso' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = { username, email, password: hashedPassword, permissions: userpermissions };
    storage.JSONset('users', users);
    return res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  console.log(login, password);
  if (!login || !password) {
    return res.status(400).json({ error: 'El login y la contraseña son obligatorios' });
  }

  const users = storage.JSONget('users') || {};
  let user = users[login];
  if (!user) {
    user = Object.values(users).find(u => u.email === login);
  }

  if (!user) {
    return res.status(400).json({ error: 'El usuario no existe' });
  }

  try {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ message: 'Login exitoso', token });
  } catch (error) {
    return res.status(500).json({ error: 'Error durante el proceso de autenticación' });
  }
});

router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: 'Ruta protegida: Perfil de usuario', user: req.user });
});
// Enable/disable global access
router.post('/system/access', verifyToken, (req, res) => {
  const { enabled } = req.body;
  setGlobalAccessEnabled(enabled);
  return res.json({ message: `Global access ${enabled ? 'enabled' : 'disabled'}` });
});
//configStorage.JSONget('accessControl')
router.get('/system/accessInfo', verifyToken, (req, res) => {
  const accessControl = configStorage.JSONget('accessControl') || {};
  return res.json(accessControl);
})
// Set timed access for a user
router.post('/access/timed', verifyToken, (req, res) => {
  const { username, duration } = req.body; // duration in minutes
  if (!username || !duration) {
    return res.status(400).json({ error: 'Username and duration are required' });
  }

  const users = storage.JSONget('users') || {};
  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + duration);
  
  accessControl.timePermissions[username] = {
    expiresAt: expiresAt.toISOString(),
    duration
  };
  saveAccessControl();

  return res.json({ 
    message: 'Timed access granted', 
    username, 
    expiresAt: expiresAt.toISOString() 
  });
});

// Grant temporary access
router.post('/access/temporary', verifyToken, (req, res) => {
  const { username, until } = req.body; // until should be an ISO date string
  if (!username || !until) {
    return res.status(400).json({ error: 'Username and expiration date are required' });
  }

  const users = storage.JSONget('users') || {};
  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }

  accessControl.temporaryAccess[username] = {
    expiresAt: until
  };
  saveAccessControl();

  return res.json({ 
    message: 'Temporary access granted', 
    username, 
    expiresAt: until 
  });
});

// Remove user access
router.delete('/access/:username', verifyToken, (req, res) => {
  const { username } = req.params;
  
  delete accessControl.timePermissions[username];
  delete accessControl.temporaryAccess[username];
  saveAccessControl();

  return res.json({ message: 'Access removed for user', username });
});

router.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'El nombre de usuario, la contraseña actual y la nueva contraseña son obligatorios' });
  }

  const users = storage.JSONget('users') || {};
  const user = users[username];

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  try {
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    users[username] = user;
    storage.JSONset('users', users);

    return res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});
// Get user access status
router.get('/access/:username', verifyToken, (req, res) => {
  const { username } = req.params;
  
  const accessStatus = {
    username,
    hasTimedAccess: !!accessControl.timePermissions[username],
    hasTemporaryAccess: !!accessControl.temporaryAccess[username],
    timedAccessExpiry: accessControl.timePermissions[username]?.expiresAt,
    temporaryAccessExpiry: accessControl.temporaryAccess[username]?.expiresAt
  };

  return res.json(accessStatus);
});
router.delete('/delete-account', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'El nombre de usuario y la contraseña son obligatorios' });
  }

  const users = storage.JSONget('users') || {};
  const user = users[username];

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  try {
    // Verificar que la contraseña sea correcta
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Eliminar la cuenta del usuario
    delete users[username];
    storage.JSONset('users', users);

    return res.status(200).json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});
export default router;
