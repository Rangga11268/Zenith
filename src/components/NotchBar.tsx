import React, { useState, useEffect, useRef } from 'react'
import {
  GitBranch,
  Radio,
  CheckSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Music,
  Power,
  Activity,
  Layers
} from 'lucide-react'

// Track hit-testing state to prevent IPC thrashing and flickering
let isMouseIgnored: boolean | null = null
function updateHitTesting(interactive: boolean) {
  const shouldIgnore = !interactive
  if (isMouseIgnored === shouldIgnore) return
  isMouseIgnored = shouldIgnore
  window.devnotch?.setIgnoreMouseEvents(shouldIgnore, { forward: true })
}

export const NotchBar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'dev' | 'media' | 'tasks' | 'ai'>('dev')
  const [timeStr, setTimeStr] = useState(() => {
    const now = new Date()
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // Clock ticker for the pill
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])

  // Initial hit-testing setup
  useEffect(() => {
    updateHitTesting(false)
    return () => {
      isMouseIgnored = null
    }
  }, [])

  const handleMouseEnter = () => {
    updateHitTesting(true)
  }

  const handleMouseLeave = () => {
    updateHitTesting(false)
  }

  const handleClose = () => {
    setIsExpanded(false)
    window.devnotch?.expandWindow(false)
    updateHitTesting(false)
  }

  const toggleExpand = () => {
    const nextState = !isExpanded
    setIsExpanded(nextState)
    window.devnotch?.expandWindow(nextState)
    updateHitTesting(true)
  }

  // Handle Escape key and outside blur to smoothly collapse deck
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleClose()
      }
    }
    const handleBlur = () => {
      if (isExpanded) {
        handleClose()
      } else {
        updateHitTesting(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isExpanded])

  const handleQuit = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.devnotch?.closeApp()
  }

  return (
    <div className="w-full flex justify-center items-start select-none pt-0">
      <div
        ref={containerRef}
        data-testid="notch-pill"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseEnter}
        onPointerEnter={handleMouseEnter}
        onPointerLeave={handleMouseLeave}
        onPointerMove={handleMouseEnter}
        className={`
          relative bg-[#08090E] text-white border border-t-0 border-white/10
          shadow-[0_16px_36px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)]
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          backdrop-blur-xl overflow-hidden flex flex-col items-center justify-start
          ${
            isExpanded
              ? 'w-[540px] h-[420px] rounded-b-[24px] rounded-t-none px-5 py-4 cursor-default'
              : 'w-[260px] h-[38px] rounded-b-[18px] rounded-t-none cursor-pointer hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)]'
          }
        `}
        onClick={!isExpanded ? toggleExpand : undefined}
      >
        {/* COLLAPSED PILL VIEW */}
        {!isExpanded ? (
          <div className="w-[260px] h-[38px] flex items-center justify-between pointer-events-auto shrink-0 px-3.5">
            {/* Left: Indicator dot & Time */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold tracking-wide text-zinc-300 font-mono">
                {timeStr || 'ZENITH'}
              </span>
            </div>

            {/* Center: Brand / Mini HUD */}
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <span className="font-medium text-white/90 tracking-tight">Zenith</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[10px] text-emerald-400/90 font-mono">Ready</span>
            </div>

            {/* Right: Expand Trigger */}
            <div className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        ) : (
          /* EXPANDED DECK VIEW */
          <div className="w-full h-full flex flex-col justify-between">
            {/* Top Bar: Tabs & Controls */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('dev')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeTab === 'dev'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>Dev</span>
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeTab === 'media'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <Music className="w-3 h-3 text-pink-400" />
                  <span>Music</span>
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeTab === 'tasks'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <CheckSquare className="w-3 h-3 text-amber-400" />
                  <span>Tasks</span>
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeTab === 'ai'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>AI</span>
                </button>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Collapse"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleQuit}
                  className="p-1 rounded-full text-zinc-500 hover:text-red-400 hover:bg-white/10 transition-colors"
                  title="Quit Zenith"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 py-3 overflow-hidden">
              {activeTab === 'dev' && (
                <div className="h-full flex flex-col justify-between space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Git Status Card */}
                    <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                        <span className="flex items-center gap-1 font-medium">
                          <GitBranch className="w-3.5 h-3.5 text-emerald-400" /> Git Status
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                          Clean
                        </span>
                      </div>
                      <div className="text-sm font-medium text-zinc-200 font-mono truncate">
                        main
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        0 uncommitted changes
                      </div>
                    </div>

                    {/* Port Monitor Card */}
                    <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Radio className="w-3.5 h-3.5 text-blue-400" /> Dev Ports
                        </span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                          Listening
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded font-mono font-medium">
                          :5173
                        </span>
                        <span className="text-xs text-zinc-400 truncate">Vite Active</span>
                      </div>
                    </div>
                  </div>

                  {/* System HUD & Telemetry */}
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Living Notch Shell v1.0.0</span>
                    </div>
                    <span className="font-mono text-emerald-400 text-[11px]">60 FPS • 0% CPU</span>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                    <Music className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="text-sm font-medium text-zinc-200">No Media Playing</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Connect Spotify or Browser to view synchronized lyrics
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                    <CheckSquare className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-sm font-medium text-zinc-200">Daily Quick Tasks</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    All caught up! Press Enter in next milestone to add tasks.
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="h-full flex flex-col justify-between">
                  <div className="text-xs text-zinc-400 mb-2">
                    Quick AI Copilot (Ollama & Gemini)
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ask code question, regex, or paste error..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-400/50"
                      readOnly
                    />
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-2 flex items-center justify-between">
                    <span>Shortcut: Ctrl + Shift + Space</span>
                    <span className="text-indigo-400 font-mono">Milestone 7</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Zenith Living Notch</span>
              </div>
              <button
                onClick={handleClose}
                className="hover:text-zinc-300 transition-colors text-[10px]"
              >
                Click or Press Esc to Collapse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
