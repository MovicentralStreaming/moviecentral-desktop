import { ItemsLabel } from '@renderer/components/ItemsLabel'
import { Loader } from '@renderer/components/Loader'
import { MovieItemGrid } from '@renderer/components/MovieItemGrid'
import tmdb from '@renderer/helper/tmdb'
import user from '@renderer/helper/user'
import { MovieItem } from '@shared/types'
import { useEffect, useState } from 'react'

export default function Index() {
  const [isLoading, setIsLoading] = useState(true)
  const [watchHistory, setWatchHistory] = useState<MovieItem[] | undefined>(undefined)
  const [trending, setTrending] = useState<MovieItem[] | undefined>(undefined)

  useEffect(() => {
    async function getData() {
      const trendingItems = await tmdb.getTrending()
      const historyItems = await user.getHistory()

      const filteredHistory = getLatestHistory(historyItems || [])

      setWatchHistory(filteredHistory)
      setTrending(trendingItems)
      setIsLoading(false)
    }
    getData()
  }, [])

  function getLatestHistory(items: MovieItem[]): MovieItem[] {
    const historyMap = new Map<string, MovieItem>()

    items.forEach((item) => {
      const existingItem = historyMap.get(item.id)

      const itemWatchedAt = item.watched_at ?? -Infinity
      const existingItemWatchedAt = existingItem?.watched_at ?? -Infinity

      if (
        !existingItem ||
        (item.season && existingItem.season && item.season > existingItem.season) ||
        (item.season === existingItem.season &&
          item.episode &&
          existingItem.episode &&
          item.episode > existingItem.episode) ||
        itemWatchedAt > existingItemWatchedAt
      ) {
        historyMap.set(item.id, item)
      }
    })

    const sortedHistory = Array.from(historyMap.values()).sort((a, b) => {
      const aWatchedAt = a.watched_at ?? -Infinity
      const bWatchedAt = b.watched_at ?? -Infinity
      return bWatchedAt - aWatchedAt
    })

    return sortedHistory.slice(0, 20)
  }

  return (
    <div className="flex w-full flex-col">
      {watchHistory ? (
        <>
          <ItemsLabel>Continue Watching</ItemsLabel>
          <MovieItemGrid items={watchHistory} />
          <div className="py-4 text-center">{isLoading && <Loader />}</div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-8">
          {isLoading && <Loader />}
        </div>
      )}
      {trending ? (
        <>
          <ItemsLabel>Trending This Week</ItemsLabel>
          <MovieItemGrid items={trending} />
          <div className="py-4 text-center">{isLoading && <Loader />}</div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-8">
          {isLoading && <Loader />}
        </div>
      )}
    </div>
  )
}
