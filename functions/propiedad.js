export async function onRequest(context) {
  const url = new URL(context.request.url);
  const idBusqueda = url.searchParams.get('id');
  const anioActual = new Date().getFullYear();


  if (!idBusqueda) return new Response("ID no proporcionado", { status: 400 });

  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1lSO20Y4w3GLdJIl2Eayr8wuGcF_qi5qQ7Wkcwo63DSs/export?format=csv";
  const URL_CONFIG = "https://docs.google.com/spreadsheets/d/1lSO20Y4w3GLdJIl2Eayr8wuGcF_qi5qQ7Wkcwo63DSs/export?format=csv&gid=1786999046";

  try {
    // ESTA ES LA PARTE QUE TE FALTABA: Pedir ambos al mismo tiempo
    const [resProp, resConfig] = await Promise.all([
      fetch(SHEET_URL),
      fetch(URL_CONFIG)
    ]);

    const csvText = await resProp.text();
    const csvConfig = await resConfig.text(); // Ahora csvConfig ya tiene datos

    // --- PROCESAR PROPIEDADES ---
    const filas = csvText.split(/\r?\n/).filter(f => f.trim() !== "").map(f => f.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
    const encabezados = filas[0].map(h => h.replace(/"/g, '').trim().toUpperCase());


    // --- PROCESAR CONFIGURACIÓN ---
    const filasC = csvConfig.split(/\r?\n/).filter(f => f.trim() !== "");
    const cabeceraC = filasC[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim().toUpperCase());
    const datosC = filasC[1].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    const obtenerC = (nombre) => {
      const i = cabeceraC.indexOf(nombre.toUpperCase());
      if (i === -1) return "";
      return datosC[i] ? datosC[i].replace(/^"|"$/g, '').trim() : "";
    };

    const config = {
    	nombre: obtenerC("NOMBRE INMOBILIARIA"),
        descripcion: obtenerC("DESCRIPCION EMPRESA"),
        logo: obtenerC("URL LOGO"),
        bannerTitulo: obtenerC("TITULO BANNER"),
        bannerImg: obtenerC("URL IMAGEN DEL BANNER"),
        color: obtenerC("COLOR SITIO") || "#1e2854",
        telefono: obtenerC("TELEFONO SITIO"),
        direccion: obtenerC("DIRECION EMPRESA"),
        email: obtenerC("EMAIL SITIO"),
        fb: obtenerC("URL FACEBOOK"),
        ig: obtenerC("URL INSTAGRAM"),
        x: obtenerC("URL X"),
        li: obtenerC("URL LINKEDIN"),
		whatsapp1: obtenerC("WHATSAPP")
    };
	const urlActual = context.request.url;
    const waLimpio = config.whatsapp1.replace(/\D/g, ''); // Deja solo los números
    const mensajeWA = encodeURIComponent(`¡Hola! 👋 Me interesa esta propiedad: ${urlActual}`);
    // 1. Buscamos la propiedad
    const propiedad = filas.find(f => f[0].replace(/"/g, '').trim() === idBusqueda.trim());
    if (!propiedad) return new Response("Propiedad no encontrada", { status: 404 });
	  
    // 2. Definimos la función para sacar datos UNA SOLA VEZ
    const getDato = (nombre) => {
      const i = encabezados.indexOf(nombre.toUpperCase());
      return (i !== -1 && propiedad[i]) ? propiedad[i].replace(/"/g, '').trim() : "";
    };

    // 3. Procesamos las características (La magia de la lista)
    const textoCaracteristicas = getDato("CARÁCTERISTICAS");
    const listaCaracteristicas = textoCaracteristicas 
        ? textoCaracteristicas.split(',')
            .map(item => `<li><i class="houzez-icon icon-check-simple"></i>${item.trim()}</li>`)
            .join('')
        : "<li>Sin características</li>";

    // 4. Lógica de Galería
    const fotos = [];
    for (let n = 1; n <= 8; n++) {
      const u = getDato(`FOTO URL ${n}`);
      if (u && u.startsWith('http')) fotos.push(u);
    }

    // 5. Metadatos Dinámicos
    const tituloMeta = `${getDato("TÍTULO")} - ${config.nombre}`;
    const descMeta = `${getDato("OPERACIÓN")} de ${getDato("TIPO")} en ${getDato("ZONA")} con: ${getDato("HABITACIONES")} habitaciones, ${getDato("BAÑOS")} baños, ${getDato("ÁREA CONSTRUIDA")} de área.`;
    const imagenMeta = fotos[0] || "";

    return new Response(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
	<link rel="icon" type="image/png" href="imagenes/logo-icono.png">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <title>${tituloMeta}</title>
    <meta name="description" content="${descMeta}">
    <meta property="og:title" content="${tituloMeta}">
    <meta property="og:description" content="${descMeta}">
    <meta property="og:image" content="${imagenMeta}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:title" content="${tituloMeta}">
	<meta name="twitter:description" content="${descMeta}">
	<meta name="twitter:image" content="${imagenMeta}">
	<link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
	<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap"></noscript>
    
    <link rel="stylesheet" type="text/css" href="/css/inmobiliaria.css">
    <link rel="stylesheet" type="text/css" href="/css/icons.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/magnific-popup/dist/magnific-popup.css">
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/magnific-popup/dist/jquery.magnific-popup.min.js"></script>
    <script src="/script.js"></script>

    <style>
	:root { --color-maestro: ${config.color};}
    body{
        background: var(--color-gris-1);
    }

</style>
</head>
<body>
    <header class="header">
        <div class="contenedor-header">
            <h1 class="logo"><a href="index">${config.logo ? `<img src="${config.logo}" alt="Logo ${config.nombre}">` : ''} </a></h1>
			<button class="menu-toggle" aria-label="Abrir menú"><span></span><span></span><span></span></button>
			<nav class="menu">
                <button class="menu-close">×</button>
                <ul>                    
                    <li><a href="index">Propiedades</a></li>
					<li><a href="index#nosotros">Nosotros</a></li>
                 	<li><a href="https://wa.me/${waLimpio}?text=${mensajeWA}" class="cta-boton" target="_blank"><i class="houzez-icon icon-messaging-whatsapp" aria-hidden="true"></i> Contacto</a></li>
                    <!--Submenú <li class="has-submenu">
                        <a href="#" class="submenu-trigger">
                            Cetegorías
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="icon-arrow">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </a>
                         <ul class="submenu">
                            <li><a href="index.html">Casas</a></li>
                            <li><a href="index.html">Apartamentos</a></li>
                            <li><a href="index.html">Oficinas</a></li>
                            <li><a href="index.html">Bodegas</a></li>--
                        </ul>
                    </li>-->
                </ul>
            </nav>
        </div>
    </header>

    <main>
        <section class="detalle-propiedad relleno-1">
            <article class="contenedor contenido-propiedad bloques">
                <div class="col-iz">
                    <div class="galeria-fx">
					   ${getDato("ESTADO") && getDato("ESTADO").toLowerCase() !== "disponible" ? `<span class="etiqueta-estado">${getDato("ESTADO")}</span>` : ''}
                        <div class="contenodie">
                            <div class="swiper mySwiper2">
                                <div class="swiper-wrapper">
                                    ${fotos.map(f => `
                                        <div class="swiper-slide">
                                            <a href="${f}" class="popup-image" style="background-image: url('${f}');"></a>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="swiper-button-next"></div>
                                <div class="swiper-button-prev"></div>
                            </div>
                            <div thumbsSlider="" class="swiper mySwiper miniaturas-fx-galeria">
                                <div class="swiper-wrapper">
                                    ${fotos.map(f => `
                                        <div class="swiper-slide">
                                            <img src="${f}" alt="miniatura">
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="swiper-button-next mini-next"></div>
                                <div class="swiper-button-prev mini-prev"></div>
                            </div>
                        </div>
                    </div>

                   			${(
    (getDato("HABITACIONES") && getDato("HABITACIONES").trim() !== "" && getDato("HABITACIONES") !== "0") || 
    (getDato("BAÑOS") && getDato("BAÑOS").trim() !== "" && getDato("BAÑOS") !== "0") || 
    (getDato("ÁREA CONSTRUIDA") && getDato("ÁREA CONSTRUIDA").trim() !== "" && getDato("ÁREA CONSTRUIDA") !== "0") || 
    (getDato("ESTACIONAMIENTO") && getDato("ESTACIONAMIENTO").trim() !== "" && getDato("ESTACIONAMIENTO") !== "0")
) ? `
    <div class="grupo-bloque-fx grupo-detalle">
        <span class="detalle-fx">
            ${getDato("HABITACIONES") && getDato("HABITACIONES").trim() !== "" && getDato("HABITACIONES") !== "0" ? `
                <span class="dormitorios">
                    <i class="houzez-icon icon-hotel-double-bed-1 me-2"></i> 
                    ${getDato("HABITACIONES")} <span class="bloque-texto-fx">Habitaciones</span>
                </span>` : ''}

            ${getDato("BAÑOS") && getDato("BAÑOS").trim() !== "" && getDato("BAÑOS") !== "0" ? `
                <span class="banos">
                    <i class="houzez-icon icon-bathroom-shower-1 me-2"></i> 
                    ${getDato("BAÑOS")} <span class="bloque-texto-fx">Baños</span>
                </span>` : ''}

            ${getDato("ÁREA CONSTRUIDA") && getDato("ÁREA CONSTRUIDA").trim() !== "" && getDato("ÁREA CONSTRUIDA") !== "0" ? `
                <span class="area-total">
                    <i class="houzez-icon icon-ruler-triangle me-2"></i> 
                    ${getDato("ÁREA CONSTRUIDA")} m² <span class="bloque-texto-fx">Área</span>
                </span>` : ''}

            ${getDato("ESTACIONAMIENTO") && getDato("ESTACIONAMIENTO").trim() !== "" && getDato("ESTACIONAMIENTO") !== "0" ? `
                <span class="estacionamientos">
                    <i class="houzez-icon icon-car-1 me-2"></i> 
                    ${getDato("ESTACIONAMIENTO")} <span class="bloque-texto-fx">Estacionamientos</span>
                </span>` : ''}
        </span>
    </div>
` : ''}

                    <div class="grupo-bloque-fx cabecera-fx">
                        <span class="titulo">
                            <h1>${getDato("TÍTULO")}</h1>
                            <p style="color:var(--color-maestro);"><i class="houzez-icon icon-pin me-2"></i> ${getDato("DIRECCIÓN")} - ${getDato("CIUDAD/UBICACIÓN")}</p>
                        </span>
                        <span class="precio">
                            <p> ${getDato("MONEDA")}  ${Number(getDato("PRECIO")).toLocaleString('es-CO')}</p>
                        </span>
                    </div>
                
                	${getDato("DESCRIPCIÓN") && getDato("DESCRIPCIÓN").trim() !== "" ? `
    					<div class="grupo-bloque-fx descripcion-fx">
        					<h2>Descripción</h2>
        					<p style="white-space: pre-wrap;">${getDato("DESCRIPCIÓN")}</p>
    					</div>
					` : ''}

                    <div class="grupo-bloque-fx detalles-fx">
                        <h2>Detalles</h2>
                  		<div class="detalles-items-fx">
    						${getDato("TIPO") ? `<div class="item-detalle-fx"><span>Tipo:</span> <span>${getDato("TIPO")}</span></div>` : ''}    
    						${getDato("OPERACIÓN") ? `<div class="item-detalle-fx"><span>Operación:</span> <span>${getDato("OPERACIÓN")}</span></div>` : ''}    
   							${getDato("PRECIO") && getDato("PRECIO") !== "0" ? `
        					<div class="item-detalle-fx">
            					<span>Precio:</span> 
            					<span>${getDato("MONEDA")} ${Number(getDato("PRECIO")).toLocaleString('es-CO')}</span>
        					</div>` : ''}    
    						${getDato("HABITACIONES") && getDato("HABITACIONES") !== "0" ? `<div class="item-detalle-fx"><span>Habitaciones:</span> <span>${getDato("HABITACIONES")}</span></div>` : ''}    
    						${getDato("BAÑOS") && getDato("BAÑOS") !== "0" ? `<div class="item-detalle-fx"><span>Baños:</span> <span>${getDato("BAÑOS")}</span></div>` : ''}    
    						${getDato("ESTACIONAMIENTO") && getDato("ESTACIONAMIENTO") !== "0" ? `<div class="item-detalle-fx"><span>Estacionamientos:</span> <span>${getDato("ESTACIONAMIENTO")}</span></div>` : ''}    
    						${getDato("ÁREA CONSTRUIDA") && getDato("ÁREA CONSTRUIDA") !== "0" ? `<div class="item-detalle-fx"><span>Área construida:</span> <span>${getDato("ÁREA CONSTRUIDA")} m²</span></div>` : ''}    
    						${getDato("ÁREA DEL LOTE") && getDato("ÁREA DEL LOTE") !== "0" ? `<div class="item-detalle-fx"><span>Área del lote:</span> <span>${getDato("ÁREA DEL LOTE")} m²</span></div>` : ''}    
    						${getDato("PÁIS") ? `<div class="item-detalle-fx"><span>País:</span> <span>${getDato("PÁIS")}</span></div>` : ''}    
    						${getDato("CIUDAD/UBICACIÓN") ? `<div class="item-detalle-fx"><span>Ciudad:</span> <span>${getDato("CIUDAD/UBICACIÓN")}</span></div>` : ''}    
    						${getDato("ZONA") ? `<div class="item-detalle-fx"><span>Zona:</span> <span>${getDato("ZONA")}</span></div>` : ''}    
    						${getDato("DIRECCIÓN") ? `<div class="item-detalle-fx"><span>Dirección:</span> <span>${getDato("DIRECCIÓN")}</span></div>` : ''}
						</div>
                    </div>
					${listaCaracteristicas && listaCaracteristicas.trim() !== "" ? `
    					<div class="grupo-bloque-fx detalles-fx">
        					<h2>Características</h2>
        					<ul class="lista-caracteisticas">
            					${listaCaracteristicas}
        					</ul>
    					</div>
					` : ''}
					
				
                </div>

                <div class="col-de">
				    <div class="bloque-pegaojoso-fx">
						<div class="grupo-bloque-fx formulario-fx">
                        	<div class="formulario-contacto">
                            	<h3 style="margin-top:0">¿Te interesa?</h3>
								<form method="post" action="https://systeme.io/embedded/37972521/subscription" id="form-whatsapp">
    								<label for="first_name">Nombre:</label>
    								<input type="text" id="first_name" name="first_name" placeholder="Tu nombre" required />

    								<label>Teléfono móvil:</label>
    								<div style="display: flex; gap: 5px;">
        								<select id="indicativo" style="max-width: 100px;">
              								<option value="+57" selected>🇨🇴 +57 CO</option>
            								<option value="+52">🇲🇽 +52 MX</option>
            								<option value="+34">🇪🇸 +34 ES</option>
            								<option value="+1">🇺🇸 +1 US</option>
            								<option value="+54">🇦🇷 +54 AR</option>
            								<option value="+51">🇵🇪 +51 PE</option>
            								<option value="+56">🇨🇱 +56 CL</option>
            								<option value="+507">🇵🇦 +507 PA</option>
            								<option value="+593">🇪🇨 +593 EC</option>
            								<option value="+58">🇻🇪 +58 VE</option>
            								<option value="+502">🇬🇹 +502 GT</option>
            								<option value="+591">🇧🇴 +591 BO</option>
            								<option value="+506">🇨🇷 +506 CR</option>
            								<option value="+503">🇸🇻 +503 SV</option>
            								<option value="+504">🇭🇳 +504 HN</option>
            								<option value="+505">🇳🇮 +505 NI</option>
            								<option value="+595">🇵🇾 +595 PY</option>
            								<option value="+598">🇺🇾 +598 UY</option>
            								<option value="+1">🇩🇴 +1 DO</option>
            								<option value="+1">🇵🇷 +1 PR</option>
            							</select>
        								<input type="tel" id="numero_visible" placeholder="323..." required />
    								</div>

    								<input type="hidden" name="phone_number" id="phone_final" />

    								<label for="email">Email:</label>
    								<input type="email" id="email" name="email" placeholder="Tu email" required />
    
    								<input type="hidden" name="url" id="url_actual" />

    								<div class="f-row">
        								<button type="submit" id="btn-submit" class="btn btn-whatsapp">
            								<i class="houzez-icon icon-messaging-whatsapp" aria-hidden="true" style="font-size: 20px;"></i> 
            								Contactar por WhatsApp
        								</button>
    								</div>
								</form>                  	                 
                        	</div>
						</div>
						<div class="grupo-bloque-fx">
							<h3 style="margin-top:0">Comparte esta propiedad</h3>
     						<div class="redes-compartir">
        						<button class="share-btn facebook" onclick="shareFacebook()"><i class="houzez-icon icon-social-media-facebook"></i></button>
        						<button class="share-btn twitter"   onclick="shareTwitter()"><i class="houzez-icon icon-x-logo-twitter-logo-2"></i></button>
         						<button class="share-btn whatsapp" onclick="shareWhatsApp()"><i class="houzez-icon icon-messaging-whatsapp"></i></button>   
    						</div>
						</div>
					</div>
				</div>
            </article>
        </section>
    </main>
	<footer class="footer relleno-1">
        <div class="contenedor">
            <article class="info">
                ${config.logo ? `<img src="${config.logo}" class="logo-footer" alt="Logo ${config.nombre}">` : ''}                    
                <ul class="redes">
                	${config.fb ? `<li><a href="${config.fb}" target="_blank"><i class="houzez-icon icon-social-media-facebook"></i></a></li>` : ''}
    				${config.ig ? `<li><a href="${config.ig}" target="_blank"><i class="houzez-icon icon-social-instagram"></i></a></li>` : ''}
    				${config.x ? `<li><a href="${config.x}" target="_blank"><i class="houzez-icon icon-x-logo-twitter-logo-2"></i></a></li>` : ''}
    				${config.li ? `<li><a href="${config.li}" target="_blank"><i class="houzez-icon icon-professional-network-linkedin"></i></a></li>` : ''}
				</ul>
                <p class="copy"><a href="https://www.youtube.com/artefox" target="_blank" style="display: block; color:var(--color-maestro)">Creado por ArteFox.</a> © ${anioActual} ${config.nombre}</p>
            </article>
            

            <article>
                <h2>Información Legal</h2>
                   <ul>
    				<li><a href="terminos-y-condiciones.html" target="_blank">Términos y Condiciones</a></li>
    				<li><a href="politica-de-privacidad.html" target="_blank">Política de Privacidad</a></li>
    				<li><a href="politica-de-cookies.html" target="_blank">Política de Cookies</a></li>
				</ul>
            </article>

            <article>
                <h2>Menú rápido</h2>
                <ul>
                    <li><a href="index">Propiedades</a></li>
                    <li><a href="index#nosotros">Nosotros</a></li>
                    <li><a href="#arriba" onclick="event.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});">Ir al inicio</a></li>
				</ul>
            </article>


            <article class="contacto">
                <h2>Contácto</h2>
                <ul> 
           			${config.telefono ? `<li><i class="houzez-icon icon-mobile-phone"></i> <a href="tel:${config.telefono}">${config.telefono}</a></li>` : ''}
    				${config.email ? `<li><i class="houzez-icon icon-envelope"></i> <a href="mailto:${config.email}">${config.email}</a></li>` : ''}
   					${config.direccion ? `<li><i class="houzez-icon icon-pin"></i> ${config.direccion}</li>` : ''}
                </ul>
            </article>

        </div>
    </footer>

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            var swiperThumbs = new Swiper(".mySwiper", {
                spaceBetween: 10,
                slidesPerView: 4,
                freeMode: true,
                watchSlidesProgress: true,
                navigation: { nextEl: ".mini-next", prevEl: ".mini-prev" }
            });
            var swiperMain = new Swiper(".mySwiper2", {
                spaceBetween: 10,
                navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
                thumbs: { swiper: swiperThumbs }
            });

            jQuery(".popup-image").magnificPopup({
                type: "image",
                gallery: { enabled: true }
            });
        });
    </script>






<script>
    document.addEventListener('DOMContentLoaded', () => {
        const btnContacto = document.querySelector('.cta-boton');
        const miTelefono = "${waLimpio}";
        const mensaje = "${mensajeWA}";

        if (btnContacto) {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const waBase = isMobile ? 'https://api.whatsapp.com/' : 'https://web.whatsapp.com/';
            btnContacto.href = waBase + 'send?phone=' + miTelefono + '&text=' + mensaje;
        }
    });
</script>


<script>

/*==== BOTONES PARA COMPARTIR EN REDES ====*/
function shareFacebook() {
  var url = encodeURIComponent(window.location.href);
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank');
}
function shareTwitter() {
  var url = encodeURIComponent(window.location.href);
  window.open('https://twitter.com/intent/tweet?url=' + url, '_blank');
}

function shareWhatsApp() {
  var url = encodeURIComponent(window.location.href);
  
  // Detectamos si es móvil o tablet
  var isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
  
  if (isMobile) {
    // En móviles: Usamos el protocolo directo (más rápido para abrir la App)
    window.open('https://api.whatsapp.com/send?text=' + url, '_blank');
  } else {
    // En PC: Forzamos la versión Web para evitar bloqueos
    window.open('https://web.whatsapp.com/send?text=' + url, '_blank');
  }
}
/*==== FIN BOTONES PARA COMPARTIR EN REDES ====*/

</script>


<script>
document.addEventListener('DOMContentLoaded', function() {
    const $form = document.getElementById('form-whatsapp');
    const selectInd = document.getElementById('indicativo');
    const inputNum = document.getElementById('numero_visible');
    const inputHidden = document.getElementById('phone_final');
    const inputUrl = document.getElementById('url_actual');
    const btnSubmit = document.getElementById('btn-submit');

    // 1. Ponemos la URL actual en el campo oculto de una vez
    if (inputUrl) {
        inputUrl.value = window.location.href;
    }

    // 2. Función para normalizar el teléfono
    function actualizarTelefono() {
        const numeroLimpio = inputNum.value.trim().replace(/\s+/g, '');
        inputHidden.value = selectInd.value + numeroLimpio;
    }

    selectInd.addEventListener('change', actualizarTelefono);
    inputNum.addEventListener('input', actualizarTelefono);

    // 3. El envío doble
    $form.addEventListener('submit', function(event) {
        actualizarTelefono(); // Aseguramos que el teléfono esté listo
        
        const nombre = document.getElementById('first_name').value;
        const email = document.getElementById('email').value;
        const telefono = inputHidden.value;
        const urlPropiedad = window.location.href;
        const miTelefono = '${waLimpio}'; // Tu número

        // Construimos el mensaje de WhatsApp
        let mensaje = 'Hola ${config.nombre}! 👋%0A' +
                      '*Me interesa una propiedad*%0A%0A' +
                      '*Nombre:* ' + nombre + '%0A' +
                      '*WhatsApp:* ' + telefono + '%0A' +
                      '*Email:* ' + email + '%0A' +
                      '*Link:* ' + urlPropiedad;

        // Detectamos si es móvil para usar el protocolo adecuado
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const waUrl = isMobile ? 'whatsapp://' : 'https://web.whatsapp.com/';
        const finalUrl = waUrl + 'send?phone=' + miTelefono + '&text=' + mensaje;

        // Abrimos WhatsApp en una pestaña nueva
        window.open(finalUrl, '_blank');

        // Dejamos que el formulario siga su curso hacia Systeme.io
        // El navegador enviará el formulario mientras se abre la otra pestaña
    });
});
</script>
</body>
</html>
    `, { headers: { "content-type": "text/html;charset=UTF-8" } });

  } catch (error) {
    return new Response("Error: " + error.message, { status: 500 });
  }
}
