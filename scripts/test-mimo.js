const { readFileSync } = require("fs")
const { join } = require("path")

const envPath = join(__dirname, "..", ".env.local")
const envContent = readFileSync(envPath, "utf-8")
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(line => line && !line.startsWith("#"))
    .map(line => {
      const eq = line.indexOf("=")
      return [line.slice(0, eq), line.slice(eq + 1).replace(/^["']|["']$/g, "")]
    })
)

const API_URL = env.MIMO_API_BASE_URL || "https://api.xiaomimimo.com/v1"
const API_KEY = env.MIMO_API_KEY
const MODEL = env.MIMO_MODEL || "mimo-v2.5-pro"

function loadPrompt(name) {
  return readFileSync(join(__dirname, "..", "src", "lib", "agent", "prompts", name), "utf-8").trim()
}

async function callMimo({ system, prompt, maxTokens = 1024, temperature = 0.7 }) {
  const messages = []
  if (system) messages.push({ role: "system", content: system })
  messages.push({ role: "user", content: prompt })

  const body = { model: MODEL, messages, temperature, max_tokens: maxTokens }
  console.log(`  Request: ${JSON.stringify(body).length} bytes, max_tokens=${maxTokens}`)

  const start = Date.now()
  const res = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  const elapsed = Date.now() - start
  console.log(`  Status: ${res.status} | Time: ${(elapsed / 1000).toFixed(1)}s`)

  if (!res.ok) {
    const err = await res.text()
    console.log(`  Error: ${err}`)
    return null
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ""
  const usage = data.usage || {}
  console.log(`  Tokens: prompt=${usage.prompt_tokens || "?"}, completion=${usage.completion_tokens || "?"}`)
  console.log(`  Response:\n${content}\n`)
  return { content, elapsed, usage }
}

async function testGen() {
  console.log("=== Name Generation Test (Vietnamese) ===\n")

  const system = loadPrompt("system.vi.md")
  const template = loadPrompt("name-generation.vi.md")

  const prompt = template
    .replace("{{nameCount}}", "3")
    .replace("{{nameLength}}", "2")
    .replace("{{surname}}", "Nguyễn")
    .replace("{{gender}}", "Nữ")
    .replace("{{birthDate}}", "2026-04-15")
    .replace("{{birthTime}}", "14:06")
    .replace("{{preferences}}", "nature, wisdom")
    .replace("{{familyInfo}}", "")
    .replace("{{excludedNames}}", "")

  await callMimo({ system, prompt, maxTokens: 2048, temperature: 0.9 })
}

async function testAnalysis(type) {
  const label = { fengshui: "Feng Shui", numerology: "Numerology", bazi: "Bazi", horoscope: "Horoscope" }[type]
  console.log(`=== Analysis Test: ${label} (Vietnamese) ===\n`)

  const template = loadPrompt(`analysis-${type}.vi.md`)
  const prompt = template
    .replace("{{name}}", "Minh Anh")
    .replace("{{surname}}", "Nguyễn")
    .replace("{{birthDate}}", "2026-04-15")
    .replace("{{birthInfo}}", "Ngày: 2026-04-15, Giờ: 14:06")

  await callMimo({ prompt, maxTokens: 768, temperature: 0.5 })
}

async function main() {
  const mode = process.argv[2]

  console.log(`Model: ${MODEL}`)
  console.log(`Endpoint: ${API_URL}/chat/completions\n`)

  if (mode === "--gen") {
    await testGen()
  } else if (mode === "--analysis" || mode === "-a") {
    for (const type of ["fengshui", "numerology", "bazi", "horoscope"]) {
      await testAnalysis(type)
    }
  } else if (mode === "--all") {
    await testGen()
    console.log("---\n")
    for (const type of ["fengshui", "bazi"]) {
      await testAnalysis(type)
      if (type === "fengshui") console.log("---\n")
    }
  } else {
    const prompt = mode || "Say hello in exactly one sentence."
    console.log(`Prompt: "${prompt}"\n`)
    await callMimo({ prompt })
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message)
  process.exit(1)
})
