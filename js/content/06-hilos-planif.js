/* Tercer parcial: hilos (cap. 4 y TP 4) y planificación de CPU (cap. 5 y TP 6). */
(() => {
  const { h, LESSONS } = window.GUIDE;
  const { note, table, def, flow, code, num } = h;

  LESSONS.push(
    {
      id: 'hilos-concepto', module: 'hilos', title: 'Proceso moderno e hilo',
      keywords: 'hilo hebra thread TID TCB proceso pesado clásico multinúcleo SMP concurrencia paralelismo datos tareas clone ventajas desventajas Amdahl hyperthreading',
      tldr: 'En el <b>proceso moderno</b>, el proceso es la parte <b>contenedora de recursos</b> (memoria, archivos, programa) y el <b>hilo</b> es la parte <b>activa</b>: tiene contexto de CPU, pila propia y un TID. Los hilos de un proceso comparten código, datos y archivos; el planificador planifica <b>hilos</b>. Crear un hilo es mucho más barato que crear un proceso.',
      goals: ['Definir hilo y proceso moderno, y compararlos con el proceso clásico.', 'Decir qué comparten y qué no los hilos de un proceso.', 'Explicar ventajas y desventajas, y la ley de Amdahl.'],
      body: `
<h2>Motivación: más de un núcleo</h2>
<ul>
  <li><b>SMP</b> (multiprocesamiento simétrico): más de una CPU en un motherboard, compartiendo E/S y RAM. En servidores, 4 CPU que dan 500 respuestas/s rinden como una de 2000 (si la E/S alcanza).</li>
  <li>Desde 2005 (Pentium D) hay CPU <b>multinúcleo</b> para PC: el chip tiene varios núcleos y cada uno ejecuta un flujo de instrucciones a la vez. Hoy los Xeon llegan a 60 núcleos.</li>
  <li>Un programa con un solo flujo de ejecución usa <b>un</b> núcleo: si compilar el kernel tarda 20 minutos en un Pentium Gold G5400 (2 núcleos), en un Threadripper 3970X (32) podría bajar a poco más de un minuto <b>solo si</b> el trabajo se reparte en muchos flujos. Si tarda 17, el cuello de botella es otro (E/S, partes secuenciales).</li>
</ul>
${table(['', 'Definición'], [
  ['Concurrencia', 'Permite que más de un proceso progrese a la vez (intercalado o en paralelo)'],
  ['Paralelismo', 'Ejecutar más de una instrucción al mismo tiempo (requiere varios núcleos)'],
  ['Paralelismo de datos', 'La misma función sobre datos distintos (sumar mitades de un arreglo en dos núcleos)'],
  ['Paralelismo de tareas', 'Funciones distintas de un mismo procedimiento en paralelo'],
])}
${note('No confundir <b>multiprocesamiento</b> (varias CPU o núcleos) con <b>multiprogramación</b> (varios programas en memoria). Con un núcleo puede haber concurrencia pero no paralelismo.', 'exam')}
<h2>Proceso moderno e hilo</h2>
${table(['', 'Proceso (moderno)', 'Hilo'], [
  ['Rol', '<b>Contenedor</b> de recursos: RAM, dispositivos, archivos, programa. La parte estática (la cocina, el aula)', 'Parte <b>activa</b>: ejecuta instrucciones'],
  ['Tiene', 'Espacio de direcciones, PCB, recursos', 'Contexto de CPU (registros, PC), <b>pila propia</b>, TID, TCB'],
  ['Lo planifica', '—', 'El planificador: el hilo es la <b>unidad básica de utilización de un núcleo</b>'],
])}
<p>El <b>proceso clásico o pesado</b> (el concepto anterior) equivale a un proceso moderno con un solo hilo. Los hilos de un proceso ejecutan el mismo programa y acceden a los mismos datos, pero pueden ejecutar funciones distintas o sobre datos distintos (porque tienen contexto y pila separados), y pueden ejecutar en paralelo si hay varios núcleos. <b>Si un hilo se bloquea, los demás del proceso no se bloquean.</b></p>
${table(['Comparten (del proceso)', 'Propio de cada hilo'], [['Código, datos (globales), heap, archivos abiertos, señales y manejadores, espacio de direcciones', 'TID, contador de programa, registros, pila, estado']])}
<h2>Crear un hilo es más barato</h2>
<p>No hay que asignar recursos ni espacio en RAM, ni cargar código, ni inicializar un PCB: solo ubicar su pila e inicializar un <b>TCB</b> (mucho más chico que un PCB). Eliminarlo también es sencillo (salvo que sea el último hilo del proceso). El kernel también puede ser multihilo. En Linux los hilos se crean con la LS <code>clone()</code>.</p>
<h2>Ventajas y desventajas</h2>
${table(['Ventajas', 'Desventajas'], [
  ['<b>Interactividad</b>: la ejecución continúa aunque parte del proceso esté bloqueada (interfaces de usuario)', 'Más complejidad al desarrollar'],
  ['<b>Compartir recursos</b>: más fácil que memoria compartida o mensajes', 'Compartir más fácilmente exige más control: problemas de concurrencia'],
  ['<b>Economía</b>: crear y cambiar de hilo cuesta menos que con procesos (clave en servidores)', ''],
  ['<b>Aprovechar multinúcleo</b> (y Hyperthreading/SMT)', ''],
])}
<h2>Ley de Amdahl</h2>
<p>Si una fracción <i>S</i> del programa es secuencial, con <i>N</i> núcleos la aceleración máxima es</p>
${h.eq(`aceleración ≤ ${h.frac('1', `S + ${h.frac('1 − S', 'N')}`)}`)}
<p>Con S = 25 %, aunque haya infinitos núcleos, la aceleración no supera 4: la parte secuencial manda.</p>`,
      labs: [
        { type: 'calc', title: 'Ley de Amdahl', fields: [{ id: 's', label: 'Parte secuencial (%)', value: 25 }, { id: 'n', label: 'Núcleos', value: 4 }],
          run: (v) => { const s = Math.min(100, Math.max(0, v.s)) / 100, n = Math.max(1, Math.round(v.n)); const a = 1 / (s + (1 - s) / n); return `Aceleración máxima: ${num(a)} veces\nUn trabajo de 20 min tardaría al menos ${num(20 / a)} min\nCon infinitos núcleos: ${s ? num(1 / s) : '∞'} veces (límite de la parte secuencial)`; } },
        { type: 'classify', title: '¿Lo comparten los hilos o es propio de cada uno?', buckets: ['Compartido por los hilos del proceso', 'Propio de cada hilo'], items: [
          { t: 'Variables globales', b: 0 }, { t: 'Pila', b: 1 }, { t: 'Contador de programa', b: 1 }, { t: 'Archivos abiertos', b: 0 }, { t: 'Código del programa', b: 0 },
          { t: 'Registros de la CPU', b: 1 }, { t: 'Memoria pedida con malloc (heap)', b: 0 }, { t: 'TID', b: 1 }, { t: 'Variables locales de la función que ejecuta', b: 1, why: 'Están en la pila del hilo.' },
        ] },
      ],
      quiz: [
        { q: 'En el proceso moderno, ¿qué es el hilo?', o: ['La parte activa, que ejecuta instrucciones con su propio contexto y pila', 'La parte contenedora de recursos: memoria, archivos y programa', 'Una copia completa del proceso con su propio espacio de direcciones', 'El bloque de datos que el SO usa para administrar el proceso'], a: 0, e: 'El proceso contiene recursos; el hilo ejecuta. Una copia con su propio espacio de direcciones sería otro proceso (fork).' },
        { q: '¿Cuál de estos elementos NO comparten los hilos de un mismo proceso?', o: ['La pila', 'Las variables globales', 'Los archivos abiertos', 'El código'], a: 0, e: 'Cada hilo tiene su pila (y registros, PC, TID). Globales, heap, archivos y código son del proceso.' },
        { q: '¿Qué entidad planifica el planificador de CPU en un SO con hilos a nivel de kernel?', o: ['Hilos', 'Procesos', 'Programas', 'PCB'], a: 0, e: 'El hilo es la unidad básica de utilización de un núcleo.' },
        { q: 'Si un hilo de un proceso hace una LS bloqueante (modelo uno a uno):', o: ['Solo ese hilo se bloquea; los demás del proceso siguen', 'Se bloquea todo el proceso hasta que termine la E/S', 'El proceso pasa a estado terminado', 'El SO crea un hilo nuevo para reemplazarlo'], a: 0, e: 'Es una de las ventajas: interactividad. En el modelo muchos a uno, en cambio, se bloquearían todos.' },
        { q: '¿Por qué crear un hilo es más barato que crear un proceso?', o: ['Solo hace falta una pila y un TCB', 'Porque los hilos se crean en modo usuario, sin intervención del kernel', 'Porque el hilo no tiene contexto de CPU propio que haya que inicializar', 'Porque el hilo nuevo reutiliza la pila del hilo que lo crea'], a: 0, e: 'Los recursos ya los tiene el proceso. El hilo necesita su propia pila, contexto y TCB.' },
        { q: 'Un programa tiene 40 % de código secuencial. Según Amdahl, con 2 núcleos la aceleración máxima es:', o: ['1,43', '2', '1,6', '2,5'], a: 0, e: '1 / (0,4 + 0,6/2) = 1 / 0,7 ≈ 1,43. Con infinitos núcleos el límite sería 1/0,4 = 2,5.' },
        { q: 'Una computadora con un solo núcleo ejecuta un proceso con 4 hilos. Hay:', o: ['Concurrencia entre los hilos, pero no paralelismo', 'Paralelismo, porque los cuatro hilos progresan', 'Multiprocesamiento, porque hay varios hilos', 'Ni concurrencia ni paralelismo'], a: 0, e: 'Con un núcleo los hilos se intercalan: concurrencia. Para paralelismo hace falta más de un núcleo.' },
      ],
      open: [{ t: 'text', q: 'Explicá la diferencia entre el proceso clásico y el proceso moderno con hilos.', k: [['contenedor', 'contenedora', 'recursos'], ['activa', 'ejecuta'], ['un solo hilo', 'un hilo', 'único hilo'], ['pila', 'contexto', 'registros']], need: 3, e: 'El proceso clásico (pesado) era a la vez contenedor de recursos y unidad de ejecución: equivale a un proceso moderno con un solo hilo. En el proceso moderno, el proceso es solo el contenedor de recursos (memoria, archivos, programa) y la parte activa son los hilos, cada uno con su contexto de CPU, su pila y su TID; puede haber varios hilos por proceso y son los que se planifican.' }],
    },
    {
      id: 'modelos-de-hilos', module: 'hilos', title: 'Modelos multihilo, bibliotecas y señales',
      keywords: 'modelo uno a uno muchos a muchos muchos a uno hilos de usuario hilos de kernel biblioteca de hilos pthreads señales sincrónicas asincrónicas SIGINT SIGTERM SIGKILL fork exec hilos',
      tldr: 'En los modelos <b>uno a uno</b> y <b>muchos a muchos</b> el kernel reconoce los hilos, los administra y planifica (Linux, Windows, macOS, Android). En el <b>muchos a uno</b> el kernel no los ve: una biblioteca en modo usuario los simula, y si uno se bloquea se bloquean todos, sin aprovechar varios núcleos.',
      goals: ['Comparar los modelos multihilo.', 'Explicar qué hilo recibe una señal.'],
      body: `
<p>Lectura obligatoria: Silberschatz 7.ª ed., <b>4.2</b>. Tarea: 4.4.1 a 4.4.3.</p>
${table(['Modelo', 'El kernel…', 'Bloqueo', 'Multinúcleo', 'Ejemplos'], [
  ['Uno a uno', 'Reconoce cada hilo de usuario como un hilo de kernel', 'Si un hilo se bloquea, los demás siguen', 'Sí', 'Linux, Windows, Solaris, macOS, iOS, Android'],
  ['Muchos a muchos', 'Reconoce hilos; varios de usuario se multiplexan sobre varios de kernel', 'Los demás siguen', 'Sí', 'Algunos UNIX'],
  ['Muchos a uno', '<b>No</b> reconoce hilos: una biblioteca en modo usuario simula su gestión y planificación', '<b>Se bloquean todos</b>', '<b>No</b> puede aprovecharlo', 'Bibliotecas antiguas (green threads)'],
])}
<p>En los modelos donde el kernel reconoce hilos, las <b>bibliotecas de hilos</b> (Pthreads, Win32, Java) contienen clientes de la API del SO: llaman a LS (en Linux, <code>clone()</code>).</p>
<h2>fork y exec con hilos (4.4.1)</h2>
<p>Si un hilo llama a <code>fork()</code>, algunos UNIX duplican todos los hilos y otros solo el que llamó. Si después se llama a <code>exec()</code>, el programa entero (con todos sus hilos) se reemplaza, así que duplicar solo el hilo que llamó alcanza.</p>
<h2>Señales en procesos con hilos (4.4.3)</h2>
<ul>
  <li><b>Sincrónicas</b> (las provoca el propio hilo, como una división por cero): se entregan al hilo que la generó.</li>
  <li><b>Asincrónicas</b>: algunas, como SIGINT, SIGTERM y SIGKILL, son para todo el proceso. Hay formas de dirigir una señal a un hilo en particular.</li>
  <li>Puede haber consecuencias inesperadas: en un navegador o procesador de texto multihilo, mandar una señal para matar “un hilo” puede cerrar el proceso entero.</li>
</ul>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'classify', title: '¿Qué modelo es?', buckets: ['Uno a uno', 'Muchos a muchos', 'Muchos a uno'], items: [
        { t: 'Si un hilo hace E/S bloqueante, todos los hilos del proceso quedan bloqueados', b: 2 }, { t: 'Es el modelo de Linux y Windows', b: 0 },
        { t: 'El kernel no sabe que el proceso tiene hilos', b: 2 }, { t: 'Varios hilos de usuario se reparten sobre un número menor o igual de hilos de kernel', b: 1 },
        { t: 'Cada hilo de usuario corresponde a un hilo de kernel', b: 0 }, { t: 'No puede ejecutar dos hilos del proceso en paralelo aunque haya 8 núcleos', b: 2 },
      ] }],
      quiz: [
        { q: 'En el modelo muchos a uno, ¿qué pasa si un hilo hace una LS bloqueante?', o: ['Se bloquean todos los hilos del proceso, porque el kernel ve un solo flujo', 'Solo se bloquea ese hilo y el planificador del kernel elige otro hilo', 'La biblioteca de hilos crea un hilo de kernel nuevo para continuar', 'El proceso se divide en varios procesos para no bloquearse'], a: 0, e: 'El kernel no reconoce los hilos: para él, el proceso entero hizo la LS y se bloquea.' },
        { q: '¿Qué modelo usan Linux y Windows?', o: ['Uno a uno', 'Muchos a uno', 'Muchos a muchos', 'Ninguno: no tienen hilos de kernel'], a: 0, e: 'Cada hilo de usuario es un hilo de kernel, planificado por el SO.' },
        { q: '¿Por qué el modelo muchos a uno no aprovecha varios núcleos?', o: ['Porque el kernel planifica un solo flujo por proceso y lo ejecuta en un núcleo', 'Porque la biblioteca de hilos prohíbe ejecutar en más de un núcleo por seguridad', 'Porque los hilos de usuario no tienen pila propia', 'Porque necesita deshabilitar las interrupciones para cambiar de hilo'], a: 0, e: 'Los hilos existen solo para la biblioteca; el kernel asigna un núcleo al proceso.' },
        { q: 'Un hilo divide por cero. ¿A quién se entrega la señal?', o: ['Al hilo que la generó, porque es sincrónica', 'A todos los hilos del proceso', 'Al primer hilo que se creó en el proceso', 'Al hilo que no tenga la señal bloqueada, elegido al azar'], a: 0, e: 'Las sincrónicas van al hilo que las provocó. Las asincrónicas como SIGTERM son para todo el proceso.' },
        { q: 'Las bibliotecas de hilos en los modelos uno a uno:', o: ['Usan llamadas al sistema para crear y manejar hilos', 'Simulan la planificación de los hilos en modo usuario, sin ayuda del kernel', 'Reemplazan al planificador del kernel para los hilos de ese proceso', 'Solo existen en Java, que tiene su propio planificador'], a: 0, e: 'Como el kernel reconoce los hilos, la biblioteca (Pthreads) es un wrapper de LS como clone().' },
      ],
      exercises: [
        { official: '4.1', level: 1, title: 'Hilo y proceso', prompt: '<p>¿A qué se llama hilo? Cuando hay hilos, ¿a qué se llama proceso? ¿Diferencia con el concepto clásico?</p>', solution: { explain: '<p>Hilo: la parte activa, unidad básica de utilización de un núcleo, con contexto de CPU, pila y TID. Proceso (moderno): el contenedor de recursos (memoria, archivos, programa). El proceso clásico era a la vez contenedor y unidad de ejecución: equivale a un proceso moderno con un solo hilo.</p>' } },
        { official: '4.2', level: 1, title: 'Qué comparten', prompt: '<p>¿Qué comparten los hilos de un mismo proceso y qué no?</p>', solution: { explain: '<p>Comparten código, datos globales, heap, archivos abiertos, manejadores de señales y el espacio de direcciones. Cada uno tiene su TID, PC, registros, pila y estado.</p>' } },
        { official: '4.3', level: 2, title: 'Un proceso con hilos o varios procesos', prompt: '<p>¿Ventajas y desventajas de un proceso con varios hilos frente a varios procesos de un hilo?</p>', solution: { explain: '<p>Ventajas: crear y cambiar de hilo es más barato; comparten memoria sin IPC; mejor interactividad. Desventajas: más complejidad y riesgo de carreras al compartir todo; un error (por ejemplo, un acceso inválido) tumba al proceso entero con todos sus hilos, mientras que varios procesos están aislados.</p>' } },
        { official: '4.4', level: 1, title: 'Pasos que no hace la creación de un hilo', prompt: '<p>Mencione al menos 3 pasos de la creación de un proceso que no se hacen al crear un hilo.</p>', solution: { explain: '<p>Asignar espacio en RAM (espacio de direcciones), cargar el código del programa, crear e inicializar el PCB, asignar recursos (archivos, dispositivos), copiar el espacio del padre (en fork).</p>' } },
        { official: '4.5', level: 2, title: '¿El SO soporta hilos de kernel?', prompt: '<p>¿Cómo sabría, con las herramientas de administración conocidas, si un SO soporta hilos a nivel de núcleo?</p>', solution: { explain: '<p>Ejecutando un programa multihilo y mirándolo con <code>ps -eLf</code> o <code>ps -T -p PID</code> (columna LWP/SPID: un identificador por hilo), con la tecla H de <code>top</code>, o en <code>/proc/PID/task/</code> (un directorio por hilo). Si el kernel lista cada hilo con su propio identificador y los planifica (pueden aparecer en núcleos distintos, %CPU mayor a 100 %), los soporta. También la columna NLWP de ps cuenta hilos.</p>' } },
      ],
    },
  );

  LESSONS.push(
    {
      id: 'planificacion-conceptos', module: 'planif', title: 'Planificación de CPU: cuándo, quién y con qué criterios',
      keywords: 'planificador corto plazo apropiativa no apropiativa expulsiva cooperativa preemptive momentos 5.1.3 despachador latencia de despacho parámetros criterios utilización throughput tiempo de retorno espera respuesta energía',
      tldr: 'No hay multiprogramación sin planificador de corto plazo. Interviene en <b>4 momentos</b>: cuando el proceso se bloquea, cuando lo interrumpe el reloj, cuando termina una E/S y cuando el proceso termina. Si solo actúa en el 1 y el 4 es <b>no apropiativo</b>; si también en el 2 y el 3, <b>apropiativo</b> (requiere temporizador). El <b>despachador</b> aplica la decisión.',
      goals: ['Enumerar los 4 momentos de planificación.', 'Diferenciar planificación apropiativa y no apropiativa.', 'Describir el despachador y la latencia de despacho.', 'Definir los parámetros de planificación.'],
      body: `
<p>Planificar es decidir, en un momento dado, <b>qué proceso usará una CPU</b>, cumpliendo los objetivos del sistema. Hay planificadores de largo, mediano y corto plazo; acá “el planificador” es el de <b>corto plazo</b>. El algoritmo (función de selección) se elige según los objetivos y las características de los procesos (limitados por CPU o E/S): en una PC predominan los limitados por E/S e interactivos; en un servidor, depende del servicio.</p>
<h2>Los 4 momentos (5.1.3)</h2>
${table(['', 'Evento', 'Causa', 'No apropiativo', 'Apropiativo'], [
  ['1', 'En ejecución → en espera', 'LS bloqueante (E/S, wait)', '✓', '✓'],
  ['2', 'En ejecución → listo', 'Interrupción (temporizador)', '', '✓'],
  ['3', 'En espera → listo', 'Interrupción (fin de E/S)', '', '✓'],
  ['4', 'Termina', 'LS exit', '✓', '✓'],
])}
<p>Las LS usan excepciones, que son interrupciones: <b>el SO es software impulsado por interrupciones</b>.</p>
${table(['', 'No apropiativa', 'Apropiativa'], [
  ['Otros nombres', 'Non-preemptive, cooperativa, no expulsiva', 'Preemptive, no cooperativa, expulsiva'],
  ['Cómo', 'El proceso retiene la CPU hasta liberarla “voluntariamente” (LS bloqueante o fin); no por interrupciones externas', 'El proceso puede liberarla voluntariamente o ser <b>expulsado</b> por el planificador'],
  ['Requiere', 'Nada especial', 'Hardware: <b>temporizador</b> (interrupciones externas)'],
  ['Problema', 'Un proceso puede acaparar la CPU', 'Introduce problemas de <b>concurrencia</b> con datos compartidos del proceso y del kernel'],
])}
<h2>Despachador (5.1.4)</h2>
<p>Módulo que <b>aplica</b> la decisión del planificador: guarda el contexto del proceso saliente y actualiza su PCB; restablece el del entrante; cambia a modo usuario; salta al punto correcto del programa. Su tiempo es la <b>latencia de despacho</b>: debe ser breve (overhead). No siempre que ejecuta el planificador ejecuta el despachador: si decide que siga el mismo proceso, no hay nada que despachar.</p>
<h2>Parámetros y objetivos (5.2)</h2>
<p>El libro dice “criterios”, pero son <b>parámetros</b>: valores que se observan para medir cuánto cumple un algoritmo sus objetivos.</p>
${table(['Parámetro', 'Qué mide', 'Objetivo'], [
  ['Uso de CPU', 'Porcentaje de tiempo ocupada', 'Maximizar'],
  ['Throughput (tasa de procesamiento)', 'Procesos terminados por unidad de tiempo', 'Maximizar'],
  ['Tiempo de ejecución (retorno, turnaround)', 'Desde que llega hasta que termina', 'Minimizar'],
  ['Tiempo de espera', 'Tiempo total en la cola de listos', 'Minimizar'],
  ['Tiempo de respuesta', 'Desde que llega hasta que empieza a responder (primera vez en CPU)', 'Minimizar'],
  ['Consumo de energía', '', 'Minimizar'],
])}
<p>Pueden estar en conflicto. Lo que más importa depende del uso: lotes (throughput), servidor (throughput y respuesta), smartphone (energía y respuesta), embebido de tiempo real (cumplir plazos), PC de escritorio (respuesta).</p>`,
      quiz: [
        { q: '¿En cuáles de los 4 momentos actúa un planificador no apropiativo?', o: ['Cuando el proceso se bloquea por una LS y cuando termina', 'Cuando vence el temporizador y cuando termina una E/S', 'En los cuatro momentos, pero sin expulsar procesos', 'Solo cuando llega un proceso nuevo a la cola de listos'], a: 0, e: 'Momentos 1 y 4: liberación voluntaria. Los momentos 2 y 3 (interrupciones) son exclusivos del apropiativo.' },
        { q: '¿Qué requiere el hardware para la planificación apropiativa?', o: ['Un temporizador que genere interrupciones', 'Más de un núcleo de CPU', 'Una MMU con paginación', 'Instrucciones atómicas como test-and-set'], a: 0, e: 'Para quitarle la CPU a un proceso hace falta que algo interrumpa: el temporizador.' },
        { q: '¿Qué problema introduce la planificación apropiativa?', o: ['Problemas de concurrencia con datos compartidos', 'Que un proceso pueda acaparar la CPU indefinidamente si no se bloquea', 'Que no se pueda implementar tiempo compartido sin un segundo núcleo', 'Que el despachador tenga que ejecutar en modo usuario para expulsar'], a: 0, e: 'Un proceso puede ser expulsado a mitad de actualizar un dato compartido. Acaparar la CPU es el problema del no apropiativo.' },
        { q: '¿Qué hace el despachador?', o: ['Aplica la decisión del planificador', 'Elige qué proceso de la cola de listos ejecuta a continuación', 'Decide qué procesos se admiten en el sistema', 'Mide el tiempo de respuesta de cada proceso'], a: 0, e: 'Elegir es del planificador; aplicar la elección es del despachador. Su tiempo es la latencia de despacho.' },
        { q: 'El tiempo de espera de un proceso es:', o: ['El tiempo total que pasa en la cola de listos', 'El tiempo desde que llega hasta que termina', 'El tiempo desde que llega hasta que ejecuta por primera vez', 'El tiempo que pasa esperando E/S'], a: 0, e: 'Espera = tiempo en la cola de listos. Desde la llegada hasta el fin es el retorno; hasta la primera CPU, la respuesta. La espera de E/S no cuenta.' },
        { q: 'Un proceso pasa de en espera a listo porque terminó su E/S. ¿Puede intervenir el planificador?', o: ['Solo si la planificación es apropiativa', 'Sí, siempre: el que ejecuta debe ceder la CPU al que vuelve de E/S', 'No, nunca: solo interviene cuando el proceso en ejecución se bloquea', 'Solo si la cola de listos estaba vacía antes de la interrupción'], a: 0, e: 'Es el momento 3 (interrupción): exclusivo de la planificación apropiativa.' },
        { q: 'Para un smartphone, ¿qué objetivos de planificación suelen pesar más?', o: ['Tiempo de respuesta y consumo de energía', 'Throughput y utilización de CPU', 'Cumplir plazos estrictos de tiempo real', 'Tiempo de retorno de trabajos por lotes'], a: 0, e: 'Es interactivo y con batería. El throughput importa en lotes y servidores.' },
      ],
      open: [{ t: 'text', q: '¿Cuáles son los 4 momentos en los que puede actuar el planificador? ¿Cuáles usa uno no apropiativo?', k: [['espera', 'bloquea', 'bloqueante'], ['interrupción', 'interrupcion', 'temporizador', 'reloj'], ['fin de e/s', 'termina la e/s', 'termina una e/s', 'listo'], ['termina', 'finaliza', 'exit'], ['1 y 4', 'uno y cuatro', 'primero y cuarto', 'voluntaria']], need: 4, e: '1) el proceso en ejecución pasa a espera (LS bloqueante); 2) pasa a listo por una interrupción (temporizador); 3) un proceso pasa de espera a listo (fin de E/S, interrupción); 4) el proceso termina (exit). El no apropiativo actúa solo en 1 y 4 (liberación voluntaria); el apropiativo también en 2 y 3.' }],
    },
    {
      id: 'algoritmos-de-planificacion', module: 'planif', title: 'Algoritmos: FCFS, SJF, prioridades, Round Robin y colas multinivel',
      keywords: 'FCFS FIFO SJF SRTF prioridades inanición envejecimiento Round Robin turnos cuanto quantum colas multinivel realimentación Gantt efecto convoy',
      tldr: '<b>FCFS</b>: por orden de llegada (sufre el efecto convoy). <b>SJF</b>: la ráfaga más corta primero; óptimo en espera media, pero hay que conocer la ráfaga. <b>Prioridades</b>: el más prioritario; riesgo de inanición (se arregla con envejecimiento). <b>Round Robin</b> (“por turnos”): FCFS apropiativo con un cuanto. <b>Colas multinivel</b>, con o sin realimentación.',
      goals: ['Construir el diagrama de Gantt y calcular espera, retorno y respuesta.', 'Comparar los algoritmos y elegir según el objetivo.', 'Explicar el efecto del tamaño del cuanto.'],
      body: `
<p>Ver todos los de <b>5.3</b>. De SJF <b>no</b> va la predicción de la duración de la siguiente ráfaga. Las prioridades “definidas externamente” las establece el administrador del sistema.</p>
${table(['Algoritmo', 'Elige', '¿Apropiativo?', 'A favor', 'En contra'], [
  ['FCFS (5.3.1)', 'El que llegó primero (cola FIFO)', 'No', 'Simple; justo en orden de llegada', '<b>Efecto convoy</b>: uno largo hace esperar a muchos cortos; malo para interactivos'],
  ['SJF (5.3.2)', 'El de ráfaga más corta', 'No (la versión apropiativa es SRTF)', '<b>Óptimo</b> en tiempo de espera medio', 'Hay que conocer la ráfaga siguiente; inanición de los largos'],
  ['Prioridades (5.3.3)', 'El de mayor prioridad (en el libro, número menor)', 'Ambas versiones', 'Refleja la importancia de cada proceso', '<b>Inanición</b>; se resuelve con <b>envejecimiento</b> (subir la prioridad del que espera mucho)'],
  ['Round Robin, “planificación por turnos” (5.3.4)', 'FCFS, pero cada proceso usa como mucho un <b>cuanto</b>', 'Sí', 'Buen tiempo de respuesta; justo', 'Más cambios de proceso; si el cuanto es chico, mucho overhead'],
  ['Colas multinivel (5.3.5)', 'Varias colas por tipo de proceso (interactivos, lotes…), cada una con su algoritmo; prioridad entre colas', 'Según la configuración', 'Trata distinto a distintos procesos', 'Un proceso queda fijo en su cola; inanición de las colas bajas'],
  ['Multinivel realimentadas (5.3.6)', 'Como la anterior, pero los procesos <b>cambian de cola</b> según su comportamiento (el que gasta todo el cuanto baja; el que espera mucho sube)', 'Sí', 'El más general y configurable', '“También es el algoritmo más complejo”: muchos parámetros que ajustar y más overhead'],
])}
<h2>El cuanto de Round Robin</h2>
<ul>
  <li><b>Muy grande</b>: RR degenera en FCFS.</li>
  <li><b>Muy chico</b>: la CPU pasa más tiempo cambiando de proceso (overhead) que trabajando.</li>
  <li>Criterio del libro: que alrededor del <b>80 % de las ráfagas</b> de CPU sea más corto que el cuanto, y que el cuanto sea grande respecto del tiempo de cambio de contexto.</li>
  <li>El SO registra el tiempo restante del cuanto en el <b>PCB</b> del proceso (por ejemplo, el campo <code>counter</code> del TP 6).</li>
</ul>
${note('FCFS se puede llamar FIFO: la cola de listos es una cola FIFO. Funciona bien en sistemas por lotes con trabajos parecidos.', 'tip')}
<h2>Simulador</h2>
<p>El ejemplo es el de Silberschatz (5.3.4). Cambiá el algoritmo, el cuanto y las ráfagas; agregá llegadas distintas de 0 para ver SRTF y la apropiación. Convención: en RR, si un proceso llega en el mismo instante en que otro agota su cuanto, entra a la cola antes que el expulsado.</p>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'sched', title: 'Planificador de CPU con diagrama de Gantt', procs: [{ id: 'P1', arr: 0, burst: 24, prio: 3 }, { id: 'P2', arr: 0, burst: 3, prio: 1 }, { id: 'P3', arr: 0, burst: 3, prio: 2 }], algo: 'fcfs', q: 4, prio: true }],
      quiz: [
        { q: 'P1 (24), P2 (3) y P3 (3) llegan en t = 0 en ese orden. Con FCFS, ¿cuál es el tiempo de espera medio?', o: ['17', '3', '27', '10'], a: 0, e: 'Esperas: 0, 24 y 27 → 51/3 = 17. Si llegaran P2, P3, P1, la media sería 3: es el efecto convoy.' },
        { q: '¿Qué algoritmo minimiza el tiempo de espera medio?', o: ['SJF', 'FCFS', 'Round Robin', 'Prioridades con envejecimiento'], a: 0, e: 'SJF es óptimo en espera media; el problema es que no se conoce la duración de la próxima ráfaga.' },
        { q: '¿Qué es el envejecimiento (aging)?', o: ['Aumentar gradualmente la prioridad de los procesos que esperan mucho tiempo', 'Bajar la prioridad de los procesos que llevan mucho tiempo en el sistema', 'Terminar los procesos que superan un tiempo máximo de ejecución', 'Pasar a la cola de lotes los procesos que ya no son interactivos'], a: 0, e: 'Es la solución a la inanición en planificación por prioridades.' },
        { q: '¿Qué ocurre si el cuanto de Round Robin es extremadamente grande?', o: ['Se comporta como FCFS', 'Se comporta como SJF', 'La CPU pasa la mayor parte del tiempo cambiando de proceso', 'Los procesos sufren inanición'], a: 0, e: 'Ningún proceso agota el cuanto: cada uno corre hasta bloquearse o terminar, en orden de llegada.' },
        { q: '¿Qué diferencia a las colas multinivel realimentadas de las colas multinivel simples?', o: ['Los procesos pueden cambiar de cola', 'Cada cola puede usar su propio algoritmo de planificación', 'Las colas tienen prioridades entre sí y se atiende primero la más alta', 'Solo se usan en sistemas por lotes con varias clases de trabajos'], a: 0, e: 'Que cada cola tenga su algoritmo y que haya prioridad entre colas vale para ambas; la realimentación permite cambiar de cola.' },
        { q: '¿Dónde registra el SO cuánto le queda del cuanto a un proceso?', o: ['En su PCB', 'En un registro de la MMU', 'En el vector de interrupciones', 'En la pila del proceso'], a: 0, e: 'Es información de planificación del proceso, que sobrevive a los cambios de proceso: va en el PCB.' },
        { q: 'Con qué nombre aparece Round Robin en Silberschatz 7.ª ed.?', o: ['Planificación por turnos', 'Planificación por prioridades rotativas', 'Planificación por cuotas', 'Planificación de tiempo real'], a: 0, e: 'Apartado 5.3.4: “Planificación por turnos”.' },
        { q: 'P1 llega en 0 con ráfaga 8 y P2 llega en 1 con ráfaga 4. Con SRTF, ¿cuándo termina P1?', o: ['En 12', 'En 8', 'En 13', 'En 4'], a: 0, e: 'En t = 1 P2 (4) es más corto que lo que le queda a P1 (7): P2 corre de 1 a 5 y P1 termina de 5 a 12.' },
      ],
      open: [
        { t: 'num', q: 'P1 = 6, P2 = 8, P3 = 7 y P4 = 3 llegan en t = 0. Con SJF, ¿cuál es el tiempo de espera medio?', a: 7, e: 'Orden P4, P1, P3, P2. Esperas: P4 0, P1 3, P3 9, P2 16 → 28/4 = 7 (ejemplo de Silberschatz 5.3.2).' },
        { t: 'num', q: 'P1 = 24, P2 = 3, P3 = 3 en t = 0, Round Robin con cuanto 4. ¿Cuál es el tiempo de espera medio? (con dos decimales)', a: 5.67, tol: 0.005, e: 'P1 corre 0–4, P2 4–7, P3 7–10 y P1 sigue hasta 30. Esperas: P1 = 10 − 4 = 6, P2 = 4, P3 = 7 → 17/3 ≈ 5,67.' },
        { t: 'text', q: '¿Qué pasa si el cuanto de Round Robin es muy chico o muy grande, y qué criterio da el libro para elegirlo?', k: [['fcfs', 'fifo'], ['overhead', 'cambio de contexto', 'cambios de proceso'], ['80'], ['ráfaga', 'rafaga']], need: 3, e: 'Si es muy grande, RR degenera en FCFS; si es muy chico, la CPU pasa demasiado tiempo en cambios de contexto (overhead). El libro sugiere que alrededor del 80 % de las ráfagas de CPU sean más cortas que el cuanto, y que el cuanto sea grande respecto del tiempo de cambio de contexto.' },
      ],
    },
    {
      id: 'planificacion-multiprocesador', module: 'planif', title: 'Multiprocesador, hilos, ejemplos y evaluación de algoritmos',
      keywords: 'multiprocesador asimétrico simétrico SMP afinidad blanda dura equilibrado de carga balanceo migración comandada solicitada push pull SMT hyperthreading ámbito de contienda PCS SCS Solaris Windows XP evaluación modelado determinista colas simulación implementación',
      tldr: 'Con varias CPU aparecen la <b>afinidad</b> (conviene que un proceso siga en la misma CPU, por la caché) y el <b>equilibrado de carga</b> (repartir trabajo, por migración comandada o solicitada), que tiran en direcciones opuestas. Los algoritmos se evalúan con modelado determinista, modelos de colas, simulaciones o implementándolos.',
      goals: ['Explicar afinidad y equilibrado de carga y su tensión.', 'Distinguir los ámbitos de contienda.', 'Comparar los métodos de evaluación de algoritmos.'],
      body: `
<p>Leer <b>5.4 completo</b>; de <b>5.5</b> solo 5.5 y el primer párrafo de 5.5.1 (5.5.2 Pthread no va); <b>5.6</b> menos 5.6.3 (Linux); <b>5.7</b>: de 5.7.1 los dos primeros párrafos y el último, de 5.7.2 el primer párrafo, 5.7.3 y 5.7.4 completos.</p>
<h2>Sistemas multiprocesador (5.4)</h2>
<ul>
  <li><b>Asimétrico</b>: un procesador maestro toma todas las decisiones de planificación; los demás solo ejecutan código de usuario. <b>Simétrico (SMP)</b>: cada procesador se planifica a sí mismo (cola común o una por CPU); la cola compartida es un recurso compartido: problema de concurrencia.</li>
  <li><b>Afinidad</b>: si un proceso migra, la caché del procesador nuevo está “fría” y la del viejo queda inválida. Se intenta mantenerlo en la misma CPU: <b>afinidad blanda</b> (se intenta, sin garantía) o <b>dura</b> (el proceso pide no migrar).</li>
  <li><b>Equilibrado de carga</b> (balanceo, load balancing): repartir la carga entre CPU. Hace falta cuando cada CPU tiene su propia cola. <b>Migración comandada</b> (push): una tarea revisa periódicamente y empuja procesos de CPU cargadas a libres. <b>Migración solicitada</b> (pull): una CPU ociosa tira de un proceso de una cargada.</li>
  <li>Equilibrar <b>contrarresta</b> la afinidad: mover un proceso cuesta la caché.</li>
  <li><b>SMT / Hyperthreading</b> (5.4.4): cada núcleo físico se presenta como varios procesadores lógicos. Un SO que lo detecta evita poner dos procesos en los lógicos de un mismo núcleo mientras haya núcleos físicos libres.</li>
</ul>
<h2>Ámbito de contienda (5.5.1, primer párrafo)</h2>
<p>En los modelos muchos a uno y muchos a muchos, la biblioteca planifica hilos de usuario sobre hilos de kernel: compiten <b>dentro del proceso</b> (PCS, ámbito de contienda del proceso). El kernel planifica hilos de kernel compitiendo con <b>todos los del sistema</b> (SCS). En uno a uno (Linux, Windows) solo hay SCS.</p>
<h2>Ejemplos (5.6, menos Linux)</h2>
<ul>
  <li><b>Solaris</b>: planificación por prioridades con clases (tiempo compartido, interactiva, tiempo real, sistema…), tablas que bajan la prioridad al que agota el cuanto y la suben al que vuelve de E/S (multinivel realimentada).</li>
  <li><b>Windows XP</b>: el planificador se llama <b>despachador</b>; 32 niveles de prioridad apropiativos, clases variables y de tiempo real. La prioridad de un proceso se cambia desde el <b>Administrador de tareas</b> (clases tiempo real, alta, por encima de lo normal, normal, por debajo de lo normal, baja). La afinidad también.</li>
</ul>
<h2>Evaluación de algoritmos (5.7)</h2>
${table(['Método', 'Cómo', 'A favor', 'En contra'], [
  ['Modelado determinista', 'Tomar una carga predeterminada y calcular cada algoritmo (lo que hacemos con Gantt)', 'Simple, rápido, da números exactos', 'Vale solo para esa carga'],
  ['Modelos de colas', 'Describir llegadas y ráfagas con distribuciones y analizar con teoría de colas', 'Resultados generales', 'Supuestos matemáticos poco realistas'],
  ['Simulaciones', 'Programar un modelo del sistema con cargas aleatorias o trazas reales', 'Más precisas', 'Costosas en tiempo de cómputo y de desarrollo'],
  ['Implementación', 'Programar el algoritmo en el SO real y medir', 'Lo único totalmente preciso', 'Costosa; el entorno cambia (los usuarios se adaptan)'],
])}
${note('Pregunta de control: para que se note el efecto de distintas políticas hace falta <b>competencia por la CPU</b>: más procesos listos que núcleos (o fijar los procesos a un solo núcleo con <code>taskset</code>). En una máquina con varios núcleos libres, todas las políticas dan casi lo mismo.', 'exam')}`,
      quiz: [
        { q: '¿Por qué el equilibrado de carga contrarresta la afinidad?', o: ['Porque migrar un proceso le hace perder su caché', 'Porque la afinidad solo existe en multiprocesadores asimétricos', 'Porque el equilibrado obliga a usar una sola cola compartida por todas las CPU', 'Porque con afinidad dura no puede haber migraciones solicitadas'], a: 0, e: 'La afinidad busca no mover procesos (caché caliente); equilibrar implica moverlos.' },
        { q: 'En la migración solicitada (pull):', o: ['Una CPU ociosa toma un proceso de la cola de una CPU cargada', 'Una tarea periódica empuja procesos de CPU cargadas a CPU libres', 'El proceso pide no migrar nunca de CPU', 'El maestro asigna los procesos a cada CPU'], a: 0, e: 'Pull = la que está libre “tira”. Push (comandada) = una tarea “empuja”.' },
        { q: '¿Cuál es el nombre del planificador en Windows XP?', o: ['Despachador', 'Planificador de corto plazo', 'Gestor de tareas', 'Kernel scheduler'], a: 0, e: 'Así lo llama el libro (5.6.2). La prioridad se puede cambiar desde el Administrador de tareas.' },
        { q: '¿Qué método de evaluación usamos al calcular tiempos de espera con un diagrama de Gantt?', o: ['Modelado determinista', 'Modelos de colas', 'Simulación', 'Implementación'], a: 0, e: 'Carga predeterminada y cálculo exacto para cada algoritmo.' },
        { q: '¿Cuál es la principal desventaja de evaluar implementando el algoritmo en el SO real?', o: ['Es costoso y el entorno cambia al implementarlo', 'Los resultados son aproximados porque usa distribuciones de probabilidad', 'Solo vale para la carga que se eligió para el cálculo', 'No permite medir el tiempo de respuesta real de los procesos'], a: 0, e: 'Es lo más preciso, pero caro, y la carga real se modifica con el cambio.' },
        { q: 'En un sistema con modelo uno a uno, los hilos compiten por la CPU en el ámbito:', o: ['Del sistema (SCS)', 'Del proceso (PCS)', 'De la biblioteca de hilos', 'De la cola de dispositivos'], a: 0, e: 'Sin hilos de usuario multiplexados no hay PCS: el kernel planifica todos los hilos juntos.' },
      ],
    },
    {
      id: 'tp-planificacion', module: 'planif', title: 'TP 6: planificación en Linux (chrt, time, políticas)',
      keywords: 'chrt sched_setscheduler SCHED_OTHER SCHED_FIFO SCHED_RR SCHED_BATCH SCHED_IDLE time real user sys prueba_planificador ITERACIONES época counter Linux 2.4 fork',
      tldr: 'Linux ofrece políticas normales (<b>SCHED_OTHER</b>, <b>SCHED_BATCH</b>, <b>SCHED_IDLE</b>) y de tiempo real (<b>SCHED_FIFO</b>, <b>SCHED_RR</b>, prioridades 1 a 99) con planificación apropiativa por prioridades. El experimento con <code>chrt</code> muestra que el tiempo <i>user</i> de un proceso limitado por CPU no cambia con la política, pero el tiempo <i>real</i> sí.',
      goals: ['Resolver las preguntas teóricas del TP 6.', 'Interpretar real, user y sys de time.', 'Predecir el resultado del experimento con chrt.'],
      body: `
<h2>time: real, user y sys</h2>
${table(['Tiempo', 'Qué mide'], [['real', 'Reloj de pared: desde que arranca hasta que termina, incluida la espera en la cola de listos'], ['user', 'CPU usada en modo usuario'], ['sys', 'CPU usada en modo kernel (atendiendo sus LS)']])}
<h2>El programa de prueba</h2>
${code(`#define ITERACIONES 80000
int main() {
    int i, j;
    printf("Iniciando...\\n");
    for (i = 0; i < ITERACIONES; i++)
        for (j = 0; j < ITERACIONES; j++) { j++; j--; }
    printf("Proceso PID %d finalizado.\\n", getpid());
}`, 'c')}
<p>Es un bucle que no hace E/S: <b>limitado por CPU</b> (htop lo muestra cerca del 100 % de un núcleo). Como tiene dos bucles anidados, el tiempo crece con ITERACIONES²: <i>t ≈ k · N²</i>, así que para un tiempo deseado <i>N ≈ N₀ · √(t / t₀)</i>. No es del todo confiable: depende de la carga, del escalado de frecuencia de la CPU y del compilador (con <code>-O2</code> el bucle podría desaparecer).</p>
<h2>Políticas (man sched_setscheduler, man chrt)</h2>
${table(['Política', 'chrt', 'Tipo', 'Comportamiento'], [
  ['SCHED_OTHER', '<code>-o</code>', 'Normal (prioridad estática 0)', 'Tiempo compartido por defecto (CFS: reparto equitativo, con nice)'],
  ['SCHED_BATCH', '<code>-b</code>', 'Normal', 'Para trabajos no interactivos limitados por CPU: el planificador los favorece menos al despertar'],
  ['SCHED_IDLE', '<code>-i</code>', 'Normal', 'Prioridad muy baja: ejecuta cuando nadie más quiere la CPU'],
  ['SCHED_FIFO', '<code>-f</code>', 'Tiempo real (1–99)', 'Por prioridad; dentro de la misma prioridad, FCFS y sin cuanto: corre hasta bloquearse, terminar o ser expulsado por uno más prioritario'],
  ['SCHED_RR', '<code>-r</code>', 'Tiempo real (1–99)', 'Igual que FIFO pero con cuanto entre los de igual prioridad: Round Robin'],
])}
<p>El esquema es <b>apropiativo</b>: un proceso de mayor prioridad expulsa al que ejecuta. Se parece a las <b>colas multinivel por prioridad</b>: una lista por prioridad estática, se atiende la más alta no vacía, y dentro de cada lista FCFS (SCHED_FIFO) o Round Robin (SCHED_RR). Los de tiempo real siempre van antes que los normales.</p>
${code(`su -                              # chrt para tiempo real requiere root
time ./a.out & time ./a.out & time ./a.out &
chrt -f -p 1 PID_1                # el primero: tiempo real FIFO, prioridad 1
chrt -b -p 0 PID_3                # el tercero: BATCH
chrt -p PID_x                     # verificar la politica`, 'sh')}
${note('Ojo: el PID que muestra <code>[1] 2004</code> después de <code>time ./a.out &amp;</code> es el del <b>bash</b> que ejecuta time, no el de a.out. Hay que buscar el de a.out con <code>ps</code>.', 'warn')}`,
      quiz: [
        { q: 'Tres instancias del mismo programa limitado por CPU con distintas políticas en un núcleo. ¿Qué tiempos deberían parecerse?', o: ['Los tiempos user', 'Los tiempos real', 'Los tiempos sys', 'Ninguno: todos dependen de la política'], a: 0, e: 'El trabajo de CPU es el mismo (user parecido). La política cambia cuánto espera cada uno en la cola: el tiempo real.' },
        { q: 'Con SCHED_FIFO, un proceso de tiempo real limitado por CPU en una máquina de un núcleo:', o: ['La ocupa hasta terminar, salvo uno más prioritario', 'Comparte la CPU por turnos con los procesos normales del sistema', 'Solo ejecuta cuando no hay otros procesos listos para correr', 'Es expulsado al terminar su cuanto, como en Round Robin'], a: 0, e: 'FIFO no tiene cuanto y los de tiempo real van antes que los normales: los demás esperan.' },
        { q: '¿Qué diferencia a SCHED_RR de SCHED_FIFO?', o: ['RR reparte por cuantos entre iguales; FIFO no', 'RR es una política normal y FIFO una de tiempo real', 'FIFO es apropiativo por prioridad y RR no lo es', 'RR no usa prioridades: todos los procesos valen lo mismo'], a: 0, e: 'Las dos son de tiempo real y apropiativas por prioridad; solo difieren en cómo tratan a los de igual prioridad.' },
        { q: 'Con SCHED_IDLE, el tercer proceso del experimento:', o: ['Termina último: solo ejecuta cuando la CPU queda libre', 'Termina primero porque no compite con los procesos normales', 'Tiene un tiempo user mucho mayor que los otros dos procesos', 'No llega a ejecutar nunca mientras haya otro proceso en el sistema'], a: 0, e: 'IDLE tiene la prioridad más baja: espera a que la CPU quede libre. Su user sigue igual.' },
        { q: 'En Linux 2.4, ¿qué valor de counter recibe un hijo después de fork()?', o: ['La mitad del que le quedaba al padre', 'Un cuanto completo, como cualquier proceso nuevo de la época', 'El mismo valor que tenía el padre al hacer fork', 'Cero: recién recibe CPU cuando empiece la próxima época'], a: 0, e: 'Si recibiera un cuanto completo, un proceso podría obtener CPU ilimitada creando hijos. Partirlo mantiene el total de la época.' },
        { q: '¿Qué tipo de SO no necesita planificador de corto plazo?', o: ['Uno monoprogramado, como MS-DOS', 'Uno por lotes multiprogramado sin interacción', 'Uno de tiempo real con plazos fijos', 'Uno con un solo núcleo de CPU'], a: 0, e: 'Con un solo programa en memoria no hay nada que elegir. Con multiprogramación, siempre hace falta.' },
      ],
      exercises: [
        { official: '6.1', level: 2, title: 'Impresión, descarga y renderizado', prompt: '<p>Tres trabajos por lotes de 10 minutos cada uno, lanzados en orden: impresión, descarga y renderizado. a. ¿Qué limita a cada uno? b. ¿Cuánto espera el resultado del render si el sistema es monoprogramado? c. ¿Y multiprogramado?</p>', solution: { explain: '<p>a. Impresión: E/S (impresora). Descarga: E/S (red). Renderizado: CPU. b. Monoprogramado: uno tras otro; el render empieza a los 20 minutos y termina a los <b>30</b>. c. Multiprogramado: como usan recursos distintos, se superponen: el render usa la CPU mientras los otros esperan sus dispositivos; termina cerca de los <b>10 minutos</b> (algo más por el overhead y la poca CPU que usan los otros).</p>' } },
        { official: '6.2', level: 1, title: 'Función del planificador', prompt: '<p>a. ¿Cuál es la función del planificador? b. ¿Qué SO no necesitan planificador?</p>', solution: { explain: '<p>a. Decidir qué proceso usa la CPU en cada momento según los objetivos del sistema. b. Los monoprogramados (monotarea), como MS-DOS.</p>' } },
        { official: '6.3', level: 1, title: 'Los 4 momentos', prompt: '<p>¿Cuáles son los 4 momentos en los que debe funcionar el planificador?</p>', solution: { explain: '<p>Ver <a href="#/planificacion-conceptos">la lección</a>: ejecución → espera (LS bloqueante), ejecución → listo (interrupción del reloj), espera → listo (fin de E/S) y terminación.</p>' } },
        { official: '6.4', level: 1, title: 'Apropiativo y no apropiativo', prompt: '<p>¿Diferencia entre un algoritmo apropiativo y uno no apropiativo?</p>', solution: { explain: '<p>En el no apropiativo el proceso retiene la CPU hasta liberarla voluntariamente (bloqueo o fin). En el apropiativo el planificador puede expulsarlo (por ejemplo, al vencer el cuanto o al llegar uno más prioritario); requiere temporizador e introduce problemas de concurrencia.</p>' } },
        { official: '6.5', level: 1, title: 'Medidas de resultado', prompt: '<p>Mencione medidas para evaluar un algoritmo de planificación.</p>', solution: { explain: '<p>Utilización de CPU, throughput, tiempo de retorno, tiempo de espera, tiempo de respuesta, consumo de energía.</p>' } },
        { official: '6.6', level: 2, title: 'counter después de fork() (Linux 2.4)', prompt: '<p>Linux 2.4 divide el tiempo en épocas y da a cada proceso un counter (cuanto restante). ¿Qué valor debe tener el counter del hijo creado con fork()? Explique.</p>', solution: { explain: '<p>La <b>mitad</b> del counter que le quedaba al padre, y el padre se queda con la otra mitad (en el código: <code>p-&gt;counter = (current-&gt;counter + 1) &gt;&gt; 1; current-&gt;counter &gt;&gt;= 1;</code>). Si el hijo recibiera un cuanto nuevo completo, un proceso podría acaparar la CPU dentro de una época simplemente creando hijos; repartiéndolo, la familia no consume más CPU que la que tenía el padre.</p>' } },
        { official: '6.7', level: 3, title: 'Experimento con chrt', prompt: '<p>Con <code>prueba_planificador.c</code>: a. ¿Qué hace? b. ¿CPU o E/S? d. ¿Coincide con htop? e. Fórmula para ITERACIONES según el tiempo. f. Políticas de sched_setscheduler. g. ¿Apropiativo? h. ¿A qué política de la teoría se parece? i. Compare real y user con FIFO, control y BATCH. j. Repita con IDLE.</p>', solution: { explain: '<p>a. Gasta CPU en un bucle anidado sin hacer nada útil. b. Limitado por CPU. d. Sí: ~100 % de un núcleo. e. t ∝ N²: N = N₀·√(t/t₀); poco confiable (carga, frecuencia variable, optimizaciones). f. SCHED_OTHER, SCHED_BATCH, SCHED_IDLE, SCHED_FIFO, SCHED_RR (y SCHED_DEADLINE). g. Apropiativo. h. Colas multinivel por prioridad (FCFS o RR dentro de cada nivel). i. El de FIFO termina primero con real ≈ user (no espera a nadie); el de control y el BATCH comparten la CPU después y tardan más en real; los tres tienen user parecido. Si la MV tiene varios núcleos y libres, la diferencia casi desaparece: hay que darle uno solo o usar <code>taskset</code>. j. Con IDLE el tercero espera a que los otros terminen: su real es aproximadamente la suma de los tres.</p>' } },
      ],
    },
  );
})();
