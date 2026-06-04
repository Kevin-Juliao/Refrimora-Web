import { useEffect, useState, useRef } from 'react';

const THEMES = [
  { id: 'dark', name: 'Dark Space', color: '#1f65ff', bg: '#06101e', text: '🌌' },
  { id: 'light', name: 'Light Ice', color: '#2563eb', bg: '#f1f5f9', text: '☀️' },
  { id: 'sunset', name: 'Sunset Gold', color: '#f97316', bg: '#160a0a', text: '🌅' },
  { id: 'forest', name: 'Emerald Forest', color: '#10b981', bg: '#081a11', text: '🌲' },
  { id: 'indigo', name: 'Midnight Indigo', color: '#8b5cf6', bg: '#110b24', text: '🔮' }
];

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Eliminar todas las clases de tema previas
    document.body.classList.remove('light-theme', 'sunset-theme', 'forest-theme', 'indigo-theme');
    
    // Aplicar la clase correspondiente si no es el tema oscuro por defecto
    if (currentTheme !== 'dark') {
      document.body.classList.add(`${currentTheme}-theme`);
    }
    
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  // Cerrar el panel al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <div className={`theme-switcher-container ${isOpen ? 'open' : ''}`} ref={containerRef}>
      <button 
        className="theme-switcher-trigger" 
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Cambiar Estilo Visual"
        title="Cambiar Estilo Visual"
      >
        <span className="current-theme-icon">
          {currentThemeObj.text}
        </span>
      </button>
      
      <div className="theme-options-panel">
        <div className="theme-panel-header">Seleccionar Tema</div>
        {THEMES.map(theme => (
          <button
            key={theme.id}
            className={`theme-option-btn ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => {
              setCurrentTheme(theme.id);
              setIsOpen(false);
            }}
            title={theme.name}
            style={{ '--theme-dot-color': theme.color }}
          >
            <span className="theme-dot"></span>
            <span className="theme-option-emoji">{theme.text}</span>
            <span className="theme-option-name">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
