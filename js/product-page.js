const PRODUCT_IMAGE_SIZES = '(min-width: 1100px) 470px, (min-width: 768px) 45vw, calc(100vw - 32px)';
const COMPARE_ROWS = ['Форм-фактор', 'Корпус', 'Свитчи', 'Подключение'];

function createSpecsRows(product) {
  return Object.entries(product.specs).map(([name, value]) => {
    const row = document.createElement('tr');
    row.classList.add('specs-table__row');

    const header = document.createElement('th');
    header.classList.add('specs-table__th', 'specs-table__th--row');
    header.scope = 'row';
    header.textContent = name;

    const cell = document.createElement('td');
    cell.classList.add('specs-table__td');
    cell.textContent = value;

    row.append(header, cell);
    return row;
  });
}

function createCompareTable(keyboards) {
  const table = document.createElement('table');
  table.classList.add('specs-table', 'compare-table');
  table.setAttribute('role', 'table');

  const caption = document.createElement('caption');
  caption.classList.add('specs-table__caption');
  caption.textContent = 'Сравнение клавиатур KeyCraft';

  const head = document.createElement('thead');
  head.classList.add('specs-table__head');
  head.setAttribute('role', 'rowgroup');

  const headRow = document.createElement('tr');
  headRow.setAttribute('role', 'row');

  ['Параметр', ...keyboards.map((keyboard) => keyboard.title.replace('KeyCraft ', ''))].forEach((text) => {
    const th = document.createElement('th');
    th.classList.add('specs-table__th');
    th.scope = 'col';
    th.setAttribute('role', 'columnheader');
    th.textContent = text;
    headRow.append(th);
  });

  head.append(headRow);

  const body = document.createElement('tbody');
  body.setAttribute('role', 'rowgroup');

  const rows = COMPARE_ROWS.map((name) => ({ name, values: keyboards.map((keyboard) => keyboard.specs[name] || '—') }));
  rows.push({ name: 'Цена', values: keyboards.map((keyboard) => formatPrice(calculateFinalPrice(keyboard.price, keyboard.discountPercent))) });

  rows.forEach((rowData) => {
    const row = document.createElement('tr');
    row.classList.add('specs-table__row');
    row.setAttribute('role', 'row');

    const header = document.createElement('th');
    header.classList.add('specs-table__th', 'specs-table__th--row');
    header.scope = 'row';
    header.setAttribute('role', 'rowheader');
    header.textContent = rowData.name;
    row.append(header);

    rowData.values.forEach((value, index) => {
      const cell = document.createElement('td');
      cell.classList.add('specs-table__td');
      cell.setAttribute('role', 'cell');
      cell.dataset.label = keyboards[index].title.replace('KeyCraft ', '');
      cell.textContent = value;
      row.append(cell);
    });

    body.append(row);
  });

  table.append(caption, head, body);
  return table;
}

function createReview(review) {
  const article = document.createElement('article');
  article.classList.add('review');

  const author = document.createElement('h3');
  author.classList.add('review__author');
  author.textContent = review.author;

  const rating = document.createElement('p');
  rating.classList.add('review__rating');

  const stars = document.createElement('span');
  stars.classList.add('review__stars');
  stars.setAttribute('aria-hidden', 'true');
  stars.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

  const score = document.createElement('span');
  score.classList.add('review__score');
  score.textContent = `Оценка: ${review.rating} из 5`;

  rating.append(stars, score);

  const text = document.createElement('p');
  text.classList.add('review__text');
  text.textContent = review.text;

  const date = document.createElement('p');
  date.classList.add('review__date');
  date.textContent = review.date;

  article.append(author, rating, text, date);
  return article;
}

const productPage = document.querySelector('[data-product-page]');

if (productPage) {
  const productId = Number(new URLSearchParams(window.location.search).get('id') || 1);
  const product = findProductById(products, productId);
  const productTitle = document.querySelector('[data-product-title]');
  const crumb = document.querySelector('[data-product-crumb]');

  if (!product) {
    productTitle.textContent = 'Товар не найден';
    crumb.textContent = 'Товар не найден';
    document.title = 'Товар не найден — KeyCraft';
    document.querySelectorAll('[data-product-only]').forEach((element) => {
      element.hidden = true;
    });
    document.querySelector('[data-product-missing]').hidden = false;
  } else {
    document.title = `${product.title} — KeyCraft`;
    document.querySelector('meta[name="description"]').content = createProductSummary(product);
    crumb.textContent = product.title;
    productTitle.textContent = product.title;

    const media = document.querySelector('[data-product-media]');
    media.append(createProductPicture(product, 'product__image', PRODUCT_IMAGE_SIZES, false));

    const badge = getBadge(product);

    if (badge) {
      const badgeElement = document.createElement('span');
      badgeElement.classList.add('product__badge', `product-card__badge--${badge.modifier}`);
      badgeElement.textContent = badge.text;
      media.append(badgeElement);
    }

    document.querySelector('[data-product-category]').textContent = categories[product.category];
    document.querySelector('[data-product-rating]').replaceWith(createRatingElement(product, 'product__rating'));
    document.querySelector('[data-product-price]').replaceWith(createPriceElement(product, 'product__price'));
    document.querySelector('[data-product-description]').textContent = product.description;

    const features = document.querySelector('[data-product-features]');
    product.features.forEach((feature) => {
      const item = document.createElement('li');
      item.classList.add('product__highlight');
      item.textContent = feature;
      features.append(item);
    });

    const stock = document.querySelector('[data-product-stock]');
    stock.textContent = product.isAvailable ? `${getProductStatus(product)}, отправка в день заказа` : `${getProductStatus(product)}, ожидаем поставку`;
    stock.classList.toggle('product__stock--unavailable', !product.isAvailable);

    if (product.discountPercent > 0) {
      const saving = document.querySelector('[data-product-saving]');
      saving.textContent = `Экономия ${formatPrice(calculateDiscount(product.price, product.discountPercent))}`;
      saving.hidden = false;
    }

    const actions = document.querySelector('[data-product-actions]');
    const quickOrder = document.createElement('button');
    quickOrder.classList.add('button', 'button--secondary');
    quickOrder.type = 'button';
    quickOrder.dataset.action = 'quick-order';
    quickOrder.dataset.productId = String(product.id);
    quickOrder.textContent = 'Купить в один клик';
    quickOrder.disabled = !product.isAvailable;

    actions.append(
      createAddToCartButton(product, 'product__button'),
      quickOrder,
      createFavoriteButton(product, 'product__favorite'),
    );

    document.querySelector('[data-specs-caption]').textContent = `Характеристики: ${product.title}`;
    document.querySelector('[data-specs-body]').append(...createSpecsRows(product));

    const compareSection = document.querySelector('[data-compare-section]');

    if (product.category === 'keyboards') {
      const keyboards = filterProductsByCategory(products, 'keyboards');
      document.querySelector('[data-compare-wrapper]').append(createCompareTable(keyboards));
    } else {
      compareSection.hidden = true;
    }

    const reviewsList = document.querySelector('[data-reviews]');

    if (product.reviews.length > 0) {
      product.reviews.forEach((review) => {
        reviewsList.append(createReview(review));
      });
    } else {
      document.querySelector('[data-reviews-empty]').hidden = false;
    }

    const related = products.filter((item) => item.category === product.category && item.id !== product.id);
    const relatedContainer = document.querySelector('[data-related-products]');

    if (related.length > 0) {
      renderProductList(relatedContainer, related.slice(0, 3), CARD_SIZES);
    } else {
      document.querySelector('[data-related-section]').hidden = true;
    }
  }
}
