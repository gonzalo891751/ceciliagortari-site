# ============================================
# Deploy Production — ceciliagortari-site
# Documentos del Proyecto (R2 + D1)
# ============================================

$ErrorActionPreference = "Stop"

$BUCKET_NAME = "ceciliagortari-projects"
$D1_DB_NAME = "gestionproyectos"
$MIGRATION_FILE = "migrations/0001_project_documents.sql"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY PRODUCCION - ceciliagortari-site" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# --- Paso 1: Verificar bucket R2 ---
Write-Host "[1/5] Verificando bucket R2 '$BUCKET_NAME'..." -ForegroundColor Yellow
$bucketList = npx wrangler r2 bucket list 2>$null
if ($bucketList -match $BUCKET_NAME) {
    Write-Host "  -> Bucket '$BUCKET_NAME' ya existe. OK" -ForegroundColor Green
} else {
    Write-Host "  -> Bucket NO encontrado." -ForegroundColor Red
    $confirm = Read-Host "  Crear bucket '$BUCKET_NAME'? (s/N)"
    if ($confirm -eq "s" -or $confirm -eq "S") {
        npx wrangler r2 bucket create $BUCKET_NAME
        Write-Host "  -> Bucket creado." -ForegroundColor Green
    } else {
        Write-Host "  -> Saltando. ATENCION: El upload de documentos NO va a funcionar sin el bucket." -ForegroundColor Red
    }
}
Write-Host ""

# --- Paso 2: Migración D1 ---
Write-Host "[2/5] Verificando tabla 'project_documents' en D1 remoto..." -ForegroundColor Yellow
try {
    $tableCheck = npx wrangler d1 execute $D1_DB_NAME --command="SELECT name FROM sqlite_master WHERE type='table' AND name='project_documents'" --remote --json 2>$null
    if ($tableCheck -match "project_documents") {
        Write-Host "  -> Tabla 'project_documents' ya existe. OK" -ForegroundColor Green
    } else {
        throw "not found"
    }
} catch {
    Write-Host "  -> Tabla NO encontrada o error al verificar." -ForegroundColor Red
    $confirm = Read-Host "  Ejecutar migracion '$MIGRATION_FILE' en remoto? (s/N)"
    if ($confirm -eq "s" -or $confirm -eq "S") {
        npx wrangler d1 execute $D1_DB_NAME --file=$MIGRATION_FILE --remote
        Write-Host "  -> Migracion ejecutada." -ForegroundColor Green
    } else {
        Write-Host "  -> Saltando. ATENCION: Los endpoints de documentos NO van a funcionar sin la tabla." -ForegroundColor Red
    }
}
Write-Host ""

# --- Paso 3: Build ---
Write-Host "[3/5] Instalando dependencias y buildeando..." -ForegroundColor Yellow
npm ci
npm run build
Write-Host "  -> Build completo." -ForegroundColor Green
Write-Host ""

# --- Paso 4: Deploy ---
Write-Host "[4/5] Deploying a Cloudflare Pages..." -ForegroundColor Yellow
$confirm = Read-Host "  Ejecutar deploy ahora? (s/N)"
if ($confirm -eq "s" -or $confirm -eq "S") {
    npm run deploy:pages
    Write-Host "  -> Deploy completo." -ForegroundColor Green
} else {
    Write-Host "  -> Saltando deploy. Podes ejecutar manualmente: npm run deploy:pages" -ForegroundColor Yellow
}
Write-Host ""

# --- Paso 5: Recordatorio de bindings ---
Write-Host "[5/5] RECORDATORIO IMPORTANTE" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Si usas Git Integration (GitHub -> Cloudflare Pages auto-deploy),"
Write-Host "  verifica que los bindings esten en el Dashboard:"
Write-Host ""
Write-Host "    Dashboard -> Workers & Pages -> ceciliagortari-site -> Settings -> Functions -> Bindings" -ForegroundColor White
Write-Host ""
Write-Host "    Debe haber:" -ForegroundColor White
Write-Host "      - D1 Database:  DB -> gestionproyectos" -ForegroundColor White
Write-Host "      - R2 Bucket:    PROJECTS_BUCKET -> ceciliagortari-projects" -ForegroundColor White
Write-Host ""
Write-Host "  Si usas 'wrangler pages deploy' (CLI), los bindings de wrangler.toml"
Write-Host "  se aplican automaticamente. No necesitas hacer nada extra."
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY FINALIZADO" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verificar:"
Write-Host "  curl -s https://ceciliagortari.com.ar/api/projects | Select-Object -First 1"
Write-Host "  curl -s https://ceciliagortari.com.ar/api/projects/P-0001/documents"
Write-Host ""
