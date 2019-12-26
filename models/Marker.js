const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const MarkerSchema = new Schema({
  location: {
    type: Object,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  photo: {
    type: String,
    required: true
  },
  comment: {
    type: String
  },
  address: {
    type: Object,
    required: true
  },
  statusChange: [
    {
      to: {
        type: String,
        required: true
      },
      changedAt: {
        type: Date,
        default: Date.now(),
        required: true
      }
    }
  ]
});

module.exports = Marker = mongoose.model("markers", MarkerSchema);
