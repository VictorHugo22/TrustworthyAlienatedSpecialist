const mongoose = require('mongoose');

// Define el esquema de usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  confirmationToken: { type: String }, // Campo para el token de confirmación
  isConfirmed: { type: Boolean, default: false },
  resetToken: { type: String },
  resetTokenExpires: { type: Date }
});

// Exporta el modelo User
const User = mongoose.model('User', userSchema);
module.exports = User;
