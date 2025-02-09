import express from 'express';
import authRouter from './authRouter.js';
import path from 'path'; // Importa el módulo path para manejar rutas de archivos
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
// Asegúrate de que la carpeta 'public' exista en el mismo directorio que este archivo
const publicPath = path.join(process.cwd(), 'public'); // Obtiene la ruta absoluta de la carpeta 'public'
app.use(express.static(publicPath));

// Rutas de autenticación
app.use('/auth', authRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de autenticación funcionando' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});