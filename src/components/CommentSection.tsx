'use client'

import { useState } from 'react'
import { MessageCircle, Heart, Reply, X, Send } from 'lucide-react'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { useToast } from '@/components/Toast'

export interface Comment {
  id: string
  content: string
  timestamp: string
  likes: number
  parent_id: number
  user: {
    nickname: string
    avatar: string
  }
  replies?: Comment[]
}

interface CommentSectionProps {
  comments: Comment[]
  commentsCount: number
  onSubmitComment: (content: string, parentId?: number) => Promise<void>
  onLikeComment: (commentId: string) => Promise<void>
  userProfile?: {
    nickname: string
    avatar: string
  } | null
  showProfileModal?: () => void
}

export default function CommentSection({
  comments,
  commentsCount,
  onSubmitComment,
  onLikeComment,
  userProfile,
  showProfileModal
}: CommentSectionProps) {
  const { isAuthenticated, user } = useMultiAuth()
  const { showWarning } = useToast()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)

  // 处理评论提交
  const handleComment = async () => {
    if (!isAuthenticated || !user?.wallet_address) {
      showWarning('需要登录', '请先连接钱包并完成认证才能评论')
      return
    }
    
    if (!newComment.trim()) return
    
    // 检查用户信息是否完整
    if (!userProfile || !userProfile.nickname || 
        userProfile.nickname.startsWith('Wallet_') || 
        !userProfile.avatar) {
      if (showProfileModal) {
        showProfileModal()
      }
      return
    }
    
    try {
      await onSubmitComment(newComment.trim(), replyingTo ? parseInt(replyingTo.id) : undefined)
      setNewComment('')
      setReplyingTo(null)
    } catch (err) {
      // 错误处理由父组件负责
    }
  }

  // 处理回复评论
  const handleReply = (comment: Comment) => {
    setReplyingTo(comment)
    setNewComment('')
    // 聚焦到输入框
    setTimeout(() => {
      const input = document.querySelector('#comment-input') as HTMLInputElement
      if (input) {
        input.focus()
      }
    }, 100)
  }

  // 取消回复
  const cancelReply = () => {
    setReplyingTo(null)
    setNewComment('')
  }

  // 处理评论内容中的@提及
  const renderCommentContent = (content: string) => {
    // 匹配@用户名的正则表达式
    const mentionRegex = /@(\S+)\s+(.*)$/
    const match = content.match(mentionRegex)
    
    if (match) {
      const [, username, restContent] = match
      return (
        <span>
          <span className="text-blue-400 font-medium">@{username}</span>
          <span> {restContent}</span>
        </span>
      )
    }
    
    return content
  }

  return (
    <>
      {/* 评论列表 */}
      <div className="space-y-4 pb-32">
        <h3 className="text-lg font-semibold text-text-primary">
          评论 ({commentsCount})
        </h3>
        
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* 主评论 */}
              <div className="bg-background border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-pink-400 flex items-center justify-center text-white text-sm font-medium">
                      {comment.user.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (comment.user.nickname || '匿名').charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{comment.user.nickname}</div>
                      <div className="text-xs text-text-muted">{comment.timestamp}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onLikeComment(comment.id)}
                      className="flex items-center space-x-1 text-text-muted hover:text-pink-400 transition-colors"
                    >
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{comment.likes}</span>
                    </button>
                    <button
                      onClick={() => handleReply(comment)}
                      className="flex items-center space-x-1 text-text-muted hover:text-blue-400 transition-colors"
                    >
                      <Reply className="h-4 w-4" />
                      <span className="text-sm">回复</span>
                    </button>
                  </div>
                </div>
                <p className="text-text-secondary leading-relaxed">{renderCommentContent(comment.content)}</p>
              </div>

              {/* 回复列表 */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-background-card border border-gray-600 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-400 flex items-center justify-center text-white text-xs font-medium">
                            {reply.user.avatar ? (
                              <img
                                src={reply.user.avatar}
                                alt={reply.user.nickname}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (reply.user.nickname || '匿名').charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text-primary">{reply.user.nickname}</div>
                            <div className="text-xs text-text-muted">{reply.timestamp}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onLikeComment(reply.id)}
                            className="flex items-center space-x-1 text-text-muted hover:text-pink-400 transition-colors"
                          >
                            <Heart className="h-3 w-3" />
                            <span className="text-xs">{reply.likes}</span>
                          </button>
                          <button
                            onClick={() => handleReply(comment)}
                            className="flex items-center space-x-1 text-text-muted hover:text-blue-400 transition-colors"
                          >
                            <Reply className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                        <p className="text-sm text-text-secondary leading-relaxed">{renderCommentContent(reply.content)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-text-muted py-8">
            暂无评论，来发表第一条评论吧！
          </div>
        )}
      </div>

      {/* 评论输入框 - 固定在弹窗底部 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-card border-t border-gray-700 p-4 z-[1101]">
        <div className="max-w-4xl mx-auto">
          {/* 回复提示 */}
          {replyingTo && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-400">
                <Reply className="h-4 w-4" />
                <span className="text-sm">回复 @{replyingTo.user.nickname}</span>
              </div>
              <button
                onClick={cancelReply}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <div className="flex space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-pink-400 flex items-center justify-center text-white text-sm font-medium">
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 relative">
              <input
                id="comment-input"
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `回复 @${replyingTo.user.nickname}...` : "写下你的想法..."}
                className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg focus:border-pink-400 focus:outline-none text-text-primary"
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
            </div>
            <button
              onClick={handleComment}
              disabled={!newComment.trim()}
              className="px-4 py-3 bg-pink-400 hover:bg-pink-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
