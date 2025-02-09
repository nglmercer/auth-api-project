import path from 'path';
import StorageManager from '../utils.js';
import FolderManager from './FolderManager.js';
import FileManager from './FileManager.js';

// Configuración inicial
const storage = new StorageManager('servers.json', './servers');
const folderManager = new FolderManager('./servers');
const fileManager = new FileManager('./servers');

// Ejemplo: Crear una carpeta principal
const mainFolderName = 'nueva_carpeta';
try {
  const folderDetails = folderManager.createFolder(mainFolderName);
  console.log(`Carpeta creada:`. folderDetails);
} catch (error) {
  console.error(error.message);
}

const subFolderName = 'subcarpeta';
try {
  const subFolderPath = path.join(mainFolderName, subFolderName);
  // Crear la subcarpeta y obtener detalles básicos
  const subFolderDetails = folderManager.createFolder(subFolderPath, true); // isSubFolder = true

  console.log(`Subcarpeta añadida a la carpeta principal en servers.json`);
} catch (error) {
  console.error(error.message);
}

// Ejemplo: Crear un archivo dentro de la subcarpeta
const newFileName = 'server123.js';
try {
  const filePath = fileManager.createFile(
    path.join(mainFolderName, subFolderName), // Ruta relativa a la subcarpeta
    newFileName,
    JSON.stringify({ key: 'value' })
  );
  console.log(`Archivo creado: ${filePath}`);

} catch (error) {
  console.error(error.message);
}
updatefolderinfo(mainFolderName);
//metodo para agregar la informacion de cada carpeta de ./servers ---> nueva_carpeta <---- nueva_carpeta/subcarpeta agregara la clave con la informacion del archivo
function updatefolderinfo(folderName) {
    try {
      const files = getfolderinfo(folderName);
      storage.JSONset(folderName, files);
    } catch (error) {
      console.error(error.message);
    }
}
function getfolderinfo(folderName) {
  try {
    const files = folderManager.getFolderDetails(folderName);
    console.log(`Archivos en la subcarpeta '${folderName}':`, files);
    return files;
  } catch (error) {
    console.error(error.message);
  }
}
getfolderinfo("nueva_carpeta/subcarpeta");