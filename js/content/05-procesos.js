/* Segundo parcial: procesos (unidad 3), TP 3 (instalación de SO) y TP 5, ejercicios 1 a 10 (administración de procesos en Linux). */
(() => {
  const { h, LESSONS } = window.GUIDE;
  const { note, table, def, flow, code, esc } = h;
  const histHas = (sh, re) => sh.hist.some((l) => re.test(l));
  const c = (s) => esc(s.replace(/^\n/, ''));

  LESSONS.push(
    {
      id: 'proceso-y-pcb', module: 'procesos', title: 'Concepto de proceso y PCB',
      keywords: 'proceso programa entidad activa pasiva espacio de direcciones texto datos heap pila PCB bloque de control de proceso PID estado registros primer plano segundo plano task_struct',
      tldr: 'Un proceso es la <b>unidad contenedora de recursos y entidad activa</b>; el programa es la entidad pasiva (el ejecutable). Cada proceso tiene un espacio de direcciones (código, datos, heap, pila), recursos (archivos abiertos, dispositivos) y un <b>PCB</b>, la estructura donde el SO guarda todo lo que necesita para gestionarlo.',
      goals: ['Diferenciar programa y proceso.', 'Describir las zonas del espacio de direcciones.', 'Enumerar los campos del PCB y para qué sirve cada uno.'],
      body: `
<h2>Concepto de proceso</h2>
${def('Proceso', 'Programa en ejecución en un SO multiprogramado. Unidad contenedora de recursos y entidad activa.', 'Diapositivas, Unidad 3. También se usan trabajo (job) y tarea (task).')}
<ul>
  <li>El <b>programa</b> es el código binario contenido en un archivo ejecutable: <b>entidad pasiva</b>. Sus variables no pueden contener valores (recién existen cuando hay un proceso).</li>
  <li>Un proceso <b>nace</b> al ejecutar un programa a través del SO: un proceso pide la creación de otro mediante una LS (el usuario no interactúa con el kernel directamente: usa la CLI o la GUI, que son procesos).</li>
  <li>El kernel inicializa estructuras de datos, asigna espacio y carga el binario en RAM.</li>
  <li>Puede haber <b>muchos procesos con el mismo programa</b> (tres terminales con bash).</li>
</ul>
<p><b>Primer plano</b>: el proceso que recibe la entrada del teclado en ese momento. <b>Segundo plano</b>: los demás (interactivos o no). Se cambia con Alt-Tab o el mouse en la GUI, o con Ctrl-Z, <code>fg</code> y <code>bg</code> en bash. Normalmente un proceso nuevo empieza en primer plano.</p>
<h2>Qué tiene un proceso</h2>
<ul>
  <li>Una parte de la RAM: su <b>espacio de direcciones</b>.</li>
  <li>Los datos que el kernel necesita para administrarlo (PID, estado…): el <b>PCB</b>.</li>
  <li>Otros recursos: archivos abiertos, dispositivos en uso.</li>
</ul>
${table(['Zona (de dirección baja a alta)', 'Qué contiene'], [
  ['Texto (código)', 'Las instrucciones del programa'],
  ['Datos', 'Variables globales y estáticas'],
  ['Heap (montículo)', 'Memoria dinámica (<code>malloc</code>); crece hacia arriba'],
  ['Pila (stack)', 'Parámetros, variables locales y direcciones de retorno de las funciones; crece hacia abajo'],
])}
<h2>Bloque de control de proceso (PCB)</h2>
${def('PCB', 'Estructura de datos donde el SO guarda toda la información que necesita para gestionar un proceso. Cada proceso tiene un PCB asociado.', 'También “bloque de control de tareas”. En Linux es task_struct (include/linux/sched.h).')}
${table(['Campo', 'Para qué'], [
  ['Identificador (PID)', 'Distinguir al proceso'], ['Estado', 'Planificar su ejecución'],
  ['Contador de programa y demás registros', 'El <b>contexto de la CPU</b>, para reanudarlo'], ['Información de planificación', 'Prioridad, punteros a colas, tiempo de uso'],
  ['Información de gestión de memoria', 'Registros base y límite, tabla de páginas'], ['Información contable', 'CPU usada, tiempos'],
  ['Archivos abiertos', 'Qué recursos de E/S tiene'], ['Información de seguridad', 'Usuario y permisos'],
])}
${note('Analogía de la clase: si los procesos fueran los alumnos de una facultad, el PCB sería el <b>legajo</b> de cada uno.', 'tip')}`,
      quiz: [
        { q: '¿Cuál es la diferencia entre programa y proceso?', o: ['El programa es el código (pasivo); el proceso, su ejecución con recursos (activo)', 'El programa está en RAM y el proceso es su copia guardada en el disco para reanudarlo', 'Un programa tiene un solo proceso, y un proceso puede tener muchos programas cargados', 'Son lo mismo: proceso es el nombre que Linux le da al programa cargado en memoria'], a: 0, e: 'El programa es el ejecutable; el proceso es la instancia en ejecución con su memoria, PCB y recursos. Puede haber muchos procesos del mismo programa.' },
        { q: '¿Dónde guarda el SO el contexto de la CPU de un proceso que no está ejecutando?', o: ['En su PCB', 'En la pila del proceso', 'En el vector de interrupciones', 'En el archivo ejecutable'], a: 0, e: 'El PCB incluye el PC y demás registros para poder reanudarlo.' },
        { q: 'Una variable local de una función se almacena en:', o: ['La pila', 'El heap', 'La zona de datos', 'El texto'], a: 0, e: 'Locales, parámetros y direcciones de retorno van en la pila. Globales y estáticas en datos; lo pedido con malloc en el heap.' },
        { q: 'Lo que se reserva con malloc() se ubica en:', o: ['El heap', 'La pila', 'La zona de datos', 'El PCB'], a: 0, e: 'El heap es la memoria dinámica del proceso.' },
        { q: '¿Cuál de estos datos NO está en el PCB?', o: ['El código de las funciones', 'El estado del proceso (listo, en espera…)', 'Los archivos abiertos por el proceso', 'La prioridad de planificación del proceso'], a: 0, e: 'El código está en el espacio de direcciones (zona de texto), no en el PCB.' },
        { q: '¿Qué proceso está en primer plano?', o: ['El que recibe el teclado', 'El que tiene mayor prioridad de planificación', 'El que está usando la CPU en ese instante', 'El que fue creado más recientemente por el usuario'], a: 0, e: 'Es una cuestión de quién recibe el teclado, no de planificación: un proceso en primer plano puede estar esperando E/S.' },
      ],
      open: [{ t: 'text', q: '¿Qué es el PCB y qué información contiene?', k: [['estructura de datos', 'estructura'], ['pid', 'identificador'], ['estado'], ['registros', 'contador de programa', 'contexto'], ['memoria', 'archivos abiertos', 'planificación', 'planificacion', 'contable', 'prioridad']], need: 4, e: 'Es la estructura de datos donde el SO guarda la información para gestionar un proceso: identificador (PID), estado, contador de programa y registros (contexto), información de planificación (prioridad, colas), de memoria, contable, archivos abiertos y de seguridad.' }],
    },
    {
      id: 'estados-y-planificadores', module: 'procesos', title: 'Estados, colas, planificadores y cambio de contexto',
      keywords: 'estados nuevo listo ejecución espera terminado diagrama cola de listos colas de dispositivo planificador largo plazo corto plazo grado de multiprogramación cambio de contexto cambio de proceso limitado por CPU limitado por E/S traza',
      tldr: 'Un proceso pasa por <b>nuevo, listo, en ejecución, en espera y terminado</b>. El planificador de <b>largo plazo</b> admite procesos (controla el grado de MP); el de <b>corto plazo</b> elige quién usa la CPU. Un <b>cambio de contexto</b> no implica un cambio de proceso; un cambio de proceso sí implica cambios de contexto, y es más caro.',
      goals: ['Recorrer el diagrama de estados con los eventos que provocan cada transición.', 'Comparar planificadores de largo y corto plazo.', 'Distinguir cambio de contexto de cambio de proceso.', 'Clasificar procesos limitados por CPU o por E/S.'],
      body: `
<h2>Diagrama de estados</h2>
${table(['Estado', 'Significado'], [
  ['Nuevo', 'El proceso se está creando'], ['Listo', 'Espera que le asignen un procesador'], ['En ejecución', 'Sus instrucciones se están ejecutando'],
  ['En espera de un evento', 'Espera que ocurra algún evento (fin de una E/S, una señal)'], ['Terminado', 'Finalizó la ejecución'],
])}
<p>Solo <b>un proceso por núcleo</b> puede estar en ejecución; puede haber muchos en los demás estados. Un proceso puede circular indefinidamente por el grafo.</p>
<div class="lab-mount" data-lab="0"></div>
<h2>Planificación de procesos</h2>
<ul>
  <li>Con <b>lotes</b> se cambia de proceso cuando el actual se bloquea por una LS. En <b>tiempo compartido</b> (variante de MP), también por tiempo (interrupción del temporizador).</li>
  <li>El <b>planificador</b> es una función del SO que elige, entre los procesos disponibles, cuál usa la CPU. Es necesario para la MP y mantiene las <b>colas</b>: la <b>cola de listos</b> y una <b>cola por dispositivo</b> de E/S.</li>
</ul>
${table(['', 'Largo plazo', 'Corto plazo'], [
  ['Qué decide', 'Qué procesos se admiten y pasan a la cola de listos', 'Qué proceso de la cola de listos ejecuta a continuación'],
  ['Controla', 'Que haya recursos suficientes y el <b>grado de multiprogramación</b>', 'Los objetivos de lotes o tiempo compartido; el tiempo en TC'],
  ['Frecuencia', 'Baja (segundos, minutos); una sola vez por proceso; no necesita velocidad', 'Muy alta: debe ser rápido para no generar demasiado overhead'],
  ['Se dispara por', 'La llegada de trabajos', 'Algunas LS y las interrupciones'],
])}
${note('La planificación también es <b>overhead</b>: tiempo de CPU que no hace trabajo de los usuarios.', '')}
<h2>Cambio de contexto y cambio de proceso</h2>
${table(['', 'Cambio de contexto', 'Cambio de proceso'], [
  ['Qué es', 'La CPU deja de ejecutar un programa y pasa a otro; hay que guardar el contexto para reanudar sin errores', 'El planificador decide que ejecute otro proceso, y cuál'],
  ['Causas', 'Interrupción, LS (caso especial de interrupción), cambio de proceso o de hilo', 'Decisión del planificador de corto plazo'],
  ['Qué se hace', 'Guardar y restaurar registros', 'Guardar el contexto del saliente en su PCB, cargar el del entrante, actualizar PCB y colas'],
  ['Costo', 'Menor', 'Mayor: incluye cambios de contexto, más PCB, colas y la caché “fría”'],
])}
${note('<p>“Cambio de contexto” <b>no implica</b> cambio de proceso (al atender una interrupción, la CPU vuelve al mismo proceso). En muchos libros se usa “cambio de contexto” como sinónimo de cambio de proceso: en la materia, no. Un cambio de proceso implica al menos <b>dos</b> cambios de contexto: del proceso saliente al kernel y del kernel al proceso entrante.</p>', 'exam')}
<p>El tiempo de cambio es overhead y crece con la cantidad de registros, la complejidad del PCB y del planificador. Además, el proceso que entra encuentra la caché llena de datos del anterior. Ejemplos de la vida: atender la puerta mientras estudio es un cambio de contexto (vuelvo a lo mismo); pasar del TP de una materia al de otra es un cambio de proceso, más costoso de retomar. Un sistema de <b>tiempo compartido</b> pierde más tiempo en cambios de proceso que uno por lotes. Herramientas en Linux: <code>mpstat</code>, <code>vmstat</code>, <code>pidstat</code>.</p>
<h2>Procesos limitados por CPU o por E/S</h2>
<ul>
  <li><b>Limitado por E/S</b> (I/O bound): pasa más tiempo haciendo E/S que usando CPU. Ej.: procesador de texto, copiar archivos, ver un video en streaming.</li>
  <li><b>Limitado por CPU</b> (CPU bound): pasa más tiempo usando la CPU. Ej.: compilar, renderizar, descomprimir (a veces), minería, benchmarks.</li>
  <li>También identifica qué recurso hay que mejorar para que tarde menos: depende del programa <b>y</b> del hardware. Si a una notebook con HDD le ponemos un NVMe, lo que era limitado por E/S puede pasar a ser limitado por CPU (y la CPU trabajar más y calentarse más).</li>
</ul>
<p><b>Traza</b> de un proceso: el listado de las instrucciones que efectivamente ejecutó esa instancia (el camino que tomó por los condicionales). Dos ejecuciones del mismo programa pueden tener trazas distintas.</p>`,
      labs: [{ type: 'states', title: 'Recorré el diagrama de estados' }],
      quiz: [
        { q: 'Un proceso en espera recibe el aviso de que terminó su E/S. ¿A qué estado pasa?', o: ['Listo', 'En ejecución', 'Nuevo', 'Sigue en espera hasta que el planificador lo elija'], a: 0, e: 'Va a listo: recién ahí el planificador de corto plazo puede elegirlo para ejecutar.' },
        { q: 'Un proceso en ejecución hace una LS read bloqueante sobre el disco. Pasa a:', o: ['En espera', 'Listo', 'Terminado', 'Nuevo'], a: 0, e: 'Espera el evento (fin de la lectura). Si fuera fin de cuanto, iría a listo.' },
        { q: '¿Qué planificador controla el grado de multiprogramación?', o: ['El de largo plazo', 'El de corto plazo', 'El despachador', 'El de E/S'], a: 0, e: 'El de largo plazo decide cuántos procesos se admiten en el sistema.' },
        { q: '¿Por qué el planificador de corto plazo tiene que ser rápido?', o: ['Porque se invoca muy seguido y es overhead', 'Porque decide qué procesos se admiten al sistema y cuántos', 'Porque trabaja con las colas de dispositivos de E/S, que son lentas', 'Porque se ejecuta en modo usuario y compite con los procesos'], a: 0, e: 'Se dispara en cada interrupción de reloj y en muchas LS: si es lento, el overhead es enorme.' },
        { q: 'La CPU atiende una interrupción de teclado y vuelve al mismo proceso. Hubo:', o: ['Cambio de contexto, pero no cambio de proceso', 'Cambio de proceso, pero no cambio de contexto', 'Cambio de contexto y cambio de proceso', 'Ni cambio de contexto ni de proceso, porque no se tocó el PCB'], a: 0, e: 'Se guardó y restauró el contexto para ejecutar la ISR, pero el proceso sigue siendo el mismo.' },
        { q: '¿Cuántos cambios de contexto implica, como mínimo, un cambio de proceso?', o: ['Dos: saliente → kernel → entrante', 'Uno: directamente del proceso saliente al entrante', 'Ninguno: el cambio de proceso solo actualiza los PCB, no los registros', 'Tantos como procesos haya en la cola de listos en ese momento'], a: 0, e: 'Para decidir el cambio tiene que ejecutar el kernel (planificador): entra (1) y luego sale hacia el nuevo proceso (2).' },
        { q: 'Un compresor de archivos que en un HDD lento pasa la mayor parte del tiempo esperando lecturas es:', o: ['Limitado por E/S en esa máquina', 'Limitado por CPU en cualquier máquina, porque comprimir es cálculo', 'Limitado por memoria, porque guarda el archivo entero en RAM', 'Interactivo, porque el usuario espera el resultado'], a: 0, e: 'La clasificación depende del programa y de los recursos: el recurso que limita es el que hay que mejorar.' },
        { q: '¿Qué sistema pierde más tiempo en cambios de proceso?', o: ['Uno de tiempo compartido', 'Uno por lotes', 'Uno monoprogramado', 'Los dos pierden lo mismo'], a: 0, e: 'En TC se cambia también por tiempo, muchas veces por segundo; en lotes, solo cuando el proceso se bloquea o termina.' },
      ],
      open: [{ t: 'text', q: 'Diferenciá cambio de contexto de cambio de proceso.', k: [['registros', 'contexto'], ['interrupción', 'interrupcion', 'llamada al sistema'], ['planificador'], ['pcb'], ['implica']], need: 4, e: 'Un cambio de contexto es pasar la CPU de ejecutar un programa a otro guardando el contexto (registros) para reanudar; lo causan interrupciones, LS o cambios de proceso o de hilo, y no implica cambiar de proceso. En un cambio de proceso el planificador decide que ejecute otro proceso: se guarda el contexto del saliente en su PCB, se carga el del entrante y se actualizan PCB y colas. El cambio de proceso implica cambios de contexto y es más costoso.' }],
    },
    {
      id: 'fork-exec-wait', module: 'procesos', title: 'Crear y terminar procesos: fork, exec, wait y exit',
      keywords: 'fork exec execl wait exit padre hijo árbol de procesos zombie huérfano pid copia matar procesos',
      tldr: '<code>fork()</code> crea un hijo que es una <b>copia idéntica</b> del padre y ambos siguen desde la línea siguiente: el padre recibe el PID del hijo (&gt; 0) y el hijo recibe 0. <code>exec()</code> reemplaza el programa del proceso que la llama. <code>wait()</code> espera a un hijo y recupera su estado; un hijo terminado sin wait queda <b>zombi</b>.',
      goals: ['Predecir cuántos procesos e impresiones genera un programa con fork.', 'Explicar exec, wait y exit, zombis y huérfanos.'],
      body: `
<h2>Creación</h2>
<p>El padre crea hijos que a su vez crean otros: un <b>árbol de procesos</b>. Opciones: compartir todos, algunos o ningún recurso; ejecutar en simultáneo o que el padre espere; el hijo como copia del padre o con otro programa.</p>
${code(`// Aca hay un solo proceso
pid = fork();
// Aca hay 2 procesos: el padre con pid > 0 y el hijo con pid = 0
if (pid > 0) {
    // codigo del padre: el hijo nunca ejecuta esto
    wait(NULL);
} else {
    // codigo del hijo: el padre nunca ejecuta esto
    execl("/bin/ls", "ls", NULL);
}
// Codigo comun: si nadie llamo a exit (y el exec fallo), ambos ejecutan lo que sigue`, 'c')}
<ul>
  <li><code>fork()</code>: el hijo es <b>copia idéntica</b> del padre, incluidos programa y datos, y sigue desde la instrucción siguiente al fork (no desde el principio).</li>
  <li><code>exec()</code>: reemplaza el espacio de memoria del proceso con un nuevo programa. Si funciona, <b>no vuelve</b>: lo que sigue al exec ya no existe en ese proceso. ¿Y si el padre llama a exec? Se reemplaza el padre: el hijo sigue con el programa viejo.</li>
</ul>
<div class="lab-mount" data-lab="0"></div>
<h2>Terminación en UNIX</h2>
<ol>
  <li>El proceso ejecuta su última instrucción y avisa al SO con la LS <code>exit()</code> (si el programador no la llama, el compilador la incluye).</li>
  <li>El SO libera sus recursos y lo deja en estado <b>zombi</b>.</li>
  <li>Si el padre hace <code>wait()</code>, el SO le devuelve los datos de estado del hijo (si terminó bien o no, contabilidad).</li>
  <li>El SO elimina el proceso de su registro (el PCB).</li>
</ol>
<ul>
  <li><b>Zombi</b>: terminó pero su padre todavía no recogió su estado con wait.</li>
  <li><b>Huérfano</b>: su padre terminó y él sigue vivo (en Linux lo adopta init/systemd).</li>
  <li>Se puede pedir al kernel que mate un proceso aunque no haya terminado. En general solo el padre (o el mismo usuario, o root) puede: si cualquier proceso pudiera matar a cualquiera, no habría protección.</li>
</ul>`,
      labs: [{ type: 'fork', title: '¿Cuántos procesos? ¿Cuántas líneas?', intro: 'Contá antes de comprobar. Suponé que fork nunca falla.', programs: [
        { name: 'Dos fork seguidos', code: c(`fork();
fork();
printf("hola\\n");`), prog: ['fork', 'fork', { print: 'hola' }], why: 'El primer fork duplica (2 procesos) y cada uno ejecuta el segundo fork (4 procesos). Los cuatro imprimen: 4 líneas.' },
        { name: 'fork en un for', code: c(`for (int i = 0; i < 3; i++)
    fork();
printf("x\\n");`), prog: [{ loop: 3, body: ['fork'] }, { print: 'x' }], why: 'Cada vuelta duplica la cantidad de procesos: 2³ = 8 procesos y 8 líneas.' },
        { name: 'printf dentro del for', code: c(`for (int i = 0; i < 3; i++) {
    fork();
    printf("x\\n");
}`), prog: [{ loop: 3, body: ['fork', { print: 'x' }] }], why: 'Vuelta 0: 2 procesos imprimen; vuelta 1: 4; vuelta 2: 8. Total 2 + 4 + 8 = 14 líneas y 8 procesos.' },
        { name: 'Solo el padre vuelve a hacer fork', code: c(`if (fork() == 0) {
    printf("hijo\\n");
    exit(0);
} else {
    fork();
}
printf("fin\\n");`), prog: [{ ifChild: [{ print: 'hijo' }, 'exit'], ifParent: ['fork'] }, { print: 'fin' }], why: 'El primer hijo imprime y termina con exit (no llega a “fin”). El padre crea un segundo hijo; padre y segundo hijo imprimen “fin”. 3 procesos, 3 líneas.' },
        { name: 'fork + exec', code: c(`pid = fork();
if (pid == 0) {
    execl("/bin/ls", "ls", NULL);   /* imprime el listado */
} else {
    wait(NULL);
    printf("padre\\n");
}
printf("comun\\n");`), prog: [{ ifChild: [{ print: '(salida de ls)' }, 'exit'], ifParent: [{ print: 'padre' }] }, { print: 'comun' }], why: 'exec reemplaza el programa del hijo: “comun” nunca se ejecuta en el hijo. El padre espera e imprime “padre” y “comun”. 2 procesos; el listado de ls cuenta como una salida.' },
      ] }],
      quiz: [
        { q: 'Después de pid = fork(), ¿qué valor tiene pid en el hijo?', o: ['0', 'El PID del padre', 'El PID del hijo', '-1'], a: 0, e: 'El hijo recibe 0; el padre, el PID del hijo (> 0); -1 indica error y no hay hijo.' },
        { q: '¿Desde dónde empieza a ejecutar el hijo creado con fork()?', o: ['Desde la instrucción siguiente al fork', 'Desde el principio del main, con las variables del padre', 'Desde la función que se pasa como parámetro a fork()', 'Desde la dirección que indique la llamada a exec'], a: 0, e: 'Es una copia del padre en ese punto, con el mismo PC.' },
        { q: '¿Qué hace exec() si se ejecuta con éxito?', o: ['Reemplaza el programa del proceso que la llama y no retorna', 'Crea un nuevo proceso hijo con otro programa', 'Espera a que termine un hijo y devuelve su estado', 'Ejecuta otro programa y luego vuelve a la línea siguiente'], a: 0, e: 'exec no crea procesos: transforma al que la llama. Por eso se combina con fork.' },
        { q: '¿Qué es un proceso zombi?', o: ['Uno que terminó sin que el padre hiciera wait', 'Uno cuyo padre terminó mientras él seguía ejecutando', 'Uno detenido con SIGSTOP que no puede reanudarse', 'Uno que consume CPU en un bucle sin hacer nada útil'], a: 0, e: 'El zombi ya liberó sus recursos pero conserva su entrada para que el padre lea el estado. Si el que terminó es el padre y el hijo sigue, el hijo es un huérfano.' },
        { q: '¿Para qué hace wait() un proceso padre?', o: ['Para esperar que un hijo termine y leer su estado', 'Para pasar a estado listo hasta que el planificador vuelva a elegirlo', 'Para que el hijo herede sus archivos abiertos y sus variables', 'Para crear un hijo y esperar a que empiece a ejecutar'], a: 0, e: 'wait bloquea al padre hasta que termina un hijo y le devuelve si terminó bien, permitiendo eliminar su PCB.' },
        { q: 'Con el código fork(); fork(); fork(); printf("a"); se imprimen:', o: ['8 letras a', '3 letras a', '4 letras a', '6 letras a'], a: 0, e: 'Cada fork duplica: 2³ = 8 procesos, cada uno imprime una vez.' },
      ],
      open: [{ t: 'num', q: 'for (i = 0; i < 4; i++) fork(); printf("x"); ¿Cuántas x se imprimen?', a: 16, e: 'Cada vuelta duplica la cantidad de procesos: 2⁴ = 16 procesos, cada uno imprime una x.' }],
    },
    {
      id: 'ipc-tuberias-senales', module: 'procesos', title: 'Comunicación entre procesos: memoria compartida, mensajes, tuberías y señales',
      keywords: 'IPC procesos independientes competitivos cooperativos memoria compartida paso de mensajes send receive bloqueante sincrónico asincrónico tubería pipe sin nombre con nombre mkfifo señales kill manejador handler',
      tldr: 'Los procesos cooperativos necesitan IPC. <b>Memoria compartida</b>: el SO asigna una zona y después queda bajo control de los procesos (lo más rápido, con problemas de concurrencia). <b>Paso de mensajes</b>: interviene el kernel en cada envío (más lento, sirve entre máquinas). Las <b>señales</b> de UNIX informan eventos y se manejan como interrupciones.',
      goals: ['Clasificar procesos en independientes, competitivos y cooperativos.', 'Comparar memoria compartida y paso de mensajes.', 'Diferenciar tuberías con y sin nombre.', 'Explicar cómo se generan, entregan y manejan las señales.'],
      body: `
<h2>Procesos independientes, competitivos y cooperativos</h2>
<ul>
  <li><b>Independientes</b>: no pueden afectar ni verse afectados por otros.</li>
  <li><b>Cooperativos</b>: pueden afectar o verse afectados. Razones: compartir información, acelerar el cómputo, modularidad, conveniencia.</li>
  <li><b>Competitivos</b>: compiten por recursos (se ven en concurrencia).</li>
</ul>
<h2>Dos modelos de IPC</h2>
${table(['', 'Memoria compartida', 'Paso de mensajes'], [
  ['Cómo', 'Un proceso pide al SO un área de RAM compartida; asignada, se usa como memoria normal', 'send(mensaje) y receive(mensaje) a través del kernel'],
  ['Quién controla', 'Los procesos de usuario, no el SO', 'El kernel interviene en cada envío y recepción'],
  ['Velocidad', '<b>La más rápida</b>', 'Más lenta'],
  ['Alcance', 'Procesos de la misma PC', 'También procesos en otras PC'],
  ['Problema', 'Concurrencia (lo vemos en el 3.er parcial)', 'Overhead'],
])}
<p>Compartir un <b>archivo local</b> también es memoria compartida (más sencillo pero más lento). Si el archivo está en otra máquina, para al menos uno de los procesos ya no es local: trabaja a la velocidad de la red, entra en el esquema cliente-servidor y se transforma en paso de mensajes.</p>
<p>El paso de mensajes puede ser <b>bloqueante</b> (sincrónico: el emisor espera hasta que se recibe; el receptor espera hasta que haya mensaje) o <b>no bloqueante</b> (asincrónico: el emisor sigue; el receptor recibe un mensaje válido o nulo). Hay combinaciones.</p>
<h2>Tuberías (pipes)</h2>
<p>Un conducto para que dos procesos se comuniquen. Según las diapositivas, son <b>memoria compartida</b>.</p>
${table(['', 'Sin nombre', 'Con nombre (FIFO)'], [
  ['Dirección', 'Unidireccionales: el productor escribe en un extremo, el consumidor lee del otro', 'Bidireccionales'],
  ['Relación entre procesos', 'Requieren relación padre-hijo', 'No hace falta; varios procesos pueden usarla'],
  ['Persistencia', 'Desaparecen con los procesos', 'Son <b>archivos</b>: persisten y tienen permisos de UNIX'],
  ['Ejemplo', '<code>ls -l / | grep home</code>', '<code>mkfifo /tmp/tuberia</code>'],
])}
${code(`mkfifo /tmp/tuberia
ls -l /tmp/tuberia          # aparece con tipo "p"
grep home /tmp/tuberia      # en una terminal: queda esperando datos
ls -l / > /tmp/tuberia      # en otra terminal: grep recibe la salida`, 'sh')}
${note('En las diapositivas, en <code>ls | grep</code> “ls es el padre que le transmite a su hijo grep”. En bash, en rigor, los dos son hijos del shell (hermanos, con un ancestro común que creó la tubería). Para el parcial alcanza con: las tuberías sin nombre requieren procesos emparentados.', 'warn')}
<h2>Señales en UNIX</h2>
<ul>
  <li>Mecanismo estándar para <b>informar a un proceso la ocurrencia de un evento</b>. Es IPC por <b>paso de mensajes</b>. Muchos lenguajes tienen eventos con el mismo enfoque (el evento “offline” del navegador).</li>
  <li>Cualquier proceso puede enviar señales a otro (con restricciones). Usos: matar, suspender, reanudar procesos. Desde la terminal con <code>kill</code>; la X de una ventana también envía una señal para que el proceso termine.</li>
</ul>
${flow('La señal se genera por un evento (sincrónico o asincrónico)', 'El kernel “entrega” la señal al proceso', 'La maneja el manejador por defecto (del SO) o uno definido por el programador')}
<p>El procedimiento es <b>similar al de las interrupciones</b>: los manejadores (handlers) son funciones que se ejecutan según la señal que llega. Cada señal tiene un manejador predeterminado; en algunos casos el del usuario puede reemplazarlo e incluso ignorar la señal (no con SIGKILL ni SIGSTOP).</p>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'classify', title: '¿Memoria compartida o paso de mensajes?', buckets: ['Memoria compartida', 'Paso de mensajes'], items: [
        { t: 'Después de que el SO asigna la zona, los procesos la usan sin intervención del kernel', b: 0 }, { t: 'Sirve para comunicar procesos en distintas computadoras', b: 1 },
        { t: 'Es el mecanismo más rápido', b: 0 }, { t: 'Las señales de UNIX', b: 1, why: 'Según las diapositivas, las señales son IPC por paso de mensajes.' },
        { t: 'Las tuberías, según las diapositivas', b: 0 }, { t: 'Puede ser bloqueante (sincrónico) o no bloqueante', b: 1 },
        { t: 'Dos procesos de la misma PC comparten un archivo local', b: 0 }, { t: 'Un archivo compartido por red con otra computadora', b: 1, why: 'Deja de ser local: se transforma en paso de mensajes (cliente-servidor).' },
      ] }],
      quiz: [
        { q: '¿Por qué la memoria compartida es el mecanismo de IPC más rápido?', o: ['Porque, una vez asignada, los procesos la usan como memoria normal sin intervención del kernel', 'Porque el kernel copia los datos entre procesos con instrucciones especiales de la CPU', 'Porque usa la caché del procesador en lugar de la memoria principal', 'Porque los procesos se comunican sin necesidad de sincronizarse nunca'], a: 0, e: 'El kernel solo interviene al crearla. El costo es que la concurrencia queda a cargo de los procesos.' },
        { q: 'Una tubería sin nombre:', o: ['Es unidireccional y requiere procesos emparentados', 'Es bidireccional y la pueden usar procesos no emparentados', 'Es un archivo con permisos que persiste en el SA', 'Permite comunicar procesos de distintas computadoras'], a: 0, e: 'Las con nombre (FIFO) son las bidireccionales, persistentes, con permisos y sin requerir parentesco.' },
        { q: 'En el paso de mensajes bloqueante (sincrónico), el emisor:', o: ['Se bloquea hasta que el mensaje es recibido', 'Envía y continúa inmediatamente', 'Recibe un mensaje nulo si no hay receptor', 'Escribe en una zona de memoria compartida'], a: 0, e: 'En el no bloqueante el emisor envía y sigue; el receptor puede recibir un mensaje nulo.' },
        { q: '¿A qué mecanismo se parece el manejo de señales en UNIX?', o: ['Al manejo de interrupciones', 'A la planificación de corto plazo, que elige quién atiende la señal', 'A la memoria compartida entre el proceso y el kernel', 'A la creación de procesos con fork, que copia el manejador'], a: 0, e: 'Se genera, el kernel la entrega y se ejecuta un manejador (por defecto o del programador), como una ISR.' },
        { q: '¿Qué pasa con un archivo compartido entre procesos de dos computadoras distintas?', o: ['Pasa a ser paso de mensajes (cliente-servidor)', 'Sigue siendo memoria compartida, con la misma velocidad que en una sola PC', 'Se convierte en una tubería con nombre entre las dos máquinas', 'El SO lo bloquea para que solo un proceso por vez pueda usarlo'], a: 0, e: 'Para al menos uno de los procesos el archivo no es local: trabaja a la velocidad de la red.' },
        { q: '¿Cuál NO es una razón para crear procesos cooperativos?', o: ['Evitar los problemas de concurrencia', 'Compartir información entre procesos', 'Acelerar el cómputo dividiendo el trabajo', 'Modularidad del sistema'], a: 0, e: 'Al revés: cooperar trae problemas de concurrencia. Las razones son compartir información, acelerar, modularidad y conveniencia.' },
      ],
      open: [{ t: 'text', q: 'Compará memoria compartida y paso de mensajes.', k: [['rápid', 'velocidad'], ['kernel', 'so interviene', 'sistema operativo interviene'], ['concurrencia'], ['otras computadoras', 'red', 'otra pc', 'distintas computadoras']], need: 3, e: 'En memoria compartida el SO asigna una zona de RAM que luego controlan los procesos: es lo más rápido, pero solo entre procesos de la misma PC y con problemas de concurrencia. En el paso de mensajes el kernel interviene en cada send y receive: es más lento pero permite comunicar procesos en otras computadoras; puede ser bloqueante (sincrónico) o no.' }],
    },
  );

  LESSONS.push({
    id: 'tp-instalacion', module: 'instalacion', title: 'TP 3: instalar Windows y Linux en una máquina virtual',
    keywords: 'máquina virtual VMware instalación Windows Linux multiboot GRUB orden de instalación top htop programas del sistema programas de aplicación',
    tldr: 'El TP 3 repite el procedimiento de los videos: crear una máquina virtual, instalar Windows, después Linux (dual boot), medir RAM y CPU en reposo y distinguir programas del sistema de programas de aplicación. La teoría está en la lección de instalación del 1.er parcial.',
    goals: ['Responder el cuestionario de control del TP 3.', 'Medir recursos con top/htop y el administrador de tareas.'],
    body: `
<h2>Procedimiento</h2>
${flow('Crear la máquina virtual (VMware) con disco y memoria', 'Instalar Windows usando todo el disco', 'Reducir la partición de Windows para hacer lugar', 'Instalar Linux en el espacio libre: detecta Windows y configura GRUB', 'Arrancar cada SO y medir recursos')}
<p>Repasá: <a href="#/instalar-un-so">instalar un SO</a> y <a href="#/firmware-bios-uefi">arranque BIOS/UEFI</a>.</p>
${note('GRUB (GRand Unified Bootloader) es el cargador de arranque de la mayoría de los Linux: muestra un menú para elegir qué SO (o qué kernel) arrancar y carga el kernel elegido.', 'exam')}
<h2>Programas del sistema y de aplicación</h2>
<p>Al instalar, junto con el kernel se instalan muchos programas. Para el ejercicio 4 hay que separar:</p>
${table(['', 'Windows', 'Linux (Debian)'], [
  ['Programas del sistema', 'Explorador de archivos, cmd/PowerShell, Administrador de tareas, Panel de control, Visor de eventos', 'bash, systemd, el entorno gráfico (GNOME/xfce), ls/cp/ps, el administrador de paquetes (apt), GRUB'],
  ['Programas de aplicación', 'Edge, Bloc de notas, Paint, Calculadora, Reproductor multimedia', 'Firefox, LibreOffice, un editor de texto (gedit), un reproductor, un juego'],
])}`,
    quiz: [
      { q: 'Si instalás Linux primero y después Windows en la misma PC:', o: ['Windows impone su cargador y Linux deja de aparecer', 'Windows detecta Linux y lo agrega a su menú de arranque', 'No se puede: Windows exige ser el único SO del disco', 'Funciona igual, porque el firmware elige qué SO arrancar'], a: 0, e: 'Por eso se recomienda instalar primero Windows: el instalador de Linux sí detecta a Windows y lo agrega a GRUB.' },
      { q: '¿Cuántos SO se pueden instalar como máximo en una partición?', o: ['Uno', 'Dos, si son de distinta familia (Windows y Linux)', 'Tantos como permita el tamaño de la partición', 'Ninguno: el SO va en la ESP'], a: 0, e: 'Cada SO necesita su partición dedicada. En una PC, en cambio, puede haber varios (limitado por particiones y espacio).' },
      { q: '¿Qué es GRUB?', o: ['El cargador de arranque de la mayoría de los Linux', 'El firmware de las placas madre modernas, sucesor del BIOS', 'El sistema de archivos que usa Linux en la partición raíz', 'El instalador gráfico de Debian y sus derivados'], a: 0, e: 'GRUB carga el kernel elegido. El firmware es BIOS/UEFI; el SA, ext4.' },
      { q: 'El explorador de archivos que se instala con Windows es:', o: ['Un programa del sistema', 'Parte del kernel de Windows', 'Un programa de aplicación', 'Un driver'], a: 0, e: 'Sirve para administrar la computadora (programa del sistema), pero no es el SO.' },
    ],
    exercises: [
      { official: '3.a', level: 1, title: 'Cuestionario de control', prompt: '<p>a. ¿Qué significa multiboot? b. ¿Orden recomendado para Windows y Linux? c. ¿Cuántos SO máximo por partición? d. ¿Cuántos SO máximo en una PC? e. ¿Qué es GRUB?</p>', solution: { explain: '<ol type="a"><li>Tener varios SO instalados en una computadora y elegir uno cada vez que arranca.</li><li>Primero Windows, después Linux.</li><li>Uno: cada SO necesita su partición dedicada.</li><li>No hay un número fijo: varios, limitados por la cantidad de particiones posibles (4 primarias en MBR, 128 en GPT por defecto) y el espacio.</li><li>El cargador de arranque de Linux, que muestra el menú para elegir el SO y carga el kernel.</li></ol>' } },
      { official: '3.3', level: 1, title: 'Comparar el consumo en reposo', prompt: '<p>Compare la RAM y CPU medidas en Windows y Linux 5 minutos después de instalar y después de reiniciar. Mida también en la MV de la cátedra con top o htop.</p>', solution: { explain: '<p>Lo esperable: Windows usa bastante más RAM en reposo (servicios, indexación, actualizaciones) y tiene picos de CPU los primeros minutos tras instalar o reiniciar; un Debian con un escritorio liviano usa una fracción. La MV de la cátedra, sin entorno gráfico pesado, todavía menos. Relacionalo con el objetivo de “consumir pocos recursos para sí mismo” (aunque lo que se mide incluye programas del sistema, no solo el kernel).</p>' } },
      { official: '3.4', level: 1, title: 'Programas del sistema y de aplicación', prompt: '<p>Para cada instalación, nombre 5 programas del sistema y 5 de aplicación que se instalan con el kernel.</p>', solution: { explain: '<p>Ver la tabla de la lección.</p>' } },
    ],
  });

  LESSONS.push(
    {
      id: 'ps-top-estados', module: 'admproc', title: 'ps, top y los estados de Linux',
      keywords: 'ps a u x aux top htop STAT R S D T Z estado de proceso columnas PID TTY TIME CMD %CPU %MEM VSZ RSS administrador de tareas',
      tldr: '<code>ps</code> saca una <b>foto instantánea</b> de los procesos; <code>top</code> y <code>htop</code> los muestran en tiempo real. La columna STAT da el estado de Linux con una letra: <b>R</b> ejecutando o listo, <b>S</b> durmiendo (espera interrumpible), <b>D</b> espera ininterrumpible, <b>T</b> detenido, <b>Z</b> zombi.',
      goals: ['Usar ps con a, u y x e interpretar sus columnas.', 'Relacionar los estados de Linux con el diagrama de la teoría.'],
      body: `
<h2>ps y sus opciones</h2>
${table(['Opción (estilo BSD)', 'Efecto'], [
  ['a', 'Procesos de <b>todos los usuarios</b> que tienen terminal (no solo los propios)'],
  ['u', 'Formato orientado al <b>usuario</b>: agrega USER, %CPU, %MEM, VSZ, RSS, STAT, START'],
  ['x', 'Incluye procesos <b>sin terminal</b> (demonios)'],
  ['aux', 'Todo, con detalle: la combinación más usada'],
])}
${table(['Columna', 'Significado'], [
  ['PID', 'Identificador del proceso'], ['TTY', 'Terminal asociada (? si no tiene)'], ['STAT', 'Estado'], ['TIME', 'Tiempo de CPU acumulado'],
  ['CMD / COMMAND', 'El comando'], ['%CPU, %MEM', 'Uso de CPU y de memoria'], ['VSZ / RSS', 'Memoria virtual total / memoria residente en RAM (en KB)'],
])}
<p>Esa información sale del <b>PCB</b> de cada proceso (en Linux, <code>task_struct</code>), que el kernel expone en <code>/proc</code>.</p>
<h2>Estados de Linux y el diagrama de la teoría</h2>
${table(['Letra', 'Estado de Linux', 'Estado del diagrama'], [
  ['R', 'Ejecutando o ejecutable (en la cola)', 'En ejecución <b>o</b> listo'],
  ['S', 'Durmiendo, espera interrumpible (por un evento)', 'En espera de un evento'],
  ['D', 'Espera ininterrumpible (normalmente E/S de disco)', 'En espera de un evento'],
  ['T', 'Detenido por una señal de control de trabajos (o depurándose)', 'Ninguno del diagrama básico: suspendido'],
  ['Z', 'Zombi: terminado, sin recoger por el padre', 'Terminado'],
  ['I', 'Hilo del kernel inactivo', 'En espera de un evento'],
])}
<p>Modificadores: <b>+</b> grupo en primer plano, <b>s</b> líder de sesión, <b>&lt;</b> prioridad alta, <b>N</b> prioridad baja, <b>l</b> multihilo.</p>
<h2>top y htop</h2>
<p>A diferencia de ps, se actualizan continuamente y ordenan por consumo. Columnas útiles: PID, USER, PR/NI (prioridad y nice), VIRT/RES (memoria), S (estado), %CPU, %MEM, TIME+. En Windows, el equivalente gráfico es el <b>Administrador de tareas</b> (o el Monitor de recursos).</p>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'shell', title: 'Terminal simulada: mirar procesos', tasks: [
        { t: 'Mirá los procesos de tu terminal con <code>ps</code>', check: (sh) => histHas(sh, /^ps\s*$/) },
        { t: 'Probá <code>ps a</code>, <code>ps u</code> y <code>ps aux</code>', check: (sh) => ['a', 'u', 'aux'].every((o) => histHas(sh, new RegExp(`^ps\\s+-?${o}\\s*$`))) },
        { t: 'Lanzá <code>sleep 6000 &amp;</code> y buscá su estado con <code>ps u</code>', check: (sh) => histHas(sh, /^sleep\s+\d+\s*&/) && histHas(sh, /^ps\s+-?\w*u/) },
        { t: 'Mirá la foto de <code>top</code>', check: (sh) => histHas(sh, /^h?top/) },
      ] }],
      quiz: [
        { q: 'En la salida de ps, un proceso con STAT = T está:', o: ['Detenido por una señal', 'Terminado, esperando que el padre haga wait', 'Listo para ejecutar, en la cola de listos', 'Esperando que termine una operación de disco'], a: 0, e: 'T = detenido. Terminado sin recoger es Z; listo o ejecutando es R; espera de disco, D.' },
        { q: 'La letra R en la columna STAT corresponde, en el diagrama de la teoría, a:', o: ['Ejecución o listo', 'Solo en ejecución en un núcleo', 'Solo listo, en la cola', 'En espera de un evento'], a: 0, e: 'Linux no distingue en ps entre ejecutando y en la cola de ejecutables: ambos son R.' },
        { q: '¿Qué agrega la opción x de ps?', o: ['Los procesos sin terminal', 'Los procesos de todos los usuarios del sistema', 'Las columnas %CPU y %MEM con el consumo', 'Los hilos de cada proceso como filas separadas'], a: 0, e: 'x muestra los procesos sin TTY (demonios). a agrega los de otros usuarios con terminal; u el formato de usuario.' },
        { q: 'Un proceso sleep que está esperando que pase el tiempo aparece en estado:', o: ['S', 'R', 'D', 'Z'], a: 0, e: 'Duerme en espera interrumpible: S.' },
        { q: '¿De qué estructura del SO sale la información que muestra ps?', o: ['Del PCB de cada proceso', 'Del vector de interrupciones', 'De la tabla de particiones', 'Del archivo ejecutable de cada programa'], a: 0, e: 'Estado, PID, tiempos, memoria: todo está en el PCB (task_struct), expuesto en /proc.' },
        { q: '¿Qué diferencia principal tiene top respecto de ps?', o: ['Se actualiza continuamente; ps es una foto instantánea', 'Muestra procesos de todos los usuarios y ps solo los propios', 'Puede mostrar el estado y ps no', 'Solo funciona como root'], a: 0, e: 'ps toma una imagen en el momento en que se invoca; top/htop refrescan cada pocos segundos.' },
      ],
      exercises: [
        { official: '5.1', level: 1, title: 'Programa y proceso', prompt: '<p>¿Cuál es la diferencia entre programa y proceso?</p>', solution: { explain: '<p>El programa es el código, en un archivo ejecutable (entidad pasiva). El proceso es un programa en ejecución en un SO multiprogramado: unidad contenedora de recursos y entidad activa, con espacio de direcciones, PCB y recursos. Puede haber muchos procesos del mismo programa.</p>' } },
        { official: '5.2', level: 1, title: 'PCB', prompt: '<p>¿Qué es el PCB y qué datos contiene?</p>', solution: { explain: '<p>Ver <a href="#/proceso-y-pcb">la lección del PCB</a>: PID, estado, PC y registros, planificación, memoria, contabilidad, archivos abiertos y seguridad.</p>' } },
        { official: '5.3', level: 1, title: 'Estados', prompt: '<p>¿Qué es el estado de un proceso? Mencione algunos.</p>', solution: { explain: '<p>Es la situación del proceso respecto de su ejecución, que el SO usa para planificar: nuevo, listo, en ejecución, en espera, terminado.</p>' } },
        { official: '5.4', level: 1, title: 'Traza', prompt: '<p>¿Qué es la traza de un proceso?</p>', solution: { explain: '<p>El listado de instrucciones que efectivamente ejecutó esa instancia: el camino que tomó por los condicionales. Dos ejecuciones del mismo programa pueden tener trazas distintas.</p>' } },
        { official: '5.5', level: 1, title: 'Crear procesos en UNIX y Windows', prompt: '<p>¿Cuál es la LS de UNIX para crear un proceso? ¿Y en Windows?</p>', solution: { explain: '<p>En UNIX, <code>fork()</code> (y luego <code>exec()</code> para cambiar de programa). En Windows, <code>CreateProcess()</code>, que crea el proceso y carga el programa en una sola llamada.</p>' } },
        { official: '5.7', level: 2, title: 'ps a, u, x', prompt: '<p>Pruebe ps con a, u y x y sus combinaciones. a. ¿Dónde buscaría información? b. ¿Qué efecto tiene cada opción? c. ¿Qué contiene cada columna de ps a y de qué estructura sale? d. Liste los estados posibles (primera letra). e. Relaciónelos con el grafo de la teoría.</p>', solution: { explain: '<p>a. En <code>man ps</code> (sección PROCESS STATE CODES para los estados). b, c, d y e: ver las tablas de la lección. La información sale del PCB.</p>' } },
        { official: '5.8', level: 1, title: 'top y htop', prompt: '<p>a. ¿Para qué sirven y qué diferencias tienen con ps? b. Indique 4 columnas. c. ¿Herramienta similar en Windows?</p>', solution: { explain: '<p>a. Muestran los procesos en tiempo real, ordenados por consumo; ps es una foto. htop agrega colores, barras por núcleo y permite enviar señales con teclas. b. PID, USER, %CPU, %MEM (también S, PR, NI, RES, TIME+). c. El Administrador de tareas.</p>' } },
      ],
    },
    {
      id: 'senales-y-trabajos', module: 'admproc', title: 'Señales y control de trabajos: kill, Ctrl-Z, fg, bg y jobs',
      keywords: 'señales SIGINT SIGTSTP SIGSTOP SIGCONT SIGTERM SIGKILL kill killall pkill Ctrl-C Ctrl-Z sleep & jobs fg bg primer plano segundo plano',
      tldr: '<b>Ctrl-C</b> manda SIGINT y <b>Ctrl-Z</b> manda SIGTSTP al proceso en primer plano. <code>kill</code> manda cualquier señal: <b>SIGSTOP</b> detiene, <b>SIGCONT</b> reanuda, <b>SIGTERM</b> pide terminar (se puede atrapar o ignorar) y <b>SIGKILL</b> mata sin opción. <code>&amp;</code>, <code>jobs</code>, <code>fg</code> y <code>bg</code> manejan primer y segundo plano.',
      goals: ['Detener, reanudar y terminar procesos con señales.', 'Mover trabajos entre primer y segundo plano.', 'Explicar la diferencia entre SIGTERM y SIGKILL.'],
      body: `
${table(['Señal', 'N.º', 'Cómo se envía', 'Efecto por defecto', '¿Se puede atrapar o ignorar?'], [
  ['SIGINT', '2', 'Ctrl-C', 'Terminar', 'Sí'],
  ['SIGTSTP', '20', 'Ctrl-Z', 'Detener (T)', 'Sí'],
  ['SIGSTOP', '19', '<code>kill -SIGSTOP pid</code>', 'Detener (T)', '<b>No</b>'],
  ['SIGCONT', '18', '<code>kill -SIGCONT pid</code>, <code>fg</code>, <code>bg</code>', 'Reanudar', 'Sí (pero reanuda igual)'],
  ['SIGTERM', '15', '<code>kill pid</code> (la de por defecto)', 'Terminar: es un <b>pedido</b>', 'Sí: obedecer es opcional'],
  ['SIGKILL', '9', '<code>kill -9 pid</code>', 'Terminar', '<b>No</b>: siempre mata'],
])}
${note('El TP dice que Ctrl-Z envía SIGSTOP. En realidad envía <b>SIGTSTP</b> (“stop de terminal”), que tiene el mismo efecto por defecto (detener) pero que un programa puede atrapar; SIGSTOP no se puede atrapar. En la terminal simulada se ve SIGTSTP.', 'warn')}
<h2>Un SIGTERM a un proceso detenido</h2>
<p>Si el proceso está detenido (T), la señal SIGTERM queda <b>pendiente</b>: no puede reaccionar porque no ejecuta. Para saber si la obedece hay que reanudarlo con SIGCONT: recién ahí la recibe y (si no la atrapa) termina. SIGKILL, en cambio, lo mata aunque esté detenido. Es el experimento del ejercicio 9.</p>
<h2>Primer y segundo plano</h2>
${code(`sleep 6000          # en primer plano: la terminal queda ocupada
^Z                  # Ctrl-Z: [1]+ Detenido   sleep 6000
bg                  # lo reanuda en segundo plano (SIGCONT)
sleep 6001 &        # lanzado directo en segundo plano: [2] 2142
jobs -l             # lista los trabajos con su PID; + es el actual, - el anterior
fg %1               # trae el trabajo 1 al primer plano
killall sleep       # SIGTERM a todos los procesos llamados sleep (o: pkill sleep, kill %1 %2)`, 'sh')}
<p>Un proceso en segundo plano no recibe Ctrl-C ni Ctrl-Z (van al de primer plano): para él se usa <code>kill</code>.</p>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'shell', title: 'Terminal simulada: señales y trabajos (TP 5, ejercicios 9 y 10)', tasks: [
        { t: 'Ejecutá <code>sleep 6000</code> en primer plano y detenelo con Ctrl-Z', check: (sh) => sh.procs().some((p) => p.state === 'T') || histHas(sh, /^kill\s+-(SIG)?CONT/i) },
        { t: 'Reanudalo en segundo plano con <code>kill -SIGCONT</code> y el PID (o con <code>bg</code>)', check: (sh) => histHas(sh, /^(kill\s+-(SIG)?CONT|kill\s+-18|bg)/i) },
        { t: 'Mandale SIGSTOP y después SIGTERM: fijate que no termina', check: (sh) => histHas(sh, /^kill\s+-(SIG)?STOP|^kill\s+-19/i) && histHas(sh, /^kill\s+(-(SIG)?TERM\s+|-15\s+)?%?\d+\s*$/i) },
        { t: 'Lanzá tres <code>sleep</code> con <code>&amp;</code> y miralos con <code>jobs -l</code>', check: (sh) => sh.hist.filter((l) => /^sleep\s+\d+\s*&/.test(l)).length >= 3 && histHas(sh, /^jobs\s+-l/) },
        { t: 'Matá uno con SIGKILL', check: (sh) => histHas(sh, /^kill\s+-(SIG)?KILL|^kill\s+-9/i) },
        { t: 'Terminá todos los sleep de una vez (sin matar otra cosa)', check: (sh) => (histHas(sh, /^(killall|pkill)\s+(-\S+\s+)?sleep/) || histHas(sh, /^kill\s+(-\S+\s+)?(%\d+\s*){2,}/)) && !sh.procs().some((p) => p.cmd.startsWith('sleep')) },
      ] }],
      quiz: [
        { q: '¿Qué diferencia hay entre SIGTERM y SIGKILL?', o: ['SIGTERM se puede atrapar o ignorar; SIGKILL no', 'SIGKILL se puede atrapar o ignorar; SIGTERM no', 'SIGTERM detiene el proceso y SIGKILL lo termina', 'Son iguales, pero SIGKILL solo puede mandarla root'], a: 0, e: 'SIGKILL (9) no se puede atrapar ni ignorar. SIGTERM (15) es la señal por defecto de kill y depende del proceso obedecerla.' },
        { q: 'Se envía SIGTERM a un proceso detenido (estado T). ¿Qué pasa?', o: ['Queda pendiente: termina al reanudarlo con SIGCONT', 'El proceso termina en el acto, aunque esté detenido', 'La señal se pierde y el proceso queda detenido para siempre', 'El proceso pasa a estado zombi hasta que el padre haga wait'], a: 0, e: 'Un proceso detenido no ejecuta, así que no puede manejar la señal hasta continuar. SIGKILL sí lo mataría al instante.' },
        { q: 'Un sleep corre en segundo plano y presionás Ctrl-C. ¿Qué pasa con el sleep?', o: ['Nada: Ctrl-C se envía al proceso en primer plano, que es el shell', 'Termina, porque Ctrl-C se envía a todos los procesos de la terminal', 'Se detiene y pasa al estado T', 'Pasa al primer plano'], a: 0, e: 'Las teclas de control van al grupo en primer plano. Para un trabajo en segundo plano se usa kill.' },
        { q: '¿Qué hace el comando bg sin parámetros?', o: ['Reanuda en segundo plano el trabajo actual (el marcado con + en jobs)', 'Lleva al segundo plano el proceso que está en primer plano y ejecutando', 'Detiene el trabajo actual', 'Lista los trabajos en segundo plano'], a: 0, e: 'bg manda SIGCONT al trabajo detenido actual y lo deja en segundo plano. Para pasar al primer plano está fg.' },
        { q: '¿Qué señal envía realmente Ctrl-Z?', o: ['SIGTSTP', 'SIGSTOP', 'SIGINT', 'SIGTERM'], a: 0, e: 'SIGTSTP (detención desde la terminal). Tiene el mismo efecto que SIGSTOP pero puede atraparse; el TP lo llama SIGSTOP.' },
        { q: '¿Cómo se terminan todos los procesos sleep a la vez, sin tocar otros?', o: ['killall sleep', 'kill -9 -1', 'kill %0', 'Ctrl-C en cada terminal'], a: 0, e: 'killall (o pkill) busca por nombre. kill -9 -1 mataría todos los procesos del usuario.' },
      ],
      exercises: [
        { official: '5.6', level: 1, title: 'Señales', prompt: '<p>¿Qué son las señales en UNIX/Linux? ¿Qué señales recibió en TPs pasados?</p>', solution: { explain: '<p>Mecanismo para informar a un proceso la ocurrencia de un evento (IPC por paso de mensajes); el kernel las entrega y se ejecuta un manejador por defecto o uno del programador, como con las interrupciones. En TPs anteriores: SIGINT al cancelar con Ctrl-C un programa del TP 2, y SIGSEGV (violación de segmento) si un programa accedió a memoria inválida.</p>' } },
        { official: '5.9', level: 2, title: 'sleep, Ctrl-Z y kill', prompt: '<p>Ejecute <code>sleep 6000</code>, deténgalo con Ctrl-Z. a. ¿En qué estado está? b. Envíele SIGCONT. c. Envíele SIGSTOP y SIGTERM: estado en cada caso. d. Reanúdelo: ¿cumplió? e. <code>sleep 6000 &amp;</code>: estado. f. Deténgalo y envíe SIGKILL. ¿Diferencia con SIGTERM?</p>', solution: { explain: '<ol type="a"><li>T (detenido).</li><li>Pasa a S (durmiendo, en segundo plano).</li><li>Con SIGSTOP, T. Con SIGTERM estando detenido, sigue en T: la señal queda pendiente.</li><li>Al mandar SIGCONT recibe la SIGTERM pendiente y termina: sleep sí obedece SIGTERM (no la atrapa).</li><li>S (y aparece como trabajo [n] en segundo plano).</li><li>Con SIGSTOP pasa a T; con SIGKILL termina inmediatamente aunque esté detenido. SIGKILL no puede atraparse ni ignorarse y no requiere que el proceso ejecute; SIGTERM es un pedido.</li></ol>' } },
        { official: '5.10', level: 2, title: 'jobs, fg y bg', prompt: '<p>Ejecute varios sleep en segundo plano. a. Pruebe jobs y jobs -l. b. Con fg, bg y Ctrl-Z logre que todos estén detenidos y luego algunos detenidos y otros ejecutando. c. ¿Cómo termina todos los sleep a la vez y ningún otro?</p>', solution: { explain: '<p>a. <code>jobs</code> lista los trabajos con número y estado; <code>-l</code> agrega el PID. b. Para cada trabajo: <code>fg %n</code> y Ctrl-Z (queda detenido); después <code>bg %n</code> para los que tienen que seguir ejecutando. c. <code>killall sleep</code>, <code>pkill sleep</code> o <code>kill %1 %2 %3</code>.</p>' } },
      ],
    },
  );
})();
