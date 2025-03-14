import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { MovieItem } from '../types/types'
import { MovieItemGrid } from '../components/MovieItemGrid'
import { Loader } from '@renderer/components/Loader'

const apiKey = 'a4b333e38a353f9746a776a9a8d36a62'

export default function Search() {
  const [results, setResults] = useState<MovieItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const { query } = useParams()

  const observerTarget = useRef<HTMLDivElement>(null)

  const fetchSearchResults = useCallback(
    async (page: number) => {
      if (!query) return

      setIsLoading(true)

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&api_key=${apiKey}&include_adult=false&language=en-US&page=${page}`
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        const items: MovieItem[] = data.results
          .filter((res: any) => res.poster_path)
          .map((res: any) => ({
            title: res.title || res.name,
            poster: `https://image.tmdb.org/t/p/w500${res.poster_path}`,
            id: res.id,
            media_type: res.media_type
          }))

        setResults((prevResults) => (page === 1 ? items : [...prevResults, ...items]))

        setHasMore(page < data.total_pages && items.length > 0)
      } catch (error) {
        console.error('Error fetching search results:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [query]
  )

  useEffect(() => {
    setResults([])
    setCurrentPage(1)
    setHasMore(true)
    fetchSearchResults(1)
  }, [query, fetchSearchResults])

  useEffect(() => {
    if (!hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setCurrentPage((prevPage) => prevPage + 1)
        }
      },
      { threshold: 1.0 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoading])

  useEffect(() => {
    if (currentPage > 1) {
      fetchSearchResults(currentPage)
    }
  }, [currentPage, fetchSearchResults])

  return (
    <div className="min-h-screen">
      {results.length > 0 ? (
        <>
          <MovieItemGrid items={results} />
          <div ref={observerTarget} className="py-4 text-center">
            {isLoading && <Loader></Loader>}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-8">
          {isLoading ? <Loader></Loader> : <p>No results found for "{query}"</p>}
        </div>
      )}
    </div>
  )
}
