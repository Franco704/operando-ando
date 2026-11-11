/* Tercer parcial: gestión de memoria (cap. 8) y TP 5, ejercicios 11 y 12 (pila, recursión y manejadores de señales). */
(() => {
  const { h, LESSONS, so } = window.GUIDE;
  const { note, table, def, flow, code, num } = h;

  LESSONS.push(
    {
      id: 'direcciones-y-mmu', module: 'memoria', title: 'Carga dinámica, montaje dinámico y direcciones',
      keywords: 'gestión de memoria carga dinámica montaje dinámico enlace dinámico stub DLL bibliotecas compartidas enlace de direcciones compilación carga ejecución código absoluto reubicable dirección lógica física virtual MMU registro de reubicación base límite protección',
      tldr: 'La CPU genera direcciones <b>lógicas</b>; la <b>MMU</b> las traduce a <b>físicas</b> en tiempo de ejecución. Los registros <b>base y límite</b> confinan a cada proceso en su espacio. La <b>carga dinámica</b> (la hace el programador) y el <b>montaje dinámico</b> (bibliotecas compartidas con un stub) permiten no tener todo el código en memoria.',
      goals: ['Comparar carga dinámica y montaje dinámico.', 'Explicar en qué etapas se pueden ligar las direcciones.', 'Distinguir dirección lógica y física, y explicar base, límite y MMU.'],
      body: `
<p>Gestionar la RAM importa porque la MP la comparte entre muchos procesos. Desde acá, la cátedra trabaja con <b>Silberschatz como única bibliografía</b>, con lectura y síntesis a cargo de los alumnos y consultas citando página y párrafo.</p>
${note('<b>Exclusiones del capítulo 8:</b> 8.2 (intercambio de procesos completos) no va, salvo lo que pide el TP de memoria virtual; de 8.3.1 no va el último párrafo; 8.5.2 (tablas hash) no va; 8.7 (ejemplo Intel) no va.', 'warn')}
<h2>Carga dinámica y montaje dinámico</h2>
${table(['', 'Carga dinámica (8.1.4)', 'Montaje dinámico (8.1.5)'], [
  ['Idea', 'Las rutinas que no siempre se usan quedan en disco en formato reubicable y se cargan cuando se llaman', 'Las bibliotecas se compilan en un binario aparte y se enlazan al ejecutar'],
  ['Quién lo hace', '<b>El programador</b> (el SO puede ayudar con bibliotecas)', 'El SO y el cargador: en cada llamada hay un <b>stub</b>'],
  ['Ventaja', 'Ejecutar programas sin tenerlos completos en memoria; ahorrar RAM', 'Compartir una copia entre procesos; actualizar la biblioteca sin recompilar'],
  ['Desventaja', 'Complicado y propenso a errores', 'Versionado; dependencia de que la biblioteca esté'],
])}
<p>El <b>stub</b> es un pequeño fragmento de código que localiza la rutina de biblioteca residente en memoria (o la carga), <b>se reemplaza a sí mismo</b> con la dirección de la rutina y la ejecuta. En Windows las bibliotecas de montaje dinámico son las <b>DLL</b>. El montaje dinámico <b>no</b> sirve por sí solo para ejecutar programas más grandes que la RAM (eso es carga dinámica o memoria virtual).</p>
<h2>Enlace de direcciones (8.1.2)</h2>
<p>Las direcciones cambian de forma: <b>simbólicas</b> en el fuente (nombres de variables) → <b>reubicables</b> al compilar (“14 bytes desde el comienzo del módulo”) → <b>absolutas</b> (74014). Sin soporte, un programa tendría que cargarse siempre en la dirección 0000, lo que no puede ser con varios programas (y ahí suele estar el SO con el vector de interrupciones).</p>
${table(['Momento del enlace', 'Cuándo sirve', 'Consecuencia'], [
  ['Compilación', 'Se sabe a priori dónde va a estar en memoria', 'Código <b>absoluto</b>: si cambia la ubicación, hay que recompilar'],
  ['Carga', 'No se sabe al compilar', 'Código <b>reubicable</b>; se fija al cargar'],
  ['Ejecución', 'El proceso puede moverse durante la ejecución', 'Requiere <b>hardware</b> (MMU, registros base y límite)'],
])}
<h2>Direcciones lógicas y físicas</h2>
<ul>
  <li><b>Lógica</b> (o virtual): la que genera la CPU. <b>Física</b>: la que ve la unidad de memoria.</li>
  <li>Son <b>iguales</b> si el enlace es en compilación o en carga; <b>difieren</b> si es en ejecución.</li>
  <li>El programa de usuario trabaja <b>solo con direcciones lógicas</b>: nunca ve las físicas (la diapositiva aclara que “el usuario solo genera direcciones lógicas” se refiere al compilador: el programador usa simbólicas).</li>
  <li><b>MMU</b> (unidad de gestión de memoria): dispositivo de hardware que en tiempo de ejecución traduce lógicas a físicas. El esquema más simple: sumar el <b>registro de reubicación</b> (el registro base) a cada dirección.</li>
</ul>
<h2>Protección: base y límite</h2>
<p>El registro <b>base</b> tiene la dirección física más chica del proceso; el <b>límite</b>, el tamaño del rango. La CPU verifica <b>cada acceso</b> en modo usuario: si la dirección lógica no es menor que el límite, se produce una excepción (trap) al SO. Están en la CPU y solo se cargan con instrucciones <b>privilegiadas</b>: un programa de usuario no puede cambiarlos. En cada cambio de proceso el despachador los carga con los valores del nuevo, que se guardan en el <b>PCB</b>.</p>
${h.eq('si dirección lógica &lt; límite ⇒ física = base + lógica; si no ⇒ trap al SO')}`,
      labs: [{ type: 'calc', title: 'Base y límite', fields: [{ id: 'b', label: 'Registro base', value: 14000 }, { id: 'l', label: 'Registro límite', value: 3000 }, { id: 'd', label: 'Dirección lógica', value: 346 }],
        run: (v) => (v.d < 0 || v.d >= v.l ? `${v.d} ≥ límite ${v.l}: excepción (trap). El SO trata el acceso como error de direccionamiento (en Linux, SIGSEGV).` : `${v.d} < ${v.l}: acceso válido\nFísica = ${v.b} + ${v.d} = ${v.b + v.d}`) }],
      quiz: [
        { q: '¿Qué diferencia principal hay entre carga dinámica y montaje dinámico?', o: ['La carga dinámica la implementa el programador; el montaje dinámico enlaza bibliotecas compartidas al ejecutar mediante un stub', 'La carga dinámica comparte bibliotecas entre procesos; el montaje dinámico carga rutinas del propio programa bajo demanda', 'Son lo mismo con distinto nombre en Windows y en Linux', 'La carga dinámica requiere MMU y el montaje dinámico no requiere ningún soporte del SO'], a: 0, e: 'La carga dinámica es diseño del programa; el montaje dinámico (DLL, .so) es soporte del SO con stubs.' },
        { q: '¿Quién traduce direcciones lógicas a físicas en tiempo de ejecución?', o: ['La MMU, un dispositivo de hardware', 'El compilador, al generar el ejecutable', 'El SO, en cada instrucción que accede a memoria', 'El cargador, al poner el programa en memoria'], a: 0, e: 'Hacerlo por software en cada acceso sería lentísimo: lo hace la MMU.' },
        { q: '¿Cuándo coinciden las direcciones lógicas y las físicas?', o: ['Con enlace en compilación o en carga', 'Siempre: la MMU solo verifica los permisos de acceso', 'Solo cuando el enlace se hace en tiempo de ejecución', 'Solo en sistemas con paginación y sin TLB'], a: 0, e: 'Con enlace en ejecución (MMU), difieren.' },
        { q: '¿Dónde se guardan los valores de base y límite de un proceso cuando sale de la CPU?', o: ['En su PCB', 'En la tabla de páginas', 'En la pila del proceso', 'En el registro de reubicación del siguiente proceso'], a: 0, e: 'El despachador los guarda y restaura como parte del cambio de proceso.' },
        { q: '¿Cómo se evita que un programa de usuario modifique los registros base y límite?', o: ['Se cargan con instrucciones privilegiadas', 'Están en una zona de memoria de solo lectura del proceso', 'El compilador nunca genera instrucciones para cambiarlos', 'Se cifran con una clave que solo conoce el SO'], a: 0, e: 'Es protección por modo de operación.' },
        { q: 'Si el compilador genera código absoluto y cambia la dirección donde debe cargarse el programa:', o: ['Hay que recompilarlo', 'El cargador lo reubica automáticamente', 'La MMU corrige las direcciones', 'Funciona igual porque las direcciones son lógicas'], a: 0, e: 'Código absoluto = direcciones fijas desde la compilación.' },
        { q: '¿Qué hace el stub en el montaje dinámico?', o: ['Ubica la rutina, se reemplaza con su dirección y la ejecuta', 'Carga en memoria todas las bibliotecas que usa el programa al iniciar', 'Copia el código de la biblioteca dentro del ejecutable al compilar', 'Traduce las direcciones lógicas de la biblioteca a físicas'], a: 0, e: 'Es el “talón” que resuelve la llamada la primera vez.' },
      ],
      open: [{ t: 'text', q: '¿Qué son las direcciones lógicas y físicas, y quién las traduce?', k: [['cpu', 'genera'], ['unidad de memoria', 'memoria física', 've la memoria'], ['mmu'], ['ejecución', 'ejecucion', 'hardware']], need: 3, e: 'La dirección lógica (virtual) es la que genera la CPU al ejecutar el programa; la física es la que ve la unidad de memoria. Con enlace en tiempo de ejecución difieren, y la MMU (hardware) traduce una en otra en cada acceso, por ejemplo sumando el registro de reubicación.' }],
    },
    {
      id: 'asignacion-contigua', module: 'memoria', title: 'Asignación contigua, ajustes y fragmentación',
      keywords: 'asignación contigua particiones múltiples variables huecos primer ajuste mejor ajuste peor ajuste first fit best fit worst fit fragmentación externa interna regla del 50 por ciento compactación',
      tldr: 'En la <b>asignación contigua</b> cada proceso ocupa un único bloque contiguo. Con particiones variables se eligen huecos por <b>primer</b>, <b>mejor</b> o <b>peor ajuste</b>. Aparece la <b>fragmentación externa</b>: hay memoria libre suficiente pero no contigua. Se reduce con <b>compactación</b>, si la reubicación es dinámica.',
      goals: ['Simular primer, mejor y peor ajuste.', 'Distinguir fragmentación externa e interna.', 'Explicar la compactación y su requisito.'],
      body: `
<p>La memoria se divide en dos partes: el <b>SO residente</b> (en memoria baja, con el vector de interrupciones) y los procesos de usuario. En la asignación contigua (8.3), un método primitivo pero muy usado en su época, <b>cada proceso está en una única sección contigua</b>, protegida con los registros de reubicación y límite.</p>
<h2>Particiones múltiples</h2>
<ul>
  <li>Con particiones fijas, el grado de MP queda limitado por la cantidad de particiones.</li>
  <li>Con particiones <b>variables</b>, se asigna lo que cada proceso necesita: la memoria libre queda en <b>huecos</b> de distintos tamaños; al salir un proceso, su partición se libera y se combina con los huecos vecinos.</li>
</ul>
${table(['Algoritmo', 'Elige', 'Busca', 'Resultado'], [
  ['Primer ajuste (first fit)', 'El primer hueco suficiente', 'Hasta encontrar uno', 'Rápido'],
  ['Mejor ajuste (best fit)', 'El hueco más chico que alcance', 'Toda la lista (salvo que esté ordenada)', 'Deja el sobrante más chico'],
  ['Peor ajuste (worst fit)', 'El hueco más grande', 'Toda la lista', 'Deja el sobrante más grande'],
])}
<p>Primer y mejor ajuste son mejores que el peor en velocidad y utilización. Estos algoritmos son de sistemas de <b>particiones variables</b>.</p>
<div class="lab-mount" data-lab="0"></div>
<h2>Fragmentación</h2>
${table(['', 'Externa', 'Interna'], [
  ['Qué es', 'Hay memoria total suficiente para un pedido, pero <b>no es contigua</b>', 'La memoria asignada es un poco más grande que la pedida: la diferencia, dentro de la partición, no se usa'],
  ['Aparece en', 'Asignación contigua con particiones variables, segmentación', 'Particiones fijas, paginación (último marco)'],
])}
<p>Con primer ajuste, por cada N bloques asignados se pierden 0,5 N por fragmentación: <b>un tercio</b> de la memoria puede quedar inutilizable (<b>regla del 50 %</b>).</p>
<p><b>Compactación</b>: mover el contenido de la memoria para juntar todo lo libre en un bloque grande. Solo es posible si la reubicación es <b>dinámica, en tiempo de ejecución</b>. Problema: un proceso con E/S en curso hacia su búfer no se puede mover (hay que bloquearlo en memoria o hacer la E/S solo en búferes del SO). El almacenamiento de respaldo tiene los mismos problemas de fragmentación.</p>`,
      labs: [{ type: 'fit', title: 'Primer, mejor y peor ajuste', intro: 'Ejercicio clásico de Silberschatz: huecos de 100, 500, 200, 300 y 600 KB; pedidos de 212, 417, 112 y 426 KB.', holes: '100 500 200 300 600', reqs: '212 417 112 426' }],
      quiz: [
        { q: 'Huecos de 100, 500, 200, 300 y 600 KB. Llega un pedido de 212 KB con mejor ajuste. ¿Dónde va?', o: ['En el de 300 KB', 'En el de 500 KB', 'En el de 600 KB', 'En el de 200 KB'], a: 0, e: 'El más chico que alcanza: 300 (el de 200 no alcanza). Primer ajuste lo pondría en 500; peor ajuste, en 600.' },
        { q: '¿Qué es la fragmentación externa?', o: ['Hay memoria libre suficiente en total, pero no contigua', 'Un proceso recibe más memoria de la que pidió', 'La memoria del SO queda separada de la de los usuarios', 'Un proceso queda repartido en varios marcos no contiguos'], a: 0, e: 'Recibir más de lo pedido es fragmentación interna; que un proceso quede en marcos no contiguos es lo normal (y deseable) en paginación.' },
        { q: '¿Qué requisito tiene la compactación?', o: ['Reubicación en tiempo de ejecución', 'Que el código sea absoluto, generado al compilar', 'Que los procesos no usen montaje dinámico de bibliotecas', 'Que la memoria esté paginada con marcos de igual tamaño'], a: 0, e: 'Para mover un proceso hay que poder cambiar dónde está sin recompilar ni recargar: enlace en ejecución.' },
        { q: '¿Qué dice la regla del 50 %?', o: ['Con primer ajuste, por N bloques se pierden 0,5 N', 'La mitad de la memoria debe quedar libre para el SO residente', 'El peor ajuste desperdicia la mitad de cada hueco que asigna', 'Cada página desperdicia en promedio la mitad de su tamaño'], a: 0, e: 'Equivale a perder hasta un tercio de la memoria. (Que la fragmentación interna promedio sea medio marco es otro resultado, de paginación.)' },
        { q: 'Los algoritmos de primer, mejor y peor ajuste corresponden a sistemas de:', o: ['Particiones variables', 'Particiones fijas de igual tamaño', 'Paginación pura', 'Memoria virtual con intercambio'], a: 0, e: 'Con particiones fijas no hay huecos de distinto tamaño que elegir; en paginación, cualquier marco sirve.' },
      ],
    },
    {
      id: 'segmentacion-paginacion', module: 'memoria', title: 'Segmentación, paginación y TLB',
      keywords: 'segmentación segmento tabla de segmentos STBR STLR paginación página marco número de página desplazamiento tabla de páginas PTBR PTLR TLB memoria asociativa tasa de aciertos tiempo de acceso efectivo bit válido inválido páginas compartidas paginación jerárquica tabla invertida',
      tldr: 'La <b>segmentación</b> divide el programa en unidades lógicas de tamaño variable (vista del usuario). La <b>paginación</b> divide la memoria lógica en <b>páginas</b> y la física en <b>marcos</b> del mismo tamaño: elimina la fragmentación externa (queda solo interna). La dirección se parte en número de página <i>p</i> y desplazamiento <i>d</i>; la <b>TLB</b> evita el doble acceso a memoria.',
      goals: ['Traducir direcciones con una tabla de páginas.', 'Calcular fragmentación interna y tiempo de acceso efectivo.', 'Comparar segmentación y paginación, y las estructuras de tabla de páginas.'],
      body: `
<h2>Segmentación (8.6 en las diapositivas de referencia)</h2>
<p>Un programa es una colección de <b>segmentos</b>: unidades lógicas como el programa principal, funciones, pila, variables globales, tabla de símbolos, arreglos. La dirección lógica es un par <b>⟨segmento, desplazamiento⟩</b>. La <b>tabla de segmentos</b> tiene, por segmento, la <b>base</b> (dónde empieza en memoria física) y el <b>límite</b> (su longitud); el STBR apunta a la tabla y el STLR dice cuántos segmentos hay. Cada entrada tiene bit de validez y permisos (lectura/escritura/ejecución); el código se comparte a nivel de segmento. Como los segmentos varían en tamaño, vuelve el problema de asignación dinámica y la fragmentación externa.</p>
<h2>Paginación (8.4)</h2>
<ul>
  <li>Memoria física en <b>marcos</b> de tamaño fijo (potencia de 2, entre 512 B y 16 MB); memoria lógica en <b>páginas</b> del mismo tamaño. El respaldo en disco también se divide en páginas.</li>
  <li>Un proceso de N páginas necesita N marcos libres <b>cualesquiera</b>: el espacio físico del proceso no tiene que ser contiguo. Se lleva la cuenta de los marcos libres.</li>
  <li>Una <b>tabla de páginas</b> por proceso traduce página → marco.</li>
  <li><b>No hay fragmentación externa</b>; sí interna (en el último marco).</li>
  <li>El programador <b>no</b> necesita saber que hay paginación: la vista del proceso y la memoria física son muy distintas, y por construcción un proceso solo accede a su propia memoria.</li>
</ul>
${h.eq(`dirección lógica (m bits) = [ p : m − n bits | d : n bits ], con página de 2ⁿ bytes`)}
${h.eq('física = marco(p) × tamaño de página + d')}
<div class="lab-mount" data-lab="0"></div>
<h2>Fragmentación interna</h2>
<p>Páginas de 2048 B y un proceso de 72 766 B: 35 páginas completas + 1086 B → 36 marcos y se desperdician 2048 − 1086 = <b>962 B</b>. En el peor caso, un marco menos un byte; en promedio, <b>medio marco</b>. ¿Conviene una página chica? Menos fragmentación interna, pero tablas más grandes (cada entrada ocupa bytes); por eso las páginas fueron creciendo (Solaris: 8 KB y 4 MB).</p>
<h2>Implementación y TLB</h2>
<p>La tabla está en memoria (PTBR apunta a ella, PTLR da su tamaño): cada acceso necesita <b>dos</b> accesos a memoria (tabla y dato). La <b>TLB</b> (memoria asociativa, búsqueda en paralelo, 64 a 1024 entradas) guarda traducciones recientes. Si la página está (acierto), un acceso; si no (fallo de TLB), se lee la tabla y se carga la traducción en la TLB. Con <b>ASID</b> la TLB distingue procesos; si no, se vacía en cada cambio de proceso.</p>
${h.eq('TAE = α · (ε + t) + (1 − α) · (ε + 2t)', 'Tiempo de acceso efectivo')}
<p>Con α = 80 %, t = 100 ns (despreciando ε, como en el ejemplo): 0,8 × 100 + 0,2 × 200 = <b>120 ns</b>. Con α = 99 %: <b>101 ns</b>. La tasa de aciertos depende de la cantidad de entradas y de la localidad.</p>
<div class="lab-mount" data-lab="1"></div>
<h2>Protección y páginas compartidas</h2>
<ul>
  <li>Bits de protección por marco (solo lectura, lectura-escritura, ejecución) y un bit <b>válido-inválido</b>: válido = la página está en el espacio lógico del proceso. Cualquier violación produce un trap al kernel.</li>
  <li><b>Páginas compartidas</b>: una sola copia de código <b>reentrante</b> (de solo lectura) para muchos procesos (editores, compiladores). También se pueden compartir páginas de datos para IPC.</li>
</ul>
<h2>Estructura de la tabla de páginas (8.5)</h2>
<p>Con 32 bits y páginas de 4 KB, la tabla tiene 2³²/2¹² ≈ 1 millón de entradas; con 4 B cada una, 4 MB por proceso, contiguos. Soluciones:</p>
<ul>
  <li><b>Jerárquica</b>: paginar la tabla de páginas. En dos niveles, p se divide en p1 (índice en la tabla externa, el <b>directorio de páginas</b>) y p2 (desplazamiento dentro de la página de la tabla interna). En 64 bits no alcanza con dos niveles (x86-64 usa cuatro).</li>
  <li><b>Hash</b> (8.5.2): <b>no va</b>.</li>
  <li><b>Invertida</b>: una entrada por <b>marco físico</b> (con qué proceso y qué página tiene), en lugar de una tabla por proceso. Ahorra memoria pero buscar es más lento (se ayuda con hash y TLB) y complica la memoria compartida.</li>
</ul>`,
      labs: [
        { type: 'calc', title: 'Traducir una dirección con la tabla de páginas', intro: 'Ejemplo de las diapositivas: memoria de 32 B, páginas de 4 B, tabla [5, 6, 1, 2]. Escribí −1 para una página inválida.', fields: [{ id: 'ps', label: 'Tamaño de página (B)', value: 4 }, { id: 'tab', label: 'Tabla de páginas (marco por página)', type: 'text', value: '5 6 1 2' }, { id: 'a', label: 'Dirección lógica', value: 13 }],
          run: (v) => { const ps = Math.max(1, Math.round(v.ps)); const t = String(v.tab).split(/[\s,]+/).filter(Boolean).map(Number); const r = so.translate(Math.max(0, Math.round(v.a)), ps, t); const n = Math.log2(ps); return `p = ⌊${v.a} / ${ps}⌋ = ${r.p}, d = ${v.a} mod ${ps} = ${r.d}${Number.isInteger(n) ? `  (los ${n} bits bajos son d)` : '  (el tamaño de página debería ser potencia de 2)'}\n${r.valid ? `Tabla[${r.p}] = marco ${r.f}\nFísica = ${r.f} × ${ps} + ${r.d} = ${r.phys}` : `La página ${r.p} no es válida (fuera de la tabla o marcada inválida): trap al SO.`}`; } },
        { type: 'calc', title: 'Tiempo de acceso efectivo con TLB', fields: [{ id: 'a', label: 'Tasa de aciertos α (%)', value: 80 }, { id: 't', label: 'Acceso a memoria (ns)', value: 100 }, { id: 'e', label: 'Búsqueda en TLB ε (ns)', value: 0 }],
          run: (v) => { const a = Math.min(100, Math.max(0, v.a)) / 100; const r = so.eat(a, v.e, v.t); return `TAE = ${num(a)} × (${v.e} + ${v.t}) + ${num(1 - a)} × (${v.e} + 2 × ${v.t}) = ${num(r)} ns\nSin TLB: ${2 * v.t} ns por acceso (tabla + dato)\nPenalización respecto de un acceso directo: ${num(((r - v.t) / v.t) * 100, 1)} %`; } },
      ],
      quiz: [
        { q: '¿Qué tipo de fragmentación elimina la paginación?', o: ['La externa', 'La interna', 'Ambas', 'Ninguna'], a: 0, e: 'Cualquier marco libre sirve para cualquier página. La interna queda en el último marco de cada proceso.' },
        { q: 'Con páginas de 1 KB, ¿cuántos bits de una dirección lógica de 32 bits son el desplazamiento?', o: ['10', '22', '12', '32'], a: 0, e: '1 KB = 2¹⁰ B: los 10 bits bajos son d y los 22 altos el número de página.' },
        { q: '¿Para qué sirve la TLB?', o: ['Para evitar el acceso extra a la tabla de páginas', 'Para guardar las páginas que fueron desalojadas al disco', 'Para traducir direcciones físicas a lógicas al volver de una E/S', 'Para proteger las páginas de solo lectura del proceso'], a: 0, e: 'Sin TLB, cada acceso a memoria cuesta dos (tabla + dato).' },
        { q: 'Con α = 80 % y 100 ns por acceso a memoria (despreciando la TLB), el tiempo de acceso efectivo es:', o: ['120 ns', '100 ns', '180 ns', '200 ns'], a: 0, e: '0,8 × 100 + 0,2 × 200 = 120 ns (ejemplo de las diapositivas).' },
        { q: '¿Qué tiene cada entrada de la tabla de segmentos?', o: ['La base y el límite del segmento', 'El número de página y el de marco', 'Solo la dirección física del segmento', 'El PID del proceso dueño'], a: 0, e: 'Base = dónde empieza; límite = longitud. Página y marco describen una tabla de páginas; el PID, una tabla invertida.' },
        { q: 'Una tabla de páginas invertida tiene:', o: ['Una entrada por marco físico de la memoria', 'Una entrada por página lógica de cada proceso', 'Una entrada por proceso del sistema', 'Una entrada por segmento'], a: 0, e: 'Una sola tabla para todo el sistema: ahorra memoria pero la búsqueda es más lenta.' },
        { q: '¿Qué permite compartir una copia de código entre muchos procesos en paginación?', o: ['Código reentrante y tablas que apunten a los mismos marcos', 'Que todos los procesos usen el mismo número de página para el código', 'Que el código se cargue en la TLB y no en la RAM', 'Que el código esté descripto en una tabla de páginas invertida'], a: 0, e: 'Las tablas de cada proceso apuntan a los mismos marcos de solo lectura.' },
        { q: '¿Qué es el directorio de páginas en la paginación de dos niveles?', o: ['La tabla externa, que ubica las páginas de la tabla', 'La lista de marcos libres que mantiene el sistema', 'La tabla de páginas de un proceso cuando entra entera en un marco', 'La TLB de segundo nivel de la arquitectura'], a: 0, e: 'p1 indexa el directorio (tabla externa) y p2 la tabla interna.' },
      ],
      open: [
        { t: 'num', q: 'Páginas de 2048 B y un proceso de 72 766 B. ¿Cuántos bytes se pierden por fragmentación interna?', a: 962, u: 'B', e: '72 766 = 35 × 2048 + 1086 → 36 marcos; se desperdician 2048 − 1086 = 962 B (ejemplo de las diapositivas).' },
        { t: 'num', q: 'Páginas de 4 B y tabla [5, 6, 1, 2]. ¿Qué dirección física corresponde a la dirección lógica 13?', a: 9, e: 'p = 13 / 4 = 3, d = 1. Tabla[3] = 2 → física = 2 × 4 + 1 = 9.' },
        { t: 'num', q: 'Con α = 99 % y 100 ns por acceso a memoria (despreciando la TLB), ¿cuál es el tiempo de acceso efectivo en ns?', a: 101, u: 'ns', e: '0,99 × 100 + 0,01 × 200 = 101 ns.' },
      ],
    },
    {
      id: 'memoria-del-proceso', module: 'memoria', title: 'TP 5 (11 y 12): pila, recursión y manejadores de señales',
      keywords: 'recursión pila stack overflow violación de segmento segmentation fault vector zonas de memoria programa datos heap pila signal handler manejador sleep htop CPU ISR',
      tldr: 'Una función recursiva sin fin llena la <b>pila</b> (cada llamada apila parámetros, locales y dirección de retorno) hasta que el SO la corta con <b>violación de segmento</b>: cuanto más grande el vector local, menos llamadas entran. Un <b>manejador de señal</b> es una función que el kernel hace ejecutar cuando llega la señal, como una ISR.',
      goals: ['Ubicar variables en programa, datos, heap y pila.', 'Explicar el segmentation fault por recursión.', 'Usar signal() para manejar varias señales.'],
      body: `
<h2>Ejercicio 11: recursión sin fin</h2>
${code(`#include <stdio.h>
int contador = 0;                 /* zona de datos (global) */
void recursiva(void) {
    int vector[10];               /* pila: cada llamada tiene el suyo */
    contador++;
    printf("%d\\n", contador);
    recursiva();                  /* sin condicion de salida */
}
int main(void) { recursiva(); }`, 'c')}
<ul>
  <li><code>contador</code> (global) va en <b>datos</b>; <code>vector</code> (local) en la <b>pila</b>; el código de las funciones en la zona de <b>programa</b> (texto). El heap no se usa (no hay malloc).</li>
  <li>Cada llamada apila un marco: dirección de retorno, registros guardados y las variables locales (el vector de 10 int = 40 B, más alineación). La pila tiene un tamaño máximo (en Linux, 8 MB por defecto: <code>ulimit -s</code>). Al pasarlo, el acceso cae fuera del espacio válido y el SO manda <b>SIGSEGV</b>: “Violación de segmento”.</li>
  <li>Con vector de <b>1</b> entran <b>más</b> llamadas; con <b>100</b>, menos: la cantidad es aproximadamente tamaño de la pila / tamaño del marco. (Con optimización, el compilador podría eliminar un vector que no se usa: compilar sin <code>-O</code>.)</li>
</ul>
<h2>Ejercicio 12: manejador de señales</h2>
<p>La LS <code>signal(señal, función)</code> (secciones 2 y 7 del manual) registra qué función ejecutar cuando llega una señal; también puede pedir ignorarla (SIG_IGN) o volver al comportamiento por defecto (SIG_DFL). Un programa que se queda en un bucle con <code>sleep(100)</code> casi no usa CPU (duerme); con <code>sleep(0.1)</code>… en C, <code>sleep</code> recibe un entero, así que 0.1 se convierte en <b>0</b>: el bucle no duerme nunca y pasa a usar el 100 % de un núcleo (espera activa).</p>
${code(`#include <signal.h>
#include <stdio.h>
#include <unistd.h>
int sigs[] = {SIGINT, SIGTERM, SIGUSR1, SIGUSR2, SIGHUP};
int cont[5];
void manejador(int s) {
    for (int i = 0; i < 5; i++) if (sigs[i] == s) cont[i]++;
    printf("INT=%d TERM=%d USR1=%d USR2=%d HUP=%d\\n", cont[0], cont[1], cont[2], cont[3], cont[4]);
}
int main(void) {
    for (int i = 0; i < 5; i++) signal(sigs[i], manejador);
    printf("PID %d\\n", getpid());
    while (1) sleep(100);         /* se despierta al llegar cada senal */
}`, 'c')}
<p>Desde otra terminal: <code>kill -USR1 PID</code>, <code>kill -TERM PID</code>… Como atrapa SIGINT y SIGTERM, Ctrl-C ya no lo termina: hay que usar <code>kill -9</code> (SIGKILL no se puede atrapar). La rutina del SO más parecida es la <b>rutina de servicio de interrupción (ISR)</b>: una función asociada a un evento, que interrumpe el flujo normal y después vuelve.</p>`,
      quiz: [
        { q: '¿Por qué una función recursiva sin condición de salida termina con “Violación de segmento”?', o: ['Porque la pila supera su tamaño máximo', 'Porque el contador global desborda y se vuelve negativo', 'Porque el heap se llena con los vectores locales de cada llamada', 'Porque el planificador mata los procesos que nunca hacen E/S'], a: 0, e: 'La pila tiene un límite; al pasarlo se accede fuera del espacio válido y llega SIGSEGV.' },
        { q: 'Si el vector local de la función recursiva pasa de 10 a 100 enteros:', o: ['Entran menos llamadas antes del error', 'Entran más llamadas, porque el vector pasa al heap', 'La cantidad no cambia, porque el vector no se usa', 'El programa deja de fallar porque el SO agranda la pila'], a: 0, e: 'Llamadas ≈ tamaño de pila / tamaño de marco.' },
        { q: '¿Qué rutina del SO se parece a un manejador de señales?', o: ['Una ISR', 'El despachador del planificador', 'El planificador de largo plazo', 'El stub del montaje dinámico'], a: 0, e: 'Ambas se ejecutan al ocurrir un evento, interrumpiendo el flujo normal, y luego se vuelve.' },
        { q: 'Un programa atrapa SIGINT y SIGTERM con signal(). ¿Cómo se lo termina desde otra terminal?', o: ['Con kill -9', 'Con Ctrl-C en su terminal', 'Con kill y el PID, sin opciones', 'No se puede terminar sin reiniciar'], a: 0, e: 'Ctrl-C manda SIGINT y kill manda SIGTERM: ambos atrapados.' },
        { q: 'Una variable global int contador; se almacena en:', o: ['La zona de datos', 'La pila', 'El heap', 'La zona de programa'], a: 0, e: 'Globales y estáticas van en datos; locales en la pila; malloc en el heap.' },
      ],
      exercises: [
        { official: '5.11', level: 2, title: 'Recursión infinita', prompt: '<p>Cree una función recursiva sin condición de salida que muestre un contador y tenga un vector de 10 enteros sin usar. a. ¿En qué zona va cada variable? b. ¿Cuántas llamadas hasta el “Segmentation fault” y por qué? c. Con vector de 1 y de 100, ¿cambia?</p>', solution: { explain: '<p>a. El contador global en datos (si fuera local estática también; si se pasa por parámetro, en la pila); el vector en la pila; el código en programa. b. Depende del sistema: con pila de 8 MB y marcos de ~64 B, del orden de cien mil llamadas. El error es por desbordar la pila: cada llamada apila un marco que nunca se libera. c. Sí: con vector de 1 entran más llamadas (marco más chico) y con 100, menos (marco de ~400 B).</p>' } },
        { official: '5.12', level: 3, title: 'handler.c', prompt: '<p>a. Zonas de memoria de las variables. b. Qué hace la LS signal (man 2 y 7). c. Propósito del programa. d. Consumo de CPU con sleep(100) y con sleep(0.1): ¿por qué la diferencia? e. Maneje 5 señales con un contador cada una. f. ¿Qué rutina del SO se parece?</p>', solution: { explain: '<p>a. Globales en datos, locales en pila. b. Registra la función que se ejecutará al recibir una señal (o la ignora o restaura el comportamiento por defecto). c. Mostrar cómo un proceso atrapa señales con un manejador propio en lugar del comportamiento por defecto. d. Con sleep(100) el proceso duerme y casi no usa CPU; sleep recibe un entero, así que sleep(0.1) es sleep(0): el bucle gira sin dormir y usa el 100 % de un núcleo (espera activa). Con <code>usleep(100000)</code> sí dormiría 0,1 s. e. Ver el código de la lección. f. La rutina de servicio de interrupción.</p>' } },
      ],
    },
  );
})();
