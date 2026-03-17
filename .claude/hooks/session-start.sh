#!/bin/bash
set -euo pipefail

# Install all dependencies for backend and frontend
cd "$CLAUDE_PROJECT_DIR"
npm run install-all
