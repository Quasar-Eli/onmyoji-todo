import { HashRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { Navbar } from "@/components/Navbar"
import { HomePage } from "@/pages/HomePage"
import { GamePage } from "@/pages/GamePage"
import { ArticlePage } from "@/pages/ArticlePage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { AdminPage } from "@/pages/AdminPage"
import { AdminGamePage } from "@/pages/AdminGamePage"

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game/:slug" element={<GamePage />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/game/:gameId" element={<AdminGamePage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AuthProvider>
  )
}