const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBMIT_DELAY = 800;

function getPhoneDigits(value) {
  let digits = value.replace(/\D/g, '');

  if (digits.length === 10) {
    digits = `7${digits}`;
  }

  if (digits.length === 11 && digits[0] === '8') {
    digits = `7${digits.slice(1)}`;
  }

  return digits;
}

function formatPhone(value) {
  const digits = getPhoneDigits(value);

  if (digits.length !== 11 || digits[0] !== '7') {
    return value;
  }

  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

function getTodayString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${today.getFullYear()}-${month}-${day}`;
}

function validateName(input) {
  if (input.value.trim().length < 2) {
    return 'Введите имя не короче 2 символов.';
  }

  return '';
}

function validateEmail(input) {
  if (!EMAIL_PATTERN.test(input.value.trim())) {
    return 'Введите корректный e-mail, например name@example.ru.';
  }

  return '';
}

function validatePhone(input) {
  const digits = getPhoneDigits(input.value);

  if (digits.length !== 11 || digits[0] !== '7' || !'3489'.includes(digits[1])) {
    return 'Введите корректный номер телефона: +7 и 10 цифр, код начинается с 3, 4, 8 или 9.';
  }

  return '';
}

function validateRequired(input) {
  if (input.value.trim() === '') {
    return input.dataset.message || 'Заполните поле.';
  }

  return '';
}

function validateAgreement(input) {
  if (!input.checked) {
    return 'Без согласия на обработку данных отправить форму нельзя.';
  }

  return '';
}

function validateMessage(input) {
  if (input.value.trim().length < 10) {
    return 'Напишите сообщение — минимум 10 символов.';
  }

  return '';
}

function validateDate(input) {
  if (input.value !== '' && input.value < getTodayString()) {
    return 'Выберите сегодняшнюю или будущую дату.';
  }

  return '';
}

const validators = {
  name: validateName,
  email: validateEmail,
  phone: validatePhone,
  required: validateRequired,
  agreement: validateAgreement,
  message: validateMessage,
  date: validateDate,
};

function showError(input, errorElement, message) {
  errorElement.textContent = message;
  input.setAttribute('aria-invalid', 'true');
}

function clearError(input, errorElement) {
  errorElement.textContent = '';
  input.removeAttribute('aria-invalid');
}

function validateField(input) {
  const errorElement = document.getElementById(`${input.id}-error`);
  const validator = validators[input.dataset.validate];

  if (!errorElement || !validator || input.disabled) {
    return true;
  }

  const message = validator(input);

  if (message) {
    showError(input, errorElement, message);
    return false;
  }

  clearError(input, errorElement);
  return true;
}

function resetFormState(form) {
  form.reset();

  const formMessage = form.querySelector('.form-message');

  if (formMessage) {
    formMessage.textContent = '';
    formMessage.classList.remove('form-message--success', 'form-message--error');
  }

  form.querySelectorAll('[data-validate]').forEach((input) => {
    const errorElement = document.getElementById(`${input.id}-error`);

    if (errorElement) {
      clearError(input, errorElement);
    }
  });
}

function createOrderNumber() {
  return `KC-${String(Date.now()).slice(-6)}`;
}

document.querySelectorAll('input[type="date"]').forEach((input) => {
  input.min = getTodayString();
});

const validatedForms = document.querySelectorAll('form[data-form]');

validatedForms.forEach((form) => {
  const fields = Array.from(form.querySelectorAll('[data-validate]'));
  const formMessage = form.querySelector('.form-message');
  const submitButton = form.querySelector('[type="submit"]');
  const submitText = submitButton.textContent;
  const dialog = form.closest('dialog');
  let submitTimer = null;

  const finishSending = () => {
    clearTimeout(submitTimer);
    submitTimer = null;
    submitButton.disabled = false;
    submitButton.textContent = submitText;
    form.removeAttribute('aria-busy');
  };

  if (dialog) {
    dialog.addEventListener('close', () => {
      if (submitTimer) {
        finishSending();
      }
    });
  }

  fields.forEach((input) => {
    const eventName = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';

    input.addEventListener(eventName, () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        validateField(input);
      }
    });

    input.addEventListener('blur', () => {
      if (input.dataset.validate === 'phone' && input.value.trim() !== '') {
        input.value = formatPhone(input.value);
      }

      if (input.value.trim() !== '' && input.type !== 'checkbox') {
        validateField(input);
      }
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const phoneInput = form.querySelector('[data-validate="phone"]');

    if (phoneInput && phoneInput.value.trim() !== '') {
      phoneInput.value = formatPhone(phoneInput.value);
    }

    const invalidFields = fields.filter((input) => !validateField(input));

    formMessage.classList.remove('form-message--success', 'form-message--error');

    if (invalidFields.length > 0) {
      formMessage.textContent = `Проверьте поля формы: ошибок — ${invalidFields.length}.`;
      formMessage.classList.add('form-message--error');
      invalidFields[0].focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Отправляем…';
    form.setAttribute('aria-busy', 'true');
    formMessage.textContent = 'Отправляем данные…';

    submitTimer = setTimeout(() => {
      const orderNumber = createOrderNumber();
      const isCartOrder = form.dataset.form === 'order' && !document.querySelector('[data-order-cart]')?.hidden;
      const successText = form.dataset.form === 'feedback'
        ? 'Сообщение отправлено. Ответим на указанный e-mail в течение рабочего дня.'
        : `Заявка ${orderNumber} принята. Менеджер свяжется с вами в выбранное время.`;

      finishSending();
      resetFormState(form);

      if (isCartOrder) {
        clearCart();
        document.querySelector('[data-order-cart]').hidden = true;
        document.querySelector('[data-product-field]').hidden = false;
        document.getElementById('order-product').disabled = false;
      }

      if (dialog) {
        dialog.close();
        showNotice(successText);
        return;
      }

      formMessage.textContent = successText;
      formMessage.classList.add('form-message--success');
      formMessage.focus();
    }, SUBMIT_DELAY);
  });
});
