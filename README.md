# figma-adoption-stats
Get and display statistics for adoption of design system Libraries across Figma

## Setup and running this

1. Clone this repository
2. Generate a figma API token
3. Set the token as an environment variable: `export FIGMA_API_TOKEN=TOKENGOESHERE`
4. Edit `index.ts` to include only teams you have access to _and have joined_
5. `npm i`
6. `npx patch-package`
6. `npm run build`
7. `npm run run`