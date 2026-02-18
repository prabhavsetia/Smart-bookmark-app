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
        <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <BookmarkIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tighter text-neutral-900 italic">SMART BOOKMARK</span>
          </div>
          <div className="flex items-center space-x-5">
            <span className="text-sm font-medium text-neutral-500 hidden sm:inline">{user?.email}</span>
            <button
              onClick={signOut}
              className="p-2.5 text-neutral-400 hover:text-red-600 transition-all rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 mt-10">
        <section className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm mb-10 transition-all hover:shadow-md">
          <h2 className="text-xl font-bold mb-6 flex items-center text-neutral-800">
            <div className="p-1.5 bg-red-50 rounded-md mr-2">
              <Plus className="w-5 h-5 text-red-600" />
            </div>
            New Bookmark
          </h2>
          <form onSubmit={addBookmark} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Title</label>
              <input
                type="text"
                placeholder="e.g., Google"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-red-50 focus:border-red-500 outline-none transition-all font-medium text-neutral-900 placeholder:text-neutral-300"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-red-50 focus:border-red-500 outline-none transition-all font-medium text-neutral-900 placeholder:text-neutral-300"
                required
              />
            </div>
            <button
              type="submit"
              className="md:col-span-2 bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-[0.99] mt-2"
            >
              Save Bookmark
            </button>
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-xl font-bold text-neutral-800">Your Collection</h2>
            <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">{bookmarks.length} Items</span>
          </div>

          <div className="grid gap-4">
            {bookmarks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-neutral-200">
                <div className="bg-neutral-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookmarkIcon className="w-8 h-8 text-neutral-300" />
                </div>
                <p className="text-neutral-400 font-bold text-lg">Your library is empty</p>
                <p className="text-neutral-300 text-sm mt-1">Add your first bookmark above</p>
              </div>
            ) : (
              bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between group hover:border-red-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-1 min-w-0 mr-6">
                    <h3 className="font-bold text-xl text-neutral-900 truncate leading-tight">{bookmark.title}</h3>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-red-500 hover:text-red-600 font-medium flex items-center mt-1.5 transition-colors group/link"
                    >
                      <span className="truncate max-w-[90%]">{bookmark.url.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="p-3 text-neutral-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-100"
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