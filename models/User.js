const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema(
  {
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
    photoURL: {
      type: String
    },
    photoBuffered: {
      type: Buffer
    },
    photoType: {
      type: String
    },
    silver: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { toJSON: { virtuals: true } }
);

UserSchema.virtual("photo").get(function() {
  if (this.photoBuffered != null && this.photoType != null) {
    return `data:${
      this.photoType
    };charset=utf-8;base64,${this.photoBuffered.toString("base64")}`;
  }
});

module.exports = User = mongoose.model("users", UserSchema);
