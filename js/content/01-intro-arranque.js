/* Primer parcial: el SO y la materia (clases 0.1 y 1.0), arranque de una PC e instalación (clases 0.2 y 0.3). */
(() => {
  const { h, LESSONS } = window.GUIDE;
  const { note, table, def, flow, code } = h;

  LESSONS.push(
    {
      id: 'que-es-un-so', module: 'intro', title: '¿Qué es un sistema operativo?',
      keywords: 'kernel núcleo definición residente funciones objetivos programas del sistema sistema informático componentes',
      tldr: 'Para la cátedra, el SO es el <b>kernel</b>: el primer programa residente, que ejecuta en el modo de mayor privilegio de la CPU. Tiene tres funciones: administrar recursos, ser interfaz para los programas (API) e interfaz para el usuario. Los programas del sistema (shell, explorador, GUI) <b>no</b> son parte del SO.',
      goals: ['Definir SO con las palabras de la cátedra y distinguirlo de los programas del sistema.', 'Enumerar las tres funciones generales y los objetivos de un SO.', 'Ubicar el SO entre los cuatro componentes del sistema informático.'],
      body: `
<h2>Por qué existen los sistemas operativos</h2>
<p>Las primeras computadoras programables eran carísimas: había que <b>maximizar la utilización</b> de cada recurso. De ahí nace un software <b>residente</b> que ayuda a administrar el hardware. Residente quiere decir que se carga en RAM y queda ahí; los programas no residentes están hechos para terminar y liberar la RAM (y aun sin terminar pueden ser desalojados, como se verá en memoria virtual).</p>
<p>Un programa usa CPU y E/S <b>de a ratos</b> (ráfagas): mientras espera un disco, la CPU queda ociosa. Esa ociosidad es la oportunidad que aprovecha el SO. La analogía de la cátedra: el SO es como el <b>chofer de un taxi</b>; los pasajeros (programas) no manejan el auto (hardware), le piden al chofer.</p>
<p>Los primeros SO para PC tenían otro objetivo: hacer <b>sencilla</b> la utilización y la programación de la computadora. Hoy hay computadoras caras y baratas, y casi todas tienen SO, para optimizar recursos y por otros motivos (seguridad, compatibilidad).</p>

<h2>Definición de la cátedra</h2>
${def('Sistema operativo', 'Es el primer programa residente (kernel), que ejecuta en el modo de mayor privilegio de una CPU.', 'Diapositivas, Unidad 1')}
<p>Tres funciones generales (las primeras líneas del capítulo 1 de Silberschatz):</p>
${flow('Administración de recursos de SW y HW', 'Interfaz para los programas (API: las llamadas al sistema)', 'Interfaz para el usuario')}
${note('<p><b>Lo que más se pregunta.</b> En sentido amplio, muchos llaman SO también al explorador de archivos, a la interfaz gráfica o al intérprete de comandos. <b>En esta materia no.</b> Esos son <b>programas del sistema</b> (Silberschatz 1.1.3 y 2.5): sin ellos sería muy difícil administrar la computadora, pero no son el kernel.</p>', 'exam')}

<h2>¿Qué hace un SO?</h2>
<ul>
  <li><b>Controla y administra recursos</b> lógicos y físicos: se hace “único dueño y administrador”, asigna recursos a los programas y controla su ejecución, con objetivos y algoritmos que dependen del propósito (servidor, embebido, móvil, escritorio, tiempo real).</li>
  <li><b>Es interfaz con el hardware</b>: para los programas (<code>printf("hola\\n")</code> no sabe qué placa de video hay) y para los usuarios (un archivo es igual en OneDrive, en un HDD o en un pen drive). Incluye el <b>manejo de errores</b>.</li>
  <li><b>Simplifica</b> el desarrollo, la depuración y la distribución de software, y la utilización del hardware.</li>
</ul>

<h2>Objetivos generales</h2>
<ol>
  <li>Ejecutar programas de usuario y facilitar la resolución de sus problemas.</li>
  <li>Hacer que el sistema de computación sea cómodo de usar.</li>
  <li>Hacerlo más fácil de programar y brindar compatibilidad.</li>
  <li>Utilizar el hardware de manera eficiente <b>según su propósito</b>.</li>
  <li>Brindar seguridad y confiabilidad.</li>
  <li><b>Consumir pocos recursos para sí mismo</b>: poco almacenamiento y pocas instrucciones de CPU por tarea (todo lo que gasta el SO es overhead).</li>
</ol>

<h2>El SO en el sistema informático</h2>
${table(['Componente', 'Qué es', 'Ejemplos'], [
  ['Hardware', 'Recursos de computación básicos', 'CPU, memoria, dispositivos de E/S'],
  ['Sistema operativo', 'Controla y coordina el uso del hardware según el propósito del sistema', 'El kernel de Linux, de Windows'],
  ['Programas / aplicaciones', 'Definen cómo se usan los recursos para resolver los problemas de los usuarios. Incluyen los programas del sistema', 'Procesador de texto, compilador, navegador, base de datos, juegos; shell, explorador'],
  ['Usuarios', 'Quienes usan la computadora', 'Personas, pero también otras máquinas u otras computadoras'],
])}
<p>Para cumplir sus objetivos, el SO tiene que <b>apropiarse del hardware</b>: “los pasajeros no pueden manejar el colectivo”. Cómo lo logra es el tema de las próximas lecciones: contexto de ejecución, interrupciones, modos de operación y llamadas al sistema.</p>

<h2>Aclaración sobre “la CPU hace…”</h2>
<p>En Arquitectura, “la CPU hace X” se refiere a funciones cableadas o microprogramadas. En SO, en cambio, suele querer decir que la CPU está <b>ejecutando instrucciones de un programa</b> que hacen X. Cuando sea lo primero, la cátedra dice que la CPU lo hace <b>“automáticamente”</b> (por ejemplo, guardar el PC al llegar una interrupción); si no, hay instrucciones detrás (por ejemplo, un sondeo o una espera). También se usa “CPU” y “núcleo” como si la CPU tuviera un solo núcleo.</p>`,
      quiz: [
        { q: 'Según la cátedra, ¿cuál de estos es parte del sistema operativo?', o: ['El planificador de procesos que corre en modo kernel', 'El intérprete de comandos bash, que ejecuta las órdenes del usuario', 'El explorador de archivos que muestra el contenido de los discos', 'El entorno gráfico (GNOME, KDE) que dibuja ventanas y escritorio'], a: 0, e: 'Para la materia el SO es el kernel. bash, el explorador y la GUI son programas del sistema (1.1.3 y 2.5): muy útiles, pero ejecutan en modo usuario y no son el SO.' },
        { q: '¿Qué significa que el SO sea un programa “residente”?', o: ['Que se carga en RAM y permanece ahí mientras la computadora funciona', 'Que está grabado en la memoria ROM del motherboard', 'Que reside en el disco y se carga cada vez que un programa lo llama', 'Que ejecuta siempre en el mismo núcleo de la CPU'], a: 0, e: 'Residente = queda cargado en memoria. Los programas no residentes terminan y liberan la RAM. El firmware (no el SO) es el que está en flash/EEPROM.' },
        { q: '¿Cuál NO es una de las tres funciones generales de un SO?', o: ['Proveer las aplicaciones del usuario', 'Administrar los recursos de hardware y de software del sistema informático', 'Ser interfaz para los programas, mediante las llamadas al sistema', 'Ser interfaz para el usuario'], a: 0, e: 'Las tres funciones son administración de recursos, interfaz para programas (API) e interfaz para el usuario. Las aplicaciones son otro componente del sistema informático.' },
        { q: 'Entre los objetivos de un SO figura “consumir pocos recursos para sí mismo”. ¿Por qué?', o: ['Porque lo que consume el SO es overhead: no va a las tareas de los usuarios', 'Porque el kernel tiene que entrar completo en la memoria caché de la CPU para poder ejecutar', 'Porque mientras el SO usa la CPU no puede haber multiprogramación en el sistema', 'Porque las licencias de los SO comerciales se cobran según el consumo de CPU'], a: 0, e: 'El SO es necesario pero no hace el trabajo del usuario: su consumo es overhead. Por eso debe ser pequeño y eficiente (mínimas instrucciones por tarea).' },
        { q: 'En la analogía del taxi, ¿qué representa el chofer?', o: ['El sistema operativo', 'La CPU', 'El usuario', 'El programa de aplicación'], a: 0, e: 'El auto es el hardware, los pasajeros son los programas: no manejan, le piden al chofer (SO) que los lleve.' },
        { q: '¿Cuál de estos es un usuario del sistema informático según Silberschatz?', o: ['Personas, pero también máquinas u otras computadoras', 'Solo las personas que tienen una cuenta registrada en el sistema', 'Solo el administrador (root), que es quien controla el hardware', 'Solo los programas de aplicación que piden servicios al SO'], a: 0, e: 'Usuarios son personas, pero también máquinas u otras computadoras que usan el sistema.' },
        { q: 'Cuando en SO se dice “la CPU hace tal cosa automáticamente”, se quiere decir que:', o: ['Es una función cableada o microprogramada, sin un programa detrás', 'Es una tarea que hace el kernel por su cuenta, sin intervención del usuario', 'La CPU ejecuta un bucle de sondeo (polling) programado por el SO', 'La tarea la hace el planificador de corto plazo, sin pedirle nada al usuario'], a: 0, e: 'Es la convención de la cátedra: “automáticamente” = interno de la CPU. Si hay instrucciones de un programa (un sondeo, una espera), no se dice automáticamente.' },
      ],
      open: [
        { t: 'text', q: 'Definí sistema operativo como lo hace la cátedra y explicá por qué el intérprete de comandos no forma parte de él.', k: [['primer programa residente', 'residente'], ['kernel', 'núcleo'], ['mayor privilegio', 'modo kernel', 'modo privilegiado'], ['programa del sistema', 'programas del sistema']], e: 'El SO es el primer programa residente (el kernel), que ejecuta en el modo de mayor privilegio de la CPU. El intérprete de comandos es un programa del sistema: ejecuta en modo usuario y pide servicios al kernel mediante llamadas al sistema, como cualquier otro programa.' },
        { t: 'text', q: '¿Cuáles son las tres funciones generales de un SO?', k: [['administración de recursos', 'administrar recursos', 'administra recursos'], ['interfaz para programas', 'interfaz para los programas', 'api', 'llamadas al sistema'], ['interfaz para el usuario', 'interfaz de usuario', 'interfaz hacia el usuario']], e: 'Administración de recursos de software y hardware, interfaz para los programas (API, llamadas al sistema) e interfaz para el usuario.' },
      ],
      sources: [{ title: 'Silberschatz, Fundamentos de SO (7.ª ed.), capítulo 1', ref: 'Leer hasta 1.3.2, luego 1.5; 1.11 y 1.13', points: ['1.1 (qué hace un SO) y 1.1.3 (definición), con la aclaración de la cátedra sobre los programas del sistema.', '1.6 en adelante no va, salvo 1.11 (sistemas de propósito general) y 1.13 (resumen).', 'Se recomienda ver primero video y diapositivas y después el libro.'] }],
    },
    {
      id: 'vocabulario-de-base', module: 'intro', title: 'Vocabulario de base: sistemas, overhead, caché y localidad',
      keywords: 'sistema ingeniería parámetros criterios overhead cuello de botella eficiencia cache buffer frame buffer localidad de referencias propósito general específico embebido tiempo real software programa',
      tldr: 'La materia usa todo el tiempo un puñado de conceptos de ingeniería: sistema, parámetro y criterio, <b>overhead</b>, cuello de botella, caché y búfer, <b>localidad de las referencias</b>. Conviene tenerlos claros desde el principio: aparecen en cada capítulo.',
      goals: ['Definir sistema, análisis de sistemas e ingeniería como lo hace la cátedra.', 'Distinguir overhead, cuello de botella y eficiencia.', 'Diferenciar caché de búfer y explicar la localidad de las referencias.'],
      body: `
<h2>Sistemas, análisis e ingeniería</h2>
<ul>
  <li><b>Sistema</b>: conjunto de partes relacionadas entre sí para cumplir un propósito. Un SO es un sistema de información complejo.</li>
  <li><b>Análisis de sistemas</b>: observar un sistema para identificar sus partes, relaciones y propósito.</li>
  <li><b>Ingeniería</b>: uso de los conocimientos y herramientas disponibles para resolver problemas; estudio de recursos y restricciones orientado a un objetivo práctico.</li>
  <li>El <b>técnico</b> se especializa en una herramienta y ejecuta tareas; el <b>ingeniero</b> mantiene, mejora, analiza, desarrolla e implementa sistemas y procesos complejos.</li>
</ul>
<p>¿Para qué estudiar el interior de un SO si nunca vamos a escribir uno? Porque es <b>experiencia previa</b> de un sistema complejo: punteros, estructuras de datos, concurrencia, recursos; criterios de diseño de software eficiente; y simplifica aprender las herramientas de administración.</p>

<h2>Parámetros y criterios</h2>
<p>Para evaluar resultados y comparar soluciones hacen falta <b>parámetros</b> (valores que se observan) y <b>criterios</b> (reglas para decidir con ellos). Los parámetros comunes en ingeniería, que vuelven en toda la materia: tiempo, dinero, tamaño, energía, calor, complejidad, escalabilidad, facilidad de mantenimiento y seguridad.</p>

<h2>Overhead, cuello de botella y eficiencia</h2>
${def('Overhead', 'Todo trabajo o recurso que es necesario para poder realizar una tarea o actividad, pero que no aporta directamente a ella.', 'Diapositivas, Unidad 1. Ejemplos: lavar los platos antes o después de comer, ir hasta la puerta para atender el timbre, el espacio extra para clasificar la ropa.')}
<ul>
  <li><b>Cuello de botella</b>: el recurso que limita el rendimiento del conjunto; mejorar otra cosa no acelera el sistema.</li>
  <li><b>Eficiencia</b>: relación entre el trabajo útil y los recursos consumidos. Menos overhead, más eficiencia.</li>
</ul>
<p>En SO son overhead: las interrupciones, el retorno de una función, las llamadas al sistema, el cambio de contexto, el planificador. Todas son necesarias, ninguna hace el trabajo del usuario.</p>

<h2>Caché, búfer y localidad</h2>
${table(['Concepto', 'Qué es', 'Para qué'], [
  ['Caché', 'Memoria pequeña y rápida que guarda una <b>copia</b> de datos que están en otro lugar más lento', 'Acelerar accesos repetidos'],
  ['Búfer', 'Área de memoria que guarda datos <b>en tránsito</b> entre dos dispositivos o procesos (puede ser la única copia)', 'Compensar diferencias de velocidad o de tamaño de transferencia (13.4.2)'],
  ['Frame buffer', 'Búfer de la placa de video con la imagen que se muestra en pantalla', 'Desacoplar quien dibuja de quien muestra'],
])}
${def('Localidad de las referencias', 'Los programas tienden a acceder a direcciones cercanas a las que accedieron recientemente (localidad espacial) y a volver a acceder a las mismas direcciones (localidad temporal).', 'Es lo que hace que una caché pequeña tenga gran influencia en el desempeño.')}
${note('La localidad vuelve en el TP de C (recorrer una matriz por filas o por columnas), en memoria virtual (conjunto de trabajo) y en los bloques de un sistema de archivos. Ver el laboratorio de caché en la lección del TP 2.', 'tip')}

<h2>Tipos de sistemas (Silberschatz 1.11)</h2>
<ul>
  <li><b>Propósito general</b>: hacen muchas cosas distintas (una PC).</li>
  <li><b>Propósito específico</b>: hechos para una tarea (un router, un lavarropas).</li>
  <li><b>Embebidos</b>: computadoras dentro de otros aparatos, con funciones limitadas y casi sin interfaz de usuario.</li>
  <li><b>Tiempo real</b>: tienen restricciones de tiempo bien definidas; una respuesta correcta pero tardía es una falla.</li>
</ul>

<h2>Software, programa, memoria principal</h2>
<p><b>Programa</b>: conjunto de instrucciones para la CPU (en un archivo ejecutable, entidad pasiva). <b>Software</b> es más amplio: programas, datos, documentación, configuración. Para ejecutarse, las instrucciones tienen que estar en <b>memoria principal</b>: la memoria principal y los registros son el único almacenamiento al que la CPU accede directamente (Silberschatz 8.1).</p>`,
      quiz: [
        { q: '¿Cuál de estos es overhead para un programa que imprime un informe?', o: ['El tiempo de pasar a modo kernel y volver en cada llamada al sistema', 'El tiempo que la impresora tarda en imprimir todas las páginas del informe', 'El cálculo de los subtotales y totales que aparecen en el informe', 'La lectura desde el disco de los datos que van en el informe'], a: 0, e: 'Overhead es lo necesario que no aporta directamente a la tarea. Imprimir, calcular y leer los datos son la tarea misma; el cambio de modo es el “peaje” para pedirle algo al SO.' },
        { q: '¿Qué diferencia principal hay entre una caché y un búfer?', o: ['La caché guarda una copia; el búfer puede tener la única copia de datos en tránsito', 'La caché siempre es de hardware y el búfer siempre es un área de software del SO', 'El búfer es más rápido que la caché porque está más cerca de la CPU', 'La caché solo se usa para la E/S de disco y el búfer solo para la red'], a: 0, e: 'Es la distinción de Silberschatz 13.4.3: una caché contiene una copia de un dato que reside en otro lado; un búfer puede contener la única copia existente del dato.' },
        { q: '¿Qué hace posible que una memoria caché pequeña mejore mucho el desempeño?', o: ['La localidad de las referencias', 'Que la caché esté dentro del disco', 'Que la caché sea no volátil', 'El tamaño de la página de memoria virtual'], a: 0, e: 'Como los programas reusan direcciones recientes y cercanas, unos pocos datos copiados en caché resuelven la mayoría de los accesos.' },
        { q: 'Un sistema que controla los frenos ABS de un auto, donde responder tarde equivale a fallar, es un ejemplo de sistema:', o: ['Embebido de tiempo real', 'De propósito general con prioridad alta', 'De tiempo compartido interactivo', 'Por lotes con plazos fijos'], a: 0, e: 'Está dentro de otro aparato (embebido) y tiene restricciones de tiempo estrictas (tiempo real).' },
        { q: '¿Qué es un cuello de botella?', o: ['El recurso que limita el rendimiento de todo el sistema', 'Todo el trabajo que no aporta directamente a la tarea', 'El tiempo que un proceso espera en la cola de listos', 'Una zona de memoria compartida entre dos procesos'], a: 0, e: 'El cuello de botella limita al conjunto: mejorar otros componentes no acelera el sistema. “Todo el trabajo que no aporta directamente a la tarea” es la definición de overhead, no de cuello de botella.' },
        { q: '¿Dónde deben estar las instrucciones de un programa para que la CPU las ejecute?', o: ['En memoria principal (RAM)', 'En el disco, en el archivo ejecutable', 'En la caché de disco', 'En la tabla de particiones'], a: 0, e: 'La CPU solo accede directamente a sus registros y a la memoria principal (8.1). El ejecutable en disco hay que cargarlo primero.' },
      ],
      open: [
        { t: 'text', q: 'Definí overhead y dá un ejemplo dentro de un sistema operativo.', k: [['necesario', 'necesita', 'hace falta'], ['no aporta directamente', 'no aporta', 'no contribuye'], ['interrupción', 'llamada al sistema', 'cambio de contexto', 'planificador', 'retorno', 'cambio de proceso']], e: 'Overhead es todo trabajo o recurso necesario para realizar una tarea pero que no aporta directamente a ella. En un SO: el cambio de contexto al atender una interrupción, el paso a modo kernel de una llamada al sistema o el tiempo del planificador.' },
        { t: 'text', q: '¿Qué es la localidad de las referencias y por qué importa?', k: [['direcciones cercanas', 'cercanas', 'espacial'], ['recientemente', 'mismas direcciones', 'temporal'], ['caché', 'cache']], e: 'Es la tendencia de los programas a acceder a direcciones cercanas a las usadas (espacial) y a volver a usar las mismas (temporal). Es lo que hace efectiva una caché pequeña y, más adelante, la memoria virtual.' },
      ],
      sources: [{ title: 'Diapositivas 0.1 y 1.0 (tarea de conceptos iniciales)', points: ['Software y programa; función y biblioteca; interfaz, API y driver; caché, búfer y frame buffer; localidad de las referencias; CI, bus, E/S, CPU; overhead, cuello de botella y eficiencia; sistemas de propósito general, específico, embebidos y de tiempo real (1.11).', 'Leer 8.1 y los dos primeros párrafos de 8.1.1; segundo párrafo de 8.3 (vector de interrupciones).'] }],
    },
    {
      id: 'reglas-de-la-catedra', module: 'intro', title: 'Cómo se aprueba: parciales, regularidad y promoción',
      keywords: 'regularidad aprobación directa promoción parciales recuperación final por partes examen final redondeo',
      tldr: 'Las reglas de la primera clase también se estudian (y el TP 2 pide programarlas). Cuatro parciales; promoción con 6 o más en cada uno y promedio 7, <b>sin redondeo</b>; una nota menor a 4 en cualquier instancia (aun en recuperación) hace perder la promoción.',
      goals: ['Calcular la condición de un alumno a partir de sus notas.', 'Conocer las condiciones del final por partes y del final tradicional.'],
      body: `
<h2>Parciales y recuperaciones</h2>
<ul>
  <li>Cuatro parciales (2026: 16/5, 4/7, 17/10 y 28/11) y dos fechas de recuperación (5/12 y 12/12). En cada recuperación se elige qué parciales recuperar; se puede rendir el mismo parcial en ambas. Las dos sirven para aprobación directa.</li>
  <li>Hay que <b>inscribirse</b> en cada parcial o recuperación; no hacerlo a tiempo tiene penalización en el puntaje.</li>
  <li>La nota de cada instancia es <b>la más reciente</b>. No hay trabajos extra para “levantar nota”.</li>
  <li>Los exámenes se pueden revisar hasta 2 semanas después de publicadas las notas.</li>
</ul>
<h2>Regularidad</h2>
<ul>
  <li>Estar presente en al menos <b>2 parciales originales</b> (no recuperaciones).</li>
  <li>Calificación mínima en los cuatro parciales o sus recuperaciones (ver la nota de abajo).</li>
  <li>Requisitos de los prácticos (asistencia, TPs) y correlatividades.</li>
</ul>
${note('<p><b>Ojo con el material.</b> La diapositiva de regularidad dice “calificación mínima de 6,00”, pero el ejemplo de la misma clase dice que con 3,5; 10; 10; 10 “para poder regularizar, deberá recuperar el 1er parcial y obtener mínimamente 4”. Consultá con tu docente cuál vale; el laboratorio te deja elegir.</p>', 'warn')}
<h2>Aprobación directa (promoción)</h2>
<ol>
  <li>Cumplir la regularidad y presentarse a los <b>4 parciales originales</b>.</li>
  <li>Nota mínima <b>6,00</b> en cada parcial (original o recuperación) y <b>promedio mínimo 7,00</b>.</li>
  <li>Una nota <b>menor a 4</b> en cualquier parcial, <b>incluidas las recuperaciones</b>, hace perder la regularidad y la promoción; se puede regularizar recuperando, pero ya no promocionar.</li>
  <li><b>Sin redondeo</b>: 3,50 no es 4; 5,90 no es 6; 6,875 no es 7.</li>
</ol>
${table(['Notas', 'Condición', 'Por qué'], [
  ['3,5; 10; 10; 10', 'Libre (puede regularizar recuperando el 1.º con 4 o más)', 'Tiene un parcial menor a 4: perdió la promoción para siempre'],
  ['6,5; 7; 7; 7', 'Regular, todavía no promociona', 'Promedio 6,875 &lt; 7: debe recuperar alguno'],
  ['6; 7; 7,5; 7,5', 'Promociona', 'Todos ≥ 6 y promedio exactamente 7'],
  ['2.º parcial: 4,5 → 3,5 → 10', 'Nota del 2.º = 10, pero sin promoción', 'El 3,5 de la primera recuperación ya hizo perder la aprobación directa'],
])}
<h2>Final por partes y final tradicional</h2>
<ul>
  <li><b>Final por partes</b>: los regulares pueden rendir los parciales del ciclo actual (sin cursar ni presentar TPs), con las mismas condiciones de la aprobación directa. Promocionado, hay que inscribirse en mesa y avisar por Telegram el día antes.</li>
  <li><b>Final tradicional</b>: escrito, <b>5 preguntas para desarrollar</b> (no es multiple choice), 2 puntos cada una, al menos 2 completamente bien, nota mínima 6, temario del ciclo anterior. Se evalúa precisión de conceptos y vocabulario técnico. <b>Las exclusiones de temas de las diapositivas valen solo para el cursado y el final por partes.</b></li>
</ul>
<p>El laboratorio implementa estas reglas: es el ejercicio 7 del TP de C básico.</p>`,
      labs: [{
        type: 'calc', title: 'Estado académico (TP 2, ejercicio 7)', intro: 'Por cada parcial escribí las notas en orden: original y recuperaciones (ej.: “4,5 3,5 10”). Si faltaste al original, empezá con “a”.',
        fields: [
          { id: 'p1', label: '1.er parcial', type: 'text', value: '3,5' }, { id: 'p2', label: '2.º parcial', type: 'text', value: '10' },
          { id: 'p3', label: '3.er parcial', type: 'text', value: '10' }, { id: 'p4', label: '4.º parcial', type: 'text', value: '10' },
          { id: 'min', label: 'Mínimo para regularizar', options: ['4 (según el ejemplo)', '6 (según el texto)'], value: '4 (según el ejemplo)' },
        ],
        run: (v) => {
          const parse = (s) => String(s).trim().split(/\s+/).filter(Boolean).map((x) => (x === 'a' ? null : parseFloat(x.replace(',', '.'))));
          const P = ['p1', 'p2', 'p3', 'p4'].map((k) => parse(v[k]));
          if (P.some((n) => n.some((x) => x !== null && !(x >= 0 && x <= 10)))) return 'Cada nota tiene que ser un número entre 0 y 10 (o “a” para ausente en el original).';
          const min = v.min.startsWith('6') ? 6 : 4;
          const finals = P.map((n) => [...n].reverse().find((x) => x !== null) ?? null);
          const presentOrig = P.filter((n) => n[0] != null).length;
          const anyUnder4 = P.some((n) => n.some((x) => x !== null && x < 4));
          const regular = presentOrig >= 2 && finals.every((x) => x !== null && x >= min);
          const avg = finals.every((x) => x !== null) ? finals.reduce((a, b) => a + b, 0) / 4 : null;
          const promo = regular && presentOrig === 4 && !anyUnder4 && finals.every((x) => x >= 6) && avg >= 7;
          const fmt = (x) => (x === null ? '—' : String(x).replace('.', ','));
          return `Nota de cada instancia (la más reciente): ${finals.map(fmt).join('; ')}\nPromedio: ${avg === null ? '—' : String(Math.trunc(avg * 1000) / 1000).replace('.', ',')} (sin redondeo)\nPresente en ${presentOrig} de 4 originales${anyUnder4 ? '\nTuvo al menos una nota menor a 4: no puede promocionar.' : ''}\n\nCondición: ${promo ? 'APROBACIÓN DIRECTA' : regular ? 'REGULAR' : 'LIBRE (todavía)'}${!promo && regular && !anyUnder4 && presentOrig === 4 ? `\nPara promocionar: ${finals.some((x) => x < 6) ? 'subir a 6 o más los parciales flojos' : 'subir el promedio a 7'} con las recuperaciones.` : ''}`;
        },
      }],
      quiz: [
        { q: 'Un alumno tiene 6; 7; 7,5; 7,5. ¿Cuál es su condición?', o: ['Promociona: todos los parciales tienen 6 o más y el promedio es 7', 'Regular: el promedio es 6,99 y no hay redondeo', 'Regular: tiene un parcial con 6, que no alcanza para promocionar', 'Debe rendir el final tradicional'], a: 0, e: '(6 + 7 + 7,5 + 7,5)/4 = 28/4 = 7 exacto. Es el ejemplo de las diapositivas.' },
        { q: 'En el 2.º parcial alguien saca 4,5; en la primera recuperación 3,5 y en la segunda 10. ¿Qué pasa?', o: ['Vale 10, pero ya no puede promocionar', 'Vale 10 y puede promocionar si el promedio da 7', 'Vale 10 y el 3,5 no cuenta por ser una recuperación', 'Vale el promedio de las tres instancias: 6'], a: 0, e: 'Vale la nota más reciente (10), pero una nota menor a 4 en cualquier instancia, incluso en una recuperación, hace perder la aprobación directa.' },
        { q: '¿Cómo es el examen final tradicional?', o: ['Escrito, con 5 preguntas para desarrollar, sin las exclusiones de temas de las diapositivas', 'Multiple choice, como los parciales, sobre el temario del año en curso', 'Escrito, con 5 preguntas para desarrollar, con las mismas exclusiones que el cursado', 'Oral, con un tema elegido por el alumno'], a: 0, e: 'Cinco preguntas para desarrollar (2 puntos cada una, mínimo 6, al menos 2 completamente bien), temario del ciclo anterior y sin exclusiones: las exclusiones valen solo para cursado y final por partes.' },
        { q: '¿Con 6,5; 7; 7; 7 se promociona?', o: ['No: el promedio es 6,875 y no se redondea', 'Sí: 6,875 se redondea a 7 porque supera 6,5', 'Sí: alcanza con que todos los parciales superen 6', 'No: hay un parcial menor a 7 y eso impide promocionar'], a: 0, e: 'Todos ≥ 6, pero el promedio 6,875 no llega a 7,00 y la cátedra no redondea.' },
        { q: '¿Cuál de estas situaciones NO hace perder la posibilidad de promocionar?', o: ['Sacar 5 en un parcial original y luego 8 en su recuperación', 'Sacar 3,9 en una recuperación aunque después se saque 10', 'Faltar a un parcial original y rendirlo en la recuperación', 'Terminar con promedio 6,99'], a: 0, e: '5 no es menor a 4, y la nota que vale es la más reciente (8). Faltar a un original impide promocionar (hay que presentarse a los 4) y 6,99 no es 7.' },
      ],
      exercises: [{
        official: '2.7', level: 2, title: 'Estado académico en C',
        prompt: '<p>Cree un programa que permita a un alumno ingresar las calificaciones de sus parciales, incluyendo recuperaciones, y conocer su estado académico en Sistemas Operativos, según las condiciones de las diapositivas de la primera clase.</p>',
        hints: ['Para cada parcial guardá la última nota (la más reciente) y si alguna fue menor a 4.', 'Usá float y no redondees.'],
        solution: { explain: `<p>Una solución posible (con el mínimo de regularidad del ejemplo de la clase, 4; si tu docente confirma 6, cambiá la constante):</p>${code(`#include <stdio.h>
#define MIN_REG 4.0f

int main(void) {
    float ultima[4], nota;
    int presente_orig = 0, menor_a_4 = 0;
    for (int i = 0; i < 4; i++) {
        int n;
        printf("Parcial %d: cuantas notas tiene (original + recuperaciones, 0 si nunca rindio)? ", i + 1);
        if (scanf("%d", &n) != 1) return 1;
        ultima[i] = -1;
        for (int k = 0; k < n; k++) {
            printf("  nota %d (-1 si falto): ", k + 1);
            scanf("%f", &nota);
            if (nota < 0) continue;            /* ausente */
            if (k == 0) presente_orig++;
            if (nota < 4) menor_a_4 = 1;
            ultima[i] = nota;                  /* vale la mas reciente */
        }
    }
    int regular = presente_orig >= 2, todas_6 = 1;
    float suma = 0;
    for (int i = 0; i < 4; i++) {
        if (ultima[i] < MIN_REG) regular = 0;
        if (ultima[i] < 6) todas_6 = 0;
        suma += ultima[i];
    }
    float prom = suma / 4;                     /* sin redondeo */
    if (regular && presente_orig == 4 && !menor_a_4 && todas_6 && prom >= 7)
        printf("Aprobacion directa (promedio %.3f)\\n", prom);
    else if (regular)
        printf("Regular\\n");
    else
        printf("Libre\\n");
    return 0;
}`, 'c')}<p>Compilar con <code>gcc estado.c -o estado</code> y ejecutar con <code>./estado</code>. Probalo con los cuatro ejemplos de la tabla.</p>` },
      }],
    },
  );

  LESSONS.push(
    {
      id: 'almacenamiento-y-particiones', module: 'arranque', title: 'Almacenamiento, particiones, sistema de archivos y kernel',
      keywords: 'almacenamiento primario secundario RAM ROM HDD SSD NVMe partición tabla de particiones MBR GPT sistema de archivos formatear kernel driver',
      tldr: 'Para arrancar hay que encontrar el archivo del kernel. Ese archivo vive en un <b>sistema de archivos</b>, que vive en una <b>partición</b>, que está anotada en una <b>tabla de particiones</b> del disco. Sin partición no hay SA, y sin SA no se puede instalar ni usar un SO.',
      goals: ['Comparar almacenamiento primario y secundario.', 'Explicar qué es una partición y una tabla de particiones (MBR/BIOS, GPT/UEFI).', 'Explicar por qué para cargar el kernel primero hay que cargar un driver del SA.'],
      body: `
<h2>Almacenamiento primario y secundario</h2>
${table(['', 'Primario (RAM)', 'Secundario (HDD, SSD, NVMe)'], [
  ['Volatilidad', 'Volátil: se borra al apagar', 'No volátil'],
  ['Velocidad', 'Muy rápido', 'Lento (en comparación)'],
  ['Capacidad', 'Chica', 'Grande (más densidad de almacenamiento)'],
  ['Precio', 'Alto $/GB', 'Bajo $/GB'],
  ['Acceso de la CPU', 'Directo', 'Solo a través de E/S'],
])}
<p>RAM significa memoria de acceso aleatorio (se lee y escribe); ROM, de solo lectura. Hoy el firmware se guarda en EEPROM o flash, que son “ROM” que se pueden reescribir para actualizarlo.</p>

<h2>Particiones</h2>
<ul>
  <li>Dividen un dispositivo en <b>unidades lógicas</b>. Para el usuario parecen discos separados (C:, D:).</li>
  <li>Se anotan en una <b>tabla de particiones</b>: una por disco (con copia de respaldo en GPT). Tipos: la de BIOS (MBR) y <b>GPT</b> (GUID Partition Table, de UEFI). Cada entrada tiene comienzo, fin o tamaño, e indicador de contenido (FAT, NTFS, EFI…).</li>
  <li>Cada partición tiene su propio <b>sistema de archivos</b>: estructura y funciones para guardar y recuperar datos (FAT16, FAT32, exFAT, NTFS, ext2/3/4). Formatear una no afecta las demás.</li>
  <li>Permiten tener <b>varios SO</b> en una PC.</li>
</ul>
${note('<b>Sin partición no hay SA ⇒ no se puede instalar ni usar un SO.</b> No se puede poner un SA si no hay al menos una partición.', 'exam')}

<h2>El kernel es un archivo</h2>
<p>El kernel (para nosotros, el SO) es un <b>programa ejecutable guardado en un archivo</b> dentro de un SA. El objetivo del arranque de la máquina es <b>cargar el kernel</b>. Problema: el archivo puede estar hoy en un lugar del disco y mañana en otro (compactación, actualizaciones). Para encontrarlo hay que entender el SA, o sea, cargar primero el <b>driver del SA</b>. Antes los SA eran sencillos y su driver chico; hoy son complejos, y se usa un driver “reducido” en funcionalidad y tamaño.</p>`,
      quiz: [
        { q: '¿Por qué el arranque necesita cargar un driver del sistema de archivos antes del kernel?', o: ['Porque el kernel es un archivo de un SA y su ubicación puede cambiar', 'Porque el kernel está comprimido y solo el driver del SA sabe descomprimirlo', 'Porque el firmware no puede leer ningún sector del disco sin un driver del SO', 'Porque el driver del SA es el que inicializa la RAM antes de cargar el kernel'], a: 0, e: 'El kernel es un archivo; para encontrarlo hay que interpretar las estructuras del SA (puede moverse por actualizaciones o compactación).' },
        { q: '¿Qué pasa si un disco no tiene ninguna partición?', o: ['No se le puede poner un SA, así que no sirve para instalar un SO', 'El SO usa el disco entero como una partición implícita de tipo NTFS', 'Solo puede usarse con UEFI, que no necesita tabla de particiones', 'Funciona igual, pero más lento porque no hay índice de particiones'], a: 0, e: 'Sin partición no hay SA; sin SA no hay archivos y el SO no puede instalarse.' },
        { q: 'Formatear la partición D: de un disco con C: y D:…', o: ['no afecta los datos de C:', 'borra también la tabla de particiones de todo el disco', 'obliga a reinstalar el SO de C: porque cambia el cargador', 'convierte el disco de MBR a GPT automáticamente'], a: 0, e: 'Cada partición tiene su SA; formatear una inicializa solo ese SA.' },
        { q: 'Comparado con la RAM, el almacenamiento secundario es:', o: ['No volátil, más lento, más grande y más barato por GB', 'Volátil, más lento, más grande y más caro por GB', 'No volátil, más rápido, más chico y más barato por GB', 'No volátil y accesible directamente por la CPU, como la RAM'], a: 0, e: 'Secundario: no volátil, lento, grande y barato por GB. La CPU no accede directamente a él.' },
        { q: '¿Dónde está anotado dónde empieza y termina cada partición?', o: ['En la tabla de particiones del disco (MBR o GPT)', 'En el sistema de archivos de cada partición', 'En la NVRAM del motherboard', 'En el kernel'], a: 0, e: 'La tabla de particiones (una por disco; GPT guarda además una copia de respaldo) registra comienzo, fin o tamaño y el tipo de contenido.' },
      ],
    },
    {
      id: 'firmware-bios-uefi', module: 'arranque', title: 'Firmware y arranque: BIOS y UEFI',
      keywords: 'firmware BIOS UEFI NVRAM EEPROM flash MBR VBR 440 bytes chainloading carga en cadena GPT ESP FAT32 bootloader cargador de arranque POST CSM',
      tldr: 'El <b>firmware</b> (BIOS o UEFI) es lo primero que ejecuta la CPU al recibir energía; su objetivo es cargar el SO. BIOS tiene 440 bytes en el MBR para el cargador y depende de la <b>carga en cadena</b>; UEFI busca el cargador como archivo en una partición <b>ESP</b> (FAT32) de un disco <b>GPT</b>.',
      goals: ['Explicar qué hace el firmware y qué guarda la NVRAM.', 'Describir el arranque BIOS (MBR, VBR, carga en cadena) y sus problemas.', 'Describir el arranque UEFI (GPT, ESP) y sus ventajas.'],
      body: `
<h2>El arranque (boot)</h2>
<p>Es un proceso que <b>empieza al encender</b> la máquina (PC, smartphone, TV) y <b>termina al cargar el kernel</b> (ahí empieza el arranque del SO). Pregunta clave: ¿qué ejecuta la CPU en el momento 0, cuando recibe energía? Hay que pensar de dónde toma las instrucciones.</p>

<h2>Firmware y NVRAM</h2>
<ul>
  <li><b>Firmware</b>: programa del fabricante o integrador, específico de cada motherboard (BIOS, UEFI y otros). Está en <b>EEPROM o flash</b> para poder actualizarlo. Es lo primero que se ejecuta al encender y su objetivo, entre otros, es <b>cargar el SO</b>. Permite configurar parámetros (el “setup”).</li>
  <li><b>NVRAM</b>: RAM no volátil respaldada por batería (no tiene nada que ver con la memoria principal). Guarda las <b>variables de configuración</b> del firmware y el hardware detectado. Conviene que se pueda borrar.</li>
</ul>
<p>Se configura, entre otras cosas: fecha y hora, extensiones de virtualización de la CPU, overclocking, ventiladores, <b>secuencia de arranque</b> (prioridad de dispositivos), CSM (compatibilidad con BIOS) y seguridad (TPM, contraseñas).</p>

<h2>Arranque BIOS (Basic Input Output System, IBM 1980)</h2>
<ul>
  <li>Pretendía ser una API entre hardware, SO y aplicaciones (aunque no tanto).</li>
  <li>El cargador tiene solo <b>440 bytes</b> en el MBR (y en el VBR): un bloque de 512 bytes menos la tabla de particiones. Ahí tiene que entrar el cargador <b>y</b> el driver del SA.</li>
  <li>Por el poco espacio se usa <b>carga en cadena</b> (chainloading): hay código en el MBR, en el VBR y en el SA que se carga uno tras otro antes de poder ejecutar el kernel. Permite multiboot (en Windows y en Linux), pero es <b>complejo, inseguro y propenso a fallas</b>.</li>
</ul>
<div class="lab-mount" data-lab="0"></div>

<h2>Arranque UEFI (Unified Extensible Firmware Interface)</h2>
<ul>
  <li>Firmware moderno, sucesor de BIOS, con interfaz gráfica.</li>
  <li>Busca el cargador de arranque <b>como archivo</b> en una partición especial: requiere <b>GPT</b>; la partición es de tipo <b>ESP</b> (EFI System Partition), usualmente <b>FAT32</b> (sencillez y compatibilidad), de 100 a 512 MB, y puede tener los cargadores de varios SO.</li>
  <li>Se puede configurar <b>desde el SO</b> sin reiniciar ni entrar al setup (¿y la seguridad?).</li>
  <li>Secuencia: ejecuta el firmware, lee el <b>SO de arranque predeterminado</b> (en BIOS se elegía un <i>dispositivo</i>), va a la ESP, busca el cargador y lo ejecuta.</li>
  <li>El firmware está en flash y las variables en NVRAM con batería: no están en la misma memoria.</li>
</ul>
<div class="lab-mount" data-lab="1"></div>
${note('Ni en BIOS ni en UEFI se cubren en las diapositivas pasos como el POST (autodiagnóstico al encender).', '')}
<div class="lab-mount" data-lab="2"></div>`,
      labs: [
        { type: 'order', title: 'Ordená el arranque BIOS', items: ['La CPU recibe energía y ejecuta el firmware BIOS desde la flash', 'El BIOS lee su configuración y elige el dispositivo de arranque según la prioridad', 'Carga el MBR (512 bytes: 440 de código y la tabla de particiones) y lo ejecuta', 'El código del MBR carga y ejecuta el VBR de la partición', 'El VBR carga el resto del cargador, que entiende el sistema de archivos', 'El cargador busca el archivo del kernel en el SA, lo carga en RAM y le pasa el control'], explain: '<p>Eso es la <b>carga en cadena</b>: como en 440 bytes no entra un cargador con driver de SA, cada etapa carga a la siguiente. Termina el arranque de la PC y empieza el del SO.</p>' },
        { type: 'order', title: 'Ordená el arranque UEFI', items: ['La CPU recibe energía y ejecuta el firmware UEFI desde la flash', 'El firmware lee de la NVRAM cuál es el SO de arranque predeterminado', 'Va a la partición ESP (FAT32) del disco GPT', 'Ejecuta el archivo del cargador de arranque de ese SO', 'El cargador lee el SA, carga el kernel en RAM y le pasa el control'], explain: '<p>UEFI entiende FAT32, así que el cargador es un <b>archivo</b> en la ESP: no hace falta la cadena MBR → VBR.</p>' },
        { type: 'classify', title: '¿BIOS, UEFI o ambos?', buckets: ['BIOS', 'UEFI', 'Ambos'], items: [
          { t: 'El cargador debe entrar en 440 bytes', b: 0, why: '512 bytes del MBR menos la tabla de particiones.' },
          { t: 'Requiere tabla de particiones GPT', b: 1, why: 'Y una partición ESP.' },
          { t: 'Busca el cargador en una partición FAT32 de 100 a 512 MB', b: 1 },
          { t: 'Usa carga en cadena MBR → VBR → SA', b: 0, why: 'Es complejo, inseguro y propenso a fallas.' },
          { t: 'Es lo primero que se ejecuta al encender', b: 2, why: 'Los dos son firmware.' },
          { t: 'Se puede configurar desde el SO sin reiniciar', b: 1 },
          { t: 'Su configuración se guarda en NVRAM con batería', b: 2 },
          { t: 'Elige un SO de arranque predeterminado, no solo un dispositivo', b: 1 },
          { t: 'Permite multiboot', b: 2, why: 'BIOS lo logra con carga en cadena; UEFI con varios cargadores en la ESP.' },
        ] },
      ],
      quiz: [
        { q: '¿Qué es lo primero que ejecuta la CPU al encender una PC?', o: ['El firmware (BIOS o UEFI) desde la flash', 'El cargador de arranque guardado en el MBR del disco', 'El kernel, que está guardado en la partición ESP', 'El POST, que está guardado en la NVRAM con batería'], a: 0, e: 'El firmware es lo primero; el cargador viene después (lo carga el firmware) y el kernel al final.' },
        { q: '¿Por qué el arranque BIOS necesita carga en cadena?', o: ['Porque en 440 bytes no entra un cargador con el driver del SA', 'Porque el BIOS no puede leer discos de más de 2 TB de una sola vez', 'Porque la NVRAM no guarda el orden de arranque de los dispositivos', 'Porque cada partición del disco tiene su propio kernel que hay que encadenar'], a: 0, e: 'Por el poco espacio, el código se reparte en MBR, VBR y SA, y cada parte carga a la siguiente.' },
        { q: '¿Qué guarda la NVRAM?', o: ['La configuración del firmware y el hardware detectado', 'El código del firmware, para poder actualizarlo', 'El cargador de arranque del SO predeterminado', 'Una copia de respaldo de la tabla de particiones GPT'], a: 0, e: 'El firmware está en flash; la NVRAM (con batería) guarda variables de configuración. No están en la misma memoria.' },
        { q: '¿Qué caracteriza a la partición ESP?', o: ['La partición FAT32 donde UEFI busca los cargadores', 'La partición donde Windows guarda su kernel y sus drivers', 'Una partición oculta con una copia de seguridad del MBR', 'La partición de intercambio (swap) que usa el firmware'], a: 0, e: 'ESP = EFI System Partition: FAT32 por sencillez y compatibilidad, de 100 a 512 MB; puede tener cargadores de varios SO.' },
        { q: '¿En qué momento termina el arranque de la PC?', o: ['Cuando se carga el kernel del SO', 'Cuando aparece la pantalla de inicio de sesión del usuario', 'Cuando el firmware termina el POST y detecta el hardware', 'Cuando el SO monta el sistema de archivos raíz'], a: 0, e: 'Según la cátedra el boot empieza al encender y termina al cargar el kernel del SO.' },
        { q: 'Una diferencia entre BIOS y UEFI respecto de qué se elige para arrancar es que:', o: ['BIOS elige un dispositivo; UEFI, un SO predeterminado', 'BIOS elige un SO predeterminado; UEFI, un dispositivo', 'BIOS elige una partición GPT; UEFI elige el MBR del disco', 'Ninguno elige: los dos arrancan siempre del primer disco'], a: 0, e: 'Es lo que remarcan las diapositivas: UEFI lee el SO de arranque predeterminado y va a su cargador en la ESP.' },
      ],
      open: [
        { t: 'text', q: 'Explicá qué es la carga en cadena del arranque BIOS y por qué se considera problemática.', k: [['440 bytes', '440', 'poco espacio', 'espacio'], ['mbr'], ['vbr'], ['inseguro', 'propenso a fallas', 'complejo']], e: 'Como en el MBR hay solo 440 bytes para el cargador y el driver del SA, el código se reparte: el MBR carga el VBR, éste el resto del cargador en el SA, y recién ese carga el kernel. Permite multiboot, pero es complejo, inseguro y propenso a fallas.' },
      ],
      sources: [{ title: 'Diapositivas 0.2 (Arranque de una PC)', points: ['Referencias de la cátedra: joonas.fi (UEFI PC boot process) y wiki.parabola.nu (GUID Partition Table).', 'Silberschatz 2.10 (Arranque del sistema) da una versión más general.'] }],
    },
    {
      id: 'instalar-un-so', module: 'arranque', title: 'Instalar un SO: imagen, medio, dual boot y verificación',
      keywords: 'instalación imagen ISO 9660 medio dispositivo fuente de instalación instalador live dual boot multiboot hash sha256sum verificar MSR máquina virtual VMware debloat',
      tldr: '<b>Instalar</b> un SO es colocar su software de manera que el firmware pueda ejecutarlo al arrancar: copiar el cargador (MBR/VBR o ESP) y formatear particiones para los archivos. La fuente se descarga del sitio oficial y se <b>verifica con un hash</b>; en dual boot cada SO tiene su partición, y conviene instalar Windows primero.',
      goals: ['Distinguir fuente de instalación, imagen, medio y dispositivo.', 'Explicar qué hace un instalador y por qué se verifica la imagen.', 'Explicar las reglas del arranque múltiple.'],
      body: `
<h2>Glosario</h2>
${table(['Término', 'Qué es', 'Ejemplo'], [
  ['Fuente de instalación', 'Programas y datos necesarios para instalar el SO (kernel y programas del sistema)', 'El contenido del DVD de Debian'],
  ['Imagen', 'Archivo con el contenido de un medio', '<code>debian-13.4.0-amd64-DVD-1.iso</code> (formato ISO 9660)'],
  ['Medio', 'Objeto físico donde se almacenan datos', 'Superficie magnética, memoria flash, disco óptico'],
  ['Dispositivo', 'Artefacto que se usa para acceder al medio', 'HDD, SSD, lectora de tarjetas SD'],
])}

<h2>¿Qué es instalar un SO?</h2>
<p>Hace falta: la computadora con almacenamiento secundario (“el disco”), la fuente de instalación (usualmente una imagen ISO 9660) y un <b>medio de instalación</b>, normalmente almacenamiento “terciario” (USB, DVD).</p>
${def('Instalar un SO', 'Colocar el software del SO de manera que el firmware de la computadora pueda ejecutarlo al arrancar.', 'Diapositivas 0.3')}
<ul>
  <li>Algunos pasos dependen del firmware: copiar el cargador en el <b>MBR y VBR</b> (BIOS) o en la <b>partición EFI</b> (UEFI).</li>
  <li><b>Inicializar (formatear)</b> una o más particiones para los archivos del SO, de los programas del sistema y de las aplicaciones.</li>
  <li>Se instalan también los <b>programas del sistema</b>, como si fueran parte del SO; para la materia no lo son.</li>
</ul>
<p>Los SO traen <b>instaladores</b> (asistentes) que hacen todo esto. En general ejecutan en el arranque (útil sin SO o con el SO dañado) y algunos desde un sistema “live”. Parecerían programas que corren directamente sobre el hardware, sin SO, pero <b>no lo son</b>: no conviene (tarea: justificar; pista: tendrían que incluir sus propios drivers y manejo de hardware, que es justamente lo que da un kernel).</p>

<h2>Verificar la fuente</h2>
<ul>
  <li>Descargar del <b>sitio oficial</b> y verificar la descarga: <code>sha256sum debian-13.4.0-amd64-DVD-1.iso</code> y comparar con la suma publicada.</li>
  <li>Hay que verificar también la <b>autenticidad del archivo de sumas</b> (firmado).</li>
  <li>No hacerlo es un riesgo grave de seguridad, más tratándose de un SO (corre con el máximo privilegio).</li>
</ul>

<h2>Arranque múltiple (dual boot)</h2>
<ul>
  <li>Varios SO instalados y se elige uno al arrancar.</li>
  <li><b>Cada SO tiene su partición dedicada</b>: no se pueden tener archivos de Windows y Linux en un mismo SA, ni dos Windows o dos Linux en la misma partición (usan la misma estructura y se sobrescribirían).</li>
  <li>Hay que limitar el espacio de cada SO según el uso previsto (requiere experiencia propia o ajena).</li>
  <li>Se instala <b>primero Windows</b>: el instalador de Windows no reconoce otros SO e impone su cargador; el de Linux sí detecta Windows y lo agrega al menú de GRUB. En el video se usa todo el disco para Windows y después se achica su partición para Linux.</li>
</ul>
${note('<p>Tareas de la clase para pensar: ventajas y desventajas de un disco virtual en un archivo o en varios; para qué sirve la partición MSR de Windows y qué pasa si se elimina; diferencias entre arquitecturas de 32 y 64 bits para elegir la imagen correcta.</p>', 'tip')}`,
      labs: [{ type: 'classify', title: '¿Imagen, medio o dispositivo?', buckets: ['Imagen', 'Medio', 'Dispositivo'], items: [
        { t: 'El archivo .iso descargado', b: 0 }, { t: 'La memoria flash dentro del pen drive', b: 1 }, { t: 'La lectora de DVD', b: 2 },
        { t: 'Un SSD', b: 2, why: 'Es el artefacto; las celdas flash son el medio.' }, { t: 'La superficie magnética de los platos', b: 1 }, { t: 'Un archivo .vmdk de disco virtual', b: 0, why: 'Es un archivo con el contenido de un disco.' },
      ] }],
      quiz: [
        { q: 'Según la cátedra, instalar un SO es:', o: ['Colocar el SO de manera que el firmware pueda ejecutarlo al arrancar', 'Copiar la imagen ISO en el disco rígido y marcarla como activa', 'Ejecutar el kernel por primera vez desde el medio de instalación', 'Grabar el SO en la flash del motherboard junto al firmware'], a: 0, e: 'Incluye copiar el cargador (MBR/VBR o ESP) y formatear particiones para los archivos.' },
        { q: '¿Por qué no se pueden instalar dos Linux en la misma partición?', o: ['Porque usarían los mismos archivos y se pisarían', 'Porque GRUB solo admite un Linux por disco en su menú', 'Porque cada Linux necesita su propia partición ESP para arrancar', 'Porque ext4 no admite dos kernels en el mismo volumen'], a: 0, e: 'Cada SO necesita su partición dedicada: dos instalaciones iguales chocarían en los mismos archivos.' },
        { q: 'Para tener Windows y Linux en la misma PC, el orden recomendado es:', o: ['Primero Windows y después Linux', 'Primero Linux y después Windows', 'Da igual si el firmware es UEFI', 'Los dos a la vez desde un instalador multiboot'], a: 0, e: 'El instalador de Linux detecta Windows y lo agrega al menú de GRUB; el de Windows ignora otros SO.' },
        { q: '¿Qué protege verificar el hash (sha256sum) de una imagen descargada?', o: ['Que el archivo sea idéntico al publicado', 'Que la imagen sea compatible con la arquitectura de la CPU (32 o 64 bits)', 'Que el disco de destino tenga espacio suficiente para instalar', 'Que la licencia del SO sea válida y esté activada'], a: 0, e: 'El hash detecta cualquier cambio. Además hay que verificar que el archivo de sumas sea auténtico (firmado).' },
        { q: 'Un pen drive con la imagen de Debian grabada es, respecto de la instalación:', o: ['El medio de instalación', 'La fuente de instalación', 'El dispositivo de destino', 'La imagen'], a: 0, e: 'La fuente es el software a instalar, la imagen es el archivo, y el medio donde se guarda (para instalar) es el pen drive.' },
        { q: 'Los instaladores que ejecutan al arrancar la PC, sin SO instalado:', o: ['No corren sin SO: arrancan un kernel y se ejecutan sobre él', 'Son el único ejemplo de programas que corren directamente sobre el hardware', 'Son parte del firmware y se ejecutan antes que el POST', 'Corren en modo usuario, sin ningún kernel debajo'], a: 0, e: 'Parecerían correr sin SO, pero arrancan un kernel (por ejemplo, el del sistema live) y corren sobre él.' },
      ],
      sources: [{ title: 'Diapositivas 0.3 (Instalación de SO)', points: ['Descarga oficial: microsoft.com/software-download/windows10ISO y cdimage.debian.org; verificación en debian.org/CD/verify.', 'Conocimientos relacionados: arranque, particiones, dispositivos, SA, imágenes ISO, unidades 1 y 2, virtualización.'] }],
    },
  );
})();
