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

function init() {
  sD.innerHTML = '';
  Object.keys(disp).forEach(d => {
    let o = document.createElement('option');
    o.value = d; o.text = d;
    sD.appendChild(o);
  });
  upd();
}

function upd() {
  const dS = sD.value;
  const hs = disp[dS];
  sH.innerHTML = '';

  // Obtenemos la fecha y hora actual de Victoria
  const ahora = new Date();
  const diaHoyString = "Martes 5"; // <-- ESTO DEBERÍAS CAMBIARLO SEGÚN EL DÍA ACTUAL SI QUERÉS QUE SEA 100% AUTOMÁTICO, PERO VAMOS PASO A PASO.

  hs.forEach(h => {
    // Si el día seleccionado es hoy, comparamos las horas
    if (dS === diaHoyString) {
        const [hora, min] = h.split(':');
        const horaTurno = new Date();
        horaTurno.setHours(parseInt(hora), parseInt(min), 0);

        // Si la hora del turno es mayor a la hora actual, lo mostramos
        if (horaTurno > ahora) {
            let o = document.createElement('option');
            o.value = h; o.text = h + " hs";
            sH.appendChild(o);
        }
    } else {
        // Si es otro día, mostramos todas las horas
        let o = document.createElement('option');
        o.value = h; o.text = h + " hs";
        sH.appendChild(o);
    }
  });

  // Si no quedan horarios disponibles para hoy
  if (sH.innerHTML === '') {
    let o = document.createElement('option');
    o.text = "Sin turnos por hoy";
    sH.appendChild(o);
    sH.disabled = true;
  } else {
    sH.disabled = false;
  }
}

function enviarTurno() {
  if (sH.disabled) return;
  const msg = `Hola Elvio! Quiero reservar un turno para el día ${sD.value} a las ${sH.value} hs.`;
  window.open(`https://wa.me/543436434685?text=${encodeURIComponent(msg)}`, '_blank');
}

sD.addEventListener('change', upd);
window.onload = init;