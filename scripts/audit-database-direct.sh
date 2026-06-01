#!/bin/bash

# Auditoria Direta: Consulta PostgreSQL vs Models
# Compara tabelas REAIS no banco com Models do código

set -e

echo "🔍 Auditoria Direta: PostgreSQL vs Models"
echo "=========================================="
echo ""

MODELS_DIR="backend/src/models"
REPORT_FILE="AUDIT-DATABASE-DIRECT.md"
DB_CONTAINER="chatia_postgres_dev"
DB_USER="chatia"
DB_NAME="chatia_dev"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "📋 [1/4] Consultando Tabelas REAIS no PostgreSQL..."
echo "-----------------------------------------------------"

# Consultar todas as tabelas no banco (exceto system tables e SequelizeMeta)
DB_TABLES=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename != 'SequelizeMeta'
ORDER BY tablename;
" 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao conectar ao banco de dados!${NC}"
    echo "Verifique se o container PostgreSQL está rodando:"
    echo "  docker ps | grep chatia_postgres_dev"
    exit 1
fi

DB_TABLES_ARRAY=()
DB_TABLES_COUNT=0

while IFS= read -r table; do
    if [ ! -z "$table" ]; then
        DB_TABLES_ARRAY+=("$table")
        DB_TABLES_COUNT=$((DB_TABLES_COUNT + 1))
        echo "  ✓ $table"
    fi
done <<< "$DB_TABLES"

echo ""
echo -e "${GREEN}Total de tabelas no banco: $DB_TABLES_COUNT${NC}"
echo ""

echo "📋 [2/4] Listando Models Sequelize..."
echo "---------------------------------------"

# Extrair nomes de tabelas dos models
MODELS=$(find $MODELS_DIR -name "*.ts" -type f ! -name "index.ts" 2>/dev/null)
MODEL_TABLES_ARRAY=()
MODEL_TABLES_MAP=()
MODELS_COUNT=0

for model_file in $MODELS; do
    # Extrair tableName se definido explicitamente
    TABLE_NAME=$(grep -oP "tableName:\s*['\"]([^'\"]+)['\"]" "$model_file" | grep -oP "['\"]([^'\"]+)['\"]" | tr -d "'\""  || true)

    # Se não tem tableName explícito, extrair nome da classe
    if [ -z "$TABLE_NAME" ]; then
        # Buscar @Table(
        CLASS_TABLE=$(grep -A 5 "@Table" "$model_file" | grep -oP "tableName:\s*['\"]([^'\"]+)['\"]" | grep -oP "['\"]([^'\"]+)['\"]" | tr -d "'\""  || true)

        if [ ! -z "$CLASS_TABLE" ]; then
            TABLE_NAME="$CLASS_TABLE"
        else
            # Fallback: nome do arquivo sem .ts
            BASE_NAME=$(basename "$model_file" .ts)
            TABLE_NAME="$BASE_NAME"
        fi
    fi

    if [ ! -z "$TABLE_NAME" ]; then
        MODEL_TABLES_ARRAY+=("$TABLE_NAME")
        MODEL_TABLES_MAP+=("$TABLE_NAME|$(basename $model_file)")
        MODELS_COUNT=$((MODELS_COUNT + 1))
        echo "  ✓ $TABLE_NAME ($(basename $model_file))"
    fi
done

echo ""
echo -e "${GREEN}Total de Models encontrados: $MODELS_COUNT${NC}"
echo ""

echo "📋 [3/4] Comparando Banco vs Código..."
echo "----------------------------------------"

# Tabelas no banco SEM model
TABLES_WITHOUT_MODEL=()
for db_table in "${DB_TABLES_ARRAY[@]}"; do
    HAS_MODEL=false

    for model_table in "${MODEL_TABLES_ARRAY[@]}"; do
        if [ "$db_table" = "$model_table" ]; then
            HAS_MODEL=true
            break
        fi
    done

    if [ "$HAS_MODEL" = false ]; then
        TABLES_WITHOUT_MODEL+=("$db_table")
        echo -e "  ${YELLOW}⚠️  Tabela '$db_table' no banco MAS sem model${NC}"
    fi
done

if [ ${#TABLES_WITHOUT_MODEL[@]} -eq 0 ]; then
    echo -e "  ${GREEN}✅ Todas as tabelas do banco têm models correspondentes${NC}"
fi

echo ""

# Models SEM tabela no banco
MODELS_WITHOUT_TABLE=()
for entry in "${MODEL_TABLES_MAP[@]}"; do
    model_table=$(echo "$entry" | cut -d'|' -f1)
    model_file=$(echo "$entry" | cut -d'|' -f2)

    HAS_TABLE=false

    for db_table in "${DB_TABLES_ARRAY[@]}"; do
        if [ "$db_table" = "$model_table" ]; then
            HAS_TABLE=true
            break
        fi
    done

    if [ "$HAS_TABLE" = false ]; then
        MODELS_WITHOUT_TABLE+=("$model_table|$model_file")
        echo -e "  ${YELLOW}⚠️  Model '$model_table' ($model_file) MAS sem tabela no banco${NC}"
    fi
done

if [ ${#MODELS_WITHOUT_TABLE[@]} -eq 0 ]; then
    echo -e "  ${GREEN}✅ Todos os models têm tabelas correspondentes no banco${NC}"
fi

echo ""
echo -e "Tabelas sem model: ${YELLOW}${#TABLES_WITHOUT_MODEL[@]}${NC}"
echo -e "Models sem tabela: ${YELLOW}${#MODELS_WITHOUT_TABLE[@]}${NC}"
echo ""

echo "📋 [4/4] Verificando Dados nas Tabelas Órfãs..."
echo "------------------------------------------------"

# Para cada tabela sem model, verificar se tem dados
TABLES_WITH_DATA=()
TABLES_EMPTY=()

for table in "${TABLES_WITHOUT_MODEL[@]}"; do
    ROW_COUNT=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null || echo "ERROR")

    if [ "$ROW_COUNT" = "ERROR" ]; then
        echo -e "  ${RED}⚠️  Erro ao contar registros em '$table'${NC}"
    elif [ "$ROW_COUNT" -gt 0 ]; then
        TABLES_WITH_DATA+=("$table|$ROW_COUNT")
        echo -e "  ${BLUE}📊 '$table' tem $ROW_COUNT registros${NC}"
    else
        TABLES_EMPTY+=("$table")
        echo -e "  ${GREEN}✓ '$table' está vazia (0 registros)${NC}"
    fi
done

echo ""

echo "📋 Gerando Relatório..."
echo "------------------------"

# Gerar relatório Markdown
cat > $REPORT_FILE << EOFMARKER
# Auditoria Direta: PostgreSQL vs Models

> **Data:** $(date +"%Y-%m-%d %H:%M:%S")
> **Banco:** $DB_NAME
> **Método:** Consulta direta ao PostgreSQL

---

## Resumo Executivo

| Métrica | Quantidade | Status |
|---------|-----------|--------|
| Tabelas no banco (PostgreSQL) | $DB_TABLES_COUNT | ℹ️ |
| Models no código (Sequelize) | $MODELS_COUNT | ℹ️ |
| **Tabelas SEM model** | **${#TABLES_WITHOUT_MODEL[@]}** | $([ ${#TABLES_WITHOUT_MODEL[@]} -eq 0 ] && echo "✅" || echo "⚠️") |
| **Models SEM tabela** | **${#MODELS_WITHOUT_TABLE[@]}** | $([ ${#MODELS_WITHOUT_TABLE[@]} -eq 0 ] && echo "✅" || echo "⚠️") |
| Tabelas órfãs com dados | ${#TABLES_WITH_DATA[@]} | $([ ${#TABLES_WITH_DATA[@]} -eq 0 ] && echo "✅" || echo "⚠️") |
| Tabelas órfãs vazias | ${#TABLES_EMPTY[@]} | ℹ️ |

---

## 🔴 Problema 1: Tabelas SEM Model

Tabelas que existem no banco de dados mas NÃO têm model Sequelize:

EOFMARKER

if [ ${#TABLES_WITHOUT_MODEL[@]} -gt 0 ]; then
    for table in "${TABLES_WITHOUT_MODEL[@]}"; do
        # Verificar se tem dados
        HAS_DATA=false
        ROW_COUNT=0

        for entry in "${TABLES_WITH_DATA[@]}"; do
            entry_table=$(echo "$entry" | cut -d'|' -f1)
            if [ "$entry_table" = "$table" ]; then
                HAS_DATA=true
                ROW_COUNT=$(echo "$entry" | cut -d'|' -f2)
                break
            fi
        done

        if [ "$HAS_DATA" = true ]; then
            echo "- ⚠️ **\`$table\`** - 📊 **$ROW_COUNT registros** (ATENÇÃO: tem dados!)" >> $REPORT_FILE
        else
            echo "- 🟢 \`$table\` - Vazia (0 registros, seguro remover)" >> $REPORT_FILE
        fi
    done
else
    echo "✅ Nenhuma tabela sem model" >> $REPORT_FILE
fi

cat >> $REPORT_FILE << EOFMARKER

---

## 🔴 Problema 2: Models SEM Tabela

Models que existem no código mas NÃO têm tabela no banco:

EOFMARKER

if [ ${#MODELS_WITHOUT_TABLE[@]} -gt 0 ]; then
    for entry in "${MODELS_WITHOUT_TABLE[@]}"; do
        model_table=$(echo "$entry" | cut -d'|' -f1)
        model_file=$(echo "$entry" | cut -d'|' -f2)
        echo "- ⚠️ **\`$model_table\`** (\`$model_file\`) - Migration não executada ou model não usado" >> $REPORT_FILE
    done
else
    echo "✅ Nenhum model sem tabela" >> $REPORT_FILE
fi

cat >> $REPORT_FILE << EOFMARKER

---

## 📊 Detalhes: Tabelas Órfãs com Dados

EOFMARKER

if [ ${#TABLES_WITH_DATA[@]} -gt 0 ]; then
    cat >> $REPORT_FILE << 'EOFMARKER2'
**ATENÇÃO:** Estas tabelas NÃO têm model mas contêm dados!

EOFMARKER2

    for entry in "${TABLES_WITH_DATA[@]}"; do
        table=$(echo "$entry" | cut -d'|' -f1)
        count=$(echo "$entry" | cut -d'|' -f2)
        echo "- **\`$table\`**: $count registros" >> $REPORT_FILE
    done

    cat >> $REPORT_FILE << 'EOFMARKER2'

**Recomendações:**
1. Criar model para estas tabelas se forem utilizadas
2. Investigar se dados são importantes antes de remover
3. Verificar se são usadas via queries SQL diretas

EOFMARKER2
else
    echo "✅ Nenhuma tabela órfã com dados" >> $REPORT_FILE
fi

cat >> $REPORT_FILE << EOFMARKER

---

## 📋 Lista Completa: Tabelas no Banco

EOFMARKER

for table in "${DB_TABLES_ARRAY[@]}"; do
    # Verificar se tem model
    HAS_MODEL=false
    for model_table in "${MODEL_TABLES_ARRAY[@]}"; do
        if [ "$table" = "$model_table" ]; then
            HAS_MODEL=true
            break
        fi
    done

    if [ "$HAS_MODEL" = true ]; then
        echo "- ✅ \`$table\` (tem model)" >> $REPORT_FILE
    else
        echo "- ⚠️ \`$table\` (SEM model)" >> $REPORT_FILE
    fi
done

cat >> $REPORT_FILE << EOFMARKER

---

## 📋 Lista Completa: Models no Código

EOFMARKER

for entry in "${MODEL_TABLES_MAP[@]}"; do
    model_table=$(echo "$entry" | cut -d'|' -f1)
    model_file=$(echo "$entry" | cut -d'|' -f2)

    # Verificar se tem tabela
    HAS_TABLE=false
    for db_table in "${DB_TABLES_ARRAY[@]}"; do
        if [ "$model_table" = "$db_table" ]; then
            HAS_TABLE=true
            break
        fi
    done

    if [ "$HAS_TABLE" = true ]; then
        echo "- ✅ \`$model_table\` (\`$model_file\`) - tem tabela" >> $REPORT_FILE
    else
        echo "- ⚠️ \`$model_table\` (\`$model_file\`) - SEM tabela" >> $REPORT_FILE
    fi
done

cat >> $REPORT_FILE << EOFMARKER

---

## Próximos Passos

### Para Tabelas SEM Model:

**Se tabela tem dados:**
1. Criar model Sequelize correspondente
2. Verificar se é usada via queries SQL diretas
3. Documentar propósito da tabela

**Se tabela está vazia:**
1. Verificar se é realmente necessária
2. Considerar criar migration de remoção (como ContactGroups)
3. Ou criar model se for necessária

### Para Models SEM Tabela:

1. Verificar se migration correspondente existe
2. Executar migrations pendentes: \`npm run db:migrate\`
3. Se migration não existe, criar uma
4. Ou remover model se não for usado

---

**Gerado em:** $(date +"%Y-%m-%d %H:%M:%S")
**Script:** scripts/audit-database-direct.sh
**PostgreSQL:** $DB_CONTAINER
**Database:** $DB_NAME
EOFMARKER

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Auditoria Direta concluída!${NC}"
echo "=========================================="
echo ""
echo "📄 Relatório gerado: $REPORT_FILE"
echo ""
echo "📊 Resumo:"
echo "  - Tabelas no banco: $DB_TABLES_COUNT"
echo "  - Models no código: $MODELS_COUNT"
echo "  - Tabelas sem model: ${#TABLES_WITHOUT_MODEL[@]}"
echo "  - Models sem tabela: ${#MODELS_WITHOUT_TABLE[@]}"
echo "  - Tabelas órfãs com dados: ${#TABLES_WITH_DATA[@]}"
echo "  - Tabelas órfãs vazias: ${#TABLES_EMPTY[@]}"
echo ""

if [ ${#TABLES_WITHOUT_MODEL[@]} -gt 0 ] || [ ${#MODELS_WITHOUT_TABLE[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Inconsistências encontradas. Revise o relatório.${NC}"

    if [ ${#TABLES_WITH_DATA[@]} -gt 0 ]; then
        echo -e "${RED}⚠️  ATENÇÃO: ${#TABLES_WITH_DATA[@]} tabela(s) órfã(s) com dados!${NC}"
    fi

    exit 1
else
    echo -e "${GREEN}✅ Banco e código 100% sincronizados!${NC}"
    exit 0
fi
