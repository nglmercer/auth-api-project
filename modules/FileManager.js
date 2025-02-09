import fs from 'fs';
import path from 'path';

const ALLOWED_EXTENSIONS = ['json', 'yaml', 'txt', 'properties'];

export default class FileManager {
  constructor(basePath = '.') {
    this.basePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  // Validar si la extensión es permitida
  _isValidExtension(extension) {
    return ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
  }

  // Crear un archivo en una carpeta específica
  createFile(folderName, fileName, content = '') {
    const folderPath = path.join(this.basePath, folderName);

    // Crear la carpeta si no existe
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const ext = path.extname(fileName).slice(1); // Obtener la extensión sin el punto
    if (!this._isValidExtension(ext)) {
      throw new Error(`Extensión no permitida. Extensiones válidas: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    const filePath = path.join(folderPath, fileName);
    if (fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' ya existe en la carpeta '${folderName}'.`);
    }

    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    return filePath;
  }

  // Leer el contenido de un archivo en una carpeta específica
  readFile(folderName, fileName) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }

    return fs.readFileSync(filePath, { encoding: 'utf8' });
  }

  // Escribir/Actualizar el contenido de un archivo en una carpeta específica
  writeFile(folderName, fileName, content) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }

    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  }

  // Eliminar un archivo en una carpeta específica
  deleteFile(folderName, fileName) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }

    fs.unlinkSync(filePath);
  }

  // Listar todos los archivos en una carpeta específica
  listFiles(folderName) {
    const folderPath = path.join(this.basePath, folderName);

    if (!fs.existsSync(folderPath)) {
      throw new Error(`La carpeta '${folderName}' no existe.`);
    }

    return fs.readdirSync(folderPath).filter((item) => {
      const itemPath = path.join(folderPath, item);
      return fs.statSync(itemPath).isFile();
    });
  }
}