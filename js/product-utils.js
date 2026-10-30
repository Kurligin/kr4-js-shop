function formatPrice(price) {
  return `${price.toLocaleString('ru-RU')} руб.`;
}

function calculateDiscount(price, discountPercent) {
  return Math.round(price * discountPercent / 100);
}

function calculateFinalPrice(price, discountPercent) {
  const discountValue = calculateDiscount(price, discountPercent);

  return price - discountValue;
}

function getProductStatus(product) {
  if (product.isAvailable) {
    return 'В наличии';
  }

  return 'Нет в наличии';
}

function createProductSummary(product) {
  const finalPrice = calculateFinalPrice(product.price, product.discountPercent);
  const status = getProductStatus(product);

  return `${product.title} — ${formatPrice(finalPrice)}, ${status.toLowerCase()}.`;
}

function getProductTitles(products) {
  return products.map((product) => product.title);
}

function getAvailableProducts(products) {
  return products.filter((product) => product.isAvailable);
}

function searchProducts(products, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery === '') {
    return products;
  }

  return products.filter((product) => product.title.toLowerCase().includes(normalizedQuery));
}

function filterProductsByCategory(products, category) {
  if (category === 'all') {
    return products;
  }

  return products.filter((product) => product.category === category);
}

function sortProducts(products, sortType) {
  const productsCopy = [...products];

  if (sortType === 'price-asc') {
    return productsCopy.sort((a, b) => calculateFinalPrice(a.price, a.discountPercent) - calculateFinalPrice(b.price, b.discountPercent));
  }

  if (sortType === 'price-desc') {
    return productsCopy.sort((a, b) => calculateFinalPrice(b.price, b.discountPercent) - calculateFinalPrice(a.price, a.discountPercent));
  }

  if (sortType === 'title-asc') {
    return productsCopy.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  }

  if (sortType === 'rating-desc') {
    return productsCopy.sort((a, b) => b.rating - a.rating);
  }

  return productsCopy;
}

function findProductById(products, id) {
  return products.find((product) => product.id === id);
}

function calculateTotalPrice(products) {
  return products.reduce((sum, product) => sum + product.price, 0);
}

function countAvailableProducts(products) {
  return getAvailableProducts(products).length;
}

function calculateAveragePrice(products) {
  if (products.length === 0) {
    return 0;
  }

  return Math.round(calculateTotalPrice(products) / products.length);
}

function getPreparedProducts(products, state) {
  let result = [...products];

  result = searchProducts(result, state.query);
  result = filterProductsByCategory(result, state.category);

  if (state.onlyAvailable) {
    result = getAvailableProducts(result);
  }

  if (state.onlyFavorites) {
    result = result.filter((product) => isFavorite(product.id));
  }

  return sortProducts(result, state.sort);
}

function getProductImage(product, width, format) {
  return `images/products/${product.image}-${width}.${format}`;
}
