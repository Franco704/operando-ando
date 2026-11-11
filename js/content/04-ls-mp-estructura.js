/* Segundo parcial: llamadas al sistema (clase 1.2), multiprogramación (clase 1.3), servicios y estructuras del SO (unidad 2). */
(() => {
  const { h, LESSONS } = window.GUIDE;
  const { note, table, def, flow, code } = h;

  LESSONS.push(
    {
      id: 'llamadas-al-sistema', module: 'ls', title: 'Llamadas al sistema: la API del SO',
      keywords: 'llamada al sistema LS syscall wrapper envoltorio biblioteca cliente write printf fprintf man 2 intro syscalls número unistd.h int 0x80 sysret iret',
      tldr: 'Como el SO se adueñó del hardware, los programas tienen que <b>pedirle</b> los recursos: eso son las <b>llamadas al sistema</b> (LS), la API del SO. Se identifican por número, se invocan con una instrucción que provoca una excepción (<code>syscall</code>, <code>int 0x80</code>) y casi nunca se usan directo: se usan <b>wrappers</b> de biblioteca como <code>write</code> o <code>printf</code>.',
      goals: ['Explicar para qué existen las LS y por qué introducen overhead.', 'Diferenciar la LS de su wrapper de biblioteca.', 'Recorrer el camino de un printf hasta el kernel y de vuelta.'],
      body: `
<h2>Por qué existen</h2>
<ul>
  <li>El SO se adueña del hardware: los programas <b>no pueden usarlo directamente</b>.</li>
  <li>Deben solicitar los recursos al SO a través de las <b>llamadas al sistema</b>, la API del SO: todo lo que se accedería directamente si no estuviera el SO, más otros servicios y herramientas que el SO provee.</li>
  <li>Introducen <b>overhead</b>, pero son indispensables: si queremos las ventajas del SO (protección, abstracción, compatibilidad), hay que usarlas.</li>
</ul>
<h2>Wrappers (envoltorios) y bibliotecas cliente</h2>
<p>Usualmente no se invocan en assembler sino a través de <b>bibliotecas cliente</b> (wrappers): parecen llamadas normales a funciones e implementan la interfaz de la LS en un lenguaje de alto nivel. La LS <code>write</code> escribe en un dispositivo de E/S; sobre ella hay wrappers:</p>
${table(['Para la pantalla', 'Para un archivo'], [['write, printf, cout', 'write, fprintf, fwrite']])}
<p>Documentación: <code>man 2 intro</code>, <code>man 2 syscalls</code>, <code>man 2 syscall</code>. Cada LS se identifica por un <b>número</b> (<code>/usr/include/asm/unistd.h</code>, syscall.sh). La forma de invocarlas depende de la arquitectura; los wrappers son capas de abstracción que esconden esa diferencia.</p>
<div class="lab-mount" data-lab="0"></div>
<h2>Interfaz e implementación en el kernel</h2>
<p>En el código de Linux, <code>include/linux/syscalls.h</code> tiene las <b>declaraciones</b> (implementación de la interfaz) y, por ejemplo, <code>tools/include/nolibc/sys.h</code> la <b>definición</b> de las funciones de biblioteca. La implementación puede cambiar con cada versión del kernel, pero <b>mientras se mantenga la interfaz</b> todos los programas que la usan siguen siendo compatibles.</p>
${note('Pregunta de la clase: ¿por qué en <code>my_syscall3</code> no aparecen IRET ni SYSRET? Porque esa función está del lado del <b>usuario</b>: ejecuta <code>syscall</code> y la instrucción de retorno (SYSRET/IRET) la ejecuta el <b>kernel</b> al terminar de atender la llamada.', 'tip')}
<h2>LS directa en assembler</h2>
${code(`#include <unistd.h>
#include <sys/syscall.h>
int main(void) {
    syscall(SYS_write, 1, "hola\\n", 5);   /* LS directa: numero de LS y parametros */
    return 0;
}`, 'c')}
<p>Usar <code>SYS_write</code> con <code>syscall()</code> no independiza de la arquitectura del todo: el número de cada LS y la convención de registros cambian entre x86 (32 bits, <code>int 0x80</code>) y x86-64 (instrucción <code>syscall</code>). Por eso, si en un programa assembler solo se cambia <code>int 0x80</code> por <code>syscall</code>, <b>no</b> funciona: hay que cambiar también los números de LS y los registros de los parámetros.</p>
<h2>VDSO</h2>
<p>Algunas LS se hacen muy seguido y <b>no necesitan modo kernel</b> (por ejemplo, <code>gettimeofday</code>, <code>clock_gettime</code>). Con los <b>Virtual Dynamic Shared Objects</b> el kernel expone funciones que los programas ejecutan <b>en modo usuario</b>: mucho menos overhead. Si una función VDSO pasara a ser LS, los programas seguirían funcionando (misma interfaz), pero más lentos. (<code>man vdso</code>; no se ve en detalle.)</p>`,
      labs: [{ type: 'order', title: 'El viaje de un printf("hola\\n")', items: ['El programa llama a printf, función de la biblioteca de C (modo usuario)', 'printf arma el texto y llama al wrapper write', 'El wrapper pone el número de la LS y los parámetros en registros y ejecuta la instrucción syscall', 'La excepción cambia la CPU a modo kernel y salta a la rutina de LS del SO', 'El kernel busca la LS por su número y ejecuta la implementación de write (usa el driver de la terminal)', 'El kernel vuelve con SYSRET: se restaura el modo usuario y el wrapper devuelve el resultado'], explain: '<p>Solo los pasos 4 y 5 ejecutan en modo kernel. Todo lo demás es código de biblioteca en el proceso: por eso printf es una función de biblioteca (sección 3) y write una LS (sección 2).</p>' }],
      quiz: [
        { q: '¿Por qué un programa de usuario no puede escribir directamente en la controladora del disco?', o: ['Porque el SO se adueñó del hardware: el acceso a E/S es privilegiado y debe pedirse con una llamada al sistema', 'Porque la controladora del disco solo acepta comandos que provengan del firmware durante el arranque de la PC', 'Porque el compilador de C no tiene instrucciones para acceder a dispositivos', 'Porque cada disco tiene un protocolo secreto que solo conoce el fabricante del hardware'], a: 0, e: 'Las instrucciones de E/S son privilegiadas (modo kernel). Los programas piden al SO mediante LS.' },
        { q: '¿Qué diferencia hay entre write y printf?', o: ['write es una LS; printf, una función de biblioteca', 'printf es una LS y write, su wrapper en la biblioteca de C', 'Son la misma LS con dos nombres según el lenguaje', 'write escribe solo en archivos y printf solo en pantalla'], a: 0, e: 'write está en la sección 2 (LS); printf en la 3 (biblioteca). write también escribe en la pantalla (descriptor 1).' },
        { q: '¿Cómo identifica el kernel qué llamada al sistema se pidió?', o: ['Por un número de LS que el programa pone en un registro', 'Por el nombre de la función, que el kernel busca en la tabla de símbolos', 'Por la dirección del wrapper en la biblioteca de C', 'Por el número de interrupción del vector, distinto para cada LS'], a: 0, e: 'Todas las LS entran por el mismo mecanismo (syscall o int 0x80) y el número en un registro elige cuál.' },
        { q: 'Si cambia la implementación de una LS en una nueva versión del kernel, los programas existentes:', o: ['Siguen funcionando mientras se mantenga la interfaz', 'Deben recompilarse siempre', 'Dejan de funcionar hasta que se actualice la biblioteca de C', 'Siguen funcionando solo si fueron enlazados estáticamente'], a: 0, e: 'Es la ventaja de una API: el programa depende de la interfaz, no de la implementación.' },
        { q: '¿Qué ganan las funciones VDSO frente a una llamada al sistema común?', o: ['Ejecutan en modo usuario y evitan el overhead del cambio a modo kernel', 'Ejecutan en modo kernel sin pasar por el vector de interrupciones', 'Pueden acceder a cualquier dispositivo sin pedir permiso al SO', 'Se ejecutan en la GPU en lugar de la CPU'], a: 0, e: 'Para LS frecuentes que no necesitan privilegio (leer la hora), el kernel expone funciones ejecutables en modo usuario.' },
        { q: 'En un programa assembler para x86 de 32 bits se reemplaza solo int 0x80 por syscall. ¿Qué pasa?', o: ['No: cambian también los números de LS y los registros', 'Funciona igual, porque las dos instrucciones entran al kernel por el mismo vector', 'Funciona, pero más lento, porque int 0x80 pasa por el vector de interrupciones', 'Funciona solo si se ejecuta como root, porque syscall es una instrucción privilegiada'], a: 0, e: 'La convención de x86-64 (syscall) usa otros números y otros registros que la de i386 (int 0x80).' },
        { q: '¿En qué sección del manual se documentan las llamadas al sistema?', o: ['2', '3', '1', '8'], a: 0, e: 'man 2 intro, man 2 syscalls. La 3 es de funciones de biblioteca.' },
      ],
      open: [{ t: 'text', q: '¿Qué es una llamada al sistema y por qué un programa no puede evitarlas?', k: [['api', 'interfaz'], ['solicitar', 'pedir', 'pide', 'piden', 'solicita'], ['adueña', 'dueño', 'apropia', 'privilegi', 'modo kernel'], ['hardware', 'recursos']], need: 3, e: 'Es la forma en que un programa pide al SO recursos y servicios: la API del SO. Como el SO se adueñó del hardware (el acceso es privilegiado, en modo kernel), un programa no puede usarlo directamente y debe solicitarlo mediante LS, aunque eso introduzca overhead.' }],
      sources: [{ title: 'Silberschatz 2.3 y 2.4', ref: 'Llamadas al sistema; tipos de llamadas', points: ['La cátedra remite a 2.3 para la explicación general.', 'Lecturas integradoras: virus en GNU/Linux (desdelinux), modo usuario y modo kernel (Microsoft), unexpected kernel mode trap, el caso CrowdStrike (Xataka).'] }],
    },
  );

  LESSONS.push(
    {
      id: 'multiprogramacion', module: 'mp', title: 'Multiprogramación, tiempo compartido y lotes',
      keywords: 'multiprogramación grado multiprocesamiento concurrencia paralelismo tiempo compartido interactivo tiempo de respuesta lotes batch throughput turnaround utilización de CPU ventajas desventajas',
      tldr: '<b>Multiprogramación</b>: varios programas cargados en memoria para maximizar la utilización de recursos. <b>Tiempo compartido</b>: multiprogramación que cambia de programa tan rápido que los usuarios interactúan como si cada uno tuviera la CPU; minimiza el <b>tiempo de respuesta</b>. <b>Lotes</b>: sin interacción; importan utilización, <b>throughput</b> y <b>turnaround</b>.',
      goals: ['Distinguir multiprogramación, multiprocesamiento y concurrencia.', 'Comparar tiempo compartido y lotes por objetivos y parámetros.', 'Enumerar ventajas y desventajas del SO como administrador del hardware.'],
      body: `
<h2>Multiprogramación (MP)</h2>
${def('Multiprogramación', 'Técnica que permite que haya varios programas cargados en memoria. Objetivo: maximizar la utilización de recursos.', 'Diapositivas 1.3')}
<ul>
  <li>Mientras un programa espera E/S, la CPU ejecuta otro: se aprovechan las ráfagas.</li>
  <li>El <b>modo protegido</b> ayuda: cada programa está aislado, confinado a su espacio.</li>
  <li><b>Grado de multiprogramación</b>: cantidad de programas que se pueden mantener cargados en memoria.</li>
  <li><b>Multiprocesamiento</b>: presencia de más de un núcleo o CPU. No es lo mismo que multiprogramación.</li>
</ul>
<h2>Concurrencia</h2>
<p>Las instrucciones de varios programas se ejecutan <b>intercaladas</b> en una CPU y/o <b>en paralelo</b> en varias. Los programas “concurren” hacia los recursos y pueden querer los mismos al mismo tiempo: de ahí salen los problemas del 3.er parcial (condiciones de carrera, abrazo mortal).</p>
<h2>Tiempo compartido y lotes</h2>
${table(['', 'Tiempo compartido', 'Procesamiento por lotes'], [
  ['Qué es', 'Sistema <b>interactivo</b>: el usuario da comandos y espera respuestas y resultados intermedios', 'Primer modo de procesamiento: los datos se dan al inicio y los resultados se entregan al final'],
  ['Cómo', 'Intercambia los programas en la CPU tan rápido que parecen ejecutar en paralelo; varios usuarios comparten la computadora', 'Los trabajos (tareas) se encolan y se ejecutan; la MP agrega paralelismo'],
  ['Objetivo', 'Minimizar el <b>tiempo de respuesta</b>', 'Maximizar utilización de CPU y <b>throughput</b>; minimizar <b>turnaround</b>'],
  ['Cambia de programa', 'Por <b>tiempo</b> (se termina el cuanto) o porque necesita E/S', 'Cuando el actual se bloquea (por una LS de E/S) o termina'],
  ['Ejemplos', 'Escritorio, servidor de terminales', 'Compresión de archivos, compilación, renderizado, cálculo de sueldos'],
])}
${def('Throughput (tasa de procesamiento)', 'Cantidad de trabajos finalizados por unidad de tiempo.', '')}
${def('Turnaround (tiempo de retorno)', 'Tiempo que tarda una aplicación en particular en finalizar su ejecución (desde que se lanza hasta que termina).', '')}
${note('El tiempo compartido <b>implica</b> multiprogramación (es una variante). Con varias CPU también se aplica: los programas cambian de CPU cuando se les acaba el tiempo o necesitan E/S.', 'exam')}
<h2>El SO como administrador del hardware: balance</h2>
${table(['Ventajas', 'Desventajas'], [
  ['Interfaz, abstracción del hardware y compatibilidad (API)', 'Overhead para usar recursos: hay que pedirlos al SO por su API'],
  ['Seguridad: integridad, privacidad, disponibilidad', 'Costos económicos (licencias)'],
  ['Optimización del uso de recursos, configurable según el propósito (MP, lotes, TC)', 'Hay que confiar en el SO'],
])}
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'sched', title: 'Lotes monoprogramados contra multiprogramados', intro: 'Tres trabajos que llegan juntos. FCFS es como un sistema por lotes; Round Robin, como tiempo compartido. Mirá cómo cambian la espera y la respuesta.', procs: [{ id: 'P1', arr: 0, burst: 10 }, { id: 'P2', arr: 0, burst: 10 }, { id: 'P3', arr: 0, burst: 10 }], algo: 'fcfs', q: 2 }],
      quiz: [
        { q: '¿Cuál es el objetivo de la multiprogramación?', o: ['Maximizar la utilización de los recursos', 'Minimizar el tiempo de respuesta a los usuarios interactivos', 'Permitir que varios usuarios inicien sesión a la vez', 'Ejecutar instrucciones de varios programas al mismo tiempo en varias CPU'], a: 0, e: 'MP: varios programas en memoria para que los recursos no queden ociosos. Minimizar el tiempo de respuesta es el objetivo del tiempo compartido; ejecutar en varias CPU es multiprocesamiento.' },
        { q: '¿Qué es el grado de multiprogramación?', o: ['Cuántos programas hay cargados en memoria', 'La cantidad de núcleos de la CPU que pueden ejecutar en paralelo', 'El porcentaje de tiempo que la CPU está ocupada con programas de usuario', 'La cantidad de usuarios que pueden estar conectados a la vez'], a: 0, e: 'Es cuántos programas hay en memoria. Lo controla el planificador de largo plazo.' },
        { q: 'Una computadora de un solo núcleo con varios programas cargados que se alternan en la CPU tiene:', o: ['Concurrencia, pero no paralelismo', 'Multiprocesamiento, porque varios programas progresan a la vez', 'Paralelismo, porque los programas parecen ejecutar simultáneamente', 'Solo procesamiento por lotes, porque no hay varias CPU'], a: 0, e: 'Con un núcleo las instrucciones se intercalan (concurrencia) pero nunca se ejecutan dos a la vez (paralelismo). Multiprocesamiento requiere más de una CPU.' },
        { q: 'En un sistema por lotes, ¿qué parámetro NO tiene sentido optimizar?', o: ['El tiempo de respuesta', 'El throughput', 'El turnaround', 'La utilización de la CPU'], a: 0, e: 'En lotes no hay interacción: no hay respuesta que esperar. Importan utilización, throughput y turnaround.' },
        { q: 'En tiempo compartido, un programa deja la CPU cuando:', o: ['Se le acaba el tiempo o necesita E/S', 'Termina su ejecución, únicamente: no hay otra forma de quitarle la CPU', 'Otro programa de mayor tamaño entra a memoria y necesita la CPU', 'El usuario presiona una tecla en cualquier otro programa abierto'], a: 0, e: 'Se cambia por tiempo (interrupción del temporizador) o por bloqueo (LS de E/S). En lotes, solo por bloqueo o fin.' },
        { q: '¿Qué es el throughput?', o: ['La cantidad de trabajos finalizados por unidad de tiempo', 'El tiempo desde que se lanza un trabajo hasta que termina', 'El tiempo que un trabajo pasa en la cola de listos', 'El porcentaje de tiempo que la CPU está ocupada con programas de usuario'], a: 0, e: 'Throughput = trabajos terminados / tiempo. Lo que tarda un trabajo desde que se lanza hasta que termina es turnaround; el tiempo en la cola de listos, espera; el porcentaje de CPU ocupada, utilización.' },
        { q: '¿Cuál es una desventaja de tener un SO que administre el hardware?', o: ['El overhead de pedir los recursos por su API', 'La pérdida de compatibilidad entre programas de distintos fabricantes', 'Que los programas no pueden compartir la CPU ni la memoria', 'Que no se puede proteger la memoria de cada programa de los demás'], a: 0, e: 'Las otras son ventajas que el SO aporta (compatibilidad, compartir, protección). Las desventajas: overhead, licencias y tener que confiar en el SO.' },
      ],
      open: [{ t: 'text', q: 'Compará tiempo compartido y procesamiento por lotes según su objetivo y los parámetros que importan en cada uno.', k: [['interactivo', 'interacción', 'interaccion'], ['tiempo de respuesta', 'respuesta'], ['throughput', 'trabajos por unidad de tiempo', 'tasa de procesamiento'], ['turnaround', 'tiempo de retorno', 'finalizar']], need: 3, e: 'Tiempo compartido es interactivo: busca minimizar el tiempo de respuesta, cambiando de programa rápido (por tiempo o por E/S). Lotes no es interactivo: los datos se dan al inicio y los resultados al final; importan la utilización de CPU, el throughput (trabajos terminados por unidad de tiempo) y el turnaround (cuánto tarda cada trabajo en terminar).' }],
    },
  );

  LESSONS.push(
    {
      id: 'servicios-del-so', module: 'estructura', title: 'Proceso (primera definición) y servicios del SO',
      keywords: 'proceso programa en ejecución servicios interfaz de usuario CLI GUI lotes ejecución de programas E/S sistema de archivos comunicaciones detección de errores protección contabilidad shell pantalla táctil',
      tldr: 'Primera definición de <b>proceso</b>: un programa en ejecución en un SO multiprogramado (el programa es el código). Los <b>servicios</b> del SO abstraen el hardware para usuarios y programas: ejecución de programas, E/S, sistema de archivos, comunicaciones, detección de errores, protección; y para la eficiencia, administración de recursos y contabilidad. La GUI y la CLI son <b>programas del sistema</b>, no el servicio de interfaz de usuario.',
      goals: ['Definir proceso y diferenciarlo de programa.', 'Enumerar los servicios del SO y para quién son.', 'Explicar por qué, para la cátedra, la GUI no es el servicio de interfaz de usuario.'],
      body: `
<h2>Programas y procesos</h2>
<p>¿Qué hace falta para cocinar siguiendo una receta? La receta, una cocina, ingredientes, utensilios y alguien que cocine. Un programa es la receta; para ejecutarlo hacen falta memoria, CPU, archivos. Un SO multiprogramado ejecuta muchos programas a la vez, incluso el mismo varias veces: ¿cómo los diferencia? Con el concepto de <b>proceso</b>.</p>
${def('Proceso (concepto inicial)', 'Un programa en ejecución en un SO multiprogramado.', 'Diapositivas, Unidad 2. Desde ahora no diremos “programa en ejecución” sino proceso; el programa es el código.')}
<p>El kernel <b>no</b> es un proceso: gestiona los procesos. La analogía clase–objeto ayuda (el programa sería la clase y el proceso una instancia), aunque el concepto se irá refinando (procesos con hilos, en el 3.er parcial).</p>
<h2>Servicios del SO</h2>
<p>Las tres funciones generales (administrar recursos, interfaz para el usuario, interfaz para los programas) se concretan en servicios. Los de interfaz sirven para <b>abstraer la complejidad</b> del hardware.</p>
${table(['Servicio', 'Qué brinda'], [
  ['Ejecución de programas', 'Cargar un programa en memoria, ejecutarlo y finalizarlo normal o anormalmente (indicando error)'],
  ['Operaciones de E/S', 'Los programas necesitan E/S, que está bajo control del SO'],
  ['Manipulación del sistema de archivos', 'Leer, escribir, crear, eliminar y buscar archivos y directorios; listar información; administrar permisos'],
  ['Comunicaciones', 'Intercambio de información entre procesos, en la misma computadora o por red'],
  ['Detección de errores', 'Detectar e informar errores de HW o SW (sector defectuoso, impresora sin papel, desborde de ALU, acceso a memoria prohibida), corregir o tomar medidas paliativas'],
  ['Protección y seguridad', 'Evitar que usuarios y programas interfieran entre sí o con el SO; cuidar los datos'],
  ['Administración de recursos <i>(eficiencia)</i>', 'CPU, memoria principal, almacenamiento de archivos, dispositivos de E/S'],
  ['Contabilidad <i>(eficiencia)</i>', 'Qué usuarios usan cuánto y qué recursos; detectar mal funcionamiento de programas'],
])}
<h2>La interfaz de usuario según la cátedra</h2>
<p>Silberschatz pone la UI (CLI, GUI, lotes) como servicio hacia el usuario. <b>Para la materia no</b>: la GUI no es parte del kernel. El servicio de interfaz de usuario es más <b>abstracto</b>: los conceptos de archivo, sistema de archivos, proceso, seguridad, comunicaciones… que el SO presenta. También da <b>compatibilidad</b>: quien entiende qué es un archivo puede usar cualquier SO que soporte ese concepto.</p>
${table(['Interfaz', 'Características'], [
  ['Lotes (batch)', 'No hay una interfaz definida; hoy muchas son web. Se indica el programa, sus parámetros y datos en un formato que el sistema entienda; sin interacción. Ej.: trabajos de Google Cloud Run (no escuchan solicitudes)'],
  ['Línea de comandos (CLI)', 'Interpreta comandos en modo texto; comandos internos, funciones del usuario o ejecutables. Rápida, consume poco, automatizable con scripts; ideal para servidores. Unix desde 1971 (tsh), Bourne shell (sh) en 1979; PowerShell desde 2006'],
  ['Gráfica (GUI)', 'Más intuitiva; íconos, mouse, ventanas. Inventada en Xerox PARC. Más útil en escritorio. Unix/Linux con GUI opcionales (KDE, GNOME, xfce…)'],
  ['Táctil', 'Móviles: sin mouse ni teclado; gestos, voz, acelerómetro, huella, rostro'],
])}
<p>“Shell” informalmente es la CLI, pero estrictamente es un <b>envoltorio</b> (otra forma de decir interfaz): la GUI también es un shell.</p>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'classify', title: '¿Qué servicio del SO está en juego?', buckets: ['Ejecución de programas', 'E/S', 'Sistema de archivos', 'Comunicaciones', 'Detección de errores', 'Protección', 'Contabilidad'], items: [
        { t: 'Un programa intenta acceder a memoria que no le pertenece y el SO lo termina', b: 4, why: 'Detecta el error (también protege, pero la acción descripta es la detección y el tratamiento).' },
        { t: 'El navegador descarga una página a través de la red', b: 3 }, { t: 'Se cambian los permisos de un archivo para que nadie más lo lea', b: 2, why: 'La administración de permisos es parte de la manipulación del SA.' },
        { t: 'Se carga un programa en memoria y se lo pone a ejecutar', b: 0 }, { t: 'Se registra cuánto tiempo de CPU usó cada usuario en el mes', b: 6 },
        { t: 'Un programa le pide al SO que imprima un documento', b: 1 }, { t: 'Un usuario no puede matar los procesos de otro usuario', b: 5 },
      ] }],
      quiz: [
        { q: 'Según la cátedra, ¿cuál es el servicio de interfaz de usuario del SO?', o: ['Las abstracciones que presenta: archivo, proceso, E/S', 'La interfaz gráfica que se instala junto con el SO', 'El intérprete de comandos, como bash o PowerShell', 'La pantalla de inicio de sesión y el escritorio'], a: 0, e: 'La GUI y la CLI son programas del sistema. El servicio de interfaz de usuario del kernel es el conjunto de abstracciones que permite entender y usar cualquier SO.' },
        { q: '¿Cuál es la primera definición de proceso que da la cátedra?', o: ['Un programa en ejecución en un SO multiprogramado', 'Un archivo ejecutable guardado en el disco', 'El código binario de un programa cargado en la RAM', 'Cada una de las instrucciones que ejecuta la CPU'], a: 0, e: 'Proceso = programa en ejecución en un SO multiprogramado. El programa (archivo ejecutable) es el código, entidad pasiva.' },
        { q: '¿Cuál de estos servicios está orientado a la eficiencia y no al usuario?', o: ['Contabilidad', 'Manipulación del sistema de archivos', 'Comunicaciones', 'Detección de errores'], a: 0, e: 'Administración de recursos y contabilidad apuntan a usar eficientemente los recursos; los otros benefician directamente a usuarios y programadores.' },
        { q: '¿Por qué la CLI es muy usada en servidores?', o: ['Porque es rápida, consume pocos recursos y se puede automatizar con scripts', 'Porque es la única interfaz que soporta varios usuarios simultáneos en un servidor', 'Porque los servidores no tienen placa de video para dibujar ventanas', 'Porque la GUI no puede ejecutar programas que necesiten acceso a la red'], a: 0, e: 'Son las ventajas que enumeran las diapositivas.' },
        { q: 'Estrictamente, el término shell significa:', o: ['Envoltorio (interfaz): una GUI también es un shell', 'Únicamente la interfaz de línea de comandos de Unix y Linux', 'El kernel del sistema operativo visto desde los programas', 'La consola física (teclado y monitor) conectada al servidor'], a: 0, e: 'Informalmente shell es la CLI, pero el término es más amplio.' },
        { q: 'El kernel del SO, ¿es un proceso?', o: ['No: gestiona los procesos', 'Sí: es el proceso con PID 1, que crea a todos los demás', 'Sí: es el proceso de mayor prioridad del sistema', 'Solo mientras atiende una llamada al sistema de otro proceso'], a: 0, e: 'Así lo dicen las diapositivas de la unidad 2. El PID 1 es init/systemd, un programa del sistema.' },
      ],
    },
    {
      id: 'estructuras-del-so', module: 'estructura', title: 'Estructuras: monolítica, capas, microkernel, módulos e híbridos',
      keywords: 'estructura monolítica simple MS-DOS UNIX capas niveles microkernel Mach Darwin paso de mensajes módulos cargables lsmod modprobe insmod rmmod híbrido',
      tldr: 'Un SO de propósito general es un programa enorme y hay varias formas de estructurarlo. <b>Monolítico</b>: todo en un nivel (Silberschatz lo llama “estructura simple”). <b>Capas</b>: cada una usa solo las de abajo. <b>Microkernel</b>: lo mínimo en el kernel y el resto como servicios en modo usuario que se comunican por mensajes. <b>Módulos</b>: componentes cargables. Casi todos los actuales son <b>híbridos</b>.',
      goals: ['Comparar las estructuras por ventajas y desventajas.', 'Ubicar ejemplos reales en cada estructura.'],
      body: `
<p>Lectura obligatoria: Silberschatz 7.ª ed., <b>2.7</b>. Las diapositivas suponen que se leyó.</p>
${table(['Estructura', 'Cómo es', 'Ventajas', 'Desventajas', 'Ejemplos'], [
  ['Monolítica (simple)', 'Una sola pieza: funciones en el mismo nivel que se pueden llamar entre sí; sin jerarquía ni encapsulamiento', 'Rápida (llamadas directas), sencilla y liviana al principio', 'Desarrollo y mantenimiento muy complicados; drivers en modo kernel; estabilidad, portabilidad y seguridad comprometidas', 'MS-DOS, UNIX original'],
  ['En capas (niveles)', 'Capa 0 = hardware, capa N = interfaz de usuario; cada capa usa solo funciones de las capas inferiores', 'Modularidad: fácil de depurar y verificar capa por capa', 'Difícil definir las capas; cada llamada atraviesa varias: overhead', 'Diseños académicos (THE)'],
  ['Microkernel', 'Saca del kernel todo lo posible a <b>espacio de usuario</b>; los módulos se comunican por <b>paso de mensajes</b> a través del kernel', 'Fácil de extender y portar; más confiable y seguro (menos código en modo kernel)', 'Overhead por la comunicación entre espacio de usuario y kernel', 'Mach; Darwin (macOS) se basa en parte en Mach'],
  ['Módulos cargables', 'Núcleo central y componentes separados con interfaces conocidas, que se cargan cuando hace falta dentro del kernel', 'Como las capas pero más flexible (cualquier módulo llama a otro); sin el costo de mensajes', 'Un módulo defectuoso corre en modo kernel', 'Linux (<code>lsmod</code>, <code>modprobe</code>, <code>insmod</code>, <code>rmmod</code>), Solaris'],
  ['Híbrida', 'Combina enfoques para equilibrar rendimiento, seguridad y usabilidad', 'Toma lo mejor de cada uno', 'Más compleja', 'Linux, Windows, macOS, iOS, Android, Solaris'],
])}
<h2>MS-DOS y UNIX</h2>
<ul>
  <li><b>MS-DOS</b>: escrito para dar la mayor funcionalidad en el menor espacio; empezó chico y creció más de lo previsto; hardware <b>sin modos</b> de operación; <b>monotarea</b>; sencillo y liviano pero limitado e inseguro. No evolucionó porque Microsoft pasó a Windows.</li>
  <li><b>UNIX</b>: todos los servicios en un solo nivel, pero con muchísima más funcionalidad (multitarea, multiusuario, comunicaciones, seguridad) y siguió evolucionando.</li>
</ul>
${note('Tarea de la clase: relacionar las estructuras con organizaciones de personas. Monolítica: una pyme donde todos hacen de todo; capas: una jerarquía estricta; microkernel: un coordinador mínimo y equipos independientes que se mandan mensajes.', 'tip')}
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'classify', title: '¿Qué estructura describe?', buckets: ['Monolítica', 'Capas', 'Microkernel', 'Módulos'], items: [
        { t: 'Los servicios corren en modo usuario y se comunican por mensajes a través del kernel', b: 2 }, { t: 'Cualquier función del kernel puede llamar a cualquier otra', b: 0 },
        { t: 'La capa N solo usa servicios de capas inferiores', b: 1 }, { t: 'Se agrega soporte para un dispositivo con modprobe sin reiniciar', b: 3 },
        { t: 'Es la estructura de MS-DOS', b: 0 }, { t: 'Su principal desventaja es el overhead de la comunicación entre espacio de usuario y kernel', b: 2 },
        { t: 'Silberschatz la llama “estructura simple”', b: 0 }, { t: 'Componentes separados del núcleo, con interfaces conocidas, cargados dentro del kernel', b: 3 },
      ] }],
      quiz: [
        { q: '¿Cuál es la principal desventaja de un microkernel?', o: ['El overhead de la comunicación entre los servicios en espacio de usuario y el kernel', 'Que los drivers ejecutan en modo kernel y comprometen la seguridad del sistema', 'Que es muy difícil portarlo a una nueva arquitectura de hardware', 'Que todas sus funciones pueden llamarse entre sí sin ninguna jerarquía'], a: 0, e: 'El microkernel gana en confiabilidad, seguridad y portabilidad a costa de pasar mensajes a través del kernel.' },
        { q: '¿Por qué un microkernel es más confiable?', o: ['Porque hay menos código ejecutando en modo kernel', 'Porque todos sus servicios están en el mismo nivel', 'Porque no usa paso de mensajes', 'Porque no necesita drivers'], a: 0, e: 'Si falla un servicio en modo usuario, no tumba al kernel.' },
        { q: 'Linux, con módulos cargables y gran parte del código en un solo espacio de kernel, se clasifica como:', o: ['Híbrido', 'Microkernel puro', 'Por capas', 'Monolítico puro como MS-DOS'], a: 0, e: 'La mayoría de los SO modernos no son puros: son híbridos (las diapositivas incluyen a Linux).' },
        { q: '¿Qué característica tenía MS-DOS que lo hacía inseguro?', o: ['Su hardware no tenía modos de operación', 'Usaba un microkernel con demasiados mensajes entre servicios', 'Tenía demasiadas capas que impedían verificarlo', 'Permitía cargar módulos de red sin verificarlos'], a: 0, e: 'Sin modo kernel/usuario no hay protección. Además era monotarea.' },
        { q: 'En una estructura en capas, la capa 3 puede usar servicios de:', o: ['Las capas 0, 1 y 2', 'Cualquier capa, por encima o por debajo', 'Solo la capa 4', 'Solo la capa 0 (el hardware)'], a: 0, e: 'Cada capa usa solo funciones y servicios de capas de nivel inferior.' },
        { q: 'Respecto de las capas, los módulos cargables:', o: ['Son similares, pero más flexibles', 'Obligan a que cada módulo use solo los de nivel inferior, igual que las capas', 'Ejecutan siempre en modo usuario, como los servicios de un microkernel', 'Se comunican únicamente por paso de mensajes a través del núcleo'], a: 0, e: 'Silberschatz: “en general, similar a las capas pero con más flexibilidad”.' },
      ],
      open: [{ t: 'text', q: 'Compará la estructura monolítica con la de microkernel.', k: [['mismo nivel', 'una sola pieza', 'un solo bloque', 'todo en el kernel'], ['espacio de usuario', 'modo usuario'], ['mensajes', 'paso de mensajes'], ['overhead', 'rendimiento', 'sobrecarga'], ['seguro', 'confiable', 'estabilidad']], need: 4, e: 'En la monolítica todas las funciones están en el mismo nivel, dentro del kernel, y se llaman directamente: es rápida pero difícil de mantener, y un error (por ejemplo, en un driver) compromete la estabilidad y la seguridad. El microkernel deja en el kernel lo mínimo y mueve los servicios a espacio de usuario, que se comunican por paso de mensajes: es más confiable, seguro y portable, pero tiene overhead por esa comunicación.' }],
      sources: [{ title: 'Silberschatz 2.7 (Estructura del sistema operativo)', ref: 'Lectura obligatoria', points: ['2.7.1 Estructura simple, 2.7.2 en niveles, 2.7.3 microkernels, 2.7.4 módulos.', 'Las diapositivas agregan la categoría de sistemas híbridos.'] }],
    },
  );
})();
