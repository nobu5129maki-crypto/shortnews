import { Feed } from './components/Feed'
import { GenreSetup } from './components/GenreSetup'
import { useMyGenres } from './hooks/useMyGenres'

function App() {
  const { ready, setupDone, myGenres, completeSetup, replaceGenres } = useMyGenres()

  if (!ready) {
    return (
      <div className="boot-shell" aria-busy="true">
        <p className="brand">BRIEF</p>
      </div>
    )
  }

  if (!setupDone) {
    return <GenreSetup onComplete={completeSetup} />
  }

  return <Feed myGenres={myGenres} onReplaceGenres={replaceGenres} />
}

export default App
