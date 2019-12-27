const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateMarkerComment(data) {
  let errors = {};

  if (
    !isEmpty(data.comment) &&
    !Validator.isLength(data.comment, { min: 4, max: 300 })
  ) {
    errors.comment = "Коментар повинен бути від 4 до 300 символів";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
