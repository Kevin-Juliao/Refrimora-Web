// ── Alerta ────────────────────────────────────────────────────
export function Alerta({ tipo, mensaje, onClose }) {
  if (!mensaje) return null;
  const iconos = { error: '⚠️', success: '✅', info: 'ℹ️' };
  return (
    <div className={`alert alert-${tipo}`}>
      {iconos[tipo]} {mensaje}
    </div>
  );
}
