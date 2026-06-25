export async function onRequest(context) {
    const URL_PROPIEDADES = "https://docs.google.com/spreadsheets/d/1lSO20Y4w3GLdJIl2Eayr8wuGcF_qi5qQ7Wkcwo63DSs/export?format=csv";
    const URL_CONFIG = "https://docs.google.com/spreadsheets/d/1lSO20Y4w3GLdJIl2Eayr8wuGcF_qi5qQ7Wkcwo63DSs/export?format=csv&gid=1786999046";

    try {
        const [resProp, resConfig] = await Promise.all([
            fetch(URL_PROPIEDADES),
            fetch(URL_CONFIG)
        ]);

        const csvProp = await resProp.text();
        const csvConfig = await resConfig.text();

        // --- PROCESAR CONFIGURACIÓN ---
        const filasC = csvConfig.split(/\r?\n/).filter(f => f.trim() !== "");
        const cabeceraC = filasC[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim().toUpperCase());
        const datosC = filasC[1].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        const obtenerC = (nombre) => {
            const i = cabeceraC.indexOf(nombre.toUpperCase());
            if (i === -1) return "";
            return datosC[i] ? datosC[i].replace(/^"|"$/g, '').trim() : "";
        };

        // Preparamos los datos de WhatsApp ANTES de crear el objeto config
        const whatsappOriginal = obtenerC("WHATSAPP");
        const urlActual = context.request.url;
        const waLimpio = whatsappOriginal.replace(/\D/g, ''); // Quitamos todo lo que no sea número
        const mensajeWA = encodeURIComponent(`Hola: ${urlActual}`);

        // Mapeo de variables de configuración (Metemos todo aquí)
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
            whatsapp1: whatsappOriginal,
            waLimpio: waLimpio,        // Ahora sí existe para c.waLimpio
            mensajeWA: mensajeWA,      // Ahora sí existe para c.mensajeWA
            s1_t: obtenerC("TITULO SERVICIO 1"), s1_x: obtenerC("TEXTO SERVICIO 1"),
            s2_t: obtenerC("TITULO SERVICIO 2"), s2_x: obtenerC("TEXTO SERVICIO 2"),
            s3_t: obtenerC("TITULO SERVICIO 3"), s3_x: obtenerC("TEXTO SERVICIO 3"),
            s4_t: obtenerC("TITULO SERVICIO 4"), s4_x: obtenerC("TEXTO SERVICIO 4"),
            s5_t: obtenerC("TITULO SERVICIO 5"), s5_x: obtenerC("TEXTO SERVICIO 5"),
            s6_t: obtenerC("TITULO SERVICIO 6"), s6_x: obtenerC("TEXTO SERVICIO 6")
        };

        // --- PROCESAR PROPIEDADES ---
        const filas = csvProp.split(/\r?\n/).filter(f => f.trim() !== "");
        const cabecera = filas[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim().toUpperCase());
        
        const idx = {
            id: cabecera.indexOf("ID"),
            tipo: cabecera.indexOf("TIPO"),
            operacion: cabecera.indexOf("OPERACIÓN"),
            precio: cabecera.indexOf("PRECIO"),
            moneda: cabecera.indexOf("MONEDA"),
            habs: cabecera.indexOf("HABITACIONES"),
            banos: cabecera.indexOf("BAÑOS"),
            parking: cabecera.indexOf("ESTACIONAMIENTO"),
            area: cabecera.indexOf("ÁREA CONSTRUIDA"),
            zona: cabecera.indexOf("ZONA"),
            dir: cabecera.indexOf("DIRECCIÓN"),
            foto: cabecera.indexOf("FOTO URL 1"),
            titulo: cabecera.indexOf("TÍTULO"),
			titulo: cabecera.indexOf("TÍTULO"),
			estado: cabecera.indexOf("ESTADO")
        };

        const limpiar = (val) => val ? val.replace(/^"|"$/g, '').trim() : "";

   let htmlTarjetas = "";
   for (let i = 1; i < filas.length; i++) {
            const dato = filas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (dato.length < 5) continue;

            const p = {
                id: limpiar(dato[idx.id]),
                tipo: limpiar(dato[idx.tipo]),
                operacion: limpiar(dato[idx.operacion]),
                precio: limpiar(dato[idx.precio]) || "0",
                moneda: limpiar(dato[idx.moneda]) || "$",
                habs: limpiar(dato[idx.habs]) || "0",
                banos: limpiar(dato[idx.banos]) || "0",
                parking: limpiar(dato[idx.parking]) || "0",
                area: limpiar(dato[idx.area]) || "0",
                zona: limpiar(dato[idx.zona]),
                dir: limpiar(dato[idx.dir]),
                foto: limpiar(dato[idx.foto]),
                titulo: limpiar(dato[idx.titulo])
            };

            htmlTarjetas += `
                <article class="item-propiedad"   onclick="window.location.href='./propiedad?id=${p.id}'" data-tipo="${p.tipo}" data-operacion="${p.operacion}" data-precio="${p.precio}" data-ubicacion="${p.dir} ${p.zona}">
                    <div class="contenedor-img">
					   ${p.estado && p.estado.toLowerCase() !== "disponible" ? `<span class="etiqueta-estado">${p.estado}</span>` : ''}
                        <img src="${p.foto}" onerror="this.src='https://via.placeholder.com/400x300?text=Sin Foto';" loading="lazy">
                    </div>
                    <h2>${p.titulo || (p.operacion + ' en ' + p.zona)}</h2>
                    <span class="direccion"><i class="houzez-icon icon-pin me-2"></i> ${p.dir} - ${p.zona}</span>
                    <span class="detalle">
                        ${p.habs !== "0" ? `<span class="dormitorios"><i class="houzez-icon icon-hotel-double-bed-1"></i> ${p.habs}</span>` : ''}
                        ${p.banos !== "0" ? `<span class="banos"><i class="houzez-icon icon-bathroom-shower-1"></i> ${p.banos}</span>` : ''}
                        ${p.area !== "0" ? `<span class="area"><i class="houzez-icon icon-ruler-triangle"></i> ${p.area} m²</span>` : ''}
						${p.parking && p.parking !== "0" ? `<span class="garaje"><i class="houzez-icon icon-car-1 me-2"></i> ${p.parking}</span>` : ''}
                    </span>
                    <span class="precio">${p.moneda} ${Number(p.precio).toLocaleString('es-CO')}</span>
                </article>`;
        }

        // Un solo return limpio
        return new Response(generarPlantilla(htmlTarjetas, filas.length - 1, config), {
            headers: { "Content-Type": "text/html;charset=UTF-8" }
        });

    } catch (error) {
        return new Response("Error al renderizar: " + error.message, { status: 500 });
    }
}

function generarPlantilla(tarjetas, total, c) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
	<link rel="icon" type="image/png" href="imagenes/logo-icono.png">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${c.nombre} | Listado de propiedades</title>
	<link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
	<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap"></noscript>
    <link rel="stylesheet" type="text/css" href="css/inmobiliaria.css">
    <link rel="stylesheet" type="text/css" href="css/icons.css">
    <script src="script.js"></script>
    <style>
        :root { --color-maestro: ${c.color};}
        body{ background: #f8f9fa;}
		
        .banner-inicio .contenedor { 
            background-image: linear-gradient(180deg, ${c.color}AB 0%, rgba(0, 0, 0, 0.84) 100%), 
                url(imagenes/fondo.webp) !important;
		 }
         .relleno-5 { padding: 10px 20px 55px 20px; }
        .houzez-icon.icon-Filter-Faders{ font-size: 30px; 
        }
		
		/* Ocultamos todas por defecto */
		.item-propiedad {
    		display: none;
			}

		/* Solo mostramos las que tengan la clase .visible */
		.item-propiedad.visible {
    		display: grid !important; /* Usamos grid para respetar tu subgrid */
		}

		.contenedor-boton-mas {
    		text-align: center;
    		margin: 40px 0;
		}

		#btnCargarMas {
    		padding: 12px 30px;
    		background-color: var(--color-maestro);
    		color: white;
    		border: none;
    		border-radius: 5px;
    		cursor: pointer;
    		font-weight: bold;
    		transition: transform 0.2s;
		}

		#btnCargarMas:hover {
    		transform: scale(1.05);
		}
	
    </style>
</head>
<body>
    <header class="header">
        <div class="contenedor-header">
            <h1 class="logo"><a href="index">
                ${c.logo ? `<img src="${c.logo}" alt="Logo  ${c.nombre}">` : ''}
            </a></h1>
            <button class="menu-toggle" aria-label="Abrir menú"><span></span><span></span><span></span></button>
            <nav class="menu">
                <button class="menu-close">×</button>
                <ul>
                    <li><a href="index">Propiedades</a></li>
                    <li><a href="index#nosotros">Nosotros</a></li>
                    <li><a href="https://wa.me/${c.waLimpio}?text=${c.mensajeWA}" class="cta-boton" target="_blank"><i class="houzez-icon icon-messaging-whatsapp" aria-hidden="true"></i>Contacto</a></li>
                </ul>
            </nav>
        </div>     
    </header>

    <section class="banner-inicio">
        <div class="contenedor"><h1>${c.bannerTitulo.replace(/\n/g, '<br>')}</h1></div>
    </section>
 <button type="button" class="disparador-movil" id="abrir-filtros">
        <i class="houzez-icon icon-Filter-Faders"></i>
        Buscar y Filtrar
    </button>
       <form id="formulario-busqueda" class="barra-busqueda">
        <div class="item-busqueda">
            <label>Ubicación</label>
            <input type="text" name="ubicacion" placeholder="Ubicación..">
        </div>
        <div class="item-busqueda">
            <label>Operación</label>
            <select name="operacion">
                <option value="">Cualquiera</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
            </select>
        </div>
        <div class="item-busqueda">
            <label>Inmueble</label>
            <select name="tipo">
                <option value="">Todos</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa</option>
                <option value="Oficina">Oficina</option>
            </select>
        </div>
        <div class="item-busqueda">
            <label>Precio Mín</label>
            <input type="number" name="min-precio" placeholder="0">
        </div>
        <div class="item-busqueda">
            <label>Precio Máx</label>
            <input type="number" name="max-precio" placeholder="Máx">
        </div>
        <button type="submit" class="boton-buscar">Buscar</button>
    </form>

    <main>
        <section class="propiedades relleno-5">
            <div class="contenedor">
                <div class="contenedor-resultados" style="display:block;">
                    <div class="fila-info">
                        <div class="bloque-izquierdo">
                            <p class="conteo-propiedades"><span id="total-propiedades">${total}</span> Propiedades encontradas</p>
                            <div class="etiquetas-filtros" style="display: none;">
                                <span class="texto-pequeno">Filtros activos:</span>
                                <div id="contenedor-etiquetas-dinamicas" style="display:contents;"></div>
                                <button class="boton-limpiar">Borrar todo</button>
                            </div>
                        </div>
                        <div class="bloque-derecho">
                            <select class="selector-orden">
                                <option value="precio-bajo" style="display: none;">Ordenar por</option>
                                <option value="precio-bajo">Precio más bajo</option>
                                <option value="precio-alto">Precio más alto</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="grid-propiedades" id="listado-propiedades">${tarjetas}</div>
				
            </div>
        </section>

        <section id="nosotros" class="servicios relleno-1">
            <div class="contenedor">
                <h2>${c.nombre}</h2>
                <div class="scroll-fx-2 scroll-delgado" style="max-width:750px; margin:0 0 30px 0"><p>${c.descripcion}</p></div>
                <div class="grid-servicios">
                    ${c.s1_t ? `<article><i class="houzez-icon icon-check-circle-1"></i><h3>${c.s1_t}</h3><div class="scroll-fx scroll-delgado"><p>${c.s1_x}</p></div></article>` : ''}
                    ${c.s2_t ? `<article><i class="houzez-icon icon-check-circle-1"></i><h3>${c.s2_t}</h3><div class="scroll-fx scroll-delgado"><p>${c.s2_x}</p></div></article>` : ''}
                    ${c.s3_t ? `<article><i class="houzez-icon icon-check-circle-1"></i><h3>${c.s3_t}</h3><div class="scroll-fx scroll-delgado"><p>${c.s3_x}</p></div></article>` : ''}
                    ${c.s4_t ? `<article><i class="houzez-icon icon-check-circle-1"></i><h3>${c.s4_t}</h3><div class="scroll-fx scroll-delgado"><p>${c.s4_x}</p></div></article>` : ''}
                    ${c.s5_t ? `<article><i class="houzez-icon icon-check-circle-1"></i><h3>${c.s5_t}</h3><div class="scroll-fx scroll-delgado"><p>${c.s5_x}</p></div></article>` : ''}
                    ${c.s6_t ? `<article><i class="houzez-icon icon-check-circle-1"></i><h3>${c.s6_t}</h3><div class="scroll-fx scroll-delgado"><p>${c.s6_x}</p></div></article>` : ''}
                </div>              
            </div>
        </section>
    </main>

    <footer class="footer relleno-1">
        <div class="contenedor">
            <article class="info">
                ${c.logo ? `<img src="${c.logo}" class="logo-footer">` : `<h2>${c.nombre}</h2>`}
                <p><a href="https://www.tiktok.com/@xavipropiedades" target="_blank" style="display: block; color:var(--color-maestro)">Xavipropiedades Team.</a> © 2026 ${c.nombre}</p>          
				    <ul class="redes">
                  		${c.fb ? `<li><a href="${c.fb}" target="_blank"><i class="houzez-icon icon-social-media-facebook"></i></a></li>` : ''}
    					${c.ig ? `<li><a href="${c.ig}" target="_blank"><i class="houzez-icon icon-social-instagram"></i></a></li>` : ''}
    					${c.x ? `<li><a href="${c.x}" target="_blank"><i class="houzez-icon icon-x-logo-twitter-logo-2"></i></a></li>` : ''}
    					${c.li ? `<li><a href="${c.li}" target="_blank"><i class="houzez-icon icon-professional-network-linkedin"></i></a></li>` : ''}
					</ul>
               
            </article>
            <article>
                <h2>Información legal</h2>
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
			
            <article>
                <h2>Contacto</h2>
				<ul>
                	${c.telefono ? `<li><i class="houzez-icon icon-mobile-phone"></i> <a href="tel:${c.telefono}">${c.telefono}</a></li>` : ''}
    				${c.email ? `<li><i class="houzez-icon icon-envelope"></i> <a href="mailto:${c.email}">${c.email}</a></li>` : ''}
    				${c.direccion ? `<li><i class="houzez-icon icon-pin"></i> ${c.direccion}</li>` : ''}
				</ul>
            </article>
        </div>
    </footer>
	
	<script>
    	document.addEventListener('DOMContentLoaded', () => {
        	const btnContacto = document.querySelector('.cta-boton');
        	const miTelefono = "${c.waLimpio}";
        	const mensaje = "${c.mensajeWA}";

        	if (btnContacto) {
            	const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            	const waBase = isMobile ? 'https://api.whatsapp.com/' : 'https://web.whatsapp.com/';
            	btnContacto.href = waBase + 'send?phone=' + miTelefono + '&text=' + mensaje;
        	}

    	});
	</script>



    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const listado = document.getElementById('listado-propiedades');
            const formulario = document.getElementById('formulario-busqueda');
            const contenedorFiltros = document.querySelector('.etiquetas-filtros');
            const contenedorEtiquetas = document.getElementById('contenedor-etiquetas-dinamicas');
            const btnLimpiar = document.querySelector('.boton-limpiar');
            const selectorOrden = document.querySelector('.selector-orden');
            let tarjetasArr = Array.from(listado.getElementsByTagName('article'));
			
            function normalizar(texto) {
                return texto ? texto.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase() : "";
            }
			
            function filtrar() {
                const query = normalizar(formulario.ubicacion.value);
                const op = formulario.operacion.value;
                const tipo = formulario.tipo.value;
                const min = parseInt(formulario.querySelector('input[name="min-precio"]').value) || 0;
                const max = parseInt(formulario.querySelector('input[name="max-precio"]').value) || Infinity;
                let c = 0;
                tarjetasArr.forEach(t => {
                    const text = normalizar(t.dataset.ubicacion);
                    const precio = parseInt(t.dataset.precio) || 0;
                    const matchText = query.length < 3 || text.includes(query);
                    const matchOp = op === "" || t.dataset.operacion === op;
                    const matchTipo = tipo === "" || t.dataset.tipo === tipo;
                    const matchPrecio = precio >= min && precio <= max;
                    if(matchText && matchOp && matchTipo && matchPrecio) {
                        t.style.display = "grid";
                        c++;
                    } else {
                        t.style.display = "none";
                    }
                });
                document.getElementById('total-propiedades').innerText = c;
                actualizarEtiquetas(op, tipo, min, max);
			}

            function actualizarEtiquetas(op, tipo, min, max) {
                contenedorEtiquetas.innerHTML = '';
                let activo = false;
                if(op) { crearEtiqueta(op, 'operacion'); activo = true; }
                if(tipo) { crearEtiqueta(tipo, 'tipo'); activo = true; }
                if(min > 0 || max < Infinity) { 
                    crearEtiqueta('Precio: ' + min.toLocaleString() + '...', 'precio');
                    activo = true;
				}
                contenedorFiltros.style.display = activo ? 'flex' : 'none';
			}

            function crearEtiqueta(texto, campo) {
                const div = document.createElement('div');
                div.className = 'etiqueta';
                div.innerHTML = '<span>'+texto+'</span><button type="button" class="boton-quitar">×</button>';
                div.querySelector('button').onclick = () => {
                    if(campo === 'precio') {
                        formulario.querySelector('input[name="min-precio"]').value = "";
                        formulario.querySelector('input[name="max-precio"]').value = "";
                    } else {
                        formulario.querySelector('[name="'+campo+'"]').value = "";
					}
                    filtrar();
				};
                contenedorEtiquetas.appendChild(div);
			}

            if (selectorOrden) {
                selectorOrden.addEventListener('change', () => {
                    const orden = selectorOrden.value;
                    tarjetasArr.sort((a, b) => {
                        const pA = parseInt(a.dataset.precio || 0);
                        const pB = parseInt(b.dataset.precio || 0);
                        return orden === 'precio-bajo' ? pA - pB : pB - pA;
                    }).forEach(t => listado.appendChild(t));
                });
            }
			
            formulario.addEventListener('input', filtrar);
            btnLimpiar.onclick = () => { formulario.reset(); filtrar(); };
            document.getElementById('abrir-filtros').onclick = () => formulario.classList.toggle('activo');
        });
    </script>
</body>
</html>`;
}
















































































