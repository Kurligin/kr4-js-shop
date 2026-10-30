const FAVORITES_STORAGE_KEY = 'keycraft-favorites';

function loadFavorites() {
  const saved = readStorage(FAVORITES_STORAGE_KEY, []);

  if (!Array.isArray(saved)) {
    return [];
  }

  return saved.filter((id) => findProductById(products, id));
}

let favoriteIds = loadFavorites();

function isFavorite(productId) {
  return favoriteIds.includes(productId);
}

function toggleFavorite(productId) {
  if (isFavorite(productId)) {
    favoriteIds = favoriteIds.filter((id) => id !== productId);
  } else {
    favoriteIds = [...favoriteIds, productId];
  }

  writeStorage(FAVORITES_STORAGE_KEY, favoriteIds);
  return isFavorite(productId);
}
