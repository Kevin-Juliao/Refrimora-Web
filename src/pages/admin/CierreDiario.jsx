import React, { useState } from 'react';
import { useApp, formatearPeso, formatearFecha } from '../../context/AppContext';
import Modal from '../../components/layout/Modal';

export default function CierreDiario() {
  const { historialCierres, finalizarJornada } = useApp();
  const [modalTecnicos, setModalTecnicos] = useState(null);
  const [modalRepuestos, setModalRepuestos] = useState(null);
  const [cierrePrincipalId, setCierrePrincipalId] = useState('');
  const [cierreComparadoId, setCierreComparadoId] = useState('');
  const [comparando, setComparando] = useState(false);

  const cierres = [...historialCierres].reverse();

  const handleFinalizar = async () => {
    if (window.confirm("¿Estás seguro de que deseas finalizar la jornada ahora? Esto reiniciará el contador para los técnicos y guardará el resumen actual.")) {
      await finalizarJornada();
      alert("Jornada finalizada y guardada con éxito.");
    }
  };

  // Resolve actual objects to show in the chart
  const cierrePrincipal = cierres.find(c => String(c.id) === String(cierrePrincipalId)) || cierres[0];
  const cierreComparado = cierres.find(c => String(c.id) === String(cierreComparadoId));

  const dataToShow = [];
  if (cierrePrincipal) {
    dataToShow.push({
      ...cierrePrincipal,
      label: 'Cierre Principal',
      color: 'linear-gradient(180deg, #11b8b8 0%, #0e9696 100%)',
      borderColor: '#0e9696'
    });
  }
  if (comparando && cierreComparado) {
    dataToShow.push({
      ...cierreComparado,
      label: 'Comparando con',
      color: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
      borderColor: '#d97706'
    });
  }

  const maxGanancia = Math.max(...dataToShow.map(c => c.estadisticasGenerales?.gananciaNeta || 0), 1);

  return (
    <div className="ad-section">
      <div className="ad-page-header">
        <div>
          <h2 className="ad-page-title">Cierres y Resúmenes Diarios</h2>
          <p className="ad-page-sub">Historial de jornadas laborales finalizadas.</p>
        </div>
        <button className="ad-btn-main" onClick={handleFinalizar}>
          Finalizar Día Ahora
        </button>
      </div>

      {cierres.length > 0 && (
        <div className="ad-panel" style={{ marginBottom: 20 }}>
          <div className="ad-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3>Comparador de Ganancias Netas</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '12px', color: '#a0aec0' }}>Día 1:</span>
                <select 
                  value={cierrePrincipalId || (cierrePrincipal ? String(cierrePrincipal.id) : '')}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setCierrePrincipalId(nextVal);
                    if (String(nextVal) === String(cierreComparadoId)) {
                      const other = cierres.find(c => String(c.id) !== String(nextVal));
                      setCierreComparadoId(other ? String(other.id) : '');
                    }
                  }}
                  style={{
                    background: '#1a2230',
                    color: '#fff',
                    border: '1px solid #384252',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {cierres.map(c => (
                    <option key={c.id} value={c.id}>
                      {formatearFecha(c.fechaCierre)}
                    </option>
                  ))}
                </select>
              </div>

              {!comparando ? (
                <button 
                  className="ad-btn-sm" 
                  style={{ background: 'rgba(17, 184, 184, 0.15)', color: '#11b8b8', border: '1px solid #11b8b8', padding: '6px 12px', cursor: 'pointer' }}
                  onClick={() => {
                    setComparando(true);
                    // Select the next available closure for comparison
                    const other = cierres.find(c => String(c.id) !== String(cierrePrincipal?.id));
                    setCierreComparadoId(other ? String(other.id) : '');
                  }}
                >
                  Comparar
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#a0aec0' }}>Día 2:</span>
                    <select 
                      value={cierreComparadoId}
                      onChange={(e) => setCierreComparadoId(e.target.value)}
                      style={{
                        background: '#1a2230',
                        color: '#fff',
                        border: '1px solid #384252',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      {cierres
                        .filter(c => String(c.id) !== String(cierrePrincipal?.id))
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {formatearFecha(c.fechaCierre)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <button 
                    className="ad-btn-sm" 
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', cursor: 'pointer' }}
                    onClick={() => {
                      setComparando(false);
                      setCierreComparadoId('');
                    }}
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="ad-panel-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'flex-end', 
              gap: '40px', 
              height: '220px', 
              borderBottom: '2px solid #384252', 
              paddingBottom: '10px',
              maxWidth: '600px',
              margin: '0 auto',
              width: '100%',
              position: 'relative'
            }}>
              {dataToShow.map((c, idx) => {
                const ganancia = c.estadisticasGenerales?.gananciaNeta || 0;
                const height = Math.max((ganancia / maxGanancia) * 100, 2); // Min 2% height
                return (
                  <div key={`${c.id}-${c.label}-${idx}`} style={{  
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'flex-end', 
                    height: '100%',
                    maxWidth: '150px',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#fff', 
                      marginBottom: '8px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {formatearPeso(ganancia)}
                    </div>
                    <div style={{
                      width: '100%',
                      height: `${height}%`,
                      background: c.color,
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: `1px solid ${c.borderColor}`,
                      borderBottom: 'none'
                    }}>
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      marginTop: '10px', 
                      color: '#cbd5e1',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>
                      {formatearFecha(c.fechaCierre)}
                      <span style={{ display: 'block', fontSize: '11px', color: '#7a96b8', fontWeight: 'normal' }}>
                        {c.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabla Comparativa de Detalles si se está comparando */}
            {comparando && cierrePrincipal && cierreComparado && (
              <div style={{ 
                marginTop: '10px', 
                background: 'rgba(26, 34, 48, 0.5)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #384252'
              }}>
                <h4 style={{ color: '#7a96b8', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Análisis Comparativo Directo
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', fontSize: '13px', color: '#cbd5e1', borderBottom: '1px solid #384252', paddingBottom: '6px', fontWeight: 'bold' }}>
                  <div>Métrica</div>
                  <div>{formatearFecha(cierrePrincipal.fechaCierre)}</div>
                  <div>{formatearFecha(cierreComparado.fechaCierre)}</div>
                  <div>Diferencia</div>
                </div>

                {[
                  {
                    name: 'Ingresos Totales',
                    val1: cierrePrincipal.estadisticasGenerales?.totalIngresos || 0,
                    val2: cierreComparado.estadisticasGenerales?.totalIngresos || 0,
                    isCurrency: true,
                    invertColors: false
                  },
                  {
                    name: 'Pago Técnicos',
                    val1: cierrePrincipal.estadisticasGenerales?.totalPagadoTecnicos || 0,
                    val2: cierreComparado.estadisticasGenerales?.totalPagadoTecnicos || 0,
                    isCurrency: true,
                    invertColors: true
                  },
                  {
                    name: 'Costo Repuestos',
                    val1: cierrePrincipal.estadisticasGenerales?.totalCostoRepuestos || 0,
                    val2: cierreComparado.estadisticasGenerales?.totalCostoRepuestos || 0,
                    isCurrency: true,
                    invertColors: true
                  },
                  {
                    name: 'Ganancia Neta',
                    val1: cierrePrincipal.estadisticasGenerales?.gananciaNeta || 0,
                    val2: cierreComparado.estadisticasGenerales?.gananciaNeta || 0,
                    isCurrency: true,
                    invertColors: false
                  }
                ].map(m => {
                  const diff = m.val1 - m.val2;
                  const pct = m.val2 !== 0 ? ((diff / m.val2) * 100).toFixed(1) : '100';
                  
                  let diffColor = '#cbd5e1';
                  let diffSymbol = '';
                  if (diff > 0) {
                    diffColor = m.invertColors ? '#ef4444' : '#10b981';
                    diffSymbol = '+';
                  } else if (diff < 0) {
                    diffColor = m.invertColors ? '#10b981' : '#ef4444';
                  }

                  return (
                    <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', fontSize: '13px', color: '#94a3b8', padding: '8px 0', borderBottom: '1px solid rgba(56, 66, 82, 0.5)' }}>
                      <div style={{ color: '#cbd5e1', fontWeight: m.name === 'Ganancia Neta' ? 'bold' : 'normal' }}>{m.name}</div>
                      <div>{m.isCurrency ? formatearPeso(m.val1) : m.val1}</div>
                      <div>{m.isCurrency ? formatearPeso(m.val2) : m.val2}</div>
                      <div style={{ color: diffColor, fontWeight: 'bold' }}>
                        {diffSymbol}{m.isCurrency ? formatearPeso(diff) : diff} ({diffSymbol}{pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ad-panel">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ingresos Totales</th>
                <th>Pago Técnicos</th>
                <th>Costo Repuestos</th>
                <th>Ganancia Neta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cierres.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ad-empty-row">No hay cierres registrados aún.</td>
                </tr>
              ) : (
                cierres.map(c => (
                  <tr key={c.id}>
                    <td>
                      <strong>{formatearFecha(c.fechaCierre)}</strong>
                      <div style={{ fontSize: '11px', color: '#a0aec0' }}>
                        Cerrado a las {new Date(c.fechaHoraCierreReal).toLocaleTimeString('es-CO')}
                      </div>
                    </td>
                    <td className="ad-money">{formatearPeso(c.estadisticasGenerales?.totalIngresos)}</td>
                    <td className="ad-money" style={{ color: '#e53e3e' }}>-{formatearPeso(c.estadisticasGenerales?.totalPagadoTecnicos)}</td>
                    <td className="ad-money" style={{ color: '#dd6b20' }}>-{formatearPeso(c.estadisticasGenerales?.totalCostoRepuestos)}</td>
                    <td className="ad-money" style={{ color: '#38a169', fontWeight: 'bold' }}>{formatearPeso(c.estadisticasGenerales?.gananciaNeta)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="ad-btn-sm" onClick={() => setModalTecnicos(c)}>
                          Ver Técnicos
                        </button>
                        <button className="ad-btn-sm" onClick={() => setModalRepuestos(c)}>
                          Ver Repuestos
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalTecnicos && (
        <Modal
          titulo={`Detalles de Técnicos - ${formatearFecha(modalTecnicos.fechaCierre)}`}
          onClose={() => setModalTecnicos(null)}
          footer={
            <button className="btn btn-secondary" onClick={() => setModalTecnicos(null)}>Cerrar</button>
          }
        >
          {(!modalTecnicos.detalleTecnicos || modalTecnicos.detalleTecnicos.length === 0) ? (
             <p>No hubo actividad de técnicos en este día.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {modalTecnicos.detalleTecnicos.map(t => (
                <div key={t.id} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '16px', color: '#2d3748' }}>🧑‍🔧 {t.nombre}</strong>
                    <span className="ad-badge blue">{t.serviciosCompletados} servicio(s)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: '#718096' }}>Ganancia Técnico: </span>
                      <strong className="ad-money">{formatearPeso(t.ganancias)}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#718096' }}>Repuestos Usados: </span>
                      <strong>{t.repuestos?.reduce((acc, r) => acc + r.cantidad, 0) || 0}</strong>
                    </div>
                  </div>
                  {t.repuestos && t.repuestos.length > 0 && (
                     <div style={{ marginTop: '10px', fontSize: '13px', borderTop: '1px solid #edf2f7', paddingTop: '8px' }}>
                       <span style={{ color: '#a0aec0', display: 'block', marginBottom: '4px' }}>Detalle de repuestos:</span>
                       {t.repuestos.map((r, i) => (
                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span>{r.icono} {r.nombre} × {r.cantidad}</span>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {modalRepuestos && (
        <Modal
          titulo={`Detalles de Repuestos - ${formatearFecha(modalRepuestos.fechaCierre)}`}
          onClose={() => setModalRepuestos(null)}
          footer={
            <button className="btn btn-secondary" onClick={() => setModalRepuestos(null)}>Cerrar</button>
          }
        >
          {(!modalRepuestos.detalleRepuestos || modalRepuestos.detalleRepuestos.length === 0) ? (
             <p>No se utilizaron repuestos en este día.</p>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1, padding: '12px', background: '#fff5f5', borderRadius: '8px', border: '1px solid #fed7d7' }}>
                  <div style={{ fontSize: '12px', color: '#c53030', marginBottom: '4px' }}>Costo Total Reposición</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#9b2c2c' }}>
                    {formatearPeso(modalRepuestos.estadisticasGenerales?.totalCostoRepuestos || 0)}
                  </div>
                </div>
                <div style={{ flex: 1, padding: '12px', background: '#f0fff4', borderRadius: '8px', border: '1px solid #c6f6d5' }}>
                  <div style={{ fontSize: '12px', color: '#2f855a', marginBottom: '4px' }}>Ganancia de Repuestos</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#276749' }}>
                    {formatearPeso(
                      (modalRepuestos.detalleRepuestos.reduce((acc, r) => acc + r.ventaTotal, 0)) -
                      (modalRepuestos.estadisticasGenerales?.totalCostoRepuestos || 0)
                    )}
                  </div>
                </div>
              </div>

              <table className="ad-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Cant.</th>
                    <th>Costo</th>
                    <th>Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {modalRepuestos.detalleRepuestos.map((r, i) => (
                    <tr key={i}>
                      <td>{r.icono} <strong>{r.nombre}</strong></td>
                      <td>{r.cantidad}</td>
                      <td className="ad-money">{formatearPeso(r.costoTotal)}</td>
                      <td className="ad-money">{formatearPeso(r.ventaTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
