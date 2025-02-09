import path from 'path';
import StorageManager from '../utils.js';
import FolderManager from './FolderManager.js';
import FileManager from './FileManager.js';

// Configuración inicial
const storage = new StorageManager('servers.json', './servers');
const folderManager = new FolderManager('./servers');
const fileManager = new FileManager('./servers');
function createserverfolder(directoryname) {
  try {
    const folderDetails = folderManager.createFolder(directoryname);
    console.log(`Carpeta creada:`. folderDetails);
    updatefolderinfo(directoryname);
    return folderDetails;
  } catch (error) {
    return error.message;
  }
}
function createserverfile(directoryname, filename, content) {
  try {
    const filePath = fileManager.createFile(
      path.join(directoryname), // Ruta relativa a la subcarpeta
      filename,
      content
    );
    console.log(`Archivo creado: ${filePath}`);
    updatefolderinfo(directoryname);
    return filePath;
  } catch (error) {
    return error.message;
  }
}
function createsubfolder(directoryname, subfoldername) {
  try {
    const subfolderPath = path.join(directoryname, subfoldername);
    // Crear la subcarpeta y obtener detalles básicos
    const subfolderDetails = folderManager.createFolder(subfolderPath, true); // isSubFolder = true
    updatefolderinfo(directoryname);

    return subfolderDetails;
  } catch (error) {
    return error.message;
  }
}
//metodo para agregar la informacion de cada carpeta de ./servers ---> nueva_carpeta <---- nueva_carpeta/subcarpeta agregara la clave con la informacion del archivo
function updatefolderinfo(folderName) {
    if (folderName.includes("/")) {
      folderName = folderName.split("/")[0];
    }
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
/* createserverfolder("nueva_carpeta1");
createsubfolder("nueva_carpeta1", "subcarpeta");
getfolderinfo("nueva_carpeta1/subcarpeta");
createserverfile("nueva_carpeta1/subcarpeta", "server123.js", JSON.stringify({ key: 'value' })); */
export {
  createserverfolder,
  createserverfile,
  createsubfolder,
  getfolderinfo,
  updatefolderinfo
}