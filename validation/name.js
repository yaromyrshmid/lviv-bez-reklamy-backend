const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateNameInput(data) {
  let errors = {};

  data.name = !isEmpty(data.name) ? data.name : "";

  if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = "Введіть значення довжиною від 2 до 30 символів";
  }

  if (Validator.isEmpty(data.name)) {
    errors.name = "Ім'я є обов'язковим";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
