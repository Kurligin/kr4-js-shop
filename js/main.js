const NOTICE_DURATION = 4000;

const noticeElement = document.createElement('p');
let noticeTimer = null;

noticeElement.classList.add('notice');
noticeElement.setAttribute('role', 'status');
document.body.append(noticeElement);

function showNotice(message) {
  noticeElement.textContent = message;
  noticeElement.classList.add('notice--visible');
  clearTimeout(noticeTimer);

  noticeTimer = setTimeout(() => {
    noticeElement.classList.remove('notice--visible');
  }, NOTICE_DURATION);
}

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.getElementById('site-nav');

if (menuToggle && siteNav) {
  const setMenuOpen = (isOpen) => {
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    siteNav.classList.toggle('site-nav--open', isOpen);
  };

  menuToggle.addEventListener('click', () => {
    setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteNav.classList.contains('site-nav--open')) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) {
      setMenuOpen(false);
    }
  });

  window.matchMedia('(min-width: 768px)').addEventListener('change', () => {
    setMenuOpen(false);
  });
}

const scrollTopLink = document.querySelector('.scroll-top');

if (scrollTopLink) {
  scrollTopLink.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0 });
    document.querySelector('.site-header__logo').focus({ preventScroll: true });
  });
}

const filtersToggle = document.querySelector('.filters-toggle');
const filtersPanel = document.getElementById('catalog-controls');

if (filtersToggle && filtersPanel) {
  const filtersToggleText = filtersToggle.querySelector('.filters-toggle__text');

  filtersToggle.addEventListener('click', () => {
    const isOpen = filtersToggle.getAttribute('aria-expanded') !== 'true';

    filtersToggle.setAttribute('aria-expanded', String(isOpen));
    filtersToggleText.textContent = isOpen ? 'Скрыть' : 'Показать';
    filtersPanel.classList.toggle('catalog-controls--open', isOpen);
  });
}
