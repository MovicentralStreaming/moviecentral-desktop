import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Input from './InputComponent'
import { useEffect, useState } from 'react'
import logo from '../assets/icon.png'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [scrollY, setScrollY] = useState(0)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    navigate(`/search/${query}`)
  }

  useEffect(() => {
    setScrollY(window.scrollY)

    window.addEventListener('scroll', () => {
      setScrollY(window.scrollY)
    })

    return () => {
      window.removeEventListener('scroll', () => {
        setScrollY(window.scrollY)
      })
    }
  }, [])

  if (!location.pathname.includes('/watch')) {
    return (
      <header
        data-scroll-y={scrollY}
        className={`w-full flex items-center justify-between transition-colors duration-300 ${
          location.pathname.startsWith('/details') ? 'fixed' : 'sticky'
        }  z-[9998] top-0 p-4 gap-4 ${
          scrollY !== 0
            ? 'bg-gradient-to-b from-neutral-950 to-neutral-950'
            : 'bg-gradient-to-b from-neutral-950 to-transparent'
        }`}
      >
        <Link to={'/'} className="text-4xl select-none">
          <img
            draggable={false}
            alt="Movie Central"
            className="min-w-[42px] min-h-[42px]"
            src={logo}
            width="42"
            height="42"
          ></img>
        </Link>
        <form onSubmit={handleSearch} className="w-full max-w-2xl">
          <Input
            beforeContent={<MagnifyingGlassIcon className="w-5 h-5"></MagnifyingGlassIcon>}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            type="text"
            placeholder="Search for Movies or TV Shows..."
            required
            minLength={1}
            className={
              location.pathname.startsWith('/details') && scrollY === 0
                ? 'border-2 border-zinc-200'
                : 'border-2 border-zinc-500'
            }
          ></Input>
        </form>
        <button className="cursor-pointer">
          <Bars3Icon className="w-8 h-8"></Bars3Icon>
        </button>
      </header>
    )
  } else {
    return null
  }
}
