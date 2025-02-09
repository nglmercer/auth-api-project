import express from 'express';
import { resolve, normalize, join, basename } from 'path';
import { stat, readdir } from 'fs/promises';

const router = express.Router();

// Ruta base donde están los archivos (asegúrate de que esta ruta sea segura)
const BASE_DIR = resolve(import.meta.dirname, 'servers');

// Middleware para verificar si el usuario tiene acceso seguro a la carpeta
function securePathMiddleware(req, res, next) {
    const requestedPath = normalize(req.params.path || '');
    const fullPath = join(BASE_DIR, requestedPath);

    // Verificar que el fullPath esté dentro de BASE_DIR
    if (!fullPath.startsWith(BASE_DIR)) {
        return res.status(403).json({ error: 'Acceso denegado: Intento de acceso fuera de la carpeta permitida.' });
    }

    req.fullPath = fullPath; // Guardar la ruta completa para usarla en las rutas
    next();
}

// Ruta para obtener información de los archivos en la carpeta
router.get('/info/:path(*)', securePathMiddleware, async (req, res) => {
    const { fullPath } = req;

    try {
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
            // Si es una carpeta, listar su contenido
            const files = await readdir(fullPath);
            const fileList = await Promise.all(
                files.map(async (file) => {
                    const filePath = join(fullPath, file);
                    const fileStats = await stat(filePath);
                    return {
                        name: file,
                        isDirectory: fileStats.isDirectory(),
                        size: fileStats.size,
                        modified: fileStats.mtime,
                    };
                })
            );

            res.json({ directory: req.params.path || '/', files: fileList });
        } else {
            // Si es un archivo, devolver su información
            res.json({
                name: basename(fullPath),
                size: stats.size,
                modified: stats.mtime,
                isDirectory: false,
            });
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ error: 'Archivo o carpeta no encontrado.' });
        }
        return res.status(500).json({ error: 'Error al acceder al archivo o carpeta.' });
    }
});

// Ruta para descargar un archivo específico
router.get('/download/:path(*)', securePathMiddleware, async (req, res) => {
    const { fullPath } = req;

    try {
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
            return res.status(400).json({ error: 'No se puede descargar una carpeta.' });
        }

        // Forzar la descarga del archivo
        res.download(fullPath, (err) => {
            if (err) {
                res.status(500).json({ error: 'Error al descargar el archivo.' });
            }
        });
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ error: 'Archivo no encontrado.' });
        }
        return res.status(500).json({ error: 'Error al acceder al archivo.' });
    }
});

export default router;