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