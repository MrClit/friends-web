# Production Release Automation

Este documento describe cómo automatizar la subida a producción (merge develop → main y push).

## Opción 1: Script local (recomendado para uso frecuente)

### Uso

```bash
pnpm release:prod
```

### Qué hace

1. ✅ Verifica que no haya cambios no committeados
2. 📥 Fetch cambios recientes de origin
3. 🔄 Checkout a `main`
4. 📬 Pull `main` desde origin
5. 🔀 Merge `develop` en `main`
6. 📤 Push `main` a origin
7. Retorna a la rama original

### Ventajas

- ⚡ Rápido y local
- 🔍 Control total - ves exactamente qué ocurre
- 🆘 Si hay conflictos, el merge se aborta automáticamente
- 📊 Mejor para CI/CD chains locales

### En caso de error

Si el script falla por conflictos de merge:

```bash
git merge --abort      # Aborta el merge
git checkout develop   # Vuelve a tu rama original
# Resuelve los conflictos en develop y reintenta
```

---

## Opción 2: GitHub Actions (UI manual)

### Uso

1. Ve a **GitHub** → **Actions** → **Release to Production**
2. Click **Run workflow**
3. Selecciona la rama (por defecto `develop`)
4. Click **Run workflow**

### Qué hace

- Ejecuta el mismo flujo que el script local pero desde GitHub
- Genera logs públicos en GitHub Actions
- El deploy se dispara automáticamente después (si el push a main es exitoso)

### Ventajas

- 🌐 No necesitas estar en tu máquina local
- 📹 Registro histórico de releases en GitHub
- 🔐 Auditoría de quién hizo el release
- 🔄 Integración con otros workflows

---

## Flujo de Deploy Completo

```
1. Developer: pnpm release:prod (o GitHub Actions UI)
     ↓
2. Git: develop → main (merge y push)
     ↓
3. GitHub: push a main dispara workflow deploy.yml
     ↓
4. Linter + Tests + Build
     ↓
5. Deploy a GitHub Pages / Render / Tu servidor
```

---

## Configuración recomendada

En tu `.gitconfig` local (opcional, para no escribir credenciales):

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

Para usar SSH sin contraseña cada vez (recomendado):

```bash
ssh-keygen -t ed25519 -C "tu@email.com"
# Sigue los prompts y agrega la clave pública a GitHub
```

---

## Troubleshooting

### "You have uncommitted changes"
Commit o stash tus cambios antes de hacer release:
```bash
git add .
git commit -m "feat: descripción"
# O
git stash
```

### Conflicto de merge
Resolver en develop antes de hacer release:
```bash
git merge origin/main  # En develop
# Resuelve conflictos
git add .
git commit -m "merge: resolver conflictos con main"
pnpm release:prod      # Reintenta
```

### El workflow no se dispara
- Verifica que GitHub Actions esté habilitado en Settings → Actions
- Asegúrate que el workflow `deploy.yml` tenga `on: push: branches: [main]`

---

## Próximas mejoras

- [ ] Agregar tests pre-release en el script local
- [ ] Crear tags de version automáticos
- [ ] Generar release notes automáticamente
- [ ] Integrar con Slack/Discord para notificaciones
