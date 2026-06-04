import React, { useState } from 'react';
import { useApp, formatearPeso, formatearFecha } from '../../context/AppContext';
import Modal from '../../components/layout/Modal';

export default function CierreDiario() {
  const { historialCierres, finalizarJornada, servicios } = useApp();
  const [cierreSeleccionado, setCierreSeleccionado] = useState(null);
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
  const cierrePrincipal = cierreSeleccionado 
    ? (cierres.find(c => String(c.id) === String(cierreSeleccionado.id)) || cierreSeleccionado)
    : (cierres.find(c => String(c.id) === String(cierrePrincipalId)) || cierres[0]);
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

  // Helper function to extract or compute dynamic service type breakdown
  const getTiposServicios = (cierre, tec) => {
    if (tec.tiposServicios && tec.tiposServicios.length > 0) {
      return tec.tiposServicios;
    }
    
    // Fallback for historical closures: match services by partitioning them based on chronological closing order
    const closuresConTecnico = cierres
      .filter(c => c.detalleTecnicos?.some(t => Number(t.id) === Number(tec.id)))
      .sort((a, b) => Number(a.id) - Number(b.id));

    const serviciosCerradosDelTecnico = servicios
      .filter(s => Number(s.tecnicoId) === Number(tec.id) && (s.estado === 'cerrado' || s.estado === 'finalizado'))
      .sort((a, b) => Number(a.id) - Number(b.id));

    const idx = closuresConTecnico.findIndex(c => Number(c.id) === Number(cierre.id));
    if (idx === -1) return [];

    let startIdx = 0;
    for (let i = 0; i < idx; i++) {
      const prevCierre = closuresConTecnico[i];
      const prevTec = prevCierre.detalleTecnicos.find(t => Number(t.id) === Number(tec.id));
      startIdx += prevTec ? prevTec.serviciosCompletados : 0;
    }

    const currentTec = cierre.detalleTecnicos.find(t => Number(t.id) === Number(tec.id));
    const count = currentTec ? currentTec.serviciosCompletados : 0;

    const servs = serviciosCerradosDelTecnico.slice(startIdx, startIdx + count);
    
    const breakdown = {};
    servs.forEach(s => {
      if (Array.isArray(s.airesList) && s.airesList.length > 0) {
        s.airesList.forEach(a => {
          const tServ = a.tipoServicio || s.tipo || 'Otro';
          const formatted = tServ.charAt(0).toUpperCase() + tServ.slice(1);
          breakdown[formatted] = (breakdown[formatted] || 0) + 1;
        });
      } else {
        const tServ = s.tipo || 'Otro';
        const formatted = tServ.charAt(0).toUpperCase() + tServ.slice(1);
        breakdown[formatted] = (breakdown[formatted] || 0) + 1;
      }
    });
    
    return Object.entries(breakdown).map(([tipo, cant]) => ({ tipo, cantidad: cant }));
  };

  return (
    <div className="ad-section">
      <div className="ad-page-header">
        <div>
          <h2 className="ad-page-title">Cierres y Resúmenes Diarios</h2>
          <p className="ad-page-sub">Historial de jornadas laborales finalizadas.</p>
        </div>
        {!cierreSeleccionado && (
          <button className="ad-btn-main" onClick={handleFinalizar}>
            Finalizar Día Ahora
          </button>
        )}
      </div>

      {cierreSeleccionado && (
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            className="ad-btn-sm" 
            onClick={() => {
              setCierreSeleccionado(null);
              setComparando(false);
              setCierreComparadoId('');
            }}
            style={{ 
              background: 'rgba(78, 163, 255, 0.15)', 
              color: '#7ecfff', 
              border: '1px solid rgba(78, 163, 255, 0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px'
            }}
          >
            <span>←</span> Volver al Historial
          </button>
          <div>
            <h3 style={{ margin: 0, color: '#f3f7fb' }}>
              Mostrando Detalles: {formatearFecha(cierreSeleccionado.fechaCierre)}
            </h3>
            <span style={{ fontSize: '11px', color: '#7a96b8' }}>
              Cerrado a las {new Date(cierreSeleccionado.fechaHoraCierreReal).toLocaleTimeString('es-CO')}
            </span>
          </div>
        </div>
      )}

      {cierres.length > 0 && (
        <div className="ad-panel" style={{ marginBottom: 20 }}>
          <div className="ad-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3>Comparador de Ganancias Netas</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '12px', color: '#a0aec0' }}>Día 1:</span>
                <select 
                  value={cierrePrincipal ? String(cierrePrincipal.id) : ''}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    const found = cierres.find(c => String(c.id) === String(nextVal));
                    if (cierreSeleccionado) {
                      setCierreSeleccionado(found);
                    } else {
                      setCierrePrincipalId(nextVal);
                    }
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

      {/* Conditionally render details view or list view */}
      {cierreSeleccionado && cierrePrincipal ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Desglose Contable de la Jornada */}
          <div className="ad-panel">
            <div className="ad-panel-header">
              <h3>Desglose Contable del Día</h3>
            </div>
            <div className="ad-panel-body" style={{ padding: '24px' }}>
              <div className="cierre-accounting-grid">
                <div className="accounting-box">
                  <span className="box-label">Ingresos Totales</span>
                  <span className="box-val positive">{formatearPeso(cierrePrincipal.estadisticasGenerales?.totalIngresos)}</span>
                </div>
                <div className="accounting-box">
                  <span className="box-label">Pago a Técnicos</span>
                  <span className="box-val negative">-{formatearPeso(cierrePrincipal.estadisticasGenerales?.totalPagadoTecnicos)}</span>
                </div>
                <div className="accounting-box">
                  <span className="box-label">Costo de Repuestos</span>
                  <span className="box-val warning">-{formatearPeso(cierrePrincipal.estadisticasGenerales?.totalCostoRepuestos)}</span>
                </div>
                <div className="accounting-box highlight">
                  <span className="box-label">Ganancia Neta</span>
                  <span className="box-val net">{formatearPeso(cierrePrincipal.estadisticasGenerales?.gananciaNeta)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cierre-columns-grid">
            {/* Columna Izquierda: Actividad Técnicos */}
            <div className="cierre-column">
              <h4 className="column-title">🧑‍🔧 Actividad y Rendimiento de Técnicos</h4>
              {(!cierrePrincipal.detalleTecnicos || cierrePrincipal.detalleTecnicos.length === 0) ? (
                <div className="ad-panel" style={{ padding: 20, textAlign: 'center', color: '#7a96b8' }}>
                  No hubo actividad de técnicos en este día.
                </div>
              ) : (
                <div className="tec-cards-list">
                  {cierrePrincipal.detalleTecnicos.map(t => {
                    const breakdown = getTiposServicios(cierrePrincipal, t);
                    return (
                      <div key={t.id} className="tec-detail-card">
                        <div className="tec-card-header">
                          <div className="tec-info">
                            <span className="tec-avatar">🧑‍🔧</span>
                            <div>
                              <strong className="tec-name">{t.nombre}</strong>
                              <div className="tec-stats-sub">{t.serviciosCompletados} servicio(s) completado(s)</div>
                            </div>
                          </div>
                          <div className="tec-badge-ganancia">{formatearPeso(t.ganancias)}</div>
                        </div>

                        <div className="tec-card-body">
                          {breakdown && breakdown.length > 0 && (
                            <div className="service-breakdown-section">
                              <span className="section-subtitle">Servicios Realizados:</span>
                              <div className="service-pills-row">
                                {breakdown.map((sBreak, idx) => {
                                  let icon = '⚡';
                                  const tNorm = sBreak.tipo.toLowerCase();
                                  if (tNorm.includes('mantenimiento')) icon = '🔧';
                                  else if (tNorm.includes('reparacion') || tNorm.includes('reparación')) icon = '🛠️';
                                  else if (tNorm.includes('recarga')) icon = '❄️';
                                  else if (tNorm.includes('revision') || tNorm.includes('revisión')) icon = '📋';
                                  else if (tNorm.includes('instalacion') || tNorm.includes('instalación')) icon = '⚙️';
                                  
                                  return (
                                    <span key={idx} className="service-breakdown-pill">
                                      <span className="pill-icon">{icon}</span>
                                      <span className="pill-name">{sBreak.tipo}</span>
                                      <span className="pill-count">×{sBreak.cantidad}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {t.repuestos && t.repuestos.length > 0 && (
                            <div className="tec-repuestos-section">
                              <span className="section-subtitle">Repuestos Utilizados:</span>
                              <div className="tec-repuestos-list">
                                {t.repuestos.map((r, i) => (
                                  <div key={i} className="tec-repuesto-item">
                                    <span>{r.icono} {r.nombre}</span>
                                    <strong>× {r.cantidad}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Columna Derecha: Detalle Repuestos */}
            <div className="cierre-column">
              <h4 className="column-title">🔩 Consumo de Repuestos y Materiales</h4>
              {(!cierrePrincipal.detalleRepuestos || cierrePrincipal.detalleRepuestos.length === 0) ? (
                <div className="ad-panel" style={{ padding: 20, textAlign: 'center', color: '#7a96b8' }}>
                  No se utilizaron repuestos en este día.
                </div>
              ) : (
                <div className="ad-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, padding: '15px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                      <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costo Reposición</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fca5a5' }}>
                        {formatearPeso(cierrePrincipal.estadisticasGenerales?.totalCostoRepuestos || 0)}
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: '15px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <div style={{ fontSize: '11px', color: '#10b981', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ganancia de Repuestos</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6ee7b7' }}>
                        {formatearPeso(
                          (cierrePrincipal.detalleRepuestos.reduce((acc, r) => acc + r.ventaTotal, 0)) -
                          (cierrePrincipal.estadisticasGenerales?.totalCostoRepuestos || 0)
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ad-table-wrap">
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
                        {cierrePrincipal.detalleRepuestos.map((r, i) => (
                          <tr key={i}>
                            <td>{r.icono} <strong>{r.nombre}</strong></td>
                            <td>{r.cantidad}</td>
                            <td className="ad-money" style={{ color: '#ef4444' }}>{formatearPeso(r.costoTotal)}</td>
                            <td className="ad-money" style={{ color: '#10b981' }}>{formatearPeso(r.ventaTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Vista de Historial: Lista de Tarjetas */
        <div className="cierre-card-grid">
          {cierres.length === 0 ? (
            <div className="ad-panel" style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1', color: '#7a96b8' }}>
              No hay cierres registrados aún.
            </div>
          ) : (
            cierres.map(c => {
              const ganancia = c.estadisticasGenerales?.gananciaNeta || 0;
              const isPositive = ganancia >= 0;
              return (
                <div key={c.id} className="cierre-card">
                  <div className="cierre-card-header">
                    <div>
                      <strong className="cierre-date">{formatearFecha(c.fechaCierre)}</strong>
                      <div className="cierre-time">
                        Cerrado a las {new Date(c.fechaHoraCierreReal).toLocaleTimeString('es-CO')}
                      </div>
                    </div>
                    <span className={`cierre-badge-ganancia ${isPositive ? 'positive' : 'negative'}`}>
                      {formatearPeso(ganancia)}
                    </span>
                  </div>
                  
                  <div className="cierre-card-body">
                    <div className="cierre-stat-row">
                      <span className="stat-label">Ingresos Totales</span>
                      <span className="stat-value">{formatearPeso(c.estadisticasGenerales?.totalIngresos)}</span>
                    </div>
                    <div className="cierre-stat-row">
                      <span className="stat-label">Pago Técnicos</span>
                      <span className="stat-value text-red">-{formatearPeso(c.estadisticasGenerales?.totalPagadoTecnicos)}</span>
                    </div>
                    <div className="cierre-stat-row">
                      <span className="stat-label">Costo Repuestos</span>
                      <span className="stat-value text-orange">-{formatearPeso(c.estadisticasGenerales?.totalCostoRepuestos)}</span>
                    </div>
                  </div>

                  <div className="cierre-card-footer">
                    <button 
                      className="ad-btn-sm" 
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        background: 'rgba(78, 163, 255, 0.1)', 
                        color: '#7ecfff', 
                        border: '1px solid rgba(78, 163, 255, 0.2)',
                        padding: '10px 14px',
                        fontSize: '13px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => {
                        setCierreSeleccionado(c);
                        setCierrePrincipalId(String(c.id));
                      }}
                    >
                      Ver Detalles Completos
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
