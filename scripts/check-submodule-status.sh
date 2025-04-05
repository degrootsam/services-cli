#!/bin/sh

set -e

echo "🔍 Checking submodule status..."

dirty=$(git submodule foreach 'git fetch origin && git status -uno' | grep "behind" || true)

if [ -n "${dirty}" ]; then
	echo "❌ One or more submodules are behind their remote branches:"
	echo "${dirty}"
	echo "💡 Run: npm run update:projects"
	exit 1
fi

echo "✅ All submodules are up to date."
