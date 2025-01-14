const microserviceURL = 'https://password-validator.onrender.com/validate-password';

const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('registerForm').querySelector('button[type="submit"]');
const strengthMessage = document.getElementById('password-strength-message');

// Función para validar la contraseña usando el microservicio
async function validatePassword(password) {
    try {
        const response = await fetch(microserviceURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        if (!response.ok) {
            throw new Error('Error al conectar con el microservicio');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al validar la contraseña:', error);
        return { isValid: false, errors: ['No se pudo validar la contraseña.'] };
    }
}

// Escuchar cambios en el campo de contraseña
passwordInput.addEventListener('input', async () => {
    const password = passwordInput.value;

    // Validar la contraseña usando el microservicio
    const result = await validatePassword(password);

    // Actualizar el mensaje de fortaleza
    if (result.isValid) {
        strengthMessage.textContent = 'Contraseña válida';
        strengthMessage.style.color = 'green';
        submitButton.disabled = false;
    } else {
        strengthMessage.textContent = result.errors.join('. ');
        strengthMessage.style.color = 'red';
        submitButton.disabled = true;
    }
});



/*
const minLengthRegex = /.{8,}/; // Al menos 8 caracteres
const uppercaseRegex = /[A-Z]/; 
const lowercaseRegex = /[a-z]/; 
const numberRegex = /\d/; 
const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/; 

// Las funciones locales de validación se han comentado porque se reemplazarán por un microservicio


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
