# REFRIMORA — Sistema de Gestión de Servicios
## Versión 3 — Programación Orientada a Objetos + SOLID

---

## Estructura de archivos

```
refrimora/
│
├── index.html                        ← Página de inicio (cliente agenda aquí)
│
├── css/
│   └── styles.css                    ← Todos los estilos del sistema
│
├── js/
│   ├── Database.js                   ← CLASE: Maneja todos los datos
│   ├── Calculadora.js                ← CLASE: Hace cálculos y formatea valores
│   ├── Sesion.js                     ← CLASE: Maneja login y sesión
│   └── UI.js                         ← CLASES: Dibuja la pantalla
│       ├── UI                        ← Clase base (padre)
│       ├── PanelAdmin                ← Clase hija del admin
│       ├── PanelSecretaria           ← Clase hija de la secretaria
│       └── PanelTecnico              ← Clase hija del técnico
│
└── pages/
    ├── login.html                    ← Inicio de sesión
    ├── admin/
    │   └── dashboard.html            ← Panel del administrador
    ├── secretaria/
    │   └── dashboard.html            ← Panel de la secretaria
    └── tecnico/
        └── dashboard.html            ← Panel del técnico
```

---

## Principios SOLID aplicados

### ✅ 1. Single Responsibility (Responsabilidad Única)
Cada clase tiene UNA sola responsabilidad:

| Clase        | Responsabilidad                          |
|--------------|------------------------------------------|
| Database     | Guardar y buscar datos                   |
| Calculadora  | Hacer cálculos y formatear valores       |
| Sesion       | Manejar quién está conectado             |
| UI           | Dibujar elementos en la pantalla         |

### ✅ 2. Open/Closed (Abierto/Cerrado)
La clase UI está **cerrada para modificación** (no la tocamos),
pero **abierta para extensión**: PanelAdmin, PanelSecretaria y
PanelTecnico la extienden sin cambiar su código.

Si mañana agregamos un nuevo rol "Supervisor", solo creamos:
```javascript
class PanelSupervisor extends UI { ... }
```
Sin tocar nada de lo que ya funciona.

### ✅ 3. Liskov Substitution (Sustitución de Liskov)
Cualquier clase hija puede reemplazar a la clase padre UI.
Todas comparten los mismos métodos base:
- `mostrarAlerta()`
- `abrirModal()` / `cerrarModal()`
- `dibujarContadores()`
- `dibujarResumen()`
- `dibujarTimeline()`
- `estadoBadge()`
- `cambiarSeccion()`
- `marcarNavActivo()`

---

## Cómo usar en VS Code

1. Descomprimir el ZIP
2. Abrir VS Code → File → Open Folder → seleccionar `refrimora`
3. Instalar extensión "Live Server"
4. Click derecho en `index.html` → "Open with Live Server"

---

## Credenciales de prueba

| Rol           | Correo                       | Contraseña |
|---------------|------------------------------|------------|
| Administrador | admin@refrimora.com          | admin123   |
| Secretaria    | secretaria@refrimora.com     | secre123   |
| Técnico Pedro | pedro@refrimora.com          | tec123     |
| Técnico Juan  | juan@refrimora.com           | tec456     |
