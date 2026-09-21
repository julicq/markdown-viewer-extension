// Загрузка настоящих тем из репозитория.
//
// Тесты берут темы из src/themes, а не выдуманные объекты: пресеты - это часть
// поведения расширения, и проверка на самодельной теме пропустила бы поломку,
// вызванную правкой пресета.
import { readFileSync } from 'node:fs';

import themeManager from '../../src/utils/theme-manager.js';

const read = (rel) =>
  JSON.parse(readFileSync(new URL(`../../src/themes/${rel}`, import.meta.url), 'utf8'));

export const fontConfig = read('font-config.json');

/** Подключает конфигурацию шрифтов: без неё подстановка возвращает имя как есть. */
export function withFontConfig() {
  themeManager.fontConfig = fontConfig;
}

export function loadTheme(id = 'default') {
  return read(`presets/${id}.json`);
}

export function loadParts({ table = 'grid', code = 'light-clean',
                            spacing = 'standard' } = {}) {
  return [read(`table-styles/${table}.json`), read(`code-themes/${code}.json`),
          read(`spacing-schemes/${spacing}.json`)];
}

export const PRESETS = read('registry.json');
