-- Script para popular a tabela d_calendario com dados
-- Execute após criar a tabela d_calendario

-- Inserir dados para o ano de 2025 (pode ajustar conforme necessário)
WITH calendario_dados AS (
  SELECT 
    date_serie as data_completa,
    EXTRACT(YEAR FROM date_serie) as ano,
    EXTRACT(MONTH FROM date_serie) as mes,
    EXTRACT(DAY FROM date_serie) as dia,
    CASE 
      WHEN EXTRACT(DOW FROM date_serie) = 0 THEN 7 -- Domingo = 7
      ELSE EXTRACT(DOW FROM date_serie) -- Segunda=1, Terça=2, etc.
    END as dia_semana,
    EXTRACT(WEEK FROM date_serie) as semana_ano
  FROM generate_series(
    '2025-01-01'::date, 
    '2025-12-31'::date, 
    '1 day'::interval
  ) as date_serie
)
INSERT INTO d_calendario (
  data_completa, 
  ano, 
  mes, 
  dia, 
  dia_semana, 
  semana_ano,
  eh_semana_ativa
)
SELECT 
  data_completa,
  ano,
  mes,
  dia,
  dia_semana,
  semana_ano,
  TRUE as eh_semana_ativa
FROM calendario_dados
ON CONFLICT (data_completa) DO NOTHING;

-- Verificar quantos registros foram inseridos
SELECT COUNT(*) as total_registros_calendario FROM d_calendario;

-- Mostrar algumas amostras
SELECT * FROM d_calendario 
WHERE data_completa BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY data_completa;

SELECT 'Calendário populado com sucesso!' as resultado;