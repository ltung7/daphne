# ADD_LANGUAGES Skill

This skill provides instructions for adding new supported languages to the application.

## Context
Adding a new language requires updating several core configuration files across the codebase before adding the actual translated JSON files. The application uses a specific locale type system, language/country mappings, and a custom flag resolution component.

## Instructions for Adding a New Language

When asked to "add [Language]", "support [Language]", or "add a new language":

### 1. Identify the ISO Codes
- Determine the ISO 639-1 language code (e.g., `es` for Spanish, `fr` for French).
- Determine the primary ISO 3166-1 alpha-2 country code for the flag and country name (e.g., `co` for Colombia if targeting South American drivers, `ua` for Ukraine). *Note: The prompt specified to prioritize countries people are likely to immigrate to Poland from for work (e.g., Colombia instead of Spain for Spanish).*

### 2. Update Core Types (`src/app.d.ts`)
- Locate the `App.Locale` type alias.
- Add the new ISO language code to the union type.
  ```typescript
  // Before
  type Locale = 'en' | 'pl' | 'hi' | 'ne' | 'uk' | 'be' | 'uz' | 'ka' | 'tl' | 'ro';
  // After
  type Locale = 'en' | 'pl' | 'hi' | 'ne' | 'uk' | 'be' | 'uz' | 'ka' | 'tl' | 'ro' | 'es';
  ```

### 3. Update Inlang Settings (`project.inlang/settings.json`)
- Add the new locale code to the `locales` array.
  ```json
  "locales": [
    "en",
    "pl",
    "uk",
    // ...
    "es"
  ],
  ```
- **IMPORTANT**: Do not modify any other files in the `project.inlang/` or `src/lib/paraglide/` folders.

### 4. Update Constants (`src/lib/assets/constants.ts`)
- Locate the `languages` array.
- Add a new tuple containing: `[Locale Code, Country Code, Polish Name, Native Name]`.
  ```typescript
  export const languages: Array<[App.Locale, string, string, string]> = [
      // ...
      [ 'es', 'co', 'Hiszpański', 'Español' ],
  ]
  ```
- Locate the `countryNames` record.
- Add the ISO country code and its Polish name.
  ```typescript
  export const countryNames: Record<string, string> = {
      // ...
      co: 'Kolumbia',
  };
  ```

### 5. Update Flag Mapping (`src/lib/misc/LanguageFlag.svelte`)
- Locate the `KNOWN_EXCEPTIONS` record in the script tag.
- If the language code differs from the primary country code (e.g., language is `uk` but country is `ua`, or language is `es` but country is `co`), add the mapping.
  ```typescript
  const KNOWN_EXCEPTIONS: Record<string, string> = {
      // ...
      es: 'co',
  };
  ```

### 6. Create Translation Files
- Use the [TRANSLATE](./TRANSLATE.md) skill to create the new JSON files.
- Copy `messages/en.json` to `messages/[locale].json` and translate it.
- Copy `src/lib/server/notifications/localized/messages/notifications_en.json` to `src/lib/server/notifications/localized/messages/notifications_[locale].json` and translate it.

### 7. Register Notification Locale (`src/lib/server/notifications/localized/localizedMailerMessages.ts`)
- Import the new JSON file at the top of the file.
  ```typescript
  import es from './messages/notifications_es.json';
  ```
- Add it to the `localeMap`.
  ```typescript
  const localeMap: Partial<Record<App.Locale, NotificationMessages>> = {
      // ...
      es: es as NotificationMessages,
  };
  ```

### 8. Update the TRANSLATE Skill (`docs/skills/TRANSLATE.md`)
- Open `docs/skills/TRANSLATE.md`.
- Add the new language to the "Supported Languages" list so future translations are aware of it.
