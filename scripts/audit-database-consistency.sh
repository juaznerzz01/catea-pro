#!/bin/bash

# Script de Auditoria: Consistência Código vs Banco de Dados
# Verifica se todas as tabelas usadas no código têm migrations correspondentes

set -e

echo "🔍 Auditoria de Consistência: Código vs Banco de Dados"
echo "========================================================"
echo ""

BACKEND_DIR="backend/src"
MIGRATIONS_DIR="backend/src/database/migrations"
MODELS_DIR="backend/src/models"
REPORT_FILE="AUDIT-CODE-VS-DATABASE.md"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 [1/6] Listando Models Sequelize..."
echo "-----------------------------------"

# Extrair nomes de tabelas dos models
MODELS=$(find $MODELS_DIR -name "*.ts" -type f ! -name "index.ts" 2>/dev/null)
MODEL_TABLES=()

for model in $MODELS; do
    # Extrair tableName se definido explicitamente
    TABLE_NAME=$(grep -oP "tableName:\s*['\"]([^'\"]+)['\"]" "$model" | grep -oP "['\"]([^'\"]+)['\"]" | tr -d "'\""  || true)

    # Se não tem tableName explícito, usar nome do arquivo (padrão Sequelize)
    if [ -z "$TABLE_NAME" ]; then
        BASE_NAME=$(basename "$model" .ts)
        # Sequelize pluraliza: User -> Users, Company -> Companies
        TABLE_NAME="$BASE_NAME"
    fi

    if [ ! -z "$TABLE_NAME" ]; then
        MODEL_TABLES+=("$TABLE_NAME|$model")
        echo "  ✓ $TABLE_NAME ($(basename $model))"
    fi
done

echo ""
echo "Total de Models encontrados: ${#MODEL_TABLES[@]}"
echo ""

echo "📋 [2/6] Listando Tabelas nas Migrations..."
echo "-------------------------------------------"

# Extrair CREATE TABLE das migrations
MIGRATION_TABLES=()
MIGRATIONS=$(find $MIGRATIONS_DIR -name "*.ts" -type f ! -name "*remove*" ! -name "*drop*" 2>/dev/null | sort)

for migration in $MIGRATIONS; do
    # Buscar createTable('NomeTabela'
    TABLES=$(grep -oP "createTable\(['\"]([^'\"]+)['\"]" "$migration" | grep -oP "['\"]([^'\"]+)['\"]" | tr -d "'\""  || true)

    for table in $TABLES; do
        MIGRATION_TABLES+=("$table|$(basename $migration)")
        echo "  ✓ $table ($(basename $migration))"
    done
done

echo ""
echo "Total de Tabelas criadas por Migrations: ${#MIGRATION_TABLES[@]}"
echo ""

echo "📋 [3/6] Buscando Queries SQL Diretas no Código..."
echo "---------------------------------------------------"

# Buscar queries diretas (potencial uso de tabelas não mapeadas)
DIRECT_QUERIES=()

# Buscar sequelize.query(
echo "  Buscando sequelize.query()..."
QUERY_FILES=$(grep -r "sequelize\.query\|queryInterface\.sequelize\.query" $BACKEND_DIR --include="*.ts" --include="*.js" -l 2>/dev/null || true)
for file in $QUERY_FILES; do
    COUNT=$(grep -c "sequelize\.query\|queryInterface\.sequelize\.query" "$file" || echo "0")
    if [ "$COUNT" -gt 0 ]; then
        DIRECT_QUERIES+=("$file|$COUNT queries")
        echo "    ⚠️  $file ($COUNT ocorrências)"
    fi
done

# Buscar queryInterface.rawSelect
echo "  Buscando queryInterface.rawSelect()..."
RAW_SELECT_FILES=$(grep -r "queryInterface\.rawSelect\|queryInterface\.bulkInsert\|queryInterface\.bulkUpdate" $BACKEND_DIR --include="*.ts" -l 2>/dev/null || true)
for file in $RAW_SELECT_FILES; do
    if [[ ! " ${DIRECT_QUERIES[@]} " =~ " ${file} " ]]; then
        COUNT=$(grep -c "rawSelect\|bulkInsert\|bulkUpdate" "$file" || echo "0")
        DIRECT_QUERIES+=("$file|$COUNT raw operations")
        echo "    ⚠️  $file ($COUNT operações raw)"
    fi
done

echo ""
echo "Total de arquivos com queries diretas: ${#DIRECT_QUERIES[@]}"
echo ""

echo "📋 [4/6] Buscando Referências a Tabelas em Strings..."
echo "------------------------------------------------------"

# Buscar strings que parecem nomes de tabelas (CamelCase típico de Sequelize)
echo "  Buscando padrões de nomes de tabelas..."

# Tabelas conhecidas do sistema (da auditoria anterior)
KNOWN_TABLES=(
    "Users" "Companies" "Settings" "Whatsapps" "Contacts" "Tickets"
    "Messages" "Queues" "Tags" "Plans" "TicketTags" "QueueIntegrations"
    "ContactCustomFields" "Schedules" "Campaigns" "CampaignContacts"
    "Announcements" "ChatFlow" "ChatMessages" "Invoices" "Subscriptions"
    "CompaniesSettings" "Integrations" "ApiConfigs" "ApiMessages"
    "AutoReply" "QuickMessages" "TicketNotes" "UserQueues"
    "Baileys" "BaileysKeys" "DialogflowConfig" "FacebookIntegrations"
    "FilesOptions" "Helps" "LogTickets" "PromptOpenAi" "QuickAnswers"
    "RatingsOptions" "ScheduledMessages" "StatusChatEnd" "TagIntegrations"
    "TicketsTraking" "TicketEvaluations" "UserRating" "WebHooks"
)

MISSING_IN_CODE=()

for table in "${KNOWN_TABLES[@]}"; do
    # Buscar referências no código (exceto migrations e models)
    REFS=$(grep -r "\"$table\"\|'$table'\|\`$table\`" $BACKEND_DIR \
        --include="*.ts" \
        --exclude-dir=migrations \
        --exclude-dir=models \
        -c 2>/dev/null | grep -v ":0$" || true)

    if [ -z "$REFS" ]; then
        MISSING_IN_CODE+=("$table")
    fi
done

if [ ${#MISSING_IN_CODE[@]} -gt 0 ]; then
    echo "  ⚠️  Tabelas com poucas/nenhuma referência no código:"
    for table in "${MISSING_IN_CODE[@]}"; do
        echo "    - $table"
    done
else
    echo "  ✅ Todas as tabelas têm referências no código"
fi

echo ""
echo "Tabelas com baixa referência: ${#MISSING_IN_CODE[@]}"
echo ""

echo "📋 [5/6] Comparando Models vs Migrations..."
echo "--------------------------------------------"

# Verificar models sem migration
MODELS_WITHOUT_MIGRATION=()
for model_entry in "${MODEL_TABLES[@]}"; do
    TABLE=$(echo "$model_entry" | cut -d'|' -f1)

    # Verificar se existe migration criando essa tabela
    HAS_MIGRATION=false
    for migration_entry in "${MIGRATION_TABLES[@]}"; do
        MIGRATION_TABLE=$(echo "$migration_entry" | cut -d'|' -f1)
        if [ "$TABLE" = "$MIGRATION_TABLE" ]; then
            HAS_MIGRATION=true
            break
        fi
    done

    if [ "$HAS_MIGRATION" = false ]; then
        MODELS_WITHOUT_MIGRATION+=("$TABLE")
        echo "  ⚠️  Model '$TABLE' NÃO tem migration correspondente"
    fi
done

if [ ${#MODELS_WITHOUT_MIGRATION[@]} -eq 0 ]; then
    echo "  ✅ Todos os models têm migrations correspondentes"
fi

echo ""

# Verificar migrations sem model
MIGRATIONS_WITHOUT_MODEL=()
for migration_entry in "${MIGRATION_TABLES[@]}"; do
    TABLE=$(echo "$migration_entry" | cut -d'|' -f1)

    # Verificar se existe model para essa tabela
    HAS_MODEL=false
    for model_entry in "${MODEL_TABLES[@]}"; do
        MODEL_TABLE=$(echo "$model_entry" | cut -d'|' -f1)
        if [ "$TABLE" = "$MODEL_TABLE" ]; then
            HAS_MODEL=true
            break
        fi
    done

    if [ "$HAS_MODEL" = false ]; then
        MIGRATIONS_WITHOUT_MODEL+=("$TABLE|$(echo $migration_entry | cut -d'|' -f2)")
        echo "  ⚠️  Tabela '$TABLE' criada por migration MAS sem model"
    fi
done

if [ ${#MIGRATIONS_WITHOUT_MODEL[@]} -eq 0 ]; then
    echo "  ✅ Todas as migrations têm models correspondentes"
fi

echo ""
echo "Models sem migration: ${#MODELS_WITHOUT_MIGRATION[@]}"
echo "Migrations sem model: ${#MIGRATIONS_WITHOUT_MODEL[@]}"
echo ""

echo "📋 [6/6] Gerando Relatório..."
echo "------------------------------"

# Gerar relatório Markdown
cat > $REPORT_FILE << 'EOFMARKER'
# Auditoria: Consistência Código vs Banco de Dados

> **Data:** $(date +"%Y-%m-%d %H:%M")
> **Objetivo:** Verificar se todas as tabelas usadas no código têm migrations correspondentes

---

## Resumo Executivo

EOFMARKER

# Adicionar resumo
cat >> $REPORT_FILE << EOFMARKER

| Métrica | Quantidade | Status |
|---------|-----------|--------|
| Models encontrados | ${#MODEL_TABLES[@]} | ℹ️ |
| Tabelas em Migrations | ${#MIGRATION_TABLES[@]} | ℹ️ |
| Models SEM migration | ${#MODELS_WITHOUT_MIGRATION[@]} | $([ ${#MODELS_WITHOUT_MIGRATION[@]} -eq 0 ] && echo "✅" || echo "⚠️") |
| Migrations SEM model | ${#MIGRATIONS_WITHOUT_MODEL[@]} | $([ ${#MIGRATIONS_WITHOUT_MODEL[@]} -eq 0 ] && echo "✅" || echo "⚠️") |
| Arquivos com queries diretas | ${#DIRECT_QUERIES[@]} | ℹ️ |
| Tabelas com baixa referência | ${#MISSING_IN_CODE[@]} | $([ ${#MISSING_IN_CODE[@]} -eq 0 ] && echo "✅" || echo "⚠️") |

---

## 1. Models vs Migrations

### Models SEM Migration Correspondente
EOFMARKER

if [ ${#MODELS_WITHOUT_MIGRATION[@]} -gt 0 ]; then
    for table in "${MODELS_WITHOUT_MIGRATION[@]}"; do
        echo "- ⚠️ **$table** - Model existe mas migration não foi encontrada" >> $REPORT_FILE
    done
else
    echo "✅ Todos os models têm migrations correspondentes" >> $REPORT_FILE
fi

cat >> $REPORT_FILE << EOFMARKER

### Migrations SEM Model Correspondente
EOFMARKER

if [ ${#MIGRATIONS_WITHOUT_MODEL[@]} -gt 0 ]; then
    for entry in "${MIGRATIONS_WITHOUT_MODEL[@]}"; do
        TABLE=$(echo "$entry" | cut -d'|' -f1)
        MIGRATION=$(echo "$entry" | cut -d'|' -f2)
        echo "- ⚠️ **$TABLE** - Criada por \`$MIGRATION\` mas sem model" >> $REPORT_FILE
    done
else
    echo "✅ Todas as migrations têm models correspondentes" >> $REPORT_FILE
fi

cat >> $REPORT_FILE << EOFMARKER

---

## 2. Queries SQL Diretas

Arquivos que usam queries SQL diretas (potencial uso de tabelas não mapeadas):

EOFMARKER

if [ ${#DIRECT_QUERIES[@]} -gt 0 ]; then
    for entry in "${DIRECT_QUERIES[@]}"; do
        FILE=$(echo "$entry" | cut -d'|' -f1)
        INFO=$(echo "$entry" | cut -d'|' -f2)
        echo "- \`$FILE\` - $INFO" >> $REPORT_FILE
    done
else
    echo "✅ Nenhuma query SQL direta encontrada" >> $REPORT_FILE
fi

cat >> $REPORT_FILE << EOFMARKER

---

## 3. Tabelas com Baixa Referência no Código

Tabelas que existem mas têm poucas/nenhuma referência no código:

EOFMARKER

if [ ${#MISSING_IN_CODE[@]} -gt 0 ]; then
    for table in "${MISSING_IN_CODE[@]}"; do
        echo "- \`$table\` - Pouquíssimas referências (possível tabela não utilizada)" >> $REPORT_FILE
    done
else
    echo "✅ Todas as tabelas têm referências adequadas no código" >> $REPORT_FILE
fi

cat >> $REPORT_FILE << EOFMARKER

---

## Próximos Passos Recomendados

### Se houver Models sem Migration:
1. Verificar se model está realmente em uso
2. Criar migration retroativa se necessário
3. Ou remover model se não for usado

### Se houver Migrations sem Model:
1. Verificar se tabela é usada via queries diretas
2. Criar model se tabela for utilizada
3. Ou remover tabela se não for usada (como ContactGroups)

### Para Queries Diretas:
1. Revisar cada arquivo listado
2. Verificar se tabelas mencionadas têm models
3. Considerar criar models para facilitar manutenção

---

**Gerado em:** $(date +"%Y-%m-%d %H:%M:%S")
**Script:** scripts/audit-database-consistency.sh
EOFMARKER

echo ""
echo "========================================================"
echo -e "${GREEN}✅ Auditoria concluída!${NC}"
echo "========================================================"
echo ""
echo "📄 Relatório gerado: $REPORT_FILE"
echo ""
echo "📊 Resumo:"
echo "  - Models: ${#MODEL_TABLES[@]}"
echo "  - Migrations: ${#MIGRATION_TABLES[@]}"
echo "  - Models sem migration: ${#MODELS_WITHOUT_MIGRATION[@]}"
echo "  - Migrations sem model: ${#MIGRATIONS_WITHOUT_MODEL[@]}"
echo "  - Arquivos com queries diretas: ${#DIRECT_QUERIES[@]}"
echo "  - Tabelas com baixa referência: ${#MISSING_IN_CODE[@]}"
echo ""

if [ ${#MODELS_WITHOUT_MIGRATION[@]} -gt 0 ] || [ ${#MIGRATIONS_WITHOUT_MODEL[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Inconsistências encontradas. Revise o relatório.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Nenhuma inconsistência crítica encontrada!${NC}"
    exit 0
fi
