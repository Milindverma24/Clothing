#!/usr/bin/env bash
# ==============================================================================
# Gracefully stop all platform services
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$PROJECT_ROOT/start.sh" stop
