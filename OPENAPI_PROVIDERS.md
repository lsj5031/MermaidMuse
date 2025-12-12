# OpenAPI-Compatible Providers Guide

Diagram Maker's `/api/fix` endpoint supports any OpenAI-compatible API. This document explains how to configure different providers.

## What is OpenAPI Compatible?

An OpenAPI-compatible endpoint provides the same API interface as OpenAI's Chat Completions API:

- Same request/response format
- Same authentication (Bearer token)
- Same model parameter structure

## Supported Providers

### 1. OpenAI (Official)

**Best for**: Production, reliability, latest models

```env
OPENAPI_API_KEY=sk-...
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

**Features**:

- Latest GPT models (GPT-4, GPT-3.5-turbo)
- High reliability
- Advanced features (vision, function calling)

**Cost**: $0.01-0.15 per 1K tokens (varies by model)

**Sign up**: https://platform.openai.com/

---

### 2. Groq (Recommended for Cost)

**Best for**: Free, fast, low latency

```env
OPENAPI_API_KEY=gsk_...
OPENAPI_MODEL=mixtral-8x7b-32768
OPENAPI_BASE_URL=https://api.groq.com/openai/v1
```

**Alternative models**:

```
OPENAPI_MODEL=llama2-70b-4096
OPENAPI_MODEL=llama3-8b-8192
OPENAPI_MODEL=llama3-70b-8192
```

**Features**:

- 100% free (for API calls)
- Extremely fast (LPU acceleration)
- Good quality open-source models
- No rate limits for reasonable usage

**Cost**: Free

**Sign up**: https://console.groq.com/

---

### 3. Azure OpenAI

**Best for**: Enterprise, compliance requirements

```env
OPENAPI_API_KEY=your-api-key
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://<your-resource-name>.openai.azure.com/openai/deployments/<your-deployment>/
```

**Features**:

- Azure integration
- Compliance certifications (SOC2, HIPAA)
- Private networking options

**Cost**: Similar to OpenAI, billed via Azure

**Setup**: https://learn.microsoft.com/en-us/azure/ai-services/openai/

---

### 4. Anthropic Claude (via API Gateway)

**Best for**: Long context, nuanced tasks

```env
OPENAPI_API_KEY=sk-ant-...
OPENAPI_MODEL=claude-3-opus-20240229
OPENAPI_BASE_URL=https://api.anthropic.com/v1
```

**Note**: Requires a compatibility layer or use Claude's native API

**Features**:

- Long context window (100K-200K tokens)
- Strong reasoning
- Constitutional AI

**Cost**: $15-60 per 1M tokens

**Sign up**: https://console.anthropic.com/

---

### 5. Replicate

**Best for**: Open-source models, custom fine-tuned models

```env
OPENAPI_API_KEY=r8_...
OPENAPI_MODEL=meta/llama2-70b-chat
OPENAPI_BASE_URL=https://api.replicate.com/v1
```

**Features**:

- 10,000+ open-source models
- Easy fine-tuning
- Reproducible runs

**Cost**: Pay per token used

**Sign up**: https://replicate.com/

---

### 6. Together AI

**Best for**: Open models, competitive pricing

```env
OPENAPI_API_KEY=...
OPENAPI_MODEL=meta-llama/Llama-2-70b-chat-hf
OPENAPI_BASE_URL=https://api.together.xyz/v1
```

**Features**:

- 300+ open-source models
- Low latency
- Competitive pricing

**Cost**: $0.50-2.00 per 1M tokens

**Sign up**: https://www.together.ai/

---

### 7. LocalAI (Self-Hosted)

**Best for**: Privacy, no external API calls, offline

```env
OPENAPI_API_KEY=sk-any-value
OPENAPI_MODEL=gpt-4
OPENAPI_BASE_URL=http://localhost:8080/v1
```

**Setup**:

```bash
# Using Docker
docker run -p 8080:8080 localai/localai:latest

# Or locally
git clone https://github.com/go-skynet/LocalAI.git
cd LocalAI
make build
./local-ai
```

**Features**:

- 100% private
- No API calls to external services
- Runs on CPU or GPU
- Compatible with any GGML model

**Cost**: Free (hardware only)

**Docs**: https://localai.io/

---

### 8. Ollama (Self-Hosted, Lightweight)

**Best for**: Local development, lightweight models

```env
OPENAPI_API_KEY=ollama
OPENAPI_MODEL=llama2
OPENAPI_BASE_URL=http://localhost:11434/v1
```

**Setup**:

```bash
# macOS/Linux
curl https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download

# Run
ollama pull llama2
ollama serve
```

**Available models**:

```
OPENAPI_MODEL=llama2           # 7B
OPENAPI_MODEL=llama2:13b       # 13B
OPENAPI_MODEL=mistral          # 7B (fast)
OPENAPI_MODEL=neural-chat      # 7B
```

**Features**:

- Ultra lightweight
- Fast inference
- Run offline
- Easy to use

**Cost**: Free

**Docs**: https://ollama.ai/

---

### 9. HuggingFace Inference API

**Best for**: Access to latest models, no infrastructure

```env
OPENAPI_API_KEY=hf_...
OPENAPI_MODEL=mistralai/Mistral-7B-Instruct-v0.1
OPENAPI_BASE_URL=https://api-inference.huggingface.co/models
```

**Features**:

- 100,000+ models
- Free tier available
- Community-driven
- Easy model switching

**Cost**: Free (with limits) or $9+/month

**Sign up**: https://huggingface.co/

---

### 10. Perplexity

**Best for**: Real-time search, current information

```env
OPENAPI_API_KEY=pplx-...
OPENAPI_MODEL=llama-2-70b-chat
OPENAPI_BASE_URL=https://api.perplexity.ai
```

**Features**:

- Real-time web search
- Current information
- Multiple model options

**Cost**: $0.50-2.00 per 1M tokens

**Sign up**: https://www.perplexity.ai/

---

## Comparison Table

| Provider | Cost | Speed      | Quality   | Privacy   | Setup  |
| -------- | ---- | ---------- | --------- | --------- | ------ |
| OpenAI   | $$$  | Fast       | Excellent | No        | Easy   |
| Groq     | Free | ⚡ Fastest | Good      | No        | Easy   |
| Azure    | $$$  | Fast       | Excellent | High      | Medium |
| Claude   | $$   | Fast       | Excellent | Medium    | Easy   |
| LocalAI  | Free | Medium     | Good      | Excellent | Hard   |
| Ollama   | Free | Slow       | Fair      | Excellent | Easy   |
| Together | $$   | Fast       | Good      | Medium    | Easy   |

## Configuration Examples

### Production Setup (OpenAI)

```env
OPENAPI_API_KEY=sk-...
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

### Budget Setup (Groq)

```env
OPENAPI_API_KEY=gsk_...
OPENAPI_MODEL=mixtral-8x7b-32768
OPENAPI_BASE_URL=https://api.groq.com/openai/v1
```

### Privacy Setup (Ollama)

```env
OPENAPI_API_KEY=ollama
OPENAPI_MODEL=llama2
OPENAPI_BASE_URL=http://localhost:11434/v1
```

### Enterprise Setup (Azure)

```env
OPENAPI_API_KEY=your-api-key
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment/
```

## Testing Your Configuration

After setting environment variables, test your configuration:

```bash
# Local development
npm run dev:workers

# Then test the endpoint
curl -X POST http://localhost:8787/api/fix \
  -H 'Content-Type: application/json' \
  -d '{"diagramText": "graph TD\nA[Start]\nB[End]\nA --> B"}'
```

## Troubleshooting

### "Invalid API Key"

- Verify your API key is correct
- Check key format (should match provider, e.g., `sk-` for OpenAI)
- Ensure key is active in provider dashboard

### "Model not found"

- Check model name is correct for the provider
- List available models in provider dashboard
- Some providers require specific model IDs

### "Connection refused"

- For self-hosted: ensure service is running on specified port
- Check OPENAPI_BASE_URL includes full path (e.g., `http://localhost:11434/v1`)
- Verify firewall/network settings

### Performance issues

- Groq: Fastest option
- LocalAI/Ollama: May be slow on CPU, consider GPU
- Check provider's status page for outages

## Best Practices

1. **Use environment variables**: Never hardcode API keys
2. **Rotate keys regularly**: For security
3. **Monitor usage**: Check provider dashboard for unexpected usage
4. **Set rate limits**: Implement in your application if needed
5. **Test locally first**: Use LocalAI or Ollama for testing
6. **Use a fallback**: Consider having a backup provider

## Security Notes

- Never commit API keys to version control
- Use `.env.local` and `.env.production.local`
- Add to `.gitignore`
- For production, use platform's secret management (Cloudflare, Vercel, etc.)
- Rotate keys if compromised
- Use API key restrictions if available (IP whitelist, usage limits)

## References

- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Groq Docs](https://console.groq.com/docs/)
- [LocalAI Docs](https://localai.io/)
- [Ollama Docs](https://ollama.ai/)
- [Together AI Docs](https://www.together.ai/docs)
