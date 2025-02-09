import fs from 'fs';
import path from 'path';

export default class FolderManager {
  constructor(basePath = '.') {
    this.basePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  // Crear una nueva subcarpeta
  createFolder(folderName) {
    const folderPath = path.join(this.basePath, folderName);
    if (fs.existsSync(folderPath)) {
      throw new Error(`La carpeta '${folderName}' ya existe.`);
    }
    fs.mkdirSync(folderPath, { recursive: true });

    // Devolver detalles de la carpeta
    return {
      name: folderName,
      path: folderPath,
      size: this.getFolderSize(folderPath),
      files: this.listFilesInFolder(folderPath),
    };
  }

  // Obtener el tamaño de una carpeta (en bytes)
  getFolderSize(folderPath) {
    const stats = fs.statSync(folderPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(folderPath);
      return files.reduce((total, file) => {
        const filePath = path.join(folderPath, file);
        const fileStats = fs.statSync(filePath);
        return total + (fileStats.isDirectory() ? this.getFolderSize(filePath) : fileStats.size);
      }, 0);
    }
    return stats.size;
  }

  // Listar todas las subcarpetas en la ruta base
  listFolders() {
    return fs.readdirSync(this.basePath).filter((item) => {
      const itemPath = path.join(this.basePath, item);
      return fs.statSync(itemPath).isDirectory();
    });
  }

  // Listar archivos dentro de una carpeta específica
  listFilesInFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    return fs.readdirSync(folderPath).filter((item) => {
      const itemPath = path.join(folderPath, item);
      return fs.statSync(itemPath).isFile();
    });
  }
}