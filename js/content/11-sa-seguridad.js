/* Cuarto parcial: sistemas de archivos (caps. 11 y 10, TP 11) y protección y seguridad (10.6, TP 12). */
(() => {
  const { h, LESSONS, so } = window.GUIDE;
  const { note, table, def, flow, code, num } = h;
  const histHas = (sh, re) => sh.hist.some((l) => re.test(l));
  const node = (sh, p) => { const i = sh.resolve(p); return i == null ? null : sh.node(i); };

  LESSONS.push(
    {
      id: 'sistemas-de-archivos', module: 'sa', title: 'Sistemas de archivos: estructura, bloques y SA virtual',
      keywords: 'sistema de archivos SA formatear formateo lógico raw crudo driver capas control de E/S sistema básico módulo de organización sistema lógico sector bloque cluster 4 KB SA virtual VFS implementación de directorios lista lineal hash',
      tldr: 'Un SA es <b>estructura + funciones</b> para guardar archivos y recuperarlos de forma eficiente. <b>Formatear</b> es inicializar esa estructura en una partición. La unidad mínima de asignación del SA es el <b>bloque</b> (cluster), de varios sectores consecutivos (típicamente 8 × 512 B = 4 KB). El <b>SA virtual</b> da las mismas LS para cualquier SA real.',
      goals: ['Definir SA y formateo, y explicar el almacenamiento crudo.', 'Relacionar sectores y bloques, y elegir un tamaño de bloque.', 'Explicar el SA virtual.'],
      body: `
<h2>Qué es un sistema de archivos</h2>
<p>La cátedra lo explica con analogías del mundo físico: una pila de revistas, un bibliorato, un archivador con cajones, un fichero de tarjetas de biblioteca, estanterías con cajones de distintos tamaños. En cada uno hay que pensar las funciones (guardar, buscar, abrir, eliminar, renombrar), cuánto cuesta cada una, cuál es la mínima unidad de asignación y si hay directorios.</p>
${def('Sistema de archivos', 'Estructuras y funciones para operar con archivos: una forma de guardarlos para luego poder recuperarlos de manera eficiente.', 'Diapositivas, Capítulo 10')}
<ul>
  <li><b>Particionar</b> es preparar un área para almacenar datos; para que guarde archivos hay que ponerle un SA: <b>formatear</b> = inicializar la estructura del SA en una partición o volumen (tablas, directorios, tamaño de bloque…). Como colocar las estanterías y preparar las tarjetas de la biblioteca.</li>
  <li>Hay muchos SA, con ventajas y desventajas según los archivos y el propósito. Puede haber muchos SA en una máquina.</li>
  <li>Sin formatear, una partición se puede usar <b>cruda</b> (raw): el programador define cómo usarla (por ejemplo, como un único archivo de registros; algunas bases de datos lo hacen).</li>
  <li>Como hay muchos SA, el SO los organiza en <b>drivers</b> modulares y en capas: las funciones del SA están en el driver.</li>
</ul>
${table(['Capa (11.1)', 'Qué hace'], [['Sistema lógico de archivos', 'Metadatos y directorios; bloques de control de archivo (FCB, el inodo); protección'], ['Módulo de organización de archivos', 'Traduce bloques lógicos del archivo a bloques físicos; espacio libre'], ['Sistema básico de archivos', 'Pide a los drivers leer o escribir ciertos bloques de disco'], ['Control de E/S', 'Drivers y manejadores de interrupciones'], ['Dispositivos', '']])}
<h2>Sectores y bloques</h2>
<ul>
  <li>El <b>sector</b> es la mínima unidad de lectura o escritura del HDD (se fija en el formateo físico, usualmente 512 B). Como unidad de asignación de un SA es estadísticamente ineficiente.</li>
  <li>El SA asigna por <b>bloques</b> (clusters, racimos) de varios sectores <b>consecutivos</b>: típicamente 8 sectores = <b>4 KB</b> (coincide con el tamaño de página). Se fija al formatear y el usuario puede cambiarlo.</li>
  <li>Cada pedido al disco es de un bloque completo: ya que se pagó la búsqueda y la latencia rotacional, se aprovecha para traer varios sectores, por el principio de <b>localidad</b>.</li>
  <li>A veces a los sectores se los llama bloques de disco y a los clusters bloques de E/S; acá “bloque” es el cluster.</li>
  <li>El tamaño óptimo depende de la localidad, las aplicaciones y el tamaño de los archivos: muchos archivos de ~1 KB con bloques de 4 KB desperdician ~3 KB cada uno (<b>fragmentación interna</b>). Particionar permite tener distintos tamaños de bloque y acortar los saltos del brazo.</li>
</ul>
<h2>SA virtual (11.2.3, solo lo de la p. 375)</h2>
<p>El kernel UNIX tiene LS para archivos (open, close, write) pensadas para su SA nativo (ext), pero debe soportar muchos SA de forma modular. Si cada aplicación tuviera que usar <code>open_fat32()</code>, <code>open_ntfs()</code>… sería inmanejable. El <b>SA virtual</b> ofrece las mismas LS para todos: las aplicaciones usan solo esas, y el driver del SAV sabe qué SA real hay y traduce <code>open()</code> en la operación correcta, de forma transparente. De 11.2 solo va 11.2.3.</p>
<h2>Implementación de directorios (11.3)</h2>
<p><b>Lista lineal</b> de nombres con punteros a los bloques: simple, pero buscar es lineal (11.3.1: donde dice búsqueda “ordinaria” debería decir “<b>binaria</b>”, si la lista está ordenada). <b>Tabla hash</b> (11.3.2, solo el primer párrafo): acelera la búsqueda. ext3/ext4 usan lista lineal hasta cierto tamaño y, al excederlo, crean un índice hash.</p>`,
      quiz: [
        { q: '¿Qué es formatear (en el sentido lógico) una partición?', o: ['Inicializar la estructura de un SA', 'Borrar todos los sectores escribiéndolos con ceros', 'Definir los sectores físicos del disco', 'Crear la tabla de particiones del disco'], a: 0, e: 'El formateo lógico lo hace el SA; el físico (sectores) es de bajo nivel.' },
        { q: '¿Por qué los SA asignan espacio por bloques de varios sectores?', o: ['Porque cada acceso cuesta y conviene traer varios sectores', 'Porque el disco no permite leer ni escribir un sector suelto', 'Porque así se elimina la fragmentación interna de los archivos', 'Porque la tabla de particiones solo admite bloques de 4 KB'], a: 0, e: 'Un sector es poco para el costo de acceder; un bloque de 4 KB aprovecha mejor cada acceso.' },
        { q: 'Si se guardan muchos archivos de ~1 KB en un SA con bloques de 4 KB:', o: ['Se pierden ~3 KB por archivo', 'Se produce fragmentación externa entre los bloques', 'El SA no puede guardar archivos menores que un bloque', 'Cada archivo ocupa un solo sector de 512 B'], a: 0, e: 'El bloque es la unidad mínima de asignación.' },
        { q: '¿Para qué sirve el SA virtual?', o: ['Para usar las mismas LS con cualquier SA', 'Para simular un disco completo dentro de un archivo', 'Para cifrar los archivos de cada usuario por separado', 'Para guardar archivos en la memoria virtual del proceso'], a: 0, e: 'El driver del SAV traduce open() a la operación del SA concreto.' },
        { q: 'Una partición sin formatear:', o: ['Se puede usar en crudo (raw)', 'No puede usarse de ninguna manera hasta formatearla', 'Se formatea automáticamente con el SA nativo al primer uso', 'Solo puede usarse como área de intercambio de la MV'], a: 0, e: 'El programador define cómo usarla (algunas bases de datos lo hacen).' },
        { q: '¿Cómo implementan ext3/ext4 los directorios grandes?', o: ['Lista lineal y, si crece, índice hash', 'Siempre con una tabla hash por directorio', 'Con un árbol B guardado en cada inodo', 'Con una tabla FAT independiente por directorio'], a: 0, e: 'Es lo que dicen las diapositivas sobre 11.3.' },
      ],
    },
    {
      id: 'metodos-de-asignacion', module: 'sa', title: 'Métodos de asignación: contigua, enlazada, FAT e indexada (inodo)',
      keywords: 'asignación contigua enlazada FAT tabla de asignación de archivos indexada bloque de índices inodo nodo-i esquema combinado punteros directos indirectos simple doble triple acceso directo secuencial fragmentación',
      tldr: '<b>Contigua</b>: cada archivo en bloques consecutivos (acceso rápido, fragmentación externa). <b>Enlazada</b>: cada bloque apunta al siguiente (sin fragmentación externa, acceso directo lento). <b>FAT</b>: los enlaces en una tabla aparte. <b>Indexada</b>: un bloque de índices con los punteros; el <b>inodo</b> de UNIX combina punteros directos e indirectos simples, dobles y triples.',
      goals: ['Comparar los métodos por acceso directo, secuencial y fragmentación.', 'Calcular el tamaño máximo de archivo con un inodo.'],
      body: `
<p>Cómo asignar el espacio de almacenamiento a los archivos para máxima utilización y eficiencia (11.4). Los “sectores” de las figuras son bloques del SA. Pensá qué método conviene para cada medio del capítulo 12 y repasá 12.4.6.</p>
${table(['Método', 'Cómo', 'Acceso secuencial', 'Acceso directo', 'Problemas'], [
  ['Contigua', 'El directorio guarda bloque inicial y longitud', 'Muy rápido', 'Rápido (inicio + i)', 'Fragmentación externa; difícil hacer crecer un archivo'],
  ['Enlazada', 'Cada bloque tiene un puntero al siguiente; el directorio, el primero (y el último)', 'Bien', '<b>Lento</b>: hay que recorrer la cadena', 'Espacio para punteros; si se rompe un puntero se pierde el resto'],
  ['FAT', 'Enlazada, pero los punteros van en una tabla al principio del volumen (una entrada por bloque)', 'Bien', 'Mejor: se recorre la tabla (que puede estar en caché), no los bloques', 'La tabla puede ser grande; búsquedas del brazo hasta la tabla'],
  ['Indexada', 'Cada archivo tiene un bloque de índices con los punteros a sus bloques', 'Bien', 'Rápido: el i-ésimo puntero', 'Desperdicio del bloque de índices en archivos chicos; archivos muy grandes necesitan más índices'],
])}
${note('En 11.4.3 el libro dice que los esquemas indexados sufren los mismos problemas de rendimiento que la asignación enlazada. <b>No es así</b>: releer el primer párrafo de 11.4.3 (la indexada permite acceso directo sin recorrer una cadena). Y cuando habla de “puntero de archivo” en el esquema combinado, se refiere al campo del bloque de control del archivo que indica la posición actual de lectura o escritura. 11.4.4 en adelante no va.', 'warn')}
<h2>El inodo (esquema combinado de UNIX)</h2>
<p>El <b>inodo</b> (nodo-i, nodo índice) es el bloque de control de un archivo: guarda sus <b>atributos</b> (tipo, permisos, dueño, grupo, tamaño, fechas, cantidad de enlaces) y los <b>punteros</b> a sus bloques. <b>No</b> guarda el nombre (eso está en el directorio).</p>
<ul>
  <li>12 punteros <b>directos</b> a bloques de datos (archivos chicos: acceso inmediato).</li>
  <li>1 puntero <b>indirecto simple</b>: a un bloque lleno de punteros a datos.</li>
  <li>1 <b>indirecto doble</b>: a un bloque de punteros a bloques de punteros.</li>
  <li>1 <b>indirecto triple</b>.</li>
</ul>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'calc', title: 'Tamaño máximo de un archivo con inodo', fields: [{ id: 'b', label: 'Tamaño de bloque (B)', options: ['1024', '2048', '4096', '8192'], value: '4096' }, { id: 'p', label: 'Tamaño de puntero (B)', value: 4 }, { id: 'd', label: 'Punteros directos', value: 12 }],
        run: (v) => { const r = so.inodeMax(+v.b, Math.max(1, v.p), Math.max(0, Math.round(v.d))); const fmt = (x) => (x >= 2 ** 40 ? `${num(x / 2 ** 40)} TiB` : x >= 2 ** 30 ? `${num(x / 2 ** 30)} GiB` : x >= 2 ** 20 ? `${num(x / 2 ** 20)} MiB` : `${num(x / 1024)} KiB`); return `Punteros por bloque: k = ${v.b} / ${v.p} = ${r.k}\nDirectos: ${v.d} bloques = ${fmt(v.d * v.b)}\nSimple: k = ${r.k} bloques = ${fmt(r.k * v.b)}\nDoble: k² = ${num(r.k ** 2, 0)} bloques = ${fmt(r.k ** 2 * v.b)}\nTriple: k³ = ${num(r.k ** 3, 0)} bloques = ${fmt(r.k ** 3 * v.b)}\nMáximo ≈ ${fmt(r.bytes)} (sin contar límites propios del SA)`; } }],
      quiz: [
        { q: '¿Qué método de asignación tiene acceso directo lento?', o: ['Enlazada', 'Contigua', 'Indexada', 'FAT con la tabla en caché'], a: 0, e: 'Para llegar al bloque i hay que leer los i − 1 anteriores.' },
        { q: '¿Qué guarda un inodo?', o: ['Atributos y punteros a los bloques', 'El nombre del archivo y su contenido', 'El nombre y la ubicación del archivo en el disco', 'Solo los permisos y el dueño del archivo'], a: 0, e: 'El nombre está en la entrada de directorio (el enlace duro).' },
        { q: '¿Qué problema tiene la asignación contigua?', o: ['Fragmentación externa', 'Acceso directo lento', 'Si se rompe un puntero se pierde el resto', 'Un bloque de índices desperdiciado por archivo'], a: 0, e: 'Es el mismo problema de la asignación contigua de memoria.' },
        { q: 'En FAT, ¿dónde están los enlaces entre los bloques de un archivo?', o: ['En una tabla al principio del volumen', 'Al final de cada bloque de datos del archivo', 'En el inodo del archivo, uno por bloque', 'En la entrada de directorio, uno por bloque'], a: 0, e: 'Es asignación enlazada con los punteros separados de los datos.' },
        { q: 'Con bloques de 4 KB y punteros de 4 B, ¿a cuántos bloques apunta un indirecto simple?', o: ['1024', '4096', '12', '512'], a: 0, e: '4096 / 4 = 1024 punteros por bloque.' },
        { q: 'Según la cátedra, la afirmación del libro de que la indexada sufre los mismos problemas que la enlazada:', o: ['Es incorrecta: la indexada permite acceso directo', 'Es correcta: ambas recorren los bloques en orden', 'Es correcta solo para archivos pequeños con punteros directos', 'Es correcta solo con punteros indirectos triples'], a: 0, e: 'Es una de las aclaraciones de las diapositivas sobre 11.4.3.' },
      ],
      open: [{ t: 'num', q: 'Inodo con 12 punteros directos e indirecto simple, bloques de 1 KB y punteros de 4 B. ¿Cuántos bloques de datos se direccionan con los directos más el indirecto simple?', a: 268, e: 'k = 1024 / 4 = 256. Directos 12 + simple 256 = 268 bloques (268 KB).' }],
    },
    {
      id: 'archivos-y-directorios', module: 'sa', title: 'Archivos, directorios, enlaces, rutas y montaje',
      keywords: 'archivo atributos operaciones tipo extensión número mágico script directorio entrada estructura un nivel dos niveles árbol grafo acíclico general enlace duro hard link enlace simbólico soft link ln ruta absoluta relativa montaje mount raíz',
      tldr: 'Un <b>archivo</b> es una colección de datos con una relación definida por su creador, y un nombre. Un <b>directorio</b> es un archivo especial: una lista de <b>enlaces duros</b> (pares nombre–inodo); no “contiene” archivos. Un <b>enlace simbólico</b> es un archivo especial que guarda una <b>ruta</b>. <b>Montar</b> es hacer visible un SA para el SO.',
      goals: ['Definir archivo y directorio como la cátedra.', 'Comparar enlaces duros y simbólicos.', 'Escribir rutas absolutas y relativas.', 'Explicar el montaje en UNIX y en Windows.'],
      body: `
<h2>Archivos (10.1)</h2>
${def('Archivo', 'Colección de datos con una relación definida por su creador, y un nombre.', 'Diapositivas, Capítulo 10')}
<ul>
  <li><b>Atributos</b> además del nombre: tipo, número (inodo), fechas, permisos, tamaño… varían según el SA.</li>
  <li><b>Operaciones</b> que provee el SA: crear, abrir, cerrar, leer, escribir, renombrar, eliminar, buscar (10.1.2: solo la p. 335 y el primer párrafo de la 336).</li>
  <li><b>Tipo</b> (10.1.3): el formato del contenido. Se indica con la <b>extensión</b> (idea del formato sin abrirlo) o con una <b>cabecera</b>, como el <b>número mágico</b> (los primeros bytes: <code>\\x7fELF</code> en un ejecutable de Linux; así trabaja <code>file</code>). El ejemplo de OS X no va.</li>
  <li>Archivo por lotes (script de shell): ¿quién ejecuta sus comandos? No el SO sino el <b>intérprete</b> (bash) que lo lee: la bibliografía no es del todo precisa ahí.</li>
  <li>10.1.4 no va; 10.1.5 (estructura interna) sí: el disco se lee por bloques y los registros lógicos se empaquetan en bloques físicos, con fragmentación interna en el último. 10.2 (métodos de acceso: secuencial, directo, indexado) no va.</li>
</ul>
<h2>Directorios (10.3)</h2>
<p>A la cátedra no le gusta la definición de 10.3.2 (“tabla de símbolos que traduce nombres a entradas de directorio”: ¿definición recursiva?). Mejor: en una biblioteca, para no recorrer las estanterías cada vez, se registran los libros y sus ubicaciones en una lista aparte: <b>esa lista es el directorio</b>. Las estanterías contienen los libros; el directorio, referencias.</p>
${def('Directorio', 'Archivo especial que no contiene otros archivos: es una tabla con el nombre de cada archivo y dónde encontrar su contenido (una lista de enlaces duros). Sirve para agrupar, clasificar y jerarquizar archivos.', 'Diapositivas, Capítulo 10. El nombre debe ser único en cada directorio.')}
${table(['Estructura', 'Cómo es', 'Comentario'], [
  ['Un nivel', 'Un único directorio para todos', 'Nombres únicos en todo el sistema; inmanejable con muchos archivos'],
  ['Dos niveles', 'Un directorio por usuario', 'Aísla usuarios, pero no permite agrupar dentro'],
  ['Árbol', 'Subdirectorios anidados desde una raíz', 'Rutas absolutas y relativas; no permite compartir'],
  ['Grafo acíclico', 'Árbol + enlaces para compartir archivos o directorios', 'Un archivo puede tener varios nombres; borrar requiere contar referencias'],
  ['Grafo general', 'Se permiten ciclos', 'Búsquedas que pueden no terminar, recorrer lo mismo varias veces; hace falta recolección de basura'],
])}
<h2>Enlaces duros y simbólicos</h2>
${table(['', 'Enlace duro (hard link)', 'Enlace simbólico (soft link)'], [
  ['Qué es', 'Un par <b>nombre – inodo</b>: una <b>entrada de directorio</b>, no un archivo', 'Un <b>archivo especial</b> (tipo <code>l</code>) que contiene una <b>ruta</b>'],
  ['Inodo', 'El mismo que el archivo original', 'Uno propio'],
  ['Otro SA', 'No puede apuntar a otro SA', 'Puede'],
  ['Destino inexistente', 'No puede existir', 'Puede (queda “colgado”)'],
  ['A directorios', 'El usuario no puede (el SO sí: <code>.</code> y <code>..</code>)', 'Sí'],
  ['Al borrar el original', 'Los datos siguen mientras quede algún enlace (cuenta de enlaces &gt; 0)', 'El enlace queda roto'],
  ['Tamaño', 'El del archivo', 'La longitud de la ruta que guarda'],
])}
<p>Ambos se crean con <code>ln</code> (<code>ln -s</code> el simbólico). El primer enlace duro se crea <b>al crear el archivo</b>. La <b>cuenta de enlaces</b> aparece en <code>ls -l</code> y <code>stat</code>. El simbólico es parecido al acceso directo de Windows.</p>
<h2>Rutas</h2>
<p>Cadena que identifica un archivo o directorio en un SA. <b>Absoluta</b> si incluye la raíz (<code>/home/usuario/programa1.c</code>, <code>C:\\Archivos de Programa\\DevC\\programa.exe</code>); <b>relativa</b> al directorio actual si no (<code>./a.out</code>, <code>../usuario2/programa1.c</code>, <code>cd ..</code>).</p>
<h2>Montaje (10.4)</h2>
<ul>
  <li>Un medio puede estar conectado y su SA no ser visible por falta de <b>drivers</b> o por no estar <b>montado</b>.</li>
  <li><b>Montar</b> es hacer que un SA sea visible para el SO (conectarlo lógicamente), y por lo tanto para usuarios y procesos.</li>
  <li><b>Windows</b>: una raíz por SA (C:\\, D:\\). <b>UNIX/Linux</b>: una sola raíz (/), sin letras; los SA se montan en cualquier directorio (si no está vacío, lo “tapa” sin borrarlo) y se pueden desmontar.</li>
  <li>Los SO suelen montar automáticamente al arrancar y al conectar medios extraíbles.</li>
</ul>
<div class="lab-mount" data-lab="0"></div>`,
      labs: [{ type: 'shell', title: 'Terminal simulada: inodos y enlaces (TP 11, ej. 4)', user: 'alumno', tasks: [
        { t: 'En <code>/tmp</code> creá el directorio <code>ejemplo</code> y mirá su inodo con <code>stat ejemplo</code>', check: (sh) => sh.resolve('/tmp/ejemplo') != null && histHas(sh, /^stat\s+.*ejemplo/) },
        { t: 'Dentro, creá <code>d1</code> y <code>d2</code> y listá con <code>ls -ali</code>: ¿a quién pertenecen los inodos de <code>.</code> y <code>..</code>?', check: (sh) => sh.resolve('/tmp/ejemplo/d1') != null && sh.resolve('/tmp/ejemplo/d2') != null && histHas(sh, /^ls\s+-\w*i/) },
        { t: 'Creá el archivo <code>uno</code>, un enlace duro <code>dos</code> y uno simbólico <code>tres</code>', check: (sh) => { const a = sh.resolve('/tmp/ejemplo/dos'); const t = node(sh, '/tmp/ejemplo/tres'); return a != null && histHas(sh, /^ln\s+-s\s+/) && sh.hist.some((l) => /^ln\s+(?!-s)/.test(l)); } },
        { t: 'Borrá <code>uno</code>: ¿qué pasa con <code>dos</code> y con <code>tres</code>? (probá <code>cat</code> en ambos)', check: (sh) => sh.resolve('/tmp/ejemplo/uno') == null && histHas(sh, /^cat\s+.*tres/) },
      ], setup: [], welcome: 'Terminal simulada. Tip: echo hola > uno escribe en un archivo; ls -li muestra el número de inodo y la cuenta de enlaces.\n' }],
      quiz: [
        { q: 'Según la cátedra, ¿qué contiene un directorio?', o: ['Una lista de enlaces duros', 'Los archivos que se guardaron en él', 'Los inodos completos de sus archivos', 'Solo los subdirectorios y sus rutas'], a: 0, e: 'El directorio no contiene archivos: es como el fichero de la biblioteca, con referencias.' },
        { q: 'Se crea un enlace duro dos al archivo uno y después se borra uno. ¿Qué pasa con dos?', o: ['Sigue funcionando, con cuenta de enlaces 1', 'Queda roto, porque apuntaba al nombre uno', 'Se borra automáticamente junto con uno', 'Pasa a ser un enlace simbólico sin destino'], a: 0, e: 'Los datos se liberan recién cuando la cuenta de enlaces llega a 0.' },
        { q: '¿Cuál de estos NO puede hacer un enlace duro?', o: ['Apuntar a un archivo de otro sistema de archivos', 'Tener un nombre distinto al del archivo original', 'Estar en otro directorio del mismo SA', 'Mantener los datos si se borra el nombre original'], a: 0, e: 'El inodo es local a cada SA: un enlace duro no puede cruzar SA. Un simbólico sí.' },
        { q: '¿Qué guarda un enlace simbólico?', o: ['Una ruta al destino', 'El número de inodo del destino', 'Una copia del contenido del destino', 'Los permisos del destino'], a: 0, e: 'Por eso su tamaño es la longitud de la ruta y puede apuntar a algo inexistente.' },
        { q: '¿Qué es montar un sistema de archivos?', o: ['Hacerlo visible para el SO', 'Formatearlo con un SA nuevo antes de usarlo', 'Conectar físicamente el disco a la computadora', 'Copiar sus archivos al disco principal del sistema'], a: 0, e: 'Un disco conectado puede no estar montado y por lo tanto no ser visible.' },
        { q: 'El directorio actual es /home/ana. ¿Cuál es una ruta relativa a /home/juan/tp.c?', o: ['../juan/tp.c', '/home/juan/tp.c', '~/juan/tp.c', './juan/tp.c'], a: 0, e: '.. sube a /home. /home/juan/tp.c es absoluta; ~/juan sería /home/ana/juan; ./juan buscaría dentro de /home/ana.' },
        { q: '¿Qué problema trae una estructura de directorios en grafo general (con ciclos)?', o: ['Búsquedas que no terminan o repiten caminos', 'No permite compartir archivos entre usuarios', 'Exige nombres únicos en todo el sistema', 'No admite subdirectorios anidados'], a: 0, e: 'Hay que evitar recorrer ciclos y hace falta recolección de basura para liberar.' },
        { q: '¿Cómo se crea el primer enlace duro a un archivo?', o: ['Al crear el archivo', 'Con ln, después de crear el archivo', 'Con ln -s', 'Al montar el sistema de archivos'], a: 0, e: 'Crear un archivo es crear su inodo y una entrada de directorio con su nombre.' },
      ],
      open: [{ t: 'text', q: 'Compará enlace duro y enlace simbólico.', k: [['entrada de directorio', 'nombre', 'par'], ['inodo'], ['ruta'], ['otro sistema de archivos', 'otro sa', 'otro sistema', 'inexistente', 'no existir']], need: 3, e: 'El enlace duro es una entrada de directorio, un par nombre–inodo: comparte el inodo con el original, no puede apuntar a otro SA ni a algo inexistente, y los datos siguen mientras quede algún enlace. El simbólico es un archivo especial con su propio inodo que guarda una ruta: puede apuntar a otro SA, a directorios o a algo inexistente, y se rompe si se borra el destino.' }],
    },
    {
      id: 'tp-sistemas-de-archivos', module: 'sa', title: 'TP 11: sistemas de archivos en Linux',
      keywords: 'TP 11 partición sistema de archivos inodo directorio FAT32 ext2 enlace duro simbólico ruta stat ls -ali tree inodes ciclos',
      tldr: 'El TP 11 pide definiciones (partición, SA, archivo, inodo, directorio en FAT32 y ext2, enlaces, rutas) y experimentos con <code>stat</code>, <code>ls -ali</code> y <code>ln</code> para descubrir qué guarda el inodo y qué el directorio.',
      exercises: [
        { official: '11.1', level: 1, title: 'Definiciones', prompt: '<p>a. ¿Partición? b. ¿SA y relación con la partición? c. ¿Archivo? ¿Inodo? d. ¿Directorio? ¿Qué contiene en FAT32 y en ext2?</p>', solution: { explain: '<p>a. División lógica de un dispositivo, anotada en la tabla de particiones. b. Estructura y funciones para guardar y recuperar archivos; se crea en una partición al formatearla (cada partición, un SA). c. Archivo: colección de datos con una relación definida por su creador, y un nombre. Inodo: bloque de control del archivo en SA tipo UNIX, con atributos y punteros a los bloques. d. Archivo especial con la lista de nombres y dónde encontrar el contenido. En <b>FAT32</b> cada entrada tiene el nombre y además los <b>atributos</b> (tamaño, fechas, atributos) y el primer cluster (el resto está en la FAT). En <b>ext2</b> cada entrada tiene solo el <b>nombre y el número de inodo</b>; los atributos están en el inodo.</p>' } },
        { official: '11.2', level: 1, title: 'Enlaces', prompt: '<p>¿Qué es un enlace duro y uno simbólico? Diferencias, similitudes, ventajas y desventajas.</p>', solution: { explain: '<p>Ver la tabla de la lección. Similitudes: ambos dan otro nombre para llegar a un archivo y se crean con ln. Ventajas del duro: no se rompe si se borra el original; del simbólico: cruza SA, apunta a directorios y es visible como enlace.</p>' } },
        { official: '11.3', level: 1, title: 'Rutas', prompt: '<p>¿Qué es una ruta? ¿Qué tipos hay? Dos ejemplos de cada una.</p>', solution: { explain: '<p>Cadena que identifica un archivo o directorio en un SA. Absoluta (desde la raíz): <code>/etc/passwd</code>, <code>/home/alumno/tp1/a.c</code>. Relativa (desde el directorio actual): <code>../tp2/b.c</code>, <code>./a.out</code>.</p>' } },
        { official: '11.4', level: 2, title: 'stat, ls -ali y enlaces', prompt: '<p>En /tmp/ejemplo: a. Interprete stat. b. Cree d1 y d2: ¿qué coincide entre ls -ai y stat? c. Dentro de d1, ¿qué hay? ¿A quién pertenecen los inodos? d. Cree uno, un enlace duro dos y uno simbólico tres: inodos y cuenta de enlaces. e. ¿Qué información está en el inodo y cuál no? f. Borre uno y luego dos: ¿qué pasa?</p>', solution: { explain: '<p>a. Nombre, tamaño, bloques, bloque de E/S, tipo, dispositivo, número de inodo, enlaces, permisos, Uid/Gid y fechas. b. El número de inodo que muestra ls -i coincide con el de stat. c. Aparecen <code>.</code> (inodo del propio d1) y <code>..</code> (inodo de ejemplo): son enlaces duros a directorios que crea el SO; sirven para las rutas relativas. Por eso ejemplo tiene cuenta de enlaces 4 (su nombre en /tmp, su “.” y los “..” de d1 y d2). d. uno y dos tienen el mismo inodo y cuenta 2; tres tiene otro inodo, cuenta 1 y tamaño 3 (la longitud de “uno”). e. El inodo tiene todo lo que muestra stat salvo el nombre: el nombre está en el directorio (por eso dos nombres comparten los mismos datos y permisos). f. Al borrar uno, dos sigue con el contenido y su cuenta baja a 1; tres queda roto (apunta a “uno”, que no existe). Al borrar dos, la cuenta llega a 0 y se libera el inodo; tres sigue roto.</p>' } },
        { official: '11.5', level: 3, title: 'La estructura con enlaces', prompt: '<p>Reproduzca la estructura de la figura del TP con sus enlaces; compare tree --inodes con dir -i; analice el tamaño de los enlaces simbólicos; ciclos; rutas absolutas y relativas.</p>', solution: { explain: '<p>Sin la figura no se puede dar la solución exacta, pero las claves: si <code>tree --inodes</code> y <code>dir -i</code> muestran inodos distintos para un mismo nombre, es porque uno muestra el inodo del <b>enlace simbólico</b> y el otro el del <b>destino</b> (tree sigue o no los enlaces). El tamaño de un enlace simbólico es la longitud de la ruta que contiene. Los ciclos (por enlaces simbólicos a directorios ancestros) hacen que una búsqueda recursiva no termine o repita caminos; sin contar los simbólicos no hay ciclos, porque el usuario no puede crear enlaces duros a directorios. Con lazos, hay infinitas rutas a un mismo archivo.</p>' } },
      ],
      body: `<p>Practicá en la terminal de la <a href="#/archivos-y-directorios">lección de archivos y directorios</a>: tiene las tareas del ejercicio 4. Comandos del TP: <code>cd, ls, mkdir, ln, touch, cp, mv, stat, rm</code> (y <code>tree</code>).</p>`,
      quiz: [
        { q: 'En un SA ext2, una entrada de directorio contiene:', o: ['El nombre y el número de inodo', 'El nombre, el tamaño, las fechas y el primer bloque', 'Solo el número de inodo', 'El inodo completo del archivo'], a: 0, e: 'En FAT32, en cambio, la entrada tiene los atributos y el primer cluster.' },
        { q: 'Un directorio recién creado d1 dentro de ejemplo tiene cuenta de enlaces 2. ¿Por qué?', o: ['Por su nombre en ejemplo y su propio “.”', 'Porque todo directorio tiene un enlace simbólico oculto a sí mismo', 'Por su nombre en ejemplo y por su propio “..”', 'Porque el SO crea una copia de respaldo del directorio'], a: 0, e: '“..” dentro de d1 apunta a ejemplo, no a d1: suma a la cuenta de ejemplo.' },
      ],
    },
  );

  LESSONS.push(
    {
      id: 'permisos-unix', module: 'seguridad', title: 'Protección: usuarios, permisos rwx, ACL y bits especiales',
      keywords: 'protección control de acceso tipos de acceso ACL lista de acceso condensada dueño grupo otros rwx chmod chown chgrp octal sticky bit SUID SGID /etc/passwd /etc/group /etc/shadow umask mesg write',
      tldr: 'La protección se hace con <b>control de acceso</b>: qué usuario puede hacer qué operación con cada archivo. Una <b>ACL</b> completa lista usuario por usuario; UNIX usa por defecto la versión <b>condensada</b>: permisos <b>rwx</b> para dueño, grupo y otros. En directorios, <b>r</b> lista, <b>w</b> crea y borra (con x), <b>x</b> permite entrar. El <b>sticky bit</b>, el <b>SUID</b> y el <b>SGID</b> completan el esquema.',
      goals: ['Comparar ACL completa y condensada.', 'Interpretar y cambiar permisos en archivos y directorios.', 'Explicar sticky bit, SUID y SGID.'],
      body: `
<h2>Compartir y proteger (10.5, 10.6)</h2>
<p>En un SO multiusuario se busca compartir y proteger: hace falta <b>acceso controlado</b>. Los <b>tipos de acceso</b> son las operaciones posibles (leer, escribir, ejecutar, agregar, borrar, listar). La protección se hace con <b>control de acceso</b>:</p>
${table(['', 'Lista de control de acceso (ACL) completa', 'ACL condensada (dueño, grupo, otros)'], [
  ['Qué guarda', 'Para cada archivo, cada usuario y qué puede hacer', 'Tres clases de usuarios con tres permisos cada una'],
  ['A favor', 'Máximo detalle', 'Compacta, de tamaño fijo, rápida de verificar'],
  ['En contra', 'Larga de construir y de tamaño variable', 'Menos expresiva: no distingue usuarios dentro de “otros”'],
  ['Quién la usa', 'Windows; en Linux, se puede activar en algunos SA', 'Linux por defecto'],
])}
<p>10.5.2 (SA remotos), 10.5.3 (semántica de coherencia), 10.6.2 desde el ejemplo de Sara en adelante y 10.6.3 no van; 10.7 (resumen) sí.</p>
<h2>rwx en archivos y en directorios</h2>
${table(['Permiso', 'En un archivo', 'En un directorio'], [
  ['r', 'Leer el contenido', 'Listar los nombres (ls)'],
  ['w', 'Modificar el contenido', 'Crear, borrar y renombrar entradas (necesita también x)'],
  ['x', 'Ejecutarlo', 'Entrar (cd) y acceder a lo que contiene por su nombre'],
])}
${note('Borrar un archivo es modificar el <b>directorio</b> (quitar una entrada): depende del permiso w del directorio, no del archivo. Por eso, sin el sticky bit, en un directorio con w para todos cualquiera puede borrar archivos ajenos.', 'exam')}
<h2>Bits especiales</h2>
${table(['Bit', 'Octal', 'En ls', 'Efecto'], [
  ['SUID', '4000', '<code>rws------</code>', 'Un ejecutable corre con los permisos de su <b>dueño</b> (ej. <code>passwd</code>, dueño root, puede escribir /etc/shadow)'],
  ['SGID', '2000', '<code>---rws---</code>', 'Un ejecutable corre con los permisos de su <b>grupo</b> (ej. <code>write</code>, grupo tty); en un directorio, lo creado adentro hereda su grupo'],
  ['Sticky', '1000', '<code>------rwt</code>', 'En un directorio con w para todos (como <code>/tmp</code>), cada uno solo puede borrar o renombrar <b>sus propios</b> archivos'],
])}
<div class="lab-mount" data-lab="0"></div>
<h2>Cuentas</h2>
${table(['Archivo', 'Contenido', 'Permisos'], [
  ['<code>/etc/passwd</code>', 'Una línea por cuenta: usuario:x:UID:GID:comentario:home:shell (la x indica que la contraseña está en shadow)', '644: todos lo leen'],
  ['<code>/etc/group</code>', 'grupo:x:GID:miembros', '644'],
  ['<code>/etc/shadow</code>', 'Las contraseñas cifradas (hash) y sus vencimientos', '640, root:shadow: un usuario común no puede leerlo'],
])}
<p>Comandos: <code>chmod</code> (permisos: octal <code>chmod 750 f</code> o simbólico <code>chmod g+w,o-r f</code>), <code>chown</code> (dueño, solo root), <code>chgrp</code> (grupo, el dueño puede cambiarlo a un grupo al que pertenece). Los archivos nuevos nacen con 666 o 777 menos la <b>umask</b> (típicamente 022 → 644 y 755).</p>
<div class="lab-mount" data-lab="1"></div>`,
      labs: [
        { type: 'chmod', title: 'Permisos: rwx ↔ octal', oct: '1777' },
        { type: 'shell', title: 'Terminal simulada: permisos entre dos usuarios (TP 12, ejercicios 3, 6 y 7)', user: 'alumno', welcome: 'Estás como alumno. Con "su usuario" pasás a ser el otro usuario y con "exit" volvés.\n', tasks: [
          { t: 'Intentá leer <code>/etc/shadow</code>', check: (sh) => histHas(sh, /^cat\s+\/etc\/shadow/) },
          { t: 'Creá <code>/tmp/nota</code> (por ejemplo con <code>echo hola &gt; /tmp/nota</code>) y dale escritura a otros', check: (sh) => { const n = node(sh, '/tmp/nota'); return n && +n.mode.slice(-1) & 2; } },
          { t: 'Intentá regalarle el archivo a usuario con <code>chown</code>', check: (sh) => histHas(sh, /^chown\s+/) },
          { t: 'Creá <code>/tmp/uno</code>, <code>/tmp/dos</code> y <code>/tmp/tres</code> con los permisos del ejercicio 7', check: (sh) => { const m = (p) => node(sh, p)?.mode; const o = (p) => +String(m(p) || '0').slice(-1); return o('/tmp/uno') === 0 && o('/tmp/dos') === 5 && /^1\d\d7$/.test(m('/tmp/tres') || ''); } },
          { t: 'Como <code>usuario</code>, intentá borrar un archivo de alumno en <code>/tmp/tres</code>', check: (sh) => histHas(sh, /^su\s+usuario/) && histHas(sh, /^rm\s+.*tres\//) },
        ] },
      ],
      quiz: [
        { q: 'Un directorio tiene permisos r-- para otros. Un usuario “otro” puede:', o: ['Listar los nombres, pero no entrar', 'Entrar y leer los archivos, pero no listarlos', 'Leer los archivos y también listarlos', 'Borrar sus propios archivos del directorio'], a: 0, e: 'r en un directorio permite leer la lista de nombres; para entrar o acceder por nombre hace falta x.' },
        { q: '¿Qué permiso hace falta para borrar un archivo?', o: ['w y x en el directorio', 'w sobre el archivo', 'Ser el dueño del archivo', 'x sobre el archivo'], a: 0, e: 'Borrar es quitar una entrada del directorio. Con sticky bit, además, hay que ser dueño.' },
        { q: '¿Para qué sirve el sticky bit en /tmp?', o: ['Para que cada uno borre solo lo suyo', 'Para que los archivos se borren al reiniciar', 'Para que los archivos hereden el grupo del directorio', 'Para que nadie pueda listar el contenido de /tmp'], a: 0, e: '/tmp tiene permisos 1777: todos escriben, pero cada uno borra solo lo suyo.' },
        { q: 'passwd tiene el bit SUID y su dueño es root. Esto significa que:', o: ['Corre con los permisos de root', 'Solo root puede ejecutarlo', 'Se ejecuta en modo kernel', 'Corre con los permisos del grupo del archivo'], a: 0, e: 'Así puede modificar /etc/shadow. Sigue ejecutando en modo usuario: SUID es un privilegio del SO, no un modo de la CPU.' },
        { q: '¿Qué representa chmod 640?', o: ['rw-r-----', 'rwxr-x---', 'rw-rw----', 'r--r-----'], a: 0, e: '6 = 4 + 2 = rw-, 4 = r--, 0 = ---.' },
        { q: 'Un usuario común intenta chown sobre un archivo propio para dárselo a otro. ¿Qué pasa?', o: ['Falla: solo root puede cambiar el dueño de un archivo', 'Funciona, porque es el dueño', 'Funciona solo si el otro usuario está en su grupo', 'Funciona, pero el archivo pierde los permisos'], a: 0, e: 'Si se pudiera regalar archivos, se podrían evadir cuotas o hacer pasar archivos por ajenos.' },
        { q: '¿Por qué un usuario común no puede leer /etc/shadow?', o: ['Porque “otros” no tiene ningún permiso sobre él', 'Porque está cifrado y el usuario no tiene la clave', 'Porque está en una partición que solo puede montar root', 'Porque es un enlace simbólico roto a otra partición'], a: 0, e: 'Guarda los hashes de las contraseñas: exponerlos facilitaría ataques de diccionario.' },
        { q: 'Linux, por defecto, usa:', o: ['Una ACL condensada (ugo)', 'Una ACL completa por archivo', 'Una contraseña por archivo', 'Capacidades por proceso'], a: 0, e: 'En algunos SA se puede activar la ACL completa (setfacl).' },
      ],
      open: [{ t: 'text', q: '¿Qué permiten r, w y x en un directorio?', k: [['listar', 'ls', 'nombres'], ['crear', 'borrar', 'eliminar', 'renombrar'], ['entrar', 'cd', 'acceder', 'atravesar']], e: 'r permite listar los nombres de las entradas; w permite crear, borrar y renombrar entradas (junto con x); x permite entrar al directorio (cd) y acceder a lo que contiene por su nombre.' }],
    },
    {
      id: 'tp-proteccion', module: 'seguridad', title: 'TP 12: protección y seguridad',
      keywords: 'TP 12 crear usuario /etc/passwd /etc/group /etc/shadow permisos /tmp home chmod chown chgrp sticky bit directorios ACL setfacl write mesg tty SGID desborde de buffer strcpy seguridad.c',
      tldr: 'El TP 12 recorre cuentas, permisos en /tmp y en el home, el sticky bit, un caso que necesita ACL (no alcanza dueño-grupo-otros), el SGID de <code>write</code> con <code>mesg</code>, y un programa con un <b>desborde de búfer</b> que concede acceso sin la contraseña.',
      body: `
<h2>El programa de seguridad.c</h2>
${code(`int main(int argc, char **argv) {
    int acceso = 0;
    char usuario[10], pass[10];
    strcpy(usuario, argv[1]);      /* sin limite: puede escribir fuera del arreglo */
    strcpy(pass, argv[2]);
    if (strcmp(usuario, "admin") == 0 && strcmp(pass, "adminpass") == 0)
        acceso = 1;
    if (acceso) printf("Acceso concedido.\\n");
    else        printf("Nombre de usuario y password incorrectos.\\n");
}`, 'c')}
<ul>
  <li>Propósito: verificar usuario y contraseña recibidos como argumentos.</li>
  <li>Errores: sin argumentos, <code>argv[1]</code> es NULL y strcpy produce violación de segmento. <code>"adminpass"</code> tiene 9 caracteres + '\\0' = 10: entra justo; pero <code>strcpy</code> no controla el tamaño: un argumento de más de 9 caracteres escribe más allá del arreglo, sobre las variables vecinas de la <b>pila</b>. Según cómo el compilador las ubique, puede pisar <code>acceso</code> con un valor distinto de 0 y conceder el acceso <b>sin la contraseña</b>. Con la protección de pila de gcc moderno, en cambio, puede abortar con “stack smashing detected”.</li>
  <li>Corrección: verificar <code>argc</code>, usar funciones con límite (<code>strncpy</code> + terminador, <code>snprintf</code>) o comparar directamente <code>argv[i]</code> sin copiar; no depender de una variable “bandera” que pueda ser pisada.</li>
</ul>`,
      exercises: [
        { official: '12.1', level: 1, title: 'passwd, group y shadow', prompt: '<p>Cree una cuenta y, desde ella, muestre /etc/passwd, /etc/group y /etc/shadow. Evalúe el contenido.</p>', solution: { explain: '<p>passwd: una línea por cuenta con usuario, x, UID, GID, comentario, home y shell. group: nombre, x, GID y miembros. shadow: no se puede mostrar (ver ejercicio 2).</p>' } },
        { official: '12.2', level: 1, title: 'Por qué no se lee shadow', prompt: '<p>Explique por qué no pudo listar /etc/shadow.</p>', solution: { explain: '<p><code>ls -l /etc/shadow</code> muestra <code>-rw-r----- root shadow</code>: solo root escribe y solo root y el grupo shadow leen. El nuevo usuario cae en “otros”, sin permisos. Contiene los hashes de las contraseñas.</p>' } },
        { official: '12.3', level: 2, title: 'Un archivo en /tmp y en el home', prompt: '<p>Cree un archivo en /tmp. a. ¿“usuario” puede leerlo? ¿Y escribirlo? b. ¿Cómo permitiría que escriba? c. ¿Y si estuviera en su home? d. ¿Cómo lo deja en su home pero legible por todos sin cambiar los permisos del home?</p>', solution: { explain: '<p>a. Con umask 022 nace con 644: “usuario” puede leerlo (r para otros) pero no escribirlo. b. <code>chmod o+w archivo</code> (o un grupo común con g+w). c. Depende del home: si es 700 (Debian reciente), “usuario” no puede ni llegar al archivo (le falta x en el directorio), aunque el archivo tenga permisos; si es 755, puede leerlo. d. Con un <b>enlace duro</b> desde un directorio accesible (por ejemplo /tmp) al archivo del home: “usuario” lo abre por esa ruta sin atravesar el home (si /tmp está en el mismo SA; si /tmp es tmpfs, no se puede). Un enlace simbólico no sirve, porque la ruta pasa por el home.</p>' } },
        { official: '12.5', level: 1, title: 'Dar escritura a usuario', prompt: '<p>Haga que “usuario” pueda escribir el archivo del punto 3 y verifíquelo.</p>', solution: { explain: '<p><code>chmod o+w /tmp/archivo</code> (o <code>chmod 646</code>). En otra terminal, como usuario: <code>echo prueba &gt;&gt; /tmp/archivo</code>.</p>' } },
        { official: '12.6', level: 1, title: 'chown', prompt: '<p>Intente cambiar con chown el dueño del archivo a otro usuario. Explique.</p>', solution: { explain: '<p>“Operación no permitida”: en Linux solo root puede cambiar el dueño de un archivo (si no, se podrían evadir cuotas de disco o hacer pasar archivos como de otro). El dueño sí puede cambiar el grupo con chgrp, a uno al que pertenezca.</p>' } },
        { official: '12.7', level: 2, title: 'uno, dos y tres', prompt: '<p>En /tmp: “usuario” debe poder listar y crear en tres y borrar solo sus archivos; listar dos pero no crear ni borrar; no listar, crear ni borrar en uno.</p>', solution: { explain: '<p><code>chmod 1777 /tmp/tres</code> (rwx para todos + sticky bit), <code>chmod 755 /tmp/dos</code> (r-x para otros), <code>chmod 700 /tmp/uno</code> (nada para otros). Verificar como usuario con ls, touch y rm.</p>' } },
        { official: '12.8', level: 2, title: 'Un solo permiso por directorio', prompt: '<p>Tres directorios, cada uno con solo r, solo w o solo x. ¿Qué se puede hacer con cada uno?</p>', solution: { explain: '<p>Solo <b>r</b>: <code>ls</code> lista los nombres (con errores al querer ver detalles), pero no se puede entrar ni abrir archivos. Solo <b>w</b>: prácticamente nada (crear y borrar requieren también x). Solo <b>x</b>: se puede entrar (cd) y abrir archivos cuyo nombre se conoce, pero no listar.</p>' } },
        { official: '12.9', level: 2, title: 'Julio, Juan, Justina…', prompt: '<p>Julio es dueño con control total; Juan y Justina, lectura y escritura; Laura, Sonia y Alberto, solo lectura; el resto, nada. ¿Qué esquema aplica?</p>', solution: { explain: `<p>Con dueño-grupo-otros <b>no alcanza</b>: hay dos niveles de acceso además del dueño (rw y r) y “otros” debe quedar sin nada; solo hay una clase “grupo”. Hace falta una <b>ACL</b>:</p>${code(`chown julio archivo
chgrp escritores archivo          # grupo con juan y justina
chmod 760 archivo                 # julio rwx, escritores rw-, otros ---
setfacl -m u:laura:r,u:sonia:r,u:alberto:r archivo`, 'sh')}<p>(Alternativa sin ACL: un grupo de lectores y escritores no se puede combinar en un solo archivo con ugo.)</p>` } },
        { official: '12.10', level: 3, title: 'write, mesg y SGID', prompt: '<p>Observe permisos y dueños de write (siguiendo los enlaces) y de su terminal (tty). ¿Quién puede escribir en la terminal? ¿Qué tiene de especial write? Ejecute <code>mesg y</code> y repita. Escriba desde otra sesión con write.</p>', solution: { explain: '<p><code>which write</code> → /usr/bin/write, un enlace simbólico a /usr/bin/bsd-write: <code>-rwxr-sr-x root tty</code>, con <b>SGID</b> y grupo tty. La terminal, <code>/dev/pts/0</code>, es un dispositivo de caracteres (c) con <code>crw-------</code> o <code>crw--w----</code>, dueño el usuario y grupo tty. Sin mesg, solo el dueño escribe en ella. <code>mesg y</code> agrega w para el grupo tty: write, que corre con el grupo tty gracias al SGID, puede escribir el mensaje en la terminal. Al hacer write desde la otra sesión, el texto aparece en la terminal original.</p>' } },
        { official: '12.11', level: 3, title: 'seguridad.c', prompt: '<p>a. ¿Propósito? b. ¿Funciona bien? Agregue printf para ver usuario, pass y acceso; explique los errores y corríjalos.</p>', solution: { explain: '<p>Ver el análisis de la lección: verificación de usuario y contraseña con un desborde de búfer por strcpy sin límite, que puede pisar la variable acceso en la pila (o abortar con la protección de pila). Corregir con verificación de argc y copias con límite, o comparando argv directamente.</p>' } },
      ],
      quiz: [
        { q: '¿Por qué strcpy(usuario, argv[1]) es peligroso si usuario es char[10]?', o: ['Porque no controla el tamaño del destino', 'Porque strcpy no copia el carácter nulo final de la cadena', 'Porque argv[1] es de solo lectura y strcpy lo modifica', 'Porque strcpy solo funciona con cadenas de exactamente 10 caracteres'], a: 0, e: 'Es un desborde de búfer, la misma razón por la que gets no debe usarse.' },
        { q: 'Julio dueño, Juan y Justina leen y escriben, Laura, Sonia y Alberto solo leen, y el resto nada. Con permisos dueño-grupo-otros:', o: ['No alcanza: hace falta una ACL', 'Alcanza con chmod 764 y un grupo', 'Alcanza con chmod 754 y un grupo para todos', 'Alcanza con el sticky bit y 760'], a: 0, e: 'Hay una sola clase “grupo”; con “otros” en 0, los lectores quedarían afuera.' },
        { q: 'write tiene SGID con grupo tty. ¿Para qué?', o: ['Para escribir en terminales con permiso para el grupo tty', 'Para correr como root y escribir en cualquier terminal', 'Para que solo los miembros del grupo tty puedan ejecutarlo', 'Para que los mensajes se guarden en un archivo del grupo tty'], a: 0, e: 'mesg y agrega w para el grupo tty en la terminal; write corre con ese grupo.' },
      ],
    },
  );
})();
