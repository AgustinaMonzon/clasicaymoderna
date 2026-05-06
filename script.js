const bM = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const bT = ["16:30", "17:00", "17:30", "18:00", "18:30", "19:00"];
const hC = [...bM, ...bT];

// Mantené tu lista de disponibilidad
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

// Función para obtener el nombre del día hoy en el formato de tu lista
function obtenerNombreHoy() {
    const opciones = { weekday: 'long', day: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' };
    let hoy = new Intl.DateTimeFormat('es-AR', opciones).format(new Date());
    // Capitalizamos la primera letra y sacamos el "de" si aparece
    hoy = hoy.charAt(0).toUpperCase() + hoy.slice(1).replace(' de', '');
    return hoy; 
}

function init() {
    sD.innerHTML = '';
    const hoyReal = obtenerNombreHoy();
    
    // Solo agregamos al selector los días que son HOY o FECHAS FUTURAS
    // Esto hace que "Martes 5" desaparezca solo cuando ya es Miércoles 6
    let diasAMostrar = Object.keys(disp);
    let indiceHoy = diasAMostrar.indexOf(hoyReal);

    // Si el día de hoy está en la lista, cortamos los anteriores
    if (indiceHoy !== -1) {
        diasAMostrar = diasAMostrar.slice(indiceHoy);
    }

    diasAMostrar.forEach(d => {
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
        return [];
    }
}

async function upd() {
    const dS = sD.value;
    const hs = disp[dS] || [];
    const hoyReal = obtenerNombreHoy();
    
    sH.innerHTML = '<option>Cargando...</option>';
    sH.disabled = true;

    const ocupados = await obtenerOcupados();
    sH.innerHTML = '';

    const ahora = new Date();

    hs.forEach(h => {
        const formatoExcel = h + " hs";
        const estaOcupado = ocupados.find(t => t.fecha === dS && t.hora === formatoExcel);

        if (!estaOcupado) {
            if (dS === hoyReal) {
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
    o.value = h; o.text = h + " hs";
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