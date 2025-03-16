import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { MovieItemGrid } from '../components/MovieItemGrid'
import { Loader } from '@renderer/components/Loader'
import { ItemsLabel } from '@renderer/components/ItemsLabel'
import { MovieItem } from '@shared/types'

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
          `http://localhost:5555/api/search/${encodeURIComponent(query)}/${page}`
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (page === 1) {
          setResults(data.results as MovieItem[])
        } else {
          setResults((prevResults) => [...prevResults, ...(data.results as MovieItem[])])
        }

        setHasMore(data.hasNextPage)
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
      { threshold: 0.5 }
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
          <ItemsLabel>Results For "{query}"</ItemsLabel>
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
