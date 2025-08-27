#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório dist se não existir
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
    console.log('✅ Diretório dist criado');
}

// Copiar index.html para dist e atualizar o caminho do app.js
console.log('📄 Preparando index.html para produção...');
const indexPath = path.join(__dirname, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Substituir o caminho do app.js para a versão minificada
const updatedIndex = indexContent.replace(
    '<script type="module" src="./js/app.js"></script>',
    '<script type="module" src="./app.min.js"></script>'
);

// Salvar index.html atualizado
const distIndexPath = path.join(distDir, 'index.html');
fs.writeFileSync(distIndexPath, updatedIndex);
console.log('✅ index.html preparado para produção');

// Copiar outros arquivos essenciais para dist
const filesToCopy = [
    'config.js',
    'manifest.json',
    'favicon.png',
    'sw.js'
];

filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(distDir, file);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copiado: ${file}`);
    } else {
        console.warn(`⚠️  Arquivo não encontrado: ${file}`);
    }
});

// Função para copiar diretórios recursivamente
function copyRecursiveSync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    fs.readdirSync(src).forEach(file => {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        
        if (fs.statSync(srcFile).isDirectory()) {
            copyRecursiveSync(srcFile, destFile);
        } else {
            fs.copyFileSync(srcFile, destFile);
        }
    });
}

// Copiar diretórios essenciais
const dirsToCopy = ['icons', 'css', 'styles', 'templates', 'components', 'services', 'js', 'SVG_MUSCLE'];

dirsToCopy.forEach(dir => {
    const srcDir = path.join(__dirname, dir);
    const destDir = path.join(distDir, dir);
    
    if (fs.existsSync(srcDir)) {
        copyRecursiveSync(srcDir, destDir);
        console.log(`✅ Copiado diretório: ${dir}`);
    }
});

console.log('\n🚀 Build para produção concluído!');
console.log('📁 Arquivos prontos em ./dist/');