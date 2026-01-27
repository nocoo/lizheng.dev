// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

themeToggle.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Set current year in footer
const copyrightEl = document.getElementById('copyright');
if (copyrightEl) {
  const year = new Date().getFullYear();
  const lang = document.documentElement.lang;
  copyrightEl.textContent = lang === 'zh' 
    ? `© ${year} 李征. 保留所有权利。`
    : `© ${year} Zheng Li. All rights reserved.`;
}
