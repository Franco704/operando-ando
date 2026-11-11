/* Primer parcial, práctica: TP 1 (comandos de consola) y TP 2 (C básico en Linux). */
(() => {
  const { h, LESSONS } = window.GUIDE;
  const { note, table, code } = h;
  const histHas = (sh, re) => sh.hist.some((l) => re.test(l));

  LESSONS.push(
    {
      id: 'comandos-basicos', module: 'consola', title: 'La terminal: comandos básicos y man',
      keywords: 'man ls cd pwd touch which cat mkdir cp rm mv stat file du df chmod ln history ps top kill nice free time secciones man -k man -f apropos whatis',
      tldr: 'El TP 1 es aprender a pescar: buscar cada comando en <code>man</code>, entender qué hace y probarlo. <code>man -k</code> busca por palabra clave en las descripciones y <code>man -f</code> muestra la descripción corta; el número entre paréntesis es la <b>sección</b> del manual (1 comandos, 2 llamadas al sistema, 3 funciones de biblioteca).',
      goals: ['Usar man, man -k y man -f, y entender las secciones del manual.', 'Conocer la función de los 23 comandos del TP 1.', 'Moverse por el sistema de archivos con ls y cd.'],
      body: `
<h2>man: el manual en línea</h2>
<p><code>man ls</code> abre la página de manual de <code>ls</code> (se sale con <kbd>q</kbd>). Si un comando no tiene página propia, puede ser una orden interna del shell: está en <code>man bash</code>.</p>
${table(['Sección', 'Contenido', 'Ejemplos'], [
  ['1', 'Programas ejecutables y órdenes del shell', 'ls(1), cp(1), man(1)'],
  ['2', '<b>Llamadas al sistema</b> (funciones que provee el kernel)', 'write(2), fork(2), open(2)'],
  ['3', '<b>Funciones de biblioteca</b> (por ejemplo, la biblioteca de C)', 'printf(3), gets(3), pow(3)'],
  ['4', 'Archivos especiales (normalmente en /dev)', 'null(4), tty(4)'],
  ['5', 'Formatos de archivo y convenciones', 'passwd(5)'],
  ['6', 'Juegos', ''],
  ['7', 'Misceláneas (convenciones, protocolos)', 'signal(7)'],
  ['8', 'Órdenes de administración (normalmente solo para root)', 'mount(8)'],
  ['9', 'Rutinas del kernel (no estándar)', ''],
])}
<ul>
  <li><code>man -k palabra</code> (= <code>apropos</code>): busca la palabra en los nombres y descripciones cortas de todas las páginas. Muestra cada coincidencia con su sección.</li>
  <li><code>man -f nombre</code> (= <code>whatis</code>): muestra la descripción corta de una página exacta.</li>
  <li><code>man 2 write</code> o <code>man 3 printf</code>: elegir la sección cuando hay páginas con el mismo nombre.</li>
</ul>

<h2>Los comandos del TP 1</h2>
${table(['Comando', 'Para qué sirve', 'Ejemplo'], [
  ['ls', 'Listar el contenido de un directorio', '<code>ls -lh /etc</code>'], ['cd', 'Cambiar el directorio actual (interna del shell)', '<code>cd ..</code>'],
  ['touch', 'Cambiar fechas de un archivo; lo crea si no existe', '<code>touch notas.txt</code>'], ['which', 'Mostrar la ruta del ejecutable que se usaría (buscando en PATH)', '<code>which gcc</code>'],
  ['cat', 'Concatenar archivos y mostrarlos', '<code>cat /etc/hostname</code>'], ['mkdir', 'Crear directorios', '<code>mkdir -p tp1/ej1</code>'],
  ['cp', 'Copiar archivos', '<code>cp a.c b.c</code>'], ['rm', 'Eliminar archivos (y directorios con -r)', '<code>rm -r viejo/</code>'],
  ['mv', 'Mover o renombrar', '<code>mv a.c tp1/</code>'], ['stat', 'Mostrar los datos del inodo: tamaño, permisos, enlaces, fechas', '<code>stat notas.txt</code>'],
  ['file', 'Determinar el tipo de un archivo (por su contenido, número mágico)', '<code>file /bin/ls</code>'], ['du', 'Espacio usado por archivos y directorios', '<code>du -sh tp1</code>'],
  ['df', 'Espacio usado y libre de cada SA montado', '<code>df -h</code>'], ['chmod', 'Cambiar permisos', '<code>chmod 755 script.sh</code>'],
  ['ln', 'Crear enlaces duros o simbólicos (-s)', '<code>ln -s /tmp tmp</code>'], ['history', 'Historial de comandos (interna)', '<code>history | tail</code>'],
  ['ps', 'Estado de los procesos (foto instantánea)', '<code>ps aux</code>'], ['top', 'Procesos en tiempo real', '<code>top</code>'],
  ['kill', 'Enviar una señal a un proceso', '<code>kill -SIGSTOP 2140</code>'], ['nice', 'Ejecutar con otra prioridad de planificación', '<code>nice -n 10 ./a.out</code>'],
  ['free', 'Memoria libre y usada (RAM e intercambio)', '<code>free -m</code>'], ['time', 'Medir el tiempo de ejecución (real, user, sys)', '<code>time ./a.out</code>'],
  ['man', 'Manual en línea', '<code>man -k potencia</code>'],
])}
<p><code>ls</code> y <code>cd</code> son vitales: sin ver dónde estamos y qué hay, no se puede trabajar. En una interfaz gráfica los reemplaza el <b>explorador de archivos</b> (abrir una carpeta = cd; ver su contenido = ls).</p>

<h2>Practicá en la terminal simulada</h2>
<p>No ejecuta nada real: simula un Linux con su sistema de archivos. Las tareas se tildan solas. Probá también <code>man -k potencia</code>, <code>man -f printf</code> y <code>stat</code>.</p>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{
        type: 'shell', title: 'Terminal simulada: primeros pasos',
        tasks: [
          { t: 'Mostrá en qué directorio estás (<code>pwd</code>)', check: (sh) => histHas(sh, /^pwd\b/) },
          { t: 'Creá el directorio <code>tp1</code> dentro de tu home', check: (sh) => sh.resolve('/home/alumno/tp1') != null },
          { t: 'Entrá a <code>tp1</code> y creá un archivo vacío <code>notas.txt</code>', check: (sh) => sh.resolve('/home/alumno/tp1/notas.txt') != null },
          { t: 'Listá con detalle y tamaños legibles (<code>ls -lh</code>)', check: (sh) => histHas(sh, /^ls\s+-(lh|hl)\b/) },
          { t: 'Buscá con <code>man -f</code> en qué sección está <code>printf</code>', check: (sh) => histHas(sh, /^man\s+-f\s+printf/) },
          { t: 'Buscá por palabra clave con <code>man -k potencia</code>', check: (sh) => histHas(sh, /^man\s+-k\s+potencia/) },
          { t: 'Mostrá los datos del inodo de <code>notas.txt</code> con <code>stat</code>', check: (sh) => histHas(sh, /^stat\s+.*notas\.txt/) },
        ],
      }],
      quiz: [
        { q: '¿Qué hace man -k palabra?', o: ['Busca la palabra en nombres y descripciones cortas', 'Muestra la página completa del comando que se llama palabra', 'Muestra solo la descripción corta de la página llamada palabra', 'Busca la palabra dentro del texto completo de todas las páginas'], a: 0, e: 'man -k (apropos) busca en nombres y descripciones cortas. man -f (whatis) muestra la descripción de una página exacta. La búsqueda en el texto completo es man -K.' },
        { q: 'printf aparece como printf(3) y write como write(2). ¿Qué indica esa diferencia?', o: ['printf es de biblioteca; write es una LS', 'printf es una versión más moderna de write, de la sección 3', 'printf recibe 3 parámetros obligatorios y write recibe 2', 'printf es un comando de la shell y write una función de C'], a: 0, e: 'La sección 2 es de llamadas al sistema (las provee el kernel); la 3, de funciones de biblioteca (printf es un wrapper que termina llamando a write).' },
        { q: '¿Por qué cd no tiene su propia página de manual en muchos sistemas?', o: ['Porque es una orden interna del shell', 'Porque es un alias de ls definido por la distribución', 'Porque es una llamada al sistema y está documentada en la sección 2', 'Porque solo root puede usarlo para cambiar de directorio'], a: 0, e: 'cd cambia el directorio actual del propio shell, así que no puede ser un programa aparte: es interna de bash.' },
        { q: '¿Qué muestra stat sobre un archivo?', o: ['Los datos de su inodo', 'El contenido del archivo en hexadecimal', 'El tipo de archivo deducido de su contenido', 'El espacio libre del sistema de archivos'], a: 0, e: 'stat lee el inodo. file deduce el tipo por el contenido; df muestra el espacio de los SA.' },
        { q: '¿Qué comando usarías para ver cuánta memoria RAM y de intercambio hay libre?', o: ['free', 'df', 'du', 'top -m'], a: 0, e: 'free muestra memoria; df espacio en disco por SA; du espacio usado por archivos.' },
        { q: '¿Qué herramienta de una interfaz gráfica reemplaza a ls y cd?', o: ['El explorador de archivos', 'El administrador de tareas', 'El panel de control', 'El editor de texto'], a: 0, e: 'Abrir una carpeta equivale a cd y ver sus íconos a ls.' },
        { q: 'En man, ¿en qué sección están las órdenes de administración que normalmente usa root?', o: ['8', '1', '2', '5'], a: 0, e: '1: comandos de usuario; 2: llamadas al sistema; 5: formatos de archivo; 8: administración.' },
      ],
      exercises: [
        { official: '1.1', level: 1, title: 'Los comandos en man', prompt: '<p>Busque cada comando del listado en las páginas de manual, averigüe para qué sirve y escriba un ejemplo de uso propio (no el del manual). Verifíquelo en la consola.</p>', solution: { explain: '<p>Ver la tabla de la lección: tiene la función y un ejemplo de cada uno. Recordá que <code>cd</code> y <code>history</code> son internas de bash (buscalas en <code>man bash</code>) y que <code>time</code> también existe como palabra reservada de bash, distinta de <code>/usr/bin/time</code>.</p>' } },
        { official: '1.3', level: 1, title: 'man -k, man -f y las secciones', prompt: '<p>¿Qué función cumplen <code>man -k</code> y <code>man -f</code>? ¿Qué es la sección de las páginas de manual? ¿Cuántas secciones hay en su sistema?</p>', solution: { explain: '<p><code>man -k</code> busca una palabra clave en nombres y descripciones cortas (equivale a <code>apropos</code>); <code>man -f</code> muestra la descripción corta de una página (equivale a <code>whatis</code>). La sección agrupa las páginas por tipo: 1 comandos, 2 llamadas al sistema, 3 funciones de biblioteca, 4 archivos especiales, 5 formatos de archivo, 6 juegos, 7 misceláneas, 8 administración (y 9 rutinas del kernel en algunos sistemas). En Debian hay 9 (ver <code>man man</code>).</p>' } },
        { official: '1.4', level: 1, title: 'man -k potencia', prompt: '<p>Explique el resultado de ejecutar <code>man -k potencia</code>.</p>', solution: { explain: '<p>Lista las páginas cuya descripción corta contiene “potencia”. Con las páginas en castellano instaladas aparecen las funciones de potencia de la biblioteca matemática, por ejemplo <code>pow (3) - función de potencia</code> (y sus variantes <code>powf</code>, <code>powl</code>). El (3) indica que son funciones de biblioteca, no comandos. Si no aparece nada, es porque no están instaladas las páginas en castellano (en inglés, <code>man -k power</code>).</p>' } },
        { official: '1.5', level: 1, title: 'Funciones de C y su sección', prompt: '<p>Busque al menos 6 funciones que use en C (como printf, write y gets) y averigüe en qué biblioteca se definen y en qué sección del manual están.</p>', solution: { explain: table(['Función', 'Sección', 'Encabezado / biblioteca'], [['printf', '3', 'stdio.h, biblioteca de C (libc)'], ['scanf', '3', 'stdio.h, libc'], ['gets / fgets', '3', 'stdio.h, libc'], ['malloc', '3', 'stdlib.h, libc'], ['strcpy', '3', 'string.h, libc'], ['pow, sqrt', '3', 'math.h, biblioteca matemática (se enlaza con -lm)'], ['write', '2', 'unistd.h: es una llamada al sistema; libc trae el wrapper'], ['fork', '2', 'unistd.h, llamada al sistema']]) } },
        { official: '1.6', level: 1, title: 'gets contra fgets', prompt: '<p>¿Qué recomendación hace la página de manual de <code>gets</code>? ¿Cuál es la diferencia más importante con <code>fgets</code>?</p>', solution: { explain: '<p>Recomienda <b>no usar nunca gets()</b>: no hay forma de saber de antemano cuántos caracteres va a leer, así que puede escribir más allá del final del arreglo (<b>desborde de búfer</b>), lo que se usó para romper la seguridad de sistemas. <code>fgets(buf, tam, stdin)</code> recibe el tamaño del búfer y lee como mucho <code>tam − 1</code> caracteres (y conserva el salto de línea). gets fue eliminada del estándar C11. El TP 12 muestra un desborde con strcpy.</p>' } },
      ],
    },
    {
      id: 'shell-variables-path', module: 'consola', title: 'Shell, variables de ambiente y PATH',
      keywords: 'intérprete de comandos shell bash variable de ambiente entorno PATH ./ directorio actual seguridad export echo',
      tldr: 'El <b>shell</b> es un programa del sistema que interpreta comandos. Para ejecutar un comando sin ruta, busca el ejecutable en los directorios de la variable <b>PATH</b>; el directorio actual no está en PATH, por eso un programa propio se ejecuta con <code>./programa</code>.',
      goals: ['Definir intérprete de comandos y variable de ambiente.', 'Explicar el uso de PATH y por qué hace falta ./'],
      body: `
<h2>Intérprete de comandos</h2>
<p>El <b>shell</b> (bash, en el TP) es un programa del sistema que lee lo que escribimos, lo interpreta y lo ejecuta: puede ser una <b>función interna</b> del shell (cd, history), una función definida por el usuario o un <b>archivo ejecutable</b> (ls, gcc). Ejecuta en modo usuario y usa llamadas al sistema (fork, exec, wait) para lanzar los programas. No es parte del SO.</p>
<h2>Variables de ambiente</h2>
<p>Pares <i>nombre=valor</i> que cada proceso hereda de su padre y que configuran el comportamiento de los programas: <code>HOME</code> (directorio personal), <code>USER</code>, <code>PATH</code>, <code>LANG</code>. Se ven con <code>echo $PATH</code> o <code>env</code>, y se exportan a los hijos con <code>export</code>.</p>
<h2>PATH y ./</h2>
<p><code>PATH</code> es una lista de directorios separados por dos puntos (<code>/usr/local/bin:/usr/bin:/bin</code>). Cuando escribimos <code>gcc</code>, el shell busca un ejecutable con ese nombre en cada directorio, en orden. <code>which gcc</code> muestra cuál encontraría.</p>
${note('<p>El directorio actual (<code>.</code>) <b>no está en PATH</b>. Por eso, para ejecutar un archivo que no está en esos directorios, hay que darle una <b>ruta</b>: <code>./ejercicio_1</code> (ruta relativa: “el archivo ejercicio_1 de este directorio”). Es una medida de <b>seguridad</b>: si “.” estuviera en PATH, alguien podría dejar en /tmp un programa llamado <code>ls</code> y lo ejecutaríamos sin querer al hacer ls ahí.</p>', 'exam')}`,
      quiz: [
        { q: '¿Por qué para ejecutar un programa compilado en el directorio actual se escribe ./programa?', o: ['Porque el directorio actual no está en PATH', 'Porque ./ le da permiso de ejecución al archivo para esa vez', 'Porque ./ le indica al shell que es un programa compilado en C', 'Porque sin ./ el shell intentaría ejecutarlo en modo kernel'], a: 0, e: 'Sin ruta, el shell busca en los directorios de PATH. ./ es la ruta relativa al directorio actual.' },
        { q: '¿Qué contiene la variable PATH?', o: ['Los directorios donde se buscan los ejecutables', 'La ruta del directorio actual de trabajo del shell', 'La ruta del directorio personal (home) del usuario', 'La ruta completa del último programa que se ejecutó'], a: 0, e: 'PATH = directorios separados por “:”. El directorio actual es otra cosa (pwd); el home está en HOME.' },
        { q: 'No incluir el directorio actual en PATH es principalmente una medida de:', o: ['Seguridad', 'Rendimiento', 'Compatibilidad con Windows', 'Ahorro de memoria'], a: 0, e: 'Evita ejecutar sin querer un programa con un nombre conocido dejado en un directorio ajeno.' },
        { q: 'El intérprete de comandos, para la materia, es:', o: ['Un programa del sistema, en modo usuario', 'Parte del kernel que interpreta los comandos', 'Una función del firmware disponible desde el arranque', 'Un driver de la terminal de texto'], a: 0, e: 'Es una interfaz de usuario, pero no es parte del SO: es un programa del sistema.' },
      ],
      open: [{ t: 'text', q: '¿Por qué hay que anteponer ./ para ejecutar un archivo que no está en un directorio de PATH?', k: [['path'], ['directorio actual', 'directorio de trabajo', 'carpeta actual'], ['ruta']], e: 'Sin ruta, el shell busca el ejecutable solo en los directorios de PATH, y el directorio actual no está ahí (por seguridad). ./ es una ruta relativa que indica el archivo en el directorio actual.' }],
      exercises: [
        { official: '1.2', level: 1, title: 'ls y cd', prompt: '<p>Ejecute <code>ls -lh</code> o su equivalente <code>dir</code>. ¿Por qué son tan importantes ls y cd? ¿Qué herramienta los reemplaza en una interfaz gráfica?</p>', solution: { explain: '<p><code>ls -lh</code> lista en formato largo (permisos, enlaces, dueño, grupo, tamaño, fecha, nombre) con tamaños legibles (K, M). Son vitales porque en la consola no hay otra forma de saber dónde estamos y qué hay: todo lo demás (compilar, editar, ejecutar) requiere ubicar los archivos. En la GUI los reemplaza el explorador de archivos.</p>' } },
        { official: '1.7', level: 1, title: 'Shell, variable de ambiente y PATH', prompt: '<p>Averigüe qué es un intérprete de comandos o shell, qué es una variable de ambiente y para qué sirve PATH.</p>', solution: { explain: '<p>Ver la lección. Shell: programa del sistema que interpreta y ejecuta comandos. Variable de ambiente: par nombre=valor heredado por los procesos, que configura su comportamiento. PATH: lista de directorios donde se buscan los ejecutables.</p>' } },
        { official: '1.8', level: 1, title: 'Por qué ./', prompt: '<p>¿Por qué para ejecutar un archivo que no está en un directorio de PATH hay que anteponer ./ a su nombre?</p>', solution: { explain: '<p>Porque sin ruta el shell solo busca en PATH, y el directorio actual no está incluido (por seguridad). <code>./</code> es la ruta relativa al directorio actual.</p>' } },
      ],
    },
  );

  LESSONS.push(
    {
      id: 'compilar-en-linux', module: 'c', title: 'Editar, compilar y ejecutar C en Linux',
      keywords: 'gcc -o a.out nano geany compilar ejecutar ./ Ctrl-C conio getch system pause cuestionario de control',
      tldr: 'Se edita con nano (o Geany), se compila con <code>gcc fuente.c -o nombre</code> y se ejecuta con <code>./nombre</code>. Sin <code>-o</code>, el ejecutable se llama <code>a.out</code>. Los errores típicos: olvidarse de guardar o de recompilar, y ejecutar el <code>.c</code> en vez del ejecutable.',
      goals: ['Responder el cuestionario de control del TP 2.', 'Compilar y ejecutar desde la terminal.'],
      body: `
<h2>El ciclo</h2>
${code(`nano ejercicio_1.c                    # editar (Ctrl-O guarda, Ctrl-X sale)
gcc ejercicio_1.c -o ejercicio_1      # compilar: -o elige el nombre del ejecutable
./ejercicio_1                         # ejecutar (Ctrl-C lo cancela)
gcc ejercicio_1.c && ./a.out          # sin -o, el ejecutable es a.out`, 'sh')}
<ul>
  <li>Si hay errores, gcc los muestra con el número de línea; si no muestra nada y aparece el ejecutable (verificalo con <code>ls</code>), compiló bien.</li>
  <li>En consola de texto se puede abrir otra consola virtual con Alt-F1 a F6: una para editar y otra para compilar.</li>
  <li>No hace falta <code>getch()</code> ni <code>system("pause")</code>: la consola no se cierra al terminar. La biblioteca <b>conio</b> no está instalada: no se usa.</li>
  <li>Aunque Geany tenga botón de compilar, en el TP se compila <b>por comandos</b>.</li>
  <li>Escribir de a fragmentos: compilar, probar y recién seguir.</li>
</ul>
${note('Si cambiaste el programa pero al ejecutar sigue igual: <b>no guardaste</b> el fuente o <b>no recompilaste</b> (o estás ejecutando otro ejecutable, por ejemplo un a.out viejo).', 'exam')}`,
      quiz: [
        { q: 'Si se compila con gcc prog.c (sin -o), ¿cómo se ejecuta el resultado?', o: ['./a.out', './prog', './prog.c', 'gcc ./prog'], a: 0, e: 'Sin -o el ejecutable se llama a.out. Ejecutar prog.c falla porque es texto, no un ejecutable.' },
        { q: '¿Para qué sirve la opción -o de gcc?', o: ['Para elegir el nombre del ejecutable', 'Para optimizar el código generado', 'Para mostrar los errores y advertencias', 'Para compilar sin enlazar las bibliotecas'], a: 0, e: '-o (output) elige el nombre de salida. La optimización es -O (mayúscula) y compilar sin enlazar es -c.' },
        { q: 'Modificaste el programa pero al ejecutarlo hace lo mismo que antes. La causa más probable es:', o: ['No guardaste el fuente o no recompilaste', 'Linux guarda en caché los programas ya ejecutados', 'Falta poner system("pause") al final', 'gcc no detectó el cambio porque el archivo es muy chico'], a: 0, e: 'Son los dos errores comunes que advierte el TP.' },
        { q: '¿Qué biblioteca dice el TP que no se debe usar?', o: ['conio', 'stdio', 'stdlib', 'string'], a: 0, e: 'conio (getch, clrscr) es de entornos DOS/Windows y no está instalada en Linux.' },
      ],
      exercises: [
        { official: '2.a', level: 1, title: 'Cuestionario de control', prompt: '<p>a. ¿Cómo se llama el compilador? b. ¿Para qué sirve -o? c. ¿Qué sucede sin -o? d. ¿Cómo sé si la compilación tuvo éxito? e. ¿Qué tipeo para ejecutar si no usé -o? f. ¿Qué librería no debo usar? g. Si cambio el programa pero al ejecutar sigue igual, ¿qué puede pasar?</p>', solution: { explain: '<ol type="a"><li>gcc.</li><li>Para indicar el nombre del ejecutable.</li><li>El ejecutable se llama a.out.</li><li>gcc no muestra errores y el ejecutable aparece en el directorio (ls).</li><li><code>./a.out</code>.</li><li>conio.</li><li>Que no guardé el fuente, no recompilé, o estoy ejecutando otro ejecutable.</li></ol>' } },
      ],
    },
    {
      id: 'programas-del-tp2', module: 'c', title: 'Los programas del TP 2',
      keywords: 'máximo mínimo promedio scanf fgets strtok contar palabras concatenar cadenas salir resultados',
      tldr: 'Los ejercicios 1 a 5 del TP 2 practican lectura de teclado, bucles y cadenas en C. Acá están resueltos para comparar con los tuyos: probá primero, después mirá.',
      body: `
<h2>Ideas que se repiten</h2>
<ul>
  <li>Para el máximo y el mínimo, inicializar con el <b>primer</b> número leído (no con 0: si todos son negativos, el máximo daría 0).</li>
  <li>El promedio con <code>(float)suma / n</code>: si no, la división es entera.</li>
  <li>Para leer texto, <code>fgets</code> (nunca <code>gets</code>) y quitar el <code>'\\n'</code> final.</li>
  <li>Para contar palabras, contar los <b>comienzos</b> de palabra: un carácter que no es espacio después de un espacio (o al principio).</li>
</ul>`,
      exercises: [
        { official: '2.1', level: 1, title: 'Máximo, mínimo y promedio de 10 enteros', prompt: '<p>Lea 10 números enteros (positivos y negativos) y presente su máximo, mínimo y promedio.</p>', solution: { explain: code(`#include <stdio.h>
int main(void) {
    int x, max, min, suma = 0;
    for (int i = 0; i < 10; i++) {
        printf("Numero %d: ", i + 1);
        scanf("%d", &x);
        if (i == 0) max = min = x;        /* inicializar con el primero */
        if (x > max) max = x;
        if (x < min) min = x;
        suma += x;
    }
    printf("Maximo %d, minimo %d, promedio %.2f\\n", max, min, suma / 10.0);
    return 0;
}`, 'c') } },
        { official: '2.2', level: 1, title: 'Hasta que se ingrese 0', prompt: '<p>Lea enteros hasta que se ingrese 0 y presente máximo, mínimo y promedio.</p>', solution: { explain: `${code(`#include <stdio.h>
int main(void) {
    int x, max = 0, min = 0, suma = 0, n = 0;
    while (printf("Numero (0 termina): "), scanf("%d", &x) == 1 && x != 0) {
        if (n == 0) max = min = x;
        if (x > max) max = x;
        if (x < min) min = x;
        suma += x; n++;
    }
    if (n) printf("Maximo %d, minimo %d, promedio %.2f\\n", max, min, (float)suma / n);
    else   printf("No se ingresaron numeros\\n");
    return 0;
}`, 'c')}<p>El 0 no cuenta como dato. Contemplar el caso de que el primero sea 0 (evita dividir por cero).</p>` } },
        { official: '2.3', level: 2, title: '“salir” y “resultados”', prompt: '<p>Modifique el ejercicio 1 para que, en cualquier momento, al ingresar “salir” termine sin resultados y al ingresar “resultados” termine mostrándolos.</p>', solution: { explain: `${code(`#include <stdio.h>
#include <string.h>
#include <stdlib.h>
int main(void) {
    char s[32];
    int x, max = 0, min = 0, suma = 0, n = 0;
    while (n < 10) {
        printf("Numero %d: ", n + 1);
        if (scanf("%31s", s) != 1) return 1;
        if (strcmp(s, "salir") == 0) return 0;          /* sin resultados */
        if (strcmp(s, "resultados") == 0) break;
        x = atoi(s);
        if (n == 0) max = min = x;
        if (x > max) max = x;
        if (x < min) min = x;
        suma += x; n++;
    }
    if (n) printf("Maximo %d, minimo %d, promedio %.2f\\n", max, min, (float)suma / n);
    return 0;
}`, 'c')}<p>Se lee siempre como texto y recién después se decide si es un comando o un número.</p>` } },
        { official: '2.4', level: 2, title: 'Contar palabras', prompt: '<p>Lea una cadena de hasta 100 caracteres y cuente su cantidad de palabras.</p>', solution: { explain: code(`#include <stdio.h>
#include <ctype.h>
int contar(const char *s) {
    int n = 0, dentro = 0;
    for (; *s; s++) {
        if (isspace((unsigned char)*s)) dentro = 0;
        else if (!dentro) { dentro = 1; n++; }   /* comienzo de palabra */
    }
    return n;
}
int main(void) {
    char s[102];
    printf("Texto: ");
    if (!fgets(s, sizeof s, stdin)) return 1;
    printf("Palabras: %d\\n", contar(s));
    return 0;
}`, 'c') } },
        { official: '2.5', level: 2, title: 'Concatenar hasta 0', prompt: '<p>Lea cadenas de hasta 100 caracteres y preséntelas concatenadas, hasta que se ingrese 0; ahí muestre la cantidad total de cadenas y de palabras.</p>', solution: { explain: `${code(`/* usa contar() del ejercicio 4 */
int main(void) {
    char s[102], todo[10000] = "";
    int cadenas = 0, palabras = 0;
    while (printf("Cadena (0 termina): "), fgets(s, sizeof s, stdin)) {
        s[strcspn(s, "\\n")] = '\\0';                 /* quitar el salto de linea */
        if (strcmp(s, "0") == 0) break;
        if (strlen(todo) + strlen(s) + 2 < sizeof todo) { strcat(todo, s); strcat(todo, " "); }
        cadenas++; palabras += contar(s);
        printf("%s\\n", todo);
    }
    printf("Cadenas: %d, palabras: %d\\n", cadenas, palabras);
    return 0;
}`, 'c')}<p>Controlar el tamaño antes de <code>strcat</code> evita un desborde de búfer.</p>` } },
      ],
      quiz: [
        { q: 'En el ejercicio del máximo, ¿por qué no conviene inicializar max en 0?', o: ['Porque con todos negativos el máximo daría 0', 'Porque scanf no puede distinguir un 0 de un error de lectura', 'Porque inicializar en 0 provoca una división por cero en el promedio', 'Porque las variables locales en C empiezan en 0 de todos modos'], a: 0, e: 'Hay que inicializar con el primer dato leído.' },
        { q: 'Si suma y n son int, suma / n en C:', o: ['Hace una división entera', 'Da un float automáticamente si el resultado no es exacto', 'Da error de compilación por mezclar tipos', 'Redondea el resultado al entero más cercano'], a: 0, e: 'La división entre enteros trunca. Hay que convertir: (float)suma / n.' },
      ],
    },
    {
      id: 'recorrer-matriz', module: 'c', title: 'Recorrer una matriz: localidad, caché y tasa de transferencia',
      keywords: 'recorrer_matriz BASE filas columnas [i][j] [j][i] caché línea localidad tasa de transferencia time /proc/cpuinfo memoria libre',
      tldr: 'Recorrer una matriz grande por <b>filas</b> (<code>m[i][j]</code>) es mucho más rápido que por <b>columnas</b> (<code>m[j][i]</code>), aunque se lean los mismos bytes: C guarda la matriz por filas y la caché trae líneas enteras. Es la localidad de las referencias en acción (y en el 4.º parcial, la del conjunto de trabajo).',
      goals: ['Explicar por qué el orden del recorrido cambia el tiempo.', 'Calcular una tasa de transferencia aproximada.'],
      body: `
<h2>El experimento del TP</h2>
<ol>
  <li>Completar <code>recorrer_matriz.c</code> para que lea cada celda en <code>contenido</code>.</li>
  <li>Averiguar la memoria libre (<code>free -m</code>) y ajustar <code>BASE</code> para que la matriz ocupe casi toda (±50 MB).</li>
  <li>Encerrar el recorrido en otro bucle de 100 vueltas para medir mejor, y medir 5 veces con <code>time</code>.</li>
  <li>Invertir los índices (<code>[j][i]</code>) y medir otras 5 veces.</li>
</ol>
${code(`for (int r = 0; r < 100; r++)
    for (long i = 0; i < N; i++)
        for (long j = 0; j < N; j++)
            contenido = matriz[i][j];     /* por filas: contiguo en memoria */`, 'c')}
<h2>Por qué hay diferencia</h2>
<ul>
  <li>En C, <code>m[i][j]</code> y <code>m[i][j+1]</code> están <b>contiguos</b>. La caché no trae un entero: trae una <b>línea</b> (típicamente 64 bytes = 16 enteros). Por filas, de cada línea traída se usan los 16: <b>localidad espacial</b>.</li>
  <li>Por columnas, cada acceso salta una fila entera (N × 4 bytes). Cuando la columna es más larga que lo que entra en la caché, al volver a la fila siguiente la línea ya fue desalojada: casi cada acceso es un fallo y va a RAM.</li>
  <li>Con matrices que no entran en RAM, el mismo efecto ocurre con <b>páginas</b> y el disco (TP de memoria virtual, ejercicio 3): por columnas el conjunto de trabajo es enorme y aparece la hiperpaginación.</li>
</ul>
<div class="lab-mount" data-lab="0"></div>
<h2>Tasa de transferencia</h2>
<p>Bytes leídos = N × N × 4 × 100 (cien recorridos). Tasa ≈ bytes / tiempo <i>user</i>. Por filas da una tasa cercana a la de la caché o la RAM; por columnas, mucho menor. No esperes coincidencias exactas con la frecuencia de la RAM o del bus: cada vuelta del bucle ejecuta además varias instrucciones (comparar, incrementar, saltar). Los datos de la CPU (frecuencia, tamaños de caché, tamaño de línea) se ven con <code>cat /proc/cpuinfo</code> y <code>lscpu</code>.</p>`,
      labs: [{ type: 'cache', title: 'Por filas o por columnas', intro: 'Simulación de una caché pequeña (LRU) mientras se recorre una matriz de enteros. Probá agrandar N o achicar la caché.', n: 64, lines: 32 }],
      quiz: [
        { q: 'Una matriz de 8000 × 8000 int se recorre primero con m[i][j] y después con m[j][i]. ¿Qué se espera?', o: ['Que por columnas (m[j][i]) tarde mucho más', 'Que tarden lo mismo, porque se leen exactamente los mismos bytes', 'Que por columnas tarde menos, porque la caché precarga columnas enteras', 'Que por filas tarde más, porque produce más fallos de página'], a: 0, e: 'C guarda por filas; la caché trae líneas contiguas. Por columnas casi cada acceso es un fallo de caché.' },
        { q: 'En C, ¿qué elemento está en memoria inmediatamente después de m[3][5]?', o: ['m[3][6]', 'm[4][5]', 'm[4][6]', 'Depende del compilador: puede ser cualquiera'], a: 0, e: 'Orden por filas (row-major): se recorre primero el último índice.' },
        { q: '¿Por qué los tiempos medidos no coinciden exactamente con la tasa de transferencia teórica de la RAM?', o: ['Porque el bucle ejecuta otras instrucciones además del acceso', 'Porque time mide en milisegundos y no tiene precisión de nanosegundos', 'Porque la RAM tarda lo mismo sin importar el orden de los accesos', 'Porque el SO comprime la matriz en memoria para ahorrar espacio'], a: 0, e: 'Comparar, incrementar y saltar agregan tiempo que no es transferencia.' },
      ],
      exercises: [{ official: '2.6', level: 3, title: 'Recorrer la matriz', prompt: '<p>Modifique <code>recorrer_matriz.c</code> para leer cada celda; ajuste BASE a la memoria libre; recorra 100 veces; mida 5 veces por filas y 5 por columnas. c. ¿Hay diferencia? ¿A qué se debe? d. Calcule la tasa de transferencia en ambos casos. e. ¿Se relaciona con los datos de la CPU y la RAM?</p>', hints: ['La matriz ocupa N² × 4 bytes. Si hay 1500 MB libres, N ≈ √(1500 × 2²⁰ / 4) ≈ 19800.', 'Tasa = 100 × N² × 4 bytes / tiempo user.'], solution: { explain: '<p>c. Sí: por columnas tarda varias veces más. Se debe a la localidad de las referencias: C almacena por filas y la caché trae líneas contiguas; por columnas cada acceso cae en otra línea y casi todos son fallos de caché. d. Por ejemplo, si por filas tarda 12 s con N = 19800: 100 × 19800² × 4 / 12 ≈ 13 GB/s; si por columnas tarda 60 s, ≈ 2,6 GB/s. e. Por filas la tasa se acerca (sin igualarla) a la de la caché/RAM; por columnas está limitada por la latencia de la RAM. No coinciden exactamente porque cada vuelta ejecuta varias instrucciones además del acceso.</p>' } }],
    },
  );
})();
