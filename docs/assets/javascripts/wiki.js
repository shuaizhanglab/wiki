(() => {
  const menu = document.getElementById('mobile-menu');
  const sidebar = document.getElementById('app-sidebar');
  const close = () => { sidebar?.classList.remove('is-open'); menu?.setAttribute('aria-expanded', 'false'); };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); sidebar?.classList.toggle('is-open', open);
  });
  sidebar?.addEventListener('click', event => { if (event.target.closest('a,button[data-category]')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  const language = document.getElementById('document-language-select');
  language?.addEventListener('change', () => {
    const destination = language.value === 'en' ? language.dataset.en : language.dataset.zh;
    if (destination) window.location.assign(destination);
  });
})();
