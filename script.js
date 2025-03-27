let jugadores = [];
let enfrentamientos = [];
let historialRondas = [];
let ronda = 1;
let rondaFinalizada = false;

// Clase para manejar mejor los jugadores
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

// Funciones principales
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
    
    jugadores.forEach(jugador => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${jugador.nombre}</td>
            <td>${jugador.puntos}</td>
            <td>${jugador.ganadas}</td>
            <td>${jugador.perdidas}</td>
            <td>${jugador.empatadas}</td>
        `;
        tbody.appendChild(row);
    });
}

// Funciones de manejo de rondas
function iniciarRonda() {
    if (jugadores.length < 2) {
        alert("Debe haber al menos 2 jugadores");
        return;
    }
    
    rondaFinalizada = false;
    jugadores.sort(() => Math.random() - 0.5); // Mezcla inicial para primera ronda
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
        
        // Buscar rival adecuado
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
    
    // Manejar jugador libre en caso de número impar
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
    container.innerHTML = `<h3>Ronda ${ronda}</h3>`;
    
    enfrentamientos.forEach(([jugador1, jugador2, resultado], index) => {
        const card = document.createElement("div");
        card.className = "card p-3 my-2";
        card.innerHTML = `
            <h5>Mesa ${index + 1}</h5>
            <button class="btn btn-outline-primary resultado-btn" data-index="${index}" data-result="0">
                ${jugador1.nombre}
            </button>
            vs
            <button class="btn btn-outline-primary resultado-btn" data-index="${index}" data-result="1">
                ${jugador2.nombre}
            </button>
            <button class="btn btn-outline-warning resultado-btn" data-index="${index}" data-result="empate">
                Empate
            </button>
        `;
        container.appendChild(card);
    });
    
    const botonesContainer = document.createElement("div");
    botonesContainer.className = "mt-3";
    
    const siguienteBtn = document.createElement("button");
    siguienteBtn.className = "btn btn-secondary";
    siguienteBtn.textContent = "Siguiente Ronda";
    siguienteBtn.onclick = pasarSiguienteRonda;
    botonesContainer.appendChild(siguienteBtn);
    
    const finalizarBtn = document.createElement("button");
    finalizarBtn.className = "btn btn-danger ms-2";
    finalizarBtn.textContent = "Finalizar Torneo";
    finalizarBtn.onclick = finalizarTorneo;
    botonesContainer.appendChild(finalizarBtn);
    
    if (historialRondas.length > 0) {
        const retrocederBtn = document.createElement("button");
        retrocederBtn.className = "btn btn-info ms-2";
        retrocederBtn.textContent = "Ronda Anterior";
        retrocederBtn.onclick = retrocederRonda;
        botonesContainer.appendChild(retrocederBtn);
    }
    
    container.appendChild(botonesContainer);
    
    setTimeout(agregarEventosBotones, 100);
    actualizarEstadoBotones();
}

function pasarSiguienteRonda() {
    if (enfrentamientos.some(e => e[2] === null)) {
        alert("Debe registrar todos los resultados antes de pasar a la siguiente ronda.");
        return;
    }
    
    // Guardar estado actual en el historial
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
    
    // Actualizar winrates de oponentes
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

// Funciones de manejo de resultados
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
    
    // Revertir resultado anterior si existe
    if (resultadoAnterior !== null) {
        revertirResultado(enfrentamiento, resultadoAnterior);
    }
    
    // Aplicar nuevo resultado si es diferente al anterior
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

// Función de finalización
function finalizarTorneo() {
    if (enfrentamientos.some(e => e[2] === null)) {
        alert("Debe registrar todos los resultados antes de finalizar el torneo.");
        return;
    }
    
    // Actualizar winrates de oponentes para todos los jugadores
    jugadores.forEach(j => j.actualizarWinrateOponentes());
    
    // Ordenar jugadores para resultados finales
    const jugadoresOrdenados = [...jugadores].sort((a, b) => 
        b.puntos - a.puntos || b.winrateOponentes - a.winrateOponentes
    );
    
    // Generar HTML de resultados
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