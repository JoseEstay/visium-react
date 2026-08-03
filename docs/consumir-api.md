# Como utilizar el custom hook

## Metodo GET
```js
const pacientes = await apiFetch("/pacientes", {
    method: "GET"
});
```

## Metodo POST
```js
const paciente = await apiFetch("/pacientes", {
    method: "POST",
    body: JSON.stringify({
        nombre: "Pedro",
        apellido: "Sanchez"
    })
});
```

## Metodo PUT
```js
await apiFetch("/pacientes/15", {
    method: "PUT",
    body: JSON.stingify({
        nombre: "Pedro",
        apellido: "Sanchez"
    })
});
```

## Metodo Delete 
```js
await apiFetch("/pacientes/15", {
    method: "DELETE"
});
```

## Mejoras que se podrian hacer
Crear funciones que sean para traer informacion que se necesite en muchos lados.
Ejemplo:
```js
export const crearPaciente = (paciente) => {
    return apiFetch("/pacientes", {
        method: "POST",
        body: JSON.stringify(paciente)
    });
});
```
Con esto se puede utilizar esta funcion se puede reutilizar en todos los lados donde se necesite crear un paciente
y asi ahorrar codigo y poder dividir responsabilidades.

Como se puede ver a la funcion/hook se le pasa el endpoint y las opciones 
```js
const paciente = await apiFetch("endpoint", {
    opciones...
}
```

