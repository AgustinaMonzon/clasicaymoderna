// ==================== script.js ====================
// Configuración y lógica principal del sistema de turnos

// ⚙️ API: SheetDB conecta Google Sheets como backend ligero
const urlAPI = 'https://sheetdb.io/api/v1/23xwgm6jc6m0l';

// 🕐 Horarios base de atención (formato 24h)
const hC = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00" , "12:30","16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];

// 📅 Disponibilidad por día: estructura { "Día N": [horarios] }
// Nota: actualizar manualmente según agenda real o migrar a fuente dinámica
const disp = {
    "Martes 5": hC, "Miércoles 6": hC, "Viernes 8": hC, "Sábado 9": hC,
    "Lunes 11": hC, "Martes 12": hC, "Jueves 14": hC, "Viernes 15": hC,
    "Lunes 18": hC, "Miércoles 20": hC, "Jueves 21": hC, "Sábado 23": hC,
    "Martes 26": hC, "Miércoles 27": hC, "Viernes 29": hC, "Sábado 30": hC
};

// 🎯 Referencias al DOM
const sD = document.getElementById('dia');  // Select de días
const sH = document.getElementById('hora'); // Select de horarios

/**
 * Inicialización: filtra días futuros y carga reseñas
 * - Compara número de día con fecha actual para ocultar fechas pasadas
 * - Trigger inicial para poblar horarios según día seleccionado
 */
function init() {
    const ahora = new Date();
    const hoyNumero = ahora.getDate();
    
    sD.innerHTML = '';
    Object.keys(disp).forEach(d => {
        const numeroDia = parseInt(d.match(/\d+/));
        if (numeroDia >= hoyNumero) {
            let o = document.createElement('option');
            o.value = d; o.text = d;
            sD.appendChild(o);
        }
    });
    if (sD.options.length > 0) upd(); 
    cargarReseñas();
} 

/**
 * Actualiza horarios disponibles según día seleccionado
 * - Consulta API para excluir turnos ya ocupados
 * - Filtra horarios pasados si el día es hoy
 * - Gestiona estados de carga/error en el select
 */
async function upd() {
    if (!sD.value) return;
    
    const dS = sD.value;
    const ahora = new Date();
    const hoyNumero = ahora.getDate();
    const horaActual = ahora.getHours();
    const minutosActuales = ahora.getMinutes();
    const numeroDiaSeleccionado = parseInt(dS.match(/\d+/));

    const hs = disp[dS] || [];
    sH.innerHTML = '<option>Cargando...</option>';
    sH.disabled = true;

    try {
        const res = await fetch(urlAPI);
        const ocupados = await res.json();
        sH.innerHTML = '';

        hs.forEach(h => {
            const [horaTurno, minutosTurno] = h.split(':').map(Number);
            
            // Evita mostrar horarios ya transcurridos (solo para hoy)
            let estaPasado = false;
            if (numeroDiaSeleccionado === hoyNumero) {
                if (horaTurno < horaActual || (horaTurno === horaActual && minutosTurno <= minutosActuales)) {
                    estaPasado = true;
                }
            }

            // Filtra: solo muestra si está libre Y no pasó la hora
            if (!estaPasado && !ocupados.find(t => t.fecha === dS && t.hora === (h + " hs"))) {
                let o = document.createElement('option');
                o.value = h; o.text = h + " hs";
                sH.appendChild(o);
            }
        });

        // Gestiona estado del botón y mensaje de "sin horarios"
        const hayTurnos = sH.options.length > 0;
        document.getElementById('btnWhatsapp').disabled = !hayTurnos;
        sH.disabled = !hayTurnos;
        if (!hayTurnos) sH.innerHTML = '<option>Sin horarios disponibles</option>';
        
    } catch (e) { 
        console.error(e); 
        sH.innerHTML = '<option>Error al cargar</option>';
    }
}

/**
 * Genera y abre enlace de WhatsApp con mensaje predefinido
 * - Número hardcodeado: validar si requiere configuración dinámica
 * - Formato de mensaje consistente para facilitar procesamiento manual
 */
function enviarTurno() {
    const msg = `Hola Elvio! Quiero reservar un turno para el día ${sD.value} a las ${sH.value} hs.`;
    window.open(`https://wa.me/543436434685?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==================== MÓDULO DE RESEÑAS ====================

let estrellas = 0; // Estado global para rating seleccionado

// Listener para selección de estrellas: actualiza UI y estado
document.querySelectorAll('.star').forEach(s => {
    s.onclick = (e) => {
        estrellas = e.target.dataset.value;
        document.querySelectorAll('.star').forEach(x => x.classList.remove('active'));
        e.target.classList.add('active');
    };
});

/**
 * Toggle para mostrar/ocultar formulario de reseñas
 * - Alternancia de texto en botón para feedback visual
 */
function toggleReviewForm() {
    const f = document.getElementById('form-opinion');
    const isVisible = f.style.display === 'block';
    f.style.display = isVisible ? 'none' : 'block';
    document.getElementById('toggle-review-form').innerText = isVisible ? '+ Dejanos tu opinión' : '- Cerrar formulario';
}

/**
 * Envía reseña a Google Sheets vía SheetDB
 * - Validación de campos obligatorios
 * - Feedback visual durante envío (loading state)
 * - Recarga post-éxito para mostrar nueva reseña
 */
async function enviarReseña() {
    const n = document.getElementById('rev-nombre').value;
    const c = document.getElementById('rev-comentario').value;
    if (!n || !c || estrellas === 0) return alert("Por favor, completá nombre, estrellas y comentario.");

    const btn = document.getElementById('btnEnviarReseña');
    btn.disabled = true;
    btn.innerText = "Publicando...";

    try {
        await fetch(urlAPI + '?sheet=Reseñas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                nombre: n, 
                estrellas: estrellas, 
                comentario: c, 
                fecha: new Date().toLocaleDateString() 
            })
        });
        alert("¡Gracias por tu opinión!");
        location.reload();
    } catch (e) {
        alert("Error al enviar.");
        btn.disabled = false;
        btn.innerText = "Publicar Comentario";
    }
}

/**
 * Carga y renderiza reseñas desde Google Sheets
 * - Orden inverso para mostrar más recientes primero
 * - Manejo de estados: vacío, carga, error
 */
async function cargarReseñas() {
    const cont = document.getElementById('contenedor-resenas');
    try {
        const res = await fetch(urlAPI + '?sheet=Reseñas');
        const datos = await res.json();
        cont.innerHTML = datos.length ? '' : 'Aún no hay reseñas.';
        datos.reverse().forEach(r => {
            const div = document.createElement('div');
            div.className = 'resena-card';
            div.innerHTML = `<strong>${r.nombre}</strong> <span style="color:#f1c40f">${"★".repeat(r.estrellas)}</span><p>${r.comentario}</p>`;
            cont.appendChild(div);
        });
    } catch (e) { cont.innerHTML = 'Error al cargar reseñas.'; }
}

// 🔄 Event listeners globales
sD.onchange = upd;      // Actualiza horarios al cambiar día
window.onload = init;   // Inicializa app al cargar DOM