'use client'

// Forced redeploy to clear stale Vercel cache
import { createClient } from '@/utils/supabase/client'
import { Bookmark as BookmarkIcon, Plus, Trash2, LogOut, ExternalLink, RefreshCw } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Bookmark = {
  id: string
  url: string
  title: string
  created_at: string
  user_id: string
}

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      fetchBookmarks()
    }

    checkUser()

    // Real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          console.log('Change received!', payload)
          fetchBookmarks()
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookmarks:', error)
    } else {
      setBookmarks(data || [])
    }
    setLoading(false)
  }

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl || !newTitle || !user) return

    // Create a temporary ID for optimistic update
    const tempId = Math.random().toString()
    const newBookmark: Bookmark = {
      id: tempId,
      url: newUrl,
      title: newTitle,
      created_at: new Date().toISOString(),
      user_id: user.id
    }

    // Update UI immediately (Optimistic)
    setBookmarks(prev => [newBookmark, ...prev])
    setNewUrl('')
    setNewTitle('')

    const { error } = await supabase.from('bookmarks').insert([
      {
        url: newUrl,
        title: newTitle,
        user_id: user.id,
      },
    ])

    if (error) {
      alert('Error adding bookmark: ' + error.message)
      // Rollback on error
      fetchBookmarks()
    }
  }

  const deleteBookmark = async (id: string) => {
    // Update UI immediately (Optimistic)
    setBookmarks(prev => prev.filter(b => b.id !== id))

    const { error } = await supabase.from('bookmarks').delete().match({ id })
    if (error) {
      alert('Error deleting bookmark: ' + error.message)
      // Rollback on error
      fetchBookmarks()
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookmarkIcon className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-xl tracking-tight">Smart Bookmark</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden sm:inline">{user?.email}</span>
            <button
              onClick={signOut}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-1 text-blue-600" />
            Add New Bookmark
          </h2>
          <form onSubmit={addBookmark} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title (e.g., Google)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
            <input
              type="url"
              placeholder="URL (e.g., https://google.com)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
            <button
              type="submit"
              className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Bookmark
            </button>
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Bookmarks</h2>
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{bookmarks.length}</span>
          </div>

          <div className="space-y-4">
            {bookmarks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <BookmarkIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No bookmarks yet. Start adding some!</p>
              </div>
            ) : (
              bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="font-semibold text-gray-900 truncate">{bookmark.title}</h3>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center mt-0.5 truncate"
                    >
                      {bookmark.url}
                      <ExternalLink className="w-3 h-3 ml-1 inline-block" />
                    </a>
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}