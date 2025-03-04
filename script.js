let jugadores = [];
let enfrentamientos = [];
let ronda = 1;
let rondaFinalizada = false;

function agregarJugador() {
    const input = document.getElementById("nombreJugador");
    const nombre = input.value.trim();
    if (nombre) {
        jugadores.push({ nombre, ganadas: 0, perdidas: 0, empatadas: 0, oponentes: [] });
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
                        <td>${jugador.ganadas}</td>
                        <td>${jugador.perdidas}</td>
                        <td>${jugador.empatadas}</td>
                     </tr>`;
        tbody.innerHTML += row;
    });
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
    let grupos = {};
    
    jugadores.forEach(j => {
        let clave = `${j.ganadas}-${j.perdidas}-${j.empatadas}`;
        if (!grupos[clave]) grupos[clave] = [];
        grupos[clave].push(j);
    });
    
    let pendientes = [];
    Object.values(grupos).forEach(lista => {
        while (lista.length >= 2) {
            enfrentamientos.push([lista.pop(), lista.pop(), null]);
        }
        if (lista.length === 1) pendientes.push(lista.pop());
    });
    
    while (pendientes.length >= 2) {
        enfrentamientos.push([pendientes.pop(), pendientes.pop(), null]);
    }
}

function mostrarEnfrentamientos() {
    const container = document.getElementById("enfrentamientos");
    container.innerHTML = `<h3>Ronda ${ronda}</h3>`;
    enfrentamientos.forEach((pair, index) => {
        container.innerHTML += `
            <div class='card p-3 my-2'>
                <h5>Partido ${index + 1}</h5>
                <button class='btn btn-outline-primary' id='btn-${index}-0' onclick='registrarResultado(${index}, 0)'>${pair[0].nombre}</button>
                vs
                <button class='btn btn-outline-primary' id='btn-${index}-1' onclick='registrarResultado(${index}, 1)'>${pair[1].nombre}</button>
                <button class='btn btn-outline-warning' id='btn-${index}-empate' onclick='registrarResultado(${index}, "empate")'>Empate</button>
            </div>
        `;
    });
    container.innerHTML += `<button class='btn btn-secondary mt-3' onclick='pasarSiguienteRonda()'>Siguiente Ronda</button></div>`;
    container.innerHTML += `<button class='btn btn-danger mt-3' onclick='finalizarTorneo()'>Finalizar Torneo</button></div>`;
}

function registrarResultado(index, resultado) {
    if (rondaFinalizada) return;
    
    enfrentamientos[index][2] = resultado;
    
    document.getElementById(`btn-${index}-0`).classList.remove("active");
    document.getElementById(`btn-${index}-1`).classList.remove("active");
    document.getElementById(`btn-${index}-empate`).classList.remove("active");
    
    if (resultado === "empate") {
        enfrentamientos[index][0].empatadas++;
        enfrentamientos[index][1].empatadas++;
        document.getElementById(`btn-${index}-empate`).classList.add("active");
    } else {
        const ganador = enfrentamientos[index][resultado];
        const perdedor = enfrentamientos[index][1 - resultado];
        ganador.ganadas++;
        perdedor.perdidas++;
        ganador.oponentes.push(perdedor);
        perdedor.oponentes.push(ganador);
        document.getElementById(`btn-${index}-${resultado}`).classList.add("active");
    }
    actualizarTabla();
}

function pasarSiguienteRonda() {
    if (enfrentamientos.some(e => e[2] === null)) {
        alert("Debe registrar todos los resultados antes de pasar a la siguiente ronda.");
        return;
    }
    rondaFinalizada = true;
    ronda++;
    generarEnfrentamientos();
    mostrarEnfrentamientos();
}

function finalizarTorneo() {
    jugadores.forEach(j => {
        j.oponentesWinRate = j.oponentes.length ? j.oponentes.reduce((acc, o) => acc + (o.ganadas / Math.max(1, (o.ganadas + o.perdidas + o.empatadas))), 0) / j.oponentes.length : 0;
    });
    
    jugadores.sort((a, b) => {
        if (b.ganadas !== a.ganadas) return b.ganadas - a.ganadas;
        return b.oponentesWinRate - a.oponentesWinRate;
    });
    
    let resultadoFinal = `<h2>Resultados Finales</h2>
                          <table class='table table-bordered'>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Ganadas</th>
                                    <th>Perdidas</th>
                                    <th>Empatadas</th>
                                    <th>WR Oponentes</th>
                                </tr>
                            </thead>
                            <tbody>`;
    
    jugadores.forEach(j => {
        resultadoFinal += `<tr>
                            <td>${j.nombre}</td>
                            <td>${j.ganadas}</td>
                            <td>${j.perdidas}</td>
                            <td>${j.empatadas}</td>
                            <td>${(j.oponentesWinRate * 100).toFixed(2)}%</td>
                           </tr>`;
    });
    
    resultadoFinal += `</tbody></table>`;
    document.getElementById("resultadosFinales").innerHTML = resultadoFinal;
}