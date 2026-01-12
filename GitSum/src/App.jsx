import './App.css'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { EnterUserName } from './Web_Login_Page/Username'
import { Welcome } from './Web_Welcome_Page/Welcome'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome/>} />
        <Route path="/login" element={<EnterUserName />} />
      </Routes>
    </Router>
  )
}

export default App