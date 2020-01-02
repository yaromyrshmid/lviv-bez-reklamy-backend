const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");

const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const markers = require("./routes/api/markers");
const google = require("./routes/api/google");
const facebook = require("./routes/api/facebook");
const admin = require("./routes/api/admin");

const app = express();

app.use(cors());

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Public storage
app.use("*/images", express.static("public/images"));

// DB Config
const db = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport Config
require("./config/passport.js")(passport);

// Use Routes
app.use("/api/users", users);
app.use("/api/profile", profile);
app.use("/api/markers", markers);
app.use("/api/google", google);
app.use("/api/facebook", facebook);
app.use("/api/admin", admin);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
