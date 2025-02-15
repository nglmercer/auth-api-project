import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

// Parámetros seguros para scrypt (ajusta según necesidades)
const SALT_LENGTH = 16; // 16 bytes (128 bits)
const KEY_LENGTH = 64;  // 64 bytes (512 bits)
const SCRYPT_PARAMS = {
  N: 16384, // Factor de costo (CPU/memoria)
  r: 8,     // Tamaño de bloque
  p: 1      // Factor de paralelización
};

// Hashear contraseña
async function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

// Comparar contraseña con hash almacenado
async function comparePassword(password, storedHash) {
  const [saltHex, derivedKeyHex] = storedHash.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const derivedKey = Buffer.from(derivedKeyHex, 'hex');
  const inputKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return timingSafeEqual(derivedKey, inputKey);
}
export {
  hashPassword,
  comparePassword
}