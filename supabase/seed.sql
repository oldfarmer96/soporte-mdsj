-- Datos deterministas exclusivamente para el entorno de desarrollo local.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.tickets) THEN
    RAISE EXCEPTION
      'El seed local no puede reemplazar los catalogos mientras existan tickets';
  END IF;
END;
$$;

-- Solo se reemplazan los cuatro catalogos, siempre en orden hijo-padre.
DELETE FROM public.ticket_tipos_problemas;
DELETE FROM public.subareas;
DELETE FROM public.categorias;
DELETE FROM public.areas;

INSERT INTO public.areas (
  id, nombre, nombre_corto, piso, referencia, es_otro, activo, orden
)
SELECT
  ('10000000-0000-4000-8000-' || lpad(numero::text, 12, '0'))::uuid,
  nombre,
  nombre_corto,
  NULL,
  NULL,
  false,
  true,
  numero * 10
FROM (VALUES
  (1,  'Concejo Municipal', 'CM'),
  (2,  'Alcaldía', 'ALC'),
  (3,  'Órgano de Control Institucional', 'OCI'),
  (4,  'Procuraduría Pública Municipal', 'PPM'),
  (5,  'Gerencia Municipal', 'GM'),
  (6,  'Oficina General de Defensa Civil', 'OGDC'),
  (7,  'Oficina General de Administración', 'OGA'),
  (8,  'Secretaría General', 'SG'),
  (9,  'Oficina General de Asesoría Jurídica', 'OGAJ'),
  (10, 'Oficina General de Planeamiento y Presupuesto', 'OGPP'),
  (11, 'Gerencia de Desarrollo Urbano y Rural', 'GDUR'),
  (12, 'Gerencia de Desarrollo Social', 'GDS'),
  (13, 'Gerencia de Servicios Públicos Municipales', 'GSPM'),
  (14, 'Gerencia de Administración Tributaria y Rentas', 'GATR'),
  (15, 'Gerencia de Desarrollo Económico', 'GDE')
) AS datos(numero, nombre, nombre_corto);

WITH subareas_datos (area_numero, orden, nombre, es_sin_subarea, es_otro) AS (
  VALUES
    (1, 10, 'Consejo de Coordinación Distrital', false, false),
    (1, 20, 'Comité de Administración de PVL', false, false),
    (1, 30, 'Plataforma de Defensa Civil Distrital', false, false),
    (1, 40, 'Junta de Delegados Vecinales y Comunales', false, false),
    (1, 50, 'Comité de Seguridad Ciudadana', false, false),
    (1, 60, 'Otra subárea', false, true),
    (2, 10, 'Sin subárea', true, false),
    (2, 20, 'Otra subárea', false, true),
    (3, 10, 'Sin subárea', true, false),
    (3, 20, 'Otra subárea', false, true),
    (4, 10, 'Sin subárea', true, false),
    (4, 20, 'Otra subárea', false, true),
    (5, 10, 'Sin subárea', true, false),
    (5, 20, 'Otra subárea', false, true),
    (6, 10, 'Sin subárea', true, false),
    (6, 20, 'Otra subárea', false, true),
    (7, 10, 'Unidad de Recursos Humanos', false, false),
    (7, 20, 'Unidad de Logística', false, false),
    (7, 30, 'Unidad de Tesorería', false, false),
    (7, 40, 'Unidad de Contabilidad', false, false),
    (7, 50, 'Unidad de Control Patrimonial', false, false),
    (7, 60, 'Unidad de Tecnologías de Información y Comunicaciones (UTICs)', false, false),
    (7, 70, 'Otra subárea', false, true),
    (8, 10, 'Unidad de Trámite Documentario', false, false),
    (8, 20, 'Unidad de Archivo Central', false, false),
    (8, 30, 'Unidad de Relaciones Públicas y Protocolo', false, false),
    (8, 40, 'Unidad de Registro Civil', false, false),
    (8, 50, 'Otra subárea', false, true),
    (9, 10, 'Sin subárea', true, false),
    (9, 20, 'Otra subárea', false, true),
    (10, 10, 'Unidad de Presupuesto', false, false),
    (10, 20, 'Unidad de Racionalización', false, false),
    (10, 30, 'Oficina de Programación Multianual de Inversiones (OPMI)', false, false),
    (10, 40, 'Otra subárea', false, true),
    (11, 10, 'Subgerencia de Obras Públicas', false, false),
    (11, 20, 'Subgerencia de Supervisión y Liquidación de Obras Públicas', false, false),
    (11, 30, 'Unidad Formuladora de Proyectos de Inversión Pública', false, false),
    (11, 40, 'Unidad de Estudios, Proyectos y Mantenimiento', false, false),
    (11, 50, 'Subgerencia de Catastro y Ordenamiento Territorial', false, false),
    (11, 60, 'Subgerencia de Maquinaria y Equipo Mecánico', false, false),
    (11, 70, 'Otra subárea', false, true),
    (12, 10, 'Unidad Local de Empadronamiento (ULE)', false, false),
    (12, 20, 'Unidad de Programa de Vaso de Leche (PVL)', false, false),
    (12, 30, 'Unidad de Protección de la Familia y DEMUNA', false, false),
    (12, 40, 'Unidad de Atención Integral a la Primera Infancia (UAIPI)', false, false),
    (12, 50, 'Subgerencia Municipal de Atención a las Personas con Discapacidad (OMAPED)', false, false),
    (12, 60, 'Subgerencia de CIAM', false, false),
    (12, 70, 'Subgerencia de Educación, Cultura y Deporte', false, false),
    (12, 80, 'Otra subárea', false, true),
    (13, 10, 'Subgerencia de Limpieza, Parques y Jardines', false, false),
    (13, 20, 'Subgerencia de Seguridad Ciudadana y Serenazgo', false, false),
    (13, 30, 'Subgerencia de Área Técnica Municipal', false, false),
    (13, 40, 'Subgerencia de Policía Municipal', false, false),
    (13, 50, 'Subgerencia de Evaluación y Fiscalización Ambiental', false, false),
    (13, 60, 'Subgerencia de Transporte y Seguridad Vial', false, false),
    (13, 70, 'Subgerencia de Servicios Municipales', false, false),
    (13, 80, 'Otra subárea', false, true),
    (14, 10, 'Subgerencia de Fiscalización', false, false),
    (14, 20, 'Subgerencia de Ejecución Coactiva', false, false),
    (14, 30, 'Subgerencia de Orientación, Registro y Recaudación Tributaria', false, false),
    (14, 40, 'Otra subárea', false, true),
    (15, 10, 'Subgerencia de Promoción de la Micro y Pequeña Empresa', false, false),
    (15, 20, 'Subgerencia de Desarrollo Agropecuario y Sanidad Animal', false, false),
    (15, 30, 'Otra subárea', false, true)
), numeradas AS (
  SELECT *, row_number() OVER (ORDER BY area_numero, orden) AS numero
  FROM subareas_datos
)
INSERT INTO public.subareas (
  id, id_area, nombre, nombre_corto, descripcion, es_otro,
  es_sin_subarea, activo, orden
)
SELECT
  ('20000000-0000-4000-8000-' || lpad(numero::text, 12, '0'))::uuid,
  ('10000000-0000-4000-8000-' || lpad(area_numero::text, 12, '0'))::uuid,
  nombre,
  NULL,
  NULL,
  es_otro,
  es_sin_subarea,
  true,
  orden
FROM numeradas;

INSERT INTO public.categorias (
  id, nombre, descripcion, es_critico, es_otro, activo, orden
)
SELECT
  ('30000000-0000-4000-8000-' || lpad(numero::text, 12, '0'))::uuid,
  nombre,
  NULL,
  es_critico,
  es_otro,
  true,
  numero * 10
FROM (VALUES
  (1,  'Internet y red', false, false),
  (2,  'Computadora, laptop, periféricos y sistema operativo', false, false),
  (3,  'Impresora', false, false),
  (4,  'Escáner y digitalización', false, false),
  (5,  'Proyección, audio y videoconferencia', false, false),
  (6,  'Software, Microsoft Office y licenciamiento', false, false),
  (7,  'Carpetas compartidas, archivos y almacenamiento', false, false),
  (8,  'Seguridad informática', true, false),
  (9,  'SIGA', false, false),
  (10, 'SIAF', false, false),
  (11, 'Portal web y publicaciones institucionales', false, false),
  (12, 'Firma digital, certificados y DNI electrónico', false, false),
  (13, 'Cámaras de seguridad y videovigilancia', false, false),
  (14, 'Energía eléctrica, UPS y protección', false, false),
  (15, 'Mantenimiento preventivo', false, false),
  (16, 'Otro', false, true)
) AS datos(numero, nombre, es_critico, es_otro);

WITH tipos (categoria, posicion, nombre, prioridad, es_otro) AS (
  VALUES
    (1, 1, 'Internet lento', 'MEDIO', false),
    (1, 2, 'Sin acceso a internet en un equipo', 'ALTO', false),
    (1, 3, 'Toda un área sin internet', 'CRITICO', false),
    (1, 4, 'Conexión intermitente', 'ALTO', false),
    (1, 5, 'No conecta a la red cableada', 'MEDIO', false),
    (1, 6, 'No conecta al Wi-Fi', 'MEDIO', false),
    (1, 7, 'Wi-Fi con señal débil', 'MEDIO', false),
    (1, 8, 'Cable de red dañado o desconectado', 'MEDIO', false),
    (1, 9, 'No accede a una página o servicio específico', 'MEDIO', false),
    (1, 10, 'Solicitud de habilitación de punto de red', 'BAJO', false),
    (1, 11, 'Solicitud de acceso a Wi-Fi', 'BAJO', false),
    (1, 12, 'Configuración de red para equipo nuevo', 'BAJO', false),
    (1, 13, 'Otro problema', 'MEDIO', true),
    (2, 1, 'Equipo no enciende', 'ALTO', false),
    (2, 2, 'Equipo enciende, pero no inicia Windows', 'ALTO', false),
    (2, 3, 'Pantalla azul o error crítico del sistema', 'ALTO', false),
    (2, 4, 'Equipo lento', 'MEDIO', false),
    (2, 5, 'Equipo se congela o bloquea', 'ALTO', false),
    (2, 6, 'Equipo se reinicia inesperadamente', 'ALTO', false),
    (2, 7, 'Equipo se apaga inesperadamente', 'ALTO', false),
    (2, 8, 'Ruido anormal del equipo', 'MEDIO', false),
    (2, 9, 'Disco duro lleno', 'MEDIO', false),
    (2, 10, 'Error de disco duro o almacenamiento', 'ALTO', false),
    (2, 11, 'Fecha, hora o zona horaria incorrecta', 'BAJO', false),
    (2, 12, 'Dispositivo no reconocido', 'MEDIO', false),
    (2, 13, 'Puertos USB dañados o sin funcionamiento', 'MEDIO', false),
    (2, 14, 'No reconoce disco externo', 'MEDIO', false),
    (2, 15, 'Solicitud de formateo o reinstalación del sistema operativo', 'MEDIO', false),
    (2, 16, 'Solicitud de optimización del equipo', 'BAJO', false),
    (2, 17, 'Monitor no enciende', 'MEDIO', false),
    (2, 18, 'Monitor sin señal de video', 'ALTO', false),
    (2, 19, 'Imagen distorsionada, borrosa o parpadeante', 'MEDIO', false),
    (2, 20, 'Resolución de pantalla incorrecta', 'BAJO', false),
    (2, 21, 'Segundo monitor no detectado', 'MEDIO', false),
    (2, 22, 'Teclado no funciona', 'MEDIO', false),
    (2, 23, 'Mouse no funciona', 'MEDIO', false),
    (2, 24, 'Parlantes o audífonos sin sonido', 'MEDIO', false),
    (2, 25, 'Micrófono no funciona', 'MEDIO', false),
    (2, 26, 'Cámara web no funciona', 'MEDIO', false),
    (2, 27, 'Lector de tarjetas no funciona', 'MEDIO', false),
    (2, 28, 'Windows solicita activación', 'MEDIO', false),
    (2, 29, 'Error después de una actualización', 'ALTO', false),
    (2, 30, 'Escritorio o barra de tareas no responde', 'MEDIO', false),
    (2, 31, 'Explorador de archivos no responde', 'MEDIO', false),
    (2, 32, 'Perfil de usuario dañado', 'ALTO', false),
    (2, 33, 'Error al iniciar sesión en Windows', 'ALTO', false),
    (2, 34, 'Controlador o driver faltante', 'MEDIO', false),
    (2, 35, 'Idioma o teclado mal configurado', 'BAJO', false),
    (2, 36, 'Otro problema', 'MEDIO', true),
    (3, 1, 'Impresora no enciende', 'ALTO', false),
    (3, 2, 'No imprime', 'MEDIO', false),
    (3, 3, 'Impresora aparece desconectada', 'MEDIO', false),
    (3, 4, 'Impresora no es detectada por el equipo', 'MEDIO', false),
    (3, 5, 'Documento queda pendiente y no imprime', 'MEDIO', false),
    (3, 6, 'Atasco de papel', 'MEDIO', false),
    (3, 7, 'No jala papel', 'MEDIO', false),
    (3, 8, 'Impresión borrosa', 'BAJO', false),
    (3, 9, 'Impresión incompleta o cortada', 'MEDIO', false),
    (3, 10, 'Imprime con manchas o líneas', 'BAJO', false),
    (3, 11, 'Imprime símbolos o caracteres extraños', 'MEDIO', false),
    (3, 12, 'Imprime muy lento', 'BAJO', false),
    (3, 13, 'No imprime a doble cara', 'BAJO', false),
    (3, 14, 'Configuración incorrecta de tamaño de papel', 'BAJO', false),
    (3, 15, 'Falta tóner o tinta', 'MEDIO', false),
    (3, 16, 'Tóner o cartucho no reconocido', 'MEDIO', false),
    (3, 17, 'Mantenimiento requerido', 'MEDIO', false),
    (3, 18, 'Solicitud de instalación de impresora', 'BAJO', false),
    (3, 19, 'Solicitud de compartir impresora en red', 'BAJO', false),
    (3, 20, 'Otro problema', 'MEDIO', true),
    (4, 1, 'Escáner no enciende', 'MEDIO', false),
    (4, 2, 'No escanea', 'MEDIO', false),
    (4, 3, 'Escáner no es detectado', 'MEDIO', false),
    (4, 4, 'Documento escaneado borroso', 'BAJO', false),
    (4, 5, 'Documento escaneado incompleto', 'MEDIO', false),
    (4, 6, 'Escanea con líneas o manchas', 'BAJO', false),
    (4, 7, 'Atasco de documentos', 'MEDIO', false),
    (4, 8, 'No guarda el archivo escaneado', 'MEDIO', false),
    (4, 9, 'No escanea en formato PDF', 'BAJO', false),
    (4, 10, 'Solicitud de instalación o configuración', 'BAJO', false),
    (4, 11, 'Otro problema', 'MEDIO', true),
    (5, 1, 'Proyector no enciende', 'ALTO', false),
    (5, 2, 'Proyector sin señal', 'ALTO', false),
    (5, 3, 'Imagen del proyector borrosa o desalineada', 'MEDIO', false),
    (5, 4, 'Cable HDMI, VGA o adaptador no funciona', 'MEDIO', false),
    (5, 5, 'No se escucha el audio de la presentación', 'MEDIO', false),
    (5, 6, 'Parlantes de sala no funcionan', 'MEDIO', false),
    (5, 7, 'Micrófono de sala no funciona', 'MEDIO', false),
    (5, 8, 'Cámara de videoconferencia no funciona', 'ALTO', false),
    (5, 9, 'No se puede ingresar a una reunión virtual', 'MEDIO', false),
    (5, 10, 'No se puede compartir pantalla', 'MEDIO', false),
    (5, 11, 'Eco, ruido o audio entrecortado', 'MEDIO', false),
    (5, 12, 'Solicitud de instalación para reunión o evento', 'BAJO', false),
    (5, 13, 'Otro problema', 'MEDIO', true),
    (6, 1, 'Programa de Microsoft Office no abre', 'MEDIO', false),
    (6, 2, 'Office solicita activación', 'MEDIO', false),
    (6, 3, 'Excel se bloquea o funciona lento', 'MEDIO', false),
    (6, 4, 'No puede guardar documento', 'ALTO', false),
    (6, 5, 'Solicitud de instalación o activación de Office', 'BAJO', false),
    (6, 6, 'Solicitud de instalación de programa', 'BAJO', false),
    (6, 7, 'Solicitud de actualización de programa', 'BAJO', false),
    (6, 8, 'Programa no abre', 'MEDIO', false),
    (6, 9, 'Programa se cierra inesperadamente', 'MEDIO', false),
    (6, 10, 'Programa funciona lentamente', 'MEDIO', false),
    (6, 11, 'Error durante la instalación', 'MEDIO', false),
    (6, 12, 'Error durante la desinstalación', 'MEDIO', false),
    (6, 13, 'Programa incompatible con el equipo', 'MEDIO', false),
    (6, 14, 'Licencia vencida', 'ALTO', false),
    (6, 15, 'Programa solicita activación', 'MEDIO', false),
    (6, 16, 'Solicitud de desinstalación de software no autorizado', 'MEDIO', false),
    (6, 17, 'Otro problema', 'MEDIO', true),
    (7, 1, 'No puede acceder a carpeta compartida', 'ALTO', false),
    (7, 2, 'Carpeta compartida no aparece', 'ALTO', false),
    (7, 3, 'No puede guardar en carpeta compartida', 'ALTO', false),
    (7, 4, 'No puede modificar o eliminar archivo', 'MEDIO', false),
    (7, 5, 'Unidad de red desconectada', 'ALTO', false),
    (7, 6, 'Solicitud de creación de carpeta compartida', 'BAJO', false),
    (7, 7, 'Solicitud de permisos sobre carpeta', 'MEDIO', false),
    (7, 8, 'Otro problema', 'MEDIO', true),
    (8, 1, 'Posible virus o malware', 'CRITICO', false),
    (8, 2, 'Equipo muestra ventanas o publicidad sospechosa', 'ALTO', false),
    (8, 3, 'Antivirus desactivado o con alerta', 'ALTO', false),
    (8, 4, 'Correo, enlace o archivo sospechoso', 'CRITICO', false),
    (8, 5, 'Acceso no autorizado a una cuenta', 'CRITICO', false),
    (8, 6, 'Memoria USB posiblemente infectada', 'ALTO', false),
    (8, 7, 'Programa no autorizado detectado', 'ALTO', false),
    (8, 8, 'Bloqueo por ransomware', 'CRITICO', false),
    (8, 9, 'Página web institucional alterada', 'CRITICO', false),
    (8, 10, 'Solicitud de análisis de equipo', 'MEDIO', false),
    (8, 11, 'Otro problema', 'CRITICO', true),
    (9, 1, 'No puede ingresar a SIGA', 'ALTO', false),
    (9, 2, 'Usuario de SIGA bloqueado', 'ALTO', false),
    (9, 3, 'Contraseña de SIGA vencida u olvidada', 'MEDIO', false),
    (9, 4, 'SIGA no abre', 'ALTO', false),
    (9, 5, 'SIGA funciona lentamente', 'MEDIO', false),
    (9, 6, 'Error durante una operación en SIGA', 'ALTO', false),
    (9, 7, 'No puede registrar información', 'ALTO', false),
    (9, 8, 'No puede modificar o eliminar registro', 'ALTO', false),
    (9, 9, 'No puede generar reporte', 'MEDIO', false),
    (9, 10, 'Reporte muestra información incorrecta', 'ALTO', false),
    (9, 11, 'No puede imprimir desde SIGA', 'MEDIO', false),
    (9, 12, 'Error de conexión con base de datos', 'CRITICO', false),
    (9, 13, 'Catálogo o tabla de SIGA desactualizada', 'ALTO', false),
    (9, 14, 'Solicitud de instalación o configuración de SIGA', 'BAJO', false),
    (9, 15, 'Solicitud de creación o modificación de acceso', 'MEDIO', false),
    (9, 16, 'Otro problema', 'MEDIO', true),
    (10, 1, 'No puede ingresar a SIAF', 'ALTO', false),
    (10, 2, 'Usuario de SIAF bloqueado', 'ALTO', false),
    (10, 3, 'Contraseña de SIAF vencida u olvidada', 'MEDIO', false),
    (10, 4, 'SIAF no abre', 'ALTO', false),
    (10, 5, 'SIAF funciona lentamente', 'MEDIO', false),
    (10, 6, 'Error durante una operación en SIAF', 'ALTO', false),
    (10, 7, 'No puede registrar operación', 'ALTO', false),
    (10, 8, 'No puede transmitir información', 'CRITICO', false),
    (10, 9, 'Transmisión rechazada', 'ALTO', false),
    (10, 10, 'No puede recibir información', 'ALTO', false),
    (10, 11, 'Error de conexión con servidor', 'CRITICO', false),
    (10, 12, 'No puede generar reporte', 'MEDIO', false),
    (10, 13, 'Reporte muestra información incorrecta', 'ALTO', false),
    (10, 14, 'No puede imprimir desde SIAF', 'MEDIO', false),
    (10, 15, 'Solicitud de instalación o configuración de SIAF', 'BAJO', false),
    (10, 16, 'Solicitud de creación o modificación de acceso', 'MEDIO', false),
    (10, 17, 'Otro problema', 'MEDIO', true),
    (11, 1, 'Portal web institucional no disponible', 'CRITICO', false),
    (11, 2, 'Página carga lentamente', 'MEDIO', false),
    (11, 3, 'Sección del portal muestra error', 'ALTO', false),
    (11, 4, 'Información publicada no aparece', 'ALTO', false),
    (11, 5, 'Documento publicado no abre', 'MEDIO', false),
    (11, 6, 'Enlace roto o incorrecto', 'MEDIO', false),
    (11, 7, 'Imagen o archivo no carga', 'MEDIO', false),
    (11, 8, 'Solicitud de actualización de contenido', 'BAJO', false),
    (11, 9, 'Solicitud de publicación en Portal de Transparencia', 'MEDIO', false),
    (11, 10, 'Contenido institucional incorrecto', 'ALTO', false),
    (11, 11, 'Posible alteración no autorizada del portal', 'CRITICO', false),
    (11, 12, 'Otro problema', 'MEDIO', true),
    (12, 1, 'Certificado digital no es reconocido', 'ALTO', false),
    (12, 2, 'Certificado digital vencido', 'ALTO', false),
    (12, 3, 'Firma digital no se genera', 'ALTO', false),
    (12, 4, 'Firma aparece como inválida', 'ALTO', false),
    (12, 5, 'Lector de DNI electrónico no funciona', 'ALTO', false),
    (12, 6, 'DNI electrónico no es reconocido', 'ALTO', false),
    (12, 7, 'PIN bloqueado u olvidado', 'ALTO', false),
    (12, 8, 'Software de firma no abre', 'ALTO', false),
    (12, 9, 'Error al firmar documento PDF', 'ALTO', false),
    (12, 10, 'No puede validar una firma digital', 'MEDIO', false),
    (12, 11, 'Solicitud de instalación o configuración', 'BAJO', false),
    (12, 12, 'Firma o certificado digital no funciona', 'ALTO', false),
    (12, 13, 'Otro problema', 'ALTO', true),
    (13, 1, 'Cámara no muestra imagen', 'ALTO', false),
    (13, 2, 'Cámara fuera de línea', 'ALTO', false),
    (13, 3, 'Imagen borrosa, oscura o distorsionada', 'MEDIO', false),
    (13, 4, 'Cámara no graba', 'CRITICO', false),
    (13, 5, 'Grabaciones no se pueden consultar', 'CRITICO', false),
    (13, 6, 'Grabaciones se perdieron o no aparecen', 'CRITICO', false),
    (13, 7, 'NVR o DVR no enciende', 'CRITICO', false),
    (13, 8, 'Disco de grabación lleno o con fallas', 'CRITICO', false),
    (13, 9, 'Fecha y hora de grabación incorrectas', 'ALTO', false),
    (13, 10, 'No se puede visualizar desde central de monitoreo', 'CRITICO', false),
    (13, 11, 'Monitor de videovigilancia no funciona', 'ALTO', false),
    (13, 12, 'Solicitud de revisión o extracción de grabación', 'ALTO', false),
    (13, 13, 'Solicitud de instalación o reubicación de cámara', 'BAJO', false),
    (13, 14, 'Otro problema', 'ALTO', true),
    (14, 1, 'Equipo sin energía eléctrica', 'ALTO', false),
    (14, 2, 'Tomacorriente no funciona', 'ALTO', false),
    (14, 3, 'UPS no enciende', 'ALTO', false),
    (14, 4, 'UPS emite alarma', 'ALTO', false),
    (14, 5, 'UPS no mantiene encendidos los equipos', 'CRITICO', false),
    (14, 6, 'Regulador o estabilizador no funciona', 'ALTO', false),
    (14, 7, 'Solicitud de instalación o cambio de UPS', 'BAJO', false),
    (14, 8, 'Solicitud de revisión de protección eléctrica', 'MEDIO', false),
    (14, 9, 'Otro problema', 'ALTO', true),
    (15, 1, 'Limpieza interna de computadora', 'BAJO', false),
    (15, 2, 'Limpieza y revisión de laptop', 'BAJO', false),
    (15, 3, 'Mantenimiento preventivo de impresora', 'BAJO', false),
    (15, 4, 'Mantenimiento preventivo de escáner', 'BAJO', false),
    (15, 5, 'Revisión de cableado y punto de red', 'BAJO', false),
    (15, 6, 'Actualización de sistema operativo', 'BAJO', false),
    (15, 7, 'Actualización de antivirus', 'BAJO', false),
    (15, 8, 'Actualización de programas', 'BAJO', false),
    (15, 9, 'Revisión de UPS y protección eléctrica', 'BAJO', false),
    (15, 10, 'Otro problema', 'MEDIO', true),
    (16, 1, 'Otro problema', 'MEDIO', true)
), numerados AS (
  SELECT *, row_number() OVER (ORDER BY categoria, posicion) AS numero
  FROM tipos
)
INSERT INTO public.ticket_tipos_problemas (
  id, id_categoria, nombre, descripcion, prioridad, es_otro, activo, orden
)
SELECT
  ('40000000-0000-4000-8000-' || lpad(numero::text, 12, '0'))::uuid,
  ('30000000-0000-4000-8000-' || lpad(categoria::text, 12, '0'))::uuid,
  nombre,
  NULL,
  prioridad::public.prioridad_ticket,
  es_otro,
  true,
  posicion * 10
FROM numerados;

-- Cuenta ADMIN solo para desarrollo local. DNI/email: 12345678 / 12345678@mdsj.com.
-- Password temporal local: 12345678. Debe cambiarse al primer ingreso.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token,
  email_change_token_new, email_change, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  '12345678@mdsj.com',
  extensions.crypt('12345678', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"dni":"12345678","nombres":"Administrador","apellidos":"MDSJ"}'::jsonb,
  '', '', '', '', now(), now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

INSERT INTO public.perfiles (
  id, dni, nombres, apellidos, rol, estado, debe_cambiar_password
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  '12345678',
  'Administrador',
  'MDSJ',
  'ADMIN',
  'ACTIVO',
  true
)
ON CONFLICT (id) DO UPDATE SET
  dni = EXCLUDED.dni,
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  rol = EXCLUDED.rol,
  estado = EXCLUDED.estado,
  debe_cambiar_password = EXCLUDED.debe_cambiar_password;

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, created_at, updated_at
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '{"sub":"00000000-0000-4000-8000-000000000001","email":"12345678@mdsj.com","email_verified":true,"phone_verified":false}'::jsonb,
  'email',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  identity_data = EXCLUDED.identity_data,
  updated_at = now();

DO $$
BEGIN
  IF (SELECT count(*) FROM public.areas) <> 15 THEN
    RAISE EXCEPTION 'Se esperaban exactamente 15 areas';
  END IF;
  IF (SELECT count(*) FROM public.subareas) <> 64 THEN
    RAISE EXCEPTION 'Se esperaban exactamente 64 subareas';
  END IF;
  IF (SELECT count(*) FROM public.categorias) <> 16 THEN
    RAISE EXCEPTION 'Se esperaban exactamente 16 categorias';
  END IF;
  IF (SELECT count(*) FROM public.ticket_tipos_problemas) <> 221 THEN
    RAISE EXCEPTION 'Se esperaban exactamente 221 tipos de problema';
  END IF;
  IF (SELECT count(*) FROM public.subareas WHERE es_sin_subarea) <> 6 THEN
    RAISE EXCEPTION 'Se esperaban exactamente 6 subareas tecnicas Sin subarea';
  END IF;
  IF (SELECT count(*) FROM public.subareas WHERE es_otro) <> 15 THEN
    RAISE EXCEPTION 'Se esperaban exactamente 15 subareas Otra subarea';
  END IF;
  IF (SELECT count(*) FROM public.categorias WHERE es_otro) <> 1 THEN
    RAISE EXCEPTION 'Se esperaba exactamente una categoria Otro';
  END IF;
  IF EXISTS (
    SELECT categoria.id
    FROM public.categorias categoria
    LEFT JOIN public.ticket_tipos_problemas tipo
      ON tipo.id_categoria = categoria.id AND tipo.es_otro
    GROUP BY categoria.id
    HAVING count(tipo.id) <> 1
  ) THEN
    RAISE EXCEPTION 'Cada categoria debe tener exactamente un tipo Otro problema';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.areas area
    WHERE NOT EXISTS (
      SELECT 1 FROM public.subareas subarea
      WHERE subarea.id_area = area.id AND subarea.activo
    )
  ) THEN
    RAISE EXCEPTION 'Toda area debe tener al menos una subarea activa';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.categorias categoria
    WHERE NOT EXISTS (
      SELECT 1 FROM public.ticket_tipos_problemas tipo
      WHERE tipo.id_categoria = categoria.id AND tipo.activo
    )
  ) THEN
    RAISE EXCEPTION 'Toda categoria debe tener al menos un tipo activo';
  END IF;
  IF EXISTS (
    SELECT lower(btrim(nombre)) FROM public.areas
    GROUP BY lower(btrim(nombre)) HAVING count(*) > 1
  ) OR EXISTS (
    SELECT lower(btrim(nombre)) FROM public.categorias
    GROUP BY lower(btrim(nombre)) HAVING count(*) > 1
  ) OR EXISTS (
    SELECT id_area, lower(btrim(nombre)) FROM public.subareas
    GROUP BY id_area, lower(btrim(nombre)) HAVING count(*) > 1
  ) OR EXISTS (
    SELECT id_categoria, lower(btrim(nombre))
    FROM public.ticket_tipos_problemas
    GROUP BY id_categoria, lower(btrim(nombre)) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existen nombres normalizados duplicados';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.subareas subarea
    JOIN public.areas area ON area.id = subarea.id_area
    WHERE subarea.activo AND NOT area.activo
  ) OR EXISTS (
    SELECT 1 FROM public.ticket_tipos_problemas tipo
    JOIN public.categorias categoria ON categoria.id = tipo.id_categoria
    WHERE tipo.activo AND NOT categoria.activo
  ) THEN
    RAISE EXCEPTION 'Existe un hijo activo bajo un padre inactivo';
  END IF;
END;
$$;

COMMIT;
