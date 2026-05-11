const STORAGE_KEY = 'theme'; // 'light' | 'dark' | 'system'

export function getThemePreference() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export function getResolvedTheme(pref = getThemePreference()) {
  if (pref === 'light' || pref === 'dark') return pref;
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function applyThemePreference(pref = getThemePreference()) {
  const resolved = getResolvedTheme(pref);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePref = pref;
}

export function setThemePreference(pref) {
  localStorage.setItem(STORAGE_KEY, pref);
  applyThemePreference(pref);
}

export function initTheme() {
  applyThemePreference(getThemePreference());

  // If user chooses "system", keep theme in sync with OS changes.
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (!mq || !mq.addEventListener) return;

  const onChange = () => {
    if (getThemePreference() === 'system') applyThemePreference('system');
  };

  mq.addEventListener('change', onChange);
}

