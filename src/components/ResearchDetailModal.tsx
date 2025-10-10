'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X, Calendar, Eye, Heart, MessageCircle, TrendingUp, CheckCircle, Rocket, Reply, Bookmark } from 'lucide-react'

interface CommentItem {
  id: string
  content: string
  timestamp: string
  likes: number
  parent_id: number
  user: {
    nickname: string
    avatar: string
  }
  replies?: CommentItem[]
}

export interface ResearchReportDetail {
  id: number
  title: string
  author: string
  publish_date: string
  views: number
  likes: number
  comments_count: number
  tags: string[]
  content: string
  video_url?: string
  isParticipated?: boolean
  isLiked?: boolean
  isFavorited?: boolean
  commentsList?: CommentItem[]
}

interface ResearchDetailModalProps {
  report: ResearchReportDetail
  visible: boolean
  onClose: () => void
  onParticipate?: () => void
  onToggleLike?: () => void
  onToggleFavorite?: () => void
  onCommentLike?: (commentId: string) => void
  onSubmitComment?: (content: string, replyingToId?: string) => void
}

export default function ResearchDetailModal({
  report,
  visible,
  onClose,
  onParticipate,
  onToggleLike,
  onToggleFavorite,
  onCommentLike,
  onSubmitComment
}: ResearchDetailModalProps) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null)

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1100] p-4">
      <div className="bg-background-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-background-card border-b border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="bg-pink-400/10 text-pink-400 px-3 py-1 rounded-full text-sm font-medium">
              {report.tags && report.tags.length > 0 ? report.tags[0] : '研究报告'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {onParticipate && (
              <button
                onClick={onParticipate}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  report?.isParticipated
                    ? 'bg-green-500 hover:bg-green-600 text-white cursor-default'
                    : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white'
                }`}
                disabled={report?.isParticipated}
              >
                {report?.isParticipated ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>已参与</span>
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    <span>立即参与</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            {report.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mb-6">
            <span>作者: {report.author}</span>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{report.publish_date}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{report.views?.toLocaleString?.() || report.views} 阅读</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {report.tags?.map((tag) => (
              <span key={tag} className="bg-gray-600/20 text-text-muted px-2 py-1 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>

          {report.video_url && (
            <div className="mb-6">
              <div className="aspect-video">
                <iframe
                  src={report.video_url}
                  className="w-full h-full rounded-lg border border-gray-200"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${report.title} - 视频`}
                ></iframe>
              </div>
            </div>
          )}

          <div className="prose prose-invert max-w-none mb-8 text-text-primary leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.content}
            </ReactMarkdown>
          </div>

          {/* Interaction */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                {onToggleLike && (
                  <button
                    onClick={onToggleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      report.isLiked
                        ? 'bg-pink-400 text-white'
                        : 'bg-gray-700 text-text-secondary hover:bg-pink-400/20 hover:text-pink-400'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${report.isLiked ? 'fill-current' : ''}`} />
                    <span>{report.likes}</span>
                  </button>
                )}

                {onToggleFavorite && (
                  <button
                    onClick={onToggleFavorite}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      report.isFavorited
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-700 text-text-secondary hover:bg-yellow-400/20 hover:text-yellow-400'
                    }`}
                    title={report.isFavorited ? '取消收藏' : '收藏'}
                  >
                    <Bookmark className={`h-5 w-5 ${report.isFavorited ? 'fill-current' : ''}`} />
                    <span>{report.isFavorited ? '已收藏' : '收藏'}</span>
                  </button>
                )}

                <div className="flex items-center space-x-2 text-text-muted">
                  <MessageCircle className="h-5 w-5" />
                  <span>{report.comments_count} 评论</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-text-muted">
                <TrendingUp className="h-5 w-5" />
                <span>热度上升</span>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-4 pb-32">
              <h3 className="text-lg font-semibold text-text-primary">评论 ({report.comments_count})</h3>
              {report.commentsList && report.commentsList.length > 0 ? (
                report.commentsList.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="bg-background border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-pink-400 flex items-center justify-center text-white text-sm font-medium">
                            {comment.user.avatar ? (
                              <img src={comment.user.avatar} alt={comment.user.nickname} className="w-full h-full object-cover" />
                            ) : (
                              comment.user.nickname.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{comment.user.nickname}</div>
                            <div className="text-xs text-text-muted">{comment.timestamp}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {onCommentLike && (
                            <button
                              onClick={() => onCommentLike(comment.id)}
                              className="flex items-center space-x-1 text-text-muted hover:text-pink-400 transition-colors"
                            >
                              <Heart className="h-4 w-4" />
                              <span className="text-sm">{comment.likes}</span>
                            </button>
                          )}
                          <button
                            onClick={() => setReplyingTo(comment)}
                            className="flex items-center space-x-1 text-text-muted hover:text-blue-400 transition-colors"
                          >
                            <Reply className="h-4 w-4" />
                            <span className="text-sm">回复</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-text-secondary leading-relaxed">{comment.content}</p>
                    </div>

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="bg-background-card border border-gray-600 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-400 flex items-center justify-center text-white text-xs font-medium">
                                  {reply.user.avatar ? (
                                    <img src={reply.user.avatar} alt={reply.user.nickname} className="w-full h-full object-cover" />
                                  ) : (
                                    reply.user.nickname.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-text-primary">{reply.user.nickname}</div>
                                  <div className="text-xs text-text-muted">{reply.timestamp}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {onCommentLike && (
                                  <button
                                    onClick={() => onCommentLike(reply.id)}
                                    className="flex items-center space-x-1 text-text-muted hover:text-pink-400 transition-colors"
                                  >
                                    <Heart className="h-3 w-3" />
                                    <span className="text-xs">{reply.likes}</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => setReplyingTo(comment)}
                                  className="flex items-center space-x-1 text-text-muted hover:text-blue-400 transition-colors"
                                >
                                  <Reply className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-text-muted py-8">暂无评论，来发表第一条评论吧！</div>
              )}
            </div>

            {/* Comment input fixed at bottom of modal */}
            <div className="fixed bottom-0 left-0 right-0 bg-background-card border-t border-gray-700 p-4 z-[1101]">
              <div className="max-w-4xl mx-auto">
                {replyingTo && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-blue-400">
                      <Reply className="h-4 w-4" />
                      <span className="text-sm">回复 @{replyingTo.user.nickname}</span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-blue-400 hover:text-blue-300 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      id="comment-input"
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyingTo ? `回复 @${replyingTo.user.nickname}...` : '写下你的想法...'}
                      className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg focus:border-pink-400 focus:outline-none text-text-primary"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newComment.trim()) {
                          onSubmitComment?.(newComment.trim(), replyingTo ? replyingTo.id : undefined)
                          setNewComment('')
                          setReplyingTo(null)
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!newComment.trim()) return
                      onSubmitComment?.(newComment.trim(), replyingTo ? replyingTo.id : undefined)
                      setNewComment('')
                      setReplyingTo(null)
                    }}
                    disabled={!newComment.trim()}
                    className="px-4 py-3 bg-pink-400 hover:bg-pink-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


