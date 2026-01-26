# Cómo desplegar Cloudflare Pages + Functions

Este documento detalla los pasos para realizar un deploy manual garantizando que suban tanto el contenido estático (`dist/`) como las **Functions** (`functions/`).

> [!WARNING]
> Si arrastras solo la carpeta `dist` al dashboard de Cloudflare, **LAS FUNCTIONS NO SE SUBIRÁN** y los previews de redes sociales no funcionarán.

## Requisitos previos

1.  Node.js instalado.
2.  Cuenta de Cloudflare.

## Pasos de Deploy (Recomendado: CLI)

1.  **Instalar dependencias y buildear:**
    ```bash
    npm ci
    npm run build
    ```

2.  **Login en Cloudflare (solo la primera vez):**
    ```bash
    npx wrangler login
    ```
    (Se abrirá el navegador para autorizar).

3.  **Ejecutar el Deploy:**
    **IMPORTANTE:** Ejecutar este comando desde la **RAÍZ** del proyecto (donde está `package.json`).
    
    ```bash
    npm run deploy:pages
    ```
    *O el comando directo:*
    ```bash
    npx wrangler pages deploy dist
    ```

    **¿Por qué funciona esto?**
    Al ejecutar `wrangler pages deploy dist` desde la raíz, Wrangler detecta automáticamente la carpeta `./functions` hermana de `dist` y la incluye en la subida.

## Alternativa: Git Integration (Dashboard)

Si conectas el repo a Cloudflare Pages via GitHub/GitLab:

1.  Ir a **Settings** > **Build & deployments** > **Build config**.
2.  Asegurarse de que:
    - **Root directory**: `/` (o dejarlo vacío). **NO poner `dist`**.
    - **Build command**: `npm run build`.
    - **Build output directory**: `dist`.
    
    *Nota: Si "Root directory" se setea en `dist`, Cloudflare buscará las functions dentro de `dist/functions`, lo cual no es correcto en este proyecto.*

## Verificación en Producción

Una vez finalizado el deploy, verificar que las functions estén activas para los bots.

**Comando de prueba (Simular Facebook/WhatsApp):**
```bash
curl -s -A "facebookexternalhit/1.1" "https://www.ceciliagortari.com.ar/prensa/detalle/?id=2026-01-26-solidaridad-alal-goya-despidos" | grep -E "og:title|og:image|<title>"
```

**Resultado Esperado:**
- `og:title` debe coincidir con el título de la nota (NO "Detalle de Prensa | Cecilia Gortari").
- `og:image` debe ser la imagen de la nota.

**Comando de prueba (www):**
```bash
curl -s -A "facebookexternalhit/1.1" "https://www.ceciliagortari.com.ar/prensa/detalle/?id=2026-01-26-solidaridad-alal-goya-despidos" | grep -E "og:title|og:image|<title>"
```
