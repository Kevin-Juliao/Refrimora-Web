export function EstadoBadge({ estado }) {
  const mapa = {
    agendado:      { cls: 'badge-agendado',   txt: 'Agendado'      },
    'en-camino':   { cls: 'badge-camino',      txt: 'En Camino'     },
    'en-reparacion':{ cls: 'badge-reparacion', txt: 'En Reparación' },
    finalizado:    { cls: 'badge-finalizado',  txt: 'Completado'    },
    cancelado:     { cls: 'badge-cancelado',   txt: 'Cancelado'     },
  };
  const op = mapa[estado] || { cls: '', txt: estado };
  return <span className={`badge ${op.cls}`}>{op.txt}</span>;
}

export default EstadoBadge;