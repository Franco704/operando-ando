/* Algoritmos de la materia, puros (sin DOM), para que los laboratorios y las pruebas usen el mismo código:
   planificación de CPU, sustitución de páginas, planificación de disco, banquero, ajuste de huecos, traducción de direcciones,
   simulador de fork() y corrección de preguntas abiertas. Expone window.GUIDE.so */
(() => {
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // ---------- Planificación de CPU ----------
  // procs: [{ id, arr, burst, prio? }]  algo: fcfs | sjf | srtf | prio | prioP | rr  (prioridad: número menor = más prioridad)
  // Devuelve { gantt: [{ id|null, s, e }], rows: [{ id, arr, burst, fin, ta, wait, resp }], avg: { ta, wait, resp } }
  function schedule(procs, algo, q = 2) {
    const P = procs.map((p, i) => ({ ...p, i, left: p.burst, start: null, fin: null }));
    const gantt = [];
    const push = (id, s, e) => { if (e <= s) return; const last = gantt.at(-1); if (last && last.id === id && last.e === s) last.e = e; else gantt.push({ id, s, e }); };
    let t = 0;
    const done = () => P.every((p) => p.left === 0);
    const key = {
      fcfs: (p) => [p.arr, p.i], sjf: (p) => [p.left, p.arr, p.i], srtf: (p) => [p.left, p.arr, p.i],
      prio: (p) => [p.prio ?? 0, p.arr, p.i], prioP: (p) => [p.prio ?? 0, p.arr, p.i],
    };
    const cmp = (f) => (a, b) => { const x = f(a), y = f(b); for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] - y[k]; return 0; };
    if (algo === 'rr') {
      const queue = [];
      const arrived = new Set();
      const admit = (upto) => P.filter((p) => !arrived.has(p) && p.arr <= upto).sort(cmp(key.fcfs)).forEach((p) => { arrived.add(p); queue.push(p); });
      admit(t);
      while (!done()) {
        if (!queue.length) { const nx = Math.min(...P.filter((p) => !arrived.has(p)).map((p) => p.arr)); push(null, t, nx); t = nx; admit(t); continue; }
        const p = queue.shift();
        if (p.start == null) p.start = t;
        const run = Math.min(q, p.left);
        push(p.id, t, t + run);
        t += run; p.left -= run;
        admit(t);   // los que llegaron durante el cuanto entran antes que el expulsado
        if (p.left) queue.push(p); else p.fin = t;
      }
    } else {
      const preempt = algo === 'srtf' || algo === 'prioP';
      while (!done()) {
        const ready = P.filter((p) => p.left && p.arr <= t).sort(cmp(key[algo]));
        if (!ready.length) { const nx = Math.min(...P.filter((p) => p.left).map((p) => p.arr)); push(null, t, nx); t = nx; continue; }
        const p = ready[0];
        if (p.start == null) p.start = t;
        // Apropiativo: corre hasta la próxima llegada (donde puede cambiar la decisión) o hasta terminar
        const nextArr = Math.min(...P.filter((x) => x.arr > t).map((x) => x.arr), Infinity);
        const run = preempt ? Math.min(p.left, nextArr - t) : p.left;
        push(p.id, t, t + run);
        t += run; p.left -= run;
        if (!p.left) p.fin = t;
      }
    }
    const rows = P.map((p) => ({ id: p.id, arr: p.arr, burst: p.burst, prio: p.prio, fin: p.fin, ta: p.fin - p.arr, wait: p.fin - p.arr - p.burst, resp: p.start - p.arr }));
    const avg = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
    return { gantt, rows, avg: { ta: avg('ta'), wait: avg('wait'), resp: avg('resp') }, switches: gantt.filter((g) => g.id).length - 1 };
  }

  // ---------- Sustitución de páginas ----------
  // algo: fifo | opt | lru. Devuelve { steps: [{ ref, frames, fault, victim }], faults }
  function replace(refs, nFrames, algo) {
    const frames = [];       // contenido de cada marco (posición fija, como en las tablas del libro)
    const loaded = [];       // orden de carga (FIFO)
    const lastUse = {};
    const steps = [];
    refs.forEach((r, t) => {
      let fault = false, victim = null;
      if (!frames.includes(r)) {
        fault = true;
        if (frames.length < nFrames) frames.push(r);
        else {
          let v;
          if (algo === 'fifo') v = loaded[0];
          else if (algo === 'lru') v = frames.reduce((a, b) => (lastUse[a] <= lastUse[b] ? a : b));
          else {
            // Óptimo: la que se usará más lejos en el futuro (o nunca); empate: la que se cargó primero
            const nextUse = (p) => { const k = refs.indexOf(p, t + 1); return k === -1 ? Infinity : k; };
            v = [...loaded].sort((a, b) => nextUse(b) - nextUse(a))[0];
          }
          victim = v;
          frames[frames.indexOf(v)] = r;
          loaded.splice(loaded.indexOf(v), 1);
        }
        loaded.push(r);
      }
      lastUse[r] = t;
      steps.push({ ref: r, frames: [...frames], fault, victim });
    });
    return { steps, faults: steps.filter((s) => s.fault).length };
  }

  // ---------- Planificación de disco ----------
  // algo: fcfs | sstf | scan | cscan | look | clook. dir: 'up' (hacia max) o 'down' (hacia 0).
  // Devuelve { path: [cabeza, ...], total } (en C-SCAN y C-LOOK el salto de regreso se cuenta en total y se marca en jumps)
  function disk(reqs, head, algo, { max = 199, dir = 'up' } = {}) {
    const path = [head];
    const jumps = [];
    let pending = [...reqs];
    if (algo === 'fcfs') path.push(...pending);
    else if (algo === 'sstf') {
      let h = head;
      while (pending.length) {
        const nx = pending.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a));
        path.push(nx); pending.splice(pending.indexOf(nx), 1); h = nx;
      }
    } else {
      const up = pending.filter((r) => r >= head).sort((a, b) => a - b);
      const down = pending.filter((r) => r < head).sort((a, b) => b - a);
      const [first, second] = dir === 'up' ? [up, down] : [down, up];
      const edge = dir === 'up' ? max : 0, other = dir === 'up' ? 0 : max;
      path.push(...first);
      if (second.length) {
        if (algo === 'scan') { if (path.at(-1) !== edge) path.push(edge); path.push(...second); }
        if (algo === 'look') path.push(...second);
        if (algo === 'cscan') { if (path.at(-1) !== edge) path.push(edge); jumps.push(path.length); path.push(other, ...[...second].reverse()); }
        if (algo === 'clook') { jumps.push(path.length); path.push(...[...second].reverse()); }
      }
    }
    let total = 0;
    for (let i = 1; i < path.length; i++) total += Math.abs(path[i] - path[i - 1]);
    const jumpDist = jumps.reduce((a, j) => a + Math.abs(path[j] - path[j - 1]), 0);
    return { path, total, jumps, noJump: total - jumpDist };
  }

  // ---------- Algoritmo del banquero ----------
  const vle = (a, b) => a.every((x, j) => x <= b[j]);
  const vadd = (a, b) => a.map((x, j) => x + b[j]);
  const vsub = (a, b) => a.map((x, j) => x - b[j]);
  function safety(avail, max, alloc) {
    const need = max.map((r, i) => vsub(r, alloc[i]));
    let work = [...avail];
    const fin = alloc.map(() => false);
    const seq = [], steps = [];
    let progress = true;
    while (progress) {
      progress = false;
      for (let i = 0; i < alloc.length; i++) {
        if (!fin[i] && vle(need[i], work)) {
          steps.push({ i, work: [...work], after: vadd(work, alloc[i]) });
          work = vadd(work, alloc[i]); fin[i] = true; seq.push(i); progress = true;
        }
      }
    }
    return { need, safe: fin.every(Boolean), seq, steps, work };
  }
  // Solicitud de Pi: devuelve { ok, reason, state? }
  function request(avail, max, alloc, i, req) {
    const need = vsub(max[i], alloc[i]);
    if (!vle(req, need)) return { ok: false, reason: 'excede' };
    if (!vle(req, avail)) return { ok: false, reason: 'espera' };
    const a2 = alloc.map((r, k) => (k === i ? vadd(r, req) : [...r]));
    const av2 = vsub(avail, req);
    const s = safety(av2, max, a2);
    return { ok: s.safe, reason: s.safe ? 'seguro' : 'inseguro', avail: av2, alloc: a2, safety: s };
  }

  // ---------- Asignación contigua: primer, mejor y peor ajuste ----------
  // holes: tamaños de huecos libres; reqs: tamaños pedidos. Devuelve { steps: [{ req, hole|null, holes }] }
  function fit(holes, reqs, algo) {
    const H = [...holes];
    const steps = reqs.map((r) => {
      const ok = H.map((h, i) => ({ h, i })).filter((x) => x.h >= r);
      let pick = null;
      if (ok.length) pick = algo === 'first' ? ok[0] : algo === 'best' ? ok.reduce((a, b) => (b.h < a.h ? b : a)) : ok.reduce((a, b) => (b.h > a.h ? b : a));
      if (pick) H[pick.i] -= r;
      return { req: r, hole: pick ? pick.i : null, holes: [...H] };
    });
    return { steps, failed: steps.filter((s) => s.hole === null).length };
  }

  // ---------- Paginación ----------
  const log2 = (n) => Math.log2(n);
  function translate(addr, pageSize, table) {
    const p = Math.floor(addr / pageSize), d = addr % pageSize;
    const f = table[p];
    return { p, d, f, valid: f != null && f >= 0, phys: f != null && f >= 0 ? f * pageSize + d : null };
  }
  // Tiempo de acceso efectivo con TLB (fórmula de las diapositivas: el acceso a TLB se suma en ambos casos)
  const eat = (hit, tlb, mem) => hit * (tlb + mem) + (1 - hit) * (tlb + 2 * mem);
  // Variante sin contar el tiempo de TLB (la usada en el ejemplo numérico de las diapositivas)
  const eatNoTlb = (hit, mem) => hit * mem + (1 - hit) * 2 * mem;

  // ---------- Simulador de fork() ----------
  // Programa: lista de sentencias: 'fork' | { print: 'texto' } | 'exit' | { loop: n, body: [...] } | { ifChild: [...], ifParent: [...] } (if (fork() == 0))
  // Devuelve { procs: cantidad de procesos, out: [líneas impresas con el PID], tree: [{ pid, parent }] }
  function runFork(prog) {
    let next = 0;
    const tree = [], out = [];
    // Cada proceso es una pila de marcos { stmts, k, loop?, iter? }; fork() clona la pila: el hijo sigue donde estaba el padre
    const clone = (frames) => frames.map((f) => ({ ...f }));
    const spawn = (frames, parent) => { const pid = ++next; tree.push({ pid, parent }); run(frames, pid); };
    function run(frames, pid) {
      while (frames.length) {
        const f = frames.at(-1);
        if (f.k >= f.stmts.length) {
          if (f.loop && f.iter + 1 < f.loop) { f.iter++; f.k = 0; continue; }
          frames.pop(); continue;
        }
        const s = f.stmts[f.k++];
        if (s === 'exit') return;
        if (s === 'fork') { spawn(clone(frames), pid); continue; }
        if (s.print != null) { out.push({ pid, t: s.print }); continue; }
        if (s.loop) { frames.push({ stmts: s.body, k: 0, loop: s.loop, iter: 0 }); continue; }
        if (s.ifChild) {
          const child = clone(frames); child.push({ stmts: s.ifChild, k: 0 });
          spawn(child, pid);
          frames.push({ stmts: s.ifParent || [], k: 0 });
        }
      }
    }
    spawn([{ stmts: prog, k: 0 }], 0);
    return { procs: tree.length, out, tree };
  }

  // ---------- Permisos UNIX ----------
  // '754' -> 'rwxr-xr--' y viceversa; incluye bits especiales (4 = SUID, 2 = SGID, 1 = sticky) si hay 4 dígitos
  function octToSym(oct) {
    const s = String(oct).padStart(3, '0');
    const sp = s.length === 4 ? +s[0] : 0;
    const d = s.slice(-3).split('').map(Number);
    const tri = d.map((v) => `${v & 4 ? 'r' : '-'}${v & 2 ? 'w' : '-'}${v & 1 ? 'x' : '-'}`);
    const mark = (t, on, lo, up) => (on ? t.slice(0, 2) + (t[2] === 'x' ? lo : up) : t);
    tri[0] = mark(tri[0], sp & 4, 's', 'S'); tri[1] = mark(tri[1], sp & 2, 's', 'S'); tri[2] = mark(tri[2], sp & 1, 't', 'T');
    return tri.join('');
  }
  function symToOct(sym) {
    let sp = 0;
    const d = [0, 1, 2].map((k) => {
      const t = sym.slice(k * 3, k * 3 + 3);
      let v = (t[0] === 'r' ? 4 : 0) + (t[1] === 'w' ? 2 : 0) + (/[xst]/.test(t[2]) ? 1 : 0);
      if (/[sS]/.test(t[2]) && k < 2) sp += k === 0 ? 4 : 2;
      if (/[tT]/.test(t[2]) && k === 2) sp += 1;
      return v;
    });
    return (sp ? String(sp) : '') + d.join('');
  }

  // ---------- RAID ----------
  // Devuelve { usable (en unidades de disco), tolerates (discos que pueden fallar en el peor caso), min }
  function raid(level, n) {
    if (level === '0') return { usable: n, tolerates: 0, min: 2 };
    if (level === '1') return { usable: 1, tolerates: n - 1, min: 2 };
    if (level === '10') return { usable: n / 2, tolerates: 1, min: 4 };
    if (level === '5') return { usable: n - 1, tolerates: 1, min: 3 };
    return null;
  }

  // ---------- Tamaño máximo de archivo con inodo (esquema combinado UNIX) ----------
  function inodeMax(block, ptr, direct = 12) {
    const k = block / ptr;
    const blocks = direct + k + k ** 2 + k ** 3;
    return { k, blocks, bytes: blocks * block };
  }

  // ---------- Preguntas abiertas ----------
  function parseNum(raw) {
    let s = String(raw).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    if (!s) return [];
    s = s.replace(/×\s*10\^?/g, 'e').replace(/x\s*10\^/gi, 'e').replace(/\*\s*10\^/g, 'e');
    const one = (t) => {
      const m = t.match(/^[-+]?[\d.,]+(e[-+]?\d+)?/);
      if (!m) return NaN;
      let n = m[0].replace(/e.*/, '');
      if (n.includes(',') && n.includes('.')) n = n.replace(/\./g, '').replace(',', '.');
      else if (n.includes(',')) n = n.replace(',', '.');
      else if (/^[-+]?\d{1,3}(\.\d{3})+$/.test(n)) n = n.replace(/\./g, '');
      return parseFloat(n + (m[1] || ''));
    };
    const fr = s.match(/^([-+]?[\d.,]+)\s*\/\s*([\d.,]+)/);
    const v = fr ? one(fr[1]) / one(fr[2]) : one(s);
    if (!Number.isFinite(v)) return [];
    return /%/.test(s) ? [v / 100, v] : [v];
  }
  function checkOpen(q, raw) {
    const txt = String(raw || '').trim();
    if (!txt) return { ok: false, empty: true, html: '<p><strong>Sin responder.</strong></p>' };
    const fmt = window.GUIDE.h.num;
    if (q.t === 'num') {
      const cands = parseNum(txt);
      if (!cands.length) return { ok: false, html: '<p><strong>No pude leer un número.</strong> Escribilo así: 12 · 0,75 · 3/4 · 75 %.</p>' };
      const tol = q.tol ?? 0.01;
      const good = (v) => (q.a === 0 ? Math.abs(v) < 5e-4 : Math.abs(v - q.a) <= Math.abs(q.a) * tol + 5e-5);
      const ok = cands.some(good);
      const near = !ok && cands.some((v) => q.a !== 0 && Math.abs(v - q.a) <= Math.abs(q.a) * 0.06);
      return { ok, html: `<p><strong>${ok ? 'Correcto.' : near ? 'Cerca, pero no: revisá un paso intermedio o el redondeo.' : 'Incorrecto.'}</strong> La respuesta es <b>${fmt(q.a, 4)}${q.u ? ` ${q.u}` : ''}</b>.</p>` };
    }
    const t = norm(txt);
    const hits = q.k.map((g) => g.some((w) => t.includes(norm(w))));
    const n = hits.filter(Boolean).length;
    const need = q.need ?? (q.k.length <= 2 ? q.k.length : q.k.length - 1);
    const ok = n >= need && txt.length >= 12;
    return { ok, html: `<p><strong>${ok ? 'Bien: están los conceptos clave.' : `Faltan conceptos: encontré ${n} de los ${need} necesarios.`}</strong></p>
      <ul class="oq-keys">${q.k.map((g, i) => `<li class="${hits[i] ? 'hit' : 'miss'}">${hits[i] ? '✓' : '✗'} ${g[0]}</li>`).join('')}</ul>` };
  }

  window.GUIDE.so = { norm, schedule, replace, disk, safety, request, fit, translate, eat, eatNoTlb, log2, runFork, octToSym, symToOct, raid, inodeMax, parseNum, checkOpen };
  window.GUIDE.st = { checkOpen, parseNum };   // app.js corrige las abiertas con GUIDE.st
})();
