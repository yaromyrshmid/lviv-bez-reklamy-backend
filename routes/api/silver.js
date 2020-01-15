const express = require("express");
const router = express.Router();
const passport = require("passport");

// @route Get api/silver
// @desc Get user's silver
// @access Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findOne({ _id: req.user._id }, { password: false })
      .then(user => {
        if (!user) {
          return res.status(404).json({ user: "Користувача не знайдено" });
        }
        const payload = user.silver;
        return res.json(payload);
      })
      .catch(err => {
        console.log(err);
        res.status(404).json({ user: "Користувача не знайдено" });
      });
  }
);

// @route Post api/silver/:markerId
// @desc Get silver for removed marker
// @access Private
router.post(
  "/:markerId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Marker.findById(req.params.markerId)
      .then(marker => {
        if (marker.user.toString() !== req.user._id.toString()) {
          return res
            .status(403)
            .json({ user: "Маркер не створений цим користувачем" });
        }
        if (!marker.silverAllocated) {
          return res
            .status(403)
            .json({ silver: "Срібняки за маркер ще не доступні" });
        }
        if (marker.silverCollected) {
          return res.status(403).json({ silver: "Срібняки вже зібрані" });
        }
        marker.silverCollected = Date.now();
        marker.save().then(() => {
          User.findById(req.user._id)
            .then(user => {
              user.silver = user.silver + 30;
              user
                .save()
                .then(user => {
                  res.json(user.silver);
                })
                .catch(err => {
                  console.log(err);
                  res.status(500).json({ server: "Помилка серверу" });
                });
            })
            .catch(err =>
              res.status(404).json({ user: "Користувача не знайдено" })
            );
        });
      })
      .catch(err =>
        res.status(404).json({ markernotfound: "Маркеру не знайдено" })
      );
  }
);

module.exports = router;
