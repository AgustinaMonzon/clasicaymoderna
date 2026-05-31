// ==================== CONFIGURACIÓN ELVIO ====================
const urlAPI = 'https://script.google.com/macros/s/AKfycbyRz3tr30TemRgKoILNZWFREpdQkttdZEfveKwyQjKdtmPORZlFkOy-m63uILttPyPw/exec';

const hC = [ "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];

// AGREGAMOS EL DÍA DE HOY DOMINGO 31 PARA EL TESTEO DIRECTO
const disp = {
    "Domingo 31": hC, 
    "Lunes 1": hC, "Martes 2": hC, "Jueves 4": hC, "Viernes 5": hC,
    "Lunes 8": hC, "Miércoles 10": hC, "Jueves 11": hC, "Sábado 13": hC,
    "Martes 16": hC, "Miércoles 17": hC, "Viernes 19": hC, "Sábado 20": hC,
    "Lunes 22": hC, "Martes 23": hC, "Jueves 25": hC, "Viernes 26": hC,
    "Lunes 29": hC
};

const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const sD = document.getElementById('dia');
const sH = document.getElementById('hora');
let estrellasSel = 0;

const normalizar = (texto) => texto ? texto.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

function init() {
    console.log("=== INICIANDO DETECTIVE DE ERRORES ===");
    const ahora = new Date();
    const hoyNum = ahora.getDate();
    console.log("Día numérico de hoy según el sistema:", hoyNum);

    if (!sD) {
        console.error("ERROR CRÍTICO: No se encontró el elemento select con id='dia' en el HTML.");
        return;
    }
    
    sD.innerHTML = '';
    let diasAgregados = 0;

    Object.keys(disp).forEach(d => {
        const numeroDia = parseInt(d.match(/\d+/));
        let esMesSiguiente = (hoyNum > 25 && numeroDia < 10);

        if (numeroDia >= hoyNum || esMesSiguiente) {
            let o = document.createElement('option');
            o.value = d; o.text = d;
            sD.appendChild(o);
            diasAgregados++;
        }
    });

    console.log(`Cantidad de días cargados en el selector: ${diasAgregados}`);

    if (sD.options.length > 0) {
        console.log("Día inicialmente seleccionado en el combo:", sD.value);
        upd(); 
    } else {
        console.warn("ADVERTENCIA: No se agregó ningún día al selector, quedó vacío.");
    }
    
    cargarReseñas();

    const stars = document.querySelectorAll('.star');
    stars.forEach(s => {
        s.onclick = (e) => {
            estrellasSel = parseInt(e.target.getAttribute('data-value'));
            stars.forEach(x => {
                const val = parseInt(x.getAttribute('data-value'));
                x.classList.toggle('active', val <= estrellasSel);
            });
        };
    });
} 

async function upd() {
    if (!sD || !sD.value) {
        console.warn("upd() cancelado: sD no existe o no tiene un valor seleccionado.");
        return;
    }
    if (!sH) {
        console.error("ERROR CRÍTICO: No se encontró el elemento select con id='hora' en el HTML.");
        return;
    }

    const dS = sD.value;
    const ahora = new Date();
    const hoyLabel = `${nombresDias[ahora.getDay()]} ${ahora.getDate()}`;
    
    console.log(`--- Ejecutando upd() para el día seleccionado: "${dS}" ---`);
    console.log(`Hoy según sistema es: "${hoyLabel}" (Hora actual: ${ahora.getHours()}:${ahora.getMinutes()})`);
    
    sH.innerHTML = '<option>Cargando...</option>';

    try {
        const urlCompleta = `${urlAPI}?sheet=Agenda`;
        console.log("Consultando a la API de Google Sheets en:", urlCompleta);
        
        const res = await fetch(urlCompleta);
        const data = await res.json();
        
        console.log("Datos crudos recibidos desde la API de Google:", data);
        
        const ocupados = Array.isArray(data) ? data : (data && data.data ? data.data : []);
        console.log("Estructura de turnos ocupados procesada (Array):", ocupados);

        sH.innerHTML = '';
        let horasCargadas = 0;

        (disp[dS] || []).forEach(h => {
            const [hT, mT] = h.split(':').map(Number);
            let yaPaso = (normalizar(dS) === normalizar(hoyLabel)) && (hT < ahora.getHours() || (hT === ahora.getHours() && mT <= ahora.getMinutes() + 5));

            const ocupado = ocupados.some(t => {
                if (!t) return false;
                const fE = normalizar(t.fecha || t.Fecha || '');
                const fW = normalizar(dS);
                const hE = t.hora ? t.hora.toString().match(/(\d{1,2}):(\d{2})/)?.[0].padStart(5, '0') : "";
                
                let coincide = (fE === fW && hE === h.padStart(5, '0'));
                if (coincide) {
                    console.log(`-> Turno ocupado detectado: Fecha "${t.fecha || t.Fecha}", Hora "${t.hora}"`);
                }
                return coincide;
            });

            if (!yaPaso && !ocupado) {
                let o = document.createElement('option');
                o.value = h; o.text = h + " hs";
                sH.appendChild(o);
                horasCargadas++;
            }
        });
        
        console.log(`Cantidad de horarios libres agregados para "${dS}": ${horasCargadas}`);
        sH.disabled = false;
        
        const btnWa = document.getElementById('btnWhatsapp');
        if (btnWa) {
            btnWa.disabled = sH.options.length === 0;
        }
        
    } catch (e) { 
        console.error("¡ERROR EN LA FUNCIÓN UPD()!: ", e);
        sH.innerHTML = '<option>Error al cargar</option>'; 
    }
}

function enviarTurno() {
    if(!sD || !sH) return;
    const msg = `Hola Elvio! Quiero reservar un turno para el ${sD.value} a las ${sH.value} hs.`;
    window.open(`https://wa.me/543436434685?text=${encodeURIComponent(msg)}`, '_blank');
}

async function enviarReseña() {
    const n = document.getElementById('rev-nombre').value;
    const c = document.getElementById('rev-comentario').value;
    if (!n || !c || estrellasSel === 0) return alert("Por favor completá todo.");
    
    try {
        await fetch(`${urlAPI}?sheet=Reseñas`, {
            method: 'POST', mode: 'no-cors',
            body: JSON.stringify({ nombre: n, estrellas: estrellasSel, comentario: c, fecha: new Date().toLocaleDateString('es-AR') })
        });
        alert("¡Gracias por tu opinión! 💈");
        location.reload();
    } catch (e) { alert("Error al enviar."); }
}

async function cargarReseñas() {
    const cont = document.getElementById('contenedor-resenas');
    if (!cont) return;
    try {
        const res = await fetch(`${urlAPI}?sheet=Reseñas`);
        const datos = await res.json();
        console.log("Datos de Reseñas recibidos:", datos);
        const lista = Array.isArray(datos) ? datos : (datos.data || []);
        cont.innerHTML = ''; 

        if (lista.length === 0) {
            cont.innerHTML = '<p class="sin-resenas">¡Sé el primero en opinar! 💈</p>';
            return;
        }

        lista.reverse().slice(0, 10).forEach(r => {
            const div = document.createElement('div');
            div.className = 'resena-card';
            const e = parseInt(r.estrellas || r.Estrellas) || 5;
            div.innerHTML = `<strong>${r.nombre || r.Nombre || 'Anónimo'}</strong><div style="color:#C5A059">${'★'.repeat(e)}${'☆'.repeat(5-e)}</div><p>${r.comentario || r.Comentario || ''}</p>`;
            cont.appendChild(div);
        });
    } catch (e) { 
        console.error("Error cargando reseñas:", e);
        cont.innerHTML = "No hay reseñas aún."; 
    }
}

function toggleReviewForm() {
    const f = document.getElementById('form-opinion');
    if (f) f.style.display = (f.style.display === 'none') ? 'block' : 'none';
}

if (sD) sD.onchange = upd;
window.onload = init;