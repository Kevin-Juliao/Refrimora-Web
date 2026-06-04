import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useApp,
  calcularEstadisticasDelDia,
  formatearPeso,
  formatearFecha,
  totalServicio,
  calcularIntervaloEtiqueta
} from '../../context/AppContext';
import ResumenDia from "../../components/counters/ResumenDia";
import RepuestosPanel from "../../components/repuestos/RepuestosPanel";
import Modal from "../../components/layout/Modal";
import AvatarCliente from '../../components/cliente/AvatarCliente';
import EstadoBadge from '../../components/badges/EstadoBadge';

const LINKS = [
  { key: 'inicio', label: 'Inicio', icon: '🏠' },
  { key: 'misOrdenes', label: 'Mis Órdenes', icon: '📋' },
];

export default function TecnicoDashboard() {
  const navigate = useNavigate();
  const { usuario, clientes, repuestos, servicios, tecnicos, logout, actualizarServicio } = useApp();

  const [seccion, setSeccion] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalActualizar, setModalActualizar] = useState(false);
  const [servActual, setServActual] = useState(null);
  const [updEstado, setUpdEstado] = useState('agendado');
  const [updNotas, setUpdNotas] = useState('');
  const [repuestosTemp, setRepuestosTemp] = useState([]);
  const [updPrecioServicio, setUpdPrecioServicio] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!usuario || usuario.rol?.toLowerCase() !== 'tecnico') {
      navigate('/login');
    }
  }, [usuario, navigate]);

  if (!usuario || usuario.rol?.toLowerCase() !== 'tecnico') return null;

  const tecnicoId = usuario.id;
  const misServs = servicios.filter(s => 
    String(s.tecnicoId) === String(tecnicoId) && 
    s.estado !== 'cerrado' && 
    s.estado !== 'cancelado'
  );
  const stats = calcularEstadisticasDelDia(misServs, clientes, tecnicos, repuestos, true);

  const abrirModal = (srv) => {
    setServActual(srv);
    setUpdEstado(srv.estado);
    setUpdNotas(srv.notes || srv.notas || '');
    setRepuestosTemp([...(srv.repuestos || [])]);
    setUpdPrecioServicio(srv.precioServicio !== undefined && srv.precioServicio !== null ? String(srv.precioServicio) : '');
    setErrorMsg('');
    setModalActualizar(true);
  };

  const agregarRepuesto = (repuestoId, cantidad) => {
    if (!repuestoId) return;

    const id = parseInt(repuestoId);
    const cnt = parseInt(cantidad) || 1;

    setRepuestosTemp(prev => {
      const ex = prev.find(r => r.repuestoId === id);

      if (ex) {
        return prev.map(r =>
          r.repuestoId === id ? { ...r, cantidad: r.cantidad + cnt } : r
        );
      }

      return [...prev, { repuestoId: id, cantidad: cnt }];
    });
  };

  const quitarRepuesto = (idx) => {
    setRepuestosTemp(prev => prev.filter((_, i) => i !== idx));
  };

  const guardarCambios = async () => {
    if (!servActual) return;
    setErrorMsg('');

    try {
      await actualizarServicio(servActual.id, {
        estado: updEstado,
        notas: updNotas,
        repuestos: repuestosTemp,
        precioServicio: Number(updPrecioServicio) || 0,
      });

      setModalActualizar(false);
    } catch (e) {
      console.error('Error al guardar:', e);
      setErrorMsg(e.message || 'Error al guardar los cambios.');
    }
  };

  const calcTotal = () => {
    const base = Number(updPrecioServicio) || 0;

    return base + repuestosTemp.reduce((sum, r) => {
      const rep = repuestos.find(x => String(x.id) === String(r.repuestoId));
      return sum + (rep ? Number(rep.precio) * Number(r.cantidad) : 0);
    }, 0);
  };

  const initials =
    usuario?.nombre?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'T';

  const kpis = [
    { label: 'Agendadas', valor: stats.agendados, icon: '📅', cls: 'blue' },
    { label: 'En Camino', valor: stats.enCamino, icon: '🛵', cls: 'green' },
    { label: 'En Reparación', valor: stats.enReparacion, icon: '🔧', cls: 'orange' },
    { label: 'Completadas', valor: stats.finalizados, icon: '✅', cls: 'teal' },
  ];

  const repuestosUsadosPorTecnico = [];
  misServs.filter(s => s.estado === 'finalizado').forEach(s => {
    (s.repuestos || []).forEach(r => {
      const existing = repuestosUsadosPorTecnico.find(x => Number(x.repuestoId) === Number(r.repuestoId));
      if (existing) {
        existing.cantidad += r.cantidad;
      } else {
        const repDetalle = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
        repuestosUsadosPorTecnico.push({
          repuestoId: r.repuestoId,
          nombre: r.nombre || repDetalle?.nombre || `Repuesto #${r.repuestoId}`,
          icono: repDetalle?.icono || '🔧',
          cantidad: r.cantidad
        });
      }
    });
  });

  return (
    <div className="ad-shell">
      <nav className="ad-nav">
        <div className="ad-nav-brand">
          <div className="ad-nav-logo">❄</div>
          <div>
            <span className="ad-nav-title">Refrimora</span>
            <span className="ad-nav-sub">Técnico</span>
          </div>
        </div>

        <div className={`ad-nav-links ${menuOpen ? 'open' : ''}`}>
          {LINKS.map(l => (
            <button
              key={l.key}
              className={`ad-nav-link ${seccion === l.key ? 'active' : ''}`}
              onClick={() => {
                setSeccion(l.key);
                setMenuOpen(false);
              }}
            >
              <span className="ad-nav-icon">{l.icon}</span>
              {l.label}
            </button>
          ))}
        </div>

        <div className="ad-nav-right">
          <div className="ad-nav-user">
            <div className="ad-nav-avatar" style={{ background: 'linear-gradient(135deg, #11b8b8, #4edcdc)' }}>{initials}</div>
            <div className="ad-nav-userinfo">
              <span className="ad-nav-username">{usuario.nombre?.split(' ')[0]}</span>
              <span className="ad-nav-role">Técnico</span>
            </div>
          </div>

          <button
            className="ad-nav-salir"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            Salir
          </button>

          <button className="ad-nav-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="ad-body">
        {seccion === 'inicio' && (
          <div className="ad-section">
            <div className="ad-hero">
              <div className="ad-hero-glow" />
              <div className="ad-hero-left">
                <div className="ad-hero-avatar" style={{ background: 'linear-gradient(135deg, #11b8b8, #4edcdc)' }}>{initials}</div>
                <div>
                  <h1 className="ad-hero-greeting">Bienvenido, {usuario.nombre.split(' ')[0]}</h1>
                  <p className="ad-hero-sub">Tus Órdenes Programadas para Hoy</p>
                </div>
              </div>
            </div>

            <div className="ad-kpi-row">
              {kpis.map(k => (
                <div key={k.label} className={`ad-kpi-card ${k.cls}`}>
                  <div className="ad-kpi-icon">{k.icon}</div>
                  <div className="ad-kpi-num">{k.valor}</div>
                  <div className="ad-kpi-label">{k.label}</div>
                </div>
              ))}
            </div>

            <div className="ad-grid-main">
              <div className="ad-section" style={{ gap: 16 }}>
                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3>Mis Órdenes de Servicio</h3>
                  </div>

                  <div className="ad-table-wrap">
                    <TablaOrdenesTecnico
                      servicios={misServs}
                      clientes={clientes}
                      repuestos={repuestos}
                      onAbrir={abrirModal}
                    />
                  </div>
                </div>
              </div>

              <div className="ad-sidebar">
                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3>Resumen del Día</h3>
                  </div>
                  <div className="ad-panel-body">
                    <ResumenDia stats={stats} esTecnico={true} />
                  </div>
                </div>

                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3>Repuestos Usados</h3>
                  </div>
                  <div className="ad-panel-body">
                    <RepuestosUsadosPanel repuestosUsados={repuestosUsadosPorTecnico} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {seccion === 'misOrdenes' && (
          <div className="ad-section">
            {misServs.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#7a96b8', padding: 40 }}>
                No tienes órdenes asignadas.
              </p>
            ) : (
              misServs.map(sv => {
                const cl = clientes.find(c => String(c.id) === String(sv.clienteId));
                const nombreCliente = sv.clienteNombre || cl?.nombre || '—';

                return (
                  <div key={sv.id} className="ad-panel" style={{ marginBottom: 16 }}>
                    <div className="ad-panel-header">
                      <div>
                        <h3 style={{ margin: 0 }}>Orden #{sv.id} — {sv.tipo}</h3>
                        <p style={{ fontSize: 13, color: '#7a96b8', margin: '4px 0 0' }}>
                          {formatearFecha(sv.fechaServicio)} {calcularIntervaloEtiqueta(sv.hora, sv.duracionForzada)}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <EstadoBadge estado={sv.estado} />
                        <button className="ad-btn-sm" onClick={() => abrirModal(sv)}>
                          Actualizar
                        </button>
                      </div>
                    </div>

                    <div className="ad-panel-body" style={{ padding: '16px 18px', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ margin: 0 }}><strong>Cliente:</strong> {nombreCliente} — {cl?.telefono || '—'}</p>
                      <p style={{ margin: 0 }}><strong>Dirección:</strong> {cl?.direccion || '—'}</p>
                      <p style={{ margin: 0 }}><strong>Diagnóstico:</strong> {sv.diagnostico || '—'}</p>
                      {sv.airesList && sv.airesList.length > 0 && (
                        <div className="aires-revisar-panel">
                          <strong>Aires acondicionados a revisar:</strong>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {sv.airesList.map((a, i) => (
                              <span key={i} className="aires-revisar-item">
                                ❄️ {a.tipoAire}: {a.tipoServicio}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {sv.notas && <p style={{ margin: 0 }}><strong>Notas:</strong> {sv.notas}</p>}
                      <p style={{ margin: 0 }}>
                        <strong>Total:</strong>{' '}
                        <span className="ad-money">
                          {formatearPeso(totalServicio(sv, repuestos))}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {modalActualizar && servActual && (
        <Modal
          titulo="Actualizar Orden de Servicio"
          onClose={() => setModalActualizar(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalActualizar(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={guardarCambios}
              >
                Guardar Cambios
              </button>
            </>
          }
        >
          {errorMsg && <div className="alert alert-error" style={{ marginBottom: 14 }}>⚠️ {errorMsg}</div>}
          {(() => {
            const cl = clientes.find(c => String(c.id) === String(servActual.clienteId));

            return (
              <div className="tecnico-modal-info">
                <strong>{cl?.nombre}</strong> — {cl?.telefono}
                <br />
                📍 {cl?.direccion}
                <br />
                🔧 {servActual.tipo} · {formatearFecha(servActual.fechaServicio)} {calcularIntervaloEtiqueta(servActual.hora, servActual.duracionForzada)}
                  {servActual.airesList && servActual.airesList.length > 0 && (
                    <div className="modal-aires-wrapper">
                      {servActual.airesList.map((a, i) => (
                        <span key={i} className="modal-aires-span">
                          ❄️ {a.tipoAire}: {a.tipoServicio}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            );
          })()}

          <div className="form-group">
            <label>Estado del servicio</label>
            <select value={updEstado} onChange={e => setUpdEstado(e.target.value)}>
              <option value="agendado">Agendado</option>
              <option value="en-camino">En Camino</option>
              <option value="en-reparacion">En Reparación</option>
              <option value="finalizado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notas del servicio</label>
            <textarea
              value={updNotas}
              onChange={e => setUpdNotas(e.target.value)}
              placeholder="Observaciones, trabajo realizado..."
            />
          </div>

          <div className="form-group">
            <label>Precio del servicio</label>
            <input
              type="number"
              value={updPrecioServicio}
              onChange={e => setUpdPrecioServicio(e.target.value)}
              min="0"
              placeholder="Precio del servicio"
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(123, 178, 255, 0.15)', margin: '16px 0' }} />
          <p className="tecnico-modal-section-title">
            Repuestos utilizados
          </p>

          <div id="repuestosAgregados">
            {repuestosTemp.map((r, i) => {
              const rep = repuestos.find(x => String(x.id) === String(r.repuestoId));

              return (
                <div key={i} className="tecnico-modal-repuesto-item">
                  <span>{rep?.icono} {rep?.nombre} × {r.cantidad}</span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="ad-money">
                      {formatearPeso((rep?.precio || 0) * r.cantidad)}
                    </span>
                    <button className="ad-btn-sm" onClick={() => quitarRepuesto(i)}>
                      ✕
                    </button>
                  </span>
                </div>
              );
            })}
          </div>

          <RepuestoSelector repuestos={repuestos} repuestosTemp={repuestosTemp} onAgregar={agregarRepuesto} />

          <div className="total-box" style={{ marginTop: 14 }}>
            <span>Total estimado del servicio:</span>
            <span>{formatearPeso(calcTotal())}</span>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TablaOrdenesTecnico({ servicios, clientes, repuestos, onAbrir }) {
  return (
    <table className="ad-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Tipo</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Total</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {servicios.length === 0 ? (
          <tr>
            <td colSpan={7} className="ad-empty-row">
              Sin órdenes asignadas
            </td>
          </tr>
        ) : (
          servicios.map(sv => {
            const nombreCliente = sv.clienteNombre || clientes.find(c => String(c.id) === String(sv.clienteId))?.nombre || '—';

            return (
              <tr key={sv.id}>
                <td className="ad-id">#{sv.id}</td>
                <td>
                  <div className="ad-td-user">
                    <AvatarCliente nombre={nombreCliente} />
                  </div>
                </td>
                 <td>
                   <div>
                     <strong>{sv.tipo}</strong>
                      {sv.airesList && sv.airesList.length > 0 && (
                        <div className="table-aires-sub">
                          {sv.airesList.map((a, i) => `${a.tipoAire} (${a.tipoServicio.substring(0, 3)}.)`).join(', ')}
                        </div>
                      )}
                   </div>
                 </td>
                <td className="ad-muted">{formatearFecha(sv.fechaServicio)} {calcularIntervaloEtiqueta(sv.hora, sv.duracionForzada)}</td>
                <td><EstadoBadge estado={sv.estado} /></td>
                <td className="ad-money">{formatearPeso(totalServicio(sv, repuestos))}</td>
                <td>
                  <button className="ad-btn-sm" onClick={() => onAbrir(sv)}>
                    Actualizar
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function RepuestoSelector({ repuestos, repuestosTemp, onAgregar }) {
  const [sel, setSel] = useState('');
  const [cnt, setCnt] = useState('1');
  const [errorMsg, setErrorMsg] = useState('');

  const repSeleccionado = repuestos.find(r => String(r.id) === String(sel));
  const yaAgregado = repuestosTemp?.find(r => String(r.repuestoId) === String(sel))?.cantidad || 0;
  const stockDisponible = repSeleccionado ? repSeleccionado.stock : 0;

  const handleAgregar = () => {
    if (!sel) return;
    const req = parseInt(cnt, 10) || 1;

    if (repSeleccionado) {
      if (req + yaAgregado > repSeleccionado.stock) {
        setErrorMsg(`Stock insuficiente. Hay ${repSeleccionado.stock} disponibles en total${yaAgregado > 0 ? ` (ya añadiste ${yaAgregado})` : ''}.`);
        return;
      }
    }

    setErrorMsg('');
    onAgregar(sel, cnt);
    setSel('');
    setCnt('1');
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Repuesto</label>
          <select 
            value={sel} 
            onChange={e => {
              setSel(e.target.value);
              setErrorMsg('');
            }}
          >
            <option value="">Seleccionar...</option>
            {repuestos.map(r => (
              <option key={r.id} value={r.id}>
                {r.icono} {r.nombre} — {formatearPeso(r.precio)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Cantidad</label>
          <input
            type="number"
            value={cnt}
            onChange={e => {
              setCnt(e.target.value);
              setErrorMsg('');
            }}
            min="1"
            max={stockDisponible > 0 ? stockDisponible : 99}
            style={{ width: 70 }}
          />
        </div>

        <button
          className="ad-btn-sm"
          style={{ marginBottom: 0 }}
          onClick={handleAgregar}
        >
          + Agregar
        </button>
      </div>

      {repSeleccionado && !errorMsg && (
        <div style={{ fontSize: 12, color: '#7a96b8', marginTop: 6, marginLeft: 2 }}>
          ℹ️ Stock disponible: <strong>{stockDisponible}</strong> {yaAgregado > 0 && `(en uso: ${yaAgregado})`}
        </div>
      )}
      
      {errorMsg && (
        <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6, marginLeft: 2 }}>
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}

function RepuestosUsadosPanel({ repuestosUsados }) {
  if (repuestosUsados.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: '#7a96b8', padding: 20, fontSize: 14 }}>
        No has registrado repuestos usados hoy.
      </p>
    );
  }

  return (
    <div className="repuestos-grid">
      {repuestosUsados.map(r => (
        <div key={r.repuestoId} className="repuesto-card">
          <div className="rep-icon">{r.icono}</div>
          <div className="rep-nombre">{r.nombre}</div>
          <div className="rep-precio" style={{ color: '#a0aec0' }}>Cant: {r.cantidad}</div>
        </div>
      ))}
    </div>
  );
}