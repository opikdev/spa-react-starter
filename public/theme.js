(() => {
  function storedTheme() {
    try {
      return localStorage.getItem('theme');
    } catch {
      return null;
    }
  }

  const theme = storedTheme();
  const dark =
    theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
})();
