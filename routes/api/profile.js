const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const keys = require("../../config/keys");
const validateName = require("../../validation/name");

// @route GET api/profile
// @desc Get user's profile
// @access Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findOne({ _id: req.user._id }, { password: false })
      .then(user => {
        if (!user) {
          return res.status(404).json({ profile: "Профілю не знайдено" });
        }
        const payload = {
          photo: user.photoBuffered ? user.photo : user.photoURL,
          email: user.email
        };
        return res.json(payload);
      })
      .catch(err => {
        console.log(err);
        res.status(404).json({ profile: "Профілю не знайдено" });
      });
  }
);

// @route POST api/profile/photo
// @desc Change user's photo
// @access Private
router.post(
  "/photo",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findOne({ _id: req.user._id }, { password: false })
      .then(user => {
        if (!user) {
          return res.status(404).json({ profile: "Профілю не знайдено" });
        }
        if (!req.body.image) {
          return res.status(400).json({ image: "Необхідно завантажити фото" });
        } else {
          // Getting image from string, creating buffer and image type
          const image = JSON.parse(req.body.image);
          const bufferedImage = new Buffer.from(image.data, "base64");
          const imageType = image.type;
          user.photoBuffered = bufferedImage;
          user.photoType = imageType;
          user
            .save()
            .then(user => {
              return res.json(user.photo);
            })
            .catch(err => {
              console.log(err);
              errors.server = "Помилка серверу";
              res.status(500).json(errors.server);
            });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(404).json({ profile: "Профілю не знайдено" });
      });
  }
);

// @route POST api/profile/name
// @desc Change user's name
// @access Private
router.post(
  "/name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateName(req.body);
    // Chech Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    User.findOne({ _id: req.user._id }, { password: false })
      .then(user => {
        if (!user) {
          return res.status(404).json({ name: "Користувача не знайдено" });
        }
        user.name = req.body.name;
        user.save().then(user => {
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
        });
      })
      .catch(err => {
        console.log(err);
        res.status(404).json({ server: "Помилка серверу" });
      });
  }
);

module.exports = router;
