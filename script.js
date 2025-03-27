let jugadores = [];
let enfrentamientos = [];
let historialRondas = [];
let ronda = 1;
let rondaFinalizada = false;

// Variables para el temporizador
let tiempoRestante = 50 * 60; // 50 minutos en segundos
let intervalo;
let temporizadorActivo = false;

class Jugador {
    constructor(nombre) {
        this.nombre = nombre;
        this.puntos = 0;
        this.ganadas = 0;
        this.perdidas = 0;
        this.empatadas = 0;
        this.oponentes = [];
        this.winrateOponentes = 0;
    }

    calcularWinrate() {
        const totalPartidos = this.ganadas + this.perdidas + this.empatadas;
        if (totalPartidos === 0) return 0;
        return (this.ganadas * 3 + this.empatadas * 1) / (totalPartidos * 3) * 100;
    }

    actualizarWinrateOponentes() {
        if (this.oponentes.length === 0) {
            this.winrateOponentes = 0;
            return;
        }

        const totalWinrate = this.oponentes.reduce((acc, oponenteNombre) => {
            const oponente = jugadores.find(j => j.nombre === oponenteNombre);
            return acc + (oponente ? oponente.calcularWinrate() : 0);
        }, 0);

        this.winrateOponentes = totalWinrate / this.oponentes.length;
    }
}

// Funciones del temporizador
function iniciarTemporizador() {
    if (temporizadorActivo) return;
    temporizadorActivo = true;
    
    intervalo = setInterval(() => {
        tiempoRestante--;
        actualizarTemporizadorDisplay();
        
        if (tiempoRestante <= 0) {
            finalizarTemporizador();
            alert("¡El tiempo de la ronda ha terminado!");
        }
    }, 1000);
}

function pausarTemporizador() {
    clearInterval(intervalo);
    temporizadorActivo = false;
}

function finalizarTemporizador() {
    clearInterval(intervalo);
    temporizadorActivo = false;
    tiempoRestante = 50 * 60;
    actualizarTemporizadorDisplay();
}

function actualizarTemporizadorDisplay() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    document.getElementById("temporizador").textContent = 
        `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}

// Event listeners para los botones del temporizador
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('iniciarTemporizador').addEventListener('click', iniciarTemporizador);
    document.getElementById('pausarTemporizador').addEventListener('click', pausarTemporizador);
    document.getElementById('finalizarTemporizador').addEventListener('click', finalizarTemporizador);
    actualizarTemporizadorDisplay();
});

// Funciones del jugador
function agregarJugador() {
    const input = document.getElementById("nombreJugador");
    const nombre = input.value.trim();
    
    if (!nombre) return;
    
    jugadores.push(new Jugador(nombre));
    input.value = "";
    actualizarTabla();
}

function resetearJugadores() {
    jugadores = [];
    enfrentamientos = [];
    historialRondas = [];
    ronda = 1;
    rondaFinalizada = false;
    
    actualizarTabla();
    document.getElementById("enfrentamientos").innerHTML = "";
    document.getElementById("resultadosFinales").innerHTML = "";
}

function actualizarTabla() {
    const tbody = document.getElementById("tablaJugadores");
    tbody.innerHTML = "";
    
    jugadores.forEach((jugador, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${jugador.nombre}</td>
            <td>${jugador.puntos}</td>
            <td>${jugador.ganadas}</td>
            <td>${jugador.perdidas}</td>
            <td>${jugador.empatadas}</td>
            <td>
                <button class="btn btn-sm btn-danger eliminar-jugador" data-index="${index}" ${ronda > 1 ? 'disabled' : ''}>
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Agregar eventos a los botones de eliminar
    document.querySelectorAll('.eliminar-jugador').forEach(btn => {
        btn.addEventListener('click', function() {
            eliminarJugador(parseInt(this.dataset.index));
        });
    });
}

function eliminarJugador(index) {
    if (ronda > 1) {
        alert("No puedes eliminar jugadores después de iniciar el torneo");
        return;
    }
    jugadores.splice(index, 1);
    actualizarTabla();
}

function iniciarRonda() {
    if (jugadores.length < 2) {
        alert("Debe haber al menos 2 jugadores");
        return;
    }
    
    rondaFinalizada = false;
    jugadores.sort(() => Math.random() - 0.5);
    generarEnfrentamientos();
    mostrarEnfrentamientos();
}

function generarEnfrentamientos() {
    enfrentamientos = [];
    const jugadoresOrdenados = [...jugadores]
        .sort((a, b) => b.puntos - a.puntos || b.winrateOponentes - a.winrateOponentes);
    
    const emparejados = new Set();
    
    for (let i = 0; i < jugadoresOrdenados.length; i++) {
        const jugadorActual = jugadoresOrdenados[i];
        
        if (emparejados.has(jugadorActual.nombre)) continue;
        
        const rival = jugadoresOrdenados.find(j => 
            !emparejados.has(j.nombre) && 
            j.nombre !== jugadorActual.nombre && 
            !jugadorActual.oponentes.includes(j.nombre)
        );
        
        if (rival) {
            enfrentamientos.push([jugadorActual, rival, null]);
            emparejados.add(jugadorActual.nombre);
            emparejados.add(rival.nombre);
            
            jugadorActual.oponentes.push(rival.nombre);
            rival.oponentes.push(jugadorActual.nombre);
        }
    }
    
    if (jugadoresOrdenados.length % 2 === 1) {
        const jugadorLibre = jugadoresOrdenados.find(j => !emparejados.has(j.nombre));
        if (jugadorLibre) {
            jugadorLibre.puntos += 3;
            emparejados.add(jugadorLibre.nombre);
        }
    }
}

function mostrarEnfrentamientos() {
    const container = document.getElementById("enfrentamientos");
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="mb-0">Ronda ${ronda}</h3>
            <div class="temporizador-container">
                <span id="temporizador">50:00</span>
                <button id="iniciarTemporizador" class="btn btn-sm btn-success ms-2">
                    <i class="bi bi-play"></i>
                </button>
                <button id="pausarTemporizador" class="btn btn-sm btn-warning ms-1">
                    <i class="bi bi-pause"></i>
                </button>
                <button id="finalizarTemporizador" class="btn btn-sm btn-danger ms-1">
                    <i class="bi bi-stop"></i>
                </button>
            </div>
        </div>
    `;
    
    enfrentamientos.forEach(([jugador1, jugador2, resultado], index) => {
        const card = document.createElement("div");
        card.className = "card p-3 my-3 card-match";
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0"><i class="bi bi-table"></i> Mesa ${index + 1}</h5>
                <span class="badge bg-primary">Partido ${index + 1}</span>
            </div>
            <div class="row g-3">
                <div class="col-md-5">
                    <button class="btn btn-outline-primary w-100 resultado-btn py-2" data-index="${index}" data-result="0">
                        <i class="bi bi-person"></i> ${jugador1.nombre}
                    </button>
                </div>
                <div class="col-md-2 text-center align-self-center">
                    <span class="fw-bold">VS</span>
                </div>
                <div class="col-md-5">
                    <button class="btn btn-outline-primary w-100 resultado-btn py-2" data-index="${index}" data-result="1">
                        <i class="bi bi-person"></i> ${jugador2.nombre}
                    </button>
                </div>
                <div class="col-12">
                    <button class="btn btn-outline-warning w-100 resultado-btn py-2" data-index="${index}" data-result="empate">
                        <i class="bi bi-handshake"></i> Empate
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Resto del código para los botones de control de ronda...
    
    setTimeout(agregarEventosBotones, 100);
    actualizarEstadoBotones();
}

function pasarSiguienteRonda() {
    if (enfrentamientos.some(e => e[2] === null)) {
        alert("Debe registrar todos los resultados antes de pasar a la siguiente ronda.");
        return;
    }
    
    guardarEstadoActual();
    
    ronda++;
    rondaFinalizada = false;
    generarEnfrentamientos();
    mostrarEnfrentamientos();
}

function retrocederRonda() {
    if (historialRondas.length === 0) {
        alert("No hay rondas anteriores a las que regresar.");
        return;
    }
    
    const estadoAnterior = historialRondas.pop();
    jugadores = estadoAnterior.jugadores.map(j => Object.assign(new Jugador(), j));
    enfrentamientos = estadoAnterior.enfrentamientos;
    ronda = estadoAnterior.ronda;
    rondaFinalizada = false;
    
    jugadores.forEach(j => j.actualizarWinrateOponentes());
    
    actualizarTabla();
    mostrarEnfrentamientos();
}

function guardarEstadoActual() {
    historialRondas.push({
        jugadores: JSON.parse(JSON.stringify(jugadores)),
        enfrentamientos: JSON.parse(JSON.stringify(enfrentamientos)),
        ronda: ronda
    });
}

function agregarEventosBotones() {
    document.querySelectorAll(".resultado-btn").forEach(button => {
        button.addEventListener("click", function() {
            registrarResultado(parseInt(this.dataset.index), this.dataset.result);
        });
    });
}

function registrarResultado(index, resultado) {
    if (rondaFinalizada) return;
    
    const enfrentamiento = enfrentamientos[index];
    const resultadoAnterior = enfrentamiento[2];
    
    if (resultadoAnterior !== null) {
        revertirResultado(enfrentamiento, resultadoAnterior);
    }
    
    if (resultadoAnterior !== resultado) {
        aplicarResultado(enfrentamiento, resultado);
        enfrentamiento[2] = resultado;
    } else {
        enfrentamiento[2] = null;
    }
    
    actualizarTabla();
    actualizarEstadoBotones();
}

function revertirResultado(enfrentamiento, resultado) {
    const [jugador1, jugador2] = enfrentamiento;
    
    if (resultado === "empate") {
        jugador1.puntos -= 1;
        jugador2.puntos -= 1;
        jugador1.empatadas--;
        jugador2.empatadas--;
    } else {
        const ganador = enfrentamiento[resultado];
        const perdedor = enfrentamiento[1 - resultado];
        
        ganador.puntos -= 3;
        ganador.ganadas--;
        perdedor.perdidas--;
    }
}

function aplicarResultado(enfrentamiento, resultado) {
    const [jugador1, jugador2] = enfrentamiento;
    
    if (resultado === "empate") {
        jugador1.puntos += 1;
        jugador2.puntos += 1;
        jugador1.empatadas++;
        jugador2.empatadas++;
    } else {
        const ganador = enfrentamiento[resultado];
        const perdedor = enfrentamiento[1 - resultado];
        
        ganador.puntos += 3;
        ganador.ganadas++;
        perdedor.perdidas++;
    }
}

function actualizarEstadoBotones() {
    document.querySelectorAll(".resultado-btn").forEach(button => {
        button.classList.remove("active", "btn-success");
        
        // Restaurar clases originales
        if (button.dataset.result === "empate") {
            button.classList.add("btn-outline-warning");
        } else {
            button.classList.add("btn-outline-primary");
        }
    });
    
    enfrentamientos.forEach((enfrentamiento, index) => {
        if (enfrentamiento[2] !== null) {
            const botonActivo = document.querySelector(`[data-index="${index}"][data-result="${enfrentamiento[2]}"]`);
            if (botonActivo) {
                botonActivo.classList.add("active", "btn-success");
                botonActivo.classList.remove("btn-outline-primary", "btn-outline-warning");
            }
        }
    });
}

function finalizarTorneo() {
    if (enfrentamientos.some(e => e[2] === null)) {
        alert("Debe registrar todos los resultados antes de finalizar el torneo.");
        return;
    }
    
    jugadores.forEach(j => j.actualizarWinrateOponentes());
    
    const jugadoresOrdenados = [...jugadores].sort((a, b) => 
        b.puntos - a.puntos || b.winrateOponentes - a.winrateOponentes
    );
    
    const resultadoFinal = document.createElement("div");
    resultadoFinal.innerHTML = `
        <h2>Resultados Finales</h2>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Posición</th>
                    <th>Nombre</th>
                    <th>Puntos</th>
                    <th>Ganadas</th>
                    <th>Perdidas</th>
                    <th>Empates</th>
                    <th>Winrate Oponentes</th>
                </tr>
            </thead>
            <tbody>
                ${jugadoresOrdenados.map((jugador, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${jugador.nombre}</td>
                        <td>${jugador.puntos}</td>
                        <td>${jugador.ganadas}</td>
                        <td>${jugador.perdidas}</td>
                        <td>${jugador.empatadas}</td>
                        <td>${jugador.winrateOponentes.toFixed(2)}%</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
    
    document.getElementById("resultadosFinales").innerHTML = "";
    document.getElementById("resultadosFinales").appendChild(resultadoFinal);
}