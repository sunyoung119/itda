import { useState } from 'react'
import { Header } from './components/Header'
import { OnboardingModal } from './components/OnboardingModal'
import { WeeklyTopic } from './components/WeeklyTopic'
import { NoticeCard } from './components/NoticeCard'
import { TopList } from './components/TopList'
import { CategoryGrid } from './components/CategoryGrid'
import { MyGrowth } from './components/MyGrowth'
import { Compose } from './components/Compose'
import { Sidebar } from './components/Sidebar'
import { FilterSheet } from './components/FilterSheet'
import { ReactionSheet } from './components/ReactionSheet'
import { PostDetail } from './components/PostDetail'
import { useCurrentUser } from './hooks/useCurrentUser'
import { EMPTY_FILTER, isFilterActive, type PostWithAuthor } from './lib/queries'
import type { FilterState } from './types'

/**
 * 앱 셸 — 메인 화면 (모바일 세로, 상하 50:50).
 * 상단(스크롤): 화두 · 공지 · TOP5 · 카테고리
 * 하단(고정):   내 성장 · 자연어 입력
 *
 * refreshSignal — 글 등록/반응 후 값을 올리면 TOP5/카테고리/내성장/사이드바가 재조회된다.
 * 오버레이: 사이드바 / 필터 시트(panel) · 글 상세(detailPost) · 반응 시트(reactionPost).
 */
export default function App() {
  const { user, loading, saveUser } = useCurrentUser()
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)
  const [panel, setPanel] = useState<'sidebar' | 'filter' | null>(null)
  const [detailPost, setDetailPost] = useState<PostWithAuthor | null>(null)
  const [reactionPost, setReactionPost] = useState<PostWithAuthor | null>(null)

  const bump = () => setRefreshSignal((s) => s + 1)
  const filterOn = isFilterActive(filter)

  return (
    <div className="relative mx-auto flex h-[100dvh] max-w-[420px] flex-col overflow-hidden bg-bg shadow-2xl">
      <Header
        user={user}
        filterActive={filterOn}
        onMenu={() => setPanel('sidebar')}
        onFilter={() => setPanel('filter')}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 상단 50% — 스크롤 */}
        <main className="no-scrollbar flex-1 overflow-y-auto bg-bg px-[18px] pb-3">
          <WeeklyTopic />
          <NoticeCard />
          {filterOn && (
            <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-coral-soft bg-coral-soft/50 px-3 py-2">
              <span className="text-xs font-bold text-coral-dark">필터 적용 중</span>
              <button
                type="button"
                onClick={() => setFilter(EMPTY_FILTER)}
                className="ml-auto text-[11px] font-extrabold text-coral-dark underline"
              >
                해제
              </button>
            </div>
          )}
          <TopList
            filter={filter}
            refreshSignal={refreshSignal}
            onOpenPost={setDetailPost}
            onOpenReactions={setReactionPost}
          />
          <CategoryGrid refreshSignal={refreshSignal} />
        </main>

        <div className="h-1.5 flex-shrink-0 bg-gradient-to-b from-black/[0.03] to-transparent" />

        {/* 하단 50% — 고정 */}
        <section className="flex flex-1 flex-col gap-2 border-t border-border bg-gradient-to-b from-white to-bg px-[18px] py-3">
          {user && (
            <>
              <MyGrowth user={user} refreshSignal={refreshSignal} />
              <Compose user={user} onPosted={bump} />
            </>
          )}
        </section>
      </div>

      {/* 오버레이 */}
      {panel === 'sidebar' && (
        <Sidebar
          filter={filter}
          refreshSignal={refreshSignal}
          onClose={() => setPanel(null)}
          onOpenPost={(p) => {
            setPanel(null)
            setDetailPost(p)
          }}
        />
      )}
      {panel === 'filter' && (
        <FilterSheet
          current={filter}
          onClose={() => setPanel(null)}
          onApply={(f) => {
            setFilter(f)
            // 필터를 걸면 결과를 바로 볼 수 있도록 사이드바를 연다
            setPanel(isFilterActive(f) ? 'sidebar' : null)
          }}
        />
      )}
      {reactionPost && user && (
        <ReactionSheet
          post={reactionPost}
          user={user}
          onClose={() => setReactionPost(null)}
          onChanged={bump}
        />
      )}
      {detailPost && user && (
        <PostDetail
          post={detailPost}
          user={user}
          onClose={() => setDetailPost(null)}
          onChanged={bump}
        />
      )}

      {!loading && !user && <OnboardingModal onComplete={saveUser} />}
    </div>
  )
}
