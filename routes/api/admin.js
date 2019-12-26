const express = require("express");
const router = express.Router();
const passport = require("passport");
const fs = require("fs");
const path = require("path");

const Marker = require("../../models/Marker");
const validateMarkerStatusUpdate = require("../../validation/markerStatus");

const MARKERS_PER_PAGE = 10;

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

// @route GET api/admin/markers/:page
// @desc Get markers from page
// @access Private/admin
router.get("/markers/:page", (req, res) => {
  let totalPages;
  const page = +req.params.page || 1;
  Marker.find()
    // Getting total number of markers
    .countDocuments()
    .then(numOfMarkers => {
      // Getting total number of pages for front-end pagination
      totalPages = Math.ceil(numOfMarkers / MARKERS_PER_PAGE);
      // Getting markers for requested page
      return Marker.find()
        .sort({ statusChange: -1 })
        .skip((page - 1) * MARKERS_PER_PAGE)
        .limit(MARKERS_PER_PAGE);
    })
    .then(markers => {
      // Sending markers for page along with number of pages
      res.json({ markers: markers, totalPages: totalPages });
    })
    .catch(err => res.status(404).json({ nomarkersfound: "Маркери відсутні" }));
});

// @route DELETE api/admin/markers/:id
// @desc Delete marker
// @access Private/admin
router.delete("/markers/:id", (req, res) => {
  Marker.findById(req.params.id)
    .then(marker => {
      try {
        fs.unlinkSync(path.join("." + marker.photo));
      } catch (err) {}
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
      if (
        marker.statusChange[marker.statusChange.length - 1].to ===
        req.body.status
      ) {
        return res.status(406).json({ error: "Цей статус уже встановлено" });
      } else {
        marker.statusChange.push({ to: req.body.status });
        marker.save().then(marker => res.json(marker));
      }
    })
    .catch(err =>
      res.status(404).json({ markernotfound: "Маркеру не знайдено" })
    );
});

module.exports = router;
