/**
 * 💪 COMPONENTE DE ÍCONES DE GRUPOS MUSCULARES - Muscle Group Icon
 * 
 * FUNÇÃO: Renderizar ícones SVG dinâmicos para diferentes grupos musculares com suporte a variações visuais.
 * 
 * RESPONSABILIDADES:
 * - Exibir ícones específicos para cada grupo muscular (peito, costas, pernas, etc.)
 * - Suportar múltiplas variações visuais (primary, filled, outline)
 * - Permitir customização de tamanho, cor e efeitos visuais
 * - Fallback para emojis em casos especiais (cardio, folga)
 * - Aplicar efeitos visuais como drop-shadow e transições
 * - Validar entradas e tratar erros de carregamento de recursos
 * 
 * RECURSOS:
 * - Ícones SVG vetoriais para melhor qualidade em diferentes resoluções
 * - Sistema de variantes (primary, secondary, outline) para contextos diversos
 * - Labels opcionais para identificação textual
 * - Efeitos visuais responsivos (hover, focus)
 * - Tratamento de erros para recursos não encontrados
 * 
 * PARÂMETROS:
 * - grupo: string identificando o grupo muscular (ex: 'peito', 'costas')
 * - variant: tipo visual do ícone ('primary', 'filled', 'outline')
 * - size: tamanho em pixels (default: 64px)
 * - showLabel: boolean para exibir label textual
 * - className: classes CSS adicionais
 * 
 * INTEGRAÇÃO: Usado nos cards de treino, seletores de exercício e dashboards
 */

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