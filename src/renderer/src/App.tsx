import { Route, Routes } from 'react-router-dom'
import Index from './routes/Index'
import { Header } from './components/Header'
import Search from './routes/Search'
import Details from './routes/Details'
import Watch from './routes/Watch'

function App() {
  return (
    <>
      <Header></Header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Index />}></Route>
          <Route path="/search/:query" element={<Search />}></Route>
          <Route path="/details/:media_type/:id" element={<Details />}></Route>
          <Route path="/watch/:media_type/:id" element={<Watch />}></Route>
          <Route path="/watch/:media_type/:id/:season/:episode" element={<Watch />}></Route>
        </Routes>
      </main>
    </>
  )
}

export default App
