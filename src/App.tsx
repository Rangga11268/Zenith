import React from 'react'
import { NotchBar } from './components/NotchBar'

export const App: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex flex-col items-center">
      <NotchBar />
    </div>
  )
}

export default App
