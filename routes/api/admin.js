const express = require("express");
const router = express.Router();
const passport = require("passport");

const validateMarkerStatusUpdate = require("../../validation/markerStatus");

// Pass only admins
router.use(
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    User.findOne({ _id: req.user.id })
      .then(user => {
        if (user.role !== "admin") {
          return res
            .status(401)
            .json({ notauthorized: "Немає прав для здійснення цієї операції" });
        } else {
          next();
        }
      })
      .catch(err =>
        res
          .status(401)
          .json({ notauthorized: "Немає прав для здійснення цієї операції" })
      );
  }
);

// @route DELETE api/admin/markers/:id
// @desc Delete marker
// @access Private/admin
router.delete("/markers/:id", (req, res) => {
  Marker.findById(req.params.id)
    .then(marker => {
      marker.remove().then(() => res.json({ success: true }));
    })
    .catch(err =>
      res.status(404).json({ markernotfound: "Маркеру не знайдено" })
    );
});

// @route PUT api/admin/markers/:id
// @desc Change marker status
// @access Private
router.put("/markers/:id", (req, res) => {
  const { errors, isValid } = validateMarkerStatusUpdate(req.body);
  // Chech Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  Marker.findById(req.params.id)
    .then(marker => {
      marker.statusChange.push({ to: req.body.status });
      marker.save().then(marker => res.json(marker));
    })
    .catch(err =>
      res.status(404).json({ markernotfound: "Маркеру не знайдено" })
    );
});

module.exports = router;
