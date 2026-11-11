/* Animaciones: pantalla de entrada al cambiar de tema y glifo animado en la cabecera de cada lección.
   Adaptadas del "Laboratorio Frontend DSW" de Mateo Rusconi. Expone window.ANIM; app.js lo usa en route() y renderLesson(). */
(() => {
  const { LESSONS, MODULES, UNITS } = window.GUIDE;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');

  // Cadena de pasos que se enciende etapa por etapa en la pantalla de entrada
  const PIPES = {
    intro: ['Hardware', 'Kernel (SO)', 'Programas', 'Usuarios'],
    arranque: ['Encender', 'Firmware', 'Cargador', 'Driver del SA', 'Kernel'],
    hw: ['Interrupción', 'Modo kernel', 'Guardar contexto', 'IVT → ISR', 'Volver'],
    api: ['Programa', 'Interfaz (API)', 'Biblioteca', 'Driver', 'Hardware'],
    consola: ['man', 'ls', 'cd', 'chmod', 'ps'],
    c: ['nano', 'gcc -o', './prog', 'probar', 'corregir'],
    ls: ['printf', 'write', 'syscall', 'modo kernel', 'SYSRET'],
    mp: ['Varios programas', 'Ráfagas', 'CPU ocupada', 'Throughput'],
    estructura: ['Monolítica', 'Capas', 'Microkernel', 'Módulos', 'Híbrida'],
    procesos: ['Nuevo', 'Listo', 'Ejecución', 'Espera', 'Terminado'],
    instalacion: ['Imagen', 'Verificar hash', 'Particionar', 'Instalar', 'GRUB'],
    admproc: ['sleep', 'Ctrl-Z', 'bg', 'kill -TERM', 'kill -9'],
    hilos: ['Proceso', 'Recursos', 'Hilo 1', 'Hilo 2', 'Núcleos'],
    planif: ['Cola de listos', 'Algoritmo', 'Despachador', 'CPU', 'Gantt'],
    concurrencia: ['Recurso compartido', 'Concurrencia', 'Condición de carrera', 'Sección crítica', 'Exclusión mutua'],
    semaforos: ['sem_init', 'wait', 'sección crítica', 'signal'],
    deadlock: ['Exclusión mutua', 'Retener y esperar', 'Sin apropiación', 'Espera circular'],
    memoria: ['Dirección lógica', 'p | d', 'Tabla de páginas', 'Marco', 'Física'],
    mv: ['Referencia', '¿Válida?', 'Fallo de página', 'Traer del disco', 'Reiniciar'],
    es: ['Proceso', 'LS', 'Subsistema de E/S', 'Driver', 'Dispositivo'],
    almac: ['Cola de pedidos', 'Planificar', 'Brazo', 'Sector', 'RAID'],
    sa: ['Ruta', 'Directorio', 'Inodo', 'Bloques', 'Datos'],
    seguridad: ['Usuario', 'Grupo', 'Otros', 'rwx', 'chmod'],
  };

  // trap = la confusión típica del tema
  const TRAPS = {
    intro: 'Para la materia el SO es <b>solo el kernel</b>. El shell, la GUI y el explorador son <b>programas del sistema</b>, no el SO.',
    arranque: 'El arranque de la PC <b>termina al cargar el kernel</b>. En BIOS el cargador tiene <b>440 bytes</b> (carga en cadena); en UEFI es un <b>archivo</b> en la ESP de un disco GPT.',
    hw: 'Las <b>excepciones</b> (división por cero, syscall) son interrupciones <b>internas y síncronas</b>. Bit de modo: <b>0 = kernel</b>. Y modo kernel <b>no</b> es lo mismo que ser root.',
    api: '<b>Interfaz</b> = especificación (no hace nada). <b>Biblioteca</b> = implementación. El <b>driver</b> implementa una API y corre en modo kernel.',
    consola: 'El número entre paréntesis es la <b>sección</b> del manual: write(2) es llamada al sistema, printf(3) función de biblioteca. El directorio actual <b>no</b> está en PATH.',
    c: 'Sin <b>-o</b> el ejecutable es <b>a.out</b>. Si nada cambia: no guardaste o no recompilaste. Recorrer por <b>filas</b> es mucho más rápido que por columnas.',
    ls: 'printf <b>no</b> es una llamada al sistema: es un wrapper que termina llamando a <b>write</b>. Solo el tramo entre syscall y SYSRET ejecuta en modo kernel.',
    mp: '<b>Multiprogramación</b> (varios programas en memoria) no es <b>multiprocesamiento</b> (varias CPU). Tiempo compartido minimiza el <b>tiempo de respuesta</b>; lotes, el turnaround.',
    estructura: 'El microkernel es más seguro y portable, pero paga <b>overhead</b> por el paso de mensajes. Para la cátedra, la GUI <b>no</b> es el servicio de interfaz de usuario.',
    procesos: 'Un <b>cambio de contexto</b> no implica cambio de proceso. De <b>espera</b> se pasa a <b>listo</b>, nunca directo a ejecución. Tras fork, el hijo recibe <b>0</b>.',
    instalacion: 'Un SO por <b>partición</b>. Primero <b>Windows</b>, después Linux (GRUB detecta a Windows).',
    admproc: 'Ctrl-Z manda <b>SIGTSTP</b> (el TP dice SIGSTOP). SIGTERM a un proceso <b>detenido</b> queda pendiente hasta SIGCONT; <b>SIGKILL</b> no se puede atrapar.',
    hilos: 'Los hilos comparten código, datos y archivos, pero cada uno tiene su <b>pila</b> y sus registros. En el modelo <b>muchos a uno</b>, si uno se bloquea se bloquean todos.',
    planif: 'El no apropiativo actúa solo en los momentos <b>1 y 4</b>. Espera = tiempo en la <b>cola de listos</b>, no en E/S. RR con cuanto enorme = <b>FCFS</b>.',
    concurrencia: 'La <b>condición de carrera</b> son los factores; la <b>carrera</b> es el error; la <b>sección crítica</b> es el código. contador++ <b>no</b> es atómico.',
    semaforos: 'wait <b>bloquea</b> si el valor es 0. El signal de un monitor sin nadie esperando <b>se pierde</b>; el de un semáforo se recuerda.',
    deadlock: 'Las 4 condiciones son <b>necesarias</b>, no suficientes. La <b>exclusión mutua</b> no se puede negar. Inseguro ≠ abrazo mortal. La mayoría de los SO lo <b>ignoran</b>.',
    memoria: 'La paginación elimina la fragmentación <b>externa</b> (no la interna). Sin TLB, cada acceso son <b>dos</b> accesos a memoria. Hash (8.5.2) <b>no va</b>.',
    mv: 'El fallo de página <b>no es un error</b>. FIFO sufre la <b>anomalía de Belady</b>; LRU y óptimo no. Residente &lt; trabajo ⇒ <b>hiperpaginación</b>.',
    es: '<b>No bloqueante</b> devuelve lo que haya; <b>asíncrona</b> avisa cuando termina. Un búfer puede tener la <b>única copia</b>; una caché, nunca.',
    almac: 'SSTF puede causar <b>inanición</b>. LOOK no llega a los extremos. RAID 0 <b>no</b> tiene redundancia; RAID 5 usa n − 1 discos.',
    sa: 'El directorio <b>no contiene</b> archivos: es una lista de enlaces duros. El nombre <b>no</b> está en el inodo. Un enlace duro no cruza SA.',
    seguridad: 'Borrar un archivo depende del permiso <b>w del directorio</b>. Solo <b>root</b> puede hacer chown. Para tres niveles de acceso hace falta una <b>ACL</b>.',
  };

  // Un SVG de 150×120 por tema, armado con unas pocas plantillas. Sin animación (reduced-motion) cada uno queda legible.
  const d = (s) => `style="animation-delay:${s}s"`;
  const T = (x, y, t, cls = 'gx-t gx-tc') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="middle">${t}</text>`;
  // Capas apiladas (de abajo hacia arriba)
  const layers = (names, hi = -1) => names.map((n, i) => { const y = 96 - i * 22; return `<rect x="22" y="${y}" width="106" height="18" rx="4" class="${i === hi ? 'gx-soft' : 'gx-box'} gx-pop" ${d((i * 0.15).toFixed(2))}/>${T(75, y + 13, n, `gx-t${i === hi ? ' gx-ink' : ''}`)}`; }).join('');
  // Cadena de nodos con flechas
  const chain = (names, y = 60) => { const n = names.length, w = 130 / n; return names.map((t, i) => { const x = 10 + w * i + w / 2; return `${i ? `<path d="M${x - w + 13} ${y}H${x - 13}" class="gx-acc-s gx-draw" pathLength="1" ${d((i * 0.25).toFixed(2))}/>` : ''}<circle cx="${x}" cy="${y}" r="11" class="gx-node gx-pop" ${d((i * 0.25).toFixed(2))}/>${T(x, y + 4, t)}`; }).join(''); };
  const bars = (hs, x0, w, step = 0.12) => hs.map((hh, i) => `<rect x="${x0 + i * w}" y="${106 - hh}" width="${w - 3}" height="${hh}" rx="2" class="gx-soft gx-grow-y" ${d((i * step).toFixed(2))}/>`).join('');
  const AX = '<path d="M12 8V108H142" class="gx-strong"/>';
  const gantt = (segs) => { let x = 12; return segs.map(([w, cls, t], i) => { const r = `<rect x="${x}" y="52" width="${w}" height="20" class="${cls} gx-pop" ${d((i * 0.18).toFixed(2))}/>${T(x + w / 2, 66, t)}`; x += w; return r; }).join('') + '<path d="M12 78H142" class="gx-strong"/>'; };
  const GLYPHS = {
    intro: layers(['Hardware', 'Kernel', 'Programas', 'Usuarios'], 1),
    arranque: chain(['FW', 'MBR', 'VBR', 'SA', 'K']),
    hw: `<rect x="20" y="20" width="110" height="80" rx="8" class="gx-box"/>${['PC', 'IR', 'FLAGS', 'EAX'].map((r, i) => `<rect x="32" y="${28 + i * 17}" width="86" height="13" rx="3" class="gx-soft gx-pop" ${d((i * 0.15).toFixed(2))}/>${T(75, 38 + i * 17, r)}`).join('')}<circle cx="128" cy="22" r="8" class="gx-eqf gx-pop" ${d(0.9)}/>`,
    api: layers(['Driver', 'Biblioteca', 'API', 'Programa'], 2),
    consola: `<rect x="12" y="16" width="126" height="88" rx="8" class="gx-box"/>${T(22, 40, '$ ls -l', 'gx-t')}${T(22, 60, '$ man 2 write', 'gx-t')}<text x="22" y="80" class="gx-t">$ <tspan class="gx-ink">▌</tspan></text>`.replace(/text-anchor="middle"/g, ''),
    c: `<rect x="12" y="16" width="126" height="88" rx="8" class="gx-box"/><text x="22" y="40" class="gx-t">gcc tp.c -o tp</text><text x="22" y="60" class="gx-t">./tp</text><path d="M22 76H${22 + 90}" class="gx-acc-s gx-grow" ${d(0.6)}/>`,
    ls: layers(['Hardware', 'Kernel: sys_write', 'syscall', 'write()', 'printf()'], 2),
    mp: gantt([[30, 'gx-soft', 'A'], [26, 'gx-box', 'B'], [22, 'gx-soft', 'A'], [30, 'gx-box', 'C'], [22, 'gx-soft', 'B']]),
    estructura: `<circle cx="75" cy="60" r="16" class="gx-soft gx-pop"/>${T(75, 64, 'µk')}${[[30, 24, 'FS'], [120, 24, 'Red'], [30, 96, 'Drv'], [120, 96, 'GUI']].map(([x, y, t], i) => `<path d="M${x} ${y}L75 60" class="gx-line gx-dash"/><rect x="${x - 16}" y="${y - 10}" width="32" height="20" rx="4" class="gx-box gx-pop" ${d((0.3 + i * 0.15).toFixed(2))}/>${T(x, y + 4, t)}`).join('')}`,
    procesos: chain(['N', 'L', 'E', 'W', 'T']),
    instalacion: chain(['ISO', '#', 'Part', 'SO', 'GRUB']),
    admproc: `<rect x="12" y="16" width="126" height="88" rx="8" class="gx-box"/><text x="22" y="40" class="gx-t">$ sleep 6000 &amp;</text><text x="22" y="60" class="gx-t">[1] 2140</text><text x="22" y="80" class="gx-t gx-ink">$ kill -STOP %1</text>`,
    hilos: `<rect x="14" y="14" width="122" height="92" rx="10" class="gx-box"/>${T(75, 30, 'proceso')}${[40, 75, 110].map((x, i) => `<path d="M${x} 40C${x - 12} 60 ${x + 12} 76 ${x} 98" class="gx-acc-s gx-draw" pathLength="1" ${d((i * 0.3).toFixed(2))}/>`).join('')}`,
    planif: gantt([[24, 'gx-soft', 'P1'], [24, 'gx-box', 'P2'], [24, 'gx-soft', 'P3'], [24, 'gx-box', 'P1'], [34, 'gx-soft', 'P3']]),
    concurrencia: `<rect x="58" y="44" width="34" height="32" rx="6" class="gx-soft"/>${T(75, 64, 'x')}<path d="M18 30L56 52" class="gx-acc-s gx-draw" pathLength="1"/><path d="M132 30L94 52" class="gx-sup gx-draw" pathLength="1" ${d(0.3)}/>${T(18, 24, 'P1')}${T(132, 24, 'P2')}<circle cx="75" cy="96" r="7" class="gx-errf gx-pop" ${d(1)}/>`,
    semaforos: `<rect x="60" y="14" width="30" height="80" rx="8" class="gx-box"/><circle cx="75" cy="32" r="8" class="gx-errf gx-pop"/><circle cx="75" cy="54" r="8" class="gx-warnf gx-pop" ${d(0.4)}/><circle cx="75" cy="76" r="8" class="gx-okf gx-pop" ${d(0.8)}/>${T(75, 112, 'S = 1')}`,
    deadlock: `<circle cx="40" cy="38" r="12" class="gx-node"/>${T(40, 42, 'P1')}<circle cx="110" cy="82" r="12" class="gx-node"/>${T(110, 86, 'P2')}<rect x="98" y="26" width="24" height="24" class="gx-box"/>${T(110, 42, 'R1')}<rect x="28" y="70" width="24" height="24" class="gx-box"/>${T(40, 86, 'R2')}<path d="M52 38H96" class="gx-acc-s gx-draw" pathLength="1"/><path d="M110 52V68" class="gx-sup gx-draw" pathLength="1" ${d(0.3)}/><path d="M98 82H54" class="gx-acc-s gx-draw" pathLength="1" ${d(0.6)}/><path d="M40 68V52" class="gx-sup gx-draw" pathLength="1" ${d(0.9)}/>`,
    memoria: `<rect x="14" y="44" width="40" height="22" rx="4" class="gx-soft"/>${T(34, 59, 'p | d')}<path d="M56 55H74" class="gx-acc-s gx-draw" pathLength="1"/>${[0, 1, 2, 3].map((i) => `<rect x="76" y="${24 + i * 18}" width="22" height="16" class="gx-box gx-pop" ${d((0.2 + i * 0.1).toFixed(2))}/>`).join('')}<path d="M100 55H118" class="gx-sup gx-draw" pathLength="1" ${d(0.7)}/><rect x="120" y="44" width="20" height="22" rx="4" class="gx-eqf gx-pop" ${d(1)}/>`,
    mv: `${AX}${bars([30, 70, 90, 50, 86, 40, 20], 16, 18)}<path d="M14 40H140" class="gx-sup gx-dash"/>${T(124, 34, 'marcos')}`,
    es: layers(['Dispositivo', 'Controladora', 'Driver', 'Subsistema E/S', 'Proceso'], 2),
    almac: `<ellipse cx="75" cy="60" rx="56" ry="40" class="gx-box"/><ellipse cx="75" cy="60" rx="34" ry="24" class="gx-box"/><ellipse cx="75" cy="60" rx="8" ry="6" class="gx-soft"/><path d="M140 20L92 52" class="gx-acc-s gx-draw" pathLength="1"/><circle cx="92" cy="52" r="4" class="gx-eqf gx-pop" ${d(0.8)}/>`,
    sa: `<text x="10" y="22" class="gx-t">/home/ana/tp.c</text><path d="M30 28V48" class="gx-acc-s gx-draw" pathLength="1"/><rect x="12" y="50" width="56" height="20" rx="4" class="gx-soft gx-pop" ${d(0.3)}/>${T(40, 64, 'inodo 42')}${[0, 1, 2].map((i) => `<path d="M68 60L${92 + i * 18} ${88}" class="gx-line"/><rect x="${84 + i * 18}" y="88" width="16" height="16" class="gx-box gx-pop" ${d((0.6 + i * 0.15).toFixed(2))}/>`).join('')}`,
    seguridad: `${['rwx', 'r-x', 'r--'].map((t, i) => `<rect x="${14 + i * 42}" y="44" width="38" height="28" rx="5" class="${i ? 'gx-box' : 'gx-soft'} gx-pop" ${d((i * 0.2).toFixed(2))}/>${T(33 + i * 42, 63, t)}`).join('')}${T(75, 96, 'chmod 754')}`,
  };
  const glyph = (modId) => (GLYPHS[modId] ? `<svg viewBox="0 0 150 120" focusable="false">${GLYPHS[modId]}</svg>` : '');

  // Pantalla de entrada: se cierra sola, con un clic o con cualquier tecla
  function interstitial(n, title, mod) {
    return new Promise((res) => {
      const unit = UNITS.find((u) => u.id === mod.unit);
      const tag = `${mod.tag} · ${unit.title}`;
      const stages = PIPES[mod.id];
      const el = document.createElement('div');
      el.className = 'inter';
      el.dataset.u = mod.unit;
      el.tabIndex = -1;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-label', `Lección ${n}: ${title.replace(/<[^>]*>/g, '')}`);
      el.innerHTML = `<div class="inter-box">
        <p class="inter-typed" style="--steps:${tag.length}" aria-hidden="true">${tag}</p>
        <h2>${mod.title}</h2>
        <p class="inter-pipe" aria-hidden="true">${stages.map((s, i) => `${i ? '<span class="ar">→</span>' : ''}<span class="s" ${d((0.35 + i * 0.16).toFixed(2))}>${s}</span>`).join('')}</p>
        <p class="inter-trap"><span class="lbl">Confusión típica en el parcial</span>${TRAPS[mod.id]}</p>
        <p class="inter-hint">Tocá o presioná una tecla para entrar</p>
      </div>`;
      let closed = false;
      const end = (e) => {
        if (closed) return;
        closed = true;
        // La tecla que cierra no llega a los atajos de la guía (flechas, /, Escape)
        if (e?.type === 'keydown') { e.preventDefault(); e.stopPropagation(); }
        window.removeEventListener('keydown', end, true);
        el.classList.add('out');
        setTimeout(() => el.remove(), 330);
        res();
      };
      el.addEventListener('click', end);
      window.addEventListener('keydown', end, true);
      document.body.append(el);
      el.focus();
      setTimeout(end, 3200);
    });
  }

  // Al entrar a una lección de otro tema. skip = true solo registra el tema (primera carga).
  let lastModule = null;
  function intro(lessonId, skip) {
    const i = LESSONS.findIndex((l) => l.id === lessonId);
    const mod = MODULES.find((m) => m.id === LESSONS[i]?.module);
    if (!mod || mod.id === lastModule) return Promise.resolve();
    lastModule = mod.id;
    if (skip || RM.matches || !PIPES[mod.id]) return Promise.resolve();
    return interstitial(i + 1, LESSONS[i].title, mod);
  }

  window.ANIM = { intro, glyph };
})();
