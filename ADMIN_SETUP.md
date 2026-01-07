# Configuración del Panel de Administración (Sveltia CMS)

Para completar la activación del panel de administración en `/admin`, necesitas desplegar un Cloudflare Worker que maneje la autenticación con GitHub.

## 1. Desplegar el Worker de Autenticación

Usaremos `sveltia-cms-auth`.

1.  Ve al repositorio oficial: [https://github.com/sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth).
2.  Haz clic en el botón **"Deploy to Cloudflare Workers"** (si está disponible) o sigue estos pasos manuales:
    *   Clona el repositorio localmente.
    *   Ejecuta `npm install`.
    *   Ejecuta `npx wrangler deploy`.
3.  Una vez desplegado, obtén la URL de tu Worker (ej: `https://sveltia-cms-auth.tu-usuario.workers.dev`).

## 2. Crear OAuth App en GitHub

1.  Ve a [GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers).
2.  Haz clic en **"New OAuth App"**.
3.  Completa los datos:
    *   **Application Name**: `Cecilia Gortari CMS` (o lo que prefieras).
    *   **Homepage URL**: `https://ceciliagortari.com.ar` (tu dominio de producción).
    *   **Authorization callback URL**: `https://<TU_WORKER_URL>/callback`
        *   Reemplaza `<TU_WORKER_URL>` con la URL que obtuviste en el paso 1.
        *   Ejemplo: `https://sveltia-cms-auth.gonzalo.workers.dev/callback`
4.  Haz clic en **Register application**.
5.  Copia el **Client ID**.
6.  Genera un **Client Secret** y cópialo.

## 3. Configurar Variables en Cloudflare Worker

1.  Ve al dashboard de Cloudflare > Workers & Pages.
2.  Entra a tu worker `sveltia-cms-auth`.
3.  Ve a **Settings > Variables and Secrets**.
4.  Agrega las siguientes variables:
    *   `GITHUB_CLIENT_ID`: (Tu Client ID de GitHub)
    *   `GITHUB_CLIENT_SECRET`: (Tu Client Secret de GitHub) - **Usa el botón "Encrypt"**.
    *   `ALLOWED_DOMAINS`: `ceciliagortari.com.ar, *.ceciliagortari.com.ar, localhost` (es bueno incluir localhost para pruebas).

## 4. Actualizar `admin/config.yml`

1.  Abre el archivo `admin/config.yml` en este repositorio.
2.  Busca la línea:
    ```yaml
    base_url: https://PLACEHOLDER_WORKER_URL_HERE
    ```
3.  Reemplázala con la URL de tu Worker real:
    ```yaml
    base_url: https://sveltia-cms-auth.tu-usuario.workers.dev
    ```
4.  Guarda los cambios y haz commit/push.

## 5. Probar

1.  Ve a `https://ceciliagortari.com.ar/admin`.
2.  Deberías ver el botón de login.
3.  Haz clic, autoriza con GitHub, y deberías ver el panel de control.
