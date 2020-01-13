const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  loginThirdParty: {
    type: Boolean,
    required: true,
    default: false
  },
  emailConfirmed: {
    type: Boolean,
    required: true,
    default: false
  },
  emailConfirmationToken: {
    type: String
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpiration: {
    type: Date
  },
  password: {
    type: String
    // required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    default: "user",
    required: true
  },
  photo: {
    type: String
  }
});

module.exports = User = mongoose.model("users", UserSchema);
