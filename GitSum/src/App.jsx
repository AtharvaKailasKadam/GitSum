import './App.css'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { EnterUserName } from './Web_Login_Page/Username'
import { Welcome } from './Web_Welcome_Page/Welcome'
import { Summarizer } from './Web_Profile_Page/Summarizer'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome/>} />
        <Route path="/login" element={<EnterUserName />} />
        <Route path="/profile/:username" element={<Summarizer />} />
      </Routes>
    </Router>
  )
}

export default App