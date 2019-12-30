const express = require("express");
const router = express.Router();
const passport = require("passport");
const fs = require("fs");
const path = require("path");

const Marker = require("../../models/Marker");
const validateMarkerStatusUpdate = require("../../validation/markerStatus");
const validateMarkerComment = require("../../validation/comment");

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

// @route POST api/admin/markers/:page
// @desc Get markers from page according to filter
// @access Private/admin
router.post("/markers/:page", (req, res) => {
  let totalPages;
  // Getting page number from request parameter
  const page = +req.params.page || 1;

  // Getting all markers
  Marker.find()
    .populate("user", { password: false })
    .populate("comments.author", { password: false })
    .then(markers => {
      let markersToSend;
      // Checking if filtering is applied
      if (req.body.statusFilter === "") {
        markersToSend = markers;
      } else {
        markersToSend = markers.filter(
          marker =>
            marker.statusChange[marker.statusChange.length - 1].to ===
            req.body.statusFilter
        );
      }
      // Calculating number of pages
      totalPages = Math.ceil(markersToSend.length / MARKERS_PER_PAGE);

      // Compare function to sort according to last status change
      const compare = (marker_2, marker_1) => {
        return (
          marker_1.statusChange[marker_1.statusChange.length - 1].changedAt -
          marker_2.statusChange[marker_2.statusChange.length - 1].changedAt
        );
      };

      // Sorting
      markersToSend.sort(compare);

      //Pagination
      const offset = (page - 1) * MARKERS_PER_PAGE;
      const markersPaginated = markersToSend.slice(
        offset,
        offset + MARKERS_PER_PAGE
      );

      // Sending markers for page along with number of pages
      res.json({ markers: markersPaginated, totalPages: totalPages });
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
// @access Private/admin
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

// @route POST api/admin/markers/comment/:id
// @desc Add comment to marker
// @access Private/admin
router.post("/markers/comment/:id", (req, res) => {
  const { errors, isValid } = validateMarkerComment(req.body);

  // Chech Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  Marker.findById(req.params.id)
    .then(marker => {
      marker.comments.push({ comment: req.body.comment, author: req.user.id });
      marker
        .save()
        .then(marker => {
          Marker.findById(req.params.id)
            .populate("user", { password: false })
            .populate("comments.author", { password: false })
            .then(markerToSend => res.json(markerToSend));
        })
        .catch(err => res.status(400).json({ comment: "Коментар не додано" }));
    })
    .catch(err =>
      res.status(404).json({ markernotfound: "Маркеру не знайдено" })
    );
});

module.exports = router;
