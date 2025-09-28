"use client";

import { useState } from "react";
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";
import { Badge } from "@saasfly/ui/badge";

export function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  const features = [
    {
      icon: <Icons.Zap className="h-5 w-5" />,
      title: "AI驱动分析",
      description: "先进的AI技术，秒懂图像内容",
      color: "bg-emerald-100 text-emerald-800"
    },
    {
      icon: <Icons.Palette className="h-5 w-5" />,
      title: "多风格支持",
      description: "Midjourney、Flux、SD等主流模型",
      color: "bg-blue-100 text-blue-800"
    },
    {
      icon: <Icons.Rocket className="h-5 w-5" />,
      title: "企业级品质",
      description: "经过80+测试用例验证的稳定系统",
      color: "bg-purple-100 text-purple-800"
    }
  ];

  const stats = [
    { value: "21s", label: "平均处理时间" },
    { value: "99.9%", label: "系统可用性" },
    { value: "10+", label: "支持格式" },
    { value: "0", label: "安全漏洞" }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 左侧内容 */}
          <div className="space-y-8">
            {/* 标签 */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                🚀 已上线运行
              </Badge>
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                企业级质量
              </Badge>
            </div>

            {/* 主标题 */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                AI图像提示词
                <br />
                <span className="text-gray-900">智能生成器</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                上传图片，AI秒懂内容，一键生成专业级提示词。
                <br />
                <span className="text-emerald-600 font-semibold">让AI艺术创作变得简单高效</span>
              </p>
            </div>

            {/* CTA按钮 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Icons.Play className="mr-2 h-5 w-5" />
                立即体验
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:border-emerald-600 px-8 py-4 text-lg font-semibold transition-all duration-200"
              >
                <Icons.Github className="mr-2 h-5 w-5" />
                查看源码
              </Button>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-emerald-600">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧演示区域 */}
          <div className="space-y-6">
            {/* 主演示卡片 */}
            <Card className="p-6 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">实时演示</h3>
                  <Badge className="bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    在线运行
                  </Badge>
                </div>

                {/* 图片预览区 */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Icons.Image className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-500">点击上传图片</p>
                    </div>
                  </div>

                  {/* 处理进度条 */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{width: '0%'}} />
                  </div>
                </div>

                {/* 生成结果预览 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icons.Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">AI生成提示词</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[80px] flex items-center">
                    <p className="text-sm text-gray-500 italic">
                      上传图片后，AI将在此生成专业的提示词...
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <Button className="flex-1" disabled>
                    <Icons.Upload className="mr-2 h-4 w-4" />
                    上传图片
                  </Button>
                  <Button variant="outline" size="icon" disabled>
                    <Icons.Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* 特性卡片 */}
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="p-4 border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* 信任指标 */}
        <div className="mt-20 text-center">
          <p className="text-sm text-gray-500 mb-6">技术架构经过企业级验证</p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <Icons.Shield className="h-5 w-5" />
              <span className="text-sm font-medium">80+测试用例</span>
            </div>
            <div className="flex items-center gap-2">
              <Icons.Zap className="h-5 w-5" />
              <span className="text-sm font-medium">Coze AI驱动</span>
            </div>
            <div className="flex items-center gap-2">
              <Icons.Code className="h-5 w-5" />
              <span className="text-sm font-medium">TypeScript严格模式</span>
            </div>
            <div className="flex items-center gap-2">
              <Icons.Award className="h-5 w-5" />
              <span className="text-sm font-medium">生产就绪</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}