/* Cuarto parcial: sistemas de E/S (cap. 13 y TP de puertos de E/S) y almacenamiento masivo (cap. 12). */
(() => {
  const { h, LESSONS, so } = window.GUIDE;
  const { note, table, def, flow, code, num } = h;

  LESSONS.push(
    {
      id: 'subsistema-de-es', module: 'es', title: 'El subsistema de E/S del kernel',
      keywords: 'E/S entrada salida subsistema drivers capas abstracción carácter bloque mapeada en memoria dedicada puertos síncrona asíncrona bloqueante no bloqueante ioctl planificación de E/S búfer caché spooling cola reserva errores',
      tldr: 'Las dos tareas de una computadora son E/S y procesamiento. La E/S es difícil de gestionar por la <b>variedad</b> de dispositivos; el subsistema de E/S del kernel la abstrae y presenta una <b>interfaz uniforme</b>, con drivers modulares y en capas. Brinda planificación de E/S, búferes, caché, spooling y tratamiento de errores.',
      goals: ['Explicar qué abstrae el subsistema de E/S y cómo ayuda a los fabricantes.', 'Distinguir E/S síncrona y asíncrona, bloqueante y no bloqueante.', 'Comparar búfer, caché y spool.'],
      body: `
<h2>Por qué hace falta</h2>
<p>Para tener MP, el dueño del equipo le entrega el control del hardware al SO: CPU (planificación, unidad 5), RAM (unidades 8 y 9) y E/S (esta). La E/S es complicada por la variedad de dispositivos, actuales y futuros: almacenamiento, comunicaciones, interfaz humana, adquisición de datos, actuadores; de carácter o de bloque; internos o externos; distintos buses; E/S dedicada o mapeada en memoria; distintas velocidades.</p>
<p>El <b>subsistema de E/S del kernel</b> maneja y abstrae esa complejidad con una interfaz uniforme hacia el resto del kernel y el programador. Los drivers son <b>modulares y estratificados</b>: el driver USB tiene lo común a todo lo conectado por USB, el de impresora USB lo común a todas las impresoras USB, y así (al menos dos capas más por fabricante y modelo). Modularizar incluye abstraer: extraer lo común. Para los fabricantes, un subsistema independiente del hardware significa escribir un driver que implemente una interfaz conocida y listo.</p>
${note('En la p. 459, “el propósito de la capa de <b>controladores de dispositivo</b>” se refiere a los <b>drivers</b> (software), no a las placas controladoras. El “chip FIFO” de 13.2 es una cola: una estructura de datos FIFO en hardware (compará con el último párrafo de 12.1.1, la caché de la controladora del disco).', 'warn')}
<h2>E/S mapeada en memoria y dedicada</h2>
${table(['', 'Mapeada en memoria', 'Dedicada (directa, por puertos)'], [
  ['Cómo se accede a los registros del dispositivo', 'Con las mismas instrucciones que la RAM (MOV): los registros aparecen en direcciones de memoria', 'Con instrucciones especiales de E/S (IN, OUT) en un espacio de direcciones aparte'],
  ['A favor', 'Cualquier instrucción de memoria sirve; rápido para grandes volúmenes (memoria de video)', 'No ocupa direcciones de memoria'],
  ['En contra', 'Ocupa direcciones; un puntero mal usado puede escribir en un dispositivo', 'Instrucciones más limitadas'],
])}
<p>Hay dispositivos que usan ambas a la vez: la controladora gráfica del PC tiene puertos de E/S para las operaciones de control y una región mapeada en memoria para el contenido de la pantalla (13.2).</p>
<h2>E/S bloqueante, no bloqueante y asíncrona (13.3.4)</h2>
${table(['', 'Qué pasa con el proceso'], [
  ['Bloqueante (síncrona)', 'Se suspende hasta que la E/S termina y está el resultado'],
  ['No bloqueante', 'La LS vuelve enseguida con lo que haya disponible (quizás nada o una parte)'],
  ['Asíncrona', 'La LS vuelve enseguida; la E/S completa sigue en curso y más tarde se avisa al proceso (señal, callback)'],
])}
<p>¿Es lo mismo asíncrona que no bloqueante? <b>No</b>: la no bloqueante devuelve lo que haya <b>ya</b>; la asíncrona pide la operación completa y avisa cuando terminó. (El último párrafo de 13.3.4 no va.)</p>
<p><b>ioctl()</b>: LS “comodín” para operaciones específicas de un dispositivo que no encajan en read/write. Recibe tres parámetros: el <b>descriptor</b> del dispositivo, un <b>número de comando</b> (definido por el driver) y un <b>puntero</b> a los datos del comando. Ej.: <code>ioctl(fd, TIOCGWINSZ, &amp;ws)</code> pide el tamaño de la ventana de la terminal.</p>
<h2>Servicios del subsistema de E/S (13.4)</h2>
${table(['Servicio', 'Qué hace'], [
  ['Planificación de E/S (13.4.1)', 'Reordenar la cola de pedidos de cada dispositivo para mejorar el rendimiento global (no solo el disco: también impresoras o la red)'],
  ['Búfer (13.4.2)', 'Área de memoria que guarda datos en tránsito: compensa velocidades distintas (módem → disco), tamaños distintos de transferencia, y da semántica de copia (lo que se escribió no cambia aunque la app modifique su arreglo)'],
  ['Caché (13.4.3)', 'Memoria rápida con una <b>copia</b> de datos que están en otro lado. Un búfer puede tener la única copia; una caché, nunca'],
  ['Spooling y reserva (13.4.4)', 'Un <b>spool</b> es un búfer (en disco) para dispositivos que no aceptan flujos intercalados, como la impresora: cada trabajo se guarda y se imprime de a uno. Algunos dispositivos permiten reservarlos en exclusiva'],
  ['Tratamiento de errores (13.4.5)', 'Ver abajo'],
])}
<h2>Tratamiento de errores (13.4.5)</h2>
<ul>
  <li>Una de las funciones fundamentales del SO (aparece en los servicios del capítulo 2: detección de errores).</li>
  <li>Pueden fallar dispositivos o transferencias (comunicaciones, sector defectuoso). Objetivos: conocer qué puede fallar; si es <b>transitorio</b>, reintentar (releer, reenviar); si es <b>permanente</b>, que no afecte al SO ni a las demás aplicaciones y, si se puede, que la aplicación que pidió siga ejecutando.</li>
  <li>A veces el SO no puede recuperarse (ej.: pierde el acceso al área de intercambio).</li>
  <li>Las LS informan los errores (en UNIX, el valor de retorno y <code>errno</code>) para que la aplicación decida qué hacer. El ejemplo SCSI no va.</li>
</ul>
${note('<b>Exclusiones del capítulo 13:</b> 13.2.1 a 13.2.3 (sondeo, interrupciones, DMA) no van como tema del libro (13.2.4 sí; el sondeo se ve en el TP de puertos). 13.3.1 a 13.3.3 no van; de 13.3.4, el último párrafo no. El ejemplo SCSI de 13.4.5 no va. 13.4.7 (estructuras de datos del kernel) no va. 13.4.8 sí, y es lo último del capítulo.', 'warn')}`,
      labs: [{ type: 'classify', title: '¿Búfer, caché o spool?', buckets: ['Búfer', 'Caché', 'Spool'], items: [
        { t: 'Los trabajos de impresión de varios procesos se guardan en disco y la impresora los toma de a uno', b: 2 },
        { t: 'Un archivo leído hace poco se mantiene en RAM para la próxima lectura', b: 1, why: 'Es una copia: el original está en el disco.' },
        { t: 'Los datos que llegan lento por la red se acumulan hasta tener un bloque para escribir en disco', b: 0 },
        { t: 'Al escribir, el SO copia los datos de la aplicación a su memoria para que la aplicación pueda reusar su arreglo', b: 0, why: 'Semántica de copia: puede ser la única copia del dato.' },
        { t: 'La controladora del disco guarda las pistas leídas recientemente', b: 1 },
      ] }],
      quiz: [
        { q: '¿Qué diferencia hay entre E/S no bloqueante y asíncrona?', o: ['La no bloqueante devuelve lo que haya; la asíncrona avisa al terminar', 'Son sinónimos: en las dos el proceso sigue ejecutando sin bloquearse', 'La asíncrona bloquea al proceso hasta el aviso y la no bloqueante no', 'La no bloqueante solo existe para dispositivos de bloque, como el disco'], a: 0, e: 'Las dos vuelven enseguida, pero la asíncrona completa la operación y notifica después.' },
        { q: 'En la E/S mapeada en memoria, los registros del dispositivo se acceden con:', o: ['Las mismas instrucciones que la memoria (MOV en x86)', 'Instrucciones especiales IN y OUT', 'Llamadas al sistema read y write desde modo usuario', 'Interrupciones de software'], a: 0, e: 'Los registros aparecen en direcciones de memoria (pero no son RAM). IN/OUT es la E/S dedicada.' },
        { q: '¿Qué es un spool?', o: ['Un búfer para dispositivos que no aceptan flujos intercalados', 'Una caché de los bloques del disco más usados por los procesos', 'La cola de procesos bloqueados esperando un dispositivo de E/S', 'Un driver genérico para dispositivos de bloque e impresoras'], a: 0, e: 'Cada trabajo se guarda completo y se imprime de a uno.' },
        { q: '¿Qué diferencia hay entre un búfer y una caché?', o: ['El búfer puede tener la única copia; la caché, nunca', 'La caché está en el disco y el búfer en la RAM del sistema', 'El búfer se usa solo para lectura y la caché solo para escritura', 'No hay diferencia: son dos nombres de la misma técnica'], a: 0, e: 'Es la distinción de 13.4.3.' },
        { q: '¿Cuáles son los parámetros de ioctl()?', o: ['Descriptor, número de comando y puntero a datos', 'Nombre del archivo del dispositivo, modo de apertura y permisos', 'Número de interrupción, dirección de la ISR y prioridad', 'Número de sector, cantidad de bytes y búfer de destino'], a: 0, e: 'Es la LS para operaciones propias de cada dispositivo.' },
        { q: 'Ante un error permanente de E/S, el objetivo del SO es que:', o: ['No afecte al SO ni a las demás aplicaciones', 'La aplicación que hizo el pedido se termine para proteger el sistema', 'Se reintente la operación indefinidamente hasta que funcione', 'Se reinicie el sistema para recuperar el dispositivo dañado'], a: 0, e: 'Reintentar es para los errores transitorios.' },
        { q: '¿Por qué los drivers se organizan en capas (USB, impresora USB, modelo)?', o: ['Para extraer lo común en cada nivel: modularidad y abstracción', 'Para que cada dispositivo ejecute en un modo de CPU distinto', 'Porque cada capa ejecuta en un núcleo diferente', 'Para que los drivers no necesiten ejecutar en modo kernel'], a: 0, e: 'Lo común a todo USB va una vez; lo común a toda impresora USB, otra; y así.' },
      ],
      open: [{ t: 'text', q: '¿Qué servicios brinda el subsistema de E/S del kernel?', k: [['planificación', 'planificacion'], ['búfer', 'bufer', 'buffer'], ['caché', 'cache'], ['spool', 'cola'], ['errores', 'error']], need: 4, e: 'Planificación de E/S (reordenar los pedidos), almacenamiento en búfer, caché, spooling y reserva de dispositivos, y tratamiento de errores; todo detrás de una interfaz uniforme que abstrae la variedad de dispositivos (y protección de E/S).' }],
    },
    {
      id: 'tp-puertos-es', module: 'es', title: 'TP de puertos de E/S: protocolo, MOV, IN/OUT y sondeo',
      keywords: 'puertos de E/S registros control estado datos 0x320 0x321 0x322 protocolo MOV IN OUT JNZ sondeo polling espera activa mapeada dedicada',
      tldr: 'Un dispositivo se comunica a través de <b>puertos</b>: registros de control, estado y datos que la CPU lee y escribe. El TP lee el sector 500 de un disco ficticio escribiendo en los puertos y esperando en un bucle a que el bit de “listo” se encienda: eso es <b>sondeo</b> (polling), una espera activa.',
      goals: ['Seguir un protocolo de E/S por puertos.', 'Escribir el programa con E/S mapeada y dedicada.', 'Comparar sondeo con interrupciones y DMA.'],
      body: `
<h2>El protocolo del fabricante</h2>
<p>Registros: <b>control</b> en 0x320, <b>estado</b> en 0x321, <b>datos</b> en 0x322. Para leer: poner el número de sector en datos y un 1 en el bit más significativo de control. El disco busca el sector, deja el byte en datos y pone un 1 en el bit menos significativo de estado.</p>
<div class="lab-mount" data-lab="0"></div>
<h2>E/S mapeada en memoria</h2>
${code(`MOV 0x322, 0d500          ; numero de sector en el registro de datos
MOV 0x320, 0b1000_0000    ; bit mas significativo de control: leer
CONTROLAR:
MOV al, 0x321             ; leer el registro de estado
SUB al, 0b0000_0001       ; ¿vale 0000 0001?
JNZ CONTROLAR             ; si no, volver a preguntar (sondeo)
(resto del programa: leer 0x322)`, 'asm')}
<h2>E/S dedicada</h2>
<p>IN y OUT de x86 no aceptan direccionamiento inmediato en el segundo operando (y el primero, solo hasta un byte): los valores pasan primero por registros (DX con el puerto, AL con el dato).</p>
${code(`MOV al, 0d500             ; (el TP lo simplifica: 500 no entra en un byte)
MOV dx, 0x322
OUT dx, al                ; datos <- 500
MOV al, 0b1000_0000
MOV dx, 0x320
OUT dx, al                ; control <- leer
CONTROLAR:
MOV dx, 0x321
IN al, dx                 ; leer estado
SUB al, 0b0000_0001
JNZ CONTROLAR`, 'asm')}
${note('<p><b>Sondeo (polling)</b>: la CPU se dedica exclusivamente a mirar el registro de estado. Es una <b>espera activa</b>: simple y rápida si el dispositivo responde enseguida, pero desperdicia CPU si tarda. Con <b>interrupciones</b>, la CPU hace otra cosa y el dispositivo avisa al terminar (overhead por interrupción). Con <b>DMA</b>, una controladora transfiere bloques enteros a memoria sin la CPU e interrumpe una vez al final (ideal para grandes volúmenes).</p>', 'exam')}`,
      labs: [{ type: 'order', title: 'Ordená el protocolo de lectura', items: ['Escribir el número de sector (500) en el registro de datos (0x322)', 'Escribir 1000 0000 en el registro de control (0x320) para ordenar la lectura', 'Leer el registro de estado (0x321)', 'Si el bit menos significativo no es 1, volver a leer el estado (sondeo)', 'Leer el byte del sector desde el registro de datos (0x322)'], explain: '<p>Si se invierten los dos primeros pasos, el disco empezaría a leer con el número de sector que hubiera en el registro de datos antes (otro sector, basura).</p>' }],
      quiz: [
        { q: '¿Cómo se llama el método en el que la CPU lee repetidamente el registro de estado hasta que el dispositivo está listo?', o: ['Sondeo (polling)', 'Acceso directo a memoria (DMA)', 'E/S por interrupciones', 'Spooling'], a: 0, e: 'Es una espera activa.' },
        { q: '¿Qué pasaría si se invierte el orden de las dos primeras instrucciones del TP?', o: ['Leería otro sector: el que indicara el valor viejo', 'Nada: el disco espera a tener los dos registros escritos para empezar', 'El disco escribiría el sector 500 en lugar de leerlo', 'La CPU generaría una excepción por orden inválido'], a: 0, e: 'La orden de leer se da antes de indicar qué sector.' },
        { q: 'JNZ es un salto:', o: ['Condicional', 'Incondicional', 'Una llamada a subrutina', 'Un salto a la ISR'], a: 0, e: 'Jump if Not Zero.' },
        { q: '¿Por qué en E/S dedicada hay que cargar el puerto en DX antes del OUT?', o: ['Porque IN y OUT no aceptan valores inmediatos ahí', 'Porque DX es el único registro que puede acceder a la memoria', 'Porque cargar DX cambia la CPU a modo kernel', 'Porque el disco solo puede leer el contenido del registro DX'], a: 0, e: 'Es lo que explica el TP: los valores pasan primero por registros.' },
        { q: '¿Cuándo conviene el sondeo frente a las interrupciones?', o: ['Cuando el dispositivo responde casi enseguida', 'Siempre, porque el sondeo no tiene overhead', 'Cuando el dispositivo tarda mucho en responder', 'Cuando hay que transferir bloques grandes de datos'], a: 0, e: 'Si la espera es larga, sondear desperdicia CPU; para bloques grandes, DMA.' },
      ],
      exercises: [
        { official: 'ES.1', level: 1, title: 'Invertir el orden', prompt: '<p>¿Qué pasaría si se invierten las dos primeras instrucciones del primer ejemplo, o los bloques MOV-MOV-OUT del segundo?</p>', solution: { explain: '<p>Se daría la orden de leer antes de escribir el número de sector: el disco leería el sector que indicara el valor previo del registro de datos (otro sector o basura) y el programa obtendría un dato equivocado.</p>' } },
        { official: 'ES.2', level: 1, title: 'Opinión sobre el método', prompt: '<p>El lazo hace que la CPU se dedique exclusivamente a mirar el registro de estado. ¿Qué opina?</p>', solution: { explain: '<p>Es ineficiente si el dispositivo tarda: la CPU queda ocupada sin hacer trabajo útil (y en un SO multiprogramado le quita la CPU a otros procesos). Solo es razonable si la respuesta es casi inmediata.</p>' } },
        { official: 'ES.3', level: 2, title: 'Sondeo contra interrupciones y DMA', prompt: '<p>¿Cómo se llama el método? Compare con los otros métodos de la teoría.</p>', solution: { explain: '<p>Sondeo (polling, E/S programada). Interrupciones: la CPU sigue con otra cosa y el dispositivo avisa; libera la CPU pero cada interrupción tiene overhead. DMA: una controladora mueve bloques entre el dispositivo y la memoria e interrumpe al final; ideal para grandes volúmenes, requiere hardware adicional.</p>' } },
        { official: 'ES.5', level: 2, title: 'Escribir un byte (mapeada)', prompt: '<p>Implemente en assembler x86 la escritura de 1 byte con su protocolo, usando E/S mapeada en memoria.</p>', solution: { explain: `<p>Con un protocolo de ejemplo: datos en 0x322, otro registro 0x323 para el número de sector, bit 6 de control = escribir, bit 1 de estado = listo:</p>${code(`MOV 0x323, 0d500          ; sector destino
MOV 0x322, 0x41           ; byte a escribir ('A')
MOV 0x320, 0b0100_0000    ; orden: escribir
ESPERAR:
MOV al, 0x321
AND al, 0b0000_0010       ; aislar el bit "listo"
JZ ESPERAR                ; si es 0, seguir esperando`, 'asm')}<p>Cada alumno debe definir su propio protocolo (ejercicio 4).</p>` } },
        { official: 'ES.6', level: 1, title: '¿Protocolo secreto o público?', prompt: '<p>¿Es mejor que el protocolo del disco sea secreto o divulgarlo?</p>', solution: { explain: '<p>Divulgarlo (o al menos publicar una interfaz estándar) permite que cualquier SO escriba drivers y aumenta la compatibilidad y el mercado del dispositivo; mantenerlo secreto obliga a que el fabricante escriba todos los drivers y puede proteger su diseño, pero limita dónde se usa. Por eso existen estándares como SATA o NVMe.</p>' } },
        { official: 'ES.7', level: 1, title: 'JNZ', prompt: '<p>¿JNZ es un salto condicional o incondicional?</p>', solution: { explain: '<p>Condicional: salta solo si el resultado de la operación anterior no fue cero.</p>' } },
      ],
    },
  );

  LESSONS.push(
    {
      id: 'discos-y-medios', module: 'almac', title: 'Discos, medios y conexión del almacenamiento',
      keywords: 'HDD disco magnético sector bloque lógico 512 bytes velocidad angular constante tiempo de búsqueda latencia rotacional formateo de bajo nivel físico lógico SSD flash NVMe óptico cinta dispositivo medio conectado al host NAS SAN terciario',
      tldr: 'Un HDD se ve como un <b>vector de bloques lógicos</b> (sectores de 512 B); su tiempo de acceso es <b>búsqueda</b> (mover el brazo) + <b>latencia rotacional</b>. El <b>formateo de bajo nivel</b> (físico) define los sectores; el lógico lo hace el SA. SSD: sin partes móviles, rápido, escrituras limitadas. El almacenamiento puede estar conectado al host, a la red (<b>NAS</b>) o a una red dedicada (<b>SAN</b>).',
      goals: ['Describir el HDD y su tiempo de acceso.', 'Distinguir formateo físico y lógico.', 'Comparar HDD, SSD, ópticos y cintas.', 'Diferenciar almacenamiento conectado al host, NAS y SAN.'],
      body: `
<h2>Disco magnético (HDD)</h2>
<ul>
  <li>Se llama así porque los datos se guardan magnetizando los platos (HDD = hard disk drive, disco rígido).</li>
  <li>Tiene una <b>placa controladora</b> que abstrae los detalles: el disco se ve como un gran <b>vector lineal de bloques lógicos</b> (“grandes matrices unidimensionales de bloques lógicos”), típicamente de <b>512 bytes</b>. Al bloque físico lo llamamos <b>sector</b>. Acceso aleatorio = acceso directo, como en la RAM.</li>
  <li>Velocidad angular constante. Tiempo de acceso = <b>tiempo de búsqueda</b> (mover el brazo al cilindro) + <b>latencia rotacional</b> (esperar que el sector pase bajo la cabeza).</li>
  <li>Bajo costo por GB. Se conecta por un <b>bus de E/S</b> (SATA, SAS, USB…): coincide con la definición de bus del capítulo 13.</li>
</ul>
<h2>Formateo de bajo nivel (12.5.1)</h2>
<p>También <b>formateo físico</b>: grabar en el medio la estructura interna que usa el disco para recuperar los datos, es decir, definir los <b>sectores</b> (depende del fabricante). Cada sector tiene <b>cabecera</b> (con el número de sector), <b>área de datos</b> (típicamente 512 B) y <b>cola</b> con código de corrección de errores (ECC). Decimos “sector de 512 bytes” pero estrictamente incluye los metadatos. Otra vez se divide la memoria en particiones de igual tamaño. El <b>formateo lógico</b> lo hace el SA (capítulo 11): cuando se dice “formatear el disco”, casi siempre es este.</p>
<h2>Otros medios</h2>
${table(['Medio', 'Características'], [
  ['Estado sólido (flash, SSD, NVMe)', 'Sin partes móviles (resiste golpes); menor capacidad que HDD; escrituras limitadas (al final de su vida puede perder datos); alta velocidad; mayor $/GB; trabajan con páginas de 8 KB; se conectan por USB, SATA, PCIe, M.2; pequeños, livianos, poco consumo y calor (ideales para notebooks y móviles)'],
  ['Ópticos (CD, DVD, BR)', 'Velocidad angular constante o variable; una sola pista en espiral; alto tiempo de búsqueda; casi siempre solo lectura o WORM; uso cada vez menor; bajo $/GB; conservan la información mucho más que HDD y flash'],
  ['Cintas magnéticas', 'Baratas y confiables (las cintas, no las lectoras), pero lentas; acceso <b>secuencial</b> y búsqueda muy lenta; para respaldo'],
])}
<p>Distinguir <b>dispositivo</b> y <b>medio</b>: en un HDD vienen juntos; en un CD-ROM, la lectora es el dispositivo y el disco el medio (extraíble).</p>
<h2>Conexión del almacenamiento (reemplaza a 12.3)</h2>
${table(['', 'Qué es', 'Protocolos', 'Qué expone'], [
  ['Conectado al host', 'Usa puertos de E/S locales', 'Viejos (paralelo): IDE, SCSI. Actuales (serie): SATA, USB, SAS, Fibre Channel', '<b>Dispositivos</b>: se pueden particionar y formatear'],
  ['NAS (conectado a la red)', 'Almacenamiento accedido por una red de datos común (Ethernet); varios hosts comparten varios sistemas', 'NFS, CIFS/SMB, iSCSI, Dropbox, Drive, FCoE', '<b>Archivos</b>, como si estuvieran guardados localmente'],
  ['SAN (red de almacenamiento)', 'Como NAS, pero la red se usa <b>exclusivamente</b> para almacenamiento (no para Internet ni NAS)', 'InfiniBand, FC, Myrinet, FCoE sobre red dedicada', '<b>Dispositivos</b>, como si estuvieran conectados localmente'],
])}
${note('<b>Exclusiones del capítulo 12:</b> 12.3 lo reemplaza la diapositiva de conexión. 12.5.2 no va. 12.6 va como parte de memoria virtual. 12.7.5 no va; de 12.7.6, solo el primer párrafo. 12.8 no va. 12.9 (almacenamiento terciario) sí, salvo 12.9.1.3; de 12.9.2.1 los tres primeros y los dos últimos párrafos; 12.9.2.2 y 12.9.2.3 no; 12.9.3 solo su párrafo.', 'warn')}`,
      quiz: [
        { q: 'El tiempo de acceso de un HDD es la suma de:', o: ['El tiempo de búsqueda y la latencia rotacional', 'El tiempo de formateo y el de transferencia', 'La latencia de despacho y el tiempo de búsqueda', 'El tiempo de lectura de la caché y el de escritura'], a: 0, e: 'Mover el brazo al cilindro (búsqueda) y esperar que el sector pase (rotación); después se transfiere.' },
        { q: '¿Qué hace el formateo de bajo nivel?', o: ['Graba la estructura de sectores en el medio', 'Crea el sistema de archivos con sus directorios iniciales', 'Crea la tabla de particiones y el MBR', 'Borra los archivos dejando el SA intacto'], a: 0, e: 'Es el formateo físico, del fabricante. El SA lo crea el formateo lógico.' },
        { q: 'Un NAS expone a los hosts:', o: ['Archivos, accedidos por una red de datos común', 'Dispositivos que se pueden particionar, por una red dedicada', 'Dispositivos conectados a puertos locales', 'Bloques de memoria compartida'], a: 0, e: 'Una SAN, en cambio, expone dispositivos por una red exclusiva para almacenamiento.' },
        { q: '¿Qué diferencia una SAN de un NAS?', o: ['La SAN usa una red exclusiva y expone dispositivos', 'La SAN usa la Ethernet común y expone archivos', 'La SAN solo admite un host por cada dispositivo', 'La SAN es más lenta porque comparte la red con Internet'], a: 0, e: 'Red exclusiva y dispositivos (se pueden particionar y formatear como si fueran locales).' },
        { q: 'Una desventaja de los SSD frente a los HDD es:', o: ['Escrituras limitadas', 'El tiempo de búsqueda del brazo', 'Mayor sensibilidad a los golpes', 'Mayor latencia rotacional'], a: 0, e: 'No tienen partes móviles (ni búsqueda ni rotación) y resisten golpes; a cambio, las celdas se gastan y cuestan más por GB.' },
        { q: '¿Qué tipo de acceso tienen las cintas magnéticas?', o: ['Secuencial', 'Directo (aleatorio)', 'Indexado', 'Asociativo'], a: 0, e: 'Para llegar a un dato hay que pasar por los anteriores: búsqueda muy lenta.' },
      ],
    },
    {
      id: 'planificacion-de-disco', module: 'almac', title: 'Planificación de disco',
      keywords: 'planificación de disco cola de pedidos FCFS noop SSTF SCAN ascensor elevador C-SCAN LOOK C-LOOK movimiento total cilindros inanición selección de algoritmo',
      tldr: 'La CPU genera más pedidos de los que el disco puede atender: se encolan y se pueden <b>reordenar</b> según la estructura del dispositivo. <b>FCFS</b> (noop en Linux), <b>SSTF</b> (el más cercano; puede causar inanición), <b>SCAN</b> (ascensor), <b>C-SCAN</b> (vuelve al principio sin atender) y sus versiones <b>LOOK</b> y <b>C-LOOK</b>, que no llegan a los extremos.',
      goals: ['Calcular el movimiento total de cabeza para cada algoritmo.', 'Comparar los algoritmos y elegir según el medio.'],
      body: `
<p>Hay una cola de pedidos <b>por dispositivo</b>. Planificar es elegir el orden que mejore el desempeño del sistema. No es la única planificación de E/S: impresoras e interfaces de red también se benefician de reordenar. La geometría real del disco está oculta por la controladora, pero suele aproximarse al vector de bloques: cilindros cercanos ⇒ búsqueda corta.</p>
${table(['Algoritmo', 'Atiende', 'Comentario'], [
  ['FCFS (noop en Linux)', 'En orden de llegada', 'Justo pero sin optimizar; ideal para medios sin búsqueda (SSD) o secuenciales'],
  ['SSTF', 'El pedido más cercano a la cabeza', 'Mucho mejor que FCFS, pero puede causar <b>inanición</b> de pedidos lejanos'],
  ['SCAN (ascensor)', 'Barre en un sentido hasta el <b>extremo</b> del disco y vuelve atendiendo', 'Los del extremo opuesto esperan más'],
  ['C-SCAN', 'Barre en un sentido hasta el extremo, vuelve al principio <b>sin atender</b> y sigue', 'Espera más uniforme'],
  ['LOOK y C-LOOK', 'Como SCAN y C-SCAN, pero solo hasta el último pedido de cada sentido', 'SCAN y C-SCAN “no se implementan” porque obligan a llegar al extremo aunque no haya pedidos'],
])}
<div class="lab-mount" data-lab="0"></div>
<h2>Elegir (12.4.6)</h2>
<ul>
  <li>SSTF es común y natural; SCAN y C-SCAN rinden mejor con mucha carga (no hay inanición).</li>
  <li>Depende de la cantidad y tipo de pedidos, y del <b>método de asignación de archivos</b> (11.4): un archivo contiguo genera pedidos cercanos; uno enlazado o indexado, dispersos. Releer 12.4.6 después de ver métodos de asignación.</li>
  <li>Para una <b>cinta</b> (secuencial), lo razonable es atender en el orden en que pasan por la cabeza (un único barrido, como SCAN/LOOK en un sentido).</li>
  <li>Puede influir el tipo de pedido: lecturas que bloquean a un proceso, paginación (más prioridad que la E/S de aplicaciones), escrituras diferibles.</li>
  <li>Los algoritmos están modularizados: son un ejemplo de “drivers” que no son de hardware (Linux permite cambiar el planificador de cada disco).</li>
</ul>`,
      labs: [{ type: 'disk', title: 'Planificación de disco', intro: 'El ejemplo de Silberschatz: cola 98, 183, 37, 122, 14, 124, 65, 67; cabeza en 53; cilindros 0 a 199. En C-SCAN y C-LOOK se informa el total con y sin el regreso.', reqs: '98 183 37 122 14 124 65 67', head: 53, max: 199, dir: 'down', algo: 'fcfs' }],
      quiz: [
        { q: 'Cola 98, 183, 37, 122, 14, 124, 65, 67 y cabeza en 53. ¿Cuál es el movimiento total con FCFS?', o: ['640 cilindros', '236 cilindros', '208 cilindros', '322 cilindros'], a: 0, e: '45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = 640 (ejemplo de Silberschatz).' },
        { q: 'Con los mismos datos, ¿qué pedido atiende primero SSTF?', o: ['65', '98', '37', '67'], a: 0, e: '65 está a 12 cilindros de 53; 37 a 16.' },
        { q: '¿Qué algoritmo puede causar inanición?', o: ['SSTF', 'FCFS', 'C-SCAN', 'SCAN'], a: 0, e: 'Si siguen llegando pedidos cercanos a la cabeza, uno lejano puede esperar indefinidamente.' },
        { q: '¿Qué diferencia a LOOK de SCAN?', o: ['LOOK no llega a los extremos del disco', 'LOOK vuelve al principio sin atender pedidos en el regreso', 'LOOK atiende siempre el pedido más cercano a la cabeza', 'LOOK atiende los pedidos en orden de llegada'], a: 0, e: 'Por eso SCAN “no se implementa”: hace viajes inútiles a los extremos.' },
        { q: 'En C-SCAN, al llegar al final del disco, la cabeza:', o: ['Vuelve al principio sin atender y sigue igual', 'Cambia de sentido y atiende los pedidos que encuentra de vuelta', 'Se queda en el extremo esperando nuevos pedidos', 'Atiende el pedido más cercano a ese extremo'], a: 0, e: 'Trata los cilindros como una lista circular: tiempos de espera más uniformes.' },
        { q: '¿Qué algoritmo conviene para un SSD?', o: ['FCFS (noop)', 'SSTF', 'SCAN', 'C-LOOK'], a: 0, e: 'Sin partes móviles no hay búsqueda ni rotación que optimizar.' },
      ],
      open: [{ t: 'num', q: 'Cola 98, 183, 37, 122, 14, 124, 65, 67; cabeza en 53. Movimiento total con SSTF:', a: 236, u: 'cilindros', e: '53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183: 12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = 236.' }],
    },
    {
      id: 'raid', module: 'almac', title: 'RAID 0, 1, 1+0 y 5',
      keywords: 'RAID redundant array inexpensive independent disks stripping striping espejado mirroring paridad distribuida tolerancia a fallas capacidad 1+0 10 MD',
      tldr: '<b>RAID</b> combina varios discos que se ven como uno solo, para más capacidad, <b>tolerancia a fallas</b> o velocidad. <b>RAID 0</b> divide (striping): rápido, sin redundancia. <b>RAID 1</b> espeja: redundancia, 1/n del espacio. <b>RAID 1+0</b> suma las ventajas (mínimo 4 discos). <b>RAID 5</b> divide y agrega paridad distribuida: tolera perder 1 disco, usa n − 1.',
      goals: ['Calcular capacidad útil y tolerancia de cada nivel.', 'Elegir un nivel según la necesidad.'],
      body: `
<p>Redundant Array of Inexpensive (hoy, Independent) Disks. Se puede hacer por <b>hardware o software</b> (en Linux, el driver MD), conectado al host, en NAS o en SAN, y el arreglo se presenta como un único medio (abstracción). Solo se estudian los niveles <b>0, 1, 1+0 y 5</b> (2, 3 y 4 no se usan; sirven para entender la evolución a 5 y 6). Repaso: el sector de un HDD suele tener 512 B y el bloque de SA 4 KB.</p>
${table(['Nivel', 'Cómo', 'Espacio útil (n discos)', 'Tolera', 'Rendimiento'], [
  ['0 (stripping)', 'Divide los datos entre 2 o más discos; pide una parte a cada uno en paralelo', '100 %', '<b>Ninguna</b> falla: perder un disco es perder todo', 'Mejor lectura y escritura'],
  ['1 (mirroring)', 'n copias idénticas (espejado)', '1/n (50 % con 2)', 'n − 1 discos', 'Lectura mejor, escritura igual'],
  ['1+0 (10)', 'Espeja como RAID 1 y divide como RAID 0: dos niveles superpuestos (hay que configurar dos RAID); mínimo y usual: 4 discos', '50 % (2/n·n/2)', 'Al menos 1 (uno por espejo)', 'Suma las ventajas de 0 y 1'],
  ['5 (paridad distribuida)', 'Stripping más un bloque de paridad, repartido entre todos los discos, con el que se recupera un disco perdido; mínimo 3', 'n − 1 discos (66 % o más)', '1 disco', 'Buena lectura; escritura con costo de paridad'],
])}
<p>También existe 0+1 (divide y después espeja). El driver MD de Linux puede combinar espejado y striping en un mismo arreglo, incluso con solo 2 discos o particiones.</p>
<div class="lab-mount" data-lab="0"></div>
<h2>¿Por qué RAID hoy?</h2>
<p>Ya no es tanto por ahorro (1 HDD de 20 TB contra 6 de 4 TB) sino para cumplir necesidades de capacidad (no existe un disco de 500 TB) y seguridad de los datos, considerando también consumo de energía y espacio físico en servidores. RAID 0 tiene sentido cuando importa la velocidad y los datos se pueden perder o están respaldados (un disco de trabajo temporal, render).</p>`,
      labs: [{ type: 'calc', title: 'Capacidad y tolerancia de un arreglo', fields: [{ id: 'lv', label: 'Nivel', options: ['0', '1', '10', '5'], value: '5' }, { id: 'n', label: 'Discos', value: 4 }, { id: 'tb', label: 'Capacidad de cada disco (TB)', value: 4 }],
        run: (v) => { const n = Math.round(v.n); const r = so.raid(v.lv, n); if (n < r.min) return `RAID ${v.lv} necesita al menos ${r.min} discos.`; if (v.lv === '10' && n % 2) return 'RAID 1+0 necesita una cantidad par de discos.'; return `Espacio útil: ${num(r.usable * v.tb)} TB de ${num(n * v.tb)} TB (${num((r.usable / n) * 100, 1)} %)\nDiscos que pueden fallar sin perder datos: ${r.tolerates}${v.lv === '10' ? ' en el peor caso (más si fallan en espejos distintos)' : ''}`; } }],
      quiz: [
        { q: '¿Qué nivel de RAID no tiene redundancia?', o: ['RAID 0', 'RAID 1', 'RAID 5', 'RAID 1+0'], a: 0, e: 'RAID 0 solo divide los datos: perder un disco es perder todo.' },
        { q: 'Con 4 discos de 2 TB en RAID 5, ¿cuánto espacio útil hay?', o: ['6 TB', '8 TB', '4 TB', '2 TB'], a: 0, e: 'n − 1 discos: 3 × 2 = 6 TB.' },
        { q: '¿Cuántos discos como mínimo requiere RAID 5?', o: ['3', '2', '4', '5'], a: 0, e: 'Dos de datos y la paridad, distribuida.' },
        { q: 'Con RAID 1 de 3 discos, ¿cuántos pueden fallar sin perder datos?', o: ['2', '1', '0', '3'], a: 0, e: 'Hay 3 copias idénticas: alcanza con que sobreviva una (espacio útil 1/3).' },
        { q: 'RAID 1+0 con 4 discos de 1 TB ofrece:', o: ['2 TB útiles, con redundancia y striping', '4 TB útiles, sin redundancia', '3 TB útiles, con paridad distribuida', '1 TB útil, con 3 copias del disco'], a: 0, e: 'Dos espejos (redundancia) divididos en striping: 50 % del espacio.' },
        { q: '¿Para qué se usa RAID hoy principalmente?', o: ['Por capacidad y seguridad de los datos', 'Para ahorrar dinero comprando discos baratos', 'Para reemplazar los respaldos periódicos', 'Para reducir el consumo de energía del servidor'], a: 0, e: 'Un RAID no reemplaza un respaldo: protege contra la falla de un disco, no contra borrar un archivo.' },
      ],
      open: [{ t: 'num', q: '5 discos de 4 TB en RAID 5: ¿cuántos TB útiles hay?', a: 16, u: 'TB', e: '(5 − 1) × 4 = 16 TB.' }],
    },
  );
})();
