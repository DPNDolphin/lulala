/**
 * 邀请功能相关的工具函数
 */

/**
 * 设置邀请者UID的cookie
 * @param uid 邀请者的UID
 * @param days cookie有效期（天数），默认30天
 */
export function setInviteCookie(uid: string, days: number = 30): void {
  if (typeof window === 'undefined') return

  const expireDate = new Date()
  expireDate.setDate(expireDate.getDate() + days)
  
  document.cookie = `invite_uid=${uid}; expires=${expireDate.toUTCString()}; path=/; SameSite=Lax`
  
  console.log('设置邀请cookie:', { invite_uid: uid, expires: expireDate })
}

/**
 * 获取邀请者UID的cookie值
 * @returns 邀请者的UID，如果不存在则返回null
 */
export function getInviteCookie(): string | null {
  if (typeof window === 'undefined') return null

  const cookies = document.cookie.split(';')
  
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'invite_uid') {
      return value || null
    }
  }
  
  return null
}

/**
 * 清除邀请者UID的cookie
 */
export function clearInviteCookie(): void {
  if (typeof window === 'undefined') return

  document.cookie = 'invite_uid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax'
  
  console.log('清除邀请cookie')
}

/**
 * 检查URL中是否包含邀请参数并处理
 * @param url 要检查的URL，默认使用当前页面URL
 * @returns 如果处理了邀请参数返回true，否则返回false
 */
export function handleInviteFromUrl(url?: string): boolean {
  if (typeof window === 'undefined') return false

  const targetUrl = url || window.location.href
  const urlObj = new URL(targetUrl)
  const inviteUid = urlObj.searchParams.get('uid')
  
  if (inviteUid) {
    // 设置邀请cookie
    setInviteCookie(inviteUid)
    
    // 清理URL参数
    urlObj.searchParams.delete('uid')
    const newUrl = urlObj.pathname + (urlObj.search ? urlObj.search : '')
    
    // 更新浏览器URL（不添加到历史记录）
    window.history.replaceState({}, '', newUrl)
    
    return true
  }
  
  return false
}

/**
 * 生成邀请链接
 * @param baseUrl 基础URL
 * @param uid 邀请者的UID
 * @returns 完整的邀请链接
 */
export function generateInviteLink(baseUrl: string, uid: string): string {
  const url = new URL(baseUrl)
  url.searchParams.set('uid', uid)
  return url.toString()
}
