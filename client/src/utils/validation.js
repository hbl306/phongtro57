// client/src/utils/validation.js

export function validateRegister({ name, phone, password }) {
  const errors = {};

  // Kiểm tra tên
  if (!name || name.trim().length < 2) {
    errors.name = "Tên phải có ít nhất 2 ký tự";
  }

  // Kiểm tra số điện thoại
  if (!phone) {
    errors.phone = "Vui lòng nhập số điện thoại";
  } else if (!/^(0[0-9]{9})$/.test(phone)) {
    errors.phone = "Số điện thoại không hợp lệ (phải 10 chữ số và bắt đầu bằng 0)";
  }

  // Kiểm tra mật khẩu
  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu";
  } else if (password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
  }

  return errors;
}
