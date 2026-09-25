# TRANSLATE Skill

This skill provides instructions for translating localization files across the application. 

## Context
The application uses two separate translation systems:
1. **Frontend UI Translations (Paraglide)**: Located in `messages/`
2. **Backend Notification Translations (Custom)**: Located in `src/lib/server/notifications/localized/messages/`

## Base Locale
**English (`en.json` or `notifications_en.json`) is the source of truth.** 
When adding new translations, always start by adding them to the English file first.

## Supported Languages
The application supports multiple languages. Currently known languages include:
- `en`: English (Base)
- `pl`: Polish
- `uk`: Ukrainian
- `be`: Belarusian
- `hi`: Hindi
- `ne`: Nepali
- `uz`: Uzbek
- `ka`: Georgian
- `tl`: Tagalog
- `ro`: Romanian
- `sr`: Serbian

> **⚠️ IMPORTANT:** Additional languages may have been added since this document was written. **Always scan the target directories** to discover all currently supported language files and ensure you are translating for all of them.

## Instructions for Translating

When asked to "translate", "add translations for", or "sync translations":

1. **Identify the missing keys**: Compare the target language file(s) against the English base file.
2. **Translate accurately**: Provide natural, context-aware translations. The primary context is a fleet management application (drivers, vehicles, settlements, notifications).
3. **Preserve formatting and variables**: 
   - DO NOT translate variable names inside curly braces (e.g., keep `{driverName}` exactly as is).
   - Preserve HTML tags if present (e.g., `<b>`, `<br/>`).
4. **Maintain structure**: Ensure the JSON structure exactly matches the base English file, including nested objects.
5. **Double check target files**: 
   - For UI translations, apply changes to all JSON files in `messages/`.
   - For notification translations, apply changes to all JSON files in `src/lib/server/notifications/localized/messages/`.

## Target Directories

- [UI Messages](../../messages/) (`messages/*.json`)
- [Notification Messages](../../src/lib/server/notifications/localized/messages/) (`src/lib/server/notifications/localized/messages/*.json`)
