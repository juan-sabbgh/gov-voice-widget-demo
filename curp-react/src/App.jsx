import { useState, useEffect } from 'react'
import './App.css'

const ESTADOS = [
  ['AS', 'Aguascalientes'], ['BC', 'Baja California'], ['BS', 'Baja California Sur'],
  ['CC', 'Campeche'], ['CL', 'Coahuila'], ['CM', 'Colima'], ['CS', 'Chiapas'],
  ['CH', 'Chihuahua'], ['DF', 'Ciudad de México'], ['DG', 'Durango'],
  ['GT', 'Guanajuato'], ['GR', 'Guerrero'], ['HG', 'Hidalgo'], ['JC', 'Jalisco'],
  ['MC', 'Estado de México'], ['MN', 'Michoacán'], ['MS', 'Morelos'], ['NT', 'Nayarit'],
  ['NL', 'Nuevo León'], ['OC', 'Oaxaca'], ['PL', 'Puebla'], ['QT', 'Querétaro'],
  ['QR', 'Quintana Roo'], ['SP', 'San Luis Potosí'], ['SL', 'Sinaloa'], ['SR', 'Sonora'],
  ['TC', 'Tabasco'], ['TS', 'Tamaulipas'], ['TL', 'Tlaxcala'], ['VZ', 'Veracruz'],
  ['YN', 'Yucatán'], ['ZS', 'Zacatecas'], ['NE', 'Nacido en el extranjero'],
]

function App() {
  const [tab, setTab] = useState('datos')
  const [form, setForm] = useState({
    curp: '',
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    diaNacimiento: '',
    mesNacimiento: '',
    selectedYear: '',
    sexo: '',
    claveEntidad: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Escucha al widget de dictado por voz y acomoda los datos en el estado
  // de React (el widget nunca toca el DOM de este formulario directamente).
  // El widget manda los datos usando como clave el `name` real de cada
  // input/select — como el estado de este formulario usa esos mismos
  // nombres, alcanza con un merge, sin mapear campo por campo.
  useEffect(() => {
    function handleVoiceFill(event) {
      const data = event.detail?.data || {}
      setForm((prev) => ({ ...prev, ...data }))

      if (data.curp && !data.nombres) setTab('curp')
      else if (data.nombres) setTab('datos')
    }

    window.addEventListener('voice-assistant:fill', handleVoiceFill)
    return () => window.removeEventListener('voice-assistant:fill', handleVoiceFill)
  }, [])

  return (
    <>
      <header>
        <nav className="navbar navbar-inverse navbar-fixed-top" role="navigation">
          <div className="container">
            <div className="navbar-header">
              <a className="navbar-brand-logo" href="https://www.gob.mx/">
                <img src="/vendor/img/logo_blanco.svg" alt="gobierno de mexico" />
              </a>
            </div>
            <ul className="nav navbar-nav navbar-right">
              <li><a href="https://www.gob.mx/tramites">Trámites</a></li>
              <li><a href="https://www.gob.mx/gobierno">Gobierno</a></li>
              <li><a href="https://www.gob.mx/busqueda"><span className="sr-only">Búsqueda</span><i className="icon-search" /></a></li>
            </ul>
          </div>
        </nav>
      </header>

      <nav className="navbar navbar-inverse sub-navbar navbar-fixed-top">
        <div className="container">
          <div className="navbar-header">
            <a className="navbar-brand" href="/">RENAPO</a>
          </div>
        </div>
      </nav>

      <main role="main">
        <div className="container">
          <ol className="breadcrumb top-buffer">
            <li><a title="Ir a la página inicial de gob.mx" href="https://www.gob.mx"><i className="icon icon-home" /></a></li>
            <li><a href="https://www.gob.mx/curp">Inicio</a></li>
            <li className="active">Consulta tu CURP</li>
          </ol>

          <h1>Consulta tu CURP</h1>

          <div className="col-md-12 hidden-xs">
            <ul className="wizard-steps">
              <li className="wizardbar-i completed">
                <h5>Paso 1</h5>
                <span>Búsqueda</span>
              </li>
              <li className="wizardbar-i">
                <h5>Paso 2</h5>
                <span>Descargar CURP</span>
              </li>
              <li className="wizardbar-i"><i className="glyphicon glyphicon-ok-circle" /></li>
            </ul>
          </div>

          <section className="buscar">
            <div className="container">
              <div className="row">
                <div className="col-xs-12 col-sm-12 col-md-12">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <h2>Búsqueda</h2>
                    <hr className="red" />
                    <div className="row clearfix">
                      <div className="col-md-8">
                        <p>La consulta puede efectuarse indicando la clave CURP cuando ya la conoce o proporcionando su nombre y datos de nacimiento.</p>

                        <ul className="nav nav-tabs top-buffer">
                          <li id="curp" className={tab === 'curp' ? 'active' : ''}>
                            <a href="#tab-01" onClick={(e) => { e.preventDefault(); setTab('curp') }}>Clave Única de Registro de Población</a>
                          </li>
                          <li id="datos" className={tab === 'datos' ? 'active' : ''}>
                            <a href="#tab-02" onClick={(e) => { e.preventDefault(); setTab('datos') }}>Datos Personales</a>
                          </li>
                        </ul>

                        <div className="tab-content">
                          {tab === 'curp' && (
                            <div className="tab-pane clearfix active" id="tab-01">
                              <div className="col-md-12">
                                <div className="form-group">
                                  <label htmlFor="curpinput" className="control-label">
                                    Clave Única de Registro de Población (CURP)<span className="asterisco form-text">*</span>:
                                  </label>
                                  <input
                                    id="curpinput"
                                    name="curp"
                                    required
                                    placeholder="Ingresa tu CURP"
                                    maxLength={18}
                                    className="campos form-control"
                                    type="text"
                                    value={form.curp}
                                    onChange={handleChange}
                                  />
                                  <br />
                                  <a href="#">¿No conoces tu CURP?</a>
                                </div>
                              </div>
                            </div>
                          )}

                          {tab === 'datos' && (
                            <div className="tab-pane clearfix active" id="tab-02">
                              <div className="row">
                                <div className="col-md-6 col-xs-12">
                                  <div className="form-group">
                                    <label htmlFor="nombre" className="control-label">Nombre(s)<span className="asteriscoData form-text">*</span>:</label>
                                    <input id="nombre" name="nombres" required placeholder="Ingresa tu nombre(s)" maxLength={50} className="campos form-control" type="text" value={form.nombres} onChange={handleChange} />
                                  </div>
                                </div>
                                <div className="col-md-6 col-xs-12">
                                  <div className="form-group">
                                    <label htmlFor="primerApellido" className="control-label">Primer apellido<span className="asteriscoData form-text">*</span>:</label>
                                    <input id="primerApellido" name="primerApellido" required placeholder="Ingresa tu primer apellido" maxLength={50} className="campos form-control" type="text" value={form.primerApellido} onChange={handleChange} />
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-6 col-xs-12">
                                  <div className="form-group">
                                    <label htmlFor="segundoApellido" className="control-label">Segundo apellido:</label>
                                    <input id="segundoApellido" name="segundoApellido" placeholder="Ingresa tu segundo apellido" maxLength={50} className="campos form-control" type="text" value={form.segundoApellido} onChange={handleChange} />
                                  </div>
                                </div>
                                <div className="col-md-6 col-xs-12">
                                  <div className="form-group">
                                    <label htmlFor="diaNacimiento" className="control-label">Día de nacimiento<span className="asteriscoData form-text">*</span>:</label>
                                    <select id="diaNacimiento" name="diaNacimiento" className="campos form-control form-selected select small" required value={form.diaNacimiento} onChange={handleChange}>
                                      <option value="" disabled>Seleccionar el día</option>
                                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-6 col-xs-12">
                                  <div className="form-group">
                                    <label htmlFor="mesNacimiento" className="control-label">Mes de nacimiento<span className="asteriscoData form-text">*</span>:</label>
                                    <select id="mesNacimiento" name="mesNacimiento" className="campos form-control form-selected select small" required value={form.mesNacimiento} onChange={handleChange}>
                                      <option value="" disabled>Seleccionar el mes</option>
                                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="col-md-6 col-xs-12">
                                  <div className="form-group">
                                    <label htmlFor="selectedYear" className="control-label">Año de nacimiento<span className="asteriscoData form-text">*</span>:</label>
                                    <input id="selectedYear" name="selectedYear" required placeholder="Ingresa el año Ej. 1943" maxLength={4} className="campos form-control" type="text" value={form.selectedYear} onChange={handleChange} />
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-6 col-xs-12">
                                  <div className="form-group">
                                    <label htmlFor="sexo" className="control-label">Sexo<span className="asteriscoData form-text">*</span>:</label>
                                    <select id="sexo" name="sexo" className="campos form-control form-selected select small" required value={form.sexo} onChange={handleChange}>
                                      <option value="" disabled>Selecciona el sexo</option>
                                      <option value="M">Mujer</option>
                                      <option value="H">Hombre</option>
                                      <option value="X">No binario</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="col-md-6 col-xs-12">
                                  <div className="form-group">
                                    <label htmlFor="claveEntidad" className="control-label">
                                      Estado<span className="asteriscoData form-text">*</span>:
                                    </label>
                                    <select id="claveEntidad" name="claveEntidad" className="campos form-control form-selected select small" required value={form.claveEntidad} onChange={handleChange}>
                                      <option value="" disabled>Selecciona el estado</option>
                                      {ESTADOS.map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-8 col-md-offset-4">
                        <hr />
                      </div>
                    </div>

                    <div className="form-group clearfix">
                      <div className="text-muted pull-left">* Campos obligatorios</div>
                      <div className="pull-right">
                        <button id="searchButton" className="btn btn-primary pull-right" type="submit">
                          <span className="icon icon-search" style={{ marginRight: 8 }} />
                          Buscar
                        </button>
                      </div>
                    </div>

                    <div className="form-group clearfix">
                      <div className="alert alert-info">
                        <strong>¡Sugerencia!</strong> Para solicitar asistencia telefónica sobre el servicio de la CURP, puedes comunicarte al Centro de Atención y Servicios, de lunes a viernes, de 08:00 a 16:00 horas, a los números telefónicos:
                        <ul>
                          <li>800 9 11 11 11, extensiones 15100 y 15101.</li>
                        </ul>
                      </div>
                      <div className="alert alert-info">
                        <p><strong>Aviso de privacidad simplificado de consulta de CURP en línea</strong></p>
                        <p>La recolección de datos personales se lleva a cabo a través de <a href="/curp/">https://www.gob.mx/curp</a>, cuyo administrador y responsable del trámite de CURP es la Dirección General del Registro Nacional de Población e Identidad de la Secretaría de Gobernación.</p>
                        <p>Los datos personales que se recaban serán utilizados con la finalidad de buscar, validar y obtener la CURP.</p>
                        <p>Conoce el aviso de privacidad integral en <a href="/curp/privacidadintegral" target="_blank">https://www.gob.mx/curp/privacidadintegral</a>.</p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="main-footer">
        <div className="container">
          <div className="bottom-buffer-footer row">
            <div className="col-sm-3 logo-footer navbar-footer-logo">
              <img src="/vendor/img/logo_blanco.svg" alt="logo gobierno de méxico" className="logo_footer" />
            </div>
            <div className="col-xs-12 col-sm-3">
              <h5>Enlaces</h5>
              <ul className="nav-list">
                <li><a href="http://www.ordenjuridico.gob.mx" target="_blank" rel="noreferrer">Marco Jurídico</a></li>
                <li><a href="https://transparencia.gob.mx" target="_blank" rel="noreferrer">Transparencia para el pueblo</a></li>
              </ul>
            </div>
            <div className="col-xs-12 col-sm-3">
              <h5>¿Qué es gob.mx?</h5>
              <p>Es el portal único de trámites, información y participación ciudadana. <a href="https://www.gob.mx/que-es-gobmx">Leer más</a></p>
              <ul className="nav-list">
                <li><a href="https://www.gob.mx/accesibilidad" target="_blank" rel="noreferrer">Declaración de accesibilidad</a></li>
                <li><a href="https://www.gob.mx/terminos" target="_blank" rel="noreferrer">Términos y Condiciones</a></li>
              </ul>
            </div>
            <div className="col-xs-12 col-sm-3">
              <h5 className="link-a"><a className="footer" href="https://sidec.buengobierno.gob.mx/#!/" target="_blank" rel="noreferrer">Denuncia contra servidores públicos</a></h5>
              <span className="col-xs-5 col-sm-12 col-md-11 social-media">Síguenos en</span>
              <ul className="col-xs-7 col-sm-12 col-md-11 list-inline social-media">
                <li><a href="https://www.facebook.com/gobmexico" target="_blank" rel="noreferrer"><img alt="Facebook" src="/vendor/img/facebook.png" /></a></li>
                <li><a href="https://twitter.com/GobiernoMX" target="_blank" rel="noreferrer"><img alt="Twitter" src="/vendor/img/twitter.png" /></a></li>
                <li><a href="https://www.instagram.com/gobmexico/" target="_blank" rel="noreferrer"><img alt="Instagram" src="/vendor/img/instagram.png" /></a></li>
                <li><a href="https://www.youtube.com/@gobiernodemexico" target="_blank" rel="noreferrer"><img alt="Youtube" src="/vendor/img/youtube.png" /></a></li>
              </ul>
              <div className="logo-079">
                <a href="tel:+079" target="_blank" rel="noreferrer"><img src="/vendor/img/079.png" alt="logo 079" className="logo-079" /></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App
