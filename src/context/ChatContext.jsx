import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useApp, normalizarRol } from './AppContext';
import { api } from '../api';

export const ChatContext = createContext(null);

// Generador programático de URI de datos WAV PCM
const generateWavDataUri = (tones) => {
  const sampleRate = 8000;
  let totalSamples = 0;
  tones.forEach(t => {
    totalSamples += sampleRate * (t.duration + t.gap);
  });
  
  const buffer = new Uint8Array(44 + totalSamples);
  const view = new DataView(buffer.buffer);
  
  // Escribir cabecera WAV
  buffer.set([82, 73, 70, 70], 0); // "RIFF"
  view.setUint32(4, 36 + totalSamples, true);
  buffer.set([87, 65, 86, 69], 8); // "WAVE"
  buffer.set([102, 109, 116, 32], 12); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true); // 8-bit
  buffer.set([100, 97, 116, 97], 36); // "data"
  view.setUint32(40, totalSamples, true);
  
  // Inicializar el búfer con silencio (128 para PCM de 8 bits)
  buffer.fill(128, 44);
  
  let currentOffset = 44;
  tones.forEach(tone => {
    const toneSamples = sampleRate * tone.duration;
    for (let i = 0; i < toneSamples; i++) {
      const t = i / sampleRate;
      const currentFreq = tone.slideTo 
        ? tone.frequency + (tone.slideTo - tone.frequency) * (i / toneSamples)
        : tone.frequency;
      
      let angle = 0;
      if (tone.type === 'triangle') {
        angle = 2 * Math.abs(2 * ((t * currentFreq) % 1) - 1) - 1;
      } else {
        angle = Math.sin(2 * Math.PI * currentFreq * t);
      }
      const decay = tone.decay ? Math.exp(-tone.decay * t) : 1.0;
      const sample = Math.round(128 + 127 * angle * decay * tone.volume);
      buffer[currentOffset + i] = sample;
    }
    currentOffset += sampleRate * (tone.duration + tone.gap);
  });
  
  // Convertir a Base64
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return "data:audio/wav;base64," + window.btoa(binary);
};

// Alerta de audio: Mensaje de chat (timbre suave usando Audio estándar)
const playChatSound = () => {
  try {
    const wav = generateWavDataUri([
      { frequency: 580, duration: 0.35, gap: 0.05, volume: 0.4, decay: 6, type: 'sine', slideTo: 880 }
    ]);
    const audio = new Audio(wav);
    audio.play().catch(e => console.warn('Audio play failed:', e));
  } catch (e) {
    console.error('Audio play error:', e);
  }
};

// Alerta de audio: Nueva solicitud de servicio web (alarma doble usando Audio estándar)
const playRequestSound = () => {
  try {
    const wav = generateWavDataUri([
      { frequency: 329.63, duration: 0.15, gap: 0.02, volume: 0.25, type: 'triangle' },
      { frequency: 440.00, duration: 0.25, gap: 0.05, volume: 0.25, type: 'triangle', decay: 4 }
    ]);
    const audio = new Audio(wav);
    audio.play().catch(e => console.warn('Audio play failed:', e));
  } catch (e) {
    console.error('Audio play error:', e);
  }
};

export function ChatProvider({ children }) {
  const { usuario, cliente, solicitudes, tecnicos, usuarios, clientes } = useApp() || {};

  const [conversaciones, setConversaciones] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
  const [conexion, setConexion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const selectedConvRef = useRef(null);
  selectedConvRef.current = conversacionSeleccionada;

  const chatOpenRef = useRef(false);
  chatOpenRef.current = chatOpen;

  const conversacionesRef = useRef([]);
  conversacionesRef.current = conversaciones;

  const conexionRef = useRef(null);
  conexionRef.current = conexion;

  const currentUserId = usuario?.id || cliente?.id;
  const currentUserRole = usuario ? normalizarRol(usuario.rol) : (cliente ? 'cliente' : null);

  const prevSolicitudesLength = useRef(0);

  // Cargar lista de conversaciones
  const cargarConversaciones = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await api.get('chat/conversaciones');
      setConversaciones(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando conversaciones:', e);
    }
  }, [currentUserId]);

  // Cargar mensajes de una conversación
  const cargarMensajes = useCallback(async (conversacionId) => {
    try {
      const data = await api.get(`chat/conversaciones/${conversacionId}/mensajes`);
      setMensajes(Array.isArray(data) ? data : []);

      // Actualizar contador de no leídos localmente
      setConversaciones(prev =>
        prev.map(c => c.id === conversacionId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (e) {
      console.error('Error cargando mensajes:', e);
    }
  }, []);

  // Monitorear solicitudes de servicio web para el rol de Secretaria
  useEffect(() => {
    if (currentUserRole === 'secretaria' && solicitudes) {
      if (prevSolicitudesLength.current !== 0 && solicitudes.length > prevSolicitudesLength.current) {
        playRequestSound();
      }
      prevSolicitudesLength.current = solicitudes.length;
    }
  }, [solicitudes, currentUserRole]);

  // Recargar conversaciones cuando las listas de usuarios/técnicos/clientes se actualizan en AppContext
  useEffect(() => {
    if (currentUserId) {
      cargarConversaciones();
    }
  }, [
    tecnicos?.length,
    usuarios?.length,
    clientes?.length,
    currentUserId,
    cargarConversaciones
  ]);

  const seleccionarConversacion = useCallback((conv) => {
    setConversacionSeleccionada(conv);
    if (conv) {
      cargarMensajes(conv.id);
    } else {
      setMensajes([]);
    }
  }, [cargarMensajes]);

  // Conectar/desconectar la conexión del Hub de SignalR con bucle de reintento de reconexión automática
  useEffect(() => {
    const token = usuario?.Token || cliente?.Token;
    if (!token) {
      const currentConn = conexionRef.current;
      if (currentConn) {
        currentConn.stop();
        setConexion(null);
      }
      setConversaciones([]);
      setConversacionSeleccionada(null);
      setMensajes([]);
      return;
    }

    // Cargar lista inicial de conversaciones
    cargarConversaciones();

    let isMounted = true;
    const host = window.location.hostname;
    const newConnection = new HubConnectionBuilder()
      .withUrl(`http://${host}:5213/hubs/chat`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    newConnection.on('RecibirMensaje', (msg) => {
      const isCurrentActive = chatOpenRef.current && selectedConvRef.current && selectedConvRef.current.id === msg.conversacionId;
      
      const isClientSender = msg.remitenteRol === 'cliente';
      const isClientReceiver = currentUserRole === 'cliente';
      const isSelf = (Number(msg.remitenteId) === Number(currentUserId)) && (isClientSender === isClientReceiver);

      console.log('SignalR RecibirMensaje:', {
        msgId: msg.id,
        remitenteRol: msg.remitenteRol,
        remitenteId: msg.remitenteId,
        currentUserRole,
        currentUserId,
        isSelf
      });

      // Reproducir sonido para todos los mensajes entrantes de otros
      if (!isSelf) {
        playChatSound();
      }

      // Si estamos viendo actualmente esta conversación, agregarla a la lista
      if (isCurrentActive) {
        setMensajes(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Notificar al backend que lo leímos
        api.post(`chat/conversaciones/${msg.conversacionId}/leer`).catch(() => { });
      }

      // Actualizar contadores de no leídos y último mensaje en una sola actualización de estado
      setConversaciones(prev => {
        const index = prev.findIndex(c => c.id === msg.conversacionId);

        if (index === -1) {
          // Si la conversación no está en la lista (ej. recién iniciada), forzar recarga
          cargarConversaciones();
          return prev;
        }

        const updated = [...prev];
        const existing = updated[index];

        const newUnreadCount = (!isSelf && !isCurrentActive)
          ? (existing.unreadCount || 0) + 1
          : (isCurrentActive ? 0 : (existing.unreadCount || 0));

        updated[index] = {
          ...existing,
          unreadCount: newUnreadCount,
          lastMessage: {
            id: msg.id,
            contenido: msg.contenido,
            fechaEnvio: msg.fechaEnvio,
            senderName: msg.remitenteNombre
          }
        };

        // Ordenar con el más reciente primero
        return updated.sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.fechaEnvio) : new Date(0);
          const dateB = b.lastMessage ? new Date(b.lastMessage.fechaEnvio) : new Date(0);
          return dateB - dateA;
        });
      });
    });

    const startConnection = async () => {
      try {
        await newConnection.start();
        if (isMounted) {
          console.log('SignalR connected successfully');
          setConexion(newConnection);
        }
      } catch (err) {
        console.error('SignalR connection failed, retrying in 5 seconds...', err);
        if (isMounted) {
          setTimeout(startConnection, 5000);
        }
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      newConnection.stop();
    };
  }, [usuario, cliente, cargarConversaciones, currentUserId, currentUserRole]);

  // Alternativa de sondeo (polling) para asegurar que los mensajes y salas se actualicen incluso sin WebSockets
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(async () => {
      // 1. Actualizar conversaciones
      try {
        const data = await api.get('chat/conversaciones');
        if (Array.isArray(data)) {
          // Reproducir sonido si el conteo total de no leídos aumenta cuando SignalR no está activo
          const currentConn = conexionRef.current;
          if (!currentConn || currentConn.state !== 'Connected') {
            const oldTotalUnread = conversacionesRef.current.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            const newTotalUnread = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            if (newTotalUnread > oldTotalUnread) {
              playChatSound();
            }
          }
          setConversaciones(data);
        }
      } catch (e) {
        console.error('Error polling conversations:', e);
      }

      // 2. Actualizar mensajes si hay una conversación seleccionada
      if (selectedConvRef.current) {
        const convId = selectedConvRef.current.id;
        try {
          const data = await api.get(`chat/conversaciones/${convId}/mensajes`);
          if (Array.isArray(data)) {
            setMensajes(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const newMessages = data.filter(m => !existingIds.has(m.id));

              if (newMessages.length > 0) {
                // Reproducir sonido de notificación si algún mensaje nuevo es de otro usuario
                const hasIncoming = newMessages.some(m => {
                  const isClientSender = m.remitenteRol === 'cliente';
                  const isClientReceiver = currentUserRole === 'cliente';
                  const isSelf = (Number(m.remitenteId) === Number(currentUserId)) && (isClientSender === isClientReceiver);
                  return !isSelf;
                });
                const currentConn = conexionRef.current;
                if (hasIncoming && (!currentConn || currentConn.state !== 'Connected')) {
                  playChatSound();
                }
                return data; // Reemplazar con la lista de mensajes fresca
              }
              return prev; // Sin cambios
            });
          }
        } catch (e) {
          console.error('Error polling messages:', e);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUserId, currentUserRole]);

  const enviarMensaje = async (contenido) => {
    if (!conversacionSeleccionada || !contenido.trim()) return false;

    if (!conexion || conexion.state !== 'Connected') {
      alert('El chat está desconectado. Intentando reconectar. Inténtalo de nuevo en unos segundos.');
      return false;
    }

    try {
      await conexion.invoke('EnviarMensaje', conversacionSeleccionada.id, contenido.trim());
      return true;
    } catch (e) {
      console.error('Error enviando mensaje por SignalR:', e);
      alert('Error al enviar el mensaje. Inténtalo de nuevo.');
      return false;
    }
  };

  const crearChatConCliente = async (clienteId) => {
    
    // Intentar buscar la conversación localmente primero
    const clienteObj = (clientes || []).find(c => Number(c.id) === Number(clienteId));
    if (clienteObj) {
      const existingConv = conversaciones.find(c => 
        c.tipo === 'privado' && 
        !c.servicioId && 
        c.nombre === clienteObj.nombre
      );

      if (existingConv) {
        seleccionarConversacion(existingConv);
        setChatOpen(true);
        return;
      }
    }

    try {
      setCargando(true);
      const nuevaConv = await api.post('chat/conversaciones', { clienteId });

      // Permitir que el Hub se una a este grupo también de forma segura sin abortar en desconexiones del hub
      if (conexion && conexion.state === 'Connected') {
        try {
          await conexion.invoke('UnirseAConversacion', nuevaConv.id);
        } catch (hubErr) {
          console.warn('Error joining SignalR group:', hubErr);
        }
      }

      await cargarConversaciones();

      // Forzar la selección de la conversación
      const mappedConv = {
        id: nuevaConv.id,
        nombre: (nuevaConv.tipo === 'privado' && !nuevaConv.servicioId && clienteObj) 
                  ? clienteObj.nombre 
                  : nuevaConv.nombre,
        tipo: nuevaConv.tipo,
        servicioId: nuevaConv.servicioId,
        unreadCount: 0,
        lastMessage: null
      };

      setConversaciones(prev => {
        if (prev.some(c => c.id === mappedConv.id)) return prev;
        return [mappedConv, ...prev];
      });

      seleccionarConversacion(mappedConv);
      setChatOpen(true);
    } catch (e) {
      console.error('Error al crear chat con cliente:', e);
    } finally {
      setCargando(false);
    }
  };

  const eliminarMensaje = async (mensajeId) => {
    try {
      await api.del('chat/mensajes', mensajeId);
      // Eliminar localmente
      setMensajes(prev => prev.filter(m => m.id !== mensajeId));
      cargarConversaciones();
    } catch (e) {
      console.error('Error al eliminar mensaje:', e);
    }
  };

  const unreadTotal = conversaciones.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <ChatContext.Provider value={{
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
      eliminarMensaje,
      cargarConversaciones
    }}>
      {children}
    </ChatContext.Provider>
  );
}
