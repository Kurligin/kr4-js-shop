const orderDialog = document.getElementById('order-dialog');

if (orderDialog) {
  const dialogForm = orderDialog.querySelector('form');
  const dialogProduct = document.getElementById('order-dialog-product');
  const selectedProductInput = document.getElementById('selected-product');

  const openOrderDialog = (product) => {
    resetFormState(dialogForm);

    if (product) {
      selectedProductInput.value = product.title;
      dialogProduct.textContent = `Товар: ${product.title}, ${formatPrice(calculateFinalPrice(product.price, product.discountPercent))}`;
      dialogProduct.hidden = false;
    } else {
      selectedProductInput.value = '';
      dialogProduct.hidden = true;
    }

    orderDialog.showModal();
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="quick-order"], [data-action="consultation"]');

    if (!button) {
      return;
    }

    if (button.dataset.action === 'quick-order') {
      openOrderDialog(findProductById(products, Number(button.dataset.productId)));
    } else {
      openOrderDialog(null);
    }
  });

  orderDialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      orderDialog.close();
    });
  });

  const isOutsideDialog = (event) => {
    const rect = orderDialog.getBoundingClientRect();

    return event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom;
  };

  let pressedOutside = false;

  orderDialog.addEventListener('mousedown', (event) => {
    pressedOutside = isOutsideDialog(event);
  });

  orderDialog.addEventListener('click', (event) => {
    if (event.detail > 0 && pressedOutside && isOutsideDialog(event)) {
      orderDialog.close();
    }

    pressedOutside = false;
  });
}
