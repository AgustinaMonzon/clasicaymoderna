// ==================== CONFIGURACIÓN ELVIO ====================
const urlAPI = 'https://script.google.com/macros/s/AKfycbyRz3tr30TemRgKoILNZWFREpdQkttdZEfveKwyQjKdtmPORZlFkOy-m63uILttPyPw/exec';

const hC = [ "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];

const disp = {
    "Martes 12": hC, "Miércoles 13": hC, "Jueves 14": hC, "Viernes 15": hC, "Sábado 16": hC,
    "Martes 19": hC, "Miércoles 20": hC, "Jueves 21": hC, "Viernes 22": hC, "Sábado 23": hC,
    "Martes 26": hC, "Miércoles 27": hC, "Jueves 28": hC, "Viernes 29": hC, "Sábado 30": hC
};

const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const sD = document.getElementById('dia');
const sH = document.getElementById('hora');
let estrellasSel = 0;

const normalizar = (texto) => texto ? texto.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

function init() {
    const hoy = new Date().getDate();
    if (!sD) return;
    sD.innerHTML = '';
    Object.keys(disp).forEach(d => {
        const numeroDia = parseInt(d.match(/\d+/));
        if (numeroDia >= hoy) {
            let o = document.createElement('option');
            o.value = d; o.text = d;
            sD.appendChild(o);
        }
    });
    if (sD.options.length > 0) upd(); 
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
    if (!sD.value) return;
    const dS = sD.value;
    const ahora = new Date();
    const hoyLabel = `${nombresDias[ahora.getDay()]} ${ahora.getDate()}`;
    sH.innerHTML = '<option>Cargando...</option>';

    try {
        const res = await fetch(`${urlAPI}?sheet=Agenda`);
        const data = await res.json();
        const ocupados = Array.isArray(data) ? data : (data.data || []);

        sH.innerHTML = '';
        (disp[dS] || []).forEach(h => {
            const [hT, mT] = h.split(':').map(Number);
            let yaPaso = (normalizar(dS) === normalizar(hoyLabel)) && (hT < ahora.getHours() || (hT === ahora.getHours() && mT <= ahora.getMinutes() + 5));

            const ocupado = ocupados.some(t => {
                const fE = normalizar(t.fecha || t.Fecha);
                const fW = normalizar(dS);
                const hE = t.hora ? t.hora.toString().match(/(\d{1,2}):(\d{2})/)?.[0].padStart(5, '0') : "";
                return fE === fW && hE === h.padStart(5, '0');
            });

            if (!yaPaso && !ocupado) {
                let o = document.createElement('option');
                o.value = h; o.text = h + " hs";
                sH.appendChild(o);
            }
        });
        
        sH.disabled = false; // HABILITA EL MENÚ QUE ESTABA BLOQUEADO EN EL HTML
        document.getElementById('btnWhatsapp').disabled = sH.options.length === 0;
        
    } catch (e) { 
        sH.innerHTML = '<option>Error al cargar</option>'; 
    }
}

function enviarTurno() {
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
    } catch (e) { cont.innerHTML = "No hay reseñas aún."; }
}

function toggleReviewForm() {
    const f = document.getElementById('form-opinion');
    f.style.display = (f.style.display === 'none') ? 'block' : 'none';
}

sD.onchange = upd;
window.onload = init;