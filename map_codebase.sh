#!/bin/bash
echo "=== FILE TREE ===" > codebase_map.txt
find . -type f -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.git/*" -not -path "*/prisma/migrations/*" | sort >> codebase_map.txt

echo -e "\n=== LINE COUNTS ===" >> codebase_map.txt
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs wc -l | sort -rn >> codebase_map.txt

echo -e "\n=== TODOS ===" >> codebase_map.txt
grep -rn "TODO\|FIXME\|HACK\|NOTE:\|XXX\|PLACEHOLDER\|WIP\|coming soon\|not implemented\|stub\|dummy\|fake\|hardcoded\|temp\|temporary\|remove this\|delete this\|test data\|lorem ipsum" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.next . >> codebase_map.txt || true

echo -e "\n=== CONSOLE.LOGS ===" >> codebase_map.txt
grep -rn "console\.log\|console\.warn\|console\.error\|console\.debug" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next . >> codebase_map.txt || true

echo -e "\n=== ANY TYPES ===" >> codebase_map.txt
grep -rn ": any\|as any\|<any>" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next . >> codebase_map.txt || true

echo -e "\n=== EMPTY CATCH BLOCKS ===" >> codebase_map.txt
grep -rn "catch.*{}" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules . >> codebase_map.txt || true

echo -e "\n=== HARDCODED URLS ===" >> codebase_map.txt
grep -rn "localhost\|127\.0\.0\.1\|http://\|https://calor\|hardcoded" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next . >> codebase_map.txt || true

echo -e "\n=== MISSING IMPORTS ===" >> codebase_map.txt
grep -rn "from '@/" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules . | awk -F"'" '{print $2}' | sort | uniq >> codebase_map.txt || true

echo -e "\n=== ENV VARS ===" >> codebase_map.txt
grep -rn "process\.env\." --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules . | grep -o "process\.env\.[A-Z_]*" | sort | uniq >> codebase_map.txt || true

echo -e "\n=== UNUSED EXPORTS ===" >> codebase_map.txt
npx ts-prune >> codebase_map.txt || true

echo -e "\n=== PAGE ROUTES ===" >> codebase_map.txt
find ./app -name "page.tsx" | sort >> codebase_map.txt

echo -e "\n=== API ROUTES ===" >> codebase_map.txt
find ./app/api -name "route.ts" | sort >> codebase_map.txt

echo -e "\n=== SERVER ACTIONS ===" >> codebase_map.txt
grep -rn "'use server'\|\"use server\"" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules . | awk -F: '{print $1}' | sort | uniq >> codebase_map.txt || true

echo -e "\n=== CLIENT COMPONENTS ===" >> codebase_map.txt
grep -rn "'use client'\|\"use client\"" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules . | awk -F: '{print $1}' | sort | uniq >> codebase_map.txt || true
