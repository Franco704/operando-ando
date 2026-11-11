/* Base del contenido: unidades (parciales), módulos (temas), array de lecciones y ayudantes para escribir lecciones.
   Cada lección: { id, module, title, keywords, tldr, goals?, body, labs?, exercises?, quiz?, open?, sources? }
   - body puede incluir lab(i) para ubicar el laboratorio i dentro de la teoría.
   - labs: [{ type, title, ...config }] (los tipos se registran en js/labs/*.js)
   - exercises: { title, official? ('3.1' = TP 3, ejercicio 1; '2.a' = TP 2, pregunta a del cuestionario; 'ES.2' = TP de puertos de E/S), level (1-3), prompt, hints?, solution: { explain } }
   - quiz: [{ q, o: [opciones], a: índice correcto, e: explicación }]
   - open: preguntas abiertas corregidas al instante (ver so.js, checkOpen):
       { t: 'num', q, a: número, u?: 'kg' (unidad que se muestra), tol?: 0.01 (relativa), e: desarrollo }
       { t: 'text', q, k: [['etiqueta', 'sinónimo', ...], ...] (conceptos que deben aparecer), need?: cuántos, e: respuesta modelo }
   - sources: [{ title, ref?, url?, points: [] }] (ref = cita de libro, url = fuente web) */
(() => {
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const table = (head, rows) => `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  // kind: '' (nota), 'tip', 'warn', 'exam' (lo que suele tomarse)
  const note = (html, kind = '') => `<div class="note ${kind}">${html.trim().startsWith('<') ? html : `<p>${html}</p>`}</div>`;
  // Bloque de código (el contenido se escapa)
  const code = (src, lang = '') => `<pre class="code"${lang ? ` data-lang="${lang}"` : ''}><code>${esc(src.replace(/^\n/, ''))}</code></pre>`;
  const lab = (i) => `<div class="lab-mount" data-lab="${i}"></div>`;
  const flow = (...steps) => `<ol class="flow">${steps.map((s) => `<li><span>${s}</span></li>`).join('')}</ol>`;
  // Definición textual de la bibliografía
  const def = (term, text, source) => `<figure class="def"><figcaption>${term}</figcaption><blockquote><p>${text}</p></blockquote>${source ? `<p class="def-src">${source}</p>` : ''}</figure>`;
  // Diagrama SVG o HTML con epígrafe
  const fig = (inner, caption) => `<figure class="fig">${inner}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
  // Fórmulas: fracción en línea y bloque destacado
  const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
  const eq = (html, label) => `<div class="eq">${label ? `<span class="eq-l">${label}</span>` : ''}<span class="eq-m">${html}</span></div>`;
  // Número con formato argentino: 1.234,5
  const num = (v, d = 2) => (Math.abs(v) < 1e-9 ? 0 : v).toLocaleString('es-AR', { maximumFractionDigits: d });

  /* ---------- Gráficas en SVG ----------
     plot({ x: [x0, x1], y: [y0, y1], xl, yl, w?, h?, alt?, anim?,
            areas: [{ pts: [[x, y]], cls, label?, at?: [x, y] }],
            curves: [{ f?: x => y, pts?: [[x, y]], dom?: [a, b], cls, label?, at?: x, ghost?, dash? }],
            guides: [{ x, y, xt?, yt?, cls? }]   líneas punteadas hasta los ejes con rótulo en el eje
            hlines / vlines: [{ y | x, cls, label }]
            points: [{ x, y, label?, cls?, pos? ('ne'|'nw'|'se'|'sw'|'e'|'w'|'n'|'s') }],
            arrows: [{ from: [x, y], to: [x, y], cls? }],
            texts: [{ x, y, t, cls?, anchor? }],
            segs: [{ from: [x, y], to: [x, y], cls? }]   segmentos sin flecha (tangentes, secantes, telarañas)
            ticks: { x: [valores], y: [valores] } })
     Cada eje pasa por el 0 del otro si el rango lo incluye; si no, va en el borde. Las curvas se recortan al área del gráfico. */
  let uid = 0;
  const POS = { ne: [7, -8, 'start'], nw: [-7, -8, 'end'], se: [7, 15, 'start'], sw: [-7, 15, 'end'], e: [9, 4, 'start'], w: [-9, 4, 'end'], n: [0, -10, 'middle'], s: [0, 18, 'middle'] };
  function plot(s) {
    const W = s.w || 440, H = s.h || 300, m = { l: 44, r: 22, t: 18, b: 34 };
    const [x0, x1] = s.x, [y0, y1] = s.y;
    const X = (v) => m.l + ((v - x0) / (x1 - x0)) * (W - m.l - m.r);
    const Y = (v) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
    const P = (arr) => arr.map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(' ');
    const id = `pl${++uid}`;
    const anim = s.anim !== false;
    const sample = (c) => {
      if (c.pts) return c.pts;
      const [a, b] = c.dom || s.x, n = c.n || 80, out = [];
      for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n, y = c.f(x);
        if (Number.isFinite(y) && y > y0 - (y1 - y0) * 2 && y < y1 + (y1 - y0) * 2) out.push([x, y]);
      }
      return out;
    };
    const inside = ([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
    // yAxisLeft: el eje vertical va en el borde izquierdo aunque el rango incluya el 0 (barras que empiezan en x = 0)
    const ax = Y(y0 < 0 && y1 > 0 ? 0 : y0), ay = X(!s.yAxisLeft && x0 < 0 && x1 > 0 ? 0 : x0);
    let g = `<defs><clipPath id="${id}c"><rect x="${m.l}" y="${m.t - 4}" width="${W - m.l - m.r + 4}" height="${H - m.t - m.b + 4}"/></clipPath>
      <marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="pl-arrowhead"/></marker></defs>`;
    // Áreas sombreadas
    g += `<g clip-path="url(#${id}c)">${(s.areas || []).map((a) => `<polygon points="${P(a.pts)}" class="pl-area ${a.cls || ''}${anim ? ' pl-fade' : ''}"/>`).join('')}</g>`;
    // Ejes
    g += `<line x1="${m.l}" y1="${ax}" x2="${W - m.r + 6}" y2="${ax}" class="pl-axis" marker-end="url(#${id}a)"/>
      <line x1="${ay}" y1="${H - m.b}" x2="${ay}" y2="${m.t - 10}" class="pl-axis" marker-end="url(#${id}a)"/>
      <text x="${W - m.r + 4}" y="${ax + 20}" class="pl-axl" text-anchor="end">${s.xl || 'x'}</text>
      <text x="${ay - 8}" y="${m.t - 2}" class="pl-axl" text-anchor="end">${s.yl || 'y'}</text>
      ${!s.yAxisLeft && x0 <= 0 && x1 >= 0 && y0 <= 0 && y1 >= 0 ? `<text x="${ay - 6}" y="${ax + 14}" class="pl-tick" text-anchor="end">0</text>` : ''}`;
    const T = s.ticks || {};
    for (const v of T.x || []) if (v || s.yAxisLeft) g += `<line x1="${X(v)}" y1="${ax - 3}" x2="${X(v)}" y2="${ax + 3}" class="pl-axis"/><text x="${X(v)}" y="${ax + 15}" class="pl-tick" text-anchor="middle">${num(v)}</text>`;
    for (const v of T.y || []) if (v) g += `<line x1="${ay - 3}" y1="${Y(v)}" x2="${ay + 3}" y2="${Y(v)}" class="pl-axis"/><text x="${ay - 6}" y="${Y(v) + 4}" class="pl-tick" text-anchor="end">${num(v)}</text>`;
    // Guías punteadas desde un punto hacia los ejes
    for (const q of s.guides || []) {
 g += `<polyline points="${ay},${Y(q.y)} ${X(q.x)},${Y(q.y)} ${X(q.x)},${ax}" class="pl-guide ${q.cls || ''}"/>`;
      if (q.yt !== '') g += `<text x="${ay - 6}" y="${Y(q.y) + 4}" class="pl-tick ${q.cls || ''}" text-anchor="end">${q.yt ?? num(q.y)}</text>`;
      if (q.xt !== '') g += `<text x="${X(q.x)}" y="${ax + 15}" class="pl-tick ${q.cls || ''}" text-anchor="middle">${q.xt ?? num(q.x)}</text>`;
    }
    for (const l of s.hlines || []) g += `<line x1="${m.l}" y1="${Y(l.y)}" x2="${W - m.r}" y2="${Y(l.y)}" class="pl-line ${l.cls || ''}"/>${l.label ? `<text x="${W - m.r}" y="${Y(l.y) - 6}" class="pl-lbl ${l.cls || ''}" text-anchor="end">${l.label}</text>` : ''}`;
 for (const l of s.vlines || []) g += `<line x1="${X(l.x)}" y1="${H - m.b}" x2="${X(l.x)}" y2="${m.t}" class="pl-line ${l.cls || ''}"/>${l.label ? `<text x="${X(l.x) + 5}" y="${m.t + 10}" class="pl-lbl ${l.cls || ''}">${l.label}</text>` : ''}`;
    // Curvas
    let labels = '';
    g += `<g clip-path="url(#${id}c)">`;
    for (const c of s.curves || []) {
      const pts = sample(c);
      if (pts.length < 2) continue;
      g += `<path d="M${P(pts).replace(/ /g, 'L')}" class="pl-curve ${c.cls || ''}${c.ghost ? ' pl-ghost' : ''}${c.dash ? ' pl-dash' : ''}${anim && !c.ghost ? ' pl-draw' : ''}" pathLength="1"/>`;
      if (c.label) {
        let pt = c.at != null ? [c.at, c.f ? c.f(c.at) : pts.find((p) => p[0] >= c.at)?.[1]] : [...pts].reverse().find(inside);
        if (pt && Number.isFinite(pt[1])) labels += `<text x="${X(pt[0]) + 5}" y="${Y(pt[1]) - 6}" class="pl-lbl ${c.cls || ''}${c.ghost ? ' pl-ghost-t' : ''}">${c.label}</text>`;
      }
    }
    g += `</g>${labels}`;
    for (const a of s.areas || []) if (a.label) g += `<text x="${X(a.at[0])}" y="${Y(a.at[1])}" class="pl-lbl pl-alab ${a.cls || ''}" text-anchor="middle">${a.label}</text>`;
    g += `<g clip-path="url(#${id}c)">${(s.segs || []).map((q) => `<line x1="${X(q.from[0])}" y1="${Y(q.from[1])}" x2="${X(q.to[0])}" y2="${Y(q.to[1])}" class="pl-seg ${q.cls || ''}"/>`).join('')}</g>`;
    for (const a of s.arrows || []) g += `<line x1="${X(a.from[0])}" y1="${Y(a.from[1])}" x2="${X(a.to[0])}" y2="${Y(a.to[1])}" class="pl-arrow ${a.cls || ''}" marker-end="url(#${id}a)"/>`;
    for (const p of s.points || []) {
      const [dx, dy, an] = POS[p.pos || 'ne'];
      g += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.r || 5}" class="pl-pt ${p.cls || ''}${anim ? ' pl-pop' : ''}"/>${p.label ? `<text x="${X(p.x) + dx}" y="${Y(p.y) + dy}" class="pl-lbl pl-ptl ${p.cls || ''}" text-anchor="${an}">${p.label}</text>` : ''}`;
    }
    for (const t of s.texts || []) g += `<text x="${X(t.x)}" y="${Y(t.y)}" class="pl-lbl ${t.cls || ''}" text-anchor="${t.anchor || 'middle'}">${t.t}</text>`;
    return `<svg class="plot" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(s.alt || 'Gráfico')}">${g}</svg>`;
  }
  // Gráfico con epígrafe, listo para el cuerpo de una lección
  const chart = (spec, caption) => fig(plot(spec), caption);

  // all: el simulacro toma preguntas de todos los módulos (el final integra la materia completa). tps: rótulo de la tarjeta del simulacro
  const UNITS = [
    { id: 'p1', title: 'Primer parcial', name: 'Introducción, arranque y unidad 1', tps: 'Clases 0.1 a 1.1 · TP 1 y 2' },
    { id: 'p2', title: 'Segundo parcial', name: 'Llamadas al sistema, estructura y procesos', tps: 'Clases 1.2 a 3 · TP 3 y 5' },
    { id: 'p3', title: 'Tercer parcial', name: 'Hilos, planificación, concurrencia, abrazo mortal y memoria', tps: 'Caps. 4 a 8 · TP 4 a 8' },
    { id: 'p4', title: 'Cuarto parcial', name: 'Memoria virtual, E/S, almacenamiento y archivos', tps: 'Caps. 9 a 13 · TP 9 a 12' },
    { id: 'final', title: 'Final', name: 'Toda la materia', all: true, tps: 'Escrito: 5 preguntas para desarrollar' },
  ];

  // tag = de dónde sale (clase, capítulo de Silberschatz 7.ª ed., TP); stop = nombre corto para el recorrido de la portada
  const MODULES = [
    { id: 'intro', unit: 'p1', tag: 'Clases 0.1 y 1.0', title: 'El sistema operativo y la materia', stop: 'SO', blurb: 'qué es un SO (el kernel), sus tres funciones, objetivos, componentes del sistema informático y las reglas de la cátedra' },
    { id: 'arranque', unit: 'p1', tag: 'Clases 0.2 y 0.3', title: 'Arranque de una PC e instalación de un SO', stop: 'boot', blurb: 'almacenamiento, particiones, MBR y GPT, firmware BIOS y UEFI, NVRAM, cargador de arranque, imagen, medio y dual boot' },
    { id: 'hw', unit: 'p1', tag: 'Clase 1.0', title: 'CPU, contexto, interrupciones y modos', stop: 'IRQ', blurb: 'registros, contexto de ejecución, interrupciones y excepciones, vector de interrupciones, ISR, overhead y modo kernel/usuario' },
    { id: 'api', unit: 'p1', tag: 'Clase 1.1', title: 'Funciones, bibliotecas, interfaz, driver y API', stop: 'API', blurb: 'pila y llamadas a funciones, bibliotecas estáticas y dinámicas, interfaz, controlador de dispositivo y API' },
    { id: 'consola', unit: 'p1', tag: 'TP 1', title: 'Comandos de consola', stop: '$_', blurb: 'man y sus secciones, ls, cd, archivos, permisos, procesos, shell, variables de ambiente y PATH' },
    { id: 'c', unit: 'p1', tag: 'TP 2', title: 'C básico en Linux', stop: 'gcc', blurb: 'editar, compilar con gcc y -o, ejecutar con ./, programas del TP y la matriz recorrida por filas y por columnas' },
    { id: 'ls', unit: 'p2', tag: 'Clase 1.2', title: 'Llamadas al sistema', stop: 'LS', blurb: 'la API del SO, wrappers de biblioteca, man 2, números de LS, syscall() e int 0x80, VDSO' },
    { id: 'mp', unit: 'p2', tag: 'Clase 1.3', title: 'Multiprogramación, tiempo compartido y lotes', stop: 'MP', blurb: 'multiprogramación y su grado, multiprocesamiento, concurrencia, tiempo compartido, lotes, throughput y turnaround' },
    { id: 'estructura', unit: 'p2', tag: 'Unidad 2', title: 'Servicios y estructuras del SO', stop: 'µk', blurb: 'proceso como concepto inicial, servicios, CLI, GUI y lotes, estructura monolítica, en capas, microkernel, módulos e híbridos' },
    { id: 'procesos', unit: 'p2', tag: 'Unidad 3', title: 'Procesos', stop: 'PCB', blurb: 'PCB, estados, planificadores, cambio de contexto y de proceso, fork/exec/wait/exit, zombis, IPC, tuberías y señales' },
    { id: 'instalacion', unit: 'p2', tag: 'TP 3', title: 'Instalación de sistemas operativos', stop: 'ISO', blurb: 'máquina virtual, instalación de Windows y Linux, multiboot, GRUB, programas del sistema y de aplicación' },
    { id: 'admproc', unit: 'p2', tag: 'TP 5 (1 a 10)', title: 'Administración de procesos en Linux', stop: 'ps', blurb: 'ps, top y htop, estados de Linux, señales con kill, primer y segundo plano, jobs, fg y bg' },
    { id: 'hilos', unit: 'p3', tag: 'Cap. 4 · TP 4', title: 'Hilos', stop: 'TID', blurb: 'proceso moderno e hilo, qué comparten, ventajas, multinúcleo, concurrencia y paralelismo, modelos de hilos y señales' },
    { id: 'planif', unit: 'p3', tag: 'Cap. 5 · TP 6', title: 'Planificación de CPU', stop: 'RR', blurb: 'apropiativa y no apropiativa, despachador, parámetros, FCFS, SJF, prioridades, Round Robin, colas multinivel y multiprocesador' },
    { id: 'concurrencia', unit: 'p3', tag: 'Cap. 6 · TP 7', title: 'Concurrencia y sección crítica', stop: 'SC', blurb: 'condiciones de carrera, exclusión mutua, sección crítica, requisitos de una solución, soluciones de hardware y test-and-set' },
    { id: 'semaforos', unit: 'p3', tag: 'Cap. 6 · TP 8', title: 'Semáforos y monitores', stop: 'P/V', blurb: 'semáforos binarios y generales, wait y signal, espera activa y bloqueada, monitores y variables condición' },
    { id: 'deadlock', unit: 'p3', tag: 'Cap. 7 · TP 8', title: 'Abrazo mortal', stop: '⟲', blurb: 'condiciones necesarias, grafo de asignación de recursos, prevención, evitación y banquero, detección, recuperación e ignorarlo' },
    { id: 'memoria', unit: 'p3', tag: 'Cap. 8 · TP 5 (11 y 12)', title: 'Gestión de memoria', stop: 'MMU', blurb: 'carga y montaje dinámico, direcciones lógicas y físicas, MMU, asignación contigua, fragmentación, segmentación, paginación y TLB' },
    { id: 'mv', unit: 'p4', tag: 'Cap. 9 · TP 9 y 10', title: 'Memoria virtual', stop: 'MV', blurb: 'paginación bajo demanda, fallo de página, copia durante escritura, sustitución FIFO, óptima y LRU, Belady, marcos, hiperpaginación y conjunto de trabajo' },
    { id: 'es', unit: 'p4', tag: 'Cap. 13 · TP de E/S', title: 'Sistemas de E/S', stop: 'E/S', blurb: 'subsistema de E/S del kernel, puertos, E/S mapeada en memoria y dedicada, sondeo, síncrona y asíncrona, búfer, caché, spooling y errores' },
    { id: 'almac', unit: 'p4', tag: 'Cap. 12', title: 'Almacenamiento masivo', stop: 'RAID', blurb: 'HDD, formato de bajo nivel, SSD, ópticos y cintas, conexión al host, NAS y SAN, planificación de disco y RAID 0, 1, 1+0 y 5' },
    { id: 'sa', unit: 'p4', tag: 'Caps. 11 y 10 · TP 11', title: 'Sistemas de archivos y archivos', stop: 'inodo', blurb: 'formateo, sectores y bloques, SA virtual, asignación contigua, enlazada, FAT e indexada, inodo, directorios, enlaces, rutas y montaje' },
    { id: 'seguridad', unit: 'p4', tag: 'TP 12 · 10.6', title: 'Protección y seguridad', stop: 'rwx', blurb: 'usuarios y grupos, /etc/passwd y shadow, permisos rwx en archivos y directorios, chmod, chown, sticky bit, SUID, SGID, ACL y desborde de buffer' },
  ];

  window.GUIDE = { UNITS, MODULES, LESSONS: [], LABS: {}, h: { esc, table, note, lab, flow, def, fig, frac, eq, num, plot, chart, code } };
})();
