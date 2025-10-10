import { createAvatar } from '@dicebear/core'
import { avataaars, personas, bottts, identicon, initials, lorelei } from '@dicebear/collection'

// 预设头像配置
export interface PresetAvatar {
  id: string
  name: string
  category: 'male' | 'female' | 'neutral' | 'robot' | 'abstract'
  path?: string
  description: string
  style: string
  seed: string
}

// DiceBear 头像生成函数
export const generateDiceBearAvatar = (style: string, seed: string, options?: any): string => {
  const styleMap: { [key: string]: any } = {
    'avataaars': avataaars,
    'personas': personas,
    'bottts': bottts,
    'identicon': identicon,
    'initials': initials,
    'lorelei': lorelei
  }

  const selectedStyle = styleMap[style] || avataaars
  const avatar = createAvatar(selectedStyle, {
    seed,
    ...options
  })

  return avatar.toString()
}

// 预设头像模板（不包含生成的path）
export const presetAvatarTemplates: PresetAvatar[] = [
  // Avataaars 风格 - 男性
  {
    id: 'avataaars-male-1',
    name: '经典男士',
    category: 'male',
    description: 'Avataaars风格经典男性头像',
    style: 'avataaars',
    seed: 'john-doe'
  },
  {
    id: 'avataaars-male-2',
    name: '商务精英',
    category: 'male',
    description: 'Avataaars风格商务男性头像',
    style: 'avataaars',
    seed: 'business-man'
  },
  {
    id: 'avataaars-male-3',
    name: '年轻活力',
    category: 'male',
    description: 'Avataaars风格年轻男性头像',
    style: 'avataaars',
    seed: 'young-guy'
  },

  // Avataaars 风格 - 女性
  {
    id: 'avataaars-female-1',
    name: '优雅女士',
    category: 'female',
    description: 'Avataaars风格优雅女性头像',
    style: 'avataaars',
    seed: 'jane-doe'
  },
  {
    id: 'avataaars-female-2',
    name: '时尚女孩',
    category: 'female',
    description: 'Avataaars风格时尚女性头像',
    style: 'avataaars',
    seed: 'fashion-girl'
  },

  // Lorelei 风格 - 更多女性选择
  {
    id: 'lorelei-female-1',
    name: '甜美少女',
    category: 'female',
    description: 'Lorelei风格甜美女性头像',
    style: 'lorelei',
    seed: 'sweet-girl'
  },
  {
    id: 'lorelei-female-2',
    name: '知性女性',
    category: 'female',
    description: 'Lorelei风格知性女性头像',
    style: 'lorelei',
    seed: 'smart-woman'
  },

  // Bottts 风格 - 机器人
  {
    id: 'bottts-robot-1',
    name: '友好机器人',
    category: 'robot',
    description: 'Bottts风格友好机器人头像',
    style: 'bottts',
    seed: 'friendly-bot'
  },
  {
    id: 'bottts-robot-2',
    name: '酷炫机器人',
    category: 'robot',
    description: 'Bottts风格酷炫机器人头像',
    style: 'bottts',
    seed: 'cool-bot'
  },

  // Identicon 风格 - 抽象
  {
    id: 'identicon-abstract-1',
    name: '几何图案',
    category: 'abstract',
    description: 'Identicon风格几何图案头像',
    style: 'identicon',
    seed: 'geometric-pattern'
  },
  {
    id: 'identicon-abstract-2',
    name: '像素艺术',
    category: 'abstract',
    description: 'Identicon风格像素艺术头像',
    style: 'identicon',
    seed: 'pixel-art'
  },

  // Personas 风格 - 中性
  {
    id: 'personas-neutral-1',
    name: '简约风格',
    category: 'neutral',
    description: 'Personas风格简约头像',
    style: 'personas',
    seed: 'minimalist'
  },
  {
    id: 'personas-neutral-2',
    name: '现代风格',
    category: 'neutral',
    description: 'Personas风格现代头像',
    style: 'personas',
    seed: 'modern-style'
  }
]

// 安全的 base64 编码函数
const safeBase64Encode = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch (e) {
    // 如果 btoa 失败，直接返回 URL 编码的 SVG
    return encodeURIComponent(str)
  }
}

// 生成预设头像（懒加载）
export const presetAvatars: PresetAvatar[] = presetAvatarTemplates.map(template => {
  const svgString = generateDiceBearAvatar(template.style, template.seed)
  return {
    ...template,
    path: `data:image/svg+xml,${encodeURIComponent(svgString)}`
  }
})

// 根据分类获取头像
export const getAvatarsByCategory = (category?: 'male' | 'female' | 'neutral' | 'robot' | 'abstract') => {
  if (!category) return presetAvatars
  return presetAvatars.filter(avatar => avatar.category === category)
}

// 随机获取一个头像
export const getRandomAvatar = (category?: 'male' | 'female' | 'neutral' | 'robot' | 'abstract') => {
  const avatars = getAvatarsByCategory(category)
  return avatars[Math.floor(Math.random() * avatars.length)]
}

// 生成随机DiceBear头像
export const generateRandomDiceBearAvatar = (style?: string) => {
  const styles = ['avataaars', 'personas', 'bottts', 'identicon', 'lorelei']
  const selectedStyle = style || styles[Math.floor(Math.random() * styles.length)]
  const randomSeed = Math.random().toString(36).substring(7)
  
  const svgString = generateDiceBearAvatar(selectedStyle, randomSeed)
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`
}