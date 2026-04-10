import { useState } from 'react'
import { useStore } from '../store'
import { feedbackApi } from '../services/api'

export function FeedbackBanner() {
  const { feedbackSubmitted, setFeedbackSubmitted, userProfile, utm } = useStore()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(feedbackSubmitted)

  if (done) return null

  const handleStarClick = (star: number) => {
    setRating(star)
    setExpanded(true)
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setLoading(true)
    try {
      await feedbackApi.submit({
        rating,
        comment: comment || undefined,
        purchase_type: userProfile.purchaseType,
        utm_source: utm.source,
        utm_campaign: utm.campaign,
      })
      setFeedbackSubmitted(true)
      setDone(true)
    } catch {
      // Silent fail — don't interrupt the user
    } finally {
      setLoading(false)
    }
  }

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 max-w-md w-full">
        {!expanded ? (
          <div className="flex items-center justify-between px-5 py-3 gap-4">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">How useful was this?</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => handleStarClick(star)}
                  aria-label={`Rate ${star} stars`}
                  className={`text-2xl transition-transform hover:scale-125 leading-none ${
                    star <= (hovered || rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                {labels[rating]} — thanks! Any comments?
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What worked well? What should we improve? (optional)"
              rows={3}
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex justify-between items-center">
              <button
                onClick={() => { setExpanded(false); setRating(0) }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className="bg-blue-600 text-white text-sm px-5 py-2 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending…' : 'Submit feedback →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
