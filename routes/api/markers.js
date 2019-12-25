const express = require("express");
const router = express.Router();
const passport = require("passport");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

const Marker = require("../../models/Marker");
const validateMarkerInput = require("../../validation/marker");
const validateMarkerStatusUpdate = require("../../validation/markerStatus");

// Multer options
const fileStorage = multer.diskStorage({
  destination: "./public/images",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Multer
const upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 4000000 }
}).single("image");

// @route Get api/markers
// @desc Get markers
// @access Public
router.get("/", (req, res) => {
  Marker.find()
    .then(markers => res.json(markers))
    .catch(err => res.status(404).json({ nomarkersfound: "Маркери відсутні" }));
});

// @route Get api/markers/usermarkers
// @desc Get User's markers
// @access Private
router.get(
  "/usermarkers",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Marker.find({ user: req.user._id })
      .then(markers => res.json(markers))
      .catch(err =>
        res.status(404).json({ nomarkersfound: "Маркери відсутні" })
      );
  }
);

// @route POST api/markers
// @desc Create new marker
// @access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    upload(req, res, err => {
      const { errors, isValid } = validateMarkerInput(req.body);
      // Chech Validation
      if (!isValid) {
        return res.status(400).json(errors);
      }
      // Check if location already exists
      Marker.findOne({ location: req.body.location })
        .then(marker => {
          if (marker) {
            return res.status(400).json({ location: "Локація вже існує" });
          } else {
            // Check if file was added
            if (!req.file) {
              return res
                .status(400)
                .json({ image: "Необхідно завантажити фото" });
            } else {
              // Throw error if image was not uploaded
              if (err) {
                return res
                  .status(400)
                  .json({ image: "Не вдалось завантажити зображення" });
              } else {
                // Resizing image with sharp
                sharp(req.file.path)
                  .resize({ width: 600, withoutEnlargement: true })
                  .toBuffer()
                  // Overwriting image with file from buffer
                  .then(buffer => {
                    fs.writeFile(
                      `${req.file.destination}/${req.file.filename}`,
                      buffer,
                      err => {
                        if (err) {
                          console.log(err);
                        }
                      }
                    );
                  })
                  .catch(err => console.log(err))
                  .then(() => {
                    // Creating new marker
                    const newMarker = new Marker({
                      location: JSON.parse(req.body.location),
                      comment: req.body.comment,
                      user: req.user.id,
                      statusChange: [{ to: "created" }],
                      photo: `/public/images/${req.file.filename}`
                    });
                    newMarker
                      .save()
                      .then(marker => res.json(marker))
                      .catch(err => console.log(err));
                  })
                  .catch(err => console.log(err));
              }
            }
          }
        })
        .catch(err => console.log(err));
    });
  }
);

// @route DELETE api/markers/:id
// @desc Delete marker
// @access Private/admin
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findOne({ _id: req.user.id })
      .then(user => {
        if (user.role !== "admin") {
          return res
            .status(401)
            .json({ notauthorized: "Немає прав для здійснення цієї операції" });
        }
        Marker.findById(req.params.id)
          .then(marker => {
            marker.remove().then(() => res.json({ success: true }));
          })
          .catch(err =>
            res.status(404).json({ markernotfound: "Маркеру не знайдено" })
          );
      })
      .catch(err =>
        res
          .status(401)
          .json({ notauthorized: "Немає прав для здійснення цієї операції" })
      );
  }
);

// @route PUT api/markers/:id
// @desc Change marker status
// @access Private
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateMarkerStatusUpdate(req.body);

    // Chech Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    User.findOne({ _id: req.user.id })
      .then(user => {
        if (user.role !== "admin") {
          return res
            .status(401)
            .json({ notauthorized: "Немає прав для здійснення цієї операції" });
        }
        Marker.findById(req.params.id)
          .then(marker => {
            marker.statusChange.push({ to: req.body.status });
            marker.save().then(marker => res.json(marker));
          })
          .catch(err =>
            res.status(404).json({ markernotfound: "Маркеру не знайдено" })
          );
      })
      .catch(err =>
        res
          .status(401)
          .json({ notauthorized: "Немає прав для здійснення цієї операції" })
      );
  }
);

module.exports = router;
