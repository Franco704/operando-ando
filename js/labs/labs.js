/* Laboratorios de la materia (interfaz). Los cálculos están en so.js.
   sched (Gantt), pager (sustitución de páginas), disk (planificación de disco), banker, fit (huecos), interleave (carreras, semáforos, abrazo mortal),
   fork (árbol de procesos), states (diagrama de estados), cache (recorrer una matriz), chmod (permisos). */
(() => {
  const L = window.GUIDE.LABS;
  const so = window.GUIDE.so;
  const h = window.GUIDE.h;
  const num = (v, d = 2) => h.num(v, d);
  const list = (s) => String(s).split(/[\s,;]+/).filter(Boolean).map(Number).filter(Number.isFinite);
  const PALETTE = 8;   // colores de proceso: .pc0 … .pc7
  const colorOf = (ids) => (id) => `pc${ids.indexOf(id) % PALETTE}`;

  // ---------- Planificación de CPU ----------
  const ALGOS = { fcfs: 'FCFS (FIFO)', sjf: 'SJF no apropiativo', srtf: 'SRTF (SJF apropiativo)', prio: 'Prioridad no apropiativa', prioP: 'Prioridad apropiativa', rr: 'Round Robin' };
  function gantt(g, ids) {
    const end = g.at(-1).e, col = colorOf(ids);
    const ticks = [...new Set(g.flatMap((x) => [x.s, x.e]))];
    return `<div class="gantt" role="img" aria-label="Diagrama de Gantt: ${g.map((x) => `${x.id ?? 'ociosa'} de ${x.s} a ${x.e}`).join(', ')}">
      <div class="g-bar">${g.map((x) => `<span class="g-seg ${x.id ? col(x.id) : 'g-idle'}" style="flex:${x.e - x.s}">${x.e - x.s >= end / 30 ? x.id ?? '·' : ''}</span>`).join('')}</div>
      <div class="g-ticks">${ticks.map((t) => `<span style="left:${(t / end) * 100}%">${t}</span>`).join('')}</div></div>`;
  }
  L.sched = (el, cfg) => {
    let procs = cfg.procs.map((p) => ({ ...p }));
    const showPrio = cfg.prio ?? procs.some((p) => p.prio != null);
    el.innerHTML = `
      <div class="lab-row">
        <label class="lab-sel"><span>Algoritmo</span><select data-f="algo">${Object.entries(ALGOS).map(([k, v]) => `<option value="${k}" ${k === (cfg.algo || 'fcfs') ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="lab-sel"><span>Cuanto (RR)</span><input type="number" data-f="q" min="1" value="${cfg.q || 2}"></label>
      </div>
      <div class="table-wrap"><table class="sched-in"><thead><tr><th>Proceso</th><th>Llegada</th><th>Ráfaga</th>${showPrio ? '<th>Prioridad</th>' : ''}<th></th></tr></thead><tbody></tbody></table></div>
      <div class="lab-row"><button class="btn sm" type="button" data-act="add">Agregar proceso</button></div>
      <div class="sched-out" aria-live="polite"></div>`;
    const tb = el.querySelector('tbody'), outEl = el.querySelector('.sched-out');
    const drawIn = () => {
      tb.innerHTML = procs.map((p, i) => `<tr data-i="${i}"><th>${p.id}</th><td><input type="number" min="0" data-k="arr" value="${p.arr}" aria-label="Llegada de ${p.id}"></td><td><input type="number" min="1" data-k="burst" value="${p.burst}" aria-label="Ráfaga de ${p.id}"></td>${showPrio ? `<td><input type="number" min="0" data-k="prio" value="${p.prio ?? 0}" aria-label="Prioridad de ${p.id}"></td>` : ''}<td><button class="icon-btn sm" type="button" data-del="${i}" aria-label="Quitar ${p.id}" ${procs.length < 2 ? 'disabled' : ''}>×</button></td></tr>`).join('');
    };
    const run = () => {
      const algo = el.querySelector('[data-f="algo"]').value, q = Math.max(1, +el.querySelector('[data-f="q"]').value || 1);
      const ids = procs.map((p) => p.id);
      const r = so.schedule(procs, algo, q);
      const all = Object.keys(ALGOS).map((k) => [k, so.schedule(procs, k, q).avg]);
      const bestW = Math.min(...all.map(([, a]) => a.wait));
      outEl.innerHTML = `${gantt(r.gantt, ids)}
        <div class="table-wrap"><table class="num-t"><thead><tr><th>Proceso</th><th>Fin</th><th>Retorno<br><small>fin − llegada</small></th><th>Espera<br><small>retorno − ráfaga</small></th><th>Respuesta<br><small>1ª CPU − llegada</small></th></tr></thead>
        <tbody>${r.rows.map((x) => `<tr><th><span class="dot ${colorOf(ids)(x.id)}"></span>${x.id}</th><td>${x.fin}</td><td>${x.ta}</td><td>${x.wait}</td><td>${x.resp}</td></tr>`).join('')}
        <tr class="avg"><th>Promedio</th><td></td><td>${num(r.avg.ta)}</td><td>${num(r.avg.wait)}</td><td>${num(r.avg.resp)}</td></tr></tbody></table></div>
        <p class="lab-note">Cambios de proceso: <b>${Math.max(0, r.switches)}</b>. Cada uno es overhead (latencia de despacho), que este modelo no suma al tiempo.</p>
        <details class="cmp"><summary>Comparar todos los algoritmos con estos procesos</summary><div class="table-wrap"><table class="num-t"><thead><tr><th>Algoritmo</th><th>Espera media</th><th>Retorno medio</th><th>Respuesta media</th></tr></thead><tbody>
        ${all.map(([k, a]) => `<tr${a.wait === bestW ? ' class="best"' : ''}><th>${ALGOS[k]}${k === 'rr' ? ` (q = ${q})` : ''}</th><td>${num(a.wait)}</td><td>${num(a.ta)}</td><td>${num(a.resp)}</td></tr>`).join('')}</tbody></table></div>
        <p class="lab-note">Resaltado: menor espera media. SJF/SRTF son óptimos en espera media, pero necesitan conocer la ráfaga siguiente; RR gana en respuesta.</p></details>`;
    };
    el.addEventListener('input', (e) => {
      const tr = e.target.closest('tr[data-i]');
      if (tr) { const v = parseInt(e.target.value, 10); if (Number.isFinite(v)) procs[+tr.dataset.i][e.target.dataset.k] = e.target.dataset.k === 'burst' ? Math.max(1, v) : Math.max(0, v); }
      run();
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'add') procs.push({ id: `P${procs.length + 1}`, arr: 0, burst: 3, prio: 1 });
      else if (b.dataset.del != null) procs.splice(+b.dataset.del, 1);
      else return;
      drawIn(); run();
    });
    drawIn(); run();
  };

  // ---------- Sustitución de páginas ----------
  const RALG = { fifo: 'FIFO', opt: 'Óptimo (OPT)', lru: 'LRU' };
  L.pager = (el, cfg) => {
    el.innerHTML = `<div class="lab-in">
        <label>Cadena de referencias<input type="text" data-f="refs" value="${cfg.refs}"></label>
        <label class="lab-sel"><span>Marcos</span><input type="number" min="1" max="8" data-f="n" value="${cfg.frames || 3}"></label>
        <label class="lab-sel"><span>Algoritmo</span><select data-f="algo">${Object.entries(RALG).map(([k, v]) => `<option value="${k}" ${k === (cfg.algo || 'fifo') ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      </div><div class="pg-out" aria-live="polite"></div>`;
    const run = () => {
      const refs = list(el.querySelector('[data-f="refs"]').value).slice(0, 40);
      const n = Math.min(8, Math.max(1, +el.querySelector('[data-f="n"]').value || 1));
      const algo = el.querySelector('[data-f="algo"]').value;
      if (!refs.length) { el.querySelector('.pg-out').innerHTML = '<p class="lab-note">Escribí números separados por espacios.</p>'; return; }
      const r = so.replace(refs, n, algo);
      const cmp = Object.keys(RALG).map((k) => [k, so.replace(refs, n, k).faults]);
      const fifoMore = so.replace(refs, n + 1, 'fifo').faults;
      el.querySelector('.pg-out').innerHTML = `<div class="table-wrap"><table class="pg-t"><thead><tr><th scope="row">Ref.</th>${r.steps.map((s) => `<th>${s.ref}</th>`).join('')}</tr></thead><tbody>
        ${Array.from({ length: n }, (_, f) => `<tr><th scope="row">Marco ${f}</th>${r.steps.map((s, i) => { const v = s.frames[f]; const isNew = s.fault && v === s.ref; return `<td class="${isNew ? 'pg-new' : ''}">${v ?? ''}</td>`; }).join('')}</tr>`).join('')}
        <tr class="pg-f"><th scope="row">Fallo</th>${r.steps.map((s) => `<td>${s.fault ? '●' : ''}</td>`).join('')}</tr>
        <tr class="pg-v"><th scope="row">Víctima</th>${r.steps.map((s) => `<td>${s.victim ?? ''}</td>`).join('')}</tr></tbody></table></div>
        <p class="lab-row">${cmp.map(([k, f]) => `<span class="chip ${k === algo ? 'acc' : ''}">${RALG[k]}: ${f} fallos</span>`).join('')}<span class="chip">Tasa de fallos: ${num((r.faults / refs.length) * 100, 1)} %</span></p>
        <p class="lab-note">FIFO con ${n + 1} marcos: ${fifoMore} fallos. ${fifoMore > cmp[0][1] ? '<b>¡Anomalía de Belady!</b> Más marcos y más fallos: FIFO no es un algoritmo de pila.' : 'Con un marco más no aumentan los fallos (no aparece la anomalía de Belady con esta cadena).'}</p>`;
    };
    el.addEventListener('input', run);
    run();
  };

  // ---------- Planificación de disco ----------
  const DALG = { fcfs: 'FCFS', sstf: 'SSTF', scan: 'SCAN', cscan: 'C-SCAN', look: 'LOOK', clook: 'C-LOOK' };
  L.disk = (el, cfg) => {
    el.innerHTML = `<div class="lab-in">
        <label>Cola de pedidos (cilindros)<input type="text" data-f="q" value="${cfg.reqs}"></label>
        <label class="lab-sel"><span>Cabeza</span><input type="number" data-f="h" value="${cfg.head}"></label>
        <label class="lab-sel"><span>Último cilindro</span><input type="number" data-f="m" value="${cfg.max ?? 199}"></label>
        <label class="lab-sel"><span>Sentido</span><select data-f="d"><option value="up">hacia el final</option><option value="down" ${cfg.dir === 'down' ? 'selected' : ''}>hacia 0</option></select></label>
        <label class="lab-sel"><span>Algoritmo</span><select data-f="a">${Object.entries(DALG).map(([k, v]) => `<option value="${k}" ${k === (cfg.algo || 'fcfs') ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      </div><div class="dk-out" aria-live="polite"></div>`;
    const run = () => {
      const reqs = list(el.querySelector('[data-f="q"]').value).slice(0, 30);
      const max = Math.max(1, +el.querySelector('[data-f="m"]').value || 199);
      const head = Math.min(max, Math.max(0, +el.querySelector('[data-f="h"]').value || 0));
      const dir = el.querySelector('[data-f="d"]').value, algo = el.querySelector('[data-f="a"]').value;
      const r = so.disk(reqs.filter((x) => x >= 0 && x <= max), head, algo, { max, dir });
      const n = r.path.length - 1;
      const segs = r.path.slice(1).map((c, i) => ({ from: [r.path[i], -i], to: [c, -(i + 1)], cls: r.jumps.includes(i + 1) ? 'pl-jump' : 'c-f' }));
      const chart = h.plot({ x: [0, max], y: [-n - 0.5, 0.5], w: 520, h: 60 + n * 22, xl: 'cilindro', yl: ' ', yAxisLeft: true, anim: false, alt: `Recorrido ${DALG[algo]}: ${r.path.join(', ')}`,
        segs, points: r.path.map((c, i) => ({ x: c, y: -i, r: 4, label: String(c), pos: 'e', cls: i ? '' : 'c-res' })), ticks: { x: [0, Math.round(max / 2)] } });
      const all = Object.keys(DALG).map((k) => [k, so.disk(reqs, head, k, { max, dir })]);
      el.querySelector('.dk-out').innerHTML = `${h.fig(chart)}
        <p class="lab-formula">${r.path.join(' → ')}</p>
        <p class="lab-row"><span class="chip acc">Movimiento total: ${r.total} cilindros${r.jumps.length ? ` (${r.noJump} sin contar el regreso)` : ''}</span></p>
        <div class="table-wrap"><table class="num-t"><thead><tr><th>Algoritmo</th><th>Movimiento total</th></tr></thead><tbody>${all.map(([k, x]) => `<tr${k === algo ? ' class="best"' : ''}><th>${DALG[k]}</th><td>${x.total}${x.jumps.length ? ` (${x.noJump} sin el regreso)` : ''}</td></tr>`).join('')}</tbody></table></div>`;
    };
    el.addEventListener('input', run);
    run();
  };

  // ---------- Banquero ----------
  L.banker = (el, cfg) => {
    const R = cfg.res || ['A', 'B', 'C'];
    let avail = [...cfg.avail], max = cfg.max.map((r) => [...r]), alloc = cfg.alloc.map((r) => [...r]);
    const n = alloc.length;
    const vec = (v) => `(${v.join(', ')})`;
    const grid = (name, M) => `<table class="bk-t"><caption>${name}</caption><thead><tr><th></th>${R.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${M.map((row, i) => `<tr><th>P${i}</th>${row.map((v, j) => `<td><input type="number" min="0" data-m="${name}" data-i="${i}" data-j="${j}" value="${v}" aria-label="${name} P${i} ${R[j]}"></td>`).join('')}</tr>`).join('')}</tbody></table>`;
    el.innerHTML = `<div class="bk-grids">${grid('Asignación', alloc)}${grid('Máximo', max)}
      <table class="bk-t"><caption>Disponible</caption><thead><tr>${R.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody><tr>${avail.map((v, j) => `<td><input type="number" min="0" data-m="Disponible" data-j="${j}" value="${v}" aria-label="Disponible ${R[j]}"></td>`).join('')}</tr></tbody></table></div>
      <div class="bk-out" aria-live="polite"></div>
      <div class="lab-in bk-req"><label class="lab-sel"><span>Solicitud de</span><select data-f="p">${alloc.map((_, i) => `<option value="${i}">P${i}</option>`).join('')}</select></label>
        <label>Vector pedido<input type="text" data-f="v" value="${(cfg.req || R.map(() => 0)).join(' ')}"></label>
        <button class="btn sm primary" type="button" data-act="req">Evaluar solicitud</button></div>
      <div class="bk-req-out" aria-live="polite"></div>`;
    const run = () => {
      const s = so.safety(avail, max, alloc);
      el.querySelector('.bk-out').innerHTML = `<div class="table-wrap"><table class="num-t"><caption>Necesidad = Máximo − Asignación</caption><thead><tr><th></th>${R.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${s.need.map((r, i) => `<tr><th>P${i}</th>${r.map((v) => `<td class="${v < 0 ? 'bad' : ''}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <ol class="bk-steps">${s.steps.map((st) => `<li>Trabajo ${vec(st.work)}: Necesidad de P${st.i} ${vec(s.need[st.i])} ≤ Trabajo, P${st.i} puede terminar y devuelve ${vec(alloc[st.i])} → Trabajo ${vec(st.after)}</li>`).join('')}</ol>
        <p class="lab-row"><span class="chip ${s.safe ? 'ok' : 'err'}">${s.safe ? `Estado SEGURO: secuencia ⟨${s.seq.map((i) => `P${i}`).join(', ')}⟩` : `Estado INSEGURO: quedan ${alloc.map((_, i) => i).filter((i) => !s.seq.includes(i)).map((i) => `P${i}`).join(', ')} sin poder terminar`}</span></p>
        ${s.safe ? '<p class="lab-note">El algoritmo recorre P0…Pn en orden y toma el primero que puede terminar; puede haber otras secuencias seguras igual de válidas.</p>' : ''}`;
    };
    el.addEventListener('input', (e) => {
      const t = e.target;
      if (!t.dataset.m) return;
      const v = Math.max(0, parseInt(t.value, 10) || 0);
      if (t.dataset.m === 'Disponible') avail[+t.dataset.j] = v;
      else (t.dataset.m === 'Asignación' ? alloc : max)[+t.dataset.i][+t.dataset.j] = v;
      run();
    });
    el.querySelector('[data-act="req"]').addEventListener('click', () => {
      const i = +el.querySelector('[data-f="p"]').value;
      const req = list(el.querySelector('[data-f="v"]').value);
      const outR = el.querySelector('.bk-req-out');
      if (req.length !== R.length) { outR.innerHTML = `<p class="note warn">El vector debe tener ${R.length} valores.</p>`; return; }
      const r = so.request(avail, max, alloc, i, req);
      const msg = {
        excede: `<b>Error:</b> P${i} pide más de lo que declaró como máximo (Pedido ${vec(req)} > Necesidad ${vec(so.safety(avail, max, alloc).need[i])}).`,
        espera: `<b>P${i} debe esperar:</b> los recursos no están disponibles (Pedido ${vec(req)} > Disponible ${vec(avail)}).`,
        seguro: `<b>Se concede.</b> Simulando la asignación queda Disponible ${vec(r.avail || [])} y el estado sigue seguro: ⟨${(r.safety?.seq || []).map((k) => `P${k}`).join(', ')}⟩.`,
        inseguro: `<b>No se concede:</b> los recursos están, pero asignarlos dejaría el sistema en estado inseguro. P${i} espera y se restaura el estado anterior.`,
      }[r.reason];
      outR.innerHTML = `<p class="note ${r.ok ? 'tip' : 'warn'}">${msg}</p>${r.ok ? '<p><button class="btn sm" type="button" data-act="apply">Aplicar la asignación</button></p>' : ''}`;
      outR.querySelector('[data-act="apply"]')?.addEventListener('click', () => { avail = r.avail; alloc = r.alloc; L.banker(el, { ...cfg, avail, max, alloc, req }); });
    });
    run();
  };

  // ---------- Primer, mejor y peor ajuste ----------
  const FALG = { first: 'Primer ajuste', best: 'Mejor ajuste', worst: 'Peor ajuste' };
  L.fit = (el, cfg) => {
    el.innerHTML = `<div class="lab-in"><label>Huecos libres (KB, en orden de memoria)<input type="text" data-f="h" value="${cfg.holes}"></label>
      <label>Pedidos (KB, en orden de llegada)<input type="text" data-f="r" value="${cfg.reqs}"></label>
      <label class="lab-sel"><span>Algoritmo</span><select data-f="a">${Object.entries(FALG).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label></div>
      <div class="fit-out" aria-live="polite"></div>`;
    const run = () => {
      const holes = list(el.querySelector('[data-f="h"]').value).slice(0, 10), reqs = list(el.querySelector('[data-f="r"]').value).slice(0, 10);
      const algo = el.querySelector('[data-f="a"]').value;
      const r = so.fit(holes, reqs, algo);
      const total = Math.max(...holes, 1);
      el.querySelector('.fit-out').innerHTML = `<div class="fit-rows">${[{ req: null, holes }, ...r.steps].map((s, k) => `<div class="fit-row"><span class="fit-l">${k ? `${s.req} KB → ${s.hole == null ? '<b class="bad">no entra</b>' : `hueco ${s.hole + 1}`}` : 'Inicio'}</span>
        <span class="fit-bar">${s.holes.map((v, i) => `<span class="fit-h${k && s.hole === i ? ' hit' : ''}" style="flex:${Math.max(holes[i], 1)}"><span style="width:${(v / Math.max(holes[i], 1)) * 100}%"></span><small>${v}</small></span>`).join('')}</span></div>`).join('')}</div>
        <p class="lab-row">${Object.keys(FALG).map((k) => { const x = so.fit(holes, reqs, k); return `<span class="chip ${k === algo ? 'acc' : ''}">${FALG[k]}: ${x.failed ? `${x.failed} pedido(s) sin lugar` : 'todos asignados'}</span>`; }).join('')}</p>
        <p class="lab-note">Lo que queda en cada hueco es <b>fragmentación externa</b> potencial: puede sumar suficiente memoria libre pero no contigua. (Escala relativa al hueco más grande: ${total} KB.)</p>`;
    };
    el.addEventListener('input', run);
    run();
  };

  // ---------- Intercalado de instrucciones: carreras, semáforos y abrazo mortal ----------
  // cfg: { vars: { saldo: 100 }, sems: { s: 1 }, procs: [{ name, code: [{ t: 'texto', op, ... }] }], expect?: (vars) => html }
  // ops: load {v, r} · add {r, n} · store {v, r} · jlt {r, n, to} (salta si reg < n) · wait {s} · signal {s} · print {t} · inc {v} (atómico, solo para contar)
  L.interleave = (el, cfg) => {
    let S;
    const reset = () => {
      S = { vars: { ...(cfg.vars || {}) }, sems: Object.fromEntries(Object.entries(cfg.sems || {}).map(([k, v]) => [k, { v, q: [] }])),
        P: cfg.procs.map((p) => ({ ...p, pc: 0, regs: {}, st: 'listo' })), log: [] };
    };
    reset();
    const step = (i) => {
      const p = S.P[i];
      if (p.st !== 'listo') return;
      const ins = p.code[p.pc];
      if (!ins) { p.st = 'terminado'; return; }
      const say = (t) => S.log.push(`<b class="${colorOf(cfg.procs.map((x) => x.name))(p.name)}">${p.name}</b> ${t}`);
      switch (ins.op) {
        case 'load': p.regs[ins.r] = S.vars[ins.v]; say(`lee ${ins.v} = ${S.vars[ins.v]} en su registro`); p.pc++; break;
        case 'add': p.regs[ins.r] += ins.n; say(`calcula ${ins.r} = ${p.regs[ins.r]} (en su registro, nadie más lo ve)`); p.pc++; break;
        case 'store': S.vars[ins.v] = p.regs[ins.r]; say(`escribe ${ins.v} = ${p.regs[ins.r]}`); p.pc++; break;
        case 'jlt': if (p.regs[ins.r] < ins.n) { say(`ve ${ins.r} = ${p.regs[ins.r]} < ${ins.n}: no alcanza`); p.pc = ins.to; } else { say(`ve ${ins.r} = ${p.regs[ins.r]} ≥ ${ins.n}: alcanza`); p.pc++; } break;
        case 'wait': {
          const s = S.sems[ins.s];
          if (s.v > 0) { s.v--; say(`wait(${ins.s}): pasa, ${ins.s} = ${s.v}`); p.pc++; }
          else { s.q.push(i); p.st = 'bloqueado'; p.on = ins.s; say(`wait(${ins.s}): ${ins.s} = 0, <b>se bloquea</b>`); }
          break;
        }
        case 'signal': {
          const s = S.sems[ins.s];
          if (s.q.length) { const k = s.q.shift(); S.P[k].st = 'listo'; S.P[k].pc++; delete S.P[k].on; say(`signal(${ins.s}): despierta a ${S.P[k].name}, que pasa su wait`); }
          else { s.v++; say(`signal(${ins.s}): ${ins.s} = ${s.v}`); }
          p.pc++; break;
        }
        case 'print': say(`<i>${ins.msg || ins.t}</i>`); p.pc++; break;
        case 'inc': S.vars[ins.v]++; say(`${ins.v}++ → ${S.vars[ins.v]}`); p.pc++; break;
        default: p.pc++;
      }
      if (p.pc >= p.code.length && p.st === 'listo') { p.st = 'terminado'; say('termina'); }
    };
    const draw = () => {
      const alive = S.P.filter((p) => p.st !== 'terminado');
      const dead = alive.length && alive.every((p) => p.st === 'bloqueado');
      const fin = !alive.length;
      el.innerHTML = `<div class="il-procs">${S.P.map((p, i) => `<div class="il-p ${p.st}">
          <h4><span class="dot ${colorOf(cfg.procs.map((x) => x.name))(p.name)}"></span>${p.name} <small>${p.st}${p.on ? ` en ${p.on}` : ''}</small></h4>
          <ol class="il-code">${p.code.map((c, k) => `<li class="${k === p.pc && p.st !== 'terminado' ? 'pc' : k < p.pc ? 'past' : ''}"><code>${c.t}</code></li>`).join('')}</ol>
          <p class="il-regs">${Object.keys(p.regs).length ? Object.entries(p.regs).map(([k, v]) => `${k} = ${v}`).join(' · ') : '&nbsp;'}</p>
          <button class="btn sm" type="button" data-step="${i}" ${p.st !== 'listo' ? 'disabled' : ''}>Ejecutar 1 instrucción</button></div>`).join('')}</div>
        <div class="il-state"><span class="chip">Compartido: ${Object.entries(S.vars).map(([k, v]) => `${k} = <b>${v}</b>`).join(' · ') || '—'}</span>
          ${Object.entries(S.sems).map(([k, s]) => `<span class="chip acc">semáforo ${k} = ${s.v}${s.q.length ? `, cola: ${s.q.map((q) => S.P[q].name).join(', ')}` : ''}</span>`).join('')}</div>
        <div class="lab-row"><button class="btn sm" type="button" data-act="rand">Planificador al azar hasta el final</button><button class="btn sm" type="button" data-act="reset">Reiniciar</button></div>
        ${dead ? `<p class="note warn"><b>Abrazo mortal.</b> Todos los procesos que faltan terminar están bloqueados esperando un recurso que retiene otro: ${alive.map((p) => `${p.name} espera ${p.on}`).join(', ')}. Ninguno puede avanzar ni liberar nada.</p>` : ''}
        ${fin && cfg.expect ? `<p class="note ${cfg.expect.ok(S.vars) ? 'tip' : 'warn'}">${cfg.expect.ok(S.vars) ? cfg.expect.good : cfg.expect.bad}</p>` : ''}
        <ol class="il-log">${S.log.map((x) => `<li>${x}</li>`).join('')}</ol>`;
    };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.step != null) step(+b.dataset.step);
      if (b.dataset.act === 'reset') reset();
      if (b.dataset.act === 'rand') for (let g = 0; g < 500; g++) { const ready = S.P.map((p, i) => i).filter((i) => S.P[i].st === 'listo'); if (!ready.length) break; step(ready[Math.floor(Math.random() * ready.length)]); }
      draw();
    });
    draw();
  };

  // ---------- fork(): predecir procesos e impresiones ----------
  L.fork = (el, cfg) => {
    el.innerHTML = `<div class="lab-row"><label class="lab-sel"><span>Programa</span><select data-f="p">${cfg.programs.map((p, i) => `<option value="${i}">${p.name}</option>`).join('')}</select></label></div>
      <pre class="code"><code data-f="code"></code></pre>
      <div class="lab-in"><label class="lab-sel"><span>¿Cuántos procesos en total?</span><input type="number" min="1" data-f="np"></label>
        <label class="lab-sel"><span>¿Cuántas líneas se imprimen?</span><input type="number" min="0" data-f="nl"></label>
        <button class="btn sm primary" type="button" data-act="check">Comprobar</button></div>
      <div class="fk-out" aria-live="polite"></div>`;
    const cur = () => cfg.programs[+el.querySelector('[data-f="p"]').value];
    const show = () => { el.querySelector('[data-f="code"]').innerHTML = cur().code; el.querySelector('.fk-out').innerHTML = ''; };
    el.querySelector('[data-f="p"]').addEventListener('change', show);
    el.querySelector('[data-act="check"]').addEventListener('click', () => {
      const r = so.runFork(cur().prog);
      const np = +el.querySelector('[data-f="np"]').value, nl = +el.querySelector('[data-f="nl"]').value;
      const kids = (pid) => r.tree.filter((t) => t.parent === pid);
      const tree = (pid) => `<li><span class="fk-n">P${pid}</span>${kids(pid).length ? `<ul>${kids(pid).map((k) => tree(k.pid)).join('')}</ul>` : ''}</li>`;
      el.querySelector('.fk-out').innerHTML = `<p class="lab-row"><span class="chip ${np === r.procs ? 'ok' : 'err'}">Procesos: ${r.procs} ${np === r.procs ? '✓' : `(dijiste ${np || '—'})`}</span><span class="chip ${nl === r.out.length ? 'ok' : 'err'}">Líneas: ${r.out.length} ${nl === r.out.length ? '✓' : `(dijiste ${Number.isFinite(nl) ? nl : '—'})`}</span></p>
        <div class="fk-grid"><div><p class="lab-note">Árbol de procesos (P1 es el original)</p><ul class="fk-tree">${tree(1)}</ul></div>
        <div><p class="lab-note">Una salida posible (el orden real depende del planificador)</p><pre class="lab-out">${r.out.map((o) => `[P${o.pid}] ${o.t}`).join('\n') || '(nada)'}</pre></div></div>
        ${cur().why ? `<p class="lab-explain">${cur().why}</p>` : ''}`;
    });
    show();
  };

  // ---------- Diagrama de estados de un proceso ----------
  const ST = { nuevo: [62, 32], listo: [150, 104], ejecucion: [320, 104], espera: [235, 184], terminado: [408, 32] };
  const STN = { nuevo: 'Nuevo', listo: 'Listo', ejecucion: 'En ejecución', espera: 'En espera', terminado: 'Terminado' };
  const EV = [
    ['admitir', 'Admitido (planif. de largo plazo)', 'nuevo', 'listo'],
    ['despachar', 'Despacho (planif. de corto plazo)', 'listo', 'ejecucion'],
    ['interrupcion', 'Interrupción / fin del cuanto', 'ejecucion', 'listo'],
    ['es', 'Pide E/S o espera un evento (LS bloqueante)', 'ejecucion', 'espera'],
    ['fines', 'Termina la E/S u ocurre el evento', 'espera', 'listo'],
    ['exit', 'exit()', 'ejecucion', 'terminado'],
  ];
  const WHY = {
    'espera:despachar': 'Un proceso en espera no puede ir directo a la CPU: cuando ocurre el evento pasa a <b>listo</b> y recién ahí el planificador puede elegirlo.',
    'listo:es': 'Para pedir E/S hay que estar <b>ejecutando</b>: la solicitud es una llamada al sistema, que se hace con instrucciones del proceso.',
    'listo:exit': 'exit() es una llamada al sistema: el proceso tiene que estar <b>en ejecución</b> para hacerla.',
    'nuevo:despachar': 'Primero el planificador de largo plazo lo <b>admite</b> a la cola de listos.',
    'espera:interrupcion': 'Si no está usando la CPU, el fin del cuanto no lo afecta.',
  };
  L.states = (el) => {
    let cur = 'nuevo';
    const log = [];
    // Flechas de borde a borde de cada píldora (88 × 32); las dos entre listo y ejecución se separan
    const arrows = EV.map(([, , a, b]) => {
      const [x1, y1] = ST[a], [x2, y2] = ST[b];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      const r = Math.min(46 / Math.max(Math.abs(ux), 1e-6), 18 / Math.max(Math.abs(uy), 1e-6));
      const off = (a === 'ejecucion' && b === 'listo') ? 7 : (a === 'listo' && b === 'ejecucion') ? -7 : 0;
      return `<line x1="${(x1 + ux * r).toFixed(1)}" y1="${(y1 + uy * r + off).toFixed(1)}" x2="${(x2 - ux * (r + 2)).toFixed(1)}" y2="${(y2 - uy * (r + 2) + off).toFixed(1)}" class="st-arrow" marker-end="url(#stA)"/>`;
    });
    const draw = () => {
      el.innerHTML = `<svg class="st-svg" viewBox="0 0 470 210" role="img" aria-label="Diagrama de estados. Estado actual: ${STN[cur]}">
          <defs><marker id="stA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="pl-arrowhead"/></marker></defs>
          ${arrows.join('')}
          ${Object.entries(ST).map(([k, [x, y]]) => `<g class="st-node${k === cur ? ' on' : ''}"><rect x="${x - 44}" y="${y - 16}" width="88" height="32" rx="16"/><text x="${x}" y="${y + 5}" text-anchor="middle">${STN[k]}</text></g>`).join('')}
        </svg>
        <div class="lab-row st-ev">${EV.map(([k, t]) => `<button class="btn sm" type="button" data-ev="${k}">${t}</button>`).join('')}<button class="btn sm" type="button" data-ev="reset">Reiniciar</button></div>
        <div aria-live="polite">${log.length ? `<p class="note ${log.at(-1).ok ? 'tip' : 'warn'}">${log.at(-1).t}</p>` : '<p class="lab-note">Elegí un evento. Si no puede ocurrir en el estado actual, se explica por qué.</p>'}</div>`;
    };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ev]');
      if (!b) return;
      if (b.dataset.ev === 'reset') { cur = 'nuevo'; log.length = 0; draw(); return; }
      const ev = EV.find((x) => x[0] === b.dataset.ev);
      if (ev[2] === cur) { log.push({ ok: true, t: `${STN[cur]} → <b>${STN[ev[3]]}</b>: ${ev[1]}.` }); cur = ev[3]; }
      else log.push({ ok: false, t: WHY[`${cur}:${ev[0]}`] || `“${ev[1]}” no puede ocurrir en el estado <b>${STN[cur]}</b>: esa transición sale de <b>${STN[ev[2]]}</b>.` });
      draw();
    });
    draw();
  };

  // ---------- Recorrer una matriz: localidad y caché ----------
  L.cache = (el, cfg) => {
    el.innerHTML = `<div class="lab-in">
      <label class="lab-sel"><span>Matriz N × N (int de 4 B)</span><input type="number" data-f="n" min="4" max="256" value="${cfg.n || 64}"></label>
      <label class="lab-sel"><span>Línea de caché (B)</span><select data-f="line"><option>32</option><option selected>64</option><option>128</option></select></label>
      <label class="lab-sel"><span>Líneas en la caché</span><input type="number" data-f="lines" min="1" max="4096" value="${cfg.lines || 32}"></label></div>
      <div class="ca-out" aria-live="polite"></div>`;
    const sim = (n, line, lines, byRow) => {
      const cache = new Map();   // bloque -> último uso (LRU)
      let miss = 0, t = 0;
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
        const [i, j] = byRow ? [a, b] : [b, a];
        const blk = Math.floor(((i * n + j) * 4) / line);
        if (!cache.has(blk)) { miss++; if (cache.size >= lines) { let old = null, ot = Infinity; for (const [k, v] of cache) if (v < ot) { ot = v; old = k; } cache.delete(old); } }
        cache.set(blk, t++);
      }
      return miss;
    };
    const run = () => {
      const n = Math.min(256, Math.max(4, +el.querySelector('[data-f="n"]').value || 4));
      const line = +el.querySelector('[data-f="line"]').value, lines = Math.max(1, +el.querySelector('[data-f="lines"]').value || 1);
      const total = n * n, mr = sim(n, line, lines, true), mc = sim(n, line, lines, false);
      const time = (m) => (total - m) * 1 + m * 60;   // 1 ns acierto, 60 ns fallo (orden de magnitud)
      el.querySelector('.ca-out').innerHTML = `<div class="table-wrap"><table class="num-t"><thead><tr><th>Recorrido</th><th>Accesos</th><th>Fallos de caché</th><th>Tasa de fallos</th><th>Tiempo estimado</th></tr></thead><tbody>
        <tr><th>Por filas <code>m[i][j]</code></th><td>${total}</td><td>${mr}</td><td>${num((mr / total) * 100, 1)} %</td><td>${num(time(mr) / 1000, 1)} µs</td></tr>
        <tr><th>Por columnas <code>m[j][i]</code></th><td>${total}</td><td>${mc}</td><td>${num((mc / total) * 100, 1)} %</td><td>${num(time(mc) / 1000, 1)} µs</td></tr></tbody></table></div>
        <p class="lab-note">En C la matriz se guarda <b>por filas</b>: m[i][j] y m[i][j+1] están contiguos. Por filas se aprovecha cada línea traída (${line / 4} enteros por línea: localidad espacial). Por columnas, cada acceso salta ${n * 4} bytes; ${n > lines ? 'como una columna toca más líneas de las que caben en la caché, cuando se vuelve a la primera fila la línea ya fue desalojada y casi todo acceso es fallo.' : 'acá la caché alcanza para una columna entera, así que la diferencia es chica: agrandá N o achicá la caché.'} Es el efecto que mide el TP de C básico (ej. 6) y, a escala de páginas, el de memoria virtual.</p>`;
    };
    el.addEventListener('input', run);
    run();
  };

  // ---------- Permisos rwx ↔ octal ----------
  L.chmod = (el, cfg) => {
    const who = ['Dueño (u)', 'Grupo (g)', 'Otros (o)'];
    el.innerHTML = `<div class="cm-grid" role="group" aria-label="Permisos">${who.map((w, i) => `<fieldset><legend>${w}</legend>${['r', 'w', 'x'].map((p) => `<label><input type="checkbox" data-b="${i}${p}"> ${p}</label>`).join('')}</fieldset>`).join('')}
      <fieldset><legend>Especiales</legend><label><input type="checkbox" data-s="4"> SUID</label><label><input type="checkbox" data-s="2"> SGID</label><label><input type="checkbox" data-s="1"> sticky</label></fieldset></div>
      <div class="lab-in"><label class="lab-sel"><span>Octal</span><input type="text" data-f="oct" value="${cfg.oct || '644'}"></label>
      <label class="lab-sel"><span>Es un</span><select data-f="t"><option value="-">archivo</option><option value="d">directorio</option></select></label></div>
      <div class="cm-out" aria-live="polite"></div>`;
    const fromOct = (oct) => {
      if (!/^[0-7]{3,4}$/.test(oct)) return;
      const sym = so.octToSym(oct);
      ['r', 'w', 'x'].forEach((p, k) => [0, 1, 2].forEach((i) => { el.querySelector(`[data-b="${i}${p}"]`).checked = k === 2 ? /[xst]/.test(sym[i * 3 + 2]) : sym[i * 3 + k] === p; }));
      const sp = oct.length === 4 ? +oct[0] : 0;
      el.querySelectorAll('[data-s]').forEach((c) => (c.checked = !!(sp & +c.dataset.s)));
    };
    const fromBoxes = () => {
      const d = [0, 1, 2].map((i) => ['r', 'w', 'x'].reduce((a, p, k) => a + (el.querySelector(`[data-b="${i}${p}"]`).checked ? [4, 2, 1][k] : 0), 0));
      const sp = [...el.querySelectorAll('[data-s]')].reduce((a, c) => a + (c.checked ? +c.dataset.s : 0), 0);
      return (sp ? String(sp) : '') + d.join('');
    };
    const explain = (oct, t) => {
      const sym = so.octToSym(oct);
      const can = (i) => ({ r: sym[i * 3] === 'r', w: sym[i * 3 + 1] === 'w', x: /[xst]/.test(sym[i * 3 + 2]) });
      const says = (c) => (t === 'd'
        ? [c.r ? 'listar nombres (ls)' : 'no listar', c.x ? 'entrar y acceder a lo que contiene (cd, abrir por ruta)' : 'no entrar ni acceder a su contenido', c.w && c.x ? 'crear, renombrar y borrar entradas' : c.w ? 'w sin x no sirve: no puede crear ni borrar' : 'no crear ni borrar']
        : [c.r ? 'leer' : 'no leer', c.w ? 'modificar' : 'no modificar', c.x ? 'ejecutar' : 'no ejecutar']).join(', ');
      const sp = oct.length === 4 ? +oct[0] : 0;
      return `<p class="lab-formula">${t}${sym} &nbsp;=&nbsp; chmod ${oct}</p><ul>${who.map((w, i) => `<li><b>${w}:</b> ${says(can(i))}</li>`).join('')}</ul>
        ${sp & 4 ? '<p class="lab-note"><b>SUID</b>: el programa se ejecuta con los permisos del <b>dueño del archivo</b>, no del que lo ejecuta (ej. passwd).</p>' : ''}
        ${sp & 2 ? `<p class="lab-note"><b>SGID</b>: ${t === 'd' ? 'lo que se cree adentro hereda el grupo del directorio.' : 'se ejecuta con los permisos del <b>grupo</b> del archivo (ej. write, grupo tty).'}</p>` : ''}
        ${sp & 1 ? `<p class="lab-note"><b>Sticky bit</b>: ${t === 'd' ? 'en un directorio con escritura para todos (como /tmp), cada uno solo puede borrar o renombrar <b>sus propios</b> archivos.' : 'en archivos regulares Linux lo ignora.'}</p>` : ''}`;
    };
    const run = (src) => {
      const octIn = el.querySelector('[data-f="oct"]');
      if (src === 'oct') fromOct(octIn.value.trim()); else octIn.value = fromBoxes();
      const oct = octIn.value.trim();
      el.querySelector('.cm-out').innerHTML = /^[0-7]{3,4}$/.test(oct) ? explain(oct, el.querySelector('[data-f="t"]').value) : '<p class="note warn">El modo octal tiene 3 dígitos (o 4 con los bits especiales), del 0 al 7.</p>';
    };
    el.addEventListener('input', (e) => run(e.target.dataset.f === 'oct' || e.target.dataset.f === 't' ? 'oct' : 'box'));
    fromOct(cfg.oct || '644');
    run('oct');
  };
})();
