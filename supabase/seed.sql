-- Catálogos reproducibles para desarrollo y para el primer despliegue.
INSERT INTO
  public.areas (
    id,
    nombre,
    nombre_corto,
    piso,
    referencia,
    es_otro
  )
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'Alcaldía',
    'ALC',
    2,
    'Despacho de Alcaldía',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Gerencia Municipal',
    'GM',
    2,
    'Oficina de Gerencia Municipal',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Secretaría General',
    'SG',
    1,
    'Secretaría General',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Unidad de Informática',
    'UI',
    2,
    'Soporte y sistemas',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'Recursos Humanos',
    'RRHH',
    2,
    'Gestión de personal',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'Tesorería',
    'TES',
    1,
    'Oficina de Tesorería',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    'Contabilidad',
    'CONT',
    1,
    'Oficina de Contabilidad',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000008',
    'Logística y Abastecimiento',
    'LOG',
    1,
    'Oficina de Logística',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000009',
    'Presupuesto',
    'PRES',
    2,
    'Oficina de Presupuesto',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000010',
    'Rentas',
    'REN',
    1,
    'Atención tributaria',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000011',
    'Trámite Documentario',
    'TD',
    1,
    'Mesa de partes',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000012',
    'Otro',
    'OTRO',
    NULL,
    'Otra área municipal',
    true
  ) ON CONFLICT (id) DO
UPDATE
SET
  nombre = EXCLUDED.nombre,
  nombre_corto = EXCLUDED.nombre_corto,
  piso = EXCLUDED.piso,
  referencia = EXCLUDED.referencia,
  es_otro = EXCLUDED.es_otro,
  activo = true;

INSERT INTO
  public.subareas (
    id,
    id_area,
    nombre,
    nombre_corto,
    descripcion,
    es_otro
  )
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'Unidad de Trámite Documentario',
    'UTD',
    'Recepción y seguimiento de documentos.',
    false
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    'Unidad de Archivo Central',
    'UAC',
    'Custodia y administración del archivo central.',
    false
  ),
  (
    '20000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000001',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000102',
    '10000000-0000-4000-8000-000000000002',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000103',
    '10000000-0000-4000-8000-000000000003',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000104',
    '10000000-0000-4000-8000-000000000004',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000105',
    '10000000-0000-4000-8000-000000000005',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000106',
    '10000000-0000-4000-8000-000000000006',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000107',
    '10000000-0000-4000-8000-000000000007',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000108',
    '10000000-0000-4000-8000-000000000008',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000109',
    '10000000-0000-4000-8000-000000000009',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000110',
    '10000000-0000-4000-8000-000000000010',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000111',
    '10000000-0000-4000-8000-000000000011',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000112',
    '10000000-0000-4000-8000-000000000012',
    'Otra subárea',
    'OTRA',
    'Unidad no incluida en el catálogo.',
    true
  ) ON CONFLICT (id) DO
UPDATE
SET
  id_area = EXCLUDED.id_area,
  nombre = EXCLUDED.nombre,
  nombre_corto = EXCLUDED.nombre_corto,
  descripcion = EXCLUDED.descripcion,
  es_otro = EXCLUDED.es_otro,
  activo = true;

INSERT INTO
  public.categorias (id, nombre, descripcion, es_critico, es_otro)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    'Internet y red',
    'Conectividad, acceso a internet, red cableada o Wi-Fi.',
    false,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'Computadora o laptop',
    'Problemas de encendido, lentitud, bloqueos o periféricos.',
    false,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'Impresora',
    'Impresión, cola de trabajos, papel, tóner o conexión.',
    false,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    'Escáner',
    'Digitalización de documentos y conexión del escáner.',
    false,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    'SIGA',
    'Acceso y operación del Sistema Integrado de Gestión Administrativa.',
    false,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    'SIAF',
    'Acceso y operación del Sistema Integrado de Administración Financiera.',
    false,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    'Acceso o contraseña',
    'Credenciales, bloqueo de usuario o permisos.',
    false,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000008',
    'Instalación de programas',
    'Solicitud o problema de instalación de software autorizado.',
    false,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000009',
    'Seguridad informática',
    'Virus, correo sospechoso, acceso no autorizado o pérdida de información.',
    true,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000010',
    'Otro',
    'Problema no incluido en las categorías disponibles.',
    false,
    true
  ) ON CONFLICT (id) DO
UPDATE
SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  es_critico = EXCLUDED.es_critico,
  es_otro = EXCLUDED.es_otro,
  activo = true;

INSERT INTO
  public.ticket_tipos_problemas (
    id,
    id_categoria,
    nombre,
    descripcion,
    prioridad,
    es_otro
  )
VALUES
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Internet lento',
    'La conexión funciona con lentitud.',
    'MEDIO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    'Sin acceso a internet',
    'El usuario o equipo no tiene conexión.',
    'ALTO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    'Toda el área sin internet',
    'La conectividad está interrumpida para toda el área.',
    'CRITICO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000001',
    'Otro problema',
    'Otro problema de internet o red.',
    'MEDIO',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000011',
    '30000000-0000-4000-8000-000000000002',
    'Equipo no enciende',
    'La computadora o laptop no enciende.',
    'ALTO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000012',
    '30000000-0000-4000-8000-000000000002',
    'Equipo lento',
    'El equipo presenta lentitud durante el uso.',
    'MEDIO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000013',
    '30000000-0000-4000-8000-000000000002',
    'Equipo se reinicia o bloquea',
    'El equipo se reinicia, congela o muestra errores.',
    'ALTO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000014',
    '30000000-0000-4000-8000-000000000002',
    'Otro problema',
    'Otro problema de computadora o laptop.',
    'MEDIO',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000021',
    '30000000-0000-4000-8000-000000000003',
    'No imprime',
    'La impresora no genera documentos.',
    'MEDIO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000022',
    '30000000-0000-4000-8000-000000000003',
    'Atasco de papel',
    'La impresora reporta papel atascado.',
    'MEDIO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000023',
    '30000000-0000-4000-8000-000000000003',
    'Impresión borrosa o incompleta',
    'La calidad de impresión no es correcta.',
    'BAJO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000024',
    '30000000-0000-4000-8000-000000000003',
    'Sin tóner o tinta',
    'La impresora requiere consumibles.',
    'MEDIO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000025',
    '30000000-0000-4000-8000-000000000003',
    'Impresora desconectada',
    'El equipo no detecta la impresora.',
    'MEDIO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000026',
    '30000000-0000-4000-8000-000000000003',
    'Otro problema',
    'Otro problema de impresora.',
    'MEDIO',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000031',
    '30000000-0000-4000-8000-000000000004',
    'No escanea',
    'El escáner no digitaliza documentos.',
    'MEDIO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000032',
    '30000000-0000-4000-8000-000000000004',
    'Otro problema',
    'Otro problema de escáner.',
    'MEDIO',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000041',
    '30000000-0000-4000-8000-000000000005',
    'No puedo ingresar a SIGA',
    'El sistema rechaza o no permite el ingreso.',
    'ALTO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000042',
    '30000000-0000-4000-8000-000000000005',
    'Error durante una operación en SIGA',
    'SIGA muestra un error al procesar información.',
    'ALTO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000043',
    '30000000-0000-4000-8000-000000000005',
    'Otro problema',
    'Otro problema de SIGA.',
    'MEDIO',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000051',
    '30000000-0000-4000-8000-000000000006',
    'No puedo ingresar a SIAF',
    'El sistema rechaza o no permite el ingreso.',
    'ALTO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000052',
    '30000000-0000-4000-8000-000000000006',
    'Error durante una operación en SIAF',
    'SIAF muestra un error al procesar información.',
    'ALTO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000053',
    '30000000-0000-4000-8000-000000000006',
    'Otro problema',
    'Otro problema de SIAF.',
    'MEDIO',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000061',
    '30000000-0000-4000-8000-000000000007',
    'Olvidé mi contraseña',
    'El usuario necesita recuperar sus credenciales.',
    'MEDIO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000062',
    '30000000-0000-4000-8000-000000000007',
    'Usuario bloqueado o sin permisos',
    'La cuenta está bloqueada o no tiene acceso suficiente.',
    'ALTO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000063',
    '30000000-0000-4000-8000-000000000007',
    'Otro problema',
    'Otro problema de acceso o contraseña.',
    'MEDIO',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000071',
    '30000000-0000-4000-8000-000000000008',
    'Instalar programa autorizado',
    'Se requiere instalar software para las funciones del usuario.',
    'BAJO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000072',
    '30000000-0000-4000-8000-000000000008',
    'Otro problema',
    'Otro problema de instalación de programas.',
    'MEDIO',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000081',
    '30000000-0000-4000-8000-000000000009',
    'Posible virus o malware',
    'El equipo presenta señales de software malicioso.',
    'CRITICO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000082',
    '30000000-0000-4000-8000-000000000009',
    'Correo o enlace sospechoso',
    'Se recibió contenido posiblemente fraudulento.',
    'CRITICO',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000083',
    '30000000-0000-4000-8000-000000000009',
    'Otro problema',
    'Otro incidente de seguridad informática.',
    'CRITICO',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000091',
    '30000000-0000-4000-8000-000000000010',
    'Otro problema',
    'Problema no incluido en los tipos disponibles.',
    'MEDIO',
    true
  ) ON CONFLICT (id) DO
UPDATE
SET
  id_categoria = EXCLUDED.id_categoria,
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  prioridad = EXCLUDED.prioridad,
  es_otro = EXCLUDED.es_otro,
  activo = true;