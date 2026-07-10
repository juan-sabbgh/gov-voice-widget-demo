/**
 * <voice-assistant-btn> — widget agnóstico de dictado por voz.
 *
 * Uso: pegar en el <head> de cualquier página de gobierno:
 *   <script src=".../voice-assistant-widget.js" defer></script>
 *
 * Al cargar, el script:
 *   1. Busca todos los <form> de la página y les inyecta un botón flotante
 *      de dictado (no toca el DOM del formulario, solo agrega un overlay).
 *   2. Al hacer clic, graba audio con MediaRecorder.
 *   3. Al detener la grabación, LEE el esquema real del formulario
 *      (name/label/placeholder/opciones de cada campo — ver
 *      extractFormSchema) y lo envía junto con el audio al backend
 *      (placeholder por ahora, ver callBackendPlaceholder más abajo), para
 *      que el backend sepa exactamente qué campos existen y qué claves
 *      debe regresar.
 *   4. Cuando "responde" el backend, emite un CustomEvent global
 *      ("voice-assistant:fill") con los datos ya extraídos, usando como
 *      claves los mismos `name` de los campos del formulario. La página
 *      anfitriona decide cómo acomodarlos en sus propios campos — el
 *      widget nunca escribe directamente en los inputs del host.
 */
(function () {
  'use strict';

  if (customElements.get('voice-assistant-btn')) return;

  const EVENT_NAME = 'voice-assistant:fill';
  const MAX_RECORDING_MS = 15000;

  /**
   * Lee el <form> real y arma un esquema JSON con cada campo: name, label,
   * placeholder, tipo y opciones (para selects). Este esquema es lo que le
   * dice al backend qué campos existen y con qué `name` exacto debe
   * regresar cada valor — sin esto, el backend no tendría forma de saber
   * qué preguntar/extraer para un formulario que nunca ha visto.
   */
  function extractFormSchema(form) {
    const IGNORED_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
    const fields = form.querySelectorAll('input, select, textarea');
    const schema = [];

    fields.forEach((field) => {
      const type = (field.type || field.tagName).toLowerCase();
      if (IGNORED_TYPES.has(type)) return;
      if (!field.name) return;

      const entry = {
        name: field.name,
        id: field.id || null,
        type,
        label: getLabelText(field, form),
        placeholder: field.placeholder || null,
      };
      if (field.maxLength && field.maxLength > 0) entry.maxLength = field.maxLength;
      if (field.tagName === 'SELECT') {
        entry.options = Array.from(field.options)
          .filter((o) => o.value)
          .map((o) => ({ value: o.value, label: o.textContent.trim() }));
      }
      schema.push(entry);
    });

    return schema;
  }

  function getLabelText(field, form) {
    if (field.id) {
      const lbl = form.querySelector(`label[for="${cssEscape(field.id)}"]`);
      if (lbl) return lbl.textContent.trim();
    }
    const closest = field.closest('label');
    if (closest) return closest.textContent.trim();
    return null;
  }

  function cssEscape(value) {
    return window.CSS && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&');
  }

  function normalize(str) {
    return (str || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function pickOptionValue(entry, fallbackValue, labelKeywords) {
    if (entry.type && entry.type.indexOf('select') === 0 && entry.options && entry.options.length) {
      if (labelKeywords) {
        const norm = labelKeywords.map(normalize);
        const found = entry.options.find((o) => norm.some((k) => normalize(o.label).includes(k)));
        if (found) return found.value;
      }
      const byValue = entry.options.find((o) => o.value === fallbackValue);
      if (byValue) return byValue.value;
      return entry.options[0].value;
    }
    return fallbackValue;
  }

  // Reglas de ejemplo para el mock: en el backend real esto lo resuelve el
  // LLM a partir de lo que la persona dijo, no un patrón sobre el nombre
  // del campo. Aquí solo demuestra que el esquema del formulario sí llega
  // y sí se usa para decidir qué llenar.
  const MOCK_PATTERNS = [
    { test: /captcha/, value: () => undefined },
    { test: /curp/, value: () => 'GOMJ800101HDFRRN09' },
    { test: /nss|seguridad social/, value: () => '12345678901' },
    { test: /confirma.*correo|confirma.*email/, value: (e, ctx) => ctx.email },
    { test: /correo|email/, value: (e, ctx) => ctx.email },
    { test: /segundo apellido|apellido materno|materno/, value: () => 'Martínez' },
    { test: /primer apellido|apellido paterno|paterno|^apellido|apellido$/, value: () => 'González' },
    { test: /nombre/, value: () => 'Juan' },
    { test: /dia.*nacimiento|^dia$/, value: (e) => pickOptionValue(e, '05') },
    { test: /mes.*nacimiento|^mes$/, value: (e) => pickOptionValue(e, '05') },
    { test: /ano.*nacimiento|anio|year/, value: () => '1998' },
    { test: /sexo|genero/, value: (e) => pickOptionValue(e, 'H', ['hombre']) },
    { test: /estado|entidad/, value: (e) => pickOptionValue(e, 'DF', ['ciudad de mexico', 'cdmx']) },
  ];

  function generateMockData(schema) {
    const ctx = { email: 'usuario@ejemplo.com' };
    const data = {};

    schema.forEach((entry) => {
      const haystack = normalize([entry.name, entry.label, entry.placeholder].filter(Boolean).join(' '));
      const rule = MOCK_PATTERNS.find((p) => p.test.test(haystack));
      if (!rule) return;
      const value = rule.value(entry, ctx);
      if (value !== undefined) data[entry.name] = value;
    });

    return data;
  }

  /**
   * TODO: reemplazar este placeholder por la llamada real al backend
   * (FastAPI + Whisper + LLM con Structured Outputs).
   *
   * Contrato esperado:
   *   POST {backendUrl}/voice/transcribe
   *   body: multipart/form-data con el audio (Blob) + el `schema` (JSON)
   *   response: JSON con las entidades ya extraídas y validadas, con las
   *     mismas claves `name` que trae el schema, ej.
   *     { "curp": "...", "nombres": "...", "diaNacimiento": "05" }
   *
   * Ejemplo real (comentado):
   *
   *   async function callBackend(audioBlob, schema) {
   *     const formData = new FormData();
   *     formData.append('audio', audioBlob, 'grabacion.webm');
   *     formData.append('schema', JSON.stringify(schema));
   *     const res = await fetch('https://tu-backend.example.com/voice/transcribe', {
   *       method: 'POST',
   *       body: formData,
   *     });
   *     if (!res.ok) throw new Error('Error del backend: ' + res.status);
   *     return res.json();
   *   }
   */
  async function callBackendPlaceholder(audioBlob, schema) {
    // Simula latencia de red + procesamiento STT/NLP.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // El mock usa el esquema real del formulario (leído del DOM por
    // extractFormSchema) para decidir qué claves regresar — en producción
    // esa misma decisión la toma el LLM del backend a partir del audio.
    return generateMockData(schema);
  }

  const ICON_MIC = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" fill="currentColor"/>
    <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 18v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

  const ICON_STOP = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
  </svg>`;

  const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
    <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const ICON_ALERT = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
    <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
  </svg>`;

  const STYLE = `
    :host {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 2147483000;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    .wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .label {
      background: #222;
      color: #fff;
      font-size: 13px;
      padding: 6px 10px;
      border-radius: 6px;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity .15s ease, transform .15s ease;
      pointer-events: none;
      white-space: nowrap;
    }
    .label.visible {
      opacity: 1;
      transform: translateY(0);
    }
    button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: #611232;
      box-shadow: 0 2px 10px rgba(0,0,0,.3);
      transition: background .15s ease, transform .1s ease;
    }
    button:hover { transform: scale(1.05); }
    button:active { transform: scale(0.96); }
    button:focus-visible { outline: 3px solid #4A90E2; outline-offset: 2px; }

    button[data-state="recording"] {
      background: #d0021b;
      animation: pulse 1.4s infinite;
    }
    button[data-state="processing"] {
      background: #555;
      cursor: wait;
    }
    button[data-state="success"] {
      background: #2e7d32;
    }
    button[data-state="error"] {
      background: #a94442;
    }

    .spinner {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,.35);
      border-top-color: #fff;
      animation: spin .8s linear infinite;
    }

    .timer {
      position: absolute;
      top: -22px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      color: #d0021b;
      font-weight: 600;
      background: #fff;
      padding: 1px 6px;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(208,2,27,.5); }
      70% { box-shadow: 0 0 0 14px rgba(208,2,27,0); }
      100% { box-shadow: 0 0 0 0 rgba(208,2,27,0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  class VoiceAssistantBtn extends HTMLElement {
    constructor() {
      super();
      this._state = 'idle'; // idle | recording | processing | success | error
      this._mediaRecorder = null;
      this._chunks = [];
      this._recordingTimeout = null;
      this._targetForm = null;
    }

    connectedCallback() {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>${STYLE}</style>
        <div class="wrap">
          <span class="label" id="label"></span>
          <div style="position:relative;">
            <span class="timer" id="timer" hidden>0:00</span>
            <button id="btn" type="button" aria-label="Llenar formulario por voz" title="Llenar formulario por voz"></button>
          </div>
        </div>
      `;
      this._btn = shadow.getElementById('btn');
      this._label = shadow.getElementById('label');
      this._timerEl = shadow.getElementById('timer');
      this._btn.addEventListener('click', () => this._handleClick());
      this._render();
    }

    disconnectedCallback() {
      this._stopStream();
      clearTimeout(this._recordingTimeout);
      clearInterval(this._timerInterval);
    }

    /** Referencia directa al <form> asociado (asignada por el inyector). */
    set targetForm(formEl) {
      this._targetForm = formEl || null;
    }
    get targetForm() {
      return this._targetForm;
    }

    async _handleClick() {
      if (this._state === 'idle' || this._state === 'success' || this._state === 'error') {
        await this._startRecording();
      } else if (this._state === 'recording') {
        this._stopRecording();
      }
      // Si está "processing", ignoramos clics.
    }

    async _startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this._stream = stream;
        this._chunks = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
        this._mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        this._mediaRecorder.addEventListener('dataavailable', (e) => {
          if (e.data && e.data.size > 0) this._chunks.push(e.data);
        });
        this._mediaRecorder.addEventListener('stop', () => this._onRecordingStopped());

        this._mediaRecorder.start();
        this._setState('recording');
        this._startTimer();

        this._recordingTimeout = setTimeout(() => {
          if (this._state === 'recording') this._stopRecording();
        }, MAX_RECORDING_MS);
      } catch (err) {
        console.error('[voice-assistant-btn] No se pudo acceder al micrófono:', err);
        this._setState('error', 'No se pudo acceder al micrófono');
        setTimeout(() => this._setState('idle'), 2500);
      }
    }

    _stopRecording() {
      clearTimeout(this._recordingTimeout);
      this._stopTimer();
      if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
        this._mediaRecorder.stop();
      }
    }

    _stopStream() {
      if (this._stream) {
        this._stream.getTracks().forEach((t) => t.stop());
        this._stream = null;
      }
    }

    async _onRecordingStopped() {
      this._stopStream();
      this._setState('processing');

      const audioBlob = new Blob(this._chunks, { type: 'audio/webm' });
      const schema = this._targetForm ? extractFormSchema(this._targetForm) : [];

      try {
        const data = await callBackendPlaceholder(audioBlob, schema);
        this._setState('success');
        this._dispatchFillEvent(data);
        setTimeout(() => this._setState('idle'), 1500);
      } catch (err) {
        console.error('[voice-assistant-btn] Error al procesar el audio:', err);
        this._setState('error', 'Error al procesar el audio');
        setTimeout(() => this._setState('idle'), 2500);
      }
    }

    _dispatchFillEvent(data) {
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: {
            form: this._targetForm,
            data,
          },
        })
      );
    }

    _startTimer() {
      this._seconds = 0;
      this._timerEl.hidden = false;
      this._updateTimerLabel();
      this._timerInterval = setInterval(() => {
        this._seconds += 1;
        this._updateTimerLabel();
      }, 1000);
    }

    _stopTimer() {
      clearInterval(this._timerInterval);
      this._timerEl.hidden = true;
    }

    _updateTimerLabel() {
      const m = Math.floor(this._seconds / 60);
      const s = String(this._seconds % 60).padStart(2, '0');
      this._timerEl.textContent = `${m}:${s}`;
    }

    _setState(state, labelText) {
      this._state = state;
      if (!this._btn) return;
      this._btn.dataset.state = state;

      const labels = {
        idle: 'Dictar por voz',
        recording: 'Grabando… clic para detener',
        processing: 'Procesando…',
        success: '¡Listo!',
        error: labelText || 'Error',
      };
      this._label.textContent = labels[state] || '';
      this._label.classList.toggle('visible', state !== 'idle');

      const icons = {
        idle: ICON_MIC,
        recording: ICON_STOP,
        processing: `<span class="spinner"></span>`,
        success: ICON_CHECK,
        error: ICON_ALERT,
      };
      this._btn.innerHTML = icons[state] || ICON_MIC;
    }

    _render() {
      this._setState('idle');
    }
  }

  customElements.define('voice-assistant-btn', VoiceAssistantBtn);

  function injectButtons(root) {
    const scope = root || document;
    const forms = scope.querySelectorAll('form');
    forms.forEach((form, index) => {
      if (form.dataset.voiceAssistantInjected === 'true') return;
      form.dataset.voiceAssistantInjected = 'true';

      const btn = document.createElement('voice-assistant-btn');
      btn.targetForm = form;

      // Si hay más de un formulario en la página, se apilan verticalmente
      // para no encimarse.
      const offset = 24 + index * 76;
      btn.style.bottom = `${offset}px`;

      document.body.appendChild(btn);
    });
  }

  function init() {
    injectButtons(document);

    // Observa cambios en el DOM por si el formulario se renderiza después
    // (SPAs / apps que montan el formulario tras cargar JS).
    const observer = new MutationObserver(() => injectButtons(document));
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API expuesta por si alguna página quiere controlar la inyección manualmente.
  window.VoiceAssistantWidget = {
    inject: injectButtons,
    EVENT_NAME,
  };
})();
