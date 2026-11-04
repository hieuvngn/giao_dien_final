'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/shell/app-shell'
import LandingPage from '@/components/landing/landing-page'
import ShadowingList from '@/components/shadowing/shadowing-list'
import VideoDetail from '@/components/shadowing/video-detail'
import CreateFile from '@/components/create/create-file'
import RoadmapDetail from '@/components/roadmap/roadmap-detail'
import LessonStudy from '@/components/study/lesson-study'
import ReviewStats from '@/components/review/review-stats'
import Leaderboard from '@/components/leaderboard/leaderboard'
import Dictionary from '@/components/dictionary/dictionary'
import VideoLearning from '@/components/video/video-learning'
import SpeakingHub from '@/components/speaking/speaking-hub'
import MistakeHub from '@/components/mistakes/mistake-hub'
import TwinProfile from '@/components/twin/twin-profile'
import WritingHub from '@/components/writing/writing-hub'
import ExamHub from '@/components/exam/exam-hub'
import Practice from '@/components/exam/practice'
import MockExam from '@/components/exam/mock-exam'
import Radicals from '@/components/radicals/radicals'
import Auth from '@/components/auth/auth'
import AdminHub from '@/components/admin/admin-hub'
import MyDecks from '@/components/account/my-decks'
import Achievements from '@/components/account/achievements'
import Profile from '@/components/account/profile'

function useHashRoute() {
  const [hash, setHash] = useState('')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    onChange()
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function Home() {
  const hash = useHashRoute()

  // Chỉ coi hash bắt đầu bằng "#/" là route; các anchor (#hsk…) để trình duyệt tự cuộn
  const route = hash.startsWith('#/') ? hash.slice(1) : '/'
  const isRoute = hash.startsWith('#/')

  useEffect(() => {
    if (isRoute) {
      window.scrollTo({ top: 0 })
    } else if (!hash || hash === '#top') {
      // Về trang landing không kèm anchor → về đầu trang
      window.scrollTo({ top: 0 })
    } else {
      // Về trang landing có kèm anchor (#hsk…): element chỉ tồn tại sau khi
      // LandingPage render, nên cuộn thủ công sau một nhịp vẽ.
      const id = hash.slice(1)
      const t = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
      return () => window.clearTimeout(t)
    }
  }, [isRoute, route, hash])

  let content: React.ReactNode
  if (route.startsWith('/lesson/')) {
    const parts = route.split('/') // ['', 'lesson', slug, kind, n]
    content = (
      <LessonStudy
        key={route}
        slug={parts[2]}
        kind={parts[3] === 'g' ? 'g' : 'v'}
        n={Number(parts[4]) || 1}
      />
    )
  } else if (route.startsWith('/roadmap/')) {
    content = <RoadmapDetail key={route} slug={route.split('/')[2]} />
  } else if (route.startsWith('/shadowing/')) {
    content = <VideoDetail key={route} id={route.split('/')[2]} />
  } else if (route === '/shadowing') {
    content = <ShadowingList />
  } else if (route.startsWith('/create-file')) {
    content = <CreateFile key={route} />
  } else if (route === '/review') {
    content = <ReviewStats />
  } else if (route === '/leaderboard') {
    content = <Leaderboard />
  } else if (route === '/dictionary') {
    content = <Dictionary />
  } else if (route === '/video') {
    content = <VideoLearning />
  } else if (route.startsWith('/exam/practice')) {
    content = <Practice key={route} paperId={route.split('/')[3]} />
  } else if (route.startsWith('/exam/mock')) {
    content = <MockExam key={route} paperId={route.split('/')[3]} />
  } else if (route === '/exam') {
    content = <ExamHub />
  } else if (route === '/radicals') {
    content = <Radicals />
  } else if (route === '/my-decks') {
    content = <MyDecks />
  } else if (route === '/achievements') {
    content = <Achievements />
  } else if (route === '/profile') {
    content = <Profile />
  } else if (route === '/speaking') {
    content = <SpeakingHub />
  } else if (route === '/mistakes') {
    content = <MistakeHub />
  } else if (route === '/twin') {
    content = <TwinProfile />
  } else if (route === '/writing') {
    content = <WritingHub />
  } else if (route === '/admin') {
    content = <AdminHub />
  } else if (route === '/login' || route === '/register') {
    content = <Auth key={route} initialMode={route === '/register' ? 'register' : 'login'} />
  } else {
    content = <LandingPage />
  }

  return <AppShell route={isRoute ? route : '/'}>{content}</AppShell>
}
