'use client'

import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react'
import { airdropsAPI, type HeatHistoryRecord } from '@/lib/airdropsAPI'

interface HeatTrendChartProps {
  airdropId: number
  days?: number
  height?: number
  showControls?: boolean
  compact?: boolean
}

export default function HeatTrendChart({ 
  airdropId, 
  days = 30, 
  height = 200, 
  showControls = true,
  compact = false 
}: HeatTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [heatData, setHeatData] = useState<HeatHistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'heat_total' | 'heat_7d' | 'heat_30d' | 'heat_90d'>('heat_total')
  const [dimensions, setDimensions] = useState({ width: 400, height })

  // 响应式尺寸计算
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const width = Math.min(containerWidth, 600)
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDimensions)
      return () => window.removeEventListener('resize', updateDimensions)
    }
  }, [height])

  // 加载热度历史数据
  useEffect(() => {
    const loadHeatData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await airdropsAPI.getAirdropHeatHistory(airdropId, days)
        
        if (response.api_code == 200 && response.data) {
          setHeatData(response.data.heat_history)
        } else {
          setError(response.api_msg || '获取数据失败')
        }
      } catch (err) {
        console.error('加载热度数据失败:', err)
        setError('网络错误，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadHeatData()
  }, [airdropId, days])

  // 渲染图表
  useEffect(() => {
    if (!svgRef.current || heatData.length === 0 || isLoading) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 30, left: 40 }
    const chartWidth = dimensions.width - margin.left - margin.right
    const chartHeight = dimensions.height - margin.top - margin.bottom

    // 创建缩放容器
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // 设置比例尺
    const xScale = d3.scaleTime()
      .domain(d3.extent(heatData, d => new Date(d.date)) as [Date, Date])
      .range([0, chartWidth])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(heatData, d => d.daily_heat) || 100])
      .nice()
      .range([chartHeight, 0])

    // 创建线条生成器
    const line = d3.line<HeatHistoryRecord>()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.daily_heat))
      .curve(d3.curveMonotoneX)

    // 创建区域生成器
    const area = d3.area<HeatHistoryRecord>()
      .x(d => xScale(new Date(d.date)))
      .y0(chartHeight)
      .y1(d => yScale(d.daily_heat))
      .curve(d3.curveMonotoneX)

    // 添加渐变定义
    const defs = svg.append("defs")
    const gradient = defs.append("linearGradient")
      .attr("id", `heat-gradient-${airdropId}`)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", 0).attr("y2", chartHeight)

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.3)

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.05)

    // 添加区域
    g.append("path")
      .datum(heatData)
      .attr("fill", `url(#heat-gradient-${airdropId})`)
      .attr("d", area)

    // 添加线条
    g.append("path")
      .datum(heatData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line)

      // 添加数据点
      g.selectAll(".dot")
        .data(heatData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(new Date(d.date)))
        .attr("cy", d => yScale(d.daily_heat))
        .attr("r", 3)
        .attr("fill", "#3b82f6")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)

    // 添加X轴
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat(compact ? "%m/%d" : "%m月%d日") as any)
        .ticks(compact ? 5 : 7))

    // 添加Y轴
    g.append("g")
      .call(d3.axisLeft(yScale)
        .tickFormat(d => d.toString())
        .ticks(5))

    // 添加网格线
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-chartHeight)
        .tickFormat(() => "")
        .ticks(compact ? 5 : 7))
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3)

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat(() => "")
        .ticks(5))
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3)

  }, [heatData, selectedMetric, dimensions, airdropId, compact])

  // 计算趋势
  const getTrend = () => {
    if (heatData.length < 2) return { direction: 'neutral', percentage: 0 }
    
    const first = heatData[0].daily_heat
    const last = heatData[heatData.length - 1].daily_heat
    const percentage = first > 0 ? ((last - first) / first) * 100 : 0
    
    return {
      direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral',
      percentage: Math.abs(percentage)
    }
  }

  const trend = getTrend()

  if (isLoading) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-text-muted text-sm">加载热度数据...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-center">
            <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (heatData.length === 0) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-center">
            <div className="w-8 h-8 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="h-4 w-4 text-text-muted" />
            </div>
            <p className="text-text-muted text-sm">暂无热度数据</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      {showControls && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-muted">热度趋势</span>
            {trend.direction !== 'neutral' && (
              <div className={`flex items-center gap-1 text-xs ${
                trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.percentage.toFixed(1)}%</span>
              </div>
            )}
          </div>
          
          {!compact && (
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-2 py-1 bg-background-secondary border border-gray-700 rounded text-xs text-text-primary focus:border-primary focus:outline-none"
            >
              <option value="heat_total">总热度</option>
              <option value="heat_7d">7日热度</option>
              <option value="heat_30d">30日热度</option>
              <option value="heat_90d">90日热度</option>
            </select>
          )}
        </div>
      )}
      
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}


