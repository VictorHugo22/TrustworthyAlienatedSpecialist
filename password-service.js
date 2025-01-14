const express = require('express');
const app = express();
const PORT = 3001;

// Middleware para parsear JSON
app.use(express.json());

// Ruta para validar contraseñas
app.post('/validate-password', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: 'Se requiere una contraseña.' });
    }

    // Validar la contraseña
    const isValid = validatePassword(password);

    res.json({
        success: true,
        password,
        isValid,
        message: isValid ? 'Contraseña válida.' : 'Contraseña inválida: debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.',
    });
});

// Función de validación de contraseñas
function validatePassword(password) {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

// Iniciar el servidor del microservicio
app.listen(PORT, () => {
    console.log(`Microservicio de validación de contraseñas escuchando en el puerto ${PORT}`);
});
