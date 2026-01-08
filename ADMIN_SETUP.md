# Configuración del Panel de Administración (Sveltia CMS)

Para activar el login en `/admin`, usamos **Cloudflare Pages Functions** (ya incluidas en la carpeta `functions/`). No necesitas desplegar un Worker separado.

## Headers y caché

El sitio usa el archivo `_headers` para definir headers en Cloudflare Pages (seguridad y políticas de caché para HTML y assets versionados).

## 1. Crear OAuth App en GitHub

1.  Ve a [GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers).
2.  Haz clic en **"New OAuth App"**.
3.  Completa los datos:
    *   **Application Name**: `Cecilia Gortari CMS`
    *   **Homepage URL**: `https://ceciliagortari.com.ar`
    *   **Authorization callback URL**: `https://ceciliagortari.com.ar/callback`
        *   *(Si usas un dominio de vista previa para probar, asegúrate de actualizar esto o agregar una nueva App)*.
4.  Haz clic en **Register application**.
5.  Copia el **Client ID**.
6.  Genera un **Client Secret** y cópialo.

## 2. Configurar Variables de Entorno en Cloudflare Pages

1.  Ve al dashboard de Cloudflare > Workers & Pages.
2.  Selecciona tu proyecto **ceciliagortari-site**.
3.  Ve a **Settings > Environment variables**.
4.  Agrega las siguientes variables (Prod y Preview):
    *   `GITHUB_CLIENT_ID`: (Tu Client ID de GitHub)
    *   `GITHUB_CLIENT_SECRET`: (Tu Client Secret de GitHub) - **Encrypt**.

## 3. Verificar `admin/config.yml`

El archivo ya está configurado para apuntar a la URL de producción:
```yaml
backend:
  name: github
  repo: gonzalo891751/ceciliagortari-site
  branch: main
  base_url: https://ceciliagortari.com.ar
  auth_endpoint: /auth
```

## 4. Probar

1.  Haz deploy de los cambios (push a main).
2.  Ve a `https://ceciliagortari.com.ar/admin`.
3.  Haz clic en "Login with GitHub".
