// Очистка HTML перед вставкой в страницу.
//
// Самое ценное место для тестов во всём расширении: сюда приходит содержимое
// чужого файла, а уходит - разметка, которую страница исполнит. Ошибка здесь
// не портит вид, а даёт чужому markdown выполнить код.
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { installDOM } from '../helpers/dom.js';

let sanitizeHtml, hasHtmlContent, sanitizeAndCheck;

before(async () => {
  installDOM();
  ({ sanitizeHtml, hasHtmlContent, sanitizeAndCheck } =
    await import('../../src/utils/html-sanitizer.js'));
});

describe('опасная разметка вычищается', () => {
  it('скрипт удаляется, соседний текст остаётся', () => {
    assert.equal(sanitizeHtml('<p>привет</p><script>alert(1)</script>'),
                 '<p>привет</p>');
  });

  it('вложенный скрипт находится не только на верхнем уровне', () => {
    assert.equal(sanitizeHtml('<div><p>ok</p><span><script>bad()</script></span></div>'),
                 '<div><p>ok</p><span></span></div>');
  });

  it('встраиваемые узлы вырезаются целиком', () => {
    for (const tag of ['iframe', 'object', 'embed', 'audio', 'video']) {
      const got = sanitizeHtml(`<div><${tag} src="x"></${tag}><b>цел</b></div>`);
      assert.equal(got, '<div><b>цел</b></div>', `${tag} должен быть удалён`);
    }
  });

  it('обработчики событий снимаются, а сам узел живёт', () => {
    assert.equal(sanitizeHtml('<button onclick="alert(1)">кнопка</button>'),
                 '<button>кнопка</button>');
  });

  it('ссылка на javascript: теряет адрес, а не текст', () => {
    assert.equal(sanitizeHtml('<a href="javascript:alert(1)">ссылка</a>'),
                 '<a>ссылка</a>');
  });

  it('регистр и пробелы в javascript: не спасают ссылку', () => {
    assert.equal(sanitizeHtml('<a href="  JavaScript:alert(1)">с</a>'), '<a>с</a>');
  });

  it('комментарии удаляются: в них прячут разметку', () => {
    assert.equal(sanitizeHtml('<!-- секрет --><p>текст</p>'), '<p>текст</p>');
  });
});

describe('безопасная разметка не портится', () => {
  it('обычная ссылка сохраняет адрес', () => {
    assert.equal(sanitizeHtml('<a href="https://ok.example">ок</a>'),
                 '<a href="https://ok.example">ок</a>');
  });

  it('разметка форматирования и таблицы проходит насквозь', () => {
    const html = '<table><tr><td><em>a</em></td><td><strong>b</strong></td></tr></table>';
    assert.ok(sanitizeHtml(html).includes('<em>a</em>'));
    assert.ok(sanitizeHtml(html).includes('<strong>b</strong>'));
  });
});

describe('проверка на содержимое', () => {
  it('пробелы содержимым не считаются', () => {
    assert.equal(hasHtmlContent('   '), false);
    assert.equal(hasHtmlContent(''), false);
  });

  it('пустой узел считается содержимым: он влияет на вёрстку', () => {
    assert.equal(hasHtmlContent('<p></p>'), true);
  });

  it('текст без разметки считается содержимым', () => {
    assert.equal(hasHtmlContent('просто текст'), true);
  });
});

describe('очистка с проверкой за один шаг', () => {
  it('строка из одних переносов отбрасывается без разбора', () => {
    assert.deepEqual(sanitizeAndCheck('<br><br>'),
                     { sanitized: '', hasContent: false });
    assert.deepEqual(sanitizeAndCheck('<br/>&nbsp;<br />'),
                     { sanitized: '', hasContent: false });
  });

  it('содержательная разметка проходит очистку и признаётся непустой', () => {
    assert.deepEqual(sanitizeAndCheck('<p>текст</p><script>x</script>'),
                     { sanitized: '<p>текст</p>', hasContent: true });
  });
});
