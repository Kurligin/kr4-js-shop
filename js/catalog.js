const CARD_SIZES = '(min-width: 1024px) 320px, (min-width: 640px) calc(50vw - 60px), calc(100vw - 64px)';
const CATALOG_CARD_SIZES = '(min-width: 1200px) 220px, (min-width: 1024px) 300px, (min-width: 640px) calc(50vw - 60px), calc(100vw - 64px)';

const badgeLabels = {
  hit: 'Хит',
  new: 'Новинка',
  soon: 'Скоро в продаже',
};

function createProductPicture(product, className, sizes, isLazy) {
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  const image = document.createElement('img');

  source.type = 'image/webp';
  source.srcset = [400, 800, 1200].map((width) => `${getProductImage(product, width, 'webp')} ${width}w`).join(', ');
  source.sizes = sizes;

  image.classList.add(className);
  image.src = getProductImage(product, 800, 'jpg');
  image.srcset = [400, 800, 1200].map((width) => `${getProductImage(product, width, 'jpg')} ${width}w`).join(', ');
  image.sizes = sizes;
  image.width = 800;
  image.height = 600;
  image.alt = product.title;

  if (isLazy) {
    image.loading = 'lazy';
  }

  picture.append(source, image);
  return picture;
}

function getBadge(product) {
  if (product.badge === 'soon') {
    return { text: badgeLabels.soon, modifier: 'soon' };
  }

  if (product.discountPercent > 0) {
    return { text: `−${product.discountPercent}%`, modifier: 'sale' };
  }

  if (product.badge) {
    return { text: badgeLabels[product.badge], modifier: product.badge };
  }

  return null;
}

function createPriceElement(product, className) {
  const price = document.createElement('p');
  price.classList.add(className);

  const finalPrice = calculateFinalPrice(product.price, product.discountPercent);

  if (product.discountPercent > 0) {
    const oldPrice = document.createElement('s');
    oldPrice.classList.add('price-old');
    oldPrice.textContent = formatPrice(product.price);

    const oldLabel = document.createElement('span');
    oldLabel.classList.add('visually-hidden');
    oldLabel.textContent = 'Старая цена: ';

    const newLabel = document.createElement('span');
    newLabel.classList.add('visually-hidden');
    newLabel.textContent = ', цена со скидкой: ';

    const newPrice = document.createElement('span');
    newPrice.classList.add('price-new');
    newPrice.textContent = formatPrice(finalPrice);

    price.append(oldLabel, oldPrice, newLabel, newPrice);
  } else {
    price.textContent = formatPrice(finalPrice);
  }

  return price;
}

function createRatingElement(product, className) {
  const rating = document.createElement('p');
  rating.classList.add(className);

  const star = document.createElement('span');
  star.classList.add('rating-star');
  star.setAttribute('aria-hidden', 'true');
  star.textContent = '★';

  const label = document.createElement('span');
  label.classList.add('visually-hidden');
  label.textContent = 'Рейтинг: ';

  rating.append(star, label, `${product.rating.toLocaleString('ru-RU')} из 5`);
  return rating;
}

function updateFavoriteButton(button, product) {
  const active = isFavorite(product.id);

  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', active ? `Убрать из избранного: ${product.title}` : `Добавить в избранное: ${product.title}`);
  button.textContent = active ? '♥' : '♡';
}

function createFavoriteButton(product, className) {
  const button = document.createElement('button');
  button.classList.add(className);
  button.type = 'button';
  button.dataset.action = 'toggle-favorite';
  button.dataset.productId = String(product.id);
  updateFavoriteButton(button, product);
  return button;
}

function createAddToCartButton(product, className) {
  const button = document.createElement('button');
  button.classList.add('button', 'button--primary', className);
  button.type = 'button';
  button.dataset.action = 'add-to-cart';
  button.dataset.productId = String(product.id);

  if (product.isAvailable) {
    button.textContent = 'В корзину';
  } else {
    button.textContent = 'Недоступно';
    button.disabled = true;
  }

  return button;
}

function createProductCard(product, sizes = CARD_SIZES) {
  const card = document.createElement('article');
  card.classList.add('product-card');
  card.dataset.productId = String(product.id);

  if (!product.isAvailable) {
    card.classList.add('product-card--soon');
  }

  if (product.badge === 'hit') {
    card.classList.add('product-card--hit');
  }

  const picture = createProductPicture(product, 'product-card__image', sizes, true);
  const favoriteButton = createFavoriteButton(product, 'product-card__favorite');

  const title = document.createElement('h3');
  title.classList.add('product-card__title');

  const link = document.createElement('a');
  link.classList.add('product-card__link-title');
  link.href = `product.html?id=${product.id}`;
  link.textContent = product.title;
  title.append(link);

  const category = document.createElement('p');
  category.classList.add('product-card__category');
  category.textContent = categories[product.category];

  const description = document.createElement('p');
  description.classList.add('product-card__description');
  description.textContent = product.description;

  const rating = createRatingElement(product, 'product-card__rating');
  const price = createPriceElement(product, 'product-card__price');

  const status = document.createElement('p');
  status.classList.add('product-card__status');
  status.classList.add(product.isAvailable ? 'product-card__status--available' : 'product-card__status--unavailable');
  status.textContent = getProductStatus(product);

  const button = createAddToCartButton(product, 'product-card__button');

  card.append(picture);

  const badge = getBadge(product);

  if (badge) {
    const badgeElement = document.createElement('span');
    badgeElement.classList.add('product-card__badge', `product-card__badge--${badge.modifier}`);
    badgeElement.textContent = badge.text;
    card.append(badgeElement);
  }

  card.append(favoriteButton, title, category, description, rating, price, status, button);
  return card;
}

function renderProductList(container, productsToRender, sizes) {
  container.textContent = '';

  productsToRender.forEach((product) => {
    container.append(createProductCard(product, sizes));
  });
}

function handleProductAction(event) {
  const button = event.target.closest('[data-action="add-to-cart"], [data-action="toggle-favorite"]');

  if (!button) {
    return;
  }

  const productId = Number(button.dataset.productId);
  const selectedProduct = findProductById(products, productId);

  if (!selectedProduct) {
    console.warn('Товар не найден:', productId);
    return;
  }

  if (button.dataset.action === 'add-to-cart') {
    if (addToCart(productId)) {
      showNotice(`«${selectedProduct.title}» в корзине: ${getCartQuantity(productId)} шт.`);
    } else {
      showNotice(`Больше ${MAX_QUANTITY} шт. одного товара добавить нельзя.`);
    }
    return;
  }

  const active = toggleFavorite(productId);

  document.querySelectorAll(`[data-action="toggle-favorite"][data-product-id="${productId}"]`).forEach((favoriteButton) => {
    updateFavoriteButton(favoriteButton, selectedProduct);
  });

  showNotice(active ? `«${selectedProduct.title}» добавлен в избранное.` : `«${selectedProduct.title}» убран из избранного.`);
  document.dispatchEvent(new CustomEvent('favorites-change'));
}

document.addEventListener('click', handleProductAction);

const popularContainer = document.querySelector('[data-popular-products]');

if (popularContainer) {
  renderProductList(popularContainer, products.filter((product) => product.isPopular), CARD_SIZES);
}

function renderRecommended(container) {
  const inCart = cart.map((item) => item.productId);
  const recommended = sortProducts(getAvailableProducts(products), 'rating-desc')
    .filter((product) => !inCart.includes(product.id))
    .slice(0, 3);

  renderProductList(container, recommended, CARD_SIZES);
}

const recommendedContainer = document.querySelector('[data-recommended-products]');

if (recommendedContainer) {
  renderRecommended(recommendedContainer);
}

const productsContainer = document.querySelector('[data-products-container]');

if (productsContainer) {
  const searchInput = document.querySelector('#catalog-search');
  const categoryFilter = document.querySelector('#category-filter');
  const sortSelect = document.querySelector('#sort-select');
  const onlyAvailableCheckbox = document.querySelector('#only-available');
  const onlyFavoritesCheckbox = document.querySelector('#only-favorites');
  const controlsForm = document.querySelector('.catalog-controls');
  const catalogCount = document.querySelector('.catalog-count');
  const catalogEmpty = document.querySelector('.catalog-empty');
  const emptyResetButton = document.querySelector('[data-empty-reset]');
  const emptyQuery = document.querySelector('[data-empty-query]');

  const defaultState = {
    query: '',
    category: 'all',
    sort: 'default',
    onlyAvailable: false,
    onlyFavorites: false,
  };

  const catalogState = { ...defaultState };

  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('category');
  const queryParam = params.get('q');

  if (categoryParam && Object.keys(categories).includes(categoryParam)) {
    catalogState.category = categoryParam;
  }

  if (queryParam) {
    catalogState.query = queryParam.slice(0, 50);
  }

  const focusControl = (control) => {
    if (control.offsetParent !== null) {
      control.focus();
    } else {
      catalogCount.focus();
    }
  };

  const setControls = () => {
    searchInput.value = catalogState.query;
    categoryFilter.value = catalogState.category;
    sortSelect.value = catalogState.sort;
    onlyAvailableCheckbox.checked = catalogState.onlyAvailable;
    onlyFavoritesCheckbox.checked = catalogState.onlyFavorites;
  };

  setControls();

  const syncUrl = () => {
    const url = new URL(window.location.href);

    url.searchParams.delete('category');
    url.searchParams.delete('q');

    if (catalogState.category !== 'all') {
      url.searchParams.set('category', catalogState.category);
    }

    if (catalogState.query.trim() !== '') {
      url.searchParams.set('q', catalogState.query.trim());
    }

    window.history.replaceState(null, '', url);
  };

  const renderProducts = (productsToRender) => {
    renderProductList(productsContainer, productsToRender, CATALOG_CARD_SIZES);
    catalogCount.textContent = `Найдено товаров: ${productsToRender.length} из ${products.length}`;
    catalogEmpty.hidden = productsToRender.length > 0;

    if (productsToRender.length === 0) {
      emptyQuery.textContent = catalogState.query.trim()
        ? `По запросу «${catalogState.query.trim()}» с выбранными условиями ничего нет.`
        : 'С выбранными условиями ничего нет.';
    }
  };

  const updateCatalog = () => {
    const preparedProducts = getPreparedProducts(products, catalogState);

    renderProducts(preparedProducts);
    syncUrl();
  };

  const resetCatalog = (category = 'all') => {
    Object.assign(catalogState, defaultState, { category });
    setControls();
    updateCatalog();
  };

  searchInput.addEventListener('input', (event) => {
    catalogState.query = event.target.value;
    updateCatalog();
  });

  categoryFilter.addEventListener('change', (event) => {
    catalogState.category = event.target.value;
    updateCatalog();
  });

  sortSelect.addEventListener('change', (event) => {
    catalogState.sort = event.target.value;
    updateCatalog();
  });

  onlyAvailableCheckbox.addEventListener('change', (event) => {
    catalogState.onlyAvailable = event.target.checked;
    updateCatalog();
  });

  onlyFavoritesCheckbox.addEventListener('change', (event) => {
    catalogState.onlyFavorites = event.target.checked;
    updateCatalog();
  });

  controlsForm.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  controlsForm.addEventListener('reset', (event) => {
    event.preventDefault();
    resetCatalog();
  });

  emptyResetButton.addEventListener('click', () => {
    resetCatalog();
    focusControl(searchInput);
  });

  catalogEmpty.addEventListener('click', (event) => {
    const categoryButton = event.target.closest('[data-empty-category]');

    if (!categoryButton) {
      return;
    }

    resetCatalog(categoryButton.dataset.emptyCategory);
    focusControl(categoryFilter);
  });

  document.addEventListener('favorites-change', () => {
    if (!catalogState.onlyFavorites) {
      return;
    }

    const focusedCard = document.activeElement.closest('.product-card');
    const index = focusedCard ? [...productsContainer.children].indexOf(focusedCard) : -1;

    updateCatalog();

    if (index >= 0) {
      const cards = productsContainer.children;

      if (cards.length > 0) {
        cards[Math.min(index, cards.length - 1)].querySelector('.product-card__favorite').focus();
      } else {
        catalogCount.focus();
      }
    }
  });

  updateCatalog();
}

const statsMessage = document.querySelector('.js-message');
const statsOutput = document.querySelector('.product-output');

if (statsMessage && statsOutput) {
  const topProduct = sortProducts(products, 'rating-desc')[0];
  const lines = [
    `Всего товаров: ${products.length}`,
    `Товаров в наличии: ${countAvailableProducts(products)}`,
    `Средняя цена: ${formatPrice(calculateAveragePrice(products))}`,
    `Лучший рейтинг: ${createProductSummary(topProduct)}`,
  ];

  statsMessage.textContent = 'Данные посчитаны JavaScript по массиву товаров.';
  statsOutput.textContent = lines.join('\n');
}
