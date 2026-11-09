import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // Early stage: feed, stories and comment slices get more consumers soon (reels, mobile nav),
      // merging them into their single current user now would be undone later
      "fsd/insignificant-slice": "off",
    },
  },
  {
    // "providers" is the conventional app-layer segment in the official Next.js guide
    files: ["./src/app/**"],
    rules: { "fsd/segments-by-purpose": "off" },
  },
]);
