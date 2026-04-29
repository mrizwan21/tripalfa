import re

# 1. Fix mockData.ts - add role to mock Agent
filepath = 'src/data/mockData.ts'
with open(filepath, 'r') as f:
    content = f.read()

if 'role:' not in content.split('export const agent')[0]:
    content = re.sub(
        r"(export\s+const\s+agent\s*=\s*\{[^}]*?currency:\s*[\'\"][^\'\"]*[\'\"],)",
        r"\1\n  role: 'Admin',",
        content,
        flags=re.DOTALL
    )
with open(filepath, 'w') as f:
    f.write(content)
print('Fixed mockData.ts')

# 2. Fix MarkupPage.tsx - import MarkupRuleType
filepath = 'src/pages/MarkupPage.tsx'
with open(filepath, 'r') as f:
    content = f.read()
if 'MarkupRuleType' not in content.split('from')[0]:
    content = content.replace(
        "import type { MarkupRule, SalesChannel } from '../types';",
        "import type { MarkupRule, MarkupRuleType, SalesChannel } from '../types';"
    )
with open(filepath, 'w') as f:
    f.write(content)
print('Fixed MarkupPage.tsx import')

# 3. Fix FlightResultCard.tsx - optional chain duration
filepath = 'src/components/FlightResultCard.tsx'
with open(filepath, 'r') as f:
    content = f.read()
content = content.replace('seg.duration', "seg.duration ?? ''")
with open(filepath, 'w') as f:
    f.write(content)
print('Fixed FlightResultCard.tsx')

# 4. Fix AuthorisationWorkspace.tsx
filepath = 'src/pages/AuthorisationWorkspace.tsx'
with open(filepath, 'r') as f:
    content = f.read()

if 'const RefreshCcw' in content:
    content = re.sub(r'const\s+RefreshCcw\s*=\s*[^;]+;', '', content)
    if 'RefreshCcw' not in content.split("from 'lucide-react'")[0]:
        content = re.sub(
            r"(import\s*\{[^}]*)(\}\s*from\s*['\"]lucide-react['\"];)",
            r'\1, RefreshCcw \2',
            content
        )

content = re.sub(r'<svg[^>]*size=\{(\d+)\}[^>]*/?>', r'<RefreshCcw size={\1} />', content)
with open(filepath, 'w') as f:
    f.write(content)
print('Fixed AuthorisationWorkspace.tsx')

# 5. Fix FlightPassengerStep.tsx
filepath = 'src/components/flight/FlightPassengerStep.tsx'
with open(filepath, 'r') as f:
    content = f.read()
if 'export type { PassengerData }' not in content:
    content += '\nexport type { PassengerData };\n'
with open(filepath, 'w') as f:
    f.write(content)
print('Fixed FlightPassengerStep.tsx')

# 6. Fix HotelGuestStep.tsx
filepath = 'src/components/hotel/HotelGuestStep.tsx'
with open(filepath, 'r') as f:
    content = f.read()
if 'export type { GuestStepData }' not in content:
    content += '\nexport type { GuestStepData };\n'
with open(filepath, 'w') as f:
    f.write(content)
print('Fixed HotelGuestStep.tsx')

print('\nAll fixes applied!')
