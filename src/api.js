// src/api.js
const BASE = 'http://localhost:3001';

async function get(recurso) {
  const res = await fetch(`${BASE}/${recurso}`);
  return res.json();
}

async function post(recurso, datos) {
  const res = await fetch(`${BASE}/${recurso}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return res.json();
}

async function patch(recurso, id, cambios) {
  const res = await fetch(`${BASE}/${recurso}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios),
  });
  return res.json();
}

export const api = { get, post, patch };