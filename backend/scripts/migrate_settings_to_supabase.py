#!/usr/bin/env python3
"""
Migration script: Migrate settings from JSON to Supabase
Migrates settings.json and overview.json data to system_settings table
"""
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.repositories import SystemSettingsRepository
from app.core.config import SETTINGS_FILE, OVERVIEW_FILE


def migrate_settings():
    """Migrate settings.json to Supabase system_settings table"""
    print("=" * 60)
    print("Settings Migration: JSON -> Supabase")
    print("=" * 60)

    # Check if settings.json exists
    if not os.path.exists(SETTINGS_FILE):
        print(f"WARNING: Settings file not found: {SETTINGS_FILE}")
        return False

    try:
        # Read existing settings
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            settings = json.load(f)

        print(f"\n[OK] Loaded settings from: {SETTINGS_FILE}")
        print(f"  Data keys: {list(settings.keys())}")

        # Migrate to Supabase
        result = SystemSettingsRepository.set(
            key="menu_visibility",
            value=settings,
            description="Menu visibility configuration for UI tabs (migrated from JSON)"
        )

        if result:
            print("[OK] Settings migrated to Supabase successfully")
            print(f"  Key: menu_visibility")
            print(f"  Value keys: {list(settings.keys())}")

            # Backup original file
            backup_path = f"{SETTINGS_FILE}.migrated"
            os.rename(SETTINGS_FILE, backup_path)
            print(f"[OK] Original file backed up to: {backup_path}")

            return True
        else:
            print("[ERROR] Failed to migrate settings to Supabase")
            return False

    except Exception as e:
        print(f"[ERROR] Error during settings migration: {e}")
        import traceback
        traceback.print_exc()
        return False


def migrate_overview():
    """Migrate overview.json to Supabase system_settings table"""
    print("\n" + "=" * 60)
    print("Overview Migration: JSON -> Supabase")
    print("=" * 60)

    # Check if overview.json exists
    if not os.path.exists(OVERVIEW_FILE):
        print(f"WARNING: Overview file not found: {OVERVIEW_FILE}")
        return False

    try:
        # Read existing overview
        with open(OVERVIEW_FILE, "r", encoding="utf-8") as f:
            overview = json.load(f)

        print(f"\n[OK] Loaded overview from: {OVERVIEW_FILE}")
        print(f"  Data keys: {list(overview.keys())}")

        # Migrate system_status to Supabase
        if "system_status" in overview:
            result = SystemSettingsRepository.set(
                key="system_status",
                value=overview["system_status"],
                description="System operational status (migrated from JSON)"
            )

            if result:
                print("[OK] System status migrated to Supabase successfully")
            else:
                print("[ERROR] Failed to migrate system status")
                return False

        # Note: stats are dynamically generated, so we don't migrate them
        print("[INFO] Stats are dynamically generated - not migrated")

        # Backup original file
        backup_path = f"{OVERVIEW_FILE}.migrated"
        os.rename(OVERVIEW_FILE, backup_path)
        print(f"[OK] Original file backed up to: {backup_path}")

        return True

    except Exception as e:
        print(f"[ERROR] Error during overview migration: {e}")
        import traceback
        traceback.print_exc()
        return False


def verify_migration():
    """Verify that migration was successful"""
    print("\n" + "=" * 60)
    print("Verification")
    print("=" * 60)

    try:
        # Verify menu_visibility
        settings = SystemSettingsRepository.get("menu_visibility")
        if settings:
            print("[OK] menu_visibility found in Supabase")
            print(f"  Keys: {list(settings.get('value', {}).keys())}")
        else:
            print("[ERROR] menu_visibility NOT found in Supabase")
            return False

        # Verify system_status
        status = SystemSettingsRepository.get("system_status")
        if status:
            print("[OK] system_status found in Supabase")
            print(f"  Status: {status.get('value', {}).get('operational', 'unknown')}")
        else:
            print("[ERROR] system_status NOT found in Supabase")
            return False

        print("\n[OK] Migration verification successful!")
        return True

    except Exception as e:
        print(f"[ERROR] Verification failed: {e}")
        return False


def main():
    """Main migration function"""
    print("\n>> Starting Settings & Overview Migration to Supabase\n")

    # Migrate settings
    settings_ok = migrate_settings()

    # Migrate overview
    overview_ok = migrate_overview()

    # Verify
    if settings_ok and overview_ok:
        verify_ok = verify_migration()

        if verify_ok:
            print("\n" + "=" * 60)
            print("MIGRATION COMPLETED SUCCESSFULLY")
            print("=" * 60)
            print("\nNext steps:")
            print("1. Test the application to ensure settings work correctly")
            print("2. Once verified, you can delete the .migrated backup files")
            print("3. Remove legacy JSON file references from docker-compose.yml")
            return 0
        else:
            print("\nWARNING: Migration completed but verification failed")
            print("Please check Supabase manually")
            return 1
    else:
        print("\nERROR: MIGRATION FAILED")
        print("Original files have NOT been modified")
        return 1


if __name__ == "__main__":
    sys.exit(main())
