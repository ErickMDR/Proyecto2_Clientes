let preguntasActual = [];
let preguntaNum = 0;
let puntaje = 0;
let correctas = 0;
let incorrectas = 0;
let nombreJugador = '';
let tiempoRestante = 20;
let intervalo;
let tiempos = [];

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

    nombreJugador = document.getElementById('nombre').value.trim();
    mostrarSiguientePregunta();
}

function mostrarSiguientePregunta() {
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