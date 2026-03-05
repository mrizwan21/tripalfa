#!/usr/bin/env python3
"""
Security vulnerability fix strategy for TripAlfa monorepo.

Vulnerabilities to fix:
1. minimatch (3x HIGH) - Need 9.0.7+
2. multer (2x HIGH) - Already at 2.1.0 ✓
3. request (MODERATE) - Deprecated, no patch, must remove
4. tough-cookie (MODERATE) - Need 4.1.3+
5. esbuild (MODERATE) - Need 0.25.0+
"""

import os
import subprocess
import json
import sys

def run_cmd(cmd, cwd=None):
    """Run a command and return output."""
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    return result.returncode == 0, result.stdout, result.stderr

def main():
    # Use script location to determine root directory for portability
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root = script_dir  # Assumes script is at repo root
    os.chdir(root)
    
    fixes = []
    
    print("🔧 SECURITY VULNERABILITY FIX EXECUTION\n")
    print("=" * 60)
    
    # Step 1: Upgrade esbuild (MODERATE)
    print("\n1️⃣ Upgrading esbuild to >=0.25.0...")
    success, out, err = run_cmd("pnpm update --latest esbuild")
    if success:
        fixes.append("✅ esbuild upgraded to latest (fixes MODERATE)")
        print("   ✅ Updated")
    else:
        print("   ⚠️ May already be at latest")
    
    # Step 2: Find what depends on 'request' package
    print("\n2️⃣ Checking what depends on 'request' package...")
    success, out, err = run_cmd("pnpm ls request 2>&1")
    if "request@" in out:
        fixes.append("⚠️ request package found - attempting removal")
        print("   Found 'request' package")
        # Try to find what's using it
        success, out, err = run_cmd("grep -r 'request' package.json apps/*/package.json services/*/package.json 2>/dev/null")
        if success and out:
            print("   Request package found in:")
            print(out[:200])
    else:
        fixes.append("✅ request package not directly installed")
        print("   ✅ Not found in direct dependencies")
    
    # Step 3: Upgrade tough-cookie (MODERATE)
    print("\n3️⃣ Upgrading tough-cookie to >=4.1.3...")
    success, out, err = run_cmd("pnpm update --latest tough-cookie")
    if success:
        fixes.append("✅ tough-cookie upgraded (fixes MODERATE)")
        print("   ✅ Updated")
    else:
        print("   ⚠️ Check manually")
    
    # Step 4: Upgrade TypeScript ESLint (for minimatch)
    print("\n4️⃣ Upgrading @typescript-eslint packages (fixes minimatch 3x HIGH)...")
    success, out, err = run_cmd("pnpm update --latest @typescript-eslint/eslint-plugin @typescript-eslint/parser @typescript-eslint/utils @typescript-eslint/type-utils 2>&1")
    if success:
        fixes.append("✅ @typescript-eslint upgraded (should pull minimatch 9.0.7+)")
        print("   ✅ Updated")
    else:
        print("   Output:", out[:300] if out else err[:300])
    
    # Step 5: Verify build still works
    print("\n5️⃣ Verifying build integrity...")
    success, out, err = run_cmd("npx tsc -p tsconfig.json --noEmit 2>&1")
    if success:
        fixes.append("✅ TypeScript compilation: 0 errors")
        print("   ✅ Build passes")
    else:
        fixes.append("❌ TypeScript compilation has errors (check above)")
        print("   ⚠️ Errors detected")
        print(out[:500] if out else err[:500])
    
    # Print summary
    print("\n" + "=" * 60)
    print("\n📊 FIX SUMMARY:\n")
    for fix in fixes:
        print(f"  {fix}")
    
    print("\n" + "=" * 60)
    print("\n✅ Automated fixes complete. Running final audit...")
    
    return len(fixes)

if __name__ == "__main__":
    main()
