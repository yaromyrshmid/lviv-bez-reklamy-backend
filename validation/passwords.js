const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validatePasswordsInput(data) {
  let errors = {};

  data.password = !isEmpty(data.password) ? data.password : "";
  data.password2 = !isEmpty(data.password2) ? data.password2 : "";

  if (!Validator.isLength(data.password, { min: 4, max: 30 })) {
    errors.password = "Введіть значення від 4 символів";
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = "Пароль є обов'язковим";
  }

  if (Validator.isEmpty(data.password2)) {
    errors.password2 = "Пароль є обов'язковим";
  }

  if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = "Паролі повинні бути однаковими";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
