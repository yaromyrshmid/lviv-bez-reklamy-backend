const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateMarkerStatusUpdate(data) {
  let errors = {};

  if (Validator.isEmpty(data.status)) {
    errors.status = "Статус не змінено";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
