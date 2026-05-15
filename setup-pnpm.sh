#!/usr/bin/env bash

set -euo pipefail

echo "Checking pnpm installation..."

if command -v pnpm >/dev/null 2>&1; then
  echo "pnpm found. Upgrading with pnpm self-update..."
  pnpm self-update
else
  echo "pnpm not found. Installing pnpm@latest-11 with npm..."
  npm install -g pnpm@latest-11
fi

echo "Installing dependencies with pnpm..."
pnpm install

echo "pnpm setup complete"
