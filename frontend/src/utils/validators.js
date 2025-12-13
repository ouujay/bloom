export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone) {
  // Nigerian phone number validation
  const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function isValidPassword(password) {
  return password.length >= 8;
}

export function isValidAccountNumber(accountNumber) {
  return /^\d{10}$/.test(accountNumber);
}

export function validateSignupForm(data) {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.phone || !isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid Nigerian phone number';
  }

  if (!data.password || !isValidPassword(data.password)) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateWithdrawalForm(data, balance) {
  const errors = {};

  if (!data.amount || data.amount < 500) {
    errors.amount = 'Minimum withdrawal is 500 tokens';
  }

  if (data.amount > balance) {
    errors.amount = 'Insufficient balance';
  }

  if (!data.bank_name) {
    errors.bank_name = 'Bank name is required';
  }

  if (!data.account_number || !isValidAccountNumber(data.account_number)) {
    errors.account_number = 'Please enter a valid 10-digit account number';
  }

  if (!data.account_name) {
    errors.account_name = 'Account name is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
