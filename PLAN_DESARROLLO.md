# Plan de desarrollo de la Mesa de Soporte MDSJ

> Documento vivo para organizar el desarrollo de la aplicación módulo por módulo.
>
> Última revisión del código y de la carpeta `db`: 18 de julio de 2026.

## 1. Objetivo de la aplicación

Construir una mesa de soporte interna para MDSJ que permita:

- A los solicitantes registrar incidencias, adjuntar evidencias y seguir su atención.
- Al personal de apoyo revisar la cola, asignar, atender y resolver tickets.
- A los administradores gestionar usuarios y catálogos operativos.
- Mantener seguridad por rol, trazabilidad e historial de cada ticket.
- Funcionar correctamente en teléfonos, tablets y computadoras.

La aplicación se desarrollará con enfoque **mobile-first**. La versión móvil no será una versión reducida: tendrá todos los flujos esenciales. En escritorio se aprovechará el espacio adicional con navegación lateral, filtros visibles, tablas o listas densas y paneles de detalle.

---

## 2. Estado actual verificado

### 2.1 Tecnologías instaladas

| Capa                | Tecnología                                    |
| ------------------- | --------------------------------------------- |
| Frontend            | React 19, TypeScript 6 y Vite 8               |
| Rutas               | React Router 7                                |
| Formularios         | React Hook Form y Zod                         |
| Estado del servidor | TanStack React Query                          |
| Estado local        | Zustand                                       |
| UI                  | Tailwind CSS 4 y daisyUI 5                    |
| Iconos y mensajes   | Lucide React y Sonner                         |
| Backend             | Supabase Auth, PostgreSQL, Data API y Storage |
| Gestor de paquetes  | Bun                                           |

### 2.2 Funcionalidad que ya existe

- Página de inicio de sesión por DNI y contraseña.
- Página de registro con DNI, nombres, apellidos y teléfono.
- Validaciones con Zod.
- Inicio de sesión con Supabase Auth.
- Creación automática del perfil mediante trigger de base de datos.
- Persistencia local básica del perfil con Zustand.
- Guards básicos para invitados y usuarios autenticados.
- Redirección teórica según rol.
- Selector de tema persistente.
- Carga diferida de páginas.
- Página 404.
- Estructura inicial por capas: `application`, `infrastructure`, `presentation`, `services` y `shared`.

### 2.3 Funcionalidad que todavía es placeholder

- Las páginas iniciales por rol y todos los destinos del app shell ya existen, pero todavía no contienen los módulos de negocio.
- Los layouts autenticados comparten header, sidebar de escritorio y drawer móvil.
- `RoleGuard` ya protege solicitante, apoyo y administración.
- Ya existen las rutas funcionales iniciales de solicitante, apoyo y administración.
- Ya existen creación, listado y detalle del solicitante con historial, resolución y metadatos de archivos.

### 2.4 ¿El módulo Auth está casi listo?

**La interfaz de login y registro está avanzada, pero el módulo Auth completo todavía no está listo para producción.**

| Parte de Auth                             | Estado              |
| ----------------------------------------- | ------------------- |
| Formulario de login                       | Hecho               |
| Formulario de registro                    | Hecho               |
| Validaciones                              | Hecho               |
| Login con Supabase                        | Hecho               |
| Trigger para crear perfil                 | Hecho en SQL        |
| Logout visual                             | Hecho en `UserMenu` |
| Logout real con `supabase.auth.signOut()` | Hecho               |
| Restauración y validación de sesión       | Hecho               |
| Listener `onAuthStateChange`              | Hecho               |
| Sincronización perfil/sesión              | Hecho               |
| Guard por rol                             | Hecho               |
| Rutas de apoyo y admin                    | Hechas              |
| Cambio de contraseña                      | Falta               |
| Recuperación de contraseña                | No se implementará  |
| Contraseña elegida por el usuario         | Hecho               |
| Cierre ante perfil inválido               | Hecho               |

La sesión de Supabase es ahora la fuente de verdad. Zustand mantiene el perfil global para los componentes, pero solo se marca autenticado después de validar la sesión y consultar el perfil.

### 2.5 Estado responsive actual

- Login, registro y 404 tienen una base responsive con clases `sm:` y `lg:`.
- Los formularios parten de una sola columna y el registro pasa a dos columnas en pantallas mayores.
- Los tres layouts autenticados comparten app shell, header, sidebar, drawer móvil y `UserMenu`.
- Todavía faltan tarjetas de ticket, tablas adaptativas y filtros responsive de los módulos de negocio.

---

## 3. Mapa actual de la base de datos

El archivo principal es `db/database.sql`. La base se administrará manualmente desde el SQL Editor de Supabase. No se crearán migraciones, versionado de esquema ni cambios automáticos desde la aplicación.

### 3.1 Roles

| Rol           | Responsabilidad                                                  |
| ------------- | ---------------------------------------------------------------- |
| `SOLICITANTE` | Crear y consultar sus tickets; confirmar o rechazar una solución |
| `APOYO`       | Ver la cola, asignar, atender y resolver tickets                 |
| `ADMIN`       | Todo lo anterior y administración de usuarios y catálogos        |

### 3.2 Estados principales

**Perfil:** `ACTIVO`, `INACTIVO`, `BLOQUEADO`.

**Ticket:** `NUEVO`, `ASIGNADO`, `EN_CURSO`, `RESUELTO`, `CERRADO`, `CANCELADO`, `REABIERTO`.

**Prioridad:** `BAJO`, `MEDIO`, `ALTO`, `CRITICO`.

**Impacto:** `INDIVIDUAL`, `USUARIOS_MULTIPLES`, `TODA_EL_AREA`, `SERVICIO_INTERRUMPIDO`.

### 3.3 Tablas y propósito

| Tabla                    | Propósito                                                     |
| ------------------------ | ------------------------------------------------------------- |
| `areas`                  | Áreas y ubicaciones de la institución                         |
| `perfiles`               | Información de usuario, rol y estado vinculada a `auth.users` |
| `categorias`             | Categorías generales de soporte                               |
| `ticket_tipos_problemas` | Tipos de problema y prioridad base por categoría              |
| `tickets`                | Información central y estado de cada incidencia               |
| `ticket_archivos`        | Metadatos de imágenes asociadas a tickets                     |
| `ticket_historial`       | Auditoría de cambios del ticket                               |
| `ticket_resoluciones`    | Diagnóstico, solución y confirmación del solicitante          |

### 3.4 Relaciones principales

```text
auth.users 1 ----- 1 perfiles

categorias 1 ----- N ticket_tipos_problemas
areas      1 ----- N tickets
categorias 1 ----- N tickets
ticket_tipos_problemas 1 ----- N tickets

perfiles 1 ----- N tickets como solicitante
perfiles 1 ----- N tickets como personal asignado

tickets 1 ----- N ticket_archivos
tickets 1 ----- N ticket_historial
tickets 1 ----- 0..1 ticket_resoluciones
```

### 3.5 Lógica que ya está en PostgreSQL

- Creación automática del perfil después del registro en Auth.
- Generación de código `ST-AAAA-NNNNNN`.
- Cálculo de prioridad inicial.
- Validación de área, categoría y tipo de problema.
- Validación del personal asignado.
- Máquina de estados del ticket.
- Registro automático del historial.
- RPC `asignar_ticket`.
- RPC `cambiar_estado_ticket`.
- RPC `resolver_ticket`.
- RPC `confirmar_solucion_ticket`.
- RPC `reabrir_ticket`.
- RLS en las ocho tablas públicas.
- Bucket privado `ticket-archivos` para JPEG, PNG y WebP de hasta 5 MB.
- Seed inicial de áreas, categorías y tipos de problema.

### 3.6 Decisión de administración de base de datos

- La estructura actual de tablas, funciones, triggers, RLS y Storage se conserva sin cambios.
- `db/database.sql` y `db/auth_setup.sql` quedan como referencia del SQL aplicado.
- Cualquier ejecución o ajuste manual futuro se realizará exclusivamente en el SQL Editor de Supabase.
- La aplicación solo consumirá las tablas, RPC y políticas que ya existen.
- No se instalará Supabase CLI ni se crearán migraciones o versionado del esquema.
- Los roles y estados que no puedan modificarse con los permisos actuales se administrarán desde Supabase.
- La interfaz se adaptará al contrato SQL actual.

---

## 4. Arquitectura que mantendremos

La estructura existente es una buena base, pero se debe evitar que servicios de datos dependan de componentes o schemas de presentación.

```text
src/
  application/
    hooks/                 # Casos de uso consumidos por las páginas
    store/                 # Estado local mínimo y sesión
  infrastructure/
    config/                # React Query y configuración externa
    supabase/              # Cliente y tipos generados de Supabase
  presentation/
    components/            # Componentes realmente compartidos
    features/
      auth/
      requester/
      support/
      admin/
      tickets/
    guards/
    layouts/
    routes/
  services/
    auth.service.ts
    ticket.service.ts
    catalog.service.ts
    storage.service.ts
    profile.service.ts
  shared/
    interfaces/
    types/
    utils/
db/                        # Referencia del SQL administrado manualmente en Supabase
```

### Reglas de implementación

- Cada feature contendrá sus páginas, componentes específicos y schemas.
- Los componentes globales solo se extraerán cuando sean usados por más de un módulo.
- Las consultas y mutaciones remotas pasarán por servicios y hooks de React Query.
- Zustand no decidirá autorizaciones; Supabase Auth y RLS son la fuente de verdad.
- Los cambios de estado del ticket usarán las RPC, nunca un `UPDATE` directo.
- Los enums y tipos de base de datos se obtendrán de tipos generados.
- Cada página tendrá estados de carga, vacío, error, éxito y acceso denegado.
- Las páginas se cargarán de forma diferida desde el router.
- La autorización se aplicará en backend mediante RLS/RPC y en frontend mediante guards y navegación por rol.

---

## 5. Sistema responsive: mobile-first y escritorio

### 5.1 Breakpoints y comportamiento

- **Base, 320 px en adelante:** una columna, tarjetas, navegación compacta y acciones táctiles.
- **`sm`:** formularios que puedan usar dos columnas sin perder legibilidad.
- **`md`:** filtros en panel o drawer y mejor aprovechamiento en tablets.
- **`lg`:** sidebar persistente, contenido con ancho controlado y vistas más densas.
- **`xl` y superiores:** paneles de lista/detalle cuando aporten productividad; nunca estirar formularios de forma innecesaria.

### 5.2 Navegación por dispositivo

**Móvil:**

- Header compacto.
- Menú drawer o navegación inferior según la cantidad final de destinos.
- Acción principal visible, por ejemplo “Nuevo ticket”.
- Filtros dentro de drawer/modal.
- Tickets mostrados como tarjetas legibles.
- Acciones importantes con objetivos táctiles de al menos 44 px.

**Escritorio:**

- Sidebar persistente por rol.
- Header con usuario, rol, tema y logout.
- Listados en tabla o lista densa.
- Filtros visibles y combinables.
- Posible patrón maestro/detalle para apoyo.

### 5.3 Criterios responsive obligatorios

- [ ] Sin scroll horizontal desde 320 px.
- [ ] Ninguna funcionalidad esencial depende de hover.
- [ ] Tablas anchas se convierten en tarjetas o filas adaptadas en móvil.
- [ ] Formularios funcionan con teclado móvil y muestran el tipo de teclado adecuado.
- [ ] Botones y menús son utilizables con tacto y teclado.
- [ ] El contenido de escritorio tiene ancho máximo y líneas legibles.
- [ ] Los filtros permanecen disponibles en todos los breakpoints.
- [ ] Estado y prioridad no se comunican solo mediante color.
- [ ] Contraste, foco y navegación se verifican en los temas habilitados.

---

## 6. Orden general de desarrollo

No se comenzará por dashboards decorativos. El orden sigue las dependencias del producto:

1. Configuración de conexión y consumo de Supabase.
2. Cierre completo del módulo Auth.
3. App shell y navegación responsive por rol.
4. Catálogos de lectura.
5. Creación de tickets.
6. Mis tickets y detalle del solicitante.
7. Cola y operación del personal de apoyo.
8. Resolución, confirmación y reapertura.
9. Adjuntos privados.
10. Administración de catálogos.
11. Administración de perfiles.
12. Dashboard, métricas y reportes.
13. Notificaciones y módulos futuros aprobados.
14. Pruebas, seguridad, despliegue y observabilidad de producción.

---

## 7. Módulo 0: conexión y consumo de Supabase

**Objetivo:** consumir de forma consistente la base ya creada, sin modificar su estructura desde la aplicación.

### Paso a paso

- [x] Mantener el cliente Supabase con URL y publishable key.
- [ ] Documentar variables de entorno y configuración de Auth.
- [ ] Mantener interfaces TypeScript alineadas manualmente con los datos consumidos.
- [ ] Configurar Auth sin confirmación de correo para el email sintético.
- [ ] Documentar qué operaciones se hacen desde la app y cuáles desde SQL Editor.
- [ ] Probar desde la app las consultas y RPC existentes para cada rol.

### Terminado cuando

- La aplicación se conecta usando solo la publishable key.
- Ningún código de la app intenta crear o modificar el esquema.
- Cada servicio consume únicamente operaciones permitidas por el SQL actual.
- Las interfaces frontend representan los datos realmente devueltos por Supabase.

---

## 8. Módulo 1: autenticación y sesión

**Objetivo:** completar el módulo ya iniciado y dejar una sesión segura y coherente.

### 8.1 Decisiones adoptadas

- El usuario elige y confirma su contraseña durante el registro; el DNI ya no se usa como contraseña.
- No habrá recuperación de contraseña por correo ni ruta de recuperación.
- El correo sintético `{dni}@mdsj.com` se mantiene como identificador interno de Supabase Auth.
- Si un usuario olvida su contraseña, el acceso se resolverá manualmente fuera de la aplicación.
- La confirmación de correo debe estar desactivada para que el registro entregue una sesión inmediata.

### 8.2 Paso a paso

- [x] Corregir el registro para no usar DNI como contraseña.
- [x] Añadir campos de contraseña y confirmación.
- [x] Crear un inicializador de sesión con `getSession`/`getUser` y consulta del perfil.
- [x] Escuchar `onAuthStateChange` y sincronizar el estado de la app.
- [x] Añadir estado `initializing` para evitar redirecciones antes de restaurar la sesión.
- [x] Usar Zustand como perfil global sincronizado, sin tratar su persistencia como prueba de sesión válida.
- [x] Implementar logout con `supabase.auth.signOut()`.
- [x] Limpiar perfil local y caché de React Query al salir.
- [x] Crear la acción de logout dentro de `UserMenu`.
- [x] Redirigir a `/login` después de salir.
- [x] Implementar `RoleGuard`.
- [x] Corregir `AuthGuard` para exigir una sesión válida y un perfil válido.
- [x] Corregir `GuestGuard` para redirigir según el rol.
- [x] Crear rutas reales para `SOLICITANTE`, `APOYO` y `ADMIN`.
- [x] Cerrar sesión si el perfil no existe, está inactivo/bloqueado o tiene un rol inválido.
- [x] Unificar los mensajes conocidos de error de autenticación.
- [ ] Añadir cambio de contraseña desde perfil.
- [ ] Completar `autoComplete`, `aria-invalid`, `aria-describedby` y gestión de foco.

### 8.3 Rutas previstas

- `/login`
- `/register`.
- `/cambiar-password`.

### 8.4 Terminado cuando

- Una sesión válida sobrevive a una recarga.
- Una sesión expirada o revocada devuelve al login.
- Un perfil bloqueado/inactivo deja de operar.
- Logout cierra Supabase, limpia estado y limpia consultas privadas.
- Cada rol termina en una ruta existente.
- Las rutas directas están protegidas por sesión y rol.
- Ningún dato de autorización depende de `localStorage` manipulable.
- Hay pruebas de login, registro/alta, restauración, logout y acceso por rol.

---

## 9. Módulo 2: app shell y navegación responsive

**Objetivo:** construir el marco común que usarán los tres roles.

### Paso a paso

- [x] Diseñar `AppShell`, `AppHeader`, `Sidebar`, navegación móvil y `UserMenu`.
- [x] Mostrar nombre, rol y estado de sesión.
- [x] Integrar cambio de tema y logout dentro del shell.
- [x] Crear navegación específica por rol.
- [x] Añadir estado activo, títulos de página y breadcrumbs donde aporten contexto.
- [x] Crear `PageContainer`, `PageHeader`, `EmptyState`, `ErrorState` y skeletons.
- [x] Implementar `RequesterLayout`.
- [x] Implementar `SupportLayout`.
- [x] Implementar `AdminLayout`.
- [x] Mantener el shell mientras se cargan páginas lazy internas.

### Navegación inicial por rol

| Rol         | Destinos                                                                 |
| ----------- | ------------------------------------------------------------------------ |
| Solicitante | Inicio, nuevo ticket, mis tickets, perfil                                |
| Apoyo       | Resumen, cola de tickets, mis asignados, perfil                          |
| Admin       | Resumen, tickets, usuarios, áreas, categorías, tipos de problema, perfil |

### Terminado cuando

- Los tres roles tienen un destino funcional.
- La navegación móvil y la sidebar de escritorio muestran las mismas capacidades.
- La página activa se identifica visualmente y para lectores de pantalla.
- El contenido no salta ni queda oculto durante la restauración de sesión.
- No hay rutas rotas para `/`, `/apoyo` o `/admin`.

---

## 10. Módulo 3: catálogos de lectura

**Objetivo:** consumir áreas, categorías y tipos de problema activos para alimentar formularios y filtros.

### Paso a paso

- [x] Crear `catalog.service.ts`.
- [x] Crear query keys estables.
- [x] Consultar áreas activas ordenadas.
- [x] Consultar categorías activas ordenadas.
- [x] Consultar tipos activos por categoría.
- [x] Tipar respuestas con interfaces alineadas manualmente al esquema actual.
- [x] Implementar caché y reintento adecuados.
- [x] Crear estados de error y reintento.
- [x] Reiniciar el tipo de problema cuando cambie la categoría.

### Terminado cuando

- El solicitante solo recibe opciones activas.
- Apoyo y admin pueden ver opciones inactivas donde corresponda.
- No se pueden combinar categoría y tipo incompatibles.
- Los catálogos funcionan tanto en formularios móviles como en filtros de escritorio.

---

## 11. Módulo 4: creación de tickets

**Objetivo:** entregar el primer flujo completo de valor para el solicitante.

### Campos

- Área.
- Categoría.
- Tipo de problema opcional y dependiente de categoría.
- Asunto de 3 a 150 caracteres.
- Descripción de 5 a 3000 caracteres.
- Impacto.
- Indicador de trabajo detenido.
- La prioridad se calcula en backend y no será editable por el solicitante.

### Paso a paso

- [x] Crear tipos/payload de inserción.
- [x] Crear schema Zod alineado con restricciones SQL.
- [x] Crear `ticket.service.ts`.
- [x] Crear hook de mutación `useCreateTicket`.
- [x] Diseñar formulario por secciones y con textos comprensibles.
- [x] Cargar catálogos del módulo 3.
- [x] Impedir doble envío.
- [x] Mostrar errores de dominio sin perder los datos escritos.
- [x] Mostrar confirmación con código, prioridad y estado resultantes.
- [x] Redirigir al detalle del ticket creado.
- [x] Dejar la carga de imágenes para el módulo de adjuntos y crear primero el ticket.

### Ruta

- `/tickets/nuevo`.

### Terminado cuando

- El usuario autenticado siempre es el solicitante real.
- El backend genera código y prioridad.
- La validación frontend coincide con SQL.
- El formulario funciona a 320 px sin scroll horizontal.
- En escritorio el formulario mantiene un ancho de lectura cómodo.
- El éxito conduce a un detalle consultable después de recargar.

---

## 12. Módulo 5: mis tickets y detalle del solicitante

**Objetivo:** permitir seguimiento completo de los tickets propios.

### Lista

- Código y asunto.
- Estado y prioridad.
- Área y categoría.
- Fecha de creación y última actualización.
- Persona asignada cuando corresponda.
- Búsqueda por código/asunto.
- Filtros por estado, prioridad y fecha.
- Paginación desde el servidor.

### Detalle

- Información completa del ticket.
- Timeline del historial.
- Archivos asociados.
- Resolución cuando exista.
- Acciones permitidas según estado.

### Paso a paso

- [x] Crear query paginada de tickets propios.
- [x] Definir paginación estable; no cargar todos los tickets sin límite.
- [x] Crear `TicketCard` para móvil.
- [x] Crear lista/tabla más densa para escritorio.
- [x] Crear badges accesibles de estado y prioridad.
- [x] Crear página de detalle con consultas relacionadas.
- [x] Crear timeline del historial.
- [x] Resolver estados vacío, error, carga y acceso denegado.
- [x] Mantener filtros en URL cuando sea útil.

### Rutas

- `/tickets`.
- `/tickets/:ticketId`.

### Terminado cuando

- RLS garantiza que un solicitante solo ve sus tickets.
- Una URL directa funciona después de recargar.
- Un ticket ajeno no filtra información y muestra un estado seguro.
- Estado y prioridad incluyen texto/icono, no solo color.
- Móvil usa tarjetas; escritorio puede usar tabla/lista sin duplicar lógica de datos.

---

## 13. Módulo 6: cola y operación de apoyo

**Objetivo:** permitir que apoyo gestione el trabajo diario.

### Vistas

- Cola general.
- Mis tickets asignados.
- Tickets sin asignar.
- Tickets por estado y prioridad.
- Detalle operativo.

### Acciones

- Asignar o reasignar.
- Iniciar atención.
- Cambiar estado permitido.
- Cancelar cuando la transición lo permita.
- Registrar diagnóstico y solución.

### Paso a paso

- [x] Crear rutas y páginas de apoyo.
- [x] Crear consultas paginadas con filtros por estado, prioridad, área, categoría, asignado y fecha.
- [x] Definir orden operativo por prioridad descendente y antigüedad ascendente.
- [x] Crear selector de personal activo de apoyo.
- [x] Consumir `asignar_ticket`.
- [x] Consumir `cambiar_estado_ticket`.
- [x] Consumir `resolver_ticket`.
- [x] Mostrar solo acciones válidas para el estado actual.
- [x] Actualizar lista, detalle e historial después de cada mutación.
- [x] Manejar conflictos cuando otro usuario haya cambiado el ticket.
- [x] Añadir confirmación a acciones sensibles.
- [x] Mantener el permiso actual del backend: cualquier `APOYO` puede operar; la asignación no limita las RPC.

### Rutas

- `/apoyo`.
- `/apoyo/tickets`.
- `/apoyo/tickets/:ticketId`.

### Terminado cuando

- No existe un selector libre que permita transiciones inválidas.
- Todas las mutaciones operativas pasan por RPC.
- La cola es utilizable con tarjetas en móvil y vista densa en escritorio.
- Los filtros no desaparecen en móvil; se trasladan a un drawer/modal.
- Cambios concurrentes producen un mensaje claro y una recarga de datos.

---

## 14. Módulo 7: resolución, confirmación y reapertura

**Objetivo:** cerrar el ciclo de vida del ticket.

### Flujo de apoyo

- Registrar diagnóstico opcional.
- Registrar solución obligatoria.
- Cambiar ticket a `RESUELTO` mediante RPC.

### Flujo del solicitante

- Ver diagnóstico y solución.
- Confirmar que el problema fue resuelto y cerrar.
- Rechazar la solución con comentario y reabrir.

### Reapertura posterior

- Permitir reapertura de un ticket cerrado con motivo según reglas de negocio.

### Paso a paso

- [x] Corregir en `db/database.sql` los casos nulos y reglas pendientes de las RPC.
- [x] Aplicar manualmente en Supabase SQL Editor las funciones corregidas del Módulo 7.
- [x] Crear formulario de resolución.
- [x] Crear panel de confirmación para el solicitante.
- [x] Consumir `confirmar_solucion_ticket`.
- [x] Crear diálogo/formulario de reapertura.
- [x] Consumir `reabrir_ticket`.
- [x] Refrescar ticket, resolución e historial en conjunto.
- [x] Evitar envíos repetidos durante mutaciones.

### Terminado cuando

- Las acciones solo aparecen en estados válidos.
- El solicitante entiende la diferencia entre confirmar y reabrir.
- Estado, fechas, asignación, resolución e historial permanecen consistentes.
- Se preserva la trazabilidad requerida por MDSJ.

---

## 15. Módulo 8: adjuntos privados

**Objetivo:** permitir evidencias fotográficas seguras en los tickets.

### Alcance inicial

- JPEG, PNG y WebP.
- Máximo 5 MB por archivo.
- Bucket privado `ticket-archivos`.
- Ruta `{auth.uid()}/{ticketId}/{uuid}.{extension}`.
- Visualización mediante URL firmada temporal.

### Paso a paso

- [x] Definir en `db/database.sql` una política `DELETE` limitada a compensar cargas propias.
- [x] Aplicar manualmente la política de compensación en Supabase SQL Editor.
- [x] Crear `storage.service.ts`.
- [x] Validar tipo y tamaño antes de subir.
- [x] Permitir selección desde galería y cámara móvil.
- [x] Subir objeto al bucket privado.
- [x] Registrar metadata en `ticket_archivos`.
- [x] Compensar la operación si falla la subida o el registro de metadata.
- [x] Generar URLs firmadas al visualizar.
- [x] Crear preview, progreso, error por archivo y reintento.
- [x] Mantener archivos originales sin compresión para no degradar evidencia.

### Terminado cuando

- Un usuario no puede leer archivos de tickets ajenos.
- No se persisten URLs públicas o permanentes.
- Errores parciales no dejan objetos o metadata huérfanos sin tratamiento.
- La experiencia de cámara/galería funciona en móvil.
- No se ofrece eliminar hasta tener una política segura y consistente.

---

## 16. Módulo 9: administración de catálogos

**Objetivo:** administrar los datos que controlan creación y clasificación de tickets.

### Submódulos

- Áreas.
- Categorías.
- Tipos de problema.

### Paso a paso

- [x] Crear listados con búsqueda y estado activo/inactivo.
- [x] Crear formularios de alta y edición.
- [x] Gestionar piso y referencia de áreas.
- [x] Gestionar categoría crítica.
- [x] Gestionar prioridad base del tipo de problema.
- [x] Implementar activación/desactivación en lugar de borrado.
- [x] Invalidar cachés de catálogos después de cambios.
- [x] Confirmar antes de desactivar elementos usados por formularios.
- [x] Mostrar registros inactivos únicamente en contextos administrativos.

### Rutas

- `/admin/areas`.
- `/admin/categorias`.
- `/admin/tipos-problema`.

### Terminado cuando

- Solo `ADMIN` puede modificar catálogos.
- Las reglas de unicidad y relaciones se muestran con errores claros.
- Inactivar no rompe tickets históricos.
- Los formularios de solicitante reflejan cambios después de invalidar caché.

---

## 17. Módulo 10: administración de perfiles

**Objetivo:** gestionar usuarios, roles y estados.

### Paso a paso

- [x] Crear listado paginado de perfiles para consulta.
- [x] Buscar por DNI, nombres y apellidos.
- [x] Filtrar por rol y estado.
- [x] Mostrar rol y estado actuales en modo lectura.
- [x] Mantener cambios de rol, estado y acceso manualmente desde Supabase.

### Ruta

- `/admin/usuarios`.

### Terminado cuando

- Solo un admin autorizado puede consultar el directorio desde la app.
- Cambios de rol se reflejan después de refrescar sesión/perfil.
- Los datos personales se muestran solo a roles autorizados.

---

## 18. Módulo 11: dashboard y reportes

**Objetivo:** dar visibilidad operativa después de que los flujos transaccionales funcionen.

### Métricas iniciales posibles con el modelo actual

- Tickets por estado.
- Tickets por prioridad.
- Tickets nuevos y resueltos por periodo.
- Tickets sin asignar.
- Carga por personal de apoyo.
- Distribución por área y categoría.
- Tiempo entre creación, asignación, inicio y resolución.

### Definiciones implementadas

- **Creados:** tickets con `created_at` dentro del periodo seleccionado en `America/Lima`.
- **Resueltos:** tickets con `resolved_at` dentro del periodo, aunque hayan sido creados antes.
- **Activos:** fotografía actual de estados `NUEVO`, `ASIGNADO`, `EN_CURSO` y `REABIERTO`.
- **Sin asignar:** fotografía actual de tickets `NUEVO` o `REABIERTO` sin `asignado_a`.
- **Promedio para asignar:** horas entre creación y primera asignación para tickets creados en el periodo.
- **Promedio para resolver:** horas entre creación y resolución para tickets creados en el periodo.
- **Estado, prioridad, área y categoría:** distribución de tickets creados en el periodo.
- **Carga de apoyo:** fotografía actual de tickets `ASIGNADO`, `EN_CURSO` o `REABIERTO` por persona.
- **Tendencia diaria:** creados y resueltos por fecha local dentro del periodo.

### Paso a paso

- [x] Definir métricas operativas iniciales y documentar su alcance en el dashboard.
- [x] Usar zona horaria `America/Lima` y rangos inclusivos de hasta 366 días.
- [x] Crear RPC agregada; no descargar tickets para calcular en el navegador.
- [x] Usar `SECURITY INVOKER`, validación de rol y permisos explícitos.
- [x] Aplicar la RPC manualmente en Supabase SQL Editor y verificar su protección de acceso.
- [x] Crear resumen responsive con números, tendencias y tablas accesibles.
- [x] Añadir exportación agregada a PDF y XLSX solicitada para reportes.

### Terminado cuando

- Cada métrica tiene definición documentada.
- RLS/permiso evita exposición de datos a solicitantes.
- Las consultas agregadas son eficientes y paginadas cuando corresponde.
- Gráficos nunca son la única representación de la información.

---

## 19. Módulos futuros que requieren definición de backend

No deben implementarse solo porque parezcan útiles. Primero deben aprobarse y modelarse.

### Comentarios o conversación

El enum contiene `COMENTARIO`, pero no existe tabla ni RPC de comentarios.

- [ ] Definir autores permitidos.
- [ ] Definir si se comenta en tickets cerrados/cancelados.
- [ ] Definir longitud, edición y eliminación.
- [ ] Definir si admite adjuntos.
- [ ] Crear RLS/RPC antes de la interfaz.

### Notificaciones

- [ ] Definir eventos: creación, asignación, cambio de estado, resolución y reapertura.
- [ ] Definir canales: dentro de la app, email institucional u otro.
- [ ] Definir leído/no leído y preferencias.
- [ ] Evitar depender de un correo sintético inexistente.

### SLA y escalamiento

- [ ] Definir tiempos por prioridad.
- [ ] Definir horario laboral, feriados y pausas.
- [ ] Definir escalamiento y responsables.

### Otros módulos posibles

- Encuesta de satisfacción.
- Inventario de equipos/activos.
- Base de conocimiento.
- Etiquetas y tickets relacionados.
- Equipos o grupos de soporte.
- Auditoría administrativa completa.

---

## 20. Pruebas y calidad

Actualmente no existen pruebas automatizadas. Se incorporarán desde los primeros módulos críticos.

### Estrategia

- **Unitarias:** schemas, formatters, reglas de UI y utilidades.
- **Componentes:** formularios, estados, accesibilidad y acciones.
- **Integración:** hooks/servicios contra un entorno controlado.
- **Base de datos:** RLS, RPC, triggers y permisos para cada rol.
- **E2E:** login, creación, asignación, resolución, confirmación, reapertura y logout.

### Casos críticos mínimos

- [ ] Un solicitante no puede leer/modificar tickets ajenos.
- [ ] Apoyo no puede ejecutar operaciones administrativas.
- [ ] Solo admin modifica catálogos y perfiles.
- [ ] Transiciones inválidas fallan.
- [ ] Logout invalida la sesión real.
- [ ] Una cuenta bloqueada no opera con un token previo.
- [ ] Storage no entrega archivos de tickets ajenos.
- [ ] Formularios no hacen doble envío.
- [ ] Rutas por rol rechazan acceso directo.
- [ ] Flujos principales funcionan a 320 px y en escritorio.

### Comandos objetivo

```bash
bun run lint
bun run build
bun run test
bun run test:e2e
```

Los scripts `test` y `test:e2e` todavía deben agregarse.

---

## 21. Accesibilidad y experiencia de usuario

Cada módulo debe incluir:

- Labels asociados a todos los controles.
- `aria-invalid` y `aria-describedby` en errores.
- Foco visible y orden lógico de tabulación.
- Gestión de foco en modales, errores y cambios de página.
- Estados de carga anunciados.
- Confirmación para acciones irreversibles o sensibles.
- Mensajes en español claros y orientados a la acción.
- Estado y prioridad representados con texto, no solo colores.
- Contraste verificado en los temas habilitados.
- Respeto de `prefers-reduced-motion` si se añaden animaciones.

---

## 22. Rendimiento y manejo de datos

- Paginar tickets y perfiles desde el servidor.
- Seleccionar solo columnas necesarias.
- Evitar consultas N+1 en listas.
- Usar relaciones embebidas o consultas agrupadas cuando sean seguras.
- Mantener query keys consistentes.
- Invalidar únicamente los datos afectados.
- Usar índices existentes para filtros operativos.
- Añadir índices solo después de medir consultas reales.
- No calcular reportes grandes en el navegador.
- No montar React Query Devtools en producción.
- Mantener lazy loading por páginas y módulos.

---

## 23. Seguridad y privacidad

- Nunca exponer `service_role` en el frontend.
- Usar únicamente publishable key en el cliente.
- No confiar en `user_metadata` para autorizar; roles y estados permanecen en `perfiles`/datos controlados.
- Mantener RLS en todas las tablas expuestas.
- Combinar autenticación con autorización por fila.
- Tratar `SECURITY DEFINER` como API privilegiada y revocar permisos por defecto.
- Revocar sesiones o validar su vigencia en acciones sensibles.
- No almacenar más datos personales de los necesarios en `localStorage`.
- Usar URLs firmadas temporales para archivos privados.
- Registrar eventos administrativos sensibles si se requiere auditoría.
- Configurar protección contra abuso del registro y login.

---

## 24. Despliegue y operación

- [ ] Definir ambiente local, staging y producción.
- [ ] Separar proyectos/credenciales de Supabase por ambiente.
- [ ] Configurar fallback SPA para `createBrowserRouter`.
- [ ] Documentar variables de entorno en `.env.example`.
- [ ] Fijar versión soportada de Node/Bun.
- [ ] Crear pipeline de lint, build y tests.
- [ ] Configurar logs y monitoreo de errores.
- [ ] Definir backups y restauración de base de datos.
- [ ] Definir retención de archivos y datos personales.
- [ ] Crear checklist de publicación y rollback.

---

## 25. Definición global de terminado

Un módulo se considera terminado únicamente si:

- [ ] Cumple el flujo funcional completo, no solo el caso feliz.
- [ ] Tiene seguridad backend mediante RLS/RPC.
- [ ] Tiene protección y navegación frontend por rol.
- [ ] Maneja carga, vacío, error, éxito y acceso denegado.
- [ ] Funciona a 320 px, tablet y escritorio.
- [ ] Es operable con teclado y lector de pantalla.
- [ ] Tiene validaciones alineadas con la base de datos.
- [ ] Actualiza correctamente la caché después de mutaciones.
- [ ] Tiene pruebas del flujo crítico.
- [ ] Pasa lint, build y tests.
- [ ] No deja placeholders, TODO críticos ni rutas rotas.
- [ ] Está documentado si introduce decisiones de negocio o configuración.

---

## 26. Próximo bloque de trabajo recomendado

El siguiente bloque debe terminar **Módulo 1 + Módulo 2**, sin cambios al esquema de base de datos.

### Orden inmediato

1. Verificar login, registro y restauración de sesión contra el proyecto Supabase real.
2. Confirmar que la verificación de correo está desactivada.
3. Probar logout y acceso directo por cada rol.
4. Completar la pantalla de cambio de contraseña sin recuperación por correo.
5. Completar navegación responsive del app shell.
6. Recién después iniciar catálogos y creación de tickets.

### Resultado esperado de este bloque

- Auth completo y seguro.
- Sesión consistente al recargar y cerrar sesión.
- Roles navegando a rutas existentes.
- Layout móvil y de escritorio listo para recibir módulos.
- Base de datos actual consumida sin cambios desde la aplicación.

---

## 27. Registro de avance

Actualizar esta tabla al finalizar cada bloque.

| Módulo                     | Estado      | Observaciones                                                    |
| -------------------------- | ----------- | ---------------------------------------------------------------- |
| 0. Conexión Supabase       | En progreso | La base se administrará únicamente desde SQL Editor              |
| 1. Auth y sesión           | En progreso | Sesión, logout y roles implementados; falta cambio de contraseña |
| 2. App shell responsive    | Completado  | Navegación por rol, sidebar, drawer móvil y estados compartidos  |
| 3. Catálogos de lectura    | Completado  | Servicios, hooks y vistas de lectura responsive implementados    |
| 4. Creación de tickets     | Completado  | Formulario, mutación y confirmación recargable implementados     |
| 5. Mis tickets y detalle   | Completado  | Lista paginada, filtros URL, detalle e historial implementados   |
| 6. Cola de apoyo           | Completado  | Cola, asignación, estados, resolución y conflictos implementados |
| 7. Resolución y reapertura | Completado  | RPC corregidas y flujo confirmado contra Supabase real           |
| 8. Adjuntos                | Completado  | Policy aplicada y carga/preview comprobados contra Supabase real |
| 9. Catálogos admin         | Completado  | Altas, edición, búsqueda y activación sin borrado implementadas  |
| 10. Perfiles admin         | Completado  | Directorio paginado y filtrable; cambios manuales desde Supabase |
| 11. Dashboard y reportes   | Completado  | RPC aplicada; dashboard y exportaciones PDF/XLSX implementados   |
| 12. Módulos futuros        | Por definir | Requieren validación de negocio y backend                        |
