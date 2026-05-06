const bM = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const bT = ["16:30", "17:00", "17:30", "18:00", "18:30", "19:00"];
const hC = [...bM, ...bT];

const disp = {
    "Martes 5": hC,
    "Miércoles 6": hC,
    "Viernes 8": hC,
    "Sábado 9": hC,
    "Lunes 11": hC,
    "Martes 12": hC,
    "Jueves 14": hC,
    "Viernes 15": hC,
    "Lunes 18": hC,
    "Miércoles 20": hC,
    "Jueves 21": hC,
    "Sábado 23": hC,
    "Martes 26": hC,
    "Miércoles 27": hC,
    "Viernes 29": hC,
    "Sábado 30": hC
};

const sD = document.getElementById('dia');
const sH = document.getElementById('hora');
const urlAPI = 'https://sheetdb.io/api/v1/23xwgm6jc6m0l';

function init() {
    sD.innerHTML = '';
    Object.keys(disp).forEach(d => {
        let o = document.createElement('option');
        o.value = d; o.text = d;
        sD.appendChild(o);
    });
    upd();
}

async function obtenerOcupados() {
    try {
        const res = await fetch(urlAPI);
        return await res.json();
    } catch (e) {
        console.error("Error al obtener ocupados:", e);
        return [];
    }
}

async function upd() {
    const dS = sD.value;
    const hs = disp[dS];
    
    sH.innerHTML = '<option>Cargando disponibilidad...</option>';
    sH.disabled = true;

    const ocupados = await obtenerOcupados();
    
    sH.innerHTML = '';
    const ahora = new Date();
    // Hoy es miércoles 6 de mayo según tu calendario
    const diaHoyString = "Miércoles 6"; 

    hs.forEach(h => {
        // Comparamos con el formato del Excel (ej: "10:30 hs")
        const formatoExcel = h + " hs";
        const estaOcupado = ocupados.find(t => t.fecha === dS && t.hora === formatoExcel);

        if (!estaOcupado) {
            if (dS === diaHoyString) {
                const [hora, min] = h.split(':');
                const horaTurno = new Date();
                horaTurno.setHours(parseInt(hora), parseInt(min), 0);

                if (horaTurno > ahora) {
                    agregarOpcion(h);
                }
            } else {
                agregarOpcion(h);
            }
        }
    });

    validarEstadoSelect();
}

function agregarOpcion(h) {
    let o = document.createElement('option');
    o.value = h; 
    o.text = h + " hs";
    sH.appendChild(o);
}

function validarEstadoSelect() {
    if (sH.innerHTML === '') {
        let o = document.createElement('option');
        o.text = "Sin turnos disponibles";
        sH.appendChild(o);
        sH.disabled = true;
    } else {
        sH.disabled = false;
    }
}

function enviarTurno() {
    if (sH.disabled || sH.value.includes("Sin turnos")) return;
    const msg = `Hola Elvio! Quiero reservar un turno para el día ${sD.value} a las ${sH.value} hs.`;
    window.open(`https://wa.me/543436434685?text=${encodeURIComponent(msg)}`, '_blank');
}

sD.addEventListener('change', upd);
window.onload = init;