# 🔒 Política de Segurança - App Treino

## 🛡️ Versões Suportadas

Use esta seção para informar sobre quais versões do App Treino estão atualmente sendo suportadas com atualizações de segurança.

| Versão | Suportada |
| ------ | --------- |
| 5.6.x  | ✅ Sim    |
| 5.5.x  | ✅ Sim    |
| 5.4.x  | ❌ Não    |
| < 5.4  | ❌ Não    |

## 🚨 Reportando uma Vulnerabilidade

A segurança do App Treino é levada muito a sério. Agradecemos seus esforços para divulgar responsavelmente suas descobertas.

### 📧 Como Reportar

**Para vulnerabilidades críticas ou sensíveis**, por favor **NÃO** use issues públicas do GitHub.

**Contato Seguro:**

- 📧 Email: pedrohenriquemarconato@gmail.com
- 🔐 Assunto: `[SECURITY] Vulnerabilidade no App Treino`

### 📋 Informações Necessárias

Inclua o máximo de informações possível para nos ajudar a entender a natureza e o escopo do problema:

**Informações Básicas:**

- Tipo de problema (ex: buffer overflow, SQL injection, cross-site scripting, etc.)
- Localização completa do código-fonte relacionado ao problema
- Configuração especial necessária para reproduzir o problema
- Instruções passo-a-passo para reproduzir o problema
- Prova de conceito ou código de exploit (se possível)
- Impacto do problema, incluindo como um atacante pode explorar o problema

**Contexto Técnico:**

- Versão afetada
- Sistema operacional
- Browser/ambiente
- Configuração da aplicação

### ⚡ Processo de Resposta

1. **Confirmação (24 horas)**: Confirmamos o recebimento da vulnerabilidade
2. **Avaliação (72 horas)**: Avaliamos e confirmamos a vulnerabilidade
3. **Plano (1 semana)**: Desenvolvemos um plano de correção
4. **Correção (variável)**: Implementamos e testamos a correção
5. **Divulgação**: Divulgamos a correção e creditamos o descobridor

### 🏆 Reconhecimento

Contribuidores que reportam vulnerabilidades responsavelmente serão:

- Creditados publicamente (se desejado)
- Listados em nosso hall da fama de segurança
- Reconhecidos nas notas de release

## 🔐 Melhores Práticas de Segurança

### Para Usuários

**Configuração Segura:**

- Use sempre HTTPS
- Mantenha credenciais seguras
- Use senhas fortes
- Ative autenticação de dois fatores quando disponível

**Dados Pessoais:**

- Não compartilhe informações sensíveis
- Revise regularmente dados armazenados
- Use a funcionalidade de exclusão de dados quando necessário

### Para Desenvolvedores

**Desenvolvimento Seguro:**

- Sempre validar entrada do usuário
- Usar prepared statements para queries de banco
- Implementar CSP (Content Security Policy)
- Manter dependências atualizadas
- Realizar code review focado em segurança

**Secrets e Configuração:**

```bash
# ❌ Não fazer
const API_KEY = "sk-1234567890abcdef";

# ✅ Fazer
const API_KEY = process.env.SUPABASE_API_KEY;
```

## 🛠️ Recursos de Segurança Implementados

### Autenticação e Autorização

- ✅ Autenticação via Supabase
- ✅ Row Level Security (RLS)
- ✅ JWT tokens seguros
- ✅ Validação de permissões

### Proteção de Dados

- ✅ Criptografia em trânsito (HTTPS)
- ✅ Criptografia em repouso (Supabase)
- ✅ Validação de entrada
- ✅ Sanitização de dados

### Infraestrutura

- ✅ Headers de segurança
- ✅ CSP configurado
- ✅ CORS apropriado
- ✅ Rate limiting

### Monitoramento

- ✅ Logs de segurança
- ✅ Monitoramento de anomalias
- ✅ Alertas automáticos

## 🚩 Vulnerabilidades Conhecidas

Atualmente não há vulnerabilidades conhecidas não corrigidas.

### Histórico de Vulnerabilidades

| Data | Severidade | Descrição                               | Status |
| ---- | ---------- | --------------------------------------- | ------ |
| -    | -          | Nenhuma vulnerabilidade reportada ainda | -      |

## 📚 Recursos de Segurança

### Educacionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Ferramentas

- [Snyk](https://snyk.io/) - Verificação de vulnerabilidades
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Auditoria de dependências
- [GitHub Security Advisories](https://github.com/advisories)

## 🔄 Atualizações de Segurança

### Notificações

- Issues de segurança são marcadas com label `security`
- Releases de segurança são marcadas como `Security Release`
- Usuários são notificados via GitHub Releases

### Aplicação de Patches

1. **Crítica**: Correção imediata (< 24h)
2. **Alta**: Correção urgente (< 72h)
3. **Média**: Próximo release menor (< 1 semana)
4. **Baixa**: Próximo release regular (< 1 mês)

## 🤝 Colaboração

### Programa de Bug Bounty

Atualmente não temos um programa formal de bug bounty, mas reconhecemos e agradecemos contribuições de segurança.

### Pesquisadores de Segurança

Encorajamos pesquisadores de segurança a:

- Testar versões locais
- Reportar responsavelmente
- Trabalhar conosco na correção
- Aguardar divulgação pública até correção

## 📞 Contato de Emergência

Para problemas críticos de segurança que requerem atenção imediata:

📧 **Email de Emergência**: pedrohenriquemarconato@gmail.com
🚨 **Assunto**: `[URGENT SECURITY] - Descrição breve`

---

**A segurança é responsabilidade de todos. Obrigado por nos ajudar a manter o App Treino seguro! 🔒**
