import { HashRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { Navbar } from "@/components/Navbar"
import { HomePage } from "@/pages/HomePage"
import { GamePage } from "@/pages/GamePage"
import { ArticlePage } from "@/pages/ArticlePage"
import { SearchPage } from "@/pages/SearchPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { AdminPage } from "@/pages/AdminPage"
import { AdminGamePage } from "@/pages/AdminGamePage"
import { AdminShikigamiPage } from "@/pages/AdminShikigamiPage"
import { AdminSensitiveWordsPage } from "@/pages/AdminSensitiveWordsPage"
import { AdminAnnouncementsPage } from "@/pages/AdminAnnouncementsPage"
import { AdminDataPage } from "@/pages/AdminDataPage"
import { AdminItemsPage } from "@/pages/AdminItemsPage"
import { ItemsPage } from "@/pages/ItemsPage"
import { ItemsDetailPage } from "@/pages/ItemsDetailPage"
import { GachaPage } from "@/pages/GachaPage"
import { ToolsPage } from "@/pages/ToolsPage"
import { TopicsPage } from "@/pages/TopicsPage"
import { TopicsDetailPage } from "@/pages/TopicsDetailPage"
import { SubmitArticlePage } from "@/pages/SubmitArticlePage"
import { ShikigamiPage } from "@/pages/ShikigamiPage"
import { ShikigamiDetailPage } from "@/pages/ShikigamiDetailPage"

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
              <Route path="/game/:slug/shikigami" element={<ShikigamiPage />} />
              <Route path="/game/:slug/shikigami/:id" element={<ShikigamiDetailPage />} />
              <Route path="/game/:slug/items" element={<ItemsPage />} />
              <Route path="/game/:slug/items/:id" element={<ItemsDetailPage />} />
              <Route path="/game/:slug/gacha" element={<GachaPage />} />
              <Route path="/game/:slug/topics" element={<TopicsPage />} />
              <Route path="/game/:slug/topics/:id" element={<TopicsDetailPage />} />
              <Route path="/game/:slug/submit" element={<SubmitArticlePage />} />
              <Route path="/game/:slug/tools" element={<ToolsPage />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/game/:gameId" element={<AdminGamePage />} />
              <Route path="/admin/game/:gameId/shikigami" element={<AdminShikigamiPage />} />
              <Route path="/admin/game/:gameId/items" element={<AdminItemsPage />} />
              <Route path="/admin/sensitive-words" element={<AdminSensitiveWordsPage />} />
              <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
              <Route path="/admin/data" element={<AdminDataPage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AuthProvider>
  )
}