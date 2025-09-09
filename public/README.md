# public/

Static assets served directly by the web server. These files are copied to the build output without processing.

## Structure

- **`items/`** - Item-related static assets (likely for external integrations or fallbacks)
- `index.html` - Main HTML template
- `favicon.ico` - Browser tab icon
- Other static assets as needed

## Purpose

The public directory contains:

- Files that need to be available at specific URLs
- Assets that should not be processed by the build system
- HTML templates and metadata files
- Static fallbacks or external integration assets

## Key Concepts

**No Processing**: Files here are served as-is without bundling, minification, or other build-time processing.

**Direct URLs**: Files are accessible at `/{filename}` in the built application.

**Build Output**: Contents are copied directly to the `dist/` folder during build.

**Cache Headers**: Static files may have different caching behavior than bundled assets.

## Guidelines

- Keep public assets minimal - prefer importing assets in code when possible
- Use descriptive filenames since they become public URLs
- Consider browser caching when updating files
- Don't put sensitive information in public assets
