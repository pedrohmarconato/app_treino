# 🌍 **Ambientes de Deploy**

## 📋 **Configuração de Ambientes**

### **🚀 PRODUÇÃO (Vercel)**
- **Branch**: `main`
- **URL**: `https://app-treino-juq6heua4-pmarconatos-projects.vercel.app`
- **Deploy**: Automático quando push na `main`
- **Uso**: Versão estável para uso real/chefe

### **🧪 TESTE (GitHub Pages)**
- **Branch**: `testing` 
- **URL**: `https://pedrohmarconato.github.io/app_treino`
- **Deploy**: Automático quando push na `testing`
- **Uso**: Experimentos e novos recursos

---

## 📱 **Workflow de Desenvolvimento**

### **1. Trabalhar em novas features:**
```bash
git checkout testing
# ... desenvolver nova feature ...
git add .
git commit -m "test: nova feature X"
git push origin testing
```

### **2. Testar no ambiente:**
- **Teste**: Acesse `https://pedrohmarconato.github.io/app_treino`
- **iPhone**: Compartilhar → Adicionar como PWA de teste

### **3. Promover para produção (quando estável):**
```bash
git checkout main
git merge testing
git push origin main
```

### **4. Deploy automático:**
- **Vercel** atualiza produção automaticamente
- **GitHub Pages** mantém ambiente de teste

---

## 🎯 **Cenários de Uso**

### **Para Experimentar:**
- Use branch `testing`
- Teste à vontade
- Quebrou? Só afeta teste

### **Para Entregar:**
- Merge para `main`
- Produção sempre estável
- Chefe vê versão confiável

### **Para Rollback:**
- Se algo quebrar em produção
- `git revert` na main
- Teste continua funcionando

---

## 📱 **URLs para iPhone**

### **Produção (Estável):**
`https://app-treino-juq6heua4-pmarconatos-projects.vercel.app`

### **Teste (Experimental):**
`https://pedrohmarconato.github.io/app_treino`

**Recomendação**: Instale ambas como PWAs diferentes no iPhone para comparar lado a lado.