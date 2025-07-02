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

function mostrarPreguntas(preguntas) {
    console.clear(); 
    preguntas.forEach((pregunta, index) => {
        decodeHTMLEntities(pregunta.question);
        let opciones = [];

        if (pregunta.type === "boolean") {
            opciones = ["True", "False"];
        } else if (pregunta.type === "multiple") {
            opciones = [...pregunta.incorrect_answers, pregunta.correct_answer];
            opciones = mezclarArray(opciones);
        }

        opciones.forEach((opcion, i) => {
            decodeHTMLEntities(opcion);
        });

        decodeHTMLEntities(pregunta.correct_answer);
    });
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
