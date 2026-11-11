/* Tercer parcial: concurrencia y sección crítica (cap. 6, TP 7), semáforos y monitores (cap. 6, TP 8), abrazo mortal (cap. 7, TP 8 ej. 4). */
(() => {
  const { h, LESSONS } = window.GUIDE;
  const { note, table, def, flow, code } = h;

  // Programas para el laboratorio de intercalado
  const compra = (name) => ({ name, code: [
    { t: 'r = saldo;', op: 'load', v: 'saldo', r: 'r' },
    { t: 'if (r &lt; 80) return;', op: 'jlt', r: 'r', n: 80, to: 5 },
    { t: 'r = r - 80;', op: 'add', r: 'r', n: -80 },
    { t: 'saldo = r;', op: 'store', v: 'saldo', r: 'r' },
    { t: 'comprar();', op: 'inc', v: 'compras' },
  ] });
  const compraSem = (name) => ({ name, code: [
    { t: 'wait(m);', op: 'wait', s: 'm' },
    { t: 'r = saldo;', op: 'load', v: 'saldo', r: 'r' },
    { t: 'if (r &lt; 80) goto fin;', op: 'jlt', r: 'r', n: 80, to: 6 },
    { t: 'r = r - 80;', op: 'add', r: 'r', n: -80 },
    { t: 'saldo = r;', op: 'store', v: 'saldo', r: 'r' },
    { t: 'comprar();', op: 'inc', v: 'compras' },
    { t: 'fin: signal(m);', op: 'signal', s: 'm' },
  ] });
  const bancoExpect = { ok: (v) => v.compras <= 1, good: 'Una sola compra y saldo 0: el resultado correcto.', bad: '<b>¡Dos compras con $80!</b> Los dos leyeron saldo = 80 antes de que el otro escribiera. Es una condición de carrera: el resultado depende del orden en que se intercalaron las instrucciones.' };


  LESSONS.push(
    {
      id: 'condiciones-de-carrera', module: 'concurrencia', title: 'Condiciones de carrera, exclusión mutua y sección crítica',
      keywords: 'concurrencia condición de carrera carrera data race exclusión mutua sección crítica recurso compartido uso exclusivo banco 80 pesos velocidad relativa',
      tldr: 'La <b>condición de carrera</b> es el conjunto de factores (concurrencia + recurso compartido de uso exclusivo) que hace que el resultado dependa del orden de ejecución. No es un error en sí: es lo que lo hace posible. La <b>sección crítica</b> es el código donde se usa ese recurso, y ahí hay que garantizar <b>exclusión mutua</b>.',
      goals: ['Definir condición de carrera, carrera, exclusión mutua y sección crítica como la cátedra.', 'Reproducir una carrera intercalando instrucciones.'],
      body: `
<p>Capítulo 6 de Silberschatz 7.ª ed. (sincronización de procesos). Todo lo que se dice de procesos vale para hilos (incluso es más fácil pasar por alto las carreras con hilos, porque comparten todo).</p>
<h2>Concurrencia</h2>
<p>En SO, los procesos o hilos <b>concurren</b> (convergen) hacia los recursos, como la gente hacia los juegos de un parque de diversiones. La concurrencia es un fenómeno <b>causado por la multiprogramación</b>: para maximizar la utilización, se comparten los recursos. Hay recursos que solo se pueden usar de a <i>n</i> por vez (<b>uso exclusivo</b>): el baño, el control remoto, el asiento del conductor.</p>
<h2>El ejemplo del banco</h2>
<p>Dos compras de $80 con una cuenta de $80. Cada proceso lee el saldo, verifica que alcance, resta y escribe. Ejecutá un paso de cada uno por turno (P1, P2, P1, P2…) y mirá cuántas compras se hacen.</p>
<div class="lab-mount" data-lab="0"></div>
${def('Condición de carrera (CC)', 'Conjunto de factores que hacen que el resultado de la ejecución de un programa dependa del orden en que se ejecutan sus instrucciones (las de todos los procesos que acceden al recurso compartido, intercaladas o en paralelo).', 'Diapositivas, Concurrencia. Factores: concurrencia (causada por MP) y recursos compartidos de uso exclusivo.')}
<ul>
  <li><b>No son errores en sí</b>, sino factores que hacen posible el error: manejar en la niebla no causa accidentes, pero los hace posibles.</li>
  <li>Hay que detectarlas <b>durante el desarrollo</b>: es poco probable encontrarlas en pruebas. Un programa puede tener CC y no fallar nunca, y los errores pueden pasar desapercibidos y causar daños serios.</li>
  <li>Decir que hay CC es decir que <b>puede</b> haber <b>carreras</b> (en inglés: race conditions → data races) y por lo tanto errores. Las carreras son evitables: se originan en errores de desarrollo.</li>
  <li>En el <b>kernel</b> siempre hay CC con MP (peticiones de E/S, la cola de listos con planificación apropiativa o multiprocesador: el mismo proceso podría planificarse en dos núcleos; asignar un PID). En <b>aplicaciones</b>, la mayoría no comparte recursos, salvo los hilos.</li>
</ul>
<h2>Exclusión mutua y sección crítica</h2>
${def('Exclusión mutua', 'Cuando un proceso usa un recurso compartido de uso exclusivo, los otros no deben usarlo. Su implementación está a cargo del desarrollador.', 'En el mundo físico es instintiva (dos personas no se sientan en la misma silla sin notarlo); en la computadora no.')}
${def('Sección crítica (SC)', 'Fragmento de código donde se usa un recurso compartido de uso exclusivo. Es donde se desarrollan las condiciones de carrera y donde hay que lograr exclusión mutua.', 'Su tamaño y duración afectan la probabilidad de incoherencia de datos.')}
${note('<b>Condición de carrera ≠ carrera ≠ sección crítica.</b> La CC es la situación de riesgo (factores); la carrera es el error que ocurre efectivamente; la SC es el fragmento de código donde hay que poner la protección.', 'exam')}
<div class="lab-mount" data-lab="1"></div>`,
      labs: [
        { type: 'interleave', title: 'Dos compras de $80 sin protección', intro: 'Probá el orden P1, P2, P1, P2… y después P1 completo antes que P2. ¿Cambia el resultado?', vars: { saldo: 80, compras: 0 }, procs: [compra('P1'), compra('P2')], expect: bancoExpect },
        { type: 'interleave', title: 'contador++ no es atómico', intro: 'Cada proceso suma 1 al contador compartido. En C es una línea, pero en la CPU son tres instrucciones: leer, sumar y escribir. Buscá un orden que pierda un incremento.', vars: { contador: 0 }, procs: ['P1', 'P2'].map((name) => ({ name, code: [{ t: 'r = contador;', op: 'load', v: 'contador', r: 'r' }, { t: 'r = r + 1;', op: 'add', r: 'r', n: 1 }, { t: 'contador = r;', op: 'store', v: 'contador', r: 'r' }] })), expect: { ok: (v) => v.contador === 2, good: 'contador = 2: correcto.', bad: '<b>contador = 1:</b> se perdió una actualización. Los dos leyeron el mismo valor.' } },
      ],
      quiz: [
        { q: 'Según la cátedra, una condición de carrera es:', o: ['El conjunto de factores que hacen que el resultado dependa del orden de ejecución', 'El error que se produce cuando dos procesos escriben el mismo dato a la vez', 'El fragmento de código donde se accede a un recurso compartido', 'La competencia entre procesos por obtener la CPU antes que los demás'], a: 0, e: 'La CC no es el error (eso es la carrera) ni el código (eso es la SC): son los factores (concurrencia + recurso compartido de uso exclusivo) que hacen posible el error.' },
        { q: '¿Qué es la sección crítica?', o: ['El código donde se usa el recurso compartido', 'La parte del kernel que no puede ser interrumpida por el reloj', 'El momento en que dos procesos acceden al mismo dato a la vez', 'La zona de memoria que comparten los procesos cooperativos'], a: 0, e: 'La SC es código; es donde se desarrollan las CC y donde hay que lograr exclusión mutua.' },
        { q: 'Un programa con condiciones de carrera pasó todas las pruebas sin fallar. Eso significa que:', o: ['Puede fallar igual: las pruebas rara vez las detectan', 'No tiene carreras, porque las pruebas lo demuestran con suficiente cobertura', 'Las CC solo aparecen en máquinas multiprocesador, y las pruebas eran en una sola CPU', 'El compilador detectó y eliminó las condiciones de carrera al optimizar'], a: 0, e: 'Una CC puede no manifestarse nunca o hacerlo rara vez: hay que detectarlas al desarrollar.' },
        { q: '¿Qué dos factores forman una condición de carrera?', o: ['Concurrencia y un recurso de uso exclusivo', 'Multiprocesamiento y memoria virtual compartida', 'Interrupciones deshabilitadas y espera activa en el kernel', 'Planificación no apropiativa y prioridades estáticas'], a: 0, e: 'Con uno solo de los dos no hay riesgo. La concurrencia la causa la multiprogramación (no hace falta multiprocesador).' },
        { q: '¿Por qué contador++ puede perder actualizaciones aunque sea una sola línea de C?', o: ['Porque son varias instrucciones de máquina', 'Porque el compilador reordena las líneas de C en cada ejecución', 'Porque cada proceso guarda la variable en su propia caché', 'Porque el operador ++ no está definido para variables compartidas'], a: 0, e: 'La atomicidad es por instrucción de máquina, no por línea de C.' },
        { q: 'Con un solo núcleo y planificación apropiativa, ¿puede haber carreras?', o: ['Sí: basta una expulsión a mitad de la SC', 'No: con un núcleo nunca se ejecutan dos instrucciones a la vez', 'Solo si los procesos tienen la misma prioridad y comparten la cola', 'Solo si los procesos usan memoria compartida que administra el kernel'], a: 0, e: 'La concurrencia (intercalado) alcanza; no hace falta paralelismo.' },
      ],
      open: [{ t: 'text', q: 'Definí condición de carrera, sección crítica y exclusión mutua, y relacioná los tres conceptos.', k: [['orden', 'orden de ejecución'], ['recurso compartido', 'compartido'], ['fragmento de código', 'código', 'codigo'], ['otros procesos no', 'un proceso a la vez', 'uno a la vez', 'no deben usarlo', 'ningún otro']], e: 'La condición de carrera es el conjunto de factores (concurrencia y un recurso compartido de uso exclusivo) que hacen que el resultado dependa del orden de ejecución de las instrucciones. La sección crítica es el fragmento de código donde se usa ese recurso, donde se desarrollan las CC. La exclusión mutua (que si un proceso usa el recurso los otros no deben usarlo) es lo que hay que garantizar en la sección crítica para evitar las carreras.' }],
    },
    {
      id: 'soluciones-de-hardware', module: 'concurrencia', title: 'Requisitos de una solución y soluciones de hardware',
      keywords: 'requisitos exclusión mutua progreso espera limitada velocidad relativa deshabilitar interrupciones instrucciones atómicas test and set TSL XCHG espera activa spinlock Peterson',
      tldr: 'Una solución al problema de la SC debe cumplir <b>exclusión mutua</b>, <b>progreso</b> y <b>espera limitada</b>, sin suponer nada sobre la velocidad relativa de los procesos. Deshabilitar interrupciones sirve en un solo procesador pero no en varios; las <b>instrucciones atómicas</b> como test-and-set sí.',
      goals: ['Enunciar los tres requisitos.', 'Explicar por qué deshabilitar interrupciones no alcanza.', 'Usar test-and-set para la exclusión mutua.'],
      body: `
<h2>Requisitos (6.2)</h2>
${table(['Requisito', 'Qué exige'], [
  ['Exclusión mutua', 'Si un proceso está en su SC, ningún otro puede estar en la suya'],
  ['Progreso', 'Si nadie está en la SC y alguno quiere entrar, la decisión de quién entra no puede postergarse indefinidamente (y solo participan los que quieren entrar)'],
  ['Espera limitada', 'Hay un límite a cuántas veces otros entran a la SC antes de que entre uno que ya lo pidió (no hay inanición)'],
])}
<p>Además: <b>no se puede suponer nada sobre la velocidad relativa</b> de los procesos.</p>
<h2>Soluciones</h2>
<ul>
  <li><b>Por software</b> (Peterson, 6.3): complejas y lentas. <b>No van.</b></li>
  <li><b>Deshabilitar interrupciones</b>: en un solo procesador evita que expulsen al proceso en la SC. No sirve en multiprocesador (los otros núcleos siguen). Además es peligroso darle ese poder a un proceso de usuario (podría no volver a habilitarlas, y el SO pierde el control: ¿y si hace una LS con las interrupciones deshabilitadas?).</li>
  <li><b>Instrucciones atómicas</b> de hardware: una instrucción que lee y modifica una variable sin que nada pueda intercalarse. <b>Test-and-set</b> (swap no va).</li>
</ul>
${code(`boolean test_and_set(boolean *param) {   /* la CPU la ejecuta ATOMICAMENTE */
    boolean auxiliar = *param;
    *param = true;
    return auxiliar;
}

/* exclusion mutua con un candado compartido, inicialmente false */
while (test_and_set(&candado))
    ;                       /* espera activa (spinlock) */
/* seccion critica */
candado = false;`, 'c')}
<p>Si el candado estaba en <code>false</code>, quien lo prueba lo pone en <code>true</code> y entra; el resto ve <code>true</code> y sigue esperando. El costo: <b>espera activa</b> (ocupada, spinlock): el que espera consume CPU dando vueltas. Para pensar: en el ejemplo del banco, ¿dónde iría el test-and-set? Alrededor de leer-verificar-restar-escribir.</p>
${note('Una variable booleana común (<code>while (ocupado); ocupado = true;</code>) <b>no sirve</b>, ni siquiera en un procesador: un proceso puede ser expulsado entre leer <code>ocupado</code> y ponerla en true. Por eso hace falta que la CPU lo haga en una sola instrucción atómica.', 'exam')}`,
      quiz: [
        { q: '¿Por qué deshabilitar interrupciones no resuelve la sección crítica en multiprocesadores?', o: ['Porque solo afecta al núcleo que las deshabilita: los demás siguen ejecutando y pueden entrar a la SC', 'Porque en un multiprocesador las interrupciones no se pueden deshabilitar de ninguna manera', 'Porque el planificador se vuelve no apropiativo y genera abrazos mortales entre los núcleos', 'Porque las instrucciones atómicas dejan de funcionar cuando las interrupciones están deshabilitadas'], a: 0, e: 'Evita la expulsión en ese núcleo, pero otro núcleo ejecuta en paralelo.' },
        { q: '¿Qué garantiza el requisito de espera limitada?', o: ['Que quien pidió entrar no espere para siempre', 'Que ningún proceso pase más de un cuanto dentro de la sección crítica', 'Que si la SC está libre, alguno de los que quieren entrar pueda hacerlo', 'Que dos procesos nunca estén a la vez dentro de la sección crítica'], a: 0, e: 'Evita la inanición. Que alguien pueda entrar si la SC está libre es progreso; que nunca haya dos adentro, exclusión mutua.' },
        { q: '¿Qué hace atómica a test-and-set?', o: ['Es una sola instrucción de la CPU', 'El SO deshabilita las interrupciones antes de que se ejecute', 'Está escrita en assembler y no en C, así que no se puede interrumpir', 'Usa un semáforo interno del kernel que la protege'], a: 0, e: 'Es una instrucción de hardware (por ejemplo XCHG en x86): leer y modificar no se pueden separar.' },
        { q: '¿Cuál es la principal desventaja de proteger una SC con test-and-set en un bucle?', o: ['La espera activa', 'Que no garantiza exclusión mutua en multiprocesadores', 'Que requiere privilegios de modo kernel', 'Que solo funciona con dos procesos a la vez'], a: 0, e: 'Garantiza exclusión mutua, pero el que espera gira gastando CPU (spinlock).' },
        { q: '¿Por qué una variable booleana compartida (while (ocupado); ocupado = true;) falla aun con un solo procesador?', o: ['Porque un proceso puede ser expulsado entre leer ocupado y ponerla en true', 'Porque las variables booleanas no pueden compartirse entre procesos', 'Porque el compilador elimina los bucles vacíos', 'Porque un solo procesador no admite planificación apropiativa'], a: 0, e: 'Dos procesos pueden ver ocupado = false antes de que cualquiera la ponga en true.' },
        { q: 'La condición de no suponer nada sobre la velocidad relativa de los procesos significa que la solución:', o: ['Debe funcionar sin importar cuánto tarde cada proceso o cómo se intercalen', 'Debe dar más prioridad al proceso más rápido', 'Solo puede usarse cuando todos los procesos tienen la misma prioridad', 'Debe medir la velocidad de cada proceso antes de dejarlo entrar'], a: 0, e: 'No se puede confiar en que “este siempre termina antes que aquel”.' },
      ],
      open: [{ t: 'text', q: '¿Cuáles son los requisitos que debe cumplir una solución al problema de la sección crítica?', k: [['exclusión mutua', 'exclusion mutua'], ['progreso'], ['espera limitada'], ['velocidad relativa', 'velocidad']], need: 3, e: 'Exclusión mutua (si uno está en su SC, ningún otro en la suya), progreso (si la SC está libre y alguien quiere entrar, la decisión no se posterga indefinidamente) y espera limitada (hay un límite a cuántas veces otros entran antes que uno que ya lo pidió). Además, no puede suponer nada sobre la velocidad relativa de los procesos.' }],
    },
    {
      id: 'tp-memoria-compartida', module: 'concurrencia', title: 'TP 7: memoria compartida en Linux (shmget)',
      keywords: 'shmget shmat shmdt shmctl IPC_RMID clave key tamaño bytes memoria compartida hijo wait lazo for retardo ipcs',
      tldr: 'El TP 7 crea un segmento de memoria compartida con <code>shmget(clave, tamaño_en_bytes, flags)</code>, lo mapea con <code>shmat</code> y hace que varios hijos lo modifiquen. Un lazo que solo pierde tiempo dentro de la sección crítica hace visibles las carreras; si no se libera el segmento, sobrevive entre ejecuciones.',
      goals: ['Explicar shmget, shmat y la clave.', 'Interpretar por qué el lazo de retardo cambia el resultado.'],
      body: `
${code(`key_t clave = 1234;                                     /* la misma en todos los procesos */
int id = shmget(clave, sizeof(int), IPC_CREAT | 0666);  /* tamaño en BYTES */
int *compartida = (int *) shmat(id, NULL, 0);           /* puntero a entero */
*compartida = 0;                                        /* inicializar */
/* ... fork(): los hijos leen y escriben *compartida ... */
while (wait(NULL) > 0);                                 /* el padre espera a todos los hijos */
shmdt(compartida);
shmctl(id, IPC_RMID, NULL);                             /* liberar el segmento */`, 'c')}
<ul>
  <li><b>Clave</b>: identifica el segmento en el sistema, para que procesos distintos (incluso no emparentados) obtengan el mismo.</li>
  <li><b>Segundo parámetro de shmget</b>: el <b>tamaño</b> del segmento, en <b>bytes</b>.</li>
  <li><code>shmat</code> devuelve la dirección del segmento en el espacio del proceso; convertida a <code>int *</code> se usa como un entero.</li>
  <li>Un segmento <b>recién creado</b> viene en cero. Pero si ya existía (otra ejecución anterior con la misma clave que no lo liberó), conserva el valor anterior.</li>
  <li>Los segmentos existentes se ven con <code>ipcs -m</code> y se borran con <code>ipcrm</code>.</li>
</ul>
${note('Un lazo que solo hace cuentas dentro de la sección crítica no cambia la lógica, pero <b>alarga</b> el tiempo entre leer y escribir el dato compartido: aumenta la probabilidad de que otro hijo se intercale. Es la forma de hacer visible una condición de carrera que casi nunca se manifiesta.', 'tip')}`,
      quiz: [
        { q: '¿Para qué sirve la clave en shmget?', o: ['Para que todos obtengan el mismo segmento', 'Para cifrar el contenido del segmento compartido', 'Para indicar el tamaño del segmento, en kilobytes', 'Para elegir en qué marco de memoria física se ubica'], a: 0, e: 'La clave identifica el segmento en el sistema.' },
        { q: '¿En qué unidad se expresa el tamaño en shmget?', o: ['Bytes', 'Páginas', 'Kilobytes', 'Enteros'], a: 0, e: 'Es un size_t en bytes (el SO redondea a páginas internamente).' },
        { q: 'Si el programa no libera el segmento al terminar y se ejecuta de nuevo sin inicializarlo, ¿qué se observa?', o: ['Arranca con lo que dejó la ejecución anterior', 'Arranca siempre en 0, porque shmget lo limpia', 'shmget falla porque el segmento sigue en uso', 'Arranca con basura aleatoria de la RAM'], a: 0, e: 'El segmento persiste en el sistema hasta que se elimina (IPC_RMID o ipcrm).' },
        { q: '¿Por qué agregar un lazo de “perder tiempo” en la sección crítica hace que aparezcan errores?', o: ['Porque agranda la ventana para que otro se intercale', 'Porque el lazo modifica la variable compartida sin protección', 'Porque el lazo deshabilita el planificador mientras corre', 'Porque consume la memoria compartida del segmento'], a: 0, e: 'La CC ya estaba; el lazo agranda la ventana en que la carrera puede ocurrir.' },
      ],
      exercises: [{ official: '7.1', level: 2, title: 'Cuestionario de memoria_compartida.c', prompt: '<p>1. ¿Para qué se usa la clave? 2. ¿Qué contiene el segundo parámetro de shmget y en qué unidad? 3. ¿Qué variable trata la memoria compartida como entero y de qué tipo es? 4. Sin inicializar, ¿cuál es el valor inicial? 5. ¿Qué es el número entre paréntesis de “HIJO (4)”? 6. ¿El lazo for del hijo debería alterar el resultado? ¿Qué pasa al descomentarlo? 7. ¿Con qué LS espera el padre? 8. Sin inicializar y comentando el último if, ¿qué observa al ejecutar varias veces?</p>', solution: { explain: '<ol><li>Para identificar el segmento y que todos los procesos accedan al mismo.</li><li>El tamaño del segmento, en bytes.</li><li>El puntero que recibe lo que devuelve <code>shmat()</code>, convertido a puntero a entero (<code>int *</code>): se usa con <code>*variable</code>. Fijate el nombre en tu copia del código.</li><li>0, si el segmento se crea en esa ejecución (shmget lo entrega en cero). Si quedó de una ejecución anterior, el valor que tenía.</li><li>El número de hijo con que se identifica cada uno al imprimir (verificalo en el printf del código).</li><li>No debería, porque no toca el dato compartido; pero al descomentarlo los resultados salen mal: el lazo alarga la sección crítica y hace que los hijos se intercalen entre leer y escribir (carrera). Su propósito es justamente evidenciar la condición de carrera.</li><li><code>wait()</code>.</li><li>Que el valor sigue creciendo entre ejecuciones: el if comentado es el que libera el segmento (<code>shmctl(..., IPC_RMID, ...)</code>); sin él, el segmento persiste y cada ejecución arranca del valor anterior.</li></ol>' } }],
    },
  );

  LESSONS.push(
    {
      id: 'semaforos', module: 'semaforos', title: 'Semáforos: wait, signal y espera bloqueada',
      keywords: 'semáforo binario general contador wait signal P V sem_init sem_wait sem_post sem_trywait sem_timedwait mutex espera activa bloqueada atomicidad',
      tldr: 'Un <b>semáforo</b> es una herramienta de sincronización provista por el SO: una variable S a la que solo se accede con métodos atómicos: inicialización, <b>wait</b> (P) y <b>signal</b> (V). wait bloquea si S = 0 (si no, decrementa); signal incrementa o despierta a un bloqueado. Evita la espera activa y sirve para exclusión mutua y para sincronizar.',
      goals: ['Explicar el funcionamiento de wait y signal.', 'Proteger una sección crítica con un semáforo.', 'Comparar espera activa y espera bloqueada.'],
      body: `
<h2>Qué es un semáforo</h2>
<ul>
  <li>Herramienta de sincronización de <b>más alto nivel</b>, portable, basada en soluciones de hardware y <b>provista por el SO</b>: una solución mixta.</li>
  <li>Puede <b>evitar la espera ocupada</b> bloqueando procesos; por eso su funcionamiento depende del planificador.</li>
  <li>Es como un objeto: una variable que solo se accede con métodos <b>atómicos</b> (inicialización, wait, signal). La atomicidad se logra con soluciones de hardware: mientras un hilo usa un método de un semáforo, ningún otro puede usar un método de ese semáforo. (El código que explica wait y signal no muestra esa protección, pero sin ella no servirían.)</li>
  <li>Sirve para <b>modelar disponibilidad</b> de recursos (30 bancos en un aula) y para <b>sincronizar</b>. Ver 6.5 (6.6, problemas clásicos, no va).</li>
</ul>
${table(['Operación', 'También', 'Qué hace'], [
  ['Inicialización', '<code>sem_init()</code>', 'Fija el valor inicial de S (ej. S = 1)'],
  ['wait', 'P(), <code>sem_wait()</code>', 'Si S == 0, el proceso <b>se bloquea</b> (lo bloquea el SO). Si S &gt; 0, decrementa S y continúa'],
  ['signal', 'V(), <code>sem_post()</code>', 'Incrementa S; puede desbloquear a un proceso que esperaba'],
])}
${code(`sem_init(&s, 1, 1);   /* compartido entre procesos (1), valor inicial 1 */
sem_wait(&s);
/* seccion critica */
sem_post(&s);`, 'c')}
<p>Semáforo <b>binario</b> (0 o 1, como un mutex) para exclusión mutua; <b>general</b> o contador (0 a n) para recursos con n instancias. Para sincronizar (“B después de A”) se inicializa en 0: B hace wait y A, al terminar, signal.</p>
<div class="lab-mount" data-lab="0"></div>
<h2>Espera activa contra espera bloqueada</h2>
${table(['', 'Espera activa (ocupada, spinlock)', 'Espera bloqueada (semáforo)'], [
  ['Qué hace el que espera', 'Gira en un bucle consultando', 'El SO lo pasa a estado de espera y lo saca de la CPU'],
  ['Consumo de CPU', 'Alto (100 % de un núcleo)', 'Ninguno mientras espera'],
  ['Conviene', 'Esperas muy cortas en multiprocesador (más barato que dos cambios de contexto)', 'Esperas largas o de duración desconocida'],
])}
<p>En Linux, un proceso bloqueado en <code>sem_wait</code> aparece en estado <b>S</b> (espera interrumpible).</p>
${note('<p>¿Puede un semáforo valer menos de 0? Con la definición de 6.5 con espera activa (<code>while (S &lt;= 0); S--;</code>), no. En la implementación con bloqueo del libro (6.5.2), wait decrementa primero y bloquea si queda negativo: el valor negativo indica <b>cuántos procesos esperan</b>. La condición que 6.5 exige para que funcione es que wait y signal se ejecuten <b>atómicamente</b>.</p><p>¿Se despierta en orden FIFO? Depende de la implementación de la cola del semáforo: no está garantizado.</p>', 'exam')}
<p>Un <b>mutex</b> es un candado binario con dueño: solo quien lo cerró lo abre. Un semáforo no tiene dueño (cualquiera puede hacer signal) y puede contar más de 1.</p>`,
      labs: [
        { type: 'interleave', title: 'Las dos compras con un semáforo m = 1', intro: 'Ahora cada compra está entre wait(m) y signal(m). Intentá intercalar: el segundo se bloquea en wait hasta que el primero hace signal.', vars: { saldo: 80, compras: 0 }, sems: { m: 1 }, procs: [compraSem('P1'), compraSem('P2')], expect: bancoExpect },
        { type: 'interleave', title: 'Semáforo contador: 2 impresoras, 3 procesos', intro: 'impresoras empieza en 2. El tercero en pedir se bloquea hasta que alguien libere una.', sems: { impresoras: 2 }, procs: ['P1', 'P2', 'P3'].map((name) => ({ name, code: [{ t: 'wait(impresoras);', op: 'wait', s: 'impresoras' }, { t: 'imprimir();', op: 'print', msg: 'imprime' }, { t: 'signal(impresoras);', op: 'signal', s: 'impresoras' }] })) },
      ],
      quiz: [
        { q: 'Un semáforo vale 0 y un proceso ejecuta wait. ¿Qué pasa?', o: ['El proceso se bloquea hasta que otro haga signal', 'El semáforo pasa a -1 y el proceso continúa', 'El proceso gira en un bucle hasta que el valor cambie', 'wait devuelve error y el proceso continúa'], a: 0, e: 'Con la definición de las diapositivas: si S == 0, el SO bloquea al proceso. (En la implementación del libro el valor podría quedar negativo, pero el proceso igual se bloquea.)' },
        { q: '¿Para qué se inicializa un semáforo en 0?', o: ['Para sincronizar (B después de A)', 'Para que ningún proceso pueda usarlo hasta reiniciar', 'Para exclusión mutua entre dos procesos', 'Para indicar que el recurso tiene infinitas instancias'], a: 0, e: 'Con 0, el primer wait se bloquea: sirve para ordenar eventos (B después de A). Para exclusión mutua se inicializa en 1.' },
        { q: '¿Cómo se logra que wait y signal sean atómicos?', o: ['Con soluciones de hardware', 'Ejecutándolos siempre en modo usuario, sin cambios de modo', 'Porque son funciones tan cortas que no pueden interrumpirse', 'Con otro semáforo interno que protege al primero'], a: 0, e: 'Los semáforos se construyen sobre soluciones de hardware (test-and-set).' },
        { q: '¿En qué estado aparece en Linux un proceso bloqueado en sem_wait?', o: ['S (durmiendo)', 'R (ejecutando un bucle)', 'T (detenido por el SO)', 'Z (zombi hasta el signal)'], a: 0, e: 'Está esperando un evento sin consumir CPU.' },
        { q: '¿Qué ventaja tiene un semáforo sobre test-and-set en un bucle?', o: ['Evita la espera activa', 'Funciona sin ninguna ayuda del hardware', 'No necesita que todos los procesos lo usen', 'Garantiza que los procesos se despierten en orden FIFO'], a: 0, e: 'El semáforo bloquea en lugar de girar. Igual necesita hardware y que todos lo usen, y el orden de despertar no está garantizado.' },
        { q: 'Hay 30 bancos en un aula y se quiere controlar cuántos alumnos se sientan. ¿Cómo se inicializa el semáforo?', o: ['En 30', 'En 1', 'En 0', 'En -30'], a: 0, e: 'Un semáforo general modela la cantidad de instancias disponibles.' },
      ],
      open: [{ t: 'text', q: 'Explicá cómo funcionan wait y signal en un semáforo.', k: [['bloquea', 'bloqueo', 'espera'], ['decrementa', 'resta'], ['incrementa', 'suma'], ['desbloquea', 'despierta'], ['atómic', 'atomic']], need: 4, e: 'wait: si el valor es 0, el SO bloquea al proceso; si es mayor que 0, lo decrementa y el proceso continúa. signal: incrementa el valor y puede desbloquear a un proceso que esperaba. Ambas operaciones deben ser atómicas (se logra con soluciones de hardware).' }],
    },
    {
      id: 'monitores', module: 'semaforos', title: 'Monitores y variables condición',
      keywords: 'monitor variables condición x.wait x.signal exclusión mutua implícita granularidad semáforo test and set comparación',
      tldr: 'Un <b>monitor</b> es una herramienta de nivel superior (del lenguaje, no del SO): un objeto cuyos métodos solo puede ejecutar <b>un proceso a la vez</b>. Dentro, las <b>variables condición</b> (x.wait, x.signal) permiten sincronizar. Las soluciones se apilan: semáforos usan test-and-set, monitores usan semáforos.',
      goals: ['Describir un monitor y sus variables condición.', 'Comparar signal de semáforo y de monitor.', 'Elegir entre hardware, semáforos y monitores.'],
      body: `
${code(`monitor prueba {
    /* variables compartidas */
    procedure sumar(...)  { ... }
    procedure restar(...) { ... }
    inicializacion(...)   { ... }
}`, 'c')}
<ul>
  <li>Herramienta de <b>nivel superior</b> a los semáforos, <b>no implementada por el SO</b> (la da el lenguaje: Java <code>synchronized</code>, por ejemplo).</li>
  <li>Estructura de objeto, pero <b>solo un proceso puede ejecutar métodos del monitor por vez</b>: la exclusión mutua es automática. Por eso no hay carreras sobre sus variables.</li>
  <li><b>Variables condición</b>: permiten sincronizar dentro del monitor; cada una tiene una cola de espera. <code>x.wait</code> pone al proceso en esa cola; <code>x.signal</code> desbloquea a uno de la cola.</li>
</ul>
${table(['', 'signal de semáforo', 'x.signal de monitor'], [
  ['Si nadie espera', 'Incrementa el valor: el próximo wait no se bloquea (“se recuerda”)', '<b>No tiene efecto</b>: se pierde'],
  ['wait', 'Bloquea solo si el valor es 0', '<code>x.wait</code> <b>siempre</b> bloquea'],
])}
<p>Del libro: <b>6.7.4</b> (reanudación de procesos dentro de un monitor) y <b>6.9 hasta 6.9.3</b> (transacciones atómicas: modelo, registro, puntos de comprobación). No van 6.7.2, 6.7.3, 6.8 ni 6.9.4 en adelante.</p>
<h2>Comparar las soluciones</h2>
<ul>
  <li>Se integran y suben de nivel: <b>semáforos usan test-and-set</b>, <b>monitores usan semáforos</b>. A mayor nivel, más fácil de usar bien y menos control fino.</li>
  <li>Tienen distinta <b>granularidad</b>: la solución más general sería deshabilitar la multiprogramación, pero se pierde todo lo que la MP gana.</li>
  <li>Una instrucción de hardware (XCHG) o su wrapper en C (<code>atomic_flag_test_and_set</code>): el wrapper es portable y casi igual de rápido.</li>
</ul>
${note('Cualquiera sea la solución elegida, <b>todos</b> los procesos que acceden al recurso deben usarla. Un solo proceso que entre “por la ventana” arruina la exclusión mutua (es lo que el libro intenta decir en 6.7.4).', 'exam')}
${note('Definir una sección crítica para el programa completo garantiza exclusión, pero elimina la concurrencia: los procesos se ejecutarían de a uno.', 'tip')}`,
      quiz: [
        { q: '¿Por qué al usar un monitor no hay carreras sobre sus variables?', o: ['Porque solo un proceso por vez puede ejecutar los métodos del monitor', 'Porque el SO copia las variables del monitor para cada proceso', 'Porque las variables condición se ejecutan con espera activa', 'Porque los monitores deshabilitan las interrupciones mientras ejecutan'], a: 0, e: 'La exclusión mutua es parte de la definición del monitor.' },
        { q: '¿Qué pasa con x.signal si ningún proceso espera en la variable condición x?', o: ['No tiene efecto: la señal se pierde', 'Incrementa el valor de x y el próximo x.wait no se bloquea', 'El proceso que hace signal se bloquea hasta que alguien haga x.wait', 'Se produce un error en tiempo de ejecución'], a: 0, e: 'A diferencia del signal de un semáforo, que se “recuerda” incrementando el valor.' },
        { q: '¿Quién provee los monitores?', o: ['El lenguaje de programación, no el SO', 'El SO, mediante llamadas al sistema específicas', 'El hardware, con instrucciones especiales', 'La biblioteca de semáforos de POSIX'], a: 0, e: 'Las diapositivas: “No implementados por el SO”.' },
        { q: '¿Cómo se relacionan las soluciones en niveles?', o: ['Los semáforos usan test-and-set y los monitores usan semáforos', 'Los monitores usan test-and-set y los semáforos usan monitores', 'Las tres son independientes entre sí', 'Test-and-set se implementa con semáforos'], a: 0, e: 'Cada nivel se construye sobre el anterior.' },
        { q: 'Un proceso accede a una variable compartida sin pasar por el semáforo que usan los demás. ¿Qué pasa?', o: ['Se pierde la exclusión mutua', 'Nada, porque el semáforo protege la variable para todos', 'El SO detecta el acceso indebido y bloquea al proceso', 'El semáforo pasa automáticamente a valer 0 para todos'], a: 0, e: 'Las soluciones son cooperativas: protegen solo si todos las respetan.' },
      ],
    },
    {
      id: 'tp-semaforos', module: 'semaforos', title: 'TP 8: espera ocupada y semáforos en Linux',
      keywords: 'espera_ocupada sincronizar_con_semaforos sem_t sem_init sem_wait sem_post sem_destroy sem_trywait sem_timedwait htop memoria compartida sin semaforizar tiempos',
      tldr: 'El TP 8 compara la espera ocupada (100 % de CPU en htop) con semáforos POSIX en memoria compartida, y pide proteger una suma concurrente: con semáforos el resultado es correcto pero tarda más; olvidar un <code>sem_post</code> deja a los demás bloqueados para siempre.',
      goals: ['Responder las preguntas de los ejercicios 1 a 3 del TP 8.'],
      body: `
${table(['Función', 'Qué hace'], [
  ['<code>sem_init(&amp;s, pshared, valor)</code>', 'Inicializa un semáforo sin nombre; pshared ≠ 0 lo comparte entre procesos (debe estar en memoria compartida)'],
  ['<code>sem_wait(&amp;s)</code>', 'wait: bloquea si vale 0, si no decrementa'],
  ['<code>sem_post(&amp;s)</code>', 'signal: incrementa o despierta a uno'],
  ['<code>sem_trywait(&amp;s)</code>', 'Como sem_wait pero <b>no bloquea</b>: si tendría que esperar, devuelve error (EAGAIN)'],
  ['<code>sem_timedwait(&amp;s, &amp;t)</code>', 'Como sem_wait pero con <b>tiempo límite</b>: si vence, devuelve error (ETIMEDOUT)'],
  ['<code>sem_destroy(&amp;s)</code>', 'Destruye el semáforo'],
])}
<p>Se compila con <code>gcc prog.c -o prog -pthread</code>. En Linux x86-64, <code>sizeof(sem_t)</code> es <b>32 bytes</b>.</p>
<h2>Dónde poner los semáforos</h2>
<p>La sección crítica es leer-modificar-escribir la suma compartida. Formas posibles: un wait/signal alrededor de cada incremento (grano fino: más concurrencia, más overhead por las operaciones) o alrededor de todo el bucle de cada proceso (grano grueso: menos overhead, pero los procesos se ejecutan prácticamente en serie). Los tiempos cambian.</p>`,
      exercises: [
        { official: '8.1', level: 1, title: 'Espera ocupada', prompt: '<p>Ejecute <code>espera_ocupada.c</code> y observe la CPU con htop. ¿La espera ocupada es ventajosa o desventajosa? ¿Cuándo la usaría?</p>', solution: { explain: '<p>htop muestra el proceso al ~100 % de un núcleo aunque no hace nada útil: es <b>desventajosa</b> porque gasta CPU que podría usar otro proceso. Se usaría solo para esperas muy cortas, en multiprocesadores (spinlocks del kernel), donde bloquear y despertar (dos cambios de contexto) costaría más que girar un instante.</p>' } },
        { official: '8.2', level: 2, title: 'sincronizar_con_semaforos.c', prompt: '<p>a. ¿Tamaño de un semáforo? b. ¿Cuántos hijos crea? c. ¿Qué es el valor que se incrementa y dónde está? d. ¿Qué LS se usan (sem_*) y para qué? e. ¿Para qué sirven sem_trywait y sem_timedwait? f. ¿Hay un patrón en la ejecución? g. Observe el estado de un proceso en sem_wait.</p>', solution: { explain: '<ol type="a"><li><code>sizeof(sem_t)</code>: 32 bytes en Linux x86-64 (imprimilo con printf para verificar).</li><li>Contá los <code>fork()</code> del código (o el límite del bucle que los crea).</li><li>Un contador compartido, guardado en la memoria compartida (junto al semáforo), que cada proceso incrementa dentro de la sección crítica.</li><li>sem_init (inicializa), sem_wait (wait), sem_post (signal), sem_destroy (destruye).</li><li>sem_trywait no bloquea (devuelve error si tendría que esperar); sem_timedwait bloquea como máximo hasta un tiempo límite.</li><li>Los procesos suelen alternarse de manera regular al entrar a la SC: el que hace post despierta a otro que estaba bloqueado. El orden exacto depende del planificador.</li><li>Agregando un <code>sleep</code> o <code>getchar()</code> dentro de la SC, el resto queda en <b>S</b>: bloqueado (espera interrumpible), sin consumir CPU.</li></ol>' } },
        { official: '8.3', level: 2, title: 'Proteger la suma', prompt: '<p>Con <code>memoria_compartida_sin_semaforizar.c</code>: a. Identifique la SC y ponga semáforos. b. Compare tiempos con y sin semáforos. c. ¿Qué pasa si olvida un sem_post? d. ¿Cuántas formas de poner semáforos encuentra? ¿Cambian los tiempos?</p>', solution: { explain: `<p>a. La SC es la lectura y escritura de la suma compartida:</p>${code(`sem_wait(sem);
*suma = *suma + 1;     /* leer, sumar y escribir: seccion critica */
sem_post(sem);`, 'c')}<p>Con eso el resultado es siempre el esperado. b. Con semáforos tarda más (overhead de wait/post y de los bloqueos), a cambio de ser correcto. c. El semáforo queda en 0: el siguiente que haga wait se bloquea para siempre (y detrás todos los demás): el programa se cuelga. d. Al menos dos: alrededor de cada incremento (más fino, más lento por la cantidad de operaciones) o alrededor del bucle entero (más grueso, más rápido, pero sin concurrencia real). También se puede acumular en una variable local y sumar una sola vez al final dentro de la SC: la más rápida.</p>` } },
      ],
      quiz: [
        { q: '¿Qué hace sem_trywait si el semáforo vale 0?', o: ['Devuelve error inmediatamente, sin bloquear', 'Bloquea al proceso hasta que alguien haga sem_post', 'Bloquea al proceso como máximo un tiempo límite', 'Pone el semáforo en 1 y continúa'], a: 0, e: 'Es la versión no bloqueante. La que espera con límite es sem_timedwait.' },
        { q: 'Un proceso olvida el sem_post después de su sección crítica. ¿Qué pasa?', o: ['Los que hagan sem_wait después se bloquean indefinidamente', 'El SO hace el sem_post automáticamente al terminar el proceso', 'Los demás entran a la SC sin esperar', 'El semáforo vuelve a 1 al vencer el cuanto'], a: 0, e: 'El semáforo queda en 0 y nadie lo incrementa.' },
        { q: 'Para que un semáforo sin nombre de POSIX funcione entre procesos (no hilos), debe:', o: ['Estar en memoria compartida, con pshared ≠ 0', 'Declararse como variable global del programa antes del fork', 'Inicializarse en un valor negativo para contar procesos', 'Crearse de nuevo en cada proceso después del fork'], a: 0, e: 'Después de fork cada proceso tiene su copia de las globales: el semáforo tiene que estar en un segmento compartido.' },
      ],
    },
  );

  LESSONS.push(
    {
      id: 'abrazo-mortal', module: 'deadlock', title: 'Abrazo mortal: condiciones y grafo de asignación',
      keywords: 'deadlock interbloqueo abrazo mortal exclusión mutua retener y esperar sin apropiación espera circular grafo de asignación de recursos ciclo instancias lápiz papel condición necesaria suficiente',
      tldr: 'Un <b>abrazo mortal</b> (deadlock, interbloqueo) es un conjunto de procesos que esperan, cada uno, un recurso que tiene otro del conjunto: nadie avanza. Puede surgir si se cumplen <b>simultáneamente</b> cuatro condiciones: exclusión mutua, retener y esperar, sin apropiación y espera circular. En el grafo de asignación, sin ciclo no hay abrazo; con ciclo y una instancia por recurso, lo hay.',
      goals: ['Enunciar las cuatro condiciones necesarias.', 'Reproducir el abrazo de lápiz y papel.', 'Interpretar un grafo de asignación de recursos.'],
      body: `
<p>Capítulo 7 completo, salvo las excepciones que se indican en cada lección.</p>
<h2>Modelo del sistema</h2>
<p>Cada proceso usa un recurso así: <b>solicitud</b> (y espera si hace falta) → <b>uso</b> → <b>liberación</b>. Los recursos que el SO no gestiona se piden y liberan con herramientas como semáforos.</p>
<h2>El ejemplo de lápiz y papel</h2>
${code(`sem_init(&lapiz, 1, 1);  sem_init(&papel, 1, 1);
/* hilo uno */             /* hilo dos */
sem_wait(&lapiz);          sem_wait(&papel);
sem_wait(&papel);          sem_wait(&lapiz);
/* escribir */             /* escribir */
sem_post(&lapiz);          sem_post(&lapiz);
sem_post(&papel);          sem_post(&papel);`, 'c')}
<div class="lab-mount" data-lab="0"></div>
<h2>Las cuatro condiciones (7.2)</h2>
${table(['Condición', 'Significado'], [
  ['Exclusión mutua', 'Al menos un recurso solo puede usarlo un proceso a la vez'],
  ['Retener y esperar', 'Un proceso que tiene al menos un recurso espera adquirir otros que tienen otros procesos'],
  ['Sin apropiación', 'Un recurso solo se libera voluntariamente, por el proceso que lo tiene, cuando termina su tarea'],
  ['Espera circular', 'Existe {P0, …, Pn} con P0 esperando un recurso de P1, P1 uno de P2, …, Pn uno de P0'],
])}
${note('<p>Son condiciones <b>necesarias</b>: si falta una, no puede haber abrazo mortal. No son <b>suficientes</b> en general: pueden cumplirse y no haber abrazo (por ejemplo, si un ciclo involucra recursos con varias instancias).</p><p>De las condiciones se deriva que hacen falta al menos <b>2 procesos y 2 recursos</b>; en general, al menos un recurso por proceso involucrado.</p>', 'exam')}
<h2>Grafo de asignación de recursos</h2>
<ul>
  <li>Vértices: procesos (círculos) y tipos de recurso (rectángulos, con un punto por instancia).</li>
  <li>Arista de <b>solicitud</b> Pi → Rj: Pi pidió una instancia de Rj y espera. Arista de <b>asignación</b> Rj → Pi: Pi tiene una instancia de Rj. Es un grafo <b>dirigido</b>: la dirección distingue pedir de tener.</li>
  <li><b>Sin ciclos ⇒ no hay abrazo mortal.</b></li>
  <li><b>Con ciclo</b>: si cada recurso tiene <b>una sola instancia</b>, hay abrazo mortal; si hay varias instancias, <b>puede</b> haberlo o no.</li>
</ul>
${note('Una pregunta guía: varios autos quieren salir de un estacionamiento a la vez. Es abrazo mortal si se forma un ciclo de autos, cada uno bloqueando la salida del siguiente y ninguno puede retroceder (sin apropiación). No lo es si alguno puede maniobrar o salir: entonces los demás terminan saliendo. Y no todos los autos del estacionamiento tienen por qué estar en el ciclo.', 'tip')}`,
      labs: [{ type: 'interleave', title: 'Lápiz y papel', intro: 'Ejecutá H1 un paso (toma el lápiz) y H2 un paso (toma el papel). ¿Qué pasa después?', sems: { lapiz: 1, papel: 1 }, procs: [
        { name: 'H1', code: [{ t: 'sem_wait(&amp;lapiz);', op: 'wait', s: 'lapiz' }, { t: 'sem_wait(&amp;papel);', op: 'wait', s: 'papel' }, { t: '/* escribir */', op: 'print', msg: 'escribe' }, { t: 'sem_post(&amp;lapiz);', op: 'signal', s: 'lapiz' }, { t: 'sem_post(&amp;papel);', op: 'signal', s: 'papel' }] },
        { name: 'H2', code: [{ t: 'sem_wait(&amp;papel);', op: 'wait', s: 'papel' }, { t: 'sem_wait(&amp;lapiz);', op: 'wait', s: 'lapiz' }, { t: '/* escribir */', op: 'print', msg: 'escribe' }, { t: 'sem_post(&amp;lapiz);', op: 'signal', s: 'lapiz' }, { t: 'sem_post(&amp;papel);', op: 'signal', s: 'papel' }] },
      ] }],
      quiz: [
        { q: 'Si en un sistema no se cumple la condición de espera circular:', o: ['No puede haber abrazo mortal', 'Puede haber abrazo mortal si se cumplen las otras tres', 'Hay abrazo mortal solo si los recursos tienen una instancia', 'El sistema está en estado inseguro'], a: 0, e: 'Las cuatro son necesarias: si falta una, no hay abrazo.' },
        { q: 'Un grafo de asignación tiene un ciclo y cada recurso tiene una sola instancia. Entonces:', o: ['Hay abrazo mortal', 'Puede haber o no abrazo mortal', 'No hay abrazo mortal', 'El sistema está en estado seguro'], a: 0, e: 'Con instancias únicas, ciclo ⇔ abrazo mortal. Con varias instancias, el ciclo solo indica posibilidad.' },
        { q: '¿Qué representa una arista Rj → Pi en el grafo de asignación?', o: ['Que Pi tiene asignada una instancia de Rj', 'Que Pi solicitó una instancia de Rj y espera', 'Que Pi podría solicitar Rj en el futuro', 'Que Rj espera a que Pi termine'], a: 0, e: 'Recurso → proceso = asignación. Proceso → recurso = solicitud.' },
        { q: '“Sin apropiación” significa que:', o: ['Un recurso solo se libera voluntariamente', 'Ningún proceso puede pedir un recurso que tiene otro', 'Los recursos no pueden compartirse entre procesos', 'El planificador no puede expulsar al proceso de la CPU'], a: 0, e: 'No se le puede quitar el recurso al que lo tiene. No tiene que ver con la apropiación de la CPU.' },
        { q: '¿Cuál es la cantidad mínima de procesos y recursos para un abrazo mortal?', o: ['2 procesos y 2 recursos', '1 proceso y 2 recursos', '2 procesos y 1 recurso', '3 procesos y 3 recursos'], a: 0, e: 'Hace falta un ciclo: cada uno retiene uno y espera el del otro.' },
        { q: '¿Puede producirse un abrazo mortal usando monitores?', o: ['Sí: el monitor no impide la espera circular', 'No: la exclusión mutua del monitor elimina los abrazos mortales', 'No: los monitores permiten quitarles recursos a los procesos', 'Solo si el monitor tiene más de una variable condición'], a: 0, e: 'El monitor da exclusión mutua, que es justamente una de las condiciones; no evita la espera circular.' },
      ],
      open: [{ t: 'text', q: 'Enunciá las cuatro condiciones necesarias para un abrazo mortal.', k: [['exclusión mutua', 'exclusion mutua'], ['retener y esperar', 'retención y espera', 'retencion y espera', 'mantener y esperar'], ['sin apropiación', 'sin apropiacion', 'no apropiación', 'sin desalojo'], ['espera circular']], need: 4, e: 'Exclusión mutua (un recurso lo usa un proceso a la vez), retener y esperar (un proceso con recursos espera otros que tienen otros), sin apropiación (los recursos solo se liberan voluntariamente) y espera circular (un ciclo de procesos donde cada uno espera un recurso del siguiente).' }],
    },
    {
      id: 'tratar-abrazo-mortal', module: 'deadlock', title: 'Prevenir, evitar, detectar o ignorar',
      keywords: 'prevención evitación predicción detección recuperación ignorar avestruz estado seguro inseguro arista de declaración reclamo banquero necesidad máximo asignación disponible grafo de espera wait-for terminación apropiación víctima reversión',
      tldr: 'Cuatro enfoques: <b>prevenir</b> (negar una condición; la exclusión mutua no se puede negar), <b>evitar</b> (conocer los máximos y nunca entrar a un estado inseguro: banquero), <b>detectar y recuperar</b>, o <b>ignorar</b> el problema, que es lo que hacen la mayoría de los SO, UNIX incluido.',
      goals: ['Decir qué condición se puede negar y cuál no, y el costo de prevenir.', 'Definir estado seguro y usar el algoritmo del banquero.', 'Explicar detección, recuperación y por qué se ignora.'],
      body: `
<h2>Los enfoques (7.3)</h2>
${table(['Enfoque', 'Idea', 'Costo'], [
  ['Prevención', 'Asegurar que nunca se cumpla alguna de las 4 condiciones', 'Baja utilización de recursos, posible inanición'],
  ['Evitación (predicción)', 'Con información previa (máximos), no conceder pedidos que lleven a un estado inseguro', 'Hay que conocer los máximos; procesos que esperan aunque haya recursos'],
  ['Detección y recuperación', 'Dejar que ocurra, detectarlo y recuperar', 'Correr el algoritmo; consecuencias de matar procesos o quitar recursos'],
  ['Ignorarlo', 'Hacer como si nunca ocurriera', 'Si ocurre, el sistema (o parte) queda colgado y se reinicia a mano'],
])}
<p>Silberschatz habla de tres métodos, pero el primero (asegurar que nunca ocurra) se desdobla en prevención y evitación: cuatro enfoques. <b>La mayoría de los SO, incluido UNIX, lo ignora</b>: los abrazos son raros y los otros métodos son caros en rendimiento.</p>
<h2>Prevención (7.4)</h2>
<p>De 7.4.2 a 7.4.4 no va el detalle, pero sí qué condición se puede negar:</p>
${table(['Condición', '¿Se puede negar?', 'Cómo'], [
  ['Exclusión mutua', '<b>No</b> (en general)', 'Solo se evita en recursos compartibles (archivos de solo lectura); los no compartibles la necesitan'],
  ['Retener y esperar', 'Sí', 'Pedir todos los recursos antes de empezar, o pedir solo cuando no se tiene ninguno'],
  ['Sin apropiación', 'Sí', 'Si un proceso pide algo que no puede darse, libera todo lo que tiene y vuelve a pedirlo todo'],
  ['Espera circular', 'Sí', 'Ordenar totalmente los tipos de recurso y pedirlos en orden creciente'],
])}
<div class="lab-mount" data-lab="0"></div>
<h2>Evitación (7.5): estado seguro</h2>
<ul>
  <li>Requiere información <b>a priori</b>: cada proceso declara el máximo de cada recurso que puede necesitar.</li>
  <li><b>Estado seguro</b>: existe una secuencia ⟨P1…Pn⟩ de <b>todos</b> los procesos tal que lo que cada Pi todavía puede pedir se satisface con lo disponible más lo que tienen los Pj anteriores. Seguro ⇒ sin abrazos. Inseguro ⇒ <b>posibilidad</b> de abrazo (no certeza).</li>
  <li>Con una instancia por recurso: grafo con <b>aristas de declaración</b> (reclamo, línea discontinua Pi ⇢ Rj: Pi podría pedir Rj). Un pedido se concede solo si convertir la arista en asignación no forma un ciclo.</li>
  <li>Con varias instancias: <b>algoritmo del banquero</b> (de 7.5.3 solo los dos primeros párrafos y el video 7.2; acá está el ejemplo de las diapositivas). Los recursos se asignan recién si, simulando la asignación, el estado sigue seguro.</li>
</ul>
<div class="lab-mount" data-lab="1"></div>
<h2>Detección y recuperación (7.6, 7.7)</h2>
<p>No estudiar 7.6.1 ni 7.6.2 (lectura liviana recomendada). Con una instancia por recurso se usa un <b>grafo de espera</b> (wait-for: Pi → Pj si Pi espera a Pj) y se buscan ciclos periódicamente (O(n²)). Cuándo correrlo: según con qué frecuencia ocurren abrazos y a cuántos procesos afectan (por ejemplo, cuando la utilización de CPU cae por debajo de cierto valor).</p>
${table(['Recuperar matando procesos', 'Recuperar quitando recursos'], [
  ['Abortar todos los del abrazo, o de a uno hasta romper el ciclo. Orden: prioridad, cuánto ejecutó y cuánto le falta, recursos usados y necesarios, cuántos procesos hay que matar, interactivo o por lotes', 'Elegir una <b>víctima</b> minimizando el costo; <b>revertir</b> (rollback) a un estado seguro; evitar la <b>inanición</b> (contar las reversiones en el costo)'],
])}
<p>La recuperación puede ser manual o automática, con consecuencias indeseadas: un programa que copia líneas de un archivo a otro y es abortado a la mitad deja la copia incompleta. Si se quiere recuperar, <b>los programas deben estar preparados</b>.</p>`,
      labs: [
        { type: 'interleave', title: 'Prevenir la espera circular: pedir en orden', intro: 'Los dos piden primero el lápiz y después el papel. Probá cualquier intercalado: no hay ciclo posible.', sems: { lapiz: 1, papel: 1 }, procs: ['H1', 'H2'].map((name) => ({ name, code: [{ t: 'sem_wait(&amp;lapiz);', op: 'wait', s: 'lapiz' }, { t: 'sem_wait(&amp;papel);', op: 'wait', s: 'papel' }, { t: '/* escribir */', op: 'print', msg: 'escribe' }, { t: 'sem_post(&amp;papel);', op: 'signal', s: 'papel' }, { t: 'sem_post(&amp;lapiz);', op: 'signal', s: 'lapiz' }] })) },
        { type: 'banker', title: 'Algoritmo del banquero (ejemplo de las diapositivas)', intro: 'A tiene 10 instancias, B 5 y C 7. Probá las solicitudes de las diapositivas: P1 (1 0 2); después de aplicarla, P4 (3 3 0) y P0 (0 2 0).', avail: [3, 3, 2], max: [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]], alloc: [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]], req: [1, 0, 2] },
      ],
      quiz: [
        { q: '¿Cuál de las cuatro condiciones no se puede negar, en general, para prevenir abrazos mortales?', o: ['Exclusión mutua', 'Retener y esperar', 'Sin apropiación', 'Espera circular'], a: 0, e: 'Hay recursos intrínsecamente no compartibles (una impresora): necesitan exclusión mutua.' },
        { q: 'Exigir que cada proceso pida todos sus recursos antes de empezar previene el abrazo porque niega:', o: ['Retener y esperar', 'Espera circular', 'Sin apropiación', 'Exclusión mutua'], a: 0, e: 'Nunca retiene unos mientras espera otros. El costo: baja utilización e inanición posible.' },
        { q: 'Numerar los tipos de recurso y obligar a pedirlos en orden creciente niega:', o: ['Espera circular', 'Retener y esperar', 'Sin apropiación', 'Exclusión mutua'], a: 0, e: 'Con un orden total no puede cerrarse un ciclo.' },
        { q: 'Un sistema en estado inseguro:', o: ['Puede llegar a un abrazo mortal', 'Ya está en abrazo mortal', 'No puede llegar nunca a un abrazo mortal', 'Debe matar procesos inmediatamente para recuperarse'], a: 0, e: 'Inseguro = posibilidad. El abrazo es un subconjunto de los estados inseguros.' },
        { q: '¿Qué enfoque usa la mayoría de los SO, incluido UNIX?', o: ['Ignorar el problema', 'Prevención', 'Evitación con el banquero', 'Detección periódica con grafo de espera'], a: 0, e: 'Los abrazos son raros y los demás métodos cuestan rendimiento; si ocurren, se resuelven a mano.' },
        { q: '¿Qué necesita el sistema para poder evitar (no prevenir) los abrazos mortales?', o: ['Conocer de antemano los máximos de cada proceso', 'Que todos los recursos sean compartibles', 'Que los procesos pidan los recursos en orden creciente', 'Poder quitarle recursos a cualquier proceso'], a: 0, e: 'La evitación decide cada pedido mirando el estado y los máximos declarados.' },
        { q: 'En el algoritmo del banquero, ¿cuándo se asignan los recursos pedidos?', o: ['Si simulándola el estado sigue seguro', 'Siempre que haya suficientes recursos disponibles', 'Cuando el proceso termina de declarar su máximo', 'Cuando el sistema detecta que no hay ciclos en el grafo'], a: 0, e: 'Que haya recursos no alcanza: si la asignación deja un estado inseguro, el proceso espera.' },
        { q: 'Con los datos de las diapositivas, después de conceder (1, 0, 2) a P1, ¿se concede (0, 2, 0) a P0?', o: ['No: el estado quedaría inseguro', 'Sí: hay recursos y el estado sigue seguro', 'No: P0 pide más que su necesidad declarada', 'No: no hay recursos disponibles suficientes'], a: 0, e: 'Disponible (2, 3, 0) alcanza, pero quedaría (2, 1, 0) y ningún proceso podría terminar.' },
      ],
      open: [
        { t: 'text', q: '¿Qué es un estado seguro?', k: [['secuencia'], ['todos los procesos', 'todos'], ['disponibles', 'disponible'], ['anteriores', 'terminen', 'liberen', 'devuelvan']], need: 3, e: 'Un estado en el que existe una secuencia de todos los procesos tal que lo que cada uno todavía puede pedir se puede satisfacer con los recursos disponibles más los que tienen los procesos anteriores de la secuencia (que terminarán y los devolverán). Seguro implica que no habrá abrazo mortal.' },
        { t: 'text', q: '¿Por qué la mayoría de los SO actuales eligen ignorar los abrazos mortales?', k: [['raros', 'poco frecuente', 'pocas veces', 'infrecuente'], ['costo', 'caro', 'rendimiento', 'overhead']], e: 'Porque los abrazos mortales son poco frecuentes y prevenirlos, evitarlos o detectarlos cuesta rendimiento (baja utilización, algoritmos que corren seguido, información previa difícil de obtener). Si ocurre, se resuelve manualmente, por ejemplo reiniciando.' },
      ],
      exercises: [{ official: '8.4', level: 2, title: 'Un abrazo mortal con semáforos', prompt: '<p>¿Qué es un abrazo mortal? ¿Qué hace falta para que ocurra? Escriba un programa lo más sencillo posible, en pseudocódigo, que con semáforos haga posible un abrazo mortal; después codifíquelo y ejecútelo.</p>', solution: { explain: `<p>Es un conjunto de procesos donde cada uno espera un recurso que tiene otro del conjunto, y ninguno puede avanzar. Hacen falta las cuatro condiciones (exclusión mutua, retener y esperar, sin apropiación, espera circular). Pseudocódigo: dos semáforos A y B en 1; el proceso 1 hace wait(A), espera un poco, wait(B); el proceso 2 hace wait(B), espera un poco, wait(A).</p>${code(`sem_t *s = mmap(NULL, 2 * sizeof(sem_t), PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
sem_init(&s[0], 1, 1); sem_init(&s[1], 1, 1);
int yo = fork() == 0;                       /* 1 en el hijo, 0 en el padre */
sem_wait(&s[yo]);
printf("%d tiene su primer recurso\\n", yo);
sleep(1);                                   /* da tiempo a que el otro tome el suyo */
printf("%d pide el segundo...\\n", yo);
sem_wait(&s[!yo]);                          /* abrazo mortal: nunca pasa de aca */
printf("%d tiene los dos\\n", yo);`, 'c')}<p>El <code>sleep(1)</code> hace casi seguro el abrazo. Con <code>ps</code> se ven ambos procesos en estado S para siempre; se terminan con Ctrl-C.</p>` } }],
    },
  );
})();
