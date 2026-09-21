// Минимальный DOM для модулей, которые в браузере работают с document.
//
// Санитайзер разбирает разметку через <template> и обходит дерево узлов, так
// что без настоящего DOM его не проверить: подмена своей реализацией
// проверяла бы подделку, а не код.
//
// jsdom закреплён на 24: в свежих версиях зависимость @asamuzakjp/css-color
// требует ES-модуль из CommonJS и падает на Node 20. Прежде чем поднимать
// версию, проверьте, что `npm test` проходит на той Node, что стоит в CI.
//
// linkedom для этой задачи не годится, хотя и легче: у него template.content и
// template.innerHTML живут раздельно, поэтому удаление узла из content не
// видно в innerHTML, и санитайзер выглядит сломанным, не будучи таким.
import { JSDOM } from 'jsdom';

export function installDOM(html = '<html><body></body></html>') {
  const dom = new JSDOM(html);
  globalThis.document = dom.window.document;
  globalThis.Node = dom.window.Node;
  globalThis.HTMLElement = dom.window.HTMLElement;
  return dom.window.document;
}
