const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateChangePasswordInput(data) {
  let errors = {};

  data.password = !isEmpty(data.password) ? data.password : "";
  data.newpassword = !isEmpty(data.newpassword) ? data.newpassword : "";
  data.newpassword2 = !isEmpty(data.newpassword2) ? data.newpassword2 : "";

  if (!Validator.isLength(data.newpassword, { min: 4, max: 30 })) {
    errors.password = "Введіть значення від 4 символів";
  }

  if (Validator.isEmpty(data.newpassword)) {
    errors.password = "Пароль є обов'язковим";
  }

  if (Validator.isEmpty(data.newpassword2)) {
    errors.password2 = "Пароль є обов'язковим";
  }

  if (!Validator.equals(data.newpassword, data.newpassword2)) {
    errors.password2 = "Паролі повинні бути однаковими";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
