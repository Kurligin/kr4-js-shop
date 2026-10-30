function readStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);

    if (savedValue === null) {
      return fallback;
    }

    return JSON.parse(savedValue);
  } catch (error) {
    localStorage.removeItem(key);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Не удалось сохранить данные в localStorage:', key);
  }
}
