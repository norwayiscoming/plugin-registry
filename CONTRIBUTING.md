# Contributing to OpenACP Plugin Registry

Thank you for contributing a plugin to OpenACP! This guide explains how to submit your plugin.

## How to Submit a Plugin

1. **Publish your plugin to npm** — your package must be publicly available on npm.

2. **Fork this repository** and create a new branch.

3. **Create a plugin JSON file** in the `plugins/` directory:
   - Filename format: `<scope>--<package-name>.json` (e.g., `openacp--adapter-discord.json`)
   - Use `--` to replace `/` in scoped packages (e.g., `@openacp/adapter-discord` becomes `openacp--adapter-discord`)
   - For unscoped packages, just use the package name (e.g., `my-plugin.json`)

4. **Fill in all required fields:**

```json
{
  "name": "your-plugin-name",
  "displayName": "Your Plugin Name",
  "description": "What your plugin does",
  "npm": "@your-scope/your-plugin",
  "repository": "https://github.com/you/your-plugin",
  "author": {
    "name": "Your Name",
    "github": "your-github-username"
  },
  "version": "1.0.0",
  "minCliVersion": "2026.0326.0",
  "category": "adapter",
  "tags": ["relevant", "tags"],
  "icon": "",
  "license": "MIT",
  "verified": false,
  "featured": false
}
```

5. **Open a Pull Request** — CI will automatically validate your submission and check that the npm package exists.

## Required Fields

| Field | Description |
|-------|-------------|
| `name` | Unique plugin identifier |
| `description` | Short description of what the plugin does |
| `npm` | npm package name |
| `repository` | HTTPS URL to source repository |
| `author` | Author object with `name` (and optionally `github`) |
| `version` | Current semver version |
| `minCliVersion` | Minimum OpenACP CLI version required |
| `category` | One of: `adapter`, `utility`, `integration`, `ai`, `security`, `media` |
| `license` | SPDX license identifier |

## Categories

- **adapter** — Channel adapters (Discord, Slack, etc.)
- **utility** — General utilities and helpers
- **integration** — Third-party service integrations
- **ai** — AI model and provider plugins
- **security** — Security and authentication plugins
- **media** — Media processing plugins

## Validation Rules

- All required fields must be present
- `repository` must be an HTTPS URL
- `version` must be valid semver
- `category` must be one of the allowed values
- `npm` package must exist on the npm registry
- Plugin `name` must be unique across the registry

## After Submission

Once your PR is merged:
- The registry is automatically rebuilt
- Your plugin becomes discoverable via `openacp plugins search`
- Version updates are tracked automatically via daily CI
