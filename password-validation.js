
const minLengthRegex = /.{8,}/; // Al menos 8 caracteres
const uppercaseRegex = /[A-Z]/; 
const lowercaseRegex = /[a-z]/; 
const numberRegex = /\d/; 
const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/; 

// Las funciones locales de validación se han comentado porque se reemplazarán por un microservicio

/*
function checkPasswordLength(password, submitButton) {
    
    if (password.length >= 8) {
        submitButton.disabled = false; 
    } else {
        submitButton.disabled = true; 
    }
}

// Función para verificar la fortaleza de la contraseña
function checkPasswordStrength(password, strengthMessage) {
    let strength = 0;

    // Verificar las características de la contraseña
    if (minLengthRegex.test(password)) strength++;
    if (uppercaseRegex.test(password)) strength++;
    if (lowercaseRegex.test(password)) strength++;
    if (numberRegex.test(password)) strength++;
    if (symbolRegex.test(password)) strength++;

    // Actualizar el mensaje de fortaleza de la contraseña
    if (strength === 5) {
        strengthMessage.textContent = "Contraseña: Seguro";
        strengthMessage.style.color = "green";
    } else if (strength === 3 || strength === 4) {
        strengthMessage.textContent = "Contraseña: Intermedio";
        strengthMessage.style.color = "orange";
    } else {
        strengthMessage.textContent = "Contraseña: Inseguro";
        strengthMessage.style.color = "red";
    }
}

*/

// Función para manejar la validación de la contraseña y la habilitación del botón

const axios = require('axios');

async function validatePasswordWithService(password) {
    try {
        const response = await axios.post(
            'https://password-validation-service.onrender.com',
            { password },
            { timeout: 5000 } // Timeout de 5 segundos
        );
        return response.data;
    } catch (error) {
        console.error('Error connecting to validation service:', error.message);
        return { isValid: false, errors: ['Unable to validate password at this time. Please try again later.'] };
    }
}

/*
function validatePasswordInput(passwordInput, submitButton, strengthMessage) {
    passwordInput.addEventListener('input', function() {
        const password = passwordInput.value;

        // Verifica la longitud de la contraseña y habilita/deshabilita el botón
        checkPasswordLength(password, submitButton);

        // Verifica la fortaleza de la contraseña y actualiza el mensaje
        checkPasswordStrength(password, strengthMessage);
    });
}
*/

module.exports = {
    validatePasswordWithService,
};
