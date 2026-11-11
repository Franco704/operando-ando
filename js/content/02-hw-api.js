/* Primer parcial: CPU, contexto, interrupciones y modos (clase 1.0); funciones, bibliotecas, interfaz, driver y API (clase 1.1). */
(() => {
  const { h, LESSONS } = window.GUIDE;
  const { note, table, def, flow, code } = h;

  LESSONS.push(
    {
      id: 'registros-y-contexto', module: 'hw', title: 'Registros y contexto de ejecución',
      keywords: 'registros control estado propósito general PC contador de programa IR EFLAGS contexto estado de la CPU instantánea',
      tldr: 'El <b>contexto</b> de una CPU es el contenido de sus registros. Con una instantánea del contexto se puede reanudar un programa exactamente donde estaba: es la base de las funciones, las interrupciones, las llamadas al sistema y los procesos.',
      goals: ['Clasificar registros en control, estado y propósito general.', 'Definir contexto de ejecución y distinguirlo del registro de estado.'],
      body: `
<h2>Para qué sirven los registros</h2>
${table(['Tipo', 'Función', 'Ejemplos'], [
  ['Control', 'Modifican el funcionamiento de la CPU', 'Modo usuario/kernel, habilitar o deshabilitar interrupciones, PC, IR'],
  ['Estado', 'Indican la situación actual de la CPU y el resultado de la ejecución', 'Excepción por división por cero, desborde de la ALU, bandera de cero (EFLAGS en x86)'],
  ['Propósito general', 'Almacenamiento temporal en cálculos y operaciones de los programas', 'EAX, EBX… en x86'],
])}
<p>El <b>PC</b> (contador de programa) tiene la dirección de memoria de la <b>siguiente</b> instrucción a ejecutar.</p>
${def('Contexto de ejecución de una CPU', 'Es el contenido de sus registros. Una instantánea del contexto permite volver a ejecutar el programa actual en el momento de la captura.', 'Diapositivas, Unidad 1')}
${note('A veces al contexto se lo llama “estado” de la CPU (“guardar el estado”). No confundir con el <b>registro de estado</b> (EFLAGS), que es solo uno de los registros.', 'warn')}
<h2>Por qué importa</h2>
<p>Cada vez que la CPU deja lo que estaba haciendo para hacer otra cosa y después volver (una función, una interrupción, una llamada al sistema, un cambio de proceso), hay que <b>guardar el contexto</b> y después restaurarlo. Guardar y restaurar es overhead. Para pensar: si un programa no usa los registros de propósito general, ¿igual hay que guardarlos? (el que interrumpe no sabe qué registros usa el programa, así que guarda lo que vaya a modificar).</p>
<p>Los programas usan registros en lugar de operar siempre en RAM porque los registros se acceden en un ciclo de reloj y la memoria principal puede tardar muchos.</p>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'classify', title: '¿Qué tipo de registro es?', buckets: ['Control', 'Estado', 'Propósito general'], items: [
        { t: 'Bit que indica modo kernel o modo usuario', b: 0 }, { t: 'Bandera que indica que hubo desborde en la ALU', b: 1 }, { t: 'Registro donde un programa guarda un resultado parcial de una suma', b: 2 },
        { t: 'Bit que habilita o deshabilita las interrupciones', b: 0 }, { t: 'Contador de programa (PC)', b: 0, why: 'Determina qué se ejecuta después: controla el flujo.' }, { t: 'Indicador de excepción por división por cero', b: 1 },
        { t: 'Registro de instrucción (IR)', b: 0 }, { t: 'Bandera de resultado cero', b: 1 },
      ] }],
      quiz: [
        { q: '¿Qué es el contexto de ejecución de una CPU?', o: ['El contenido de sus registros', 'El contenido de la memoria principal del proceso', 'El registro de estado (EFLAGS)', 'La lista de procesos listos'], a: 0, e: 'Contexto = contenido de los registros. El registro de estado es solo uno de ellos; la memoria del proceso no es contexto de la CPU.' },
        { q: '¿Qué contiene el PC?', o: ['La dirección de la próxima instrucción', 'La instrucción que se está ejecutando en este ciclo', 'El identificador del proceso que está en ejecución', 'La dirección donde empieza el vector de interrupciones'], a: 0, e: 'El PC apunta a la próxima instrucción. La instrucción en curso está en el IR.' },
        { q: '¿Por qué los programas operan con registros en vez de hacerlo siempre en RAM?', o: ['Porque los registros son mucho más rápidos que la RAM', 'Porque la RAM es de solo lectura para los programas en modo usuario', 'Porque los registros son no volátiles y no se pierden al apagar', 'Porque el SO no permite escribir en RAM sin hacer una llamada al sistema'], a: 0, e: 'Es una cuestión de velocidad. La RAM se escribe sin pedirle nada al SO (dentro del espacio del proceso).' },
        { q: 'Guardar una instantánea del contexto permite:', o: ['Reanudar el programa en el punto donde se capturó', 'Volver a ejecutar el programa desde el principio con los mismos datos', 'Deshacer las escrituras que el programa hizo en el disco desde entonces', 'Ejecutar el mismo programa en dos CPU a la vez sin conflictos'], a: 0, e: 'Con los registros (incluido el PC) restaurados, la CPU sigue como si nada hubiera pasado. No deshace efectos sobre memoria o disco.' },
        { q: 'La bandera que indica un desborde en la ALU pertenece a los registros de:', o: ['Estado', 'Control', 'Propósito general', 'Contexto'], a: 0, e: 'Los de estado indican la situación y el resultado de la ejecución. “Contexto” no es un tipo de registro: es el conjunto de todos.' },
      ],
    },
    {
      id: 'interrupciones', module: 'hw', title: 'Interrupciones, vector de interrupciones e ISR',
      keywords: 'interrupción externa interna excepción síncrona asíncrona vector de interrupciones IVT ISR rutina de servicio trap overhead impulsado por interrupciones',
      tldr: 'Una interrupción es una señal que recibe la CPU indicando un evento de interés. El <b>vector de interrupciones</b> (IVT) relaciona cada número de interrupción con su rutina de servicio (<b>ISR</b>). La CPU hace una parte automáticamente, pero el IVT y las ISR <b>los define el SO</b>: el SO es software “impulsado por interrupciones”.',
      goals: ['Distinguir interrupciones externas (asíncronas) de internas (excepciones, síncronas).', 'Explicar el vector de interrupciones y la ISR.', 'Ordenar los pasos del manejo de una interrupción.'],
      body: `
<h2>Qué es una interrupción</h2>
${def('Interrupción', 'Señal que recibe la CPU e indica la ocurrencia de un evento de interés.', 'Diapositivas, Unidad 1 (ver Silberschatz 1.2.1 y 13.2.2)')}
${table(['', 'Externas', 'Internas'], [
  ['También llamadas', '“Interrupciones” a secas, <b>asíncronas</b>', '<b>Excepciones</b>, <b>síncronas</b> (traps)'],
  ['Las genera', 'Dispositivos fuera de la CPU', 'La propia CPU, como consecuencia de ejecutar instrucciones'],
  ['Ejemplos', 'Reloj (temporizador), teclado, disco que terminó una lectura', 'División por cero, desbordamiento, instrucción inválida, <code>int</code>, <code>syscall</code>'],
])}
${note('Las llamadas al sistema usan <b>excepciones</b> (<code>int 0x80</code>, <code>syscall</code>): son interrupciones internas, provocadas a propósito por el programa.', 'exam')}

<h2>Vector de interrupciones e ISR</h2>
<p>Qué hacer depende de quién interrumpe: no es lo mismo el teclado que el reloj. Cada origen se identifica con un <b>número</b> (int 0, int 1, …) y tiene asociada una <b>rutina de servicio de interrupción (ISR)</b>, una “función” que debe ejecutarse.</p>
${def('Vector de interrupciones (IVT)', 'Tabla que correlaciona (“mapea”) el número de la interrupción con la ubicación de su ISR.', 'Diapositivas, Unidad 1; Silberschatz 8.3, 2.º párrafo')}
<p>Son como los <b>timbres de un edificio</b>: según el timbre que se toca, es quién atiende. El tratamiento tiene una parte <b>automática</b> que hace la CPU, pero el IVT y las ISR <b>los define el SO</b>. Por eso el SO se apropia de la computadora: es quien responde a cada evento. El vector suele estar en memoria baja, junto al SO residente.</p>

<h2>Manejo de una interrupción (aproximado)</h2>
<div class="lab-mount" data-lab="0"></div>
<p>El manejo depende de la arquitectura; la cátedra describe el funcionamiento aproximado, no una arquitectura en particular.</p>

<h2>Consecuencias</h2>
<ul>
  <li>Causan <b>demoras imprevistas y overhead</b>: el tiempo de ejecución de un programa se vuelve menos previsible.</li>
  <li>El manejo se parece mucho a una <b>llamada a función</b>: se guarda contexto, se salta a otra rutina y se vuelve. Diferencias: la interrupción no la “pide” el programa interrumpido (salvo las excepciones), cambia de modo y la rutina se busca en el IVT.</li>
  <li>Ayudan a entender las <b>señales</b> de UNIX y la programación orientada a eventos o asíncrona.</li>
</ul>
<div class="lab-mount" data-lab="1"></div>`,
      labs: [
        { type: 'order', title: 'Ordená el manejo de una interrupción', items: ['Llega la interrupción mientras la CPU ejecuta un programa', 'La CPU termina la instrucción en curso (por ejemplo, la n.º 1234)', 'Se cambia a modo kernel y se guarda el contexto', 'Con el número de interrupción se busca en el IVT el puntero a la ISR y se salta', 'La ISR atiende la interrupción (o la deriva a quien corresponda)', 'La ISR termina, se restaura el contexto y se vuelve al modo anterior', 'El PC queda en 1235 y el programa continúa'], explain: '<p>Antes de saltar a la ISR hay que pasar a <b>modo kernel</b> (la ISR es parte del SO) y guardar el contexto, para poder volver sin que el programa note nada (salvo la demora).</p>' },
        { type: 'classify', title: '¿Interrupción externa o excepción?', buckets: ['Externa (asíncrona)', 'Interna / excepción (síncrona)'], items: [
          { t: 'Se vence el cuanto de tiempo y suena el temporizador', b: 0 }, { t: 'Un programa divide por cero', b: 1 }, { t: 'Se presiona una tecla', b: 0 },
          { t: 'Un programa ejecuta la instrucción syscall', b: 1, why: 'Las llamadas al sistema se hacen con excepciones.' }, { t: 'El disco avisa que terminó de leer un bloque', b: 0 },
          { t: 'Se intenta ejecutar una instrucción inválida', b: 1 }, { t: 'Llega un paquete por la placa de red', b: 0 }, { t: 'Un acceso a memoria fuera del espacio del proceso', b: 1 },
        ] },
      ],
      quiz: [
        { q: '¿Qué es el vector de interrupciones?', o: ['Una tabla: número de interrupción → dirección de su ISR', 'Un registro de la CPU que indica qué interrupción está pendiente de atender', 'La cola de interrupciones que esperan ser atendidas por orden de llegada', 'La rutina única del SO que atiende todas las interrupciones del sistema'], a: 0, e: 'IVT: número de interrupción → dirección de la ISR. La ISR es la rutina; el IVT es la tabla de punteros.' },
        { q: '¿Quién define el vector de interrupciones y las rutinas de servicio?', o: ['El sistema operativo', 'El fabricante de la CPU, en el microcódigo', 'El firmware, y el SO no puede cambiarlo', 'Cada programa de usuario, para sus propias interrupciones'], a: 0, e: 'La CPU hace una parte automáticamente (guardar el PC, saltar), pero la tabla y las rutinas son del SO. Así el SO se adueña del hardware.' },
        { q: 'Una llamada al sistema hecha con la instrucción syscall es:', o: ['Una interrupción interna (excepción), síncrona', 'Una interrupción externa, asíncrona', 'Una llamada a función común, sin cambio de modo', 'Una señal de UNIX'], a: 0, e: 'Es generada por la ejecución de una instrucción del programa: excepción, síncrona.' },
        { q: 'Al llegar una interrupción, la CPU:', o: ['Termina la instrucción en curso antes de atenderla', 'Aborta la instrucción en curso y la repite al volver', 'Espera a que el programa haga una llamada al sistema', 'Espera a que termine el cuanto de tiempo'], a: 0, e: 'Termina la instrucción en curso (1234), atiende la interrupción y vuelve a la siguiente (1235).' },
        { q: '¿Por qué hace falta cambiar a modo kernel para ejecutar la ISR?', o: ['Porque la ISR es código del SO y necesita privilegios', 'Porque en modo usuario la CPU no puede guardar el contador de programa', 'Porque el modo kernel ejecuta las instrucciones más rápido que el modo usuario', 'Porque al pasar a modo kernel se deshabilitan todas las demás interrupciones'], a: 0, e: 'La ISR es código del kernel que maneja hardware: necesita el modo de mayor privilegio.' },
        { q: '¿En qué se parecen el manejo de una interrupción y una llamada a función?', o: ['En ambos se guarda contexto, se salta y se vuelve', 'En ambos la CPU cambia a modo kernel antes de saltar a la rutina', 'En ambos la dirección de destino se busca en el vector de interrupciones', 'En ambos lo pide explícitamente el programa que estaba ejecutando'], a: 0, e: 'Las dos guardan contexto, saltan y vuelven. Pero la función no cambia de modo ni usa el IVT, y la interrupción externa no la pide el programa.' },
        { q: '¿Qué significa que el SO sea un software “impulsado por interrupciones”?', o: ['Que el kernel entra en acción por interrupciones y excepciones', 'Que interrumpe a los programas cada vez que necesita la CPU para sus tareas', 'Que solo funciona en computadoras que tienen controlador de interrupciones', 'Que ejecuta permanentemente un bucle de sondeo esperando interrupciones'], a: 0, e: 'El kernel entra en acción por interrupciones (reloj, dispositivos) y por excepciones (llamadas al sistema, errores). No hay un “bucle principal” del SO.' },
      ],
      open: [
        { t: 'text', q: '¿Qué es el vector de interrupciones y qué relación tiene con el SO?', k: [['tabla'], ['número', 'numero'], ['isr', 'rutina de servicio', 'rutina'], ['define el so', 'el so define', 'sistema operativo define', 'lo define el sistema operativo', 'definido por el so', 'apropiarse', 'apropia']], need: 3, e: 'Es una tabla que relaciona el número de cada interrupción con la dirección de su rutina de servicio (ISR). El SO define el vector y las ISR: así es quien responde a cada evento del hardware y se apropia de la computadora.' },
        { t: 'text', q: 'Diferenciá interrupciones externas e internas, con un ejemplo de cada una.', k: [['dispositivo', 'fuera de la cpu', 'externos'], ['asíncrona', 'asincrona'], ['excepción', 'excepcion'], ['síncrona', 'sincrona'], ['reloj', 'teclado', 'disco', 'temporizador'], ['división por cero', 'division por cero', 'syscall', 'instrucción inválida', 'desbordamiento']], need: 4, e: 'Las externas (asíncronas) las generan dispositivos fuera de la CPU, como el reloj o el teclado. Las internas o excepciones (síncronas) las genera la CPU al ejecutar instrucciones, como una división por cero o la instrucción syscall.' },
      ],
      sources: [{ title: 'Silberschatz 7.ª ed.', ref: '1.2.1, 1.5, 8.3 (2.º párrafo), 13.2.2', points: ['13.2.2 (interrupciones) se cita para entender el vector, aunque en el capítulo 13 la cátedra excluye 13.2.1 a 13.2.3 como tema propio.', 'thejat.in/learn/interrupts-idt-isr-and-irq: recomendado por la cátedra para leer y entender el tema.'] }],
    },
    {
      id: 'modos-de-operacion', module: 'hw', title: 'Modos de operación: kernel y usuario',
      keywords: 'modo kernel modo usuario bit de modo CPL anillos ring 0 ring 3 privilegio instrucciones privilegiadas modo dual protección',
      tldr: 'Los modos de operación controlan el acceso de la CPU a instrucciones, registros y zonas de memoria. En x86 el <b>CPL</b> es 0 (kernel) o 3 (usuario). La cátedra usa el <b>bit de modo</b>: <b>0 = kernel</b> (solo el kernel), <b>1 = usuario</b> (todo lo demás, incluidos los programas del sistema). No tiene nada que ver con el usuario administrador.',
      goals: ['Explicar qué controla el modo de operación.', 'Usar la convención del bit de modo.', 'Distinguir modo kernel de privilegios de administrador.'],
      body: `
<h2>Para qué existen</h2>
<p>Los SO modernos usan los modos de la CPU para <b>apropiarse y administrar el hardware</b>. Dependen de la arquitectura y controlan el acceso de la CPU a:</p>
<ul><li><b>Instrucciones</b> (las privilegiadas, como deshabilitar interrupciones o hacer E/S, solo en modo kernel).</li><li><b>Registros</b> (por ejemplo, los de control).</li><li><b>Zonas de memoria</b> (la del kernel y la de otros procesos).</li></ul>
${note('<b>Esto no tiene relación con los privilegios de usuario administrador.</b> root o un administrador de Windows ejecutan sus programas en modo usuario, igual que cualquiera. Modo kernel es solo para el kernel.', 'exam')}
<h2>x86 y la convención de la cátedra</h2>
${table(['', 'x86', 'Bit de modo (cátedra, Silberschatz 1.5.1)'], [
  ['Kernel', 'CPL = 0 (anillo 0)', '<b>0</b>: el kernel'],
  ['Usuario', 'CPL = 3 (anillo 3)', '<b>1</b>: el resto de los programas, del sistema o de usuario'],
  ['Dónde está', 'En el registro CS', 'Un bit de un registro de control'],
])}
<p>Las interrupciones se atienden en modo kernel: si hace falta, la CPU cambia de modo <b>automáticamente</b>. Desde modo usuario la única forma de “entrar” al kernel es una interrupción o una excepción (por ejemplo, una llamada al sistema); al volver, una instrucción como IRET o SYSRET restaura el modo usuario.</p>
${note('Si un programa de usuario pudiera cambiar el bit de modo, podría hacer cualquier cosa con el hardware. Por eso cambiar a modo kernel solo ocurre al entrar a código del SO a través del vector de interrupciones.', 'tip')}`,
      labs: [{ type: 'classify', title: '¿Se puede hacer en modo usuario?', buckets: ['Solo en modo kernel', 'También en modo usuario'], items: [
        { t: 'Deshabilitar las interrupciones', b: 0 }, { t: 'Sumar dos registros de propósito general', b: 1 }, { t: 'Escribir directamente en los puertos de la controladora del disco', b: 0 },
        { t: 'Cambiar la tabla del vector de interrupciones', b: 0 }, { t: 'Llamar a una función de una biblioteca dinámica', b: 1 }, { t: 'Ejecutar la instrucción syscall', b: 1, why: 'Es justamente cómo un programa de usuario pide entrar al kernel.' },
        { t: 'Leer la memoria de otro proceso', b: 0 }, { t: 'Que root cambie los permisos de un archivo con chmod', b: 1, why: 'chmod corre en modo usuario y hace una llamada al sistema; el kernel decide si root puede.' },
      ] }],
      quiz: [
        { q: 'Según la convención de la cátedra, el bit de modo vale 0 cuando:', o: ['Ejecuta el kernel', 'Ejecuta un programa de usuario', 'Ejecuta un programa del sistema como bash', 'Ejecuta un proceso de root'], a: 0, e: '0 = modo kernel, solo para el kernel. 1 = modo usuario, para todo lo demás (programas del sistema y de usuario).' },
        { q: 'Un programa ejecutado por el administrador (root) ejecuta en:', o: ['Modo usuario, como cualquier otro programa', 'Modo kernel, porque root tiene todos los privilegios', 'Modo kernel solo mientras usa sudo', 'Un modo intermedio (anillo 1 o 2)'], a: 0, e: 'Los modos de la CPU no tienen relación con los privilegios de usuario del SO. Solo el kernel ejecuta en modo kernel.' },
        { q: '¿Qué controlan los modos de operación de la CPU?', o: ['El acceso a instrucciones, registros y memoria', 'La velocidad del reloj de la CPU según la carga del sistema', 'Qué usuarios pueden iniciar sesión y con qué privilegios', 'La prioridad de cada proceso en la cola de listos del planificador'], a: 0, e: 'Los modos restringen instrucciones privilegiadas, registros de control y memoria.' },
        { q: 'En x86, ¿dónde se encuentra el nivel de privilegio actual (CPL)?', o: ['En el registro CS', 'En el registro EFLAGS', 'En el PCB del proceso', 'En la NVRAM'], a: 0, e: 'Así lo indican las diapositivas: CPL en el registro CS, 0 para kernel y 3 para usuario.' },
        { q: 'Si una interrupción llega mientras ejecuta un programa de usuario:', o: ['La CPU cambia automáticamente a modo kernel para ejecutar la ISR', 'La ISR se ejecuta en modo usuario porque la interrupción ocurrió en ese modo', 'La interrupción espera a que el programa haga una llamada al sistema', 'El programa debe cambiar el bit de modo antes de atenderla'], a: 0, e: 'Las interrupciones se atienden en modo kernel y el cambio es automático.' },
      ],
    },
  );

  LESSONS.push(
    {
      id: 'funciones-y-bibliotecas', module: 'api', title: 'Funciones, pila, bibliotecas e interfaz',
      keywords: 'función pila LIFO llamada retorno overhead biblioteca librería estática dinámica interfaz especificación compartir recompilar',
      tldr: 'Las funciones ordenan y reutilizan código, pero cada llamada usa la <b>pila</b> (contexto, parámetros, variables locales, dirección de retorno) y agrega overhead. Una <b>biblioteca</b> es un conjunto de funciones implementadas para incluir en otro código (estática o dinámicamente); una <b>interfaz</b> es solo la especificación del comportamiento.',
      goals: ['Explicar qué guarda la pila en cada llamada y por qué hay overhead.', 'Comparar bibliotecas estáticas y dinámicas.', 'Distinguir interfaz de implementación.'],
      body: `
<h2>Por qué vemos esto</h2>
<p>Vamos camino a las <b>llamadas al sistema</b>, que son la API del SO. Para entender una API hay que ver qué es una función, una biblioteca y una interfaz (y de paso, un driver). Así se ven los compromisos (<i>tradeoffs</i>) de usar funciones y los criterios de diseño de un SO, que se comparten con otros sistemas: Mercado Pago, Google Maps, un driver, un auto, una puerta.</p>
<h2>Funciones y pila</h2>
<ul>
  <li><b>Función</b>: lista de instrucciones organizada para ser reutilizable. Sirve para ordenar, desduplicar, reutilizar, compartir código y facilitar el mantenimiento. Se pueden anidar y ser recursivas.</li>
  <li>Cada programa tiene una <b>pila</b> en memoria (LIFO: lo último en entrar es lo primero en salir).</li>
  <li>En cada llamada se usa la pila para guardar <b>contexto, parámetros, variables locales y dirección de retorno</b>.</li>
  <li>Causan <b>overhead</b> (apilar, saltar, desapilar, retornar): conviene usarlas cuando el beneficio en orden y reutilización supera el costo; en bucles muy ajustados a veces el compilador las “expande” (inline).</li>
</ul>
${note('La recursión sin fin llena la pila: es lo que provoca el “Segmentation fault” del TP 5, ejercicio 11 (lección de memoria del proceso, 3.er parcial).', 'tip')}
<h2>Biblioteca e interfaz</h2>
${table(['', 'Estática', 'Dinámica'], [
  ['Cuándo se incluye', 'Al compilar/enlazar: se copia dentro del ejecutable', 'Al cargar o ejecutar: queda en un archivo aparte (.so, .dll)'],
  ['Almacenamiento', 'Cada programa tiene su copia', 'Se comparte entre programas: ahorra almacenamiento (y memoria)'],
  ['Cambios en la biblioteca', 'Hay que recompilar el programa', 'Basta reemplazar la biblioteca si se mantiene la interfaz'],
])}
${def('Interfaz', 'Punto de contacto entre sistemas para intercambiar información o servicios. En software, es una especificación del comportamiento que un sistema implementa, pero no realiza función.', 'Diapositivas 1.1. Ejemplos de hardware: picaporte, tecla, pantalla, volante, enchufe de 220 V.')}
<p>Un archivo de encabezado (<code>stdio.h</code>) es una interfaz: declara funciones (nombre, parámetros, tipo de retorno) sin implementarlas. La implementación está en la biblioteca.</p>
${note('<b>Biblioteca = implementación</b> (código que hace). <b>Interfaz = especificación</b> (qué se puede pedir y cómo). Un mismo sistema puede tener varias interfaces.', 'exam')}`,
      labs: [{ type: 'classify', title: '¿Biblioteca estática o dinámica?', buckets: ['Estática', 'Dinámica'], items: [
        { t: 'Su código queda copiado dentro del ejecutable', b: 0 }, { t: 'Se puede actualizar sin recompilar los programas que la usan', b: 1 }, { t: 'Varios procesos comparten una sola copia', b: 1 },
        { t: 'El ejecutable funciona aunque la biblioteca no esté instalada en el sistema', b: 0 }, { t: 'En Windows se llama DLL', b: 1 }, { t: 'Un cambio en la biblioteca obliga a recompilar', b: 0 },
      ] }],
      quiz: [
        { q: '¿Qué se guarda en la pila en cada llamada a una función?', o: ['Contexto, parámetros, locales y dirección de retorno', 'Solo el valor de retorno y los parámetros de la función', 'El código de la función, que se copia en cada llamada', 'Las variables globales del programa que la función modifica'], a: 0, e: 'La pila guarda lo necesario para ejecutar la función y volver: contexto, parámetros, locales y dirección de retorno.' },
        { q: 'Una ventaja de las bibliotecas dinámicas sobre las estáticas es que:', o: ['Pueden actualizarse sin recompilar los programas', 'El programa arranca más rápido porque no hay que buscarlas al cargar', 'El programa funciona aunque la biblioteca no esté instalada en el sistema', 'Las llamadas a sus funciones no agregan overhead'], a: 0, e: 'Al estar en un archivo aparte, se comparten y se reemplazan sin recompilar. A cambio, hay que encontrarlas al cargar o ejecutar.' },
        { q: 'Según la cátedra, una interfaz de software:', o: ['Especifica un comportamiento, pero no realiza función', 'Es el código que implementa las funciones que expone un sistema', 'Es siempre gráfica, con ventanas, botones y menús', 'Es un sinónimo de biblioteca dinámica compartida entre procesos'], a: 0, e: 'La interfaz es la especificación; lo que hace el trabajo es la implementación.' },
        { q: '¿Qué hay en un archivo de encabezado como stdio.h?', o: ['Declaraciones de funciones, sin su implementación', 'La implementación compilada de printf y de las demás funciones de E/S', 'El código del kernel que atiende la llamada al sistema write', 'Las variables globales que comparten todos los programas en C'], a: 0, e: 'Declara qué funciones existen y cómo se llaman. La implementación está en la biblioteca de C.' },
        { q: '¿Por qué el retorno de una función se considera overhead?', o: ['Porque es necesario pero no aporta al cálculo de la función', 'Porque cada retorno implica un cambio a modo kernel y de vuelta', 'Porque borra toda la pila del programa al volver', 'Porque la CPU queda ociosa mientras se ejecuta el retorno'], a: 0, e: 'Desapilar y saltar de vuelta es necesario pero no es el trabajo útil: overhead.' },
      ],
    },
    {
      id: 'driver-y-api', module: 'api', title: 'Driver y API',
      keywords: 'driver controlador de dispositivo API interfaz de programación biblioteca cliente encabezado implementación capa de abstracción hardware compatibilidad',
      tldr: 'Un <b>driver</b> (controlador de dispositivo) es software que permite al SO “hablar el idioma” de cierto hardware o software. Una <b>API</b> es la especificación para invocar las funciones que un sistema expone: el programador usa servicios que no implementó, y la implementación puede cambiar sin recompilar el programa.',
      goals: ['Definir driver y explicar por qué es un riesgo de seguridad.', 'Definir API y relacionarla con interfaz, biblioteca cliente y driver.', 'Dar ejemplos de dónde ejecutan las funciones de una API.'],
      body: `
<h2>Driver</h2>
${def('Driver (controlador de dispositivo)', 'Módulo de software o funciones que permiten la interacción entre el SO (u otros programas) y otro sistema (software o hardware).', 'Diapositivas 1.1. En Silberschatz: 1.2.3, 9.7.3, 11.1, 12.4.6, 13.5, fig. 13.13')}
<ul>
  <li>Permite al SO “hablar el idioma” de cierto hardware o software: resuelve el problema de la <b>variedad de hardware</b>.</li>
  <li>Lo suele desarrollar el <b>fabricante</b> del hardware.</li>
  <li>Ejecuta en <b>modo kernel</b>: es un <b>riesgo de seguridad</b> (código de terceros con el máximo privilegio). Podría ejecutar en modo usuario si fuera para un sistema de software.</li>
</ul>
${note('En el libro hay ambigüedad: a veces “controlador” es el driver (software) y otras la placa controladora (hardware). En la materia, driver es el software.', 'warn')}
<h2>API</h2>
${def('API (Application Programmer’s Interface)', 'Especificación de software para invocar las funciones que un sistema implementa y expone en su interfaz. Es software para ser usado por otro software.', 'Diapositivas 1.1')}
<ul>
  <li>Provee <b>declaraciones</b>; la implementación está “detrás” de la interfaz. Como un <b>menú</b> de comida.</li>
  <li>Permite usar funciones no implementadas en el propio código (servicios de otro sistema).</li>
  <li>Se puede cambiar la implementación y el programa que la usa <b>no necesita recompilar</b>.</li>
  <li>Las <b>bibliotecas cliente</b> tienen funciones intermedias que facilitan el acceso a la API desde cierto lenguaje (C, Java, Python…).</li>
  <li>Los <b>drivers implementan una API</b> (como código) y pueden o no implementar las funciones.</li>
</ul>
<p>¿Dónde ejecutan las funciones de una API? Pueden estar incluidas en el programa (estática o dinámicamente), en otro programa de la misma PC, en otro dispositivo dentro de la PC (E/S, GPU, TPU) o en otra máquina (APIs web como Mercado Pago o Google Maps Roads).</p>
<h2>Capas de abstracción</h2>
<p>Si cada placa de video tiene su driver y su API, ¿cómo hace el SO para entenderse con todas, pasadas y futuras? Define <b>él</b> una interfaz que todos los drivers de video deben implementar. Es una capa de abstracción de hardware: ventaja, compatibilidad y portabilidad; desventaja, overhead y quedar limitado a lo que la interfaz común permite.</p>
<p>En las llamadas al sistema vamos a ver que los SO publican su API como archivos de encabezado para incluir en los programas.</p>`,
      labs: [{ type: 'classify', title: '¿Interfaz/API, implementación o driver?', buckets: ['Interfaz / API', 'Implementación', 'Driver'], items: [
        { t: 'La declaración de write() en unistd.h', b: 0 }, { t: 'El código del kernel que atiende la llamada write', b: 1 }, { t: 'El módulo que traduce pedidos del SO a comandos de una impresora específica', b: 2 },
        { t: 'La documentación de los endpoints de la API de Mercado Pago', b: 0 }, { t: 'El menú del restaurante', b: 0, why: 'Dice qué se puede pedir, no cómo se cocina.' }, { t: 'La cocina del restaurante', b: 1 },
        { t: 'El software de NVIDIA que maneja una GeForce desde Linux', b: 2 },
      ] }],
      quiz: [
        { q: '¿Por qué un driver es un riesgo de seguridad?', o: ['Porque es código, usualmente de terceros, que ejecuta en modo kernel', 'Porque se descarga de internet sin verificar', 'Porque ejecuta en modo usuario y cualquiera puede modificarlo', 'Porque expone la API del SO a otros programas'], a: 0, e: 'Un error o código malicioso en un driver tiene el máximo privilegio: puede afectar a todo el sistema.' },
        { q: 'Una ventaja central de programar contra una API es que:', o: ['Se puede cambiar la implementación sin recompilar', 'El código del programa queda más rápido porque evita el overhead de las funciones', 'No hace falta conocer los parámetros ni el tipo de retorno de las funciones', 'Las funciones siempre ejecutan en la misma máquina que el programa'], a: 0, e: 'El programa depende de la interfaz, no de la implementación. Mientras la interfaz no cambie, sigue funcionando.' },
        { q: '¿Qué relación hay entre driver y API?', o: ['El driver implementa la API que el SO espera para ese dispositivo', 'Son sinónimos: los dos son la documentación de un dispositivo', 'La API implementa el driver y el SO lo carga en memoria', 'El driver es la documentación de la API que publica el fabricante'], a: 0, e: 'El driver es código que implementa la interfaz requerida para que el SO use cierto hardware.' },
        { q: '¿Puede un sistema tener más de una API?', o: ['Sí: puede exponer varias interfaces', 'No: cada sistema tiene exactamente una API, que define su interfaz', 'Solo si es un sistema web con varios endpoints', 'Solo si tiene varios drivers, uno por cada API'], a: 0, e: 'Por ejemplo, Windows expone Win32 y otras; un servicio web puede tener REST y una biblioteca cliente por lenguaje.' },
        { q: 'Las funciones de una API:', o: ['Pueden ejecutar en distintos lugares, incluso en otra máquina', 'Siempre ejecutan dentro del kernel, en modo privilegiado', 'Siempre ejecutan en el mismo proceso que las llama, como una función', 'Siempre ejecutan en un servidor web al que se accede por la red'], a: 0, e: 'La API es solo la especificación; dónde corre la implementación varía.' },
      ],
      open: [{ t: 'text', q: '¿Qué es un driver y qué problema resuelve en un SO?', k: [['software', 'módulo', 'modulo', 'funciones'], ['interacción', 'interaccion', 'hablar', 'comunicar', 'idioma'], ['variedad', 'distintos dispositivos', 'diversidad'], ['modo kernel', 'riesgo', 'fabricante']], need: 3, e: 'Es un módulo de software (funciones) que permite la interacción entre el SO y otro sistema, típicamente un dispositivo de hardware: el SO “habla su idioma” a través de él. Resuelve la variedad de hardware. Suele hacerlo el fabricante y ejecuta en modo kernel, por lo que es un riesgo de seguridad.' }],
    },
  );
})();
