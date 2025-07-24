#!/bin/sh
set -e

# Quick runner for CLImmander
TMPDIR=$(mktemp -d)
cd "$TMPDIR"

# Download the latest code from GitHub
curl -fsSL https://github.com/genZrizzCode/CLImmander/archive/refs/heads/main.zip -o climmander.zip
unzip -q climmander.zip
cd CLImmander-main

# Install dependencies (production only)
npm install --omit=dev --no-audit --no-fund

# Run the CLI with any arguments passed to the script
node cli.js "$@"
