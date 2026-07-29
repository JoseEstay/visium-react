# Changelog
## 2026-07-29

### Añadido
- Se incorporaron archivos de datos para pacientes, citas, recetas, recepcionistas y usuarios vinculados.
- Se añadió `recetas.json`, asociado por `pacienteId`, con graduación óptica, distancia pupilar, material, diagnóstico e indicaciones clínicas.
- Se agregó el historial de recetas por paciente en Gestión Administrativa, con opciones para editar y eliminar registros.
- Se incorporó el campo Diagnóstico en la página de Recetas y en la edición de su historial administrativo.
- Se añadió el flujo de recuperación de contraseña: correo, validación del código de demostración `111-111` y actualización de contraseña local.
- Se añadieron controles para mostrar u ocultar contraseñas en Login, Recepcionistas y Gestión Administrativa → Contraseñas.
- Se añadió una página pública de contacto para Soporte Técnico, con correo, teléfono y motivo de consulta.
- Se enlazó «Soporte Técnico» del login con la nueva página de contacto.
- Se vinculó cada recepcionista con un usuario mediante `usuarioId` y se añadió el usuario de Marcela Soto.

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

### Corregido
- Se corrigió la carga de última consulta, fecha de nacimiento y correo al combinar datos JSON con registros antiguos de `localStorage`.
- Se corrigió el reconocimiento de usuarios nuevos, incluido Marcela Soto, en la gestión administrativa y recuperación de contraseña.
- Se corrigió un ciclo de renderizado en Gestión Administrativa → Contraseñas que impedía navegar fuera de la página.
- Se mejoró la responsividad de Pacientes, Gestión Administrativa, Recetas y Dashboard.
- En pantallas angostas, el listado de pacientes se transforma en tarjetas para eliminar el desplazamiento horizontal de la tabla.
- Se ajustó la columna Diagnóstico y el modo compacto de pacientes según el ancho real del panel.
- Se corrigió el layout de Recetas para usar el ancho disponible y no generar un scroll interno.

### Quitado
- Se eliminó la etiqueta «Paciente nuevo» y el botón «Estado de cita en trámite» de la tarjeta principal del dashboard.
- Se eliminó la sección «Motivo de consulta» de la página Ficha/Paciente.
- Se eliminó el enlace «Solicite acceso» de la pantalla de inicio de sesión.
- Se eliminó la opción «Recordar mi sesión en este equipo» del inicio de sesión.
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
