// Тема в стили DOCX для экспорта.
//
// Ошибка здесь не видна на экране: документ выгружается и открывается в Word
// уже у получателя. Поэтому единицы и подстановка шрифтов проверяются числами.
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { PRESETS, fontConfig, loadParts, loadTheme, withFontConfig } from '../helpers/themes.js';

let themeToDOCXStyles;

before(async () => {
  withFontConfig();
  ({ themeToDOCXStyles } = await import('../../src/exporters/theme-to-docx.js'));
});

const build = (id = 'default') => themeToDOCXStyles(loadTheme(id), ...loadParts());

describe('стиль по умолчанию', () => {
  it('кегль тела хранится в полупунктах, как требует DOCX', () => {
    const theme = loadTheme('default');
    const pt = parseFloat(theme.fontScheme.body.fontSize);
    assert.equal(build().default.run.size, pt * 2);
  });

  it('шрифт разворачивается в четыре поля DOCX из конфигурации', () => {
    const source = fontConfig.fonts['Times New Roman'].docx;
    assert.deepEqual(build().default.run.font, {
      ascii: source.ascii, eastAsia: source.eastAsia,
      hAnsi: source.ascii, cs: source.ascii });
  });

  it('межстрочный интервал считается от кегля в двадцатых долях пункта', () => {
    const theme = loadTheme('default');
    const pt = parseFloat(theme.fontScheme.body.fontSize);
    const ratio = theme.fontScheme.body.lineHeight;
    assert.equal(build().default.paragraph.spacing.line, Math.round(pt * ratio * 20));
  });
});

describe('состав стилей', () => {
  it('есть стили заголовков с первого по шестой', () => {
    const styles = build().paragraphStyles;
    for (let level = 1; level <= 6; level += 1) {
      assert.ok(styles[`heading${level}`], `нет стиля heading${level}`);
    }
  });

  it('есть стиль кода и цвета подсветки', () => {
    const docx = build();
    assert.ok(docx.characterStyles.code, 'нет символьного стиля кода');
    assert.ok(docx.codeColors.background, 'нет фона блока кода');
    assert.ok(docx.codeColors.foreground, 'нет цвета текста кода');
  });

  it('рамки таблицы описаны со всех четырёх сторон', () => {
    const borders = build().tableStyles.borders;
    for (const side of ['top', 'bottom', 'left', 'right']) {
      assert.ok(borders[side], `нет рамки ${side}`);
      assert.match(borders[side].color, /^[0-9a-f]{6}$/i,
                   `цвет ${side} должен быть шестизначным hex без решётки: Word не примет иначе`);
    }
  });
});

describe('все пресеты из реестра', () => {
  it('преобразуются без исключения', () => {
    for (const entry of PRESETS.themes) {
      const docx = build(entry.id);
      assert.ok(docx.default.run.size > 0, `${entry.id}: нулевой кегль`);
      assert.ok(Number.isFinite(docx.default.paragraph.spacing.line),
                `${entry.id}: интервал не число`);
    }
  });

  it('не оставляют дробных значений там, где Word ждёт целые', () => {
    for (const entry of PRESETS.themes) {
      const spacing = build(entry.id).default.paragraph.spacing;
      for (const [key, value] of Object.entries(spacing)) {
        assert.ok(Number.isInteger(value),
                  `${entry.id}: ${key} = ${value}, а twips обязаны быть целыми`);
      }
    }
  });
});
