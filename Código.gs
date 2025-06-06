//Muestra el HTML
function doGet(){
    return HtmlService.createHtmlOutputFromFile('formulario')
    .setTitle("Reservar Cita");
}

//HTML (guarda como 'formulario.html' ne Apps Script)
function procesarReserva(datos){
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reservas");

    //Validacion: si hay reserva de fecha y hora
    const reservas = sheet.getDataRange().getValues();
    for (let i = 1; i < reservas.length; i++) {
        if (reservas[i][1] === datos.fecha && reservas [i][2] === datos.hora) {
            return "Lo sentimos, ese horario ya está reservado.";
        }
    }

    //registrar en hoja
    sheet.appendRow([
        datos.nombre,
        datos.fecha,
        datos.hora,
        datos.servicio,
        "Pendiente"
    ])

    //Crear en Google Calendar
    crearEventoCalendar(datos);

    return "Resrva Confirmada"
}

//Crear eventos en google Calendar
function crearEventoCalendar (datos){
    const calendario = CalendarApp.getDefaultCalendar();
    const fechaHora = new Date(`${datos.fecha}T${datos.hora}`);
    const duracion = 60; //duracion en minutos
    
    calendario.createEvent(
        `Cita con ${datos.nombre}`,
        fechaHora,
        new Date(fechaHora.getTime() + duracion * 60000),
        { description: `Servicio: ${datos.servicio}` }
    );

}
//traer barberos
function getBarberos() {
    const hoja = SpreadsheetApp.getActive().getSheetByName("Barberos");
    const data = hoja.getRange(2, 1, hoja.getLastRow() -1, 1).getValues();
    return data.flat(); // Ejemplo: ["Pedro", "Juan", etc...]
}

//Servicios
function getServicios() {
    const hoja = SpreadsheetApp.getActive().getSheetByName("Servicios");
    const data = hoja.getRange(2, 1, hoja.getLastRow() -1, 2).getValues();
    return data.map(row => ({nombre: row[0], precio: row[1] }));
}

function getDisponibilidad(barbero, fecha) {
    const hojaBarberos = SpreadsheetApp.getActive().getSheetByName("Barberos");
    const hojaHorarios = SpreadsheetApp.getActive().getSheetByName("Horarios");
    const hojaReservas = SpreadsheetApp.getActive().getSheetByName("Reservas");

    //Obtener datos del Barbero
    const barberos = hojaBarberos.getDataRange().getValues();
    const fila = barberos.find(row => row[0] === barbero);
    if (!fila) return [];

    const jornadas = ["Mañana", "Tarde", "Noche"];
    let jornadasDisponibles = [];

    // Detectar qué Jornadas estan disponibles
    for (let i = 0; i < jornadas.length; i++) {
        if (fila[i + 1]?.toLowerCase() === "disponible") {
            jornadasDisponibles.push(jornadas[i]);
        }
    }

    //Obtener todos los horarios disponibles según las jornadas
    const datosHorarios = hojaHorarios.getDataRange().getValues();
    let posiblesHoras = datosHorarios
        .filter(row => jornadasDisponibles.includes(row[0]))
        .map(row => row[1].toString().padStart(5, '0')); // formato Hora: HH:MM

    //Obtener reservas existentes
    const reservas = hojaReservas.getDataRange().getValues();
    const horasOcupadas = reservas
        .filter(r => r[1] === fecha && r[4] === barbero)
        .map(r => r[2].toString().padStart(5, '0'));
    
    //Retornar solo horarios libres
    return posiblesHoras.filter(hora => !horasOcupadas.includes(hora));
}

function procesarReservaExtendida(datos) {
    const hoja = SpreadsheetApp.getActive().getSheetByName("Reservas");
    const fecha = datos.fecha;
    const hora = datos.hora.padStart(5, '0'); // formato de hora HH:MM
    const barbero = datos.barbero;

    //Revalidados disponibilidad desde la hoja
    const reservas = hoja.getDataRange().getValues();
    const conflicto = reservas.some(r =>
        r[1] === fecha && r[2].padStart(5, '0') === hora && r[4] === barbero
    );

    if  (conflicto) {
        return `Este horario ya fue reservado por otro Cliente.`;
    }

    hoja.appendRow([
        datos.nombre,
        fecha,
        hora,
        datos.servicio,
        barbero,
        parseFloat(datos.precio),
        "Pendiente"
    ]);

    //Evento en Google Calendar
    const calendar = CalendarApp.getDefaultCalendar();
    const inicio = new Date(`${fecha}T${hora}`);
    const fin = new Date(inicio.getTime() + 30 * 60000);
    calendar.createEvent(
        `Corte: ${datos.servicio} - ${datos.nombre}`,
        inicio,
        fin,
        {
            description: `Barbero: ${barbero}`,
            location: "Barberia (Direccion)"
        }
    );

    return "¡Cita resgistrada correctamente, te esperamos!";
    
}

