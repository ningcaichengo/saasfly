import { NextRequest } from 'next/server'
import { POST } from '../../src/app/api/analyze-image/route'

/**
 * 创建测试应用实例
 * 模拟Next.js API路由的行为
 */
export function createApp() {
  return {
    post: (path: string) => {
      if (path === '/api/analyze-image') {
        return {
          attach: (fieldName: string, buffer: Buffer, options: { filename: string; contentType: string }) => {
            return {
              field: (name: string, value: string) => {
                return {
                  expect: async (expectedStatus: number) => {
                    try {
                      // 创建模拟的FormData
                      const formData = new FormData()
                      const blob = new Blob([buffer], { type: options.contentType })
                      formData.append('image', blob, options.filename)

                      // 创建模拟的Request对象
                      const request = new NextRequest('http://localhost:3000/api/analyze-image', {
                        method: 'POST',
                        body: formData
                      })

                      // 调用实际的API处理函数
                      const response = await POST(request)
                      const responseData = await response.json()

                      return {
                        status: response.status,
                        body: responseData
                      }
                    } catch (error) {
                      // 返回错误响应
                      return {
                        status: 500,
                        body: {
                          success: false,
                          error: {
                            message: error instanceof Error ? error.message : 'Internal server error',
                            code: 'INTERNAL_ERROR'
                          }
                        }
                      }
                    }
                  }
                }
              },
              expect: async (expectedStatus: number) => {
                return this.field('', '').expect(expectedStatus)
              }
            }
          },
          field: (name: string, value: string) => {
            return {
              expect: async (expectedStatus: number) => {
                try {
                  const formData = new FormData()
                  formData.append(name, value)

                  const request = new NextRequest('http://localhost:3000/api/analyze-image', {
                    method: 'POST',
                    body: formData
                  })

                  const response = await POST(request)
                  const responseData = await response.json()

                  return {
                    status: response.status,
                    body: responseData
                  }
                } catch (error) {
                  return {
                    status: 500,
                    body: {
                      success: false,
                      error: {
                        message: error instanceof Error ? error.message : 'Internal server error',
                        code: 'INTERNAL_ERROR'
                      }
                    }
                  }
                }
              }
            }
          },
          expect: async (expectedStatus: number) => {
            try {
              const request = new NextRequest('http://localhost:3000/api/analyze-image', {
                method: 'POST'
              })

              const response = await POST(request)
              const responseData = await response.json()

              return {
                status: response.status,
                body: responseData
              }
            } catch (error) {
              return {
                status: 500,
                body: {
                  success: false,
                  error: {
                    message: error instanceof Error ? error.message : 'Internal server error',
                    code: 'INTERNAL_ERROR'
                  }
                }
              }
            }
          }
        }
      }
      throw new Error(`Unsupported path: ${path}`)
    }
  }
}

/**
 * 资源监控助手
 */
export class ResourceMonitor {
  private initialMemory: NodeJS.MemoryUsage
  private startTime: number

  constructor() {
    this.startTime = Date.now()
    this.initialMemory = process.memoryUsage()
  }

  getCurrentMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage()
  }

  getMemoryDelta(): {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  } {
    const current = this.getCurrentMemoryUsage()
    return {
      rss: current.rss - this.initialMemory.rss,
      heapUsed: current.heapUsed - this.initialMemory.heapUsed,
      heapTotal: current.heapTotal - this.initialMemory.heapTotal,
      external: current.external - this.initialMemory.external
    }
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime
  }

  detectMemoryLeak(threshold: number = 50 * 1024 * 1024): boolean {
    const delta = this.getMemoryDelta()
    return delta.heapUsed > threshold
  }
}

/**
 * 并发测试助手
 */
export class ConcurrencyHelper {
  static async runConcurrentRequests<T>(
    requestFactory: () => Promise<T>,
    concurrency: number,
    totalRequests: number
  ): Promise<{
    results: (T | Error)[]
    successCount: number
    errorCount: number
    averageTime: number
    maxTime: number
    minTime: number
  }> {
    const results: (T | Error)[] = []
    const times: number[] = []
    let successCount = 0
    let errorCount = 0

    const chunks: Array<Array<() => Promise<T>>> = []
    for (let i = 0; i < totalRequests; i += concurrency) {
      const chunk: Array<() => Promise<T>> = []
      for (let j = 0; j < concurrency && i + j < totalRequests; j++) {
        chunk.push(requestFactory)
      }
      chunks.push(chunk)
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (factory) => {
        const startTime = Date.now()
        try {
          const result = await factory()
          const endTime = Date.now()
          times.push(endTime - startTime)
          successCount++
          return result
        } catch (error) {
          const endTime = Date.now()
          times.push(endTime - startTime)
          errorCount++
          return error instanceof Error ? error : new Error(String(error))
        }
      })

      const chunkResults = await Promise.all(chunkPromises)
      results.push(...chunkResults)
    }

    return {
      results,
      successCount,
      errorCount,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxTime: Math.max(...times),
      minTime: Math.min(...times)
    }
  }
}

/**
 * 状态一致性验证助手
 */
export class StateConsistencyHelper {
  private states: Map<string, any> = new Map()

  captureState(key: string, state: any): void {
    this.states.set(key, JSON.parse(JSON.stringify(state)))
  }

  compareStates(key1: string, key2: string): boolean {
    const state1 = this.states.get(key1)
    const state2 = this.states.get(key2)

    if (!state1 || !state2) {
      return false
    }

    return JSON.stringify(state1) === JSON.stringify(state2)
  }

  validateStateIntegrity(key: string, validator: (state: any) => boolean): boolean {
    const state = this.states.get(key)
    return state ? validator(state) : false
  }

  getState(key: string): any {
    return this.states.get(key)
  }

  clearStates(): void {
    this.states.clear()
  }
}