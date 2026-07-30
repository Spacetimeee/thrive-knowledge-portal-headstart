import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

const config = await loadQuartzConfig()

// obsidian-flavored-markdown parses $...$ as inline math unconditionally (no config
// knob), which mangles prose containing two dollar amounts in one paragraph. The vault
// never contains real math, so escape $ before digits — the parser then never sees a
// math delimiter. Runs pre-parse: textTransforms all execute before markdown parsing.
config.plugins.transformers.push({
  name: "EscapeDollarAmounts",
  textTransform(_ctx, src) {
    return src.toString().replace(/\$(?=\d)/g, () => "\\$")
  },
})

export default config
export const layout = await loadQuartzLayout()
