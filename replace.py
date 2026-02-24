import sys
import re

with open('d:/du-an/cdhc/cdhc-game-vite/src/modules/farming/screens/FarmingScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

with open('d:/du-an/cdhc/cdhc-game-vite/new_render.tsx', 'r', encoding='utf-8') as f:
    new_render = f.read()

match = re.search(r'  return \(\n\s*<div className="h-\[100dvh\]', content)

if match:
    new_content = content[:match.start()] + new_render
    with open('d:/du-an/cdhc/cdhc-game-vite/src/modules/farming/screens/FarmingScreen.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Replaced content successfully.')
else:
    print('Could not find match')
