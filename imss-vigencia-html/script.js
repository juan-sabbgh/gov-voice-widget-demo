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

  // Escucha al widget de dictado por voz y acomoda los datos en los
  // campos propios de este formulario (el widget nunca los toca directo).
  window.addEventListener('voice-assistant:fill', function (event) {
    const data = (event.detail && event.detail.data) || {};

    if (data.curp) $('#registroCurp').val(data.curp);
    if (data.nss) $('#nss').val(data.nss);
    if (data.correo) $('#correoInput').val(data.correo);
    if (data.correoConfirmacion) $('#correoConfirmacionInput').val(data.correoConfirmacion);
  });

});
