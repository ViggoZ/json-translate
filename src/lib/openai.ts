import OpenAI from 'openai'

export async function translate(
  text: string, 
  targetLang: string, 
  apiKey: string,
  signal?: AbortSignal,
  onProgress?: (progress: number) => void,
  onStream?: (chunk: string) => void
) {
  if (!apiKey.startsWith('sk-')) {
    throw new Error('无效的 API Key 格式')
  }

  const openai = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true
  })

  try {
    console.log('开始翻译，目标语言:', targetLang)
    
    const prompt = `请将以下JSON内容翻译成${targetLang}，保持JSON结构不变，只翻译值部分。
    注意：
    1. 保持所有的key不变
    2. 只翻译value部分
    3. 保持JSON格式有效
    4. 保留所有特殊字符和格式
    
    JSON内容：
    ${text}`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "你是一个专业的JSON翻译助手。请直接返回翻译后的JSON内容，不要添加任何markdown标记或其他格式。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      stream: true
    }, {
      signal
    })

    let fullContent = ''
    let tokenCount = 0
    const estimatedTokens = text.length / 4 // 估算总token数

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || ''
      fullContent += content
      tokenCount += content.length / 4
      
      // 计算当前进度
      const progress = Math.min(Math.round((tokenCount / estimatedTokens) * 100), 100)
      onProgress?.(progress)
      
      onStream?.(fullContent)
    }

    // 验证最终JSON格式
    try {
      const parsedJson = JSON.parse(fullContent)
      fullContent = JSON.stringify(parsedJson, null, 2)
    } catch (e) {
      throw new Error(`翻译结果格式无效: ${(e as Error).message}`)
    }

    return fullContent

  } catch (error: unknown) {
    console.error('翻译错误详情:', error)
    
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error('API Key 无效或已过期')
      }
      
      if (error.status === 429) {
        throw new Error('API 调用次数已达上限')
      }
    }
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('翻译已取消')
    }
    
    throw new Error((error as Error).message || '翻译服务出错，请稍后重试')
  }
} 