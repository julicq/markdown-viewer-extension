// Преобразования единиц и подстановка шрифтов.
//
// Единицы выбраны первой целью намеренно: это самое дешёвое место для ошибки
// на множитель, и самое дорогое по последствиям. Неверный twips не падает, а
// молча сдвигает интервалы во всём экспортированном документе.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it, beforeEach } from 'node:test';

import themeManager from '../../src/utils/theme-manager.js';

const fontConfig = JSON.parse(
  readFileSync(new URL('../../src/themes/font-config.json', import.meta.url), 'utf8'));

describe('преобразование размеров', () => {
  it('пункты в пиксели идут через 4/3, как при 96 DPI', () => {
    assert.equal(themeManager.ptToPx('12pt'), '16px');
    assert.equal(themeManager.ptToPx('9pt'), '12px');
  });

  it('пункты в полупункты удваиваются: DOCX хранит кегль так', () => {
    assert.equal(themeManager.ptToHalfPt('12pt'), 24);
    assert.equal(themeManager.ptToHalfPt('10.5pt'), 21);
  });

  it('пункт равен двадцати twips, дробь округляется', () => {
    assert.equal(themeManager.ptToTwips('13pt'), 260);
    assert.equal(themeManager.ptToTwips('10.5pt'), 210);
    assert.equal(themeManager.ptToTwips('0.55pt'), 11);
  });

  it('единица измерения в строке не обязательна', () => {
    assert.equal(themeManager.ptToHalfPt('12'), 24);
    assert.equal(themeManager.ptToTwips(13), 260);
  });
});

describe('подстановка шрифтов без загруженной конфигурации', () => {
  beforeEach(() => { themeManager.fontConfig = null; });

  it('веб-шрифт возвращается как есть, а не пустой строкой', () => {
    assert.equal(themeManager.getFontFallback('Arial'), 'Arial');
    assert.equal(themeManager.buildFontFamily('Arial'), 'Arial');
  });

  it('для DOCX заполняются все четыре поля одним именем', () => {
    assert.deepEqual(themeManager.getDocxFont('Arial'), {
      ascii: 'Arial', eastAsia: 'Arial', hAnsi: 'Arial', cs: 'Arial' });
  });
});

describe('подстановка шрифтов с конфигурацией', () => {
  beforeEach(() => { themeManager.fontConfig = fontConfig; });

  it('известный шрифт разворачивается в цепочку запасных', () => {
    const chain = themeManager.getFontFallback('Times New Roman');
    assert.equal(chain, fontConfig.fonts['Times New Roman'].webFallback);
    assert.ok(chain.includes('serif'), 'в цепочке должен остаться родовой шрифт');
  });

  it('незнакомый шрифт не роняет разбор и возвращается как есть', () => {
    assert.equal(themeManager.getFontFallback('Неизвестный Шрифт'),
                 'Неизвестный Шрифт');
  });

  it('hAnsi и cs берутся из ascii: в конфигурации их нет', () => {
    const docx = themeManager.getDocxFont('Times New Roman');
    const source = fontConfig.fonts['Times New Roman'].docx;
    assert.equal(docx.ascii, source.ascii);
    assert.equal(docx.eastAsia, source.eastAsia);
    assert.equal(docx.hAnsi, source.ascii);
    assert.equal(docx.cs, source.ascii);
  });

  it('нечистовой ввод не притворяется именем шрифта', () => {
    assert.equal(themeManager.buildFontFamily(null), null);
    assert.equal(themeManager.buildFontFamily(42), 42);
  });
});
