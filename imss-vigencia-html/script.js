$(document).ready(function () {

  function validarCorreo() {
    const correo = $('#correoInput').val().trim();
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo && !regexCorreo.test(correo)) {
      alert('El correo no es valido.');
    }
  }

  $('#correoInput').on('blur', validarCorreo);

  $('#refreshCaptcha').on('click', function () {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    $('#captchaImg').text(code);
  });

  function showModal() {
    $('#modalBackdrop').addClass('in').css('display', 'block');
    $('#myModalActualizacion').addClass('in').css('display', 'block');
  }

  function hideModal() {
    $('#modalBackdrop').removeClass('in').css('display', 'none');
    $('#myModalActualizacion').removeClass('in').css('display', 'none');
  }

  $('#continuar').on('click', showModal);
  $('#submitCancelar').on('click', hideModal);
  $('#submitContinuar').on('click', hideModal);

  // Escucha al widget de dictado por voz. El widget manda los datos usando
  // como clave el `name` real de cada campo (los leyó del propio <form>),
  // así que aquí no hace falta mapear campo por campo: solo se busca cada
  // control por su `name` y se le pone el valor.
  window.addEventListener('voice-assistant:fill', function (event) {
    const form = (event.detail && event.detail.form) || document.getElementById('registroAseguradoDatosBasicosForm');
    const data = (event.detail && event.detail.data) || {};
    if (!form) return;

    Object.keys(data).forEach(function (name) {
      const field = form.elements.namedItem(name);
      if (field && 'value' in field) field.value = data[name];
    });
  });

});
