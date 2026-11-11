/* Terminal simulada: un sistema de archivos con inodos, enlaces y permisos, y procesos con señales y trabajos (jobs).
   No ejecuta nada real: alcanza para practicar los TP de consola, administración de procesos, sistemas de archivos y protección.
   cfg: { tasks?: [{ t, check: (sh) => bool }], setup?: ['comandos previos'], user? } */
(() => {
  const L = window.GUIDE.LABS;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const USERS = { root: { uid: 0, gid: 0, home: '/root' }, alumno: { uid: 1000, gid: 1000, home: '/home/alumno' }, usuario: { uid: 1001, gid: 1001, home: '/home/usuario' } };
  const GROUPS = { 0: 'root', 1000: 'alumno', 1001: 'usuario', 5: 'tty' };
  const SIG = { HUP: 1, INT: 2, KILL: 9, TERM: 15, CONT: 18, STOP: 19, TSTP: 20 };
  const SIGNAME = Object.fromEntries(Object.entries(SIG).map(([k, v]) => [v, `SIG${k}`]));
  // Páginas de manual mínimas: nombre -> [sección, descripción]
  const MAN = {
    ls: [1, 'listar el contenido de directorios'], cd: [1, 'cambiar el directorio actual (interna de bash)'], pwd: [1, 'mostrar el directorio actual'],
    mkdir: [1, 'crear directorios'], rmdir: [1, 'eliminar directorios vacíos'], touch: [1, 'cambiar fechas de un archivo; lo crea si no existe'],
    cat: [1, 'concatenar archivos y mostrarlos en la salida estándar'], cp: [1, 'copiar archivos y directorios'], mv: [1, 'mover o renombrar archivos'],
    rm: [1, 'eliminar archivos o directorios'], ln: [1, 'crear enlaces entre archivos'], stat: [1, 'mostrar el estado de un archivo (datos del inodo)'],
    file: [1, 'determinar el tipo de un archivo'], chmod: [1, 'cambiar los permisos de un archivo'], chown: [1, 'cambiar el dueño y el grupo de un archivo'],
    ps: [1, 'informar el estado de los procesos'], top: [1, 'mostrar los procesos en tiempo real'], kill: [1, 'enviar una señal a un proceso'],
    sleep: [1, 'esperar una cantidad de segundos'], man: [1, 'interfaz de los manuales de referencia del sistema'], which: [1, 'ubicar un comando en el PATH'],
    whoami: [1, 'mostrar el usuario efectivo'], nice: [1, 'ejecutar un programa con otra prioridad de planificación'], free: [1, 'mostrar la memoria libre y usada'],
    df: [1, 'informar el espacio usado por los sistemas de archivos'], du: [1, 'estimar el espacio usado por archivos'], time: [1, 'medir el tiempo de ejecución de un programa'],
    history: [3, 'historial de comandos (interna de bash)'], printf: [3, 'salida con formato (biblioteca de C, stdio.h)'], write: [2, 'escribir en un descriptor de archivo (llamada al sistema)'],
    fork: [2, 'crear un proceso hijo'], execve: [2, 'ejecutar un programa'], wait: [2, 'esperar que un proceso cambie de estado'], open: [2, 'abrir y posiblemente crear un archivo'],
    signal: [2, 'manejo de señales ANSI C'], gets: [3, 'leer una cadena de la entrada estándar (NO USAR: desborde de buffer)'], fgets: [3, 'leer una cadena con límite de tamaño'],
    scanf: [3, 'conversión de entrada con formato'], malloc: [3, 'reservar memoria dinámica'], strcpy: [3, 'copiar una cadena'], pow: [3, 'función de potencia'],
    sqrt: [3, 'función raíz cuadrada'], syscalls: [2, 'llamadas al sistema de Linux'], intro: [2, 'introducción a las llamadas al sistema'], passwd: [5, 'archivo de contraseñas (formato de /etc/passwd)'],
    signal7: [7, 'descripción general de las señales'],
  };

  L.shell = (el, cfg) => {
    // ---------- Sistema de archivos ----------
    let inoNext = 2;
    const nodes = {};
    const mk = (type, mode, uid, extra = {}) => { const ino = inoNext++; nodes[ino] = { ino, type, mode, uid, gid: uid === 0 ? 0 : uid, size: 0, data: '', time: '11 nov 10:00', ...extra }; if (type === 'd') nodes[ino].ents = new Map(); return ino; };
    const ROOT = mk('d', '755', 0);
    nodes[ROOT].ents.set('.', ROOT); nodes[ROOT].ents.set('..', ROOT);
    let user = cfg.user || 'alumno';
    let cwd = ROOT;
    const U = () => USERS[user];
    const nlink = (ino) => {
      let c = 0;
      for (const x of Object.values(nodes)) if (x.type === 'd') for (const [name, v] of x.ents) if (v === ino) c++;
      return c;
    };
    // Resolver una ruta; follow = seguir el último enlace simbólico
    function resolve(path, { follow = true, parent = false } = {}) {
      if (path === '~' || path.startsWith('~/')) path = U().home + path.slice(1);
      let cur = path.startsWith('/') ? ROOT : cwd;
      const parts = path.split('/').filter(Boolean);
      if (parent) { const last = parts.pop(); const dir = parts.length ? resolve((path.startsWith('/') ? '/' : '') + parts.join('/')) : cur; return { dir, name: last }; }
      for (let i = 0; i < parts.length; i++) {
        const n = nodes[cur];
        if (!n || n.type !== 'd') return null;
        if (!can(n, 'x')) throw new Error('Permiso denegado');
        let nx = n.ents.get(parts[i]);
        if (nx == null) return null;
        let hops = 0;
        while (nodes[nx].type === 'l' && (follow || i < parts.length - 1)) {
          if (++hops > 8) throw new Error('Demasiados niveles de enlaces simbólicos');
          const tgt = nodes[nx].data;
          const save = cwd; cwd = cur; const r = resolve(tgt); cwd = save;
          if (r == null) return null;
          nx = r;
        }
        cur = nx;
      }
      return cur;
    }
    const pathOf = (ino) => {
      if (ino === ROOT) return '/';
      const parts = [];
      let cur = ino;
      for (let guard = 0; cur !== ROOT && guard < 50; guard++) {
        const parent = nodes[cur].ents.get('..');
        const name = [...nodes[parent].ents].find(([k, v]) => v === cur && k !== '.' && k !== '..')?.[0];
        parts.unshift(name); cur = parent;
      }
      return '/' + parts.join('/');
    };
    // Permisos: r, w o x para el usuario actual (root puede todo salvo ejecutar sin ningún x)
    function can(n, what) {
      const m = n.mode.slice(-3).split('').map(Number);
      const bit = { r: 4, w: 2, x: 1 }[what];
      if (U().uid === 0) return what !== 'x' || n.type === 'd' || m.some((v) => v & 1);
      if (n.uid === U().uid) return !!(m[0] & bit);
      if (n.gid === U().gid) return !!(m[1] & bit);
      return !!(m[2] & bit);
    }
    function mkdirAt(dirIno, name, mode = '755') {
      const ino = mk('d', mode, U().uid);
      nodes[ino].ents.set('.', ino); nodes[ino].ents.set('..', dirIno);
      nodes[dirIno].ents.set(name, ino);
      nodes[ino].size = 4096;
      return ino;
    }
    // Estructura inicial
    const sysMk = (path, mode = '755') => { let cur = ROOT; for (const p of path.split('/').filter(Boolean)) { cur = nodes[cur].ents.get(p) ?? (() => { const save = user; user = 'root'; const i = mkdirAt(cur, p, mode); user = save; return i; })(); } return cur; };
    ['bin', 'dev', 'etc', 'home', 'proc', 'usr/bin', 'var', 'root'].forEach((p) => sysMk(p));
    nodes[sysMk('tmp')].mode = '1777';
    nodes[sysMk('root')].mode = '700';
    for (const [name, u] of Object.entries(USERS)) if (name !== 'root') { const h = sysMk(`home/${name}`); nodes[h].uid = u.uid; nodes[h].gid = u.gid; }
    const sysFile = (dir, name, data, mode = '644', uid = 0, extra = {}) => { const ino = mk('-', mode, uid, { data, size: data.length, ...extra }); nodes[resolveRaw(dir)].ents.set(name, ino); return ino; };
    function resolveRaw(path) { let cur = ROOT; for (const p of path.split('/').filter(Boolean)) cur = nodes[cur].ents.get(p); return cur; }
    sysFile('/etc', 'passwd', 'root:x:0:0:root:/root:/bin/bash\nalumno:x:1000:1000:Alumno,,,:/home/alumno:/bin/bash\nusuario:x:1001:1001:Usuario,,,:/home/usuario:/bin/bash\n');
    sysFile('/etc', 'group', 'root:x:0:\ntty:x:5:\nalumno:x:1000:\nusuario:x:1001:\n');
    const shadow = sysFile('/etc', 'shadow', 'root:$y$j9T$...:19700:0:99999:7:::\nalumno:$y$j9T$...:19700:0:99999:7:::\n', '640');
    nodes[shadow].gid = 42;
    ['ls', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'ln', 'stat', 'chmod', 'ps', 'kill', 'sleep', 'bash', 'touch'].forEach((c) => sysFile('/bin', c, '\x7fELF', '755', 0, { size: 142312 }));
    sysFile('/usr/bin', 'bsd-write', '\x7fELF', '2755', 0, { size: 11264 });
    nodes[resolveRaw('/usr/bin/bsd-write')].gid = 5;
    nodes[resolveRaw('/usr/bin')].ents.set('write', mk('l', '777', 0, { data: '/usr/bin/bsd-write', size: 18 }));
    cwd = resolveRaw(U().home);

    // ---------- Procesos ----------
    let pidNext = 2140;
    const bash = { pid: 2131, cmd: 'bash', state: 'S', user };
    let procs = [];
    let jobs = [];          // [{ n, pid }]
    let fg = null;          // proceso en primer plano (la terminal queda ocupada)
    const env = { PATH: '/usr/local/bin:/usr/bin:/bin', HOME: U().home, USER: user };
    const hist = [];
    const jobOf = (pid) => jobs.find((j) => j.pid === pid);
    const curJob = () => jobs.at(-1);
    const reap = (p, how) => {
      procs = procs.filter((x) => x !== p);
      const j = jobOf(p.pid);
      jobs = jobs.filter((x) => x !== j);
      if (fg === p) fg = null;
      return j ? `[${j.n}]   ${how.padEnd(22)}${p.cmd}` : '';
    };
    // Entrega de una señal a un proceso
    function signal(p, sig) {
      if (sig === SIG.KILL) return reap(p, 'Terminado (killed)');
      if (sig === SIG.STOP || sig === SIG.TSTP) { p.state = 'T'; if (fg === p) fg = null; const j = jobOf(p.pid) || addJob(p); return `[${j.n}]+  Detenido               ${p.cmd}`; }
      if (sig === SIG.CONT) {
        if (p.state !== 'T') return '';
        if (p.pendingTerm) return reap(p, 'Terminado');   // la señal TERM quedó pendiente mientras estaba detenido
        p.state = 'S'; return '';
      }
      if (sig === SIG.TERM || sig === SIG.INT || sig === SIG.HUP) {
        if (p.state === 'T') { p.pendingTerm = true; return ''; }   // queda pendiente hasta que se reanude
        return reap(p, sig === SIG.INT ? 'Interrumpido' : 'Terminado');
      }
      return '';
    }
    const addJob = (p) => { const j = { n: (jobs.at(-1)?.n || 0) + 1, pid: p.pid }; jobs.push(j); return j; };
    const findProc = (arg) => {
      if (arg.startsWith('%')) { const j = jobs.find((x) => x.n === +arg.slice(1)); return j && procs.find((p) => p.pid === j.pid); }
      return procs.find((p) => p.pid === +arg) || (+arg === bash.pid ? bash : null);
    };
    const parseSig = (s) => {
      if (!s) return SIG.TERM;
      s = s.replace(/^-/, '').replace(/^SIG/i, '').toUpperCase();
      if (/^\d+$/.test(s)) return +s;
      return SIG[s] ?? null;
    };

    // ---------- Listados ----------
    const modeStr = (n) => {
      const t = n.type === 'd' ? 'd' : n.type === 'l' ? 'l' : n.type === 'c' ? 'c' : '-';
      return t + window.GUIDE.so.octToSym(n.mode);
    };
    const uname = (uid) => Object.entries(USERS).find(([, u]) => u.uid === uid)?.[0] || uid;
    const lsLine = (name, ino, o) => {
      const n = nodes[ino];
      const shown = n.type === 'l' ? `${name} -> ${n.data}` : name;
      if (!o.l) return (o.i ? `${String(ino).padStart(4)} ` : '') + shown;
      const size = o.h && n.size >= 1024 ? `${(n.size / 1024).toFixed(n.size >= 10240 ? 0 : 1)}K` : String(n.size);
      return `${o.i ? `${String(ino).padStart(4)} ` : ''}${modeStr(n)} ${nlink(ino)} ${String(uname(n.uid)).padEnd(7)} ${String(GROUPS[n.gid] ?? n.gid).padEnd(7)} ${size.padStart(6)} ${n.time} ${shown}`;
    };

    // ---------- Comandos ----------
    const C = {};
    const flags = (args) => { const o = {}, rest = []; for (const a of args) { if (/^-[a-zA-Z]+$/.test(a)) for (const c of a.slice(1)) o[c] = true; else rest.push(a); } return [o, rest]; };
    const need = (cond, msg) => { if (!cond) throw new Error(msg); };
    C.help = () => `Comandos: ${Object.keys(C).sort().join(' ')}\nAtajos: los botones Ctrl-C y Ctrl-Z mandan SIGINT y SIGTSTP al proceso en primer plano.`;
    C.pwd = () => pathOf(cwd);
    C.whoami = () => user;
    C.id = () => `uid=${U().uid}(${user}) gid=${U().gid}(${GROUPS[U().gid]})`;
    C.clear = () => { out.innerHTML = ''; return null; };
    C.echo = (a) => a.join(' ').replace(/\$(\w+)/g, (_, v) => env[v] ?? '');
    C.history = () => hist.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n');
    C.su = (a) => {
      const who = a.filter((x) => x !== '-')[0] || 'root';
      need(USERS[who], `su: el usuario ${who} no existe`);
      user = who; env.USER = who; env.HOME = U().home;
      if (a.includes('-')) cwd = resolveRaw(U().home);
      return `(sesión de ${who}${who === 'root' ? ': el prompt termina en #' : ''})`;
    };
    C.exit = () => { if (user !== (cfg.user || 'alumno')) { user = cfg.user || 'alumno'; return `(volviste a ${user})`; } return 'Esta terminal no se cierra: es parte del laboratorio.'; };
    C.cd = (a) => {
      const t = a[0] || U().home;
      const ino = resolve(t === '-' ? U().home : t);
      need(ino != null, `bash: cd: ${t}: No existe el archivo o el directorio`);
      need(nodes[ino].type === 'd', `bash: cd: ${t}: No es un directorio`);
      need(can(nodes[ino], 'x'), `bash: cd: ${t}: Permiso denegado`);
      cwd = ino; return '';
    };
    C.ls = (a) => {
      const [o, rest] = flags(a);
      const targets = rest.length ? rest : ['.'];
      return targets.map((t) => {
        const ino = resolve(t, { follow: !o.l || t.endsWith('/') });
        need(ino != null, `ls: no se puede acceder a '${t}': No existe el archivo o el directorio`);
        const n = nodes[ino];
        if (n.type !== 'd' || o.d) return lsLine(t, ino, o);
        need(can(n, 'r'), `ls: no se puede abrir el directorio '${t}': Permiso denegado`);
        const ents = [...n.ents].filter(([k]) => o.a || !k.startsWith('.')).sort(([x], [y]) => x.localeCompare(y));
        const body = ents.map(([k, v]) => lsLine(k, v, o));
        const head = targets.length > 1 ? `${t}:\n` : '';
        return head + (o.l ? `total ${ents.length * 4}\n` : '') + (o.l || o.i ? body.join('\n') : body.join('  '));
      }).join('\n\n');
    };
    C.dir = (a) => C.ls(['-l', ...a]);
    C.mkdir = (a) => {
      const [o, rest] = flags(a);
      need(rest.length, 'mkdir: falta un operando');
      rest.forEach((p) => {
        if (o.p) { let cur = p.startsWith('/') ? ROOT : cwd; for (const part of p.split('/').filter(Boolean)) { const nx = nodes[cur].ents.get(part); cur = nx ?? (need(can(nodes[cur], 'w'), `mkdir: no se puede crear el directorio '${p}': Permiso denegado`), mkdirAt(cur, part)); } return; }
        const { dir, name } = resolve(p, { parent: true });
        need(dir != null, `mkdir: no se puede crear el directorio '${p}': No existe el archivo o el directorio`);
        need(!nodes[dir].ents.has(name), `mkdir: no se puede crear el directorio '${p}': El archivo ya existe`);
        need(can(nodes[dir], 'w') && can(nodes[dir], 'x'), `mkdir: no se puede crear el directorio '${p}': Permiso denegado`);
        mkdirAt(dir, name);
      });
      return '';
    };
    const createFile = (p, data = '') => {
      const { dir, name } = resolve(p, { parent: true });
      need(dir != null && nodes[dir].type === 'd', `${p}: No existe el archivo o el directorio`);
      need(can(nodes[dir], 'w') && can(nodes[dir], 'x'), `no se puede crear '${p}': Permiso denegado`);
      const ino = mk('-', '644', U().uid, { data, size: data.length });
      nodes[dir].ents.set(name, ino);
      return ino;
    };
    C.touch = (a) => { a.forEach((p) => { const ino = resolve(p); if (ino == null) createFile(p); else nodes[ino].time = '11 nov 10:05'; }); return ''; };
    C.cat = (a) => a.map((p) => {
      const ino = resolve(p);
      need(ino != null, `cat: ${p}: No existe el archivo o el directorio`);
      need(nodes[ino].type !== 'd', `cat: ${p}: Es un directorio`);
      need(can(nodes[ino], 'r'), `cat: ${p}: Permiso denegado`);
      return nodes[ino].data.replace(/\n$/, '');
    }).join('\n');
    // Borrar una entrada respetando permisos del directorio y sticky bit
    const unlinkEntry = (dir, name, label) => {
      const d = nodes[dir];
      need(can(d, 'w') && can(d, 'x'), `rm: no se puede borrar '${label}': Permiso denegado`);
      const sticky = d.mode.length === 4 && +d.mode[0] & 1;
      const ino = d.ents.get(name);
      need(!sticky || U().uid === 0 || nodes[ino].uid === U().uid || d.uid === U().uid, `rm: no se puede borrar '${label}': Operación no permitida (sticky bit)`);
      d.ents.delete(name);
      if (!nlink(ino)) delete nodes[ino];   // sin enlaces duros, el inodo se libera
    };
    C.rm = (a) => {
      const [o, rest] = flags(a);
      rest.forEach((p) => {
        const { dir, name } = resolve(p, { parent: true });
        const ino = dir != null ? nodes[dir].ents.get(name) : null;
        need(ino != null, `rm: no se puede borrar '${p}': No existe el archivo o el directorio`);
        if (nodes[ino].type === 'd') {
          need(o.r || o.R, `rm: no se puede borrar '${p}': Es un directorio`);
          const rec = (dIno) => { for (const [k, v] of [...nodes[dIno].ents]) if (k !== '.' && k !== '..') { if (nodes[v].type === 'd') rec(v); unlinkEntry(dIno, k, k); } };
          rec(ino);
        }
        unlinkEntry(dir, name, p);
      });
      return '';
    };
    C.rmdir = (a) => { a.forEach((p) => { const ino = resolve(p); need(ino != null && nodes[ino].type === 'd', `rmdir: fallo al borrar '${p}': No es un directorio`); need(nodes[ino].ents.size === 2, `rmdir: fallo al borrar '${p}': El directorio no está vacío`); const { dir, name } = resolve(p, { parent: true }); unlinkEntry(dir, name, p); }); return ''; };
    C.ln = (a) => {
      const [o, rest] = flags(a);
      need(rest.length === 2, 'ln: uso: ln [-s] DESTINO NOMBRE_DEL_ENLACE');
      const [target, linkName] = rest;
      const { dir, name } = resolve(linkName, { parent: true });
      need(dir != null && !nodes[dir].ents.has(name), `ln: no se pudo crear el enlace '${linkName}': El archivo ya existe`);
      need(can(nodes[dir], 'w'), `ln: no se pudo crear el enlace '${linkName}': Permiso denegado`);
      if (o.s) { nodes[dir].ents.set(name, mk('l', '777', U().uid, { data: target, size: target.length })); return ''; }
      const ino = resolve(target);
      need(ino != null, `ln: fallo al acceder a '${target}': No existe el archivo o el directorio`);
      need(nodes[ino].type !== 'd', `ln: '${target}': no se permiten enlaces duros para directorios`);
      nodes[dir].ents.set(name, ino);
      return '';
    };
    C.cp = (a) => {
      const [, rest] = flags(a);
      need(rest.length === 2, 'cp: falta el archivo de destino');
      const src = resolve(rest[0]);
      need(src != null && nodes[src].type !== 'd', `cp: no se puede efectuar stat sobre '${rest[0]}'`);
      need(can(nodes[src], 'r'), `cp: no se puede abrir '${rest[0]}' para lectura: Permiso denegado`);
      let dst = rest[1];
      const di = resolve(dst);
      if (di != null && nodes[di].type === 'd') dst = `${dst.replace(/\/$/, '')}/${rest[0].split('/').pop()}`;
      const ex = resolve(dst);
      if (ex != null) { nodes[ex].data = nodes[src].data; nodes[ex].size = nodes[src].size; } else createFile(dst, nodes[src].data);
      return '';
    };
    C.mv = (a) => {
      need(a.length === 2, 'mv: falta el archivo de destino');
      const from = resolve(a[0], { parent: true });
      const ino = from.dir != null ? nodes[from.dir].ents.get(from.name) : null;
      need(ino != null, `mv: no se puede efectuar stat sobre '${a[0]}': No existe el archivo o el directorio`);
      let dst = a[1];
      const di = resolve(dst);
      if (di != null && nodes[di].type === 'd') dst = `${dst.replace(/\/$/, '')}/${from.name}`;
      const to = resolve(dst, { parent: true });
      need(can(nodes[from.dir], 'w') && can(nodes[to.dir], 'w'), 'mv: Permiso denegado');
      nodes[to.dir].ents.set(to.name, ino);
      nodes[from.dir].ents.delete(from.name);
      if (nodes[ino].type === 'd') nodes[ino].ents.set('..', to.dir);
      return '';   // mv dentro del mismo SA no cambia el inodo
    };
    C.stat = (a) => a.map((p) => {
      const ino = resolve(p, { follow: false });
      need(ino != null, `stat: no se puede efectuar stat sobre '${p}': No existe el archivo o el directorio`);
      const n = nodes[ino];
      const kind = { d: 'directorio', '-': n.size ? 'fichero regular' : 'fichero regular vacío', l: 'enlace simbólico', c: 'fichero especial de caracteres' }[n.type];
      return `  Fichero: ${p}${n.type === 'l' ? ` -> ${n.data}` : ''}\n  Tamaño: ${n.size}\tBloques: ${Math.ceil(n.size / 4096) * 8}\tBloque E/S: 4096   ${kind}\nDispositivo: 8,1\tNodo-i: ${ino}\tEnlaces: ${nlink(ino)}\nAcceso: (${n.mode.padStart(4, '0')}/${modeStr(n)})  Uid: (${n.uid}/${uname(n.uid)})  Gid: (${n.gid}/${GROUPS[n.gid] ?? n.gid})\nModificación: ${n.time} 2026`;
    }).join('\n');
    C.file = (a) => a.map((p) => { const ino = resolve(p, { follow: false }); need(ino != null, `${p}: cannot open`); const n = nodes[ino]; return `${p}: ${n.type === 'd' ? 'directory' : n.type === 'l' ? `symbolic link to ${n.data}` : n.data.startsWith('\x7fELF') ? 'ELF 64-bit LSB pie executable, x86-64' : n.size ? 'ASCII text' : 'empty'}`; }).join('\n');
    C.chmod = (a) => {
      const [, rest] = flags(a);
      need(rest.length >= 2, 'chmod: falta un operando');
      const [m, ...files] = rest;
      files.forEach((p) => {
        const ino = resolve(p);
        need(ino != null, `chmod: no se puede acceder a '${p}': No existe el archivo o el directorio`);
        const n = nodes[ino];
        need(U().uid === 0 || n.uid === U().uid, `chmod: cambiando los permisos de '${p}': Operación no permitida`);
        if (/^[0-7]{3,4}$/.test(m)) { n.mode = m.length === 4 && m[0] === '0' ? m.slice(1) : m; return; }
        // Modo simbólico: [ugoa]*[+-=][rwxst]+ separados por comas
        let sym = window.GUIDE.so.octToSym(n.mode).split('');
        for (const part of m.split(',')) {
          const mm = part.match(/^([ugoa]*)([+\-=])([rwxst]*)$/);
          need(mm, `chmod: modo inválido: '${m}'`);
          const who = mm[1] || 'a';
          const set = (idx, ch, on) => { sym[idx] = on ? ch : '-'; };
          const groups = { u: 0, g: 3, o: 6 };
          for (const w of who === 'a' ? 'ugo' : who) {
            const base = groups[w];
            for (const [k, ch] of [['r', 0], ['w', 1], ['x', 2]]) {
              if (mm[2] === '=') set(base + ch, k, mm[3].includes(k));
              else if (mm[3].includes(k)) set(base + ch, k, mm[2] === '+');
            }
            if (mm[3].includes('s') && w !== 'o') sym[base + 2] = sym[base + 2] === 'x' || sym[base + 2] === 's' ? (mm[2] === '-' ? 'x' : 's') : (mm[2] === '-' ? '-' : 'S');
            if (mm[3].includes('t') && (w === 'o' || who === 'a')) sym[8] = mm[2] === '-' ? (sym[8] === 't' ? 'x' : '-') : (sym[8] === 'x' || sym[8] === 't' ? 't' : 'T');
          }
        }
        n.mode = window.GUIDE.so.symToOct(sym.join(''));
      });
      return '';
    };
    C.chown = (a) => {
      need(a.length >= 2, 'chown: falta un operando');
      const [who, p] = a;
      const ino = resolve(p);
      need(ino != null, `chown: no se puede acceder a '${p}'`);
      need(U().uid === 0, `chown: cambiando el propietario de '${p}': Operación no permitida (solo root puede regalar archivos)`);
      const [u, g] = who.split(':');
      need(USERS[u], `chown: usuario inválido: '${u}'`);
      nodes[ino].uid = USERS[u].uid;
      const gid = Object.entries(GROUPS).find(([, v]) => v === g)?.[0];
      if (gid != null) nodes[ino].gid = +gid;
      return '';
    };
    C.which = (a) => a.map((c) => (['ls', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'ln', 'stat', 'chmod', 'ps', 'kill', 'sleep', 'bash', 'touch'].includes(c) ? `/bin/${c}` : c === 'write' ? '/usr/bin/write' : '')).join('\n');
    C.tree = () => {
      const lines = ['.'];
      const walk = (ino, pre, depth) => {
        if (depth > 6) return;
        const ents = [...nodes[ino].ents].filter(([k]) => k !== '.' && k !== '..').sort(([x], [y]) => x.localeCompare(y));
        ents.forEach(([k, v], i) => {
          const last = i === ents.length - 1;
          const n = nodes[v];
          lines.push(`${pre}${last ? '└── ' : '├── '}${k}${n.type === 'l' ? ` -> ${n.data}` : ''}`);
          if (n.type === 'd') walk(v, pre + (last ? '    ' : '│   '), depth + 1);
        });
      };
      walk(cwd, '', 0);
      return lines.join('\n');
    };
    C.man = (a) => {
      const [o, rest] = flags(a);
      const w = rest[0];
      need(w, '¿Qué página de manual desea?');
      if (o.k) { const hits = Object.entries(MAN).filter(([k, [, d]]) => k.includes(w) || window.GUIDE.so.norm(d).includes(window.GUIDE.so.norm(w))); return hits.length ? hits.map(([k, [s, d]]) => `${k.replace(/\d$/, '')} (${s}) - ${d}`).join('\n') : `${w}: nada apropiado.`; }
      const sec = /^\d$/.test(w) ? w : null;
      const name = sec ? rest[1] : w;
      const e = MAN[name] || (sec === '7' && MAN[`${name}7`]);
      need(e, `No hay ninguna entrada de manual para ${name}`);
      if (o.f) return `${name} (${e[0]}) - ${e[1]}`;
      return `${name.toUpperCase()}(${e[0]})\n\nNOMBRE\n       ${name} - ${e[1]}\n\n(Resumen de la página. En la máquina virtual, 'man ${name}' muestra la página completa; se sale con q.)`;
    };
    C.free = () => '               total        usado        libre  compartido   búf/caché   disponible\nMem:            3916         1012         1873          14        1031         2648\nInter:           975            0          975';
    C.df = () => 'S.ficheros     Tamaño Usados  Disp Uso% Montado en\n/dev/sda1         19G   6,1G   12G  35% /\ntmpfs            1,9G      0  1,9G   0% /dev/shm';
    C.tty = () => '/dev/pts/0';
    // Procesos
    C.sleep = (a, bg) => {
      need(a[0], 'sleep: falta un operando');
      const p = { pid: pidNext++, cmd: `sleep ${a[0]}`, state: 'S', user };
      procs.push(p);
      if (bg) { const j = addJob(p); return `[${j.n}] ${p.pid}`; }
      fg = p;
      return `(sleep ${a[0]} corre en primer plano: la terminal queda ocupada. Probá Ctrl-Z o Ctrl-C)`;
    };
    const psRow = (p, o) => (o.u ? `${String(p.user).padEnd(8)} ${String(p.pid).padStart(5)}  0.0  0.0   8320  ${p.cmd === 'bash' ? '5220' : '1012'} pts/0    ${p.state}${fg === p ? '+' : ' '}   10:00   0:00 ${p.cmd}`
      : `${String(p.pid).padStart(5)} pts/0    ${o.stat ? `${p.state}${fg === p || p === bash ? '+' : ' '}   ` : ''} 00:00:00 ${p.cmd}`);
    C.ps = (a) => {
      const o = {};
      for (const x of a) for (const c of x.replace(/^-/, '')) o[c] = true;
      const st = o.a || o.u || o.x || o.l;
      const head = o.u ? 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND' : `  PID TTY      ${st ? 'STAT ' : ''}     TIME CMD`;
      const list = [bash, ...procs, ...(o.x ? [{ pid: 1, cmd: '/sbin/init', state: 'S', user: 'root' }] : []), { pid: pidNext++, cmd: `ps ${a.join(' ')}`.trim(), state: 'R', user }];
      return [head, ...list.map((p) => psRow(p, { u: o.u, stat: st }))].join('\n');
    };
    C.jobs = (a) => jobs.map((j) => { const p = procs.find((x) => x.pid === j.pid); const mark = j === curJob() ? '+' : j === jobs.at(-2) ? '-' : ' '; return `[${j.n}]${mark}  ${a.includes('-l') ? `${p.pid} ` : ''}${p.state === 'T' ? 'Detenido   ' : 'Ejecutando '}            ${p.cmd} &`; }).join('\n');
    C.bg = (a) => { const p = a[0] ? findProc(a[0]) : procs.find((x) => x.pid === curJob()?.pid); need(p, 'bash: bg: el trabajo actual no existe'); const msg = signal(p, SIG.CONT); return msg || `[${jobOf(p.pid).n}]+ ${p.cmd} &`; };
    C.fg = (a) => { const p = a[0] ? findProc(a[0]) : procs.find((x) => x.pid === curJob()?.pid); need(p, 'bash: fg: el trabajo actual no existe'); const msg = signal(p, SIG.CONT); if (msg) return msg; fg = p; return `${p.cmd}\n(en primer plano: la terminal queda ocupada. Ctrl-Z lo detiene, Ctrl-C lo interrumpe)`; };
    C.kill = (a) => {
      if (a[0] === '-l') return Object.entries(SIGNAME).map(([n, s]) => `${n}) ${s}`).join('  ');
      const s = a[0]?.startsWith('-') ? parseSig(a[0]) : SIG.TERM;
      const targets = a[0]?.startsWith('-') ? a.slice(1) : a;
      need(s != null, `bash: kill: ${a[0]}: especificación de señal inválida`);
      need(targets.length, 'kill: uso: kill [-s señal | -n numseñal | -señal] pid | idtrabajo');
      return targets.map((t) => {
        const p = findProc(t);
        need(p, `bash: kill: (${t}) - No existe el proceso`);
        if (p === bash) return s === SIG.KILL ? '(no vamos a matar la terminal del laboratorio)' : '';
        need(p.user === user || user === 'root', `bash: kill: (${t}) - Operación no permitida`);
        return signal(p, s);
      }).filter(Boolean).join('\n');
    };
    C.killall = (a) => {
      const s = a[0]?.startsWith('-') ? parseSig(a[0]) : SIG.TERM;
      const name = a.filter((x) => !x.startsWith('-'))[0];
      const ps = procs.filter((p) => p.cmd.split(' ')[0] === name);
      need(ps.length, `${name}: no se encontró ningún proceso`);
      return ps.map((p) => signal(p, s)).filter(Boolean).join('\n');
    };
    C.pkill = C.killall;
    C.top = () => `top - 10:00:01 up 1:02,  1 user,  load average: 0,00, 0,01, 0,00\nTareas: ${procs.length + 90} total,   1 ejecutar, ${procs.filter((p) => p.state === 'S').length + 89} hibernar, ${procs.filter((p) => p.state === 'T').length} detener,   0 zombie\n\n  PID USUARIO   PR  NI    VIRT    RES  S  %CPU  %MEM     HORA+ ORDEN\n${[bash, ...procs].map((p) => `${String(p.pid).padStart(5)} ${String(p.user).padEnd(8)}  20   0    8320   1012  ${p.state}   0,0   0,0   0:00.00 ${p.cmd.split(' ')[0]}`).join('\n')}\n(foto instantánea: el top real se actualiza cada 3 s y se sale con q)`;
    C.htop = C.top;

    // ---------- Intérprete ----------
    const tokenize = (line) => (line.match(/"[^"]*"|'[^']*'|\S+/g) || []).map((t) => t.replace(/^["']|["']$/g, ''));
    function exec(line) {
      line = line.trim();
      if (!line) return '';
      hist.push(line);
      if (fg) return `(la terminal está ocupada por "${fg.cmd}": usá Ctrl-Z para detenerlo o Ctrl-C para interrumpirlo)`;
      let bg = false;
      if (line.endsWith('&')) { bg = true; line = line.slice(0, -1).trim(); }
      // Redirección simple > y >>
      const red = line.match(/^(.*?)\s*(>>?)\s*(\S+)$/);
      let target = null, append = false;
      if (red && !line.startsWith('ln')) { line = red[1]; target = red[3]; append = red[2] === '>>'; }
      const [cmd, ...args] = tokenize(line);
      if (!C[cmd]) {
        if (cmd.startsWith('./')) return `bash: ${cmd}: No existe el archivo o el directorio`;
        return `bash: ${cmd}: orden no encontrada${MAN[cmd] ? ` (en esta terminal simulada no está; leé "man ${cmd}")` : ''}`;
      }
      let res = C[cmd](args, bg);
      if (target != null) {
        const ino = resolve(target);
        if (ino == null) createFile(target, (res ?? '') + '\n');
        else { need(can(nodes[ino], 'w'), `bash: ${target}: Permiso denegado`); nodes[ino].data = (append ? nodes[ino].data : '') + (res ?? '') + '\n'; nodes[ino].size = nodes[ino].data.length; }
        res = '';
      }
      return res;
    }
    const api = { resolve: (p) => { try { return resolve(p); } catch { return null; } }, node: (ino) => nodes[ino], nlink, procs: () => procs, jobs: () => jobs, user: () => user, cwd: () => pathOf(cwd), hist };

    // ---------- Interfaz ----------
    el.innerHTML = `
      ${cfg.tasks ? `<ol class="sh-tasks">${cfg.tasks.map((t, i) => `<li data-t="${i}"><span class="sh-box" aria-hidden="true"></span><span>${t.t}</span></li>`).join('')}</ol>` : ''}
      <div class="sh" role="group" aria-label="Terminal simulada">
        <pre class="sh-out" aria-live="polite"></pre>
        <form class="sh-in"><label class="sh-prompt" for=""></label><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Comando"></form>
      </div>
      <div class="lab-row sh-keys">
        <button class="btn sm" type="button" data-k="c">Ctrl-C</button><button class="btn sm" type="button" data-k="z">Ctrl-Z</button>
        <button class="btn sm" type="button" data-k="help">help</button><button class="btn sm" type="button" data-k="reset">Reiniciar</button>
        <span class="lab-score" aria-live="polite"></span>
      </div>`;
    const out = el.querySelector('.sh-out');
    const input = el.querySelector('input');
    const prompt = el.querySelector('.sh-prompt');
    const id = `sh${Math.random().toString(36).slice(2, 8)}`;
    input.id = id; prompt.setAttribute('for', id);
    const ps1 = () => { const p = pathOf(cwd).replace(U().home, '~'); return `${user}@soutn:${p}${user === 'root' ? '#' : '$'}`; };
    const print = (cmdLine, res) => {
      out.insertAdjacentHTML('beforeend', `<span class="sh-p">${esc(ps1Prev)}</span> ${esc(cmdLine)}\n${res ? `${esc(res)}\n` : ''}`);
      out.scrollTop = out.scrollHeight;
    };
    let ps1Prev = ps1();
    const refresh = () => { prompt.textContent = ps1(); ps1Prev = ps1(); checkTasks(); };
    function checkTasks() {
      if (!cfg.tasks) return;
      let ok = 0;
      el.querySelectorAll('.sh-tasks li').forEach((li) => { let good = false; try { good = !!cfg.tasks[+li.dataset.t].check(api); } catch {} li.classList.toggle('is-ok', good); ok += good; });
      el.querySelector('.lab-score').innerHTML = `<span class="chip ${ok === cfg.tasks.length ? 'ok' : 'acc'}">${ok} de ${cfg.tasks.length} tareas</span>`;
    }
    const run = (line, show = true) => {
      ps1Prev = ps1();
      let res;
      try { res = exec(line); } catch (e) { res = e.message; }
      if (show && res !== null) print(line, res);
      refresh();
    };
    (cfg.setup || []).forEach((l) => { try { exec(l); } catch {} });
    hist.length = 0;
    out.textContent = cfg.welcome || 'Terminal simulada. Escribí "help" para ver los comandos.\n';
    refresh();
    let hpos = 0;
    el.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; hpos = hist.length; });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && hist.length) { hpos = Math.max(0, hpos - 1); input.value = hist[hpos]; e.preventDefault(); }
      if (e.key === 'ArrowDown') { hpos = Math.min(hist.length, hpos + 1); input.value = hist[hpos] || ''; e.preventDefault(); }
      if (e.ctrlKey && (e.key === 'c' || e.key === 'z') && fg) { e.preventDefault(); key(e.key); }
    });
    const key = (k) => {
      ps1Prev = ps1();
      if (!fg) { print(k === 'c' ? '^C' : '^Z', ''); refresh(); return; }
      const res = signal(fg, k === 'c' ? SIG.INT : SIG.TSTP);
      print(k === 'c' ? '^C' : '^Z', k === 'c' ? '' : res);
      refresh();
    };
    el.querySelector('.sh-keys').addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      if (b.dataset.k === 'reset') { L.shell(el, cfg); return; }
      if (b.dataset.k === 'help') { run('help'); input.focus(); return; }
      key(b.dataset.k); input.focus();
    });
  };
})();
