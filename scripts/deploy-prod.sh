#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Deploy Production — ceciliagortari-site
# Documentos del Proyecto (R2 + D1)
# ============================================

BUCKET_NAME="ceciliagortari-projects"
D1_DB_NAME="gestionproyectos"
MIGRATION_FILE="migrations/0001_project_documents.sql"

echo ""
echo "=========================================="
echo "  DEPLOY PRODUCCION - ceciliagortari-site"
echo "=========================================="
echo ""

# --- Paso 1: Verificar bucket R2 ---
echo "[1/5] Verificando bucket R2 '$BUCKET_NAME'..."
if npx wrangler r2 bucket list 2>/dev/null | grep -q "$BUCKET_NAME"; then
    echo "  -> Bucket '$BUCKET_NAME' ya existe. OK"
else
    echo "  -> Bucket NO encontrado."
    read -p "  ¿Crear bucket '$BUCKET_NAME'? (s/N): " confirm
    if [[ "$confirm" =~ ^[sS]$ ]]; then
        npx wrangler r2 bucket create "$BUCKET_NAME"
        echo "  -> Bucket creado."
    else
        echo "  -> Saltando. ATENCION: El upload de documentos NO va a funcionar sin el bucket."
    fi
fi
echo ""

# --- Paso 2: Migración D1 ---
echo "[2/5] Verificando tabla 'project_documents' en D1 remoto..."
TABLE_EXISTS=$(npx wrangler d1 execute "$D1_DB_NAME" \
    --command="SELECT name FROM sqlite_master WHERE type='table' AND name='project_documents'" \
    --remote --json 2>/dev/null | grep -c "project_documents" || true)

if [ "$TABLE_EXISTS" -gt 0 ]; then
    echo "  -> Tabla 'project_documents' ya existe. OK"
else
    echo "  -> Tabla NO encontrada."
    read -p "  ¿Ejecutar migración '$MIGRATION_FILE' en remoto? (s/N): " confirm
    if [[ "$confirm" =~ ^[sS]$ ]]; then
        npx wrangler d1 execute "$D1_DB_NAME" --file="$MIGRATION_FILE" --remote
        echo "  -> Migración ejecutada."
    else
        echo "  -> Saltando. ATENCION: Los endpoints de documentos NO van a funcionar sin la tabla."
    fi
fi
echo ""

# --- Paso 3: Build ---
echo "[3/5] Instalando dependencias y buildeando..."
npm ci
npm run build
echo "  -> Build completo."
echo ""

# --- Paso 4: Deploy ---
echo "[4/5] Deploying a Cloudflare Pages..."
read -p "  ¿Ejecutar deploy ahora? (s/N): " confirm
if [[ "$confirm" =~ ^[sS]$ ]]; then
    npm run deploy:pages
    echo "  -> Deploy completo."
else
    echo "  -> Saltando deploy. Podes ejecutar manualmente: npm run deploy:pages"
fi
echo ""

# --- Paso 5: Recordatorio de bindings ---
echo "[5/5] RECORDATORIO IMPORTANTE"
echo ""
echo "  Si usas Git Integration (GitHub → Cloudflare Pages auto-deploy),"
echo "  verificá que los bindings estén en el Dashboard:"
echo ""
echo "    Dashboard → Workers & Pages → ceciliagortari-site → Settings → Functions → Bindings"
echo ""
echo "    Debe haber:"
echo "      - D1 Database:  DB → gestionproyectos"
echo "      - R2 Bucket:    PROJECTS_BUCKET → ceciliagortari-projects"
echo ""
echo "  Si usas 'wrangler pages deploy' (CLI), los bindings de wrangler.toml"
echo "  se aplican automaticamente. No necesitas hacer nada extra."
echo ""
echo "=========================================="
echo "  DEPLOY FINALIZADO"
echo "=========================================="
echo ""
echo "Verificar:"
echo "  curl -s https://ceciliagortari.com.ar/api/projects | head -c 100"
echo "  curl -s https://ceciliagortari.com.ar/api/projects/P-0001/documents"
echo ""
