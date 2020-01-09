const express = require("express");
const router = express.Router();
const passport = require("passport");
const NodeGeocoder = require("node-geocoder");

const keys = require("../../config/keys");
const options = {
  provider: "google",
  apiKey: keys.googleMapAPI,
  language: "uk"
};
const geocoder = NodeGeocoder(options);

const Marker = require("../../models/Marker");
const validateMarkerComment = require("../../validation/markerComment");
const validateComment = require("../../validation/comment");
const isEmpty = require("../../validation/is-empty");

// @route Get api/markers
// @desc Get markers
// @access Public
router.get("/", (req, res) => {
  Marker.find()
    .project({ photo: 0, photoType: 0, user: 0 })
    .then(markers => {
      res.json(markers);
    })
    .catch(err => {
      console.log(err);
      res.status(404).json({ nomarkersfound: "Маркери відсутні" });
    });
});

// @route Get api/markers/usermarkers
// @desc Get User's markers
// @access Private
router.get(
  "/usermarkers",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Marker.find({ user: req.user._id })
      .then(markers => {
        return res.json(markers);
      })
      .catch(err => {
        console.log(err);
        res.status(404).json({ nomarkersfound: "Маркери відсутні" });
      });
  }
);

// @route POST api/markers
// @desc Create new marker
// @access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateMarkerComment(req.body);
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
          if (!req.body.image) {
            return res
              .status(400)
              .json({ image: "Необхідно завантажити фото" });
          } else {
            // Getting image from string, creating buffer and image type
            const image = JSON.parse(req.body.image);
            const bufferedImage = new Buffer.from(image.data, "base64");
            const imageType = image.type;
            // Getting address using geocoder
            const location = req.body.location;
            geocoder
              .reverse({ lat: location.lat, lon: location.lng })
              .then(geodata => {
                const address = {
                  streetNumber: geodata[0].streetNumber,
                  streetName: geodata[0].streetName,
                  neighborhood: geodata[0].extra.neighborhood
                };
                // Creating new marker
                const newMarker = new Marker({
                  location: location,
                  comments: isEmpty(req.body.comment)
                    ? []
                    : [
                        {
                          comment: req.body.comment,
                          author: req.user.id
                        }
                      ],
                  user: req.user.id,
                  address: address,
                  statusChange: [{ to: "created" }],
                  photo: bufferedImage,
                  photoType: imageType
                });
                newMarker
                  .save()
                  .then(marker => res.json(marker))
                  .catch(err => console.log(err));
              })
              .catch(err => console.log(err));
          }
        }
      })
      .catch(err => console.log(err));
  }
);

// @route POST api/markers/comment/:id
// @desc Add user comment to marker if last comment is from moderator
// @access Private
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateComment(req.body);

    // Chech Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    Marker.findById(req.params.id)
      .then(marker => {
        if (marker.user.toString() !== req.user.id) {
          return res
            .status(403)
            .json({ notauthorized: "Немає прав для здійснення цієї операції" });
        }
        if (
          marker.comments.length === 0 ||
          (marker.comments.length > 0 &&
            marker.comments[marker.comments.length - 1].author.toString() ===
              req.user.id)
        ) {
          return res
            .status(403)
            .json({ comment: "Не можливо додати коментар" });
        }
        marker.comments.push({
          comment: req.body.comment,
          author: marker.user
        });
        marker
          .save()
          .then(marker => res.json(marker))
          .catch(err =>
            res.status(400).json({ comment: "Коментар не додано" })
          );
      })
      .catch(err =>
        res.status(404).json({ markernotfound: "Маркеру не знайдено" })
      );
  }
);

module.exports = router;
