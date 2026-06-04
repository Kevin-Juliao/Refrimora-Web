export const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5213/api';

// FUNCIÓN AUXILIAR PARA INYECTAR EL JWT EN FETCH
// Esta función lee la sesión de localStorage. Si hay un token activo, lo introduce
// en el objeto de cabeceras en formato "Bearer", cumpliendo con la exigencia de la API.
function obtenerHeadersConToken(headersAdicionales = {}) {
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...headersAdicionales
  };

  let sesionGuardada = localStorage.getItem('rfrm_sesion');
  if (!sesionGuardada) {
    sesionGuardada = localStorage.getItem('rfrm_cliente_sesion');
  }

  if (sesionGuardada) {
    try {
      const datos = JSON.parse(sesionGuardada);
      // Validamos que el Token exista dentro del objeto guardado
      if (datos && (datos.token || datos.Token)) {
        const tokenActivo = datos.token || datos.Token;
        baseHeaders['Authorization'] = `Bearer ${tokenActivo}`;
      }
    } catch (error) {
      console.error('Error al extraer el token JWT para fetch:', error);
    }
  }

  return baseHeaders;
}

// PETICIONES DE LA API MODIFICADAS CON SEGURIDAD

async function procesarRespuesta(res) {
  if (res.status === 204) return true;
  
  if (!res.ok) {
    let mensaje = `Error HTTP: ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.mensaje) {
        mensaje = errorJson.mensaje;
      }
    } catch {}
    throw new Error(mensaje);
  }
  
  return res.json();
}

async function get(recurso) {
  const res = await fetch(`${BASE}/${recurso}`, {
    method: 'GET',
    headers: obtenerHeadersConToken()
  });
  return procesarRespuesta(res);
}

async function post(recurso, datos) {
  const res = await fetch(`${BASE}/${recurso}`, {
    method: 'POST',
    headers: obtenerHeadersConToken(),
    body: JSON.stringify(datos),
  });
  return procesarRespuesta(res);
}

async function patch(recurso, id, cambios) {
  const res = await fetch(`${BASE}/${recurso}/${id}`, {
    method: 'PATCH',
    headers: obtenerHeadersConToken(),
    body: JSON.stringify(cambios),
  });
  return procesarRespuesta(res);
}

async function put(recurso, id, datos) {
  const res = await fetch(`${BASE}/${recurso}/${id}`, {
    method: 'PUT',
    headers: obtenerHeadersConToken(),
    body: JSON.stringify(datos),
  });
  return procesarRespuesta(res);
}

async function del(recurso, id) {
  const res = await fetch(`${BASE}/${recurso}/${id}`, {
    method: 'DELETE',
    headers: obtenerHeadersConToken(),
  });
  return procesarRespuesta(res);
}

export const api = { get, post, put, patch, del };