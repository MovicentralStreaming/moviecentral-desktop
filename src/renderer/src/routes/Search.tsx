import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { MovieItemGrid } from '../components/MovieItemGrid'
import { Loader } from '@renderer/components/Loader'
import { MovieItem } from '@shared/types'
import tmdb from '../helper/tmdb'

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
        const searchResults = await tmdb.search(query, page)

        if (!searchResults) {
          setResults([])
          setHasMore(false)
          return
        }

        setResults((prevResults) =>
          page === 1 ? searchResults.results : [...prevResults, ...searchResults.results]
        )
        setHasMore(searchResults.hasNextPage && searchResults.results.length > 0)
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
            {isLoading && <Loader />}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-8">
          {isLoading ? <Loader /> : <p>No results found for "{query}"</p>}
        </div>
      )}
    </div>
  )
}
