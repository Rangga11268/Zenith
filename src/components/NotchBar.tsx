import React, { useState, useEffect, useRef } from 'react'
import {
  GitBranch,
  Radio,
  CheckSquare,
  Terminal,
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
          relative bg-[#090A0F] text-zinc-100 border border-t-0 border-white/10
          shadow-[0_20px_40px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)]
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          overflow-hidden flex flex-col items-center justify-start
          ${
            isExpanded
              ? 'w-[540px] h-[420px] rounded-b-[24px] rounded-t-none px-6 py-4 cursor-default'
              : 'w-[260px] h-[38px] rounded-b-[18px] rounded-t-none cursor-pointer hover:border-white/20'
          }
        `}
        onClick={!isExpanded ? toggleExpand : undefined}
      >
        {/* COLLAPSED PILL VIEW */}
        {!isExpanded ? (
          <div className="w-[260px] h-[38px] flex items-center justify-between pointer-events-auto shrink-0 px-4">
            {/* Left: Steady status dot & Clock */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-[11px] font-medium text-zinc-300 font-mono tracking-tight">
                {timeStr || 'ZENITH'}
              </span>
            </div>

            {/* Center: Brand & Telemetry Indicator */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="font-semibold text-zinc-200 tracking-tight">Zenith</span>
              <span className="text-zinc-600">//</span>
              <span className="font-mono text-[10px] text-zinc-400">DEV</span>
            </div>

            {/* Right: Expand Trigger */}
            <div className="flex items-center text-zinc-500 hover:text-zinc-200 transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        ) : (
          /* EXPANDED DECK VIEW (Engineered Anti-Slop Layout) */
          <div className="w-full h-full flex flex-col justify-between">
            {/* Top Bar: Navigation & Controls */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <nav className="flex items-center gap-1">
                {(
                  [
                    { id: 'dev', label: 'Dev', icon: Activity },
                    { id: 'media', label: 'Music', icon: Music },
                    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                    { id: 'ai', label: 'AI', icon: Terminal },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === id
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Collapse"
                  aria-label="Collapse"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleQuit}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-white/10 transition-colors"
                  title="Quit Application"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 py-4 overflow-hidden">
              {activeTab === 'dev' && (
                <div className="h-full flex flex-col justify-between space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Git Status Card */}
                    <div className="p-3.5 bg-white/[0.02] border border-white/[0.08] rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          <GitBranch className="w-3.5 h-3.5 text-sky-400" /> Git Status
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> clean
                        </span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-zinc-100 truncate">
                        main
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-1">
                        0 uncommitted files
                      </div>
                    </div>

                    {/* Port Monitor Card */}
                    <div className="p-3.5 bg-white/[0.02] border border-white/[0.08] rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Radio className="w-3.5 h-3.5 text-sky-400" /> Dev Ports
                        </span>
                        <span className="font-mono text-[10px] text-sky-400">
                          1 listening
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-emerald-400">
                          :5173
                        </span>
                        <span className="text-xs text-zinc-400">Vite Dev Server</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-1">
                        http://localhost:5173
                      </div>
                    </div>
                  </div>

                  {/* Operational Telemetry Banner */}
                  <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Architecture: Frameless Transparent Shell v1.0.0</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-zinc-500">DPI: 100%</span>
                      <span className="text-emerald-400">60 FPS</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white/[0.01] border border-white/[0.06] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                    <Music className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="text-sm font-medium text-zinc-200">No Media Playing</div>
                  <div className="text-xs text-zinc-500 max-w-xs mt-1">
                    Windows GSMTC is listening for Spotify, Chrome, or Edge playback sessions.
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white/[0.01] border border-white/[0.06] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                    <CheckSquare className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="text-sm font-medium text-zinc-200">Daily Quick Tasks</div>
                  <div className="text-xs text-zinc-500 max-w-xs mt-1">
                    No active tasks in queue. Task persistence layer initializes in Milestone 3.
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="h-full flex flex-col justify-between p-4 bg-white/[0.01] border border-white/[0.06] rounded-xl">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="font-medium text-zinc-300">Quick AI Copilot</span>
                      <span className="font-mono text-[10px] text-zinc-500">Ollama & Gemini Bridge</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Paste stack trace or request code transformation..."
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500/50"
                      readOnly
                    />
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center justify-between font-mono pt-2 border-t border-white/[0.06]">
                    <span>Global Hotkey: Ctrl + Shift + Space</span>
                    <span className="text-zinc-400">Ready for Milestone 7</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <footer className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-zinc-400">Zenith Active</span>
              </div>
              <span className="text-[10px] text-zinc-500">
                Press Esc or click outside to collapse
              </span>
            </footer>
          </div>
        )}
      </div>
    </div>
  )
}
