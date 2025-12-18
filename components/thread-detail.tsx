"use client"

import type React from "react"
import { useState } from "react"

interface ThreadDetailProps {
  thread: any
  onClose: () => void
  onAddReply: (reply: any) => void
}

export default function ThreadDetail({ thread, onClose, onAddReply }: ThreadDetailProps) {
  const [replyContent, setReplyContent] = useState("")
  const [replies, setReplies] = useState(thread.replies || [])

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    const newReply = {
      id: Date.now(),
      author: "You",
      avatar: "👤",
      content: replyContent,
      timestamp: "just now",
      likes: 0,
      liked: false,
    }
    setReplies([...replies, newReply])
    setReplyContent("")
  }

  const toggleLike = (replyId: number) => {
    setReplies(
      replies.map((reply: any) =>
        reply.id === replyId
          ? { ...reply, liked: !reply.liked, likes: reply.liked ? reply.likes - 1 : reply.likes + 1 }
          : reply,
      ),
    )
  }

  return (

    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[85vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

        {/* Header - Simple Drag Handle / Title */}
        <div className="flex-none p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="w-10"></div> {/* Spacer */}
          <h3 className="font-bold text-gray-900">Comments</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Original Post Context */}
          <div className="flex gap-3 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0">
              {thread.author?.charAt(0) || "A"}
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-gray-900">{thread.author} <span className="font-normal text-gray-500">• {thread.timestamp ? "Just now" : "Recently"}</span></p>
              <p className="text-gray-800 text-sm leading-relaxed">{thread.content}</p>
            </div>
          </div>

          {/* Replies List */}
          <div className="space-y-5">
            {replies.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No comments yet. Be the first to say something!
              </div>
            ) : (
              replies.map((reply: any) => (
                <div key={reply.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                    {reply.author?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{reply.author}</span>
                      <span className="text-xs text-gray-400">{reply.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700">{reply.content}</p>
                    <button className="text-xs font-semibold text-gray-400 mt-1 hover:text-gray-600">Reply</button>
                  </div>
                  <button
                    onClick={() => toggleLike(reply.id)}
                    className="self-start text-gray-400 hover:text-pink-500 transition-colors -mt-1 p-2"
                  >
                    <span className="block text-center text-[10px] w-full">{reply.likes > 0 ? reply.likes : ""}</span>
                    {reply.liked ? "❤️" : "♡"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sticky Bottom Input Bar */}
        <div className="flex-none p-4 border-t border-gray-100 bg-white">
          <form onSubmit={handleReplySubmit} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              Me
            </div>
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Add a comment for ${thread.author}...`}
              className="flex-1 bg-gray-100 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-purple-100 transition-all placeholder-gray-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!replyContent.trim()}
              className="text-purple-600 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:text-purple-700 px-2"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
