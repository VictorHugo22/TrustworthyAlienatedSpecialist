const express = require("express");
const bodyParser = require("body-parser");
const User = require("./models/User"); 
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt"); // Para encriptar la nueva contraseña
const axios = require("axios");

const app = express();

// Middleware para servir archivos estáticos desde la raíz
app.use(express.static(__dirname)); // Para servir archivos estáticos
app.use(express.json()); // Para procesar JSON en el cuerpo de la solicitud
app.use(express.urlencoded({ extended: true })); // Para procesar datos del formulario

const mongoose = require("mongoose");

const mySecret = process.env['MONGODB_URI'];;

mongoose
  .connect(mySecret)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.log("Error de conexión a MongoDB Atlas", err));

// Rutas
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html"); // Sirve la página de inicio
});

app.get("/register.html", (req, res) => {
  res.sendFile(__dirname + "/register.html"); // Sirve la página de registro
});

app.get("/reset-password.html", (req, res) => {
  res.sendFile(__dirname + "/reset-password.html"); // Sirve la página para restablecer la contraseña
});

app.get("/change-password.html", (req, res) => {
  res.sendFile(__dirname + "/change-password.html"); // Sirve la página para cambiar la contraseña
});

app.get("/welcome.html", (req, res) => {
  res.sendFile(__dirname + "/welcome.html"); // Sirve la página de bienvenida
});

// Función para enmascarar parte del correo
const maskEmail = (email) => {
  const [localPart, domain] = email.split("@");
  const maskedLocalPart = `${localPart.charAt(0)}****${localPart.charAt(localPart.length - 1)}`;
  return `${maskedLocalPart}@${domain}`;
};

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validar la contraseña con el microservicio antes de procesar el registro
    const response = await axios.post('https://password-validation-service.onrender.com/validate-password', { password });

    // Si la contraseña no es válida, devolver el mensaje del microservicio
    if (!response.data.valid) {
      return res.status(400).send(response.data.message);
    }
    
    // Validar si ya existe un usuario con el mismo correo
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Este correo ya está registrado.");
    }
    // Validar si ya existe un usuario con el mismo nombre de usuario
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).send("Este nombre de usuario ya está registrado.");
    }

    // Cifrar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar un token de verificación
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = Date.now() + 3600000;

    // Crear un nuevo usuario 
    const newUser = new User({
      username,
      email,
      password: hashedPassword, // Guarda el hash en lugar de la contraseña en texto plano
      verified: false,
      verificationToken,
      verificationTokenExpires,
    });

    // Guardar el usuario en la base de datos
    await newUser.save();

    // Configuración de Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env['GMAIL_USER'], 
        pass: process.env['GMAIL_PASS'], 
      },
    });

    const verificationLink = `https://login-cfd7.onrender.com/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Verifica tu cuenta",
      text: `Hola ${username},\n\nPor favor verifica tu cuenta haciendo clic en el siguiente enlace:\n\n${verificationLink}\n\nEste enlace expirará en 1 hora.`,
    };

    

    // Enviar el correo
    await transporter.sendMail(mailOptions);
    res.send("Registro exitoso. Para finalizar tu registro, te enviamos un enlace a tu correo electrónico.");
  } catch (err) {
    console.error("Error al registrar usuario:", err);
    res
      .status(500)
      .send("No se pudo completar el registro. Inténtalo de nuevo.");
  }
});


app.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).send("Enlace inválido o expirado.");

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.send("¡Cuenta verificada exitosamente! Ahora puedes iniciar sesión.");
  } catch (err) {
    console.error("Error al verificar correo:", err);
    res.status(500).send("Error interno al verificar tu cuenta.");
  }
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Usuario no encontrado." });
    if (!user.verified) return res.status(400).json({ error: "Verifica tu cuenta antes de iniciar sesión." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Contraseña incorrecta." });

    res.redirect(`/welcome.html?username=${encodeURIComponent(user.username)}`);
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error interno al iniciar sesión." });
  }
});

app.post("/reset-password", async (req, res) => {
  const { username } = req.body;

  try {
    // Buscar el usuario por nombre de usuario
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "Usuario no encontrado." });
    }

    // Crear un token de restablecimiento 
    const resetToken = crypto.randomBytes(20).toString("hex"); // Genera un token aleatorio
    const resetLink = `https://login-cfd7.onrender.com/change-password.html?token=${resetToken}`; // URL con el token

    //Se guardaría el token en la base de datos 

    user.resetToken = resetToken; // Guardar el token en la base de datos
    user.resetTokenExpires = Date.now() + 3600000; // 1 hora de validez
    await user.save();

    // Configuración del correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env['GMAIL_USER'], 
        pass: process.env['GMAIL_PASS'], 
      },
    });

    // Configurar el correo
    const mailOptions = {
      from: "cryto3257@gmail.com",
      to: user.email, // Correo del usuario registrado
      subject: "Restablece tu contraseña",
      text: `Hola ${user.username},\n\nHemos recibido una solicitud para restablecer tu contraseña. Puedes hacerlo a través del siguiente enlace: \n\n${resetLink}\n\nSi no has solicitado este cambio, por favor ignora este correo.`,
    };

    // Enviar el correo con el enlace de restablecimiento
    await transporter.sendMail(mailOptions);

    // Responder con un mensaje de éxito
    res
      .status(200)
      .json({
        message: `Hemos enviado una liga a tu correo ${maskEmail(user.email)}`,
      });
  } catch (err) {
    console.error("Error al procesar el restablecimiento:", err);
    res
      .status(500)
      .json({ error: "Ocurrió un error al procesar tu solicitud." });
  }
});

// Ruta para cambiar la contraseña
app.post("/change-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    console.log("Token recibido:", token); // Log para depurar el token recibido**
    // Buscar al usuario con el token proporcionado
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }, // Comprueba que el token no haya expirado
    });

    console.log("Usuario encontrado:", user); // Log para confirmar si se encontró el usuario ***

    if (!user) {
      return res.status(400).json({ error: "Token inválido o expirado." });
    }

    console.log("ResetTokenExpires:", user.resetTokenExpires); // Log para depurar el tiempo de expiración*****
    console.log("Fecha actual:", Date.now()); // Log para comparar con la expiración****

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña del usuario
    user.password = hashedPassword;

    // Eliminar el token para que no pueda ser reutilizado
    user.resetToken = undefined;
    await user.save();

    // Configuración del correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env['GMAIL_USER'],
        pass: process.env['GMAIL_PASS'],
      },
    });

    // Configurar el correo
    const mailOptions = {
      from: "cryto3257@gmail.com",
      to: user.email,
      subject: "Cambio de contraseña exitoso",
      text: `Hola ${user.username},\n\nTu contraseña ha sido restablecida correctamente. Si no realizaste esta acción, contacta con nosotros inmediatamente.`,
    };

    // Enviar el correo de confirmación
    await transporter.sendMail(mailOptions);

    // Responder con un mensaje de éxito
    res
      .status(200)
      .json({
        message:
          "Contraseña actualizada correctamente. Se ha enviado un correo de confirmación.",
      });
  } catch (err) {
    console.error("Error al cambiar la contraseña:", err);
    res
      .status(500)
      .json({ error: "Ocurrió un error al procesar tu solicitud." });
  }
});



// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
