export function AvatarCliente({ nombre }) {
  return (
    <div className="td-cliente">
      <div className="avatar-sm">{nombre?.charAt(0)}</div>
      <span className="text-bold">{nombre}</span>
    </div>
  );
}

export default AvatarCliente;