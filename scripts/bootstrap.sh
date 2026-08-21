#!/usr/bin/env bash
#
# Bootstraps a fresh local dev environment for Obliq-io: checks required
# tooling versions, installs dependencies, and scaffolds the .env files from
# their .example templates (never overwriting ones that already exist).
#
# Usage: ./scripts/bootstrap.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}==>${NC} $1"; }
warn()  { echo -e "${YELLOW}!!${NC} $1"; }
fail()  { echo -e "${RED}xx${NC} $1"; exit 1; }

require_min_node_version() {
    local required_major=20
    if ! command -v node >/dev/null 2>&1; then
        fail "Node.js is not installed. Install Node.js ${required_major}+ from https://nodejs.org and re-run this script."
    fi
    local current_major
    current_major="$(node -p 'process.versions.node.split(".")[0]')"
    if [ "$current_major" -lt "$required_major" ]; then
        fail "Node.js ${required_major}+ required, found $(node --version). Upgrade and re-run."
    fi
    info "Node.js $(node --version) OK"
}

ensure_pnpm() {
    if command -v pnpm >/dev/null 2>&1; then
        info "pnpm $(pnpm --version) OK"
        return
    fi
    warn "pnpm not found -- installing via npm..."
    npm install -g pnpm
    info "pnpm $(pnpm --version) installed"
}

scaffold_env_file() {
    local example_path="$1"
    local target_path="$2"
    if [ -f "$target_path" ]; then
        info "$target_path already exists -- leaving it alone"
        return
    fi
    if [ ! -f "$example_path" ]; then
        warn "$example_path not found -- skipping"
        return
    fi
    cp "$example_path" "$target_path"
    info "Created $target_path from $example_path -- fill in real values before running the app"
}

main() {
    info "Bootstrapping Obliq-io dev environment..."
    echo ''

    require_min_node_version
    ensure_pnpm

    echo ''
    info "Installing workspace dependencies (pnpm install)..."
    pnpm install

    echo ''
    info "Scaffolding environment files..."
    scaffold_env_file "apps/web/.env.local.example" "apps/web/.env.local"
    scaffold_env_file "apps/api/.env.example" "apps/api/.env"

    echo ''
    info "Bootstrap complete. Next steps:"
    echo '    1. Fill in apps/web/.env.local and apps/api/.env with your Supabase project credentials.'
    echo '    2. Run the SQL files in supabase/migrations/ (in order) against your Supabase project.'
    echo '    3. Optionally: pnpm seed  (populates demo clients/tasks so the dashboard is not empty)'
    echo '    4. pnpm dev  (starts apps/web on :3000 and apps/api on :4000)'
}

main "$@"
