#!/bin/bash

# JetBrains Prompt Writer - Setup Script
# Downloads external dependencies locally

set -e

echo "🚀 Setting up JetBrains Prompt Writer..."

# Create scripts directory
mkdir -p scripts/monaco/vs

# Download Tailwind CSS
echo "📦 Downloading Tailwind CSS..."
curl -sL "https://cdn.tailwindcss.com" -o scripts/tailwind.js

# Download Vue.js
echo "📦 Downloading Vue.js..."
curl -sL "https://unpkg.com/vue@3/dist/vue.global.js" -o scripts/vue.global.js

# Download Monaco Editor
echo "📦 Downloading Monaco Editor..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js" -o scripts/monaco/vs/loader.min.js

# Download Monaco Editor base files
echo "📦 Downloading Monaco Editor base..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.js" --create-dirs -o scripts/monaco/vs/editor/editor.main.js
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.css" -o scripts/monaco/vs/editor/editor.main.css
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.nls.js" -o scripts/monaco/vs/editor/editor.main.nls.js

# Download Monaco base files
echo "📦 Downloading Monaco base files..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/base/worker/workerMain.js" --create-dirs -o scripts/monaco/vs/base/worker/workerMain.js
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/base/common/worker/simpleWorker.nls.js" --create-dirs -o scripts/monaco/vs/base/common/worker/simpleWorker.nls.js

# Download Monaco language support for markdown
echo "📦 Downloading Monaco language support..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/basic-languages/markdown/markdown.js" --create-dirs -o scripts/monaco/vs/basic-languages/markdown/markdown.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "Files downloaded to ./scripts/"
echo "Run with: open index.html (or use a local server)"
