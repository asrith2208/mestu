"use client"

import type React from "react"

import { useState } from "react"
import ThreadDetail from "./thread-detail"

interface CommunityProps {
  user: any
}

import { collection, addDoc, query, orderBy, onSnapshot, where } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

export default function Community({ user }: CommunityProps) {
  const [threads, setThreads] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedThread, setSelectedThread] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
  })

  useEffect(() => {
    // Real-time listener for posts
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure replies array exists
        replies: doc.data().replies || []
      }))
      setThreads(posts)
    }, (error) => {
      console.error("Error fetching posts:", error)
    })

    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser || !user) {
      alert("You must be logged in to post.")
      return
    }

    try {
      const newPost = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        author: user.name || "Anonymous", // Use real name from props
        // Basic random avatar logic based on name length if no real avatar
        avatar: "👤",
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
      }

      await addDoc(collection(db, "posts"), newPost)
      setFormData({ title: "", content: "", category: "general" })
      setShowForm(false)
    } catch (error) {
      console.error("Error posting:", error)
      alert("Failed to post discussion.")
    }
  }

  const filteredThreads = threads.filter((thread) => {
    const matchesCategory = selectedCategory === "all" || thread.category === selectedCategory
    const matchesSearch =
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Community Forums</h2>
        <p className="text-muted-foreground">Connect with others and share experiences</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search discussions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* New Thread Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-smooth"
      >
        {showForm ? "Cancel" : "+ Start Discussion"}
      </button>

      {/* New Thread Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-lg p-6 mb-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="What's on your mind?"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="general">General Support</option>
                <option value="pcos">PCOS</option>
                <option value="endo">Endometriosis</option>
                <option value="pmdd">PMDD</option>
                <option value="tips">Tips & Tricks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Message</label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="Share your thoughts..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-smooth"
            >
              Post Discussion
            </button>
          </form>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: "all", label: "All" },
          { id: "general", label: "General" },
          { id: "pcos", label: "PCOS" },
          { id: "endo", label: "Endometriosis" },
          { id: "pmdd", label: "PMDD" },
          { id: "tips", label: "Tips & Tricks" },
        ].map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full font-semibold transition-smooth ${selectedCategory === category.id ? "bg-primary text-white" : "bg-muted text-foreground hover:bg-border"
              }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Threads List */}
      <div className="space-y-4">
        {filteredThreads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No discussions found. Be the first to start one!</p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className="bg-white border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-smooth cursor-pointer"
            >
              <div className="flex gap-4">
                <div className="text-3xl">{thread.avatar}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full capitalize">
                        {thread.category}
                      </span>
                      <h3 className="text-lg font-semibold text-foreground mt-2">{thread.title}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{thread.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{thread.content}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">By {thread.author}</span>
                    <div className="flex gap-4 text-muted-foreground">
                      <span>👍 {thread.likes}</span>
                      <span>💬 {thread.replies.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Thread Detail Modal */}
      {selectedThread && (
        <ThreadDetail
          thread={selectedThread}
          onClose={() => setSelectedThread(null)}
          onAddReply={(reply) => {
            setSelectedThread({ ...selectedThread, replies: [...selectedThread.replies, reply] })
          }}
        />
      )}
    </div>
  )
}
