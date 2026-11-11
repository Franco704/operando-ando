// Pruebas de los algoritmos contra los ejemplos de Silberschatz y de las diapositivas. Uso: node tests/so.test.js
const assert = require('assert');
global.window = { GUIDE: { h: { num: (v) => String(v) } } };
require('../js/labs/so.js');
const so = window.GUIDE.so;
const near = (a, b) => assert(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

// Planificación (Silberschatz 5.3): P1 24, P2 3, P3 3 en FCFS -> espera media 17; RR q=4 -> 5,66
let r = so.schedule([{ id: 'P1', arr: 0, burst: 24 }, { id: 'P2', arr: 0, burst: 3 }, { id: 'P3', arr: 0, burst: 3 }], 'fcfs');
near(r.avg.wait, 17);
r = so.schedule([{ id: 'P1', arr: 0, burst: 24 }, { id: 'P2', arr: 0, burst: 3 }, { id: 'P3', arr: 0, burst: 3 }], 'rr', 4);
near(r.avg.wait, 17 / 3);
// SJF: 6, 8, 7, 3 -> espera media 7
r = so.schedule([{ id: 'P1', arr: 0, burst: 6 }, { id: 'P2', arr: 0, burst: 8 }, { id: 'P3', arr: 0, burst: 7 }, { id: 'P4', arr: 0, burst: 3 }], 'sjf');
near(r.avg.wait, 7);
// SRTF: llegadas 0,1,2,3 con 8,4,9,5 -> espera media 6,5
r = so.schedule([{ id: 'P1', arr: 0, burst: 8 }, { id: 'P2', arr: 1, burst: 4 }, { id: 'P3', arr: 2, burst: 9 }, { id: 'P4', arr: 3, burst: 5 }], 'srtf');
near(r.avg.wait, 6.5);
// Prioridad: 10/3, 1/1, 2/4, 1/5, 5/2 -> espera media 8,2
r = so.schedule([{ id: 'P1', arr: 0, burst: 10, prio: 3 }, { id: 'P2', arr: 0, burst: 1, prio: 1 }, { id: 'P3', arr: 0, burst: 2, prio: 4 }, { id: 'P4', arr: 0, burst: 1, prio: 5 }, { id: 'P5', arr: 0, burst: 5, prio: 2 }], 'prio');
near(r.avg.wait, 8.2);
// CPU ociosa entre llegadas
r = so.schedule([{ id: 'A', arr: 0, burst: 2 }, { id: 'B', arr: 5, burst: 1 }], 'fcfs');
assert.deepStrictEqual(r.gantt.map((g) => g.id), ['A', null, 'B']);

// Sustitución de páginas (Silberschatz 9.4): cadena de 20 referencias, 3 marcos -> FIFO 15, OPT 9, LRU 12
const ref = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
assert.strictEqual(so.replace(ref, 3, 'fifo').faults, 15);
assert.strictEqual(so.replace(ref, 3, 'opt').faults, 9);
assert.strictEqual(so.replace(ref, 3, 'lru').faults, 12);
// Anomalía de Belady: FIFO con 3 marcos 9 fallos, con 4 marcos 10
const bel = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
assert.strictEqual(so.replace(bel, 3, 'fifo').faults, 9);
assert.strictEqual(so.replace(bel, 4, 'fifo').faults, 10);

// Disco (Silberschatz 12.4): cola 98 183 37 122 14 124 65 67, cabeza 53 -> FCFS 640, SSTF 236, SCAN hacia 0 = 236
const q = [98, 183, 37, 122, 14, 124, 65, 67];
assert.strictEqual(so.disk(q, 53, 'fcfs').total, 640);
assert.strictEqual(so.disk(q, 53, 'sstf').total, 236);
assert.strictEqual(so.disk(q, 53, 'scan', { dir: 'down' }).total, 236);
assert.strictEqual(so.disk(q, 53, 'look', { dir: 'up' }).total, (183 - 53) + (183 - 14));
assert.deepStrictEqual(so.disk(q, 53, 'cscan', { dir: 'up' }).path, [53, 65, 67, 98, 122, 124, 183, 199, 0, 14, 37]);
assert.deepStrictEqual(so.disk(q, 53, 'clook', { dir: 'up' }).path, [53, 65, 67, 98, 122, 124, 183, 14, 37]);

// Banquero (diapositivas cap. 7)
const avail = [3, 3, 2];
const max = [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]];
const alloc = [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]];
let s = so.safety(avail, max, alloc);
assert(s.safe);
assert.deepStrictEqual(s.need[0], [7, 4, 3]);
assert.deepStrictEqual(s.seq.slice(0, 3), [1, 3, 4]);
const r1 = so.request(avail, max, alloc, 1, [1, 0, 2]);
assert.strictEqual(r1.reason, 'seguro');
assert.strictEqual(so.request(r1.avail, max, r1.alloc, 4, [3, 3, 0]).reason, 'espera');
assert.strictEqual(so.request(r1.avail, max, r1.alloc, 0, [0, 2, 0]).reason, 'inseguro');

// Ajuste de huecos (Silberschatz ej. 8.16): huecos 100 500 200 300 600; pedidos 212 417 112 426
const H = [100, 500, 200, 300, 600], R = [212, 417, 112, 426];
assert.deepStrictEqual(so.fit(H, R, 'first').steps.map((x) => x.hole), [1, 4, 1, null]);
assert.deepStrictEqual(so.fit(H, R, 'best').steps.map((x) => x.hole), [3, 1, 2, 4]);
assert.deepStrictEqual(so.fit(H, R, 'worst').steps.map((x) => x.hole), [4, 1, 4, null]);

// Paginación y TLB (diapositivas cap. 8)
assert.deepStrictEqual(so.translate(13, 4, [5, 6, 1, 2]), { p: 3, d: 1, f: 2, valid: true, phys: 9 });
near(so.eatNoTlb(0.8, 100), 120);
near(so.eatNoTlb(0.99, 100), 101);

// fork(): fork(); fork(); printf -> 4 impresiones; for (i<3) fork() -> 8 procesos; if (fork()==0) {print} else {fork(); print}
assert.strictEqual(so.runFork(['fork', 'fork', { print: 'x' }]).out.length, 4);
assert.strictEqual(so.runFork([{ loop: 3, body: ['fork'] }]).procs, 8);
const f3 = so.runFork([{ ifChild: [{ print: 'hijo' }, 'exit'], ifParent: ['fork'] }, { print: 'fin' }]);
assert.strictEqual(f3.procs, 3);
assert.strictEqual(f3.out.filter((o) => o.t === 'fin').length, 2);

// Permisos
assert.strictEqual(so.octToSym('754'), 'rwxr-xr--');
assert.strictEqual(so.octToSym('1777'), 'rwxrwxrwt');
assert.strictEqual(so.octToSym('4755'), 'rwsr-xr-x');
assert.strictEqual(so.symToOct('rwxr-sr-x'), '2755');
assert.strictEqual(so.symToOct('rw-r-----'), '640');

// Inodo con bloques de 4 KB y punteros de 4 bytes: 12 + 1024 + 1024² + 1024³ bloques
assert.strictEqual(so.inodeMax(4096, 4).blocks, 12 + 1024 + 1024 ** 2 + 1024 ** 3);
assert.deepStrictEqual(so.raid('5', 4), { usable: 3, tolerates: 1, min: 3 });

// Abiertas
assert(so.checkOpen({ t: 'num', a: 0.75 }, '75 %').ok);
assert(so.checkOpen({ t: 'num', a: 6400 }, '6.400').ok);
console.log('so OK');
