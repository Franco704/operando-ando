# Operando Ando

Guía de estudio de **Sistemas Operativos 2026 (UTN-FRT, Ingeniería en Sistemas de Información, comisiones 2K1 a 2K8)**, armada con las diapositivas de la cátedra, los trabajos prácticos y laboratorios 1 a 12 y la bibliografía (Silberschatz, *Fundamentos de Sistemas Operativos*, 7.ª ed.). Las diapositivas dicen qué apartados del libro entran y cuáles no; cada lección lo indica. Separada por parcial, cada uno con su color:

- **Primer parcial** (azul): la materia y el SO, arranque de una PC e instalación, CPU, interrupciones y modos, funciones, bibliotecas, driver y API (clases 0.1 a 1.1). Práctica: TP 1 (comandos de consola) y TP 2 (C básico en Linux).
- **Segundo parcial** (violeta): llamadas al sistema, multiprogramación, servicios y estructuras del SO, procesos (clases 1.2, 1.3, unidades 2 y 3). Práctica: TP 3 (instalación de SO) y TP 5, ejercicios 1 a 10 (administración de procesos).
- **Tercer parcial** (verde azulado): hilos, planificación de CPU, concurrencia, semáforos y monitores, abrazo mortal, gestión de memoria (capítulos 4 a 8). Práctica: TP 4 (hilos), TP 5 ej. 11 y 12, TP 6 (planificación), TP 7 (concurrencia) y TP 8 (semáforos y abrazo mortal).
- **Cuarto parcial** (rosa): memoria virtual, E/S, almacenamiento masivo, sistemas de archivos y archivos (capítulos 9 a 13). Práctica: TP 9 y 10 (memoria virtual), TP de puertos de E/S, TP 11 (sistemas de archivos) y TP 12 (protección y seguridad).
- **Final** (ámbar): toda la materia, sin exclusiones.

Contenido:

- 60 lecciones en 23 módulos, con glifo animado por tema y pantalla de entrada con la confusión típica del parcial.
- 47 laboratorios interactivos: una **terminal simulada** (sistema de archivos con inodos, enlaces y permisos; procesos con señales, `jobs`, `fg` y `bg`), simulador de **planificación de CPU** con diagrama de Gantt (FCFS, SJF, SRTF, prioridades, Round Robin), diagrama de **estados** de un proceso, contador de procesos con **fork()**, **intercalado de instrucciones** con semáforos (carreras, sección crítica, abrazo mortal de lápiz y papel), **algoritmo del banquero**, primer, mejor y peor ajuste, traducción de direcciones y TLB, **sustitución de páginas** (FIFO, óptimo, LRU, anomalía de Belady), **planificación de disco** (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK), RAID, inodos, `chmod` y la caché al recorrer una matriz.
- 341 preguntas de opción múltiple armadas como las del parcial: las opciones incorrectas son confusiones reales y la correcta no se delata por el largo (una prueba automática lo controla). Más 42 preguntas abiertas corregidas al instante, para el final escrito.
- 80 ejercicios resueltos de los TP 1 a 12.
- Cuestionario por módulo, simulacro de cada parcial y del final, repaso de lo fallado, página con todos los laboratorios y un machete por parcial.

Sitio en GitHub Pages: [franco704.github.io/operando-ando](https://franco704.github.io/operando-ando/)

No necesita instalación: es HTML, CSS y JavaScript. Abrí `index.html`. El progreso se guarda en el navegador.

Pruebas: `node tests/so.test.js` (los algoritmos contra los ejemplos de Silberschatz y de las diapositivas: planificación, sustitución de páginas, disco, banquero, ajustes, paginación, fork, permisos) y `node tests/content.test.js --strict` (estructura del contenido, que cada abierta acepte su respuesta y que la correcta no sea casi siempre la opción más larga).

## Notas sobre el material

- **Regularidad.** La diapositiva dice que para regularizar hace falta una calificación mínima de 6,00, pero el ejemplo de la misma clase dice que con 3,5; 10; 10; 10 alcanza con recuperar el primer parcial con 4. La calculadora del estado académico permite elegir; conviene confirmarlo con el docente.
- **TP 5, ejercicio 9.** Ctrl-Z envía **SIGTSTP**, no SIGSTOP: el efecto por defecto es el mismo (detener), pero SIGTSTP se puede atrapar y SIGSTOP no.
- **TP 5, ejercicio 12.** `sleep(0.1)` en C se convierte en `sleep(0)`, porque `sleep` recibe un entero: por eso el consumo de CPU sube al 100 %.
- **Tuberías.** En `ls | grep`, las diapositivas dicen que ls es el padre de grep; en bash los dos son hijos del shell. Lo que importa para el parcial es que las tuberías sin nombre requieren procesos emparentados.
- **TP de puertos de E/S.** `MOV al, 0d500` no entra en AL (un byte): el TP lo simplifica.
- **TP 8.** “sem_wati” es `sem_wait`.
- Aclaraciones de la cátedra sobre el libro que la guía respeta: en 11.3.1, búsqueda “ordinaria” es “binaria”; en 11.4.3, la asignación indexada **no** tiene los mismos problemas de rendimiento que la enlazada; en 9.4, “reiniciar el proceso” es continuar la instrucción que falló.

## También probá

- [Probando Ando](https://franco704.github.io/probando-ando/) ([repositorio](https://github.com/Franco704/probando-ando))
- [Backeando Ando](https://franco704.github.io/backeando-ando/) ([repositorio](https://github.com/Franco704/backeando-ando))
- [Fronteando Ando](https://franco704.github.io/fronteando-ando/) ([repositorio](https://github.com/Franco704/fronteando-ando))
- [Diseñando Ando](https://franco704.github.io/disenando-ando/) ([repositorio](https://github.com/Franco704/disenando-ando))
- [Iterando Ando](https://franco704.github.io/iterando-ando/) ([repositorio](https://github.com/Franco704/iterando-ando))
- [Modulando Ando](https://franco704.github.io/modulando-ando/) ([repositorio](https://github.com/Franco704/modulando-ando))
- [Economizar](https://franco704.github.io/economizar/) ([repositorio](https://github.com/Franco704/economizar))

## Agradecimientos

A **Mateo Rusconi**, autor original de las animaciones que esta guía hereda de Backeando Ando: la pantalla de entrada a cada tema, los glifos animados de las lecciones y los microefectos de los cuestionarios vienen de su "Laboratorio Frontend DSW".
