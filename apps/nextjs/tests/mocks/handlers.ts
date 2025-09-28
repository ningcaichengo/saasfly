import { http, HttpResponse } from 'msw'

// Coze API Mock handlers
export const handlers = [
  // 文件上传Mock
  http.post('https://api.coze.cn/v1/files/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File

    // 模拟不同的响应场景
    if (file.size > 10 * 1024 * 1024) {
      return new HttpResponse(null, {
        status: 413,
        statusText: 'Payload Too Large'
      })
    }

    if (file.type && !file.type.startsWith('image/')) {
      return new HttpResponse(JSON.stringify({
        code: 40001,
        msg: 'Unsupported file type'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 模拟成功响应
    const mockFileId = `mock_file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return HttpResponse.json({
      code: 0,
      data: {
        id: mockFileId,
        bytes: file.size,
        created_at: Math.floor(Date.now() / 1000),
        file_name: file.name
      },
      detail: {
        logid: `mock_log_${Date.now()}`
      },
      msg: ""
    })
  }),

  // 工作流执行Mock
  http.post('https://api.coze.cn/v1/workflow/run', async ({ request }) => {
    const body = await request.json() as any

    // 验证请求参数
    if (!body.workflow_id || !body.parameters?.img) {
      return HttpResponse.json({
        code: 40001,
        msg: 'Invalid request parameters. Please check your input and ensure all required fields are correctly formatted and within allowed ranges.'
      }, { status: 400 })
    }

    // 解析文件ID
    const imgParam = JSON.parse(body.parameters.img)
    const fileId = imgParam.file_id

    if (!fileId || fileId === 'undefined') {
      return HttpResponse.json({
        code: 40001,
        msg: 'Invalid file_id'
      }, { status: 400 })
    }

    // 根据prompttype生成不同风格的提示词
    const promptType = body.parameters.prompttype || 'normal'
    const mockPrompts = {
      normal: "A professional high-quality photograph, detailed composition, sharp focus, natural lighting, realistic colors, 8k resolution",
      flux: "An astronaut floating in the vast emptiness of space, helmet visor reflecting a brilliant nebula, sense of solitude and awe | hyper-realistic photography, space art | best quality, ultra-detailed, 8k, masterpiece, HDR, sharp focus | cinematic lighting, dramatic shadows, moody atmosphere | vivid cosmic colors, deep space blues, neon accents | surreal, ethereal, immense scale",
      stableDiffusion: "Digital art, concept art, trending on artstation, highly detailed, professional illustration, vibrant colors, dynamic composition",
      midjourney: "Beautiful artistic masterpiece, intricate details, stunning visual composition, award-winning photography, creative perspective"
    }

    const selectedPrompt = mockPrompts[promptType as keyof typeof mockPrompts] || mockPrompts.normal

    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 100))

    return HttpResponse.json({
      code: 0,
      msg: "",
      data: JSON.stringify({
        output: selectedPrompt
      }),
      debug_url: `https://www.coze.cn/work_flow?execute_id=mock_${Date.now()}&space_id=mock_space&workflow_id=${body.workflow_id}&execute_mode=2`,
      usage: {
        token_count: 1500,
        output_count: 800,
        input_count: 700
      },
      detail: {
        logid: `mock_workflow_log_${Date.now()}`
      }
    })
  }),

  // 健康检查Mock
  http.get('https://api.coze.cn/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: Date.now()
    })
  })
]

// 错误场景handlers
export const errorHandlers = {
  networkError: http.post('https://api.coze.cn/v1/files/upload', () => {
    return HttpResponse.error()
  }),

  timeout: http.post('https://api.coze.cn/v1/workflow/run', async () => {
    await new Promise(resolve => setTimeout(resolve, 35000)) // 超过30秒超时
    return HttpResponse.json({ code: 0, data: '{}' })
  }),

  invalidApiKey: http.post('https://api.coze.cn/v1/files/upload', () => {
    return new HttpResponse(JSON.stringify({
      code: 40101,
      msg: 'Invalid API key'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  quotaExceeded: http.post('https://api.coze.cn/v1/workflow/run', () => {
    return new HttpResponse(JSON.stringify({
      code: 42901,
      msg: 'Quota exceeded'
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  serviceUnavailable: http.post('https://api.coze.cn/v1/workflow/run', () => {
    return new HttpResponse(JSON.stringify({
      code: 50001,
      msg: 'Service temporarily unavailable'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  })
}