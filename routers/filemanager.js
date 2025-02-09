import FileManager from '../modules/FileManager.js';

// Crear una instancia de FileManager
const fileManager = new FileManager('./servers');

// Crear una subcarpeta
fileManager.createSubfolder('logs');
fileManager.createSubfolder('config');

// Crear archivos con extensiones permitidas
fileManager.createFile('config/server.properties', 'port=8080\nhost=localhost');
fileManager.createFile('logs/error.log', 'Error: Something went wrong');
fileManager.createFile('data.json', JSON.stringify({ key: 'value' }));

// Actualizar el tamaño de una carpeta
fileManager.updateFolderSize('logs');

// Listar contenidos
console.log(fileManager.listContents());

// Eliminar un archivo o carpeta
fileManager.deleteItem('logs/error.log');
fileManager.deleteItem('config');