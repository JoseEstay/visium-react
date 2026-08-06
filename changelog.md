# Changelog
## 2026-08-06

### Añadido
- El frontend ahora consume la API real del backend (Spring Boot) en lugar de los datos simulados de `/data/*.json` y `localStorage`: `apiFetch` envía `X-Empresa-Id`, muestra los mensajes de error del backend y redirige a `/login` ante sesión expirada (401).
- Nuevo hook `useFetch` con `refresh`, cancelación de peticiones y dependencias estables.
- Página de cambio de contraseña propia conectada a `PUT /auth/me/password`.
- Recuperación de contraseña conectada a `POST /auth/password-recovery` y `/confirm`.
- Descarga de recetas en PDF desde el historial (`GET /recetas/{id}/pdf`).

### Modificado
- Login autentica contra `POST /auth/login` y guarda token, usuario y empresa activa.
- Dashboard y Gestión de Citas leen citas reales (`GET /citas`) y las confirman/cancelan/reagendan vía API.
- Gestión de Pacientes y Nuevo Paciente usan `GET/POST/PUT/DELETE /pacientes`; la última receta se obtiene de `GET /recetas/paciente/{id}`.
- Emisión de recetas conectada a `POST /recetas` (requiere una consulta previa del paciente); el historial se lee desde la API.
- Gestión Administrativa lista los registros reales de la empresa activa (usuarios, profesionales, recepcionistas, sucursales, empresas, citas y pacientes); la eliminación de pacientes usa `DELETE /pacientes/{id}`.
- El buscador del encabezado consulta `GET /pacientes?texto=...` y navega por id de paciente.
- Las rutas de recetas e historial usan el id (UUID) del paciente en lugar del RUT.
- `useTheme` se separó a `context/useTheme.js` y el contexto a `context/ThemeContext.js` para dejar el lint del proyecto limpio.
- En el login, si el backend no devuelve `empresaActivaId` (usuario con varias empresas), se usa la primera de `empresaIds` para poder enviar el header `X-Empresa-Id` en todas las peticiones.

### Corregido
- Cierre de sesión automático al entrar a Gestión de Citas: el backend devolvía 401 como artefacto del manejo de errores de `/pacientes`, `/profesionales` y `/sucursales`; esos endpoints ahora responden correctamente (200/400) y el frontend ya no interpreta esos errores como sesión expirada.

### Eliminado
- Dependencias de los archivos simulados `/data/*.json` y claves `visium.*` de `localStorage` en las páginas migradas (persistencia mock de citas, pacientes, recetas y usuarios).

## 2026-07-31

### Añadido
- Se incorporaron 25 pacientes, 3 profesionales y nuevas citas de demostración distribuidas entre julio y agosto.
- Se incorporó la vista de Administradores de sucursal en Gestión Administrativa, disponible únicamente para los roles Jefe y Administrador de sucursales.
- Se añadieron recetas históricas de demostración para María González.
- Se incorporaron selectores de tema en las páginas públicas Home, Login y Solicitar demo.
- La gestión de Citas incluye agenda diaria y semanal, calendario con indicadores de días con citas y alerta de alta ocupación desde 8 citas diarias.
- Se añadieron formularios para agendar y reagendar citas, con búsqueda por paciente (nombre o RUT) y profesional, además de horarios en intervalos de 30 minutos.
- Se añadió una confirmación antes de cancelar una cita.
- Las citas canceladas permiten «Agendar nueva cita»: se precargan sus datos y, al guardar, la nueva información reemplaza el registro cancelado.
- Se añadió una función restringida por rol para revelar temporalmente el acceso a Métricas desde el logotipo lateral.

### Modificado
- El resumen de Gestión de Citas ahora se calcula según el día seleccionado y el encabezado muestra fecha y hora actuales.
- Se implementaron transiciones de estado: las citas pendientes o reagendadas pueden confirmarse; las confirmadas pueden reagendarse o cancelarse.
- Los estados «En espera» y «Programada» se normalizan como «Pendiente» y «Reagendada», respectivamente.
- Los horarios de citas se normalizan a intervalos de media hora: `:15` pasa a `:30` y `:45` pasa a la siguiente hora en `:00`.
- Se mejoraron los modos claro y oscuro, la distribución de acciones, la responsividad de la agenda y la visualización de citas canceladas.
- Se aplicó el estilo de foco azul en modo oscuro a los campos de texto del proyecto.
- Se ajustaron las páginas de pacientes, recetas e historial de recetas para usar datos JSON y mantener coherencia visual entre ambos modos.
- El historial de recetas desde Gestión Administrativa abre la página de historial del paciente seleccionado mediante su RUT.
- Las eliminaciones de Gestión Administrativa ahora se realizan mediante una ventana de confirmación con contraseña; al eliminar un administrador se valida la contraseña de su propia cuenta y para los demás registros, la del usuario autenticado.
- Se extendió el modo oscuro a Home, Login y Solicitar demo, incluidos formularios, navegación, tarjetas, pie de página y controles de tema.
- Se unificó el estilo de escritura, foco, placeholder, cursor y autocompletado para todos los campos editables en modo oscuro.

### Corregido
- Se corrigieron la carga de citas en fechas con formato de fecha y hora combinado, incluido el 31 de julio.
- Se corrigió la detección visual de alta densidad en el calendario para ambos modos de color.
- Se corrigió la adaptación de la lista de citas en pantallas angostas y en anchos reducidos por paneles de herramientas.
- Se corrigieron errores de datos locales en `NuevoPaciente.jsx` y de generación de identificadores en `Recetas.jsx`.
- Se corrigió la separación de datos guardados entre Sucursales y Profesionales en Gestión Administrativa.
- Se corrigió el fondo blanco que Bootstrap aplicaba a los campos del Login y Solicitar demo al enfocarlos o escribir texto.

### Quitado
- Se eliminaron los filtros e impresión de la vista Gestión de Citas, los controles «Lejos/Cerca» duplicados de Recetas y el acceso «Volver al expediente».

## 2026-07-29

### Añadido
- Se incorporaron archivos de datos para pacientes, citas, recetas, recepcionistas y usuarios vinculados.
- Se añadió `recetas.json`, asociado por `pacienteRut`, con graduación óptica, distancia pupilar, material, diagnóstico e indicaciones clínicas.
- Se añadió la búsqueda predictiva de pacientes en el encabezado, con acceso directo a su ficha desde cada resultado.
- Se agregó el historial de recetas por paciente en Gestión Administrativa, con opciones para editar y eliminar registros.
- Se incorporó el campo Diagnóstico en la página de Recetas y en la edición de su historial administrativo.
- Se añadió el flujo de recuperación de contraseña: correo, validación del código de demostración `111-111` y actualización de contraseña local.
- Se añadieron controles para mostrar u ocultar contraseñas en Login, Recepcionistas y Gestión Administrativa → Contraseñas.
- Se añadió una página pública de contacto para Soporte Técnico, con correo, teléfono y motivo de consulta.
- Se enlazó «Soporte Técnico» del login con la nueva página de contacto.
- Se vinculó cada recepcionista con un usuario mediante `usuarioId` y se añadió el usuario de Marcela Soto.
- Se añadió la página pública «Solicitar demo», con formulario para registrar datos de contacto, empresa, cargo, sucursales y mensaje.
- Se añadió `solicitudes-demo.json` como fuente de datos inicial para las solicitudes de demostración, que se persisten localmente en formato JSON.

### Modificado
- Gestión de Pacientes consulta los datos JSON de pacientes y recetas; la columna «Condición» pasó a llamarse «Diagnóstico».
- El RUT pasó a ser el identificador de pacientes; se eliminaron los IDs internos `P-100x` y las asociaciones de citas y recetas usan `pacienteRut`.
- Los antecedentes permanecen asociados al paciente; el motivo de consulta se trasladó desde pacientes a las citas.
- La página Ficha carga los datos del paciente seleccionado desde una cita o desde el listado de pacientes.
- El dashboard obtiene sus citas desde `citas.json`, las ordena por hora y muestra la más temprana como cita principal.
- El botón «Confirmar cita» abre la ficha del paciente asociado a la cita principal.
- Gestión Administrativa permite editar datos de pacientes, antecedentes, recetas y cuentas vinculadas a recepcionistas.
- Los administradores de sucursal sólo pueden visualizar, crear y administrar recepcionistas y usuarios pertenecientes a su propia sucursal.
- La opción «Métricas» quedó limitada a administradores y jefes.
- Se actualizaron los rótulos de navegación administrativa a «Pacientes y recetas».
- El texto «Visium» del login ahora enlaza a la página de inicio.
- Los enlaces «Solicitar Demo» del encabezado y «Agenda una demo» del pie dirigen al formulario de demostración.
- El botón «Crear ficha» abre la página de recetas desde el inicio de la vista.
- El menú público actualiza el enlace activo entre «Inicio» y «Sobre Nosotros» según la sección visible.
- Al seleccionar un usuario en Contraseñas, la vista se desplaza y enfoca el campo «Nueva contraseña».

### Corregido
- Se corrigió la carga de última consulta, fecha de nacimiento y correo al combinar datos JSON con registros antiguos de `localStorage`.
- Se corrigió el reconocimiento de usuarios nuevos, incluido Marcela Soto, en la gestión administrativa y recuperación de contraseña.
- Se corrigió un ciclo de renderizado en Gestión Administrativa → Contraseñas que impedía navegar fuera de la página.
- Se mejoró la responsividad de Pacientes, Gestión Administrativa, Recetas y Dashboard.
- En pantallas angostas, el listado de pacientes se transforma en tarjetas para eliminar el desplazamiento horizontal de la tabla.
- Se ajustó la columna Diagnóstico y el modo compacto de pacientes según el ancho real del panel.
- Se corrigió el layout de Recetas para usar el ancho disponible y no generar un scroll interno.
- Se habilitó el desplazamiento vertical del menú lateral abierto en móvil, permitiendo acceder a todas las opciones administrativas.
- Las secciones de Gestión Administrativa y Contraseñas ahora se abren desde la parte superior de la página.
- Se mejoró el estilo y el foco del campo «Indicaciones» al editar una ficha administrativa.

### Quitado
- Se eliminó la etiqueta «Paciente nuevo» y el botón «Estado de cita en trámite» de la tarjeta principal del dashboard.
- Se eliminó la sección «Motivo de consulta» de la página Ficha/Paciente.
- Se eliminó el enlace «Solicite acceso» de la pantalla de inicio de sesión.
- Se eliminó la opción «Recordar mi sesión en este equipo» del inicio de sesión.
- Se eliminó el acceso duplicado «Portal Médico» del listado de navegación pública; se mantiene el botón principal de ingreso.
- Se reemplazó `fichas.json` por `recetas.json`.

## 2026-07-24

### Añadido
- Se añadió un logo SVG con forma de ojo al menú lateral.
- Se incorporaron símbolos a botones que se mostraban vacíos en Gestión de Pacientes.
- Se agregó una animación de apertura y cierre al menú hamburguesa en móvil y tablet.
- Se añadió una transición que transforma el botón hamburguesa en el logo al desplegar el menú.
- Se incorporaron al menú de pacientes las acciones «Ver última ficha», «Ver fichas», «Editar datos personales» y «Eliminar».
- Se añadieron ventanas emergentes temporales para las acciones de consulta de fichas.
- Se agregaron fecha de nacimiento, teléfono y correo electrónico al modelo local de pacientes.

### Modificado
- Se aplicó al menú lateral un estilo invertido con fondo azul oscuro, textos blancos y estados hover destacados.
- Se reemplazó la barra y el desplazamiento del hover por un subrayado animado en los textos de navegación.
- Se ocultó el ícono principal del logo en la versión responsiva y se reposicionó el botón de despliegue.
- Se redujo el espacio vertical vacío del menú lateral en su versión responsiva.
- Se mejoró la responsividad de Gestión de Pacientes, incluyendo tarjetas, tablas, acciones y paginación.
- Se actualizó el encabezado de Gestión de Pacientes.
- La búsqueda del encabezado reconoce coincidencias por nombre y RUT, tolerando formatos con o sin puntos.
- Se ajustó el fondo global y del header a un blanco suave para reducir el brillo visual.
- Se alineó el color del botón «Nuevo Paciente» con el azul del menú lateral, incluyendo su estado hover.
- Se alineó el botón de más opciones junto al botón «Crear Receta».
- Se limitó la edición de pacientes a nombre completo, RUT, fecha de nacimiento, sexo biológico, teléfono y email.
- Se actualizó automáticamente la edad del paciente a partir de su fecha de nacimiento.
- Se mejoró la distribución de espacios del formulario «Editar datos personales».
- Se cambió el nombre mostrado en el acceso de «Visium Pro» a «Visium».
- Se corrigió la interfaz del login y su responsividad.

### Corregido
- Se corrigió la carga y persistencia de pacientes en `localStorage` mediante una clave específica de la aplicación.
- Se corrigió la visualización de datos y controles en Gestión de Pacientes.
- Se corrigió el posicionamiento del menú contextual para mantenerlo dentro de la ventana y alineado con su botón.
- Se corrigió el botón de más opciones para que cierre el menú contextual al presionarlo nuevamente.
- Se añadió el ícono visible de papelera a la acción «Eliminar».

### Quitado

- Se quitó el botón para agregar pacientes de Gestión de Pacientes.

## 2026-07-23

### Añadido
- Se incorporó la vista de Citas y se actualizó la navegación hacia Gestión de Pacientes.

### Modificado
- Se corrigieron la ruta y los estilos aislados de Gestión de Pacientes.
- Se modernizó el menú lateral, su estado activo y la adaptación del encabezado.
- Se mejoró la responsividad de Dashboard, menú lateral y encabezado.

## 2026-07-22

### Añadido
- Se actualizó la sección de recetas.
- Se añadió el flujo de nuevo paciente a las rutas.
- Se ocultó el botón de nuevo paciente en el header de la vista de nuevo paciente.

### Modificado
- Se realizaron ajustes en la vista y navegación relacionada con pacientes.

### Merge
- Se integraron cambios provenientes de las ramas de gestión de pacientes y recetas.

## 2026-07-21

### Añadido
- Se incorporó la gestión de pacientes y la vista de nuevo paciente.
- Se crearon los componentes HeaderMenu y MenuLateral.
- Se añadió el layout HomeLayout y MainLayout.

### Modificado
- Se actualizaron los componentes App, AppRouter, Dashboard, HeaderMenu, MenuLateral y varias páginas.
- Se ajustó la estructura general de páginas y rutas.

### Merge
- Se integró la rama de gestión de pacientes.

## 2026-07-15

### Inicio del proyecto
- Se realizó el primer commit inicial del repositorio.
- Se limpió y actualizó el README.
