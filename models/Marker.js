const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const MarkerSchema = new Schema(
  {
    location: {
      type: Object,
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "users"
    },
    photo: {
      type: Buffer,
      required: true
    },
    photoType: {
      type: String,
      required: true
    },
    comments: [
      {
        comment: { type: String },
        date: {
          type: Date,
          default: Date.now
        },
        author: { type: Schema.Types.ObjectId, ref: "users" }
      }
    ],
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
          default: Date.now,
          required: true
        }
      }
    ]
  },
  { toJSON: { virtuals: true } }
);

MarkerSchema.virtual("virtualPhoto").get(function() {
  if (this.photo != null && this.photoType != null) {
    return `data:${this.photoType};charset=utf-8;base64,${this.photo.toString(
      "base64"
    )}`;
  }
});

module.exports = Marker = mongoose.model("markers", MarkerSchema);
