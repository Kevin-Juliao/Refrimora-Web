import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatContext } from '../../context/ChatContext';
import { useApp, normalizarRol } from '../../context/AppContext';

export default function ChatPanel() {
  const {
    conversaciones,
    mensajes,
    conversacionSeleccionada,
    cargando,
    chatOpen,
    unreadTotal,
    setChatOpen,
    seleccionarConversacion,
    enviarMensaje,
    crearChatConCliente,
    eliminarMensaje
  } = useContext(ChatContext);

  const { usuario, cliente, clientes } = useApp() || {};
  
  const [texto, setTexto] = useState('');
  const [buscarCliente, setBuscarCliente] = useState('');
  const [vista, setVista] = useState('chats'); // 'chats' o 'contactos' (solo para secretaria)
  
  const msgEndRef = useRef(null);
  const location = useLocation();
  const pathsSinChat = ['/', '/login', '/registro'];

  const currentUserId = usuario ? usuario.id : (cliente ? cliente.id : null);
  const currentUserRole = usuario ? normalizarRol(usuario.rol) : (cliente ? 'cliente' : null);

  useEffect(() => {
    if (msgEndRef.current) {
      msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes]);

  useEffect(() => {
    setVista('chats');
  }, [currentUserId]);

  if (pathsSinChat.includes(location.pathname)) return null;
  if (!currentUserId) return null; // No logueado

  const handleSend = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    const enviado = await enviarMensaje(texto);
    if (enviado) {
      setTexto('');
    }
  };

  const handleCreateChat = async (clId) => {
    await crearChatConCliente(clId);
    setVista('chats');
  };

  // Filtrar clientes para que la secretaria inicie chats
  const clientesFiltrados = (clientes || []).filter(c => 
    c.nombre.toLowerCase().includes(buscarCliente.toLowerCase()) ||
    c.documentoIdentidad.includes(buscarCliente)
  );

  return (
    <>
      {/* Botón flotante del chat */}
      <button 
        className="chat-toggle-btn"
        onClick={() => setChatOpen(!chatOpen)}
        title="Abrir Chat Refrimora"
        aria-label="Abrir Chat"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        {unreadTotal > 0 && <span className="chat-badge">{unreadTotal}</span>}
      </button>

      {/* Panel Desplizable */}
      <div className={`chat-side-panel ${chatOpen ? 'open' : ''}`}>
        
        {/* Cabecera del Panel */}
        <div className="chat-panel-header">
          <div className="chat-header-title">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '8px' }}>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span>Centro de Mensajería</span>
          </div>
          <button className="chat-close-btn" onClick={() => { setChatOpen(false); seleccionarConversacion(null); }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* CONTENIDO DEL PANEL */}
        {conversacionSeleccionada ? (
          /* VISTA: CHAT INDIVIDUAL */
          <div className="chat-view-container">
            <div className="chat-view-header">
              <button className="chat-back-btn" onClick={() => seleccionarConversacion(null)}>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Atrás</span>
              </button>
              <div className="chat-title-info">
                <div className="chat-active-name">{conversacionSeleccionada.nombre}</div>
                {conversacionSeleccionada.servicioId && (
                  <span className="chat-service-label">Orden #{conversacionSeleccionada.servicioId}</span>
                )}
              </div>
            </div>

            {/* Listado de Mensajes */}
            <div className="chat-messages-area">
              {mensajes.length === 0 ? (
                <div className="chat-empty-state">
                  <p>No hay mensajes en este chat. ¡Envía el primero!</p>
                </div>
              ) : (
                mensajes.map((m) => {
                  const esMio = (m.remitenteRol === 'cliente' && currentUserRole === 'cliente' && m.remitenteId === currentUserId) ||
                                (m.remitenteRol !== 'cliente' && currentUserRole !== 'cliente' && m.remitenteId === currentUserId);
                  
                  return (
                    <div key={m.id} className={`chat-message-row ${esMio ? 'self' : 'other'}`}>
                      <div className="chat-bubble">
                        {!esMio && <div className="chat-bubble-sender">{m.remitenteNombre}</div>}
                        <div className="chat-bubble-text">{m.contenido}</div>
                        <div className="chat-bubble-footer">
                          <span className="chat-bubble-time">
                            {new Date(m.fechaEnvio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {esMio && (
                            <button 
                              className="chat-delete-msg-btn"
                              onClick={() => {
                                if (window.confirm('¿Seguro que deseas eliminar este mensaje?')) {
                                  eliminarMensaje(m.id);
                                }
                              }}
                              title="Eliminar mensaje"
                            >
                              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={msgEndRef} />
            </div>

            {/* Input de Envío */}
            <form onSubmit={handleSend} className="chat-input-form">
              <input
                type="text"
                placeholder="Escribe tu mensaje..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={1000}
                required
              />
              <button type="submit" className="chat-send-btn" disabled={!texto.trim()}>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        ) : (
          /* VISTA: LISTADO DE CHATS / CONTACTOS */
          <div className="chat-list-container">
            {/* Tabs para secretaria */}
            {currentUserRole === 'secretaria' && (
              <div className="chat-tabs-header">
                <button 
                  className={`chat-tab-btn ${vista === 'chats' ? 'active' : ''}`}
                  onClick={() => setVista('chats')}
                >
                  Chats ({conversaciones.length})
                </button>
                <button 
                  className={`chat-tab-btn ${vista === 'contactos' ? 'active' : ''}`}
                  onClick={() => setVista('contactos')}
                >
                  Clientes
                </button>
              </div>
            )}

            {!(currentUserRole === 'secretaria' && vista === 'contactos') ? (
              /* SUBVISTA: LISTA DE CONVERSACIONES */
              <div className="chat-rooms-list">
                {conversaciones.length === 0 ? (
                  <div className="chat-empty-state">
                    <p>No tienes chats activos.</p>
                    {currentUserRole === 'secretaria' && (
                      <button className="chat-btn-primary" onClick={() => setVista('contactos')}>
                        Buscar un cliente
                      </button>
                    )}
                  </div>
                ) : (
                  conversaciones.map((c) => (
                    <div 
                      key={c.id} 
                      className="chat-room-item"
                      onClick={() => seleccionarConversacion(c)}
                    >
                      <div className="chat-room-info">
                        <div className="chat-room-name-row">
                          <span className="chat-room-name">{c.nombre}</span>
                          {c.lastMessage && (
                            <span className="chat-room-time">
                              {new Date(c.lastMessage.fechaEnvio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="chat-room-msg-row">
                          <span className="chat-room-snippet">
                            {c.lastMessage ? (
                              <>
                                <strong>{c.lastMessage.senderName}: </strong>
                                {c.lastMessage.contenido}
                              </>
                            ) : (
                              <span className="chat-no-msg">Sin mensajes aún</span>
                            )}
                          </span>
                          {c.unreadCount > 0 && (
                            <span className="chat-room-unread-badge">{c.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* SUBVISTA: SELECCIÓN DE CLIENTE (SOLO SECRETARIA) */
              <div className="chat-contacts-list">
                <div className="chat-search-bar">
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre o cédula..."
                    value={buscarCliente}
                    onChange={(e) => setBuscarCliente(e.target.value)}
                  />
                </div>
                <div className="chat-contacts-scroll">
                  {clientesFiltrados.length === 0 ? (
                    <div className="chat-empty-state">
                      <p>No se encontraron clientes.</p>
                    </div>
                  ) : (
                    clientesFiltrados.map((c) => (
                      <div 
                        key={c.id} 
                        className="chat-contact-item"
                        onClick={() => handleCreateChat(c.id)}
                      >
                        <div className="chat-contact-initial">
                          {c.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="chat-contact-info">
                          <div className="chat-contact-name">{c.nombre}</div>
                          <div className="chat-contact-details">Doc: {c.documentoIdentidad} | Tel: {c.telefono}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
