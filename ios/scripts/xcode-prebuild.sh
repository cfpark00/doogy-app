#!/bin/bash

# Xcode Pre-Build Script
# This script runs before each build to ensure configuration is up to date

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the Google Client ID configuration script
"${SCRIPT_DIR}/set-google-client-id.sh"

echo "✅ Pre-build configuration complete"