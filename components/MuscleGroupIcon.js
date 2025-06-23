import muscleGroups from '../utils/muscleGroupIcons.js';

const MuscleGroupIcon = ({ 
  grupo, 
  variant = 'primary', 
  size = 64, 
  showLabel = false,
  className = '' 
}) => {
  const groupData = muscleGroups[grupo];
  
  if (!groupData) {
    console.warn(`Grupo muscular não encontrado: ${grupo}`);
    return null;
  }

  // Se for cardio ou folga, usar emoji
  if (!groupData.primary && groupData.icon) {
    return (
      <div 
        className={`muscle-icon-container ${className}`}
        style={{ 
          width: size, 
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.6,
          filter: `drop-shadow(0 0 10px ${groupData.color})`
        }}
      >
        <span>{groupData.icon}</span>
        {showLabel && <span className="muscle-label">{grupo}</span>}
      </div>
    );
  }

  // Determinar qual SVG usar
  const svgSrc = variant === 'primary' 
    ? groupData.primary 
    : groupData.variants?.[variant] || groupData.primary;

  return (
    <div 
      className={`muscle-icon-container ${className}`}
      style={{ position: 'relative', width: size, height: size }}
    >
      <img 
        src={svgSrc} 
        alt={`${grupo} - ${variant}`}
        width={size}
        height={size}
        className="muscle-icon"
        style={{
          filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))',
          transition: 'all 0.3s ease'
        }}
        onError={(e) => {
          console.error(`Erro ao carregar SVG: ${svgSrc}`);
          e.target.style.display = 'none';
        }}
      />
      {showLabel && (
        <span 
          className="muscle-label"
          style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#ffffff',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}
        >
          {grupo}
        </span>
      )}
    </div>
  );
};

export default MuscleGroupIcon;