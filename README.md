# Boardgame-Ruinners

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-5gs1wwbu)

## TinaCMS Schema Changes

**IMPORTANT:** Every time the Tina schema (`tina/config.ts`) is modified, the generated files must be regenerated and the schema must be synced to Tina Cloud. This happens automatically when pushing to GitHub (GitHub Actions runs `tinacms build` which pushes the schema). However, the local generated files in `tina/__generated__/` also need to be updated so the admin panel works without errors.

To regenerate the generated files locally after a schema change:

1. Run `npm run dev` (which runs `tinacms dev` and regenerates files automatically), or
2. Run `npx tinacms build --skip-cloud-checks` to regenerate without starting a dev server.

If you see "GraphQL Schema Mismatch. Editing may not work." in the Tina admin panel, it means the local generated schema files don't match the schema in `tina/config.ts`. Regenerate them using one of the commands above.
