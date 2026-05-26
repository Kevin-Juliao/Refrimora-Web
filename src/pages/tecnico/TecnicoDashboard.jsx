import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useApp,
  calcularEstadisticasDelDia,
  formatearPeso,
  formatearFecha,
  totalServicio
} from '../../context/AppContext';
import Contadores from "../../components/counters/Contadores";
import ResumenDia from "../../components/counters/ResumenDia";
import Timeline from "../../components/timeline/Timeline";
import RepuestosPanel from "../../components/repuestos/RepuestosPanel";
import Modal from "../../components/layout/Modal";
import DashboardNav from "../../components/layout/DashboardNav";
import AvatarCliente from '../../components/cliente/AvatarCliente';
import EstadoBadge from '../../components/badges/EstadoBadge';

const LINKS = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'misOrdenes', label: 'Mis Órdenes' },
];

export default function TecnicoDashboard() {
  const navigate = useNavigate();
  const { usuario, clientes, repuestos, servicios, tecnicos, logout, actualizarServicio } = useApp();

  const [seccion, setSeccion] = useState('inicio');
  const [modalActualizar, setModalActualizar] = useState(false);
  const [servActual, setServActual] = useState(null);
  const [updEstado, setUpdEstado] = useState('agendado');
  const [updNotas, setUpdNotas] = useState('');
  const [repuestosTemp, setRepuestosTemp] = useState([]);

  useEffect(() => {
    if (!usuario || usuario.rol?.toLowerCase() !== 'tecnico') {
      navigate('/login');
    }
  }, [usuario, navigate]);

  if (!usuario || usuario.rol?.toLowerCase() !== 'tecnico') return null;

  const tecnicoId = usuario.id;
  const misServs = servicios.filter(s => String(s.tecnicoId) === String(tecnicoId));
  const stats = calcularEstadisticasDelDia(misServs, clientes, tecnicos, repuestos);

  const abrirModal = (srv) => {
    setServActual(srv);
    setUpdEstado(srv.estado);
    setUpdNotas(srv.notas || '');
    setRepuestosTemp([...(srv.repuestosUsados || [])]);
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

    try {
      await actualizarServicio(servActual.id, {
        estado: updEstado,
        notas: updNotas,
        repuestosUsados: repuestosTemp,
      });

      setModalActualizar(false);
    } catch (e) {
      console.error('Error al guardar:', e);
    }
  };

  const calcTotal = () => {
    const base = Number(servActual?.precioServicio) || 0;

    return base + repuestosTemp.reduce((sum, r) => {
      const rep = repuestos.find(x => String(x.id) === String(r.repuestoId));
      return sum + (rep ? Number(rep.precio) * Number(r.cantidad) : 0);
    }, 0);
  };

  return (
    <>
      <DashboardNav
        links={LINKS}
        seccion={seccion}
        onSeccion={setSeccion}
        usuario={usuario}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      <div className="page-wrapper">
        {seccion === 'inicio' && (
          <div className="page-section active">
            <div className="welcome-banner" style={{ marginBottom: 20 }}>
              <div>
                <h2>Bienvenido, {usuario.nombre.split(' ')[0]}</h2>
                <p>Tus Órdenes Programadas para Hoy</p>
              </div>
              <div className="banner-icon">🔧</div>
            </div>

            <div className="page-content">
              <div>
                <Contadores stats={stats} />

                <div className="card">
                  <div className="card-header">
                    <h3>Mis Órdenes de Servicio</h3>
                  </div>

                  <div className="table-wrap">
                    <TablaOrdenesTecnico
                      servicios={misServs}
                      clientes={clientes}
                      repuestos={repuestos}
                      onAbrir={abrirModal}
                    />
                  </div>
                </div>
              </div>

              <div className="sidebar-right">
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header">
                    <h3>Estado de la Orden</h3>
                  </div>
                  <Timeline estadoActivo={misServs.length ? misServs[0].estado : 'agendado'} />
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header">
                    <h3>Resumen del Día</h3>
                  </div>
                  <ResumenDia stats={stats} />
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header">
                    <h3>Venta de Repuestos</h3>
                  </div>
                  <div className="card-body">
                    <RepuestosPanel repuestos={repuestos} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {seccion === 'misOrdenes' && (
          <div className="page-section active">
            {misServs.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>
                No tienes órdenes asignadas.
              </p>
            ) : (
              misServs.map(sv => {
                const cl = clientes.find(c => String(c.id) === String(sv.clienteId));

                return (
                  <div key={sv.id} className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                      <div>
                        <h3>Orden #{sv.id} — {sv.tipo}</h3>
                        <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                          {formatearFecha(sv.fecha)} {sv.hora}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <EstadoBadge estado={sv.estado} />
                        <button className="btn btn-primary btn-sm" onClick={() => abrirModal(sv)}>
                          Actualizar
                        </button>
                      </div>
                    </div>

                    <div className="card-body" style={{ padding: '12px 16px', fontSize: 14 }}>
                      <p><strong>Cliente:</strong> {cl?.nombre || '—'} — {cl?.telefono}</p>
                      <p><strong>Dirección:</strong> {cl?.direccion || '—'}</p>
                      <p><strong>Diagnóstico:</strong> {sv.diagnostico || '—'}</p>
                      {sv.notas && <p><strong>Notas:</strong> {sv.notas}</p>}
                      <p>
                        <strong>Total:</strong>{' '}
                        <span className="text-blue text-bold">
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
                className="btn btn-success"
                type="button"
                onClick={guardarCambios}
              >
                Guardar Cambios
              </button>
            </>
          }
        >
          {(() => {
            const cl = clientes.find(c => String(c.id) === String(servActual.clienteId));

            return (
              <div
                style={{
                  background: '#f4f6f8',
                  border: '1px solid #dde2e8',
                  borderRadius: 6,
                  padding: 12,
                  marginBottom: 16,
                  fontSize: 13
                }}
              >
                <strong>{cl?.nombre}</strong> — {cl?.telefono}
                <br />
                📍 {cl?.direccion}
                <br />
                🔧 {servActual.tipo} · {formatearFecha(servActual.fecha)} {servActual.hora}
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

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '16px 0' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 12 }}>
            Repuestos utilizados
          </p>

          <div id="repuestosAgregados">
            {repuestosTemp.map((r, i) => {
              const rep = repuestos.find(x => String(x.id) === String(r.repuestoId));

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 13,
                    padding: '4px 0',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <span>{rep?.icono} {rep?.nombre} × {r.cantidad}</span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="text-blue">
                      {formatearPeso((rep?.precio || 0) * r.cantidad)}
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => quitarRepuesto(i)}>
                      ✕
                    </button>
                  </span>
                </div>
              );
            })}
          </div>

          <RepuestoSelector repuestos={repuestos} onAgregar={agregarRepuesto} />

          <div className="total-box" style={{ marginTop: 14 }}>
            <span>Total estimado del servicio:</span>
            <span>{formatearPeso(calcTotal())}</span>
          </div>
        </Modal>
      )}
    </>
  );
}

function TablaOrdenesTecnico({ servicios, clientes, repuestos, onAbrir }) {
  return (
    <table>
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
            <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>
              Sin órdenes asignadas
            </td>
          </tr>
        ) : (
          servicios.map(sv => {
            const cl = clientes.find(c => String(c.id) === String(sv.clienteId));

            return (
              <tr key={sv.id}>
                <td className="text-muted">#{sv.id}</td>
                <td><AvatarCliente nombre={cl?.nombre || '—'} /></td>
                <td>{sv.tipo}</td>
                <td>{formatearFecha(sv.fecha)} {sv.hora}</td>
                <td><EstadoBadge estado={sv.estado} /></td>
                <td className="text-blue text-bold">{formatearPeso(totalServicio(sv, repuestos))}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => onAbrir(sv)}>
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

function RepuestoSelector({ repuestos, onAgregar }) {
  const [sel, setSel] = useState('');
  const [cnt, setCnt] = useState('1');

  return (
    <div className="form-row" style={{ alignItems: 'flex-end', marginTop: 10 }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Repuesto</label>
        <select value={sel} onChange={e => setSel(e.target.value)}>
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
          onChange={e => setCnt(e.target.value)}
          min="1"
          max="99"
          style={{ width: 70 }}
        />
      </div>

      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: 0 }}
        onClick={() => {
          onAgregar(sel, cnt);
          setSel('');
          setCnt('1');
        }}
      >
        + Agregar
      </button>
    </div>
  );
}