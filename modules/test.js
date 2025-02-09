import StorageManager from '../utils.js';
import FolderManager from './FolderManager.js';
import FileManager from './FileManager.js';

// Configuración inicial
const storage = new StorageManager('servers.json', './servers');
const folderManager = new FolderManager('./servers');
const fileManager = new FileManager('./servers');

// Ejemplo: Crear una carpeta
const newFolderName = 'nueva_carpeta';
try {
  const folderDetails = folderManager.createFolder(newFolderName);
  console.log(`Carpeta creada: ${folderDetails.path}`);

  // Guardar detalles de la carpeta en el StorageManager
  storage.JSONset(newFolderName, folderDetails);
  console.log(`Detalles de la carpeta guardados en servers.json`);
} catch (error) {
  console.error(error.message);
}

// Ejemplo: Crear un archivo dentro de la nueva carpeta
const newFileName = 'archivo_ejemplo.json';
try {
  const filePath = fileManager.createFile(newFolderName, newFileName, JSON.stringify({ key: 'value' }));
  console.log(`Archivo creado: ${filePath}`);

  // Actualizar los detalles de la carpeta en el StorageManager
  const folderDetails = storage.JSONget(newFolderName);
  folderDetails.files.push(newFileName); // Agregar el nuevo archivo a la lista
  storage.JSONset(newFolderName, folderDetails);

  console.log(`Detalles de la carpeta actualizados en servers.json`);
} catch (error) {
  console.error(error.message);
}

// Ejemplo: Listar archivos en la carpeta
try {
  const files = fileManager.listFiles(newFolderName);
  console.log(`Archivos en la carpeta '${newFolderName}':`, files);
} catch (error) {
  console.error(error.message);
}