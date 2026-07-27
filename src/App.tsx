import { Feed } from './components/Feed'
import { InstallPrompt } from './components/InstallPrompt'
import { useMyGenres } from './hooks/useMyGenres'

function App() {
  const { ready, myGenres, addGenre, removeGenre } = useMyGenres()

  if (!ready) {
    return (
      <div className="boot-shell" aria-busy="true">
        <p className="brand">BRIEF</p>
      </div>
    )
  }

  return (
    <>
      <Feed
        myGenres={myGenres}
        onAddGenre={addGenre}
        onRemoveGenre={removeGenre}
      />
      <InstallPrompt />
    </>
  )
}

export default App
