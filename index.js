import express from 'express';
import authRouter from './authRouter.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rutas de autenticación
app.use('/auth', authRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de autenticación funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
