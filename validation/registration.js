const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateRegisterInput(data) {
  let errors = {};

  data.name = !isEmpty(data.name) ? data.name : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.password2 = !isEmpty(data.password2) ? data.password2 : "";

  if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = "Введіть значення довжиною від 2 до 30 символів";
  }

  if (Validator.isEmpty(data.name)) {
    errors.name = "Ім'я є обов'язковим";
  }

  if (Validator.isEmpty(data.email)) {
    errors.email = "Email є обов'язковим";
  }

  if (!Validator.isEmail(data.email)) {
    errors.email = "Email не коректний";
  }

  if (!Validator.isLength(data.email, { min: 5, max: 60 })) {
    errors.password = "Введіть значення від 5 символів";
  }

  if (!Validator.isLength(data.password, { min: 4, max: 30 })) {
    errors.password = "Введіть значення від 4 символів";
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = "Пароль є обов'язковим";
  }

  if (Validator.isEmpty(data.password2)) {
    errors.password2 = "Підтвердження паролю є обов'язковим";
  }

  if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = "Паролі повинні бути однаковими";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
