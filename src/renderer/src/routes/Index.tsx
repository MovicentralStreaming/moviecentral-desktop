import { ItemsLabel } from '@renderer/components/ItemsLabel'
import { Loader } from '@renderer/components/Loader'
import { MovieItemGrid } from '@renderer/components/MovieItemGrid'
import { getTrending } from '@renderer/helper/tmdb'
import { MovieItem } from '@renderer/types/types'
import { useEffect, useState } from 'react'

export default function Index() {
  const [isLoading, setIsLoading] = useState(true)
  const [trending, setTrending] = useState<MovieItem[] | undefined>(undefined)

  useEffect(() => {
    async function getData() {
      const items = await getTrending()
      setTrending(items)
      setIsLoading(false)
    }
    getData()
  }, [])
  return (
    <div className="flex w-full flex-col">
      {/* <div className="border-2 border-zinc-600 p-8 rounded-md h-fit text-center mt-8">
        <span className="text-lg">Search for a Movie or TV Show to get started.</span>
      </div> */}
      {trending ? (
        <>
          <ItemsLabel>Trending This Week</ItemsLabel>
          <MovieItemGrid items={trending} />
          <div className="py-4 text-center">{isLoading && <Loader></Loader>}</div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-8">
          {isLoading && <Loader></Loader>}
        </div>
      )}
    </div>
  )
}
