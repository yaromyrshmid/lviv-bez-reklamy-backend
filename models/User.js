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
  emailConfirmed: {
    type: Boolean,
    required: true,
    default: false
  },
  emailConfirmationToken: {
    token: {
      type: String
    },
    expiration: { type: Date }
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
