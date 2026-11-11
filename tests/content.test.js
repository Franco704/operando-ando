// Autocomprobación del contenido: carga todos los temas y valida su estructura. Uso: node tests/content.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
global.window = {};
const files = ['content/_helpers', 'labs/core', 'labs/so', 'labs/labs', 'labs/shell', ...fs.readdirSync(path.join(__dirname, '../js/content')).filter((f) => /^\d\d-.*\.js$/.test(f)).sort().map((f) => `content/${f.slice(0, -3)}`), 'content/formulas'];
files.forEach((f) => fs.existsSync(path.join(__dirname, `../js/${f}.js`)) && require(`../js/${f}.js`));
const { LESSONS, MODULES, LABS, FORMULAS = [], st } = window.GUIDE;
const ids = new Set();
for (const l of LESSONS) {
  assert(!ids.has(l.id), `id repetido ${l.id}`); ids.add(l.id);
  assert(MODULES.some((m) => m.id === l.module), `módulo inexistente en ${l.id}`);
  assert(l.title && l.tldr && l.body, `lección incompleta ${l.id}`);
  for (const c of l.labs || []) assert(LABS[c.type], `lab ${c.type} en ${l.id}`);
  for (const q of l.quiz || []) {
    assert(q.a >= 0 && q.a < q.o.length && q.e, `respuesta fuera de rango o sin explicación en ${l.id}: ${q.q}`);
    assert(new Set(q.o).size === q.o.length, `opciones repetidas en ${l.id}: ${q.q}`);
  }
  for (const q of l.open || []) {
    assert(['num', 'text'].includes(q.t) && q.q && q.e, `abierta mal formada en ${l.id}: ${q.q}`);
    if (q.t === 'num') { assert(Number.isFinite(q.a), `abierta numérica sin a en ${l.id}: ${q.q}`); assert(st.checkOpen(q, String(q.a).replace('.', ',')).ok, `la respuesta propia no valida en ${l.id}: ${q.q}`); }
    if (q.t === 'text') { assert(Array.isArray(q.k) && q.k.every((g) => Array.isArray(g) && g.length), `conceptos mal en ${l.id}`); const need = q.need ?? (q.k.length <= 2 ? q.k.length : q.k.length - 1); assert(need <= q.k.length, `need > conceptos en ${l.id}`); assert(st.checkOpen(q, q.k.map((g) => g[0]).join(' ') + ' respuesta completa').ok, `los conceptos no validan en ${l.id}: ${q.q}`); }
  }
  for (const e of l.exercises || []) assert(!e.official || /^(\d+|ES)\.\w+$/.test(e.official), `official mal en ${l.id}`);
  const placed = [...l.body.matchAll(/data-lab="(\d+)"/g)].map((m) => +m[1]);
  placed.forEach((i) => assert(l.labs && l.labs[i], `lab(${i}) sin definir en ${l.id}`));
  assert(!/NaN|undefined|Infinity|\[object Object\]/.test(l.body + JSON.stringify(l.exercises || []) + JSON.stringify(l.open || []) + JSON.stringify(l.quiz || [])), `NaN/undefined en ${l.id}`);
}
FORMULAS.forEach((f) => assert(MODULES.some((m) => m.id === f.m), `fórmula con módulo inexistente ${f.n}`));
const empty = MODULES.filter((m) => !LESSONS.some((l) => l.module === m.id)).map((m) => m.id);
if (process.argv.includes('--strict')) assert(!empty.length, `módulos sin lecciones: ${empty}`);
const n = (k) => LESSONS.reduce((a, l) => a + (l[k]?.length || 0), 0);
// Sesgo de la respuesta correcta: no debería ser casi siempre la opción más larga
const qs = LESSONS.flatMap((l) => l.quiz || []);
const longest = qs.filter((q) => q.o[q.a].length === Math.max(...q.o.map((o) => o.length))).length;
console.log(`contenido OK: ${LESSONS.length} lecciones, ${n('labs')} laboratorios, ${n('quiz')} preguntas, ${n('open')} abiertas, ${n('exercises')} ejercicios (${LESSONS.reduce((a, l) => a + (l.exercises || []).filter((e) => e.official).length, 0)} de los TP)`);
assert(longest / qs.length < 0.35, `la correcta es la más larga en ${Math.round((longest / qs.length) * 100)} % de las preguntas: se adivina por el largo`);
console.log(`la correcta es la opción más larga en ${longest} de ${qs.length} (${Math.round((longest / qs.length) * 100)} %)${empty.length ? `; módulos sin lecciones: ${empty.join(', ')}` : ''}`);
