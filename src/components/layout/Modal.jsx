export function Modal({ id, titulo, children, footer, onClose }) {
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;