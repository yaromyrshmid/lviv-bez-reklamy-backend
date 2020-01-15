const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");

const User = require("../../models/User");
const keys = require("../../config/keys");
const validateRegisterInput = require("../../validation/registration");
const validateLoginInput = require("../../validation/login");
const validateForgotPasswordInput = require("../../validation/forgotPassword");
const validatePasswordsInput = require("../../validation/passwords");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: keys.SENDGRID_API_KEY
    }
  })
);

// @route GET api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = "Користувач з такою адресою уже зареєстрований";
      return res.status(400).json(errors);
    } else {
      // Generating email confirmation link
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          res.status(400).json(err);
        }
        const emailConfirmationToken = buffer.toString("hex");
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          emailConfirmationToken
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                res.status(200).json("success");
                return transporter
                  .sendMail({
                    to: req.body.email,
                    from: "no-reply@lviv-bez-reklamy.com",
                    subject: "Підтвердіть Email | Львів без реклами",
                    html: `<h3>Для підтвердження Emailу <a href="${keys.frontEndURL}/confirmemail/${emailConfirmationToken}" rel="noopener noreferrer" target="_blank"> тицьніть тут.</a></h3>`
                  })
                  .catch(err => {
                    console.log(err);
                    errors.server = "Помилка серверу";
                    res.status(500).json(errors.server);
                  });
              })
              .catch(err => {
                console.log(err);
                errors.server = "Помилка серверу";
                res.status(500).json(errors.server);
              });
          });
        });
      });
    }
  });
});

// @route POST api/users/confirmemail/:emailConfirmationToken
// @desc Confirm email for new user
// @access Public
router.post("/confirmemail/:emailConfirmationToken", (req, res) => {
  const errors = {};
  User.findOneAndUpdate(
    { emailConfirmationToken: req.params.emailConfirmationToken },
    { $unset: { emailConfirmationToken: 1 }, $set: { emailConfirmed: true } },
    { multi: false }
  )
    .then(user => {
      if (!user) {
        errors.email =
          "Користувача не знайдено або електронна адреса вже підтверджена";
        return res.status(404).json(errors);
      }
      if (user.role === "banned") {
        errors.user = "Користувача заблокований";
        return res.status(403).json(errors);
      }
      if (user.emailConfirmed) {
        errors.user = "Електронна адреса вже підтверджена";
        return res.status(403).json(errors);
      }
      const payload = {
        id: user.id,
        name: user.name,
        role: user.role
      };
      // Sign Token
      jwt.sign(payload, keys.secret, { expiresIn: 36000 }, (err, token) => {
        res.json({
          success: true,
          token: "Bearer " + token
        });
      });
    })
    .catch(err => {
      console.log(err);
      errors.server = "Помилка серверу";
      res.status(500).json(errors.server);
    });
});

// @route POST api/users/login
// @desc Login user / Returning JWT
// @access Public
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        errors.email = "Користувача не знайдено";
        return res.status(404).json(errors);
      }
      if (user.role === "banned") {
        errors.email = "Користувач заблокований";
        return res.status(403).json(errors);
      }
      if (!user.emailConfirmed) {
        errors.email =
          "Підтвердіть електронну адресу, перейшовши за посиланням, надісланим на вашу пошту після реєстрації";
        return res.status(403).json(errors);
      }
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          const payload = {
            id: user.id,
            name: user.name,
            role: user.role
          };
          // Sign Token
          jwt.sign(payload, keys.secret, { expiresIn: 36000 }, (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          });
        } else {
          errors.password = "Пароль не вірний";
          return res.status(400).json(errors);
        }
      });
    })
    .catch(err => {
      console.log(err);
      errors.server = "Помилка серверу";
      res.status(500).json(errors.server);
    });
});

// @route POST api/users/forgotpassword
// @desc Creating link to reset password
// @access Public
router.post("/forgotpassword", (req, res) => {
  const { errors, isValid } = validateForgotPasswordInput(req.body);
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      res.status(400).json(err);
    }
    const passwordResetToken = buffer.toString("hex");
    User.findOne({ email }).then(user => {
      if (!user) {
        errors.email = "Користувача не знайдено";
        return res.status(404).json(errors);
      }
      if (user.role === "banned") {
        errors.email = "Користувача заблокований";
        return res.status(403).json(errors);
      }
      if (loginThirdParty) {
        errors.email =
          "Користувач входив в систему за допомогою Google або Facebook";
        return res.status(403).json(errors);
      }
      if (!user.emailConfirmed) {
        errors.email =
          "Підтвердіть електронну адресу, перейшовши за посиланням, надісланим на вашу пошту після реєстрації";
        return res.status(403).json(errors);
      }
      user.passwordResetToken = passwordResetToken;
      user.passwordResetExpiration = Date.now() + 3600000;
      user
        .save()
        .then(user => {
          res.status(200).json("success");
          return transporter
            .sendMail({
              to: user.email,
              from: "no-reply@lviv-bez-reklamy.com",
              subject: "Зміна паролю | Львів без реклами",
              html: `<h3>Для зміни паролю <a href="${keys.frontEndURL}/setnewpassword/${passwordResetToken}" rel="noopener noreferrer" target="_blank"> перейдіть за посиланням.</a></h3>`
            })
            .catch(err => {
              console.log(err);
              errors.server = "Помилка серверу";
              res.status(500).json(errors.server);
            });
        })
        .catch(err => {
          console.log(err);
          errors.server = "Помилка серверу";
          res.status(500).json(errors.server);
        });
    });
  });
});

// @route POST api/users/resetpassword/:passwordResetToken
// @desc Reseting password
// @access Public
router.post("/resetpassword/:passwordResetToken", (req, res) => {
  const { errors, isValid } = validatePasswordsInput(req.body);
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOneAndUpdate(
    { passwordResetToken: req.params.passwordResetToken },
    { $unset: { passwordResetToken: 1 } },
    { multi: false }
  )
    .then(user => {
      if (!user) {
        errors.user = "Користувача не знайдено";
        return res.status(404).json(errors);
      }
      if (user.role === "banned") {
        errors.user = "Користувач заблокований";
        return res.status(403).json(errors);
      }
      if (user.passwordResetExpiration < Date.now()) {
        errors.user = "Посилання для зміни паролю не дійсне";
        return res.status(403).json(errors);
      }
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.password, salt, (err, hash) => {
          if (err) {
            console.log(err);
            errors.server = "Помилка серверу";
            res.status(500).json(errors.server);
          }
          user.password = hash;
          user
            .save()
            .then(() => res.status(200).json("success"))
            .catch(err => {
              console.log(err);
              errors.server = "Помилка серверу";
              res.status(500).json(errors.server);
            });
        });
      });
    })
    .catch(err => {
      console.log(err);
      errors.server = "Помилка серверу";
      res.status(500).json(errors.server);
    });
});

module.exports = router;
