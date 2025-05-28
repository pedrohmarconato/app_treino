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

## ⚠️ Problemas comuns em produção (Vercel/Netlify)

- **404 Not Found em arquivos estáticos:**
  - Sempre use caminhos relativos (./styles.css, ./app.js, ./js/templates/index.js, ./favicon.png) no HTML.
- **Erro de módulos ES:**
  - Scripts que usam import/export devem ser carregados com `<script type="module">`.
- **Variáveis do Supabase:**
  - No ambiente de produção, use variáveis de ambiente do Vercel/Netlify para SUPABASE_URL e SUPABASE_ANON_KEY.
  - Gere o arquivo `config.js` dinamicamente no build/deploy, nunca versionando chaves sensíveis.
- **Exemplo de configuração no Vercel:**
  - Adicione SUPABASE_URL e SUPABASE_ANON_KEY em Settings > Environment Variables.
  - Use um script de build para gerar `config.js` automaticamente a partir dessas variáveis.

Se tiver dúvidas, consulte a documentação da plataforma ou peça ajuda aqui!

## Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript (ES6+)
- Supabase para backend e banco de dados
- Chart.js para visualizações (se implementado)

## Conexão com o Banco de Dados

A aplicação já está configurada para se conectar ao Supabase utilizando as credenciais fornecidas no arquivo `.env`.
Não é necessário realizar nenhuma configuração adicional.
