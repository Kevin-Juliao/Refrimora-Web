import { useState, useMemo } from 'react';
import { useApp, formatearPeso, formatearFecha, totalServicio } from '../../context/AppContext';
import EstadoBadge from '../../components/badges/EstadoBadge';
import Timeline from '../../components/timeline/Timeline';
import Modal from '../../components/layout/Modal';
import { useNavigate, Navigate } from 'react-router-dom';

const TIPOS = ['Mantenimiento', 'Reparación', 'Recarga', 'Instalación', 'Revisión'];
const TIPOS_AIRE = ['Split', 'Ventana', 'Cassette', 'Central', 'Portátil', 'Mini Split'];

export default function ClienteDashboard() {
  const navigate = useNavigate();
  const {
    cliente, logoutCliente,
    servicios, repuestos, usuarios,
    agregarSolicitudWeb,
  } = useApp();

  const [seccion, setSeccion] = useState('inicio');

  // ── Formulario nueva solicitud ──────────────────────────
  const hoy = new Date().toISOString().split('T')[0];
  const [tipo, setTipo] = useState('');
  const [tipoAire, setTipoAire] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [solAlert, setSolAlert] = useState({ tipo: '', msg: '' });
  const [enviando, setEnviando] = useState(false);

  // ── Modal detalle servicio ─────────────────────────────
  const [modalDetalle, setModalDetalle] = useState(false);
  const [servDetalle, setServDetalle] = useState(null);

  if (!cliente) return <Navigate to="/login" replace />;

  // Servicios del cliente (por email o por id)
  const misServicios = useMemo(() =>
    servicios.filter(s => String(s.clienteId) === String(cliente.id)),
    [servicios, cliente.id]
  );

  // Servicio activo (último no finalizado/cancelado)
  const servicioActivo = misServicios.find(
    s => !['finalizado', 'cancelado'].includes(s.estado)
  );

  // Técnicos disponibles en la fecha/hora seleccionada
  const tecnicosDisponibles = useMemo(() => {
    if (!fecha) return [];
    const tecnicos = usuarios.filter(u => u.rol?.toLowerCase() === 'tecnico' && u.disponible);
    // Filtrar técnicos que ya tienen servicio en esa fecha y hora
    const ocupados = servicios
      .filter(s => s.fecha === fecha && s.hora === hora && !['finalizado', 'cancelado'].includes(s.estado))
      .map(s => String(s.tecnicoId));
    return tecnicos.filter(t => !ocupados.includes(String(t.id)));
  }, [fecha, hora, servicios, usuarios]);

  const enviarSolicitud = async () => {
    if (!tipo || !tipoAire || !fecha || !hora)
      return setSolAlert({ tipo: 'error', msg: 'Completa tipo de servicio, tipo de aire, fecha y hora.' });

    setEnviando(true);
    setSolAlert({ tipo: '', msg: '' });
    await agregarSolicitudWeb({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      email: cliente.email,
      tipo,
      fecha,
      problema: `Tipo de aire: ${tipoAire}. ${diagnostico}`,
      fechaEnvio: new Date().toLocaleString('es-CO'),
      estado: 'pendiente',
    });
    setEnviando(false);
    setSolAlert({ tipo: 'success', msg: '✅ Solicitud enviada. La secretaria te agendará pronto.' });
    setTipo(''); setTipoAire(''); setDiagnostico(''); setFecha(''); setHora('');
  };

  const abrirDetalle = srv => { setServDetalle(srv); setModalDetalle(true); };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9' }}>
      {/* NAV */}
      <nav style={{
        background: '#1a5fa8', color: 'white', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>❄</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Refrimora</span>
          <span style={{ opacity: 0.7, fontSize: 13, marginLeft: 4 }}>— Portal Cliente</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {['inicio', 'solicitar', 'estado', 'historial'].map(s => (
            <button key={s} onClick={() => setSeccion(s)} style={{
              background: 'none', border: 'none', color: 'white', cursor: 'pointer',
              fontWeight: seccion === s ? 700 : 400,
              borderBottom: seccion === s ? '2px solid white' : '2px solid transparent',
              padding: '4px 2px', fontSize: 14, textTransform: 'capitalize'
            }}>
              {s === 'solicitar' ? 'Solicitar servicio' :
               s === 'estado' ? 'Mi orden' :
               s === 'historial' ? 'Historial' : 'Inicio'}
            </button>
          ))}
          <div style={{ width: 1, background: 'rgba(255,255,255,0.3)', height: 24 }} />
          <span style={{ fontSize: 13, opacity: 0.9 }}>👤 {cliente.nombre.split(' ')[0]}</span>
          <button onClick={() => { logoutCliente(); navigate('/login',{replace: true}); }} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: 'white', padding: '4px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13
          }}>Salir</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px' }}>

        {/* ── INICIO ── */}
        {seccion === 'inicio' && (
          <div>
            <div className="card" style={{ marginBottom: 20, padding: '24px 28px' }}>
              <h2 style={{ marginBottom: 4 }}>Hola, {cliente.nombre.split(' ')[0]} 👋</h2>
              <p style={{ color: '#666', fontSize: 15 }}>Bienvenido a tu portal de servicios Refrimora.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Servicios totales', valor: misServicios.length, icon: '📋', color: '#1a5fa8' },
                { label: 'En curso', valor: misServicios.filter(s => !['finalizado','cancelado'].includes(s.estado)).length, icon: '🔧', color: '#e67e22' },
                { label: 'Completados', valor: misServicios.filter(s => s.estado === 'finalizado').length, icon: '✅', color: '#27ae60' },
              ].map(c => (
                <div key={c.label} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.valor}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{c.label}</div>
                </div>
              ))}
            </div>

            {servicioActivo && (
              <div className="card" style={{ borderLeft: '4px solid #1a5fa8', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>🔧 Servicio activo</h3>
                  <EstadoBadge estado={servicioActivo.estado} />
                </div>
                <p style={{ margin: '4px 0', fontSize: 14 }}>
                  <strong>Tipo:</strong> {servicioActivo.tipo} &nbsp;|&nbsp;
                  <strong>Fecha:</strong> {formatearFecha(servicioActivo.fecha)} &nbsp;|&nbsp;
                  <strong>Hora:</strong> {servicioActivo.hora}
                </p>
                <Timeline estadoActivo={servicioActivo.estado} />
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}
                  onClick={() => { setSeccion('estado'); }}>
                  Ver detalle completo
                </button>
              </div>
            )}

            {!servicioActivo && (
              <div className="card" style={{ textAlign: 'center', padding: '32px 20px', color: '#888' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <p style={{ marginBottom: 16 }}>No tienes servicios activos en este momento.</p>
                <button className="btn btn-primary" onClick={() => setSeccion('solicitar')}>
                  Solicitar un servicio
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SOLICITAR SERVICIO ── */}
        {seccion === 'solicitar' && (
          <div className="card" style={{ maxWidth: 620, margin: '0 auto' }}>
            <div className="card-header"><h3>Solicitar nuevo servicio</h3></div>
            <div className="card-body">
              {solAlert.msg && (
                <div className={`alert alert-${solAlert.tipo}`} style={{ marginBottom: 14 }}>
                  {solAlert.msg}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de servicio *</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo de aire *</label>
                  <select value={tipoAire} onChange={e => setTipoAire(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {TIPOS_AIRE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Describe el problema o diagnóstico</label>
                <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)}
                  placeholder="Ej. El aire no enfría bien, hace un ruido raro..." rows={3} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha preferida *</label>
                  <input type="date" min={hoy} value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Hora preferida *</label>
                  <input type="time" value={hora} onChange={e => setHora(e.target.value)} />
                </div>
              </div>

              {/* Técnicos disponibles */}
              {fecha && (
                <div style={{
                  background: '#f0f7ff', border: '1px solid #cde', borderRadius: 8,
                  padding: '12px 16px', marginBottom: 16
                }}>
                  <strong style={{ fontSize: 14 }}>
                    🧑‍🔧 Técnicos disponibles para el {formatearFecha(fecha)}
                    {hora && ` a las ${hora}`}:
                  </strong>
                  {tecnicosDisponibles.length === 0 ? (
                    <p style={{ margin: '6px 0 0', color: '#e74c3c', fontSize: 13 }}>
                      No hay técnicos disponibles en ese horario. Prueba otra fecha u hora.
                    </p>
                  ) : (
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                      {tecnicosDisponibles.map(t => (
                        <li key={t.id} style={{ fontSize: 13, color: '#27ae60' }}>
                          ✅ {t.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setSeccion('inicio')}>Cancelar</button>
                <button className="btn btn-primary" onClick={enviarSolicitud} disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MI ORDEN ACTIVA ── */}
        {seccion === 'estado' && (
          <div>
            <h2 style={{ marginBottom: 20 }}>Estado de mi orden</h2>
            {!servicioActivo ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <p>No tienes órdenes activas en este momento.</p>
                <button className="btn btn-primary" style={{ marginTop: 12 }}
                  onClick={() => setSeccion('solicitar')}>
                  Solicitar nuevo servicio
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                <div className="card">
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Orden #{servicioActivo.id}</h3>
                    <EstadoBadge estado={servicioActivo.estado} />
                  </div>
                  <div className="card-body">
                    <table style={{ width: '100%', fontSize: 14 }}>
                      <tbody>
                        {[
                          ['Tipo de servicio', servicioActivo.tipo],
                          ['Fecha', formatearFecha(servicioActivo.fecha)],
                          ['Hora', servicioActivo.hora],
                          ['Técnico', usuarios.find(u => String(u.id) === String(servicioActivo.tecnicoId))?.nombre || '—'],
                          ['Diagnóstico', servicioActivo.diagnostico || '—'],
                        ].map(([k, v]) => (
                          <tr key={k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px 0', color: '#666', width: '40%' }}>{k}</td>
                            <td style={{ padding: '8px 0', fontWeight: 500 }}>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Repuestos usados */}
                    {servicioActivo.repuestosUsados?.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <strong style={{ fontSize: 14 }}>Repuestos utilizados:</strong>
                        <table style={{ width: '100%', marginTop: 8, fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#f5f5f5' }}>
                              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Repuesto</th>
                              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Cant.</th>
                              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {servicioActivo.repuestosUsados.map((r, i) => {
                              const rep = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
                              return (
                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '6px 8px' }}>{rep?.icono} {rep?.nombre || '—'}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{r.cantidad}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                                    {formatearPeso((rep?.precio || 0) * r.cantidad)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div style={{
                      marginTop: 16, padding: '12px 16px',
                      background: '#f0f7ff', borderRadius: 8,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>Total a pagar:</span>
                      <span style={{ fontWeight: 700, fontSize: 20, color: '#1a5fa8' }}>
                        {formatearPeso(totalServicio(servicioActivo, repuestos))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ height: 'fit-content' }}>
                  <div className="card-header"><h3>Progreso</h3></div>
                  <div style={{ padding: '16px' }}>
                    <Timeline estadoActivo={servicioActivo.estado} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {seccion === 'historial' && (
          <div>
            <h2 style={{ marginBottom: 20 }}>Historial de servicios</h2>
            {misServicios.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
                <p>Aún no tienes servicios registrados.</p>
              </div>
            ) : (
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Técnico</th>
                        <th>Diagnóstico</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...misServicios].reverse().map(sv => {
                        const tec = usuarios.find(u => String(u.id) === String(sv.tecnicoId));
                        return (
                          <tr key={sv.id}>
                            <td className="text-muted">{sv.id}</td>
                            <td>{sv.tipo}</td>
                            <td>{formatearFecha(sv.fecha)}</td>
                            <td>{sv.hora}</td>
                            <td>{tec?.nombre || '—'}</td>
                            <td className="text-muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sv.diagnostico || '—'}
                            </td>
                            <td><EstadoBadge estado={sv.estado} /></td>
                            <td className="text-blue text-bold">{formatearPeso(totalServicio(sv, repuestos))}</td>
                            <td>
                              <button className="btn btn-secondary btn-sm" onClick={() => abrirDetalle(sv)}>
                                Ver
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal detalle historial */}
      {modalDetalle && servDetalle && (
        <Modal titulo={`Detalle — Orden #${servDetalle.id}`} onClose={() => setModalDetalle(false)}
          footer={<button className="btn btn-secondary" onClick={() => setModalDetalle(false)}>Cerrar</button>}>
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              {[
                ['Tipo', servDetalle.tipo],
                ['Fecha', formatearFecha(servDetalle.fecha)],
                ['Hora', servDetalle.hora],
                ['Técnico', usuarios.find(u => String(u.id) === String(servDetalle.tecnicoId))?.nombre || '—'],
                ['Diagnóstico', servDetalle.diagnostico || '—'],
                ['Notas', servDetalle.notas || '—'],
                ['Estado', <EstadoBadge estado={servDetalle.estado} />],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 0', color: '#666', width: '35%', fontWeight: 500 }}>{k}</td>
                  <td style={{ padding: '8px 0' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {servDetalle.repuestosUsados?.length > 0 && (
            <>
              <hr style={{ margin: '16px 0' }} />
              <strong style={{ fontSize: 14 }}>Repuestos utilizados:</strong>
              <table style={{ width: '100%', marginTop: 8, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Repuesto</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Cant.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {servDetalle.repuestosUsados.map((r, i) => {
                    const rep = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px 8px' }}>{rep?.icono} {rep?.nombre || '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{r.cantidad}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          {formatearPeso((rep?.precio || 0) * r.cantidad)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          <div style={{
            marginTop: 16, padding: '12px 16px', background: '#f0f7ff',
            borderRadius: 8, display: 'flex', justifyContent: 'space-between'
          }}>
            <span style={{ fontWeight: 600 }}>Total pagado:</span>
            <span style={{ fontWeight: 700, color: '#1a5fa8', fontSize: 18 }}>
              {formatearPeso(totalServicio(servDetalle, repuestos))}
            </span>
          </div>
        </Modal>
      )}
    </div>
  );
}
