// Тема в CSS для просмотра в странице.
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { PRESETS, loadParts, loadTheme, withFontConfig } from '../helpers/themes.js';

let themeToCSS;

before(async () => {
  withFontConfig();
  ({ themeToCSS } = await import('../../src/utils/theme-to-css.js'));
});

const build = (id = 'default') => themeToCSS(loadTheme(id), ...loadParts());

describe('CSS темы', () => {
  it('кегль тела берётся из темы и переводится в пиксели', () => {
    const theme = loadTheme('default');
    const css = themeToCSS(theme, ...loadParts());
    const pt = parseFloat(theme.fontScheme.body.fontSize);
    assert.ok(css.includes(`font-size: ${pt * 4 / 3}px`),
              'кегль тела должен появиться в CSS');
  });

  it('шрифт разворачивается в цепочку запасных, а не в одно имя', () => {
    const css = build();
    assert.ok(css.includes("'Times New Roman', Times, Georgia, serif"),
              'нужна цепочка из font-config, иначе на чужой машине шрифт не тот');
  });

  it('заголовки получают свои правила', () => {
    const css = build();
    for (const level of ['h1', 'h2', 'h3']) {
      assert.ok(css.includes(`#markdown-content ${level} {`), `нет правил для ${level}`);
    }
  });

  it('правила ограничены областью расширения, кроме одного известного', () => {
    const css = build();
    // Разбор блоками, а не регуляркой по строкам: селектор может занимать
    // несколько строк, и построчное совпадение утаскивает объявления из
    // предыдущего блока.
    const selectors = css.split('}')
      .map((block) => block.split('{')[0].trim())
      .filter((s) => s.length && !s.startsWith('/*'));
    const leaked = selectors.filter((s) => !s.includes('#markdown-content'));
    // `.katex` в theme-to-css.js:52 выписан без области. Остальные 43 селектора
    // под `#markdown-content`. Тест закрепляет текущее положение, а не одобряет
    // его: если правило ограничат областью, этот список станет пустым, и тест
    // подскажет, что ожидание пора менять.
    assert.deepEqual(leaked, ['.katex'],
                     'появился новый селектор без области видимости');
  });

  it('рамки таблицы приходят из выбранного стиля', () => {
    const [table] = loadParts({ table: 'grid' });
    const css = themeToCSS(loadTheme(), table, ...loadParts().slice(1));
    assert.ok(css.includes('#markdown-content table'), 'нет правил таблицы');
  });
});

describe('все пресеты из реестра', () => {
  it('преобразуются без исключения и дают непустой CSS', () => {
    for (const entry of PRESETS.themes) {
      const css = build(entry.id);
      assert.equal(typeof css, 'string', `${entry.id}: не строка`);
      assert.ok(css.length > 500, `${entry.id}: подозрительно короткий CSS`);
    }
  });

  it('не оставляют undefined и NaN в значениях', () => {
    for (const entry of PRESETS.themes) {
      const css = build(entry.id);
      assert.ok(!css.includes('undefined'), `${entry.id}: undefined в CSS`);
      assert.ok(!css.includes('NaN'), `${entry.id}: NaN в CSS`);
    }
  });
});
