# Aplicação de Treinamento

Uma aplicação web moderna para gerenciamento de protocolos de treinamento, com foco em progressão de carga e acompanhamento de desempenho.

## Funcionalidades

### Tela Inicial
- Seleção de usuário (Pedro/Japa) com avatars
- Métricas completas: treinos concluídos, progresso percentual, semana atual
- Cronograma: próximo treino, último treino realizado
- Botão de início de treino com design atrativo

### Tela de Treinamento
- Grupo muscular destacado no header
- Exercício atual com observações técnicas
- Séries fixas (não editáveis)
- Campos de peso/repetições com sugestões baseadas no 1RM
- Botão para finalizar série + temporizador automático

### Funcionalidades Extras
- **Sistema Inteligente**: Sugestões de peso baseadas na performance anterior
- **Temporizador**: Contagem regressiva visual durante o descanso
- **Acompanhamento**: Barra de progresso do treino e histórico de séries
- **Interface**: Design moderno com gradientes e efeitos visuais

## Como Executar

1. Clone este repositório para sua máquina local
2. Abra o arquivo `index.html` em seu navegador

```bash
# No Windows, você pode usar o comando:
start index.html

# No macOS:
open index.html

# No Linux:
xdg-open index.html
```

## Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript (ES6+)
- Supabase para backend e banco de dados
- Chart.js para visualizações (se implementado)

## Conexão com o Banco de Dados

A aplicação já está configurada para se conectar ao Supabase utilizando as credenciais fornecidas no arquivo `.env`.
Não é necessário realizar nenhuma configuração adicional.
