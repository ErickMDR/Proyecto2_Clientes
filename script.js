let preguntasActual = [];
let preguntaNum = 0;
let puntaje = 0;
let correctas = 0;
let incorrectas = 0;
let nombreJugador = '';
let tiempoRestante = 20;
let intervalo;
let tiempos = [];
let configuracionActual = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const cantidad = document.getElementById('cantidad').value;
        const categoria = document.getElementById('categoria').value;
        const dificultad = document.getElementById('dificultad').value;

        if (!nombre) {
            alert("Por favor, ingresa un nombre válido.");
            return;
        }

        configuracionActual = {
            nombre,
            cantidad,
            categoria,
            dificultad
        };
        mostrarLoader();

        try {
            const trivia = await getTrivia(cantidad, categoria, dificultad);
            mostrarPreguntas(trivia.results);
        } catch (error) {
            console.error('Error obteniendo la trivia:', error);
            alert("Ocurrió un error al obtener la trivia. Intenta nuevamente.");
        } finally {
            ocultarLoader(); 
        }
    });
});

async function getTrivia(amount, category, difficulty) {
    let url = `https://opentdb.com/api.php?amount=${amount}`;

    if (category !== 'any') {
        url += `&category=${category}`;
    }

    if (difficulty) {
        url += `&difficulty=${difficulty}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("La respuesta de la API no fue exitosa");
    }

    const data = await response.json();

    if (data.response_code !== 0) {
        throw new Error("La API no devolvió preguntas válidas");
    }

    return data;
}

function decodeHTMLEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
}

function mezclarArray(array) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

function mostrarLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function ocultarLoader() {
    document.getElementById('loader').classList.add('hidden');
}

function mostrarPreguntas(preguntas) {
    document.querySelector('.container').classList.add('hidden');
    document.getElementById('juego').classList.remove('hidden');

    preguntasActual = preguntas.map(p => {
        const opciones = mezclarArray([...p.incorrect_answers, p.correct_answer]);
        return {
            pregunta: decodeHTMLEntities(p.question),
            opciones: opciones.map(op => decodeHTMLEntities(op)),
            correcta: decodeHTMLEntities(p.correct_answer)
        };
    });

    nombreJugador = configuracionActual.nombre;
    mostrarSiguientePregunta();
}

function mostrarSiguientePregunta() {
    if (preguntaNum >= preguntasActual.length) {
        mostrarResultados();
        return;
    }

    const pregunta = preguntasActual[preguntaNum];
    const juegoDiv = document.getElementById('juego');
    juegoDiv.innerHTML = `
        <div class="game-header">
            <span>Pregunta ${preguntaNum + 1} de ${preguntasActual.length}</span>
            <span class="timer" id="temporizador">Tiempo: 20s</span>
        </div>
        <div class="pregunta">${pregunta.pregunta}</div>
        <div class="opciones">
            ${pregunta.opciones.map(opcion => `<button>${opcion}</button>`).join('')}
        </div>
        <div class="scoreboard">
            <span>Puntos: ${puntaje}</span>
        </div>
    `;

    tiempoRestante = 20;
    actualizarTempo();
    intervalo = setInterval(actualizarTempo, 1000);

    document.querySelectorAll('.opciones button').forEach(boton => {
        boton.addEventListener('click', () => responder(boton, pregunta.correcta));
    });
}

function actualizarTempo() {
    const timer = document.getElementById('temporizador');
    tiempoRestante--;
    if (tiempoRestante <= 5) {
        timer.classList.add('urgente');
    }
    timer.textContent = `Tiempo: ${tiempoRestante}s`;

    if (tiempoRestante <= 0) {
        clearInterval(intervalo);
        tiempos.push(20);
        mostrarRespuesta(null);
    }
}

function responder(boton, respuestaCorrecta) {
    clearInterval(intervalo);
    const respuesta = boton.textContent;
    const correcta = respuesta === respuestaCorrecta;
    const botones = document.querySelectorAll('.opciones button');

    botones.forEach(b => {
        b.disabled = true;
        if (b.textContent === respuestaCorrecta) b.classList.add('correcta');
        else if (b === boton) b.classList.add('incorrecta');
    });

    if (correcta) {
        puntaje += 10;
        correctas++;
    } else {
        incorrectas++;
    }

    tiempos.push(20 - tiempoRestante);

    setTimeout(() => {
        preguntaNum++;
        mostrarSiguientePregunta();
    }, 2000);
}

function mostrarRespuesta(respuesta) {
    const pregunta = preguntasActual[preguntaNum];
    const botones = document.querySelectorAll('.opciones button');

    botones.forEach(b => {
        b.disabled = true;
        if (b.textContent === pregunta.correcta) {
            b.classList.add('correcta');
        } else {
            b.classList.add('incorrecta');
        }
    });

    incorrectas++;

    setTimeout(() => {
        preguntaNum++;
        mostrarSiguientePregunta();
    }, 2000);
}

function mostrarResultados() {
    document.getElementById('juego').classList.add('hidden');
    const div = document.getElementById('resultados');
    div.classList.remove('hidden');

    const total = preguntasActual.length;
    const porcentaje = ((correctas / total) * 100).toFixed(1);
    const promedioTiempo = (tiempos.reduce((a, b) => a + b, 0) / total).toFixed(1);

    div.innerHTML = `
        <h2>¡Juego Terminado!</h2>
        <div class="resumen">
            <p><strong>Jugador:</strong> ${nombreJugador}</p>
            <p><strong>Puntaje total:</strong> ${puntaje}</p>
            <p><strong>Correctas:</strong> ${correctas}</p>
            <p><strong>Incorrectas:</strong> ${incorrectas}</p>
            <p><strong>Acierto:</strong> ${porcentaje}%</p>
            <p><strong>Tiempo promedio:</strong> ${promedioTiempo}s</p>
            <button onclick="reiniciarJuego()">Nuevo juego</button>
            <button onclick="cambiarConfiguracion()">Cambiar configuración</button>
            <button onclick="finalizarJuego()">Finalizar</button>
        </div>
    `;
}

function reiniciarJuego() {
    if (!configuracionActual || !configuracionActual.nombre) {
        return location.reload();
    }

    resetStats();
    mostrarLoader();

    getTrivia(configuracionActual.cantidad, configuracionActual.categoria, configuracionActual.dificultad)
        .then(data => {
            mostrarPreguntas(data.results);
        })
        .catch(error => {
            console.error('Error reiniciando el juego:', error);
            alert("No se pudo reiniciar el juego. Intenta nuevamente.");
        })
        .finally(() => {
            ocultarLoader();
        });   
    document.getElementById('resultados').classList.add('hidden'); 
}

function cambiarConfiguracion() {
    document.getElementById('resultados').classList.add('hidden');
    document.querySelector('.container').classList.remove('hidden');
    resetStats();
}

function finalizarJuego() {
    document.body.innerHTML = `
        <div class="Despedida">
            ¡Gracias por jugar!
        </div>
    `;
}

function resetStats() {
    preguntaNum = 0;
    puntaje = 0;
    correctas = 0;
    incorrectas = 0;
    tiempos = [];
}