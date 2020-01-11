const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateLoginInput(data) {
  let errors = {};

  data.email = !isEmpty(data.email) ? data.email : "";

  if (!Validator.isEmail(data.email)) {
    errors.email = "Email не коректний";
  }

  if (Validator.isEmpty(data.email)) {
    errors.email = "Email є обов'язковим";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
