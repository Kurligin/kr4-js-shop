const CART_STORAGE_KEY = 'keycraft-cart';
const PROMO_STORAGE_KEY = 'keycraft-promo';
const MAX_QUANTITY = 10;
const FREE_DELIVERY_FROM = 5000;
const DELIVERY_PRICE = 390;

const promoCodes = {
  KEYCRAFT10: { type: 'percent', value: 10, minTotal: 0, label: 'скидка 10%' },
  SWITCH500: { type: 'fixed', value: 500, minTotal: 3000, label: 'минус 500 руб. от 3 000 руб.' },
};

function loadCart() {
  const saved = readStorage(CART_STORAGE_KEY, []);

  if (!Array.isArray(saved)) {
    return [];
  }

  return saved.filter((item) => {
    const product = findProductById(products, item.productId);

    return product && product.isAvailable && Number.isInteger(item.quantity)
      && item.quantity > 0 && item.quantity <= MAX_QUANTITY;
  });
}

let cart = loadCart();
let activePromo = readStorage(PROMO_STORAGE_KEY, '');

if (typeof activePromo !== 'string' || !promoCodes[activePromo]) {
  activePromo = '';
}

function saveCart() {
  if (cart.length === 0 && activePromo) {
    activePromo = '';
    writeStorage(PROMO_STORAGE_KEY, activePromo);
  }

  writeStorage(CART_STORAGE_KEY, cart);
  updateCartCounters();
  document.dispatchEvent(new CustomEvent('cart-change'));
}

function getCartQuantity(productId) {
  const item = cart.find((cartItem) => cartItem.productId === productId);

  return item ? item.quantity : 0;
}

function addToCart(productId) {
  const product = findProductById(products, productId);

  if (!product || !product.isAvailable) {
    return false;
  }

  const quantity = getCartQuantity(productId);

  if (quantity >= MAX_QUANTITY) {
    return false;
  }

  if (quantity === 0) {
    cart = [...cart, { productId, quantity: 1 }];
  } else {
    cart = cart.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item));
  }

  saveCart();
  return true;
}

function changeQuantity(productId, delta) {
  cart = cart
    .map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + delta } : item))
    .filter((item) => item.quantity > 0)
    .map((item) => ({ ...item, quantity: Math.min(item.quantity, MAX_QUANTITY) }));

  saveCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  saveCart();
}

function clearCart() {
  cart = [];
  activePromo = '';
  writeStorage(PROMO_STORAGE_KEY, activePromo);
  saveCart();
}

function getCartItems() {
  return cart.map((item) => ({ product: findProductById(products, item.productId), quantity: item.quantity }));
}

function calculateCartCount(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function calculateCartSubtotal(items) {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function calculateCartDiscount(items) {
  return items.reduce((sum, item) => sum + calculateDiscount(item.product.price, item.product.discountPercent) * item.quantity, 0);
}

function calculatePromoDiscount(amount, code) {
  const promo = promoCodes[code];

  if (!promo || amount < promo.minTotal) {
    return 0;
  }

  if (promo.type === 'percent') {
    return Math.round(amount * promo.value / 100);
  }

  return Math.min(promo.value, amount);
}

function getCartTotals() {
  const items = getCartItems();
  const subtotal = calculateCartSubtotal(items);
  const discount = calculateCartDiscount(items);
  const afterDiscount = subtotal - discount;
  const promoDiscount = calculatePromoDiscount(afterDiscount, activePromo);
  const afterPromo = afterDiscount - promoDiscount;
  let delivery = 0;

  if (items.length > 0 && afterPromo < FREE_DELIVERY_FROM) {
    delivery = DELIVERY_PRICE;
  }

  return {
    count: calculateCartCount(items),
    subtotal,
    discount,
    promoDiscount,
    delivery,
    total: afterPromo + delivery,
  };
}

function applyPromoCode(code) {
  const normalizedCode = code.trim().toUpperCase();
  const promo = promoCodes[normalizedCode];

  if (normalizedCode === '') {
    return { ok: false, message: 'Введите промокод.' };
  }

  if (!promo) {
    return { ok: false, message: 'Такого промокода нет.' };
  }

  const totals = getCartTotals();

  if (totals.subtotal - totals.discount < promo.minTotal) {
    return { ok: false, message: `Промокод ${normalizedCode} действует от ${formatPrice(promo.minTotal)}` };
  }

  activePromo = normalizedCode;
  writeStorage(PROMO_STORAGE_KEY, activePromo);
  return { ok: true, message: getPromoStatus(normalizedCode, true) };
}

function getPromoStatus(code, isActive) {
  const promo = promoCodes[code];

  if (isActive) {
    return `Промокод ${code} применён: ${promo.label}${promo.label.endsWith('.') ? '' : '.'}`;
  }

  return `Промокод ${code} не действует: сумма заказа меньше ${formatPrice(promo.minTotal)}`;
}

function removePromoCode() {
  activePromo = '';
  writeStorage(PROMO_STORAGE_KEY, activePromo);
}

function updateCartCounters() {
  const count = calculateCartCount(getCartItems());

  document.querySelectorAll('[data-cart-count]').forEach((counter) => {
    counter.textContent = String(count);
  });
}

function createCartItem(item) {
  const { product, quantity } = item;
  const finalPrice = calculateFinalPrice(product.price, product.discountPercent);

  const listItem = document.createElement('li');
  listItem.classList.add('cart-item');

  const image = document.createElement('img');
  image.classList.add('cart-item__image');
  image.src = getProductImage(product, 400, 'webp');
  image.width = 400;
  image.height = 300;
  image.alt = '';

  const info = document.createElement('div');
  info.classList.add('cart-item__info');

  const title = document.createElement('a');
  title.classList.add('cart-item__title');
  title.href = `product.html?id=${product.id}`;
  title.textContent = product.title;

  const price = document.createElement('p');
  price.classList.add('cart-item__price');
  price.textContent = `${formatPrice(finalPrice)} за шт.`;

  info.append(title, price);

  const controls = document.createElement('div');
  controls.classList.add('quantity');

  const decreaseButton = document.createElement('button');
  decreaseButton.classList.add('quantity__button');
  decreaseButton.type = 'button';
  decreaseButton.textContent = '−';
  decreaseButton.dataset.action = 'decrease';
  decreaseButton.dataset.productId = String(product.id);
  decreaseButton.setAttribute('aria-label', `Уменьшить количество: ${product.title}`);

  const value = document.createElement('span');
  value.classList.add('quantity__value');

  const valueLabel = document.createElement('span');
  valueLabel.classList.add('visually-hidden');
  valueLabel.textContent = 'Количество: ';
  value.append(valueLabel, String(quantity));

  const increaseButton = document.createElement('button');
  increaseButton.classList.add('quantity__button');
  increaseButton.type = 'button';
  increaseButton.textContent = '+';
  increaseButton.dataset.action = 'increase';
  increaseButton.dataset.productId = String(product.id);
  increaseButton.disabled = quantity >= MAX_QUANTITY;
  increaseButton.setAttribute('aria-label', `Увеличить количество: ${product.title}`);

  controls.append(decreaseButton, value, increaseButton);

  const total = document.createElement('p');
  total.classList.add('cart-item__total');
  total.textContent = formatPrice(finalPrice * quantity);

  const removeButton = document.createElement('button');
  removeButton.classList.add('cart-item__remove');
  removeButton.type = 'button';
  removeButton.textContent = 'Удалить';
  removeButton.dataset.action = 'remove';
  removeButton.dataset.productId = String(product.id);
  removeButton.setAttribute('aria-label', `Удалить из корзины: ${product.title}`);

  listItem.append(image, info, controls, total, removeButton);
  return listItem;
}

const cartList = document.querySelector('[data-cart-list]');

if (cartList) {
  const cartEmpty = document.querySelector('[data-cart-empty]');
  const cartContent = document.querySelector('[data-cart-content]');
  const clearButton = document.querySelector('[data-cart-clear]');
  const promoForm = document.querySelector('[data-promo-form]');
  const promoInput = document.getElementById('promo-code');
  const promoMessage = document.getElementById('promo-message');
  const promoRemove = document.querySelector('[data-promo-remove]');

  const summaryFields = {
    count: document.querySelector('[data-summary-count]'),
    subtotal: document.querySelector('[data-summary-subtotal]'),
    discount: document.querySelector('[data-summary-discount]'),
    promoRow: document.querySelector('[data-summary-promo-row]'),
    promoLabel: document.querySelector('[data-summary-promo-label]'),
    promo: document.querySelector('[data-summary-promo]'),
    delivery: document.querySelector('[data-summary-delivery]'),
    deliveryNote: document.querySelector('[data-delivery-note]'),
    total: document.querySelector('[data-summary-total]'),
  };

  const renderSummary = () => {
    const totals = getCartTotals();

    summaryFields.count.textContent = `Товары, ${totals.count} шт.`;
    summaryFields.subtotal.textContent = formatPrice(totals.subtotal);
    summaryFields.discount.textContent = totals.discount > 0 ? `−${formatPrice(totals.discount)}` : formatPrice(0);
    summaryFields.promoRow.hidden = !activePromo;
    summaryFields.promoLabel.textContent = `Промокод ${activePromo}`;
    summaryFields.promo.textContent = totals.promoDiscount > 0 ? `−${formatPrice(totals.promoDiscount)}` : 'не действует';
    summaryFields.delivery.textContent = totals.delivery > 0 ? formatPrice(totals.delivery) : 'бесплатно';
    summaryFields.total.textContent = formatPrice(totals.total);
    promoRemove.hidden = !activePromo;

    if (activePromo) {
      const isActive = totals.promoDiscount > 0;

      promoMessage.textContent = getPromoStatus(activePromo, isActive);
      promoMessage.classList.toggle('promo-form__message--error', !isActive);
    }

    if (totals.delivery > 0) {
      summaryFields.deliveryNote.textContent = `До бесплатной доставки осталось ${formatPrice(FREE_DELIVERY_FROM - (totals.total - totals.delivery))}`;
    } else {
      summaryFields.deliveryNote.textContent = 'Доставка бесплатная.';
    }
  };

  const renderCart = () => {
    const items = getCartItems();

    cartList.textContent = '';
    items.forEach((item) => {
      cartList.append(createCartItem(item));
    });

    cartEmpty.hidden = items.length > 0;
    cartContent.hidden = items.length === 0;

    if (items.length > 0) {
      renderSummary();
    }
  };

  const recommended = document.querySelector('[data-recommended-products]');

  const focusAfterChange = (productId, action, index) => {
    const sameButton = cartList.querySelector(`[data-action="${action}"][data-product-id="${productId}"]`);
    const decreaseButton = cartList.querySelector(`[data-action="decrease"][data-product-id="${productId}"]`);
    const items = cartList.querySelectorAll('.cart-item');

    if (sameButton && !sameButton.disabled) {
      sameButton.focus();
    } else if (decreaseButton) {
      decreaseButton.focus();
    } else if (items.length > 0) {
      items[Math.min(index, items.length - 1)].querySelector('button').focus();
    } else {
      cartEmpty.querySelector('a').focus();
    }
  };

  document.addEventListener('cart-change', () => {
    const focusInRecommended = recommended && recommended.contains(document.activeElement);

    renderCart();

    if (recommended) {
      renderRecommended(recommended);
    }

    if (focusInRecommended) {
      const nextButton = recommended.querySelector('.product-card__button');

      if (nextButton) {
        nextButton.focus();
      } else {
        cartList.querySelector('button').focus();
      }
    }
  });

  cartList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');

    if (!button) {
      return;
    }

    const productId = Number(button.dataset.productId);
    const action = button.dataset.action;
    const index = [...cartList.children].indexOf(button.closest('.cart-item'));

    if (action === 'increase') {
      changeQuantity(productId, 1);
    } else if (action === 'decrease') {
      changeQuantity(productId, -1);
    } else if (action === 'remove') {
      const product = findProductById(products, productId);

      removeFromCart(productId);
      showNotice(`${product.title} удалён из корзины.`);
    }

    focusAfterChange(productId, action, index);
  });

  clearButton.addEventListener('click', () => {
    clearCart();
    showNotice('Корзина очищена.');
    cartEmpty.querySelector('a').focus();
  });

  promoForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const result = applyPromoCode(promoInput.value);

    renderSummary();
    promoMessage.textContent = result.message;
    promoMessage.classList.toggle('promo-form__message--error', !result.ok);

    if (result.ok) {
      promoInput.value = '';
    }
  });

  promoRemove.addEventListener('click', () => {
    removePromoCode();
    renderSummary();
    promoMessage.textContent = 'Промокод отменён.';
    promoMessage.classList.remove('promo-form__message--error');
    promoInput.focus();
  });

  renderCart();
}

const orderCart = document.querySelector('[data-order-cart]');

if (orderCart) {
  const fromCart = new URLSearchParams(window.location.search).get('from') === 'cart';
  const items = getCartItems();

  if (fromCart && items.length > 0) {
    const orderCartList = orderCart.querySelector('[data-order-cart-list]');
    const orderCartTotal = orderCart.querySelector('[data-order-cart-total]');
    const productField = document.querySelector('[data-product-field]');
    const productSelect = document.getElementById('order-product');

    items.forEach((item) => {
      const line = document.createElement('li');
      const finalPrice = calculateFinalPrice(item.product.price, item.product.discountPercent);

      line.textContent = `${item.product.title} × ${item.quantity} — ${formatPrice(finalPrice * item.quantity)}`;
      orderCartList.append(line);
    });

    orderCartTotal.textContent = `К оплате: ${formatPrice(getCartTotals().total)}`;
    orderCart.hidden = false;
    productField.hidden = true;
    productSelect.required = false;
    productSelect.disabled = true;
  }
}

updateCartCounters();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

window.addEventListener('storage', (event) => {
  if ([CART_STORAGE_KEY, PROMO_STORAGE_KEY, 'keycraft-favorites'].includes(event.key)) {
    window.location.reload();
  }
});
