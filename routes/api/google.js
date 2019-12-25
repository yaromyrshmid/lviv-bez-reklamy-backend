const express = require("express");
const router = express.Router();
const jwt_decode = require("jsonwebtoken/decode");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");
const keys = require("../../config/keys");

// @route GET api/google
// @desc Login user with Google / Returning JWT
// @access Public
router.post("/", (req, res) => {
  // Check Validation
  const decoded = jwt_decode(req.body.id_token);
  User.findOne({ email: decoded.email })
    .then(user => {
      if (!user) {
        const newUser = new User({
          name: decoded.name,
          email: decoded.email,
          photo: decoded.picture
        });
        newUser
          .save()
          .then(user => {
            const payload = {
              id: user.id,
              name: user.name,
              role: user.role
            };
            // Sign Token
            jwt.sign(
              payload,
              keys.secret,
              { expiresIn: 36000 },
              (err, token) => {
                res.json({
                  success: true,
                  token: "Bearer " + token
                });
              }
            );
          })
          .catch(err => console.log(err));
      } else {
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
      }
    })
    .catch(err => console.log(err));
});

module.exports = router;
