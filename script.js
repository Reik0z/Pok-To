let jugadores = [];
let enfrentamientos = [];
let ronda = 1;
let rondaFinalizada = false;

function agregarJugador() {
    const input = document.getElementById("nombreJugador");
    const nombre = input.value.trim();
    if (nombre) {
        jugadores.push({ nombre, puntos: 0, ganadas: 0, perdidas: 0, empatadas: 0, oponentes: [] });
        input.value = "";
        actualizarTabla();
    }
}

function resetearJugadores() {
    jugadores = [];
    enfrentamientos = [];
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
        const row = `<tr>
                        <td>${jugador.nombre}</td>
                        <td>${jugador.puntos}</td>
                        <td>${jugador.ganadas}</td>
                        <td>${jugador.perdidas}</td>
                        <td>${jugador.empatadas}</td>
                        <td>${(calcularWinrate(jugador)*100).toFixed(2)}</td>
                     </tr>`;
        tbody.innerHTML += row;
    });
}

function calcularWinrate(jugador) {
    if (jugador.oponentes.length === 0) return 0;
    let totalPuntosOponentes = jugador.oponentes.reduce((acc, oponenteNombre) => {
        let oponente = jugadores.find(j => j.nombre === oponenteNombre);
        return acc + (oponente ? oponente.puntos : 0);
    }, 0);
    return totalPuntosOponentes / jugador.oponentes.length;
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
    let jugadoresOrdenados = [...jugadores].sort((a, b) => b.puntos - a.puntos || calcularWinrate(b) - calcularWinrate(a));
    let emparejados = new Set();
    
    for (let i = 0; i < jugadoresOrdenados.length; i++) {
        if (emparejados.has(jugadoresOrdenados[i].nombre)) continue;
        
        let rival = jugadoresOrdenados.find(j => 
            !emparejados.has(j.nombre) && 
            j.nombre !== jugadoresOrdenados[i].nombre && 
            !jugadoresOrdenados[i].oponentes.includes(j.nombre)
        );
        
        if (rival) {
            enfrentamientos.push([jugadoresOrdenados[i], rival, null]);
            emparejados.add(jugadoresOrdenados[i].nombre);
            emparejados.add(rival.nombre);
            jugadoresOrdenados[i].oponentes.push(rival.nombre);
            rival.oponentes.push(jugadoresOrdenados[i].nombre);
        }
    }
    
    if (jugadoresOrdenados.length % 2 === 1) {
        let jugadorLibre = jugadoresOrdenados.find(j => !emparejados.has(j.nombre));
        if (jugadorLibre) {
            jugadorLibre.puntos += 3;
            emparejados.add(jugadorLibre.nombre);
        }
    }
}

function mostrarEnfrentamientos() {
    const container = document.getElementById("enfrentamientos");
    container.innerHTML = `<h3>Ronda ${ronda}</h3>`;
    enfrentamientos.forEach((pair, index) => {
        container.innerHTML += `
            <div class='card p-3 my-2'>
                <h5>Partido ${index + 1}</h5>
                <button class='btn btn-outline-primary resultado-btn' data-index='${index}' data-result='0'>${pair[0].nombre}</button>
                vs
                <button class='btn btn-outline-primary resultado-btn' data-index='${index}' data-result='1'>${pair[1].nombre}</button>
                <button class='btn btn-outline-warning resultado-btn' data-index='${index}' data-result='empate'>Empate</button>
            </div>
        `;
    });
    container.innerHTML += `<button class='btn btn-secondary mt-3' onclick='pasarSiguienteRonda()'>Siguiente Ronda</button>`;
    container.innerHTML += `<button class='btn btn-danger mt-3' onclick='finalizarTorneo()'>Finalizar Torneo</button>`;
    
    setTimeout(agregarEventosBotones, 100);
}

function agregarEventosBotones() {
    document.querySelectorAll(".resultado-btn").forEach(button => {
        button.replaceWith(button.cloneNode(true)); // Elimina eventos anteriores
    });
    document.querySelectorAll(".resultado-btn").forEach(button => {
        button.addEventListener("click", function() {
            registrarResultado(this.dataset.index, this.dataset.result);
            actualizarEstadoBotones();
        });
    });
}

function registrarResultado(index, resultado) {
    if (rondaFinalizada) return;
    index = parseInt(index);
    let enfrentamiento = enfrentamientos[index];
    let anterior = enfrentamiento[2];
    
    if (anterior !== null) {
        if (anterior === "empate") {
            enfrentamiento[0].puntos -= 1;
            enfrentamiento[1].puntos -= 1;
            enfrentamiento[0].empatadas--;
            enfrentamiento[1].empatadas--;
        } else {
            enfrentamiento[anterior].puntos -= 3;
            enfrentamiento[anterior].ganadas--;
            enfrentamiento[1 - anterior].perdidas--;
        }
    }
    
    if (anterior === resultado) {
        enfrentamiento[2] = null;
    } else {
        enfrentamiento[2] = resultado;
        if (resultado === "empate") {
            enfrentamiento[0].puntos += 1;
            enfrentamiento[1].puntos += 1;
            enfrentamiento[0].empatadas++;
            enfrentamiento[1].empatadas++;
        } else {
            enfrentamiento[resultado].puntos += 3;
            enfrentamiento[resultado].ganadas++;
            enfrentamiento[1 - resultado].perdidas++;
        }
    }
    actualizarTabla();
}

function actualizarEstadoBotones() {
    document.querySelectorAll(".resultado-btn").forEach(button => {
        button.classList.remove("active");
    });
    enfrentamientos.forEach((enfrentamiento, index) => {
        if (enfrentamiento[2] !== null) {
            document.querySelector(`[data-index='${index}'][data-result='${enfrentamiento[2]}']`).classList.add("active");
        }
    });
}

function pasarSiguienteRonda() {
    if (enfrentamientos.some(e => e[2] === null)) {
        alert("Debe registrar todos los resultados antes de pasar a la siguiente ronda.");
        return;
    }
    rondaFinalizada = false;
    ronda++;
    generarEnfrentamientos();
    mostrarEnfrentamientos();
}

function finalizarTorneo() {
    jugadores.forEach(j => {
        let totalOponentes = j.oponentes.length;
        if (totalOponentes > 0) {
            let winrateOponentes = j.oponentes.reduce((acc, oponenteNombre) => {
                let oponente = jugadores.find(j => j.nombre === oponenteNombre);
                return acc + (oponente ? oponente.puntos : 0);
            }, 0) / totalOponentes;
            j.winrateOponentes = isNaN(winrateOponentes) ? 0 : winrateOponentes;
        } else {
            j.winrateOponentes = 0;
        }
    });
    
    jugadores.sort((a, b) => b.puntos - a.puntos || b.winrateOponentes - a.winrateOponentes);
    
    let resultadoFinal = `<h2>Resultados Finales</h2>
                          <table class='table table-bordered'>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Puntos</th>
                                    <th>Winrate Oponentes</th>
                                </tr>
                            </thead>
                            <tbody>`;
    
    jugadores.forEach(j => {
        resultadoFinal += `<tr>
                            <td>${j.nombre}</td>
                            <td>${j.puntos}</td>
                            <td>${j.winrateOponentes.toFixed(2)}</td>
                           </tr>`;
    });
    
    resultadoFinal += `</tbody></table>`;
    document.getElementById("resultadosFinales").innerHTML = resultadoFinal;
}