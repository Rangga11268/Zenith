import { app, BrowserWindow, screen, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

const WINDOW_WIDTH = 580
const WINDOW_HEIGHT = 480

interface HitTestState {
  ignore: boolean
  forward: boolean
}

let mainWindow: BrowserWindow | null = null
let lastHitTestState: HitTestState = { ignore: true, forward: true }
let isDeckExpanded = false
const isHitTestIgnored = (): boolean => lastHitTestState.ignore

// In automated test mode, use an isolated profile to prevent interference
if (process.env.ZENITH_TEST === '1') {
  app.setPath('userData', path.join(app.getPath('temp'), `zenith-test-profile-${process.pid}`))
}

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  if (process.env.ZENITH_TEST === '1') {
    console.error('[TEST] ERROR: Another instance holds the lock. Cannot run test in secondary instance.')
    app.exit(1)
  } else {
    app.quit()
  }
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function getWindowPosition() {
  try {
    const primaryDisplay = screen.getPrimaryDisplay()
    if (primaryDisplay?.bounds) {
      const { width: screenWidth, x: screenX, y: screenY } = primaryDisplay.bounds
      return {
        x: Math.round(screenX + (screenWidth - WINDOW_WIDTH) / 2),
        y: screenY,
      }
    }
  } catch (err) {
    console.error('[Zenith] Failed to get primary display bounds:', err)
  }
  return { x: 0, y: 0 }
}

function createWindow() {
  const { x, y } = getWindowPosition()

  const preloadMjs = path.join(__dirname, 'preload.mjs')
  const preloadJs = path.join(__dirname, 'preload.js')
  const preloadPath = fs.existsSync(preloadMjs) ? preloadMjs : preloadJs
  if (!fs.existsSync(preloadPath)) {
    console.warn('[Zenith] Warning: Preload script not found at:', preloadPath)
  }

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    thickFrame: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  })

  // Ensure layered above full-screen apps and other windows
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces?.(true, { visibleOnFullScreen: true })

  // Initialize click-through: transparent regions outside the notch pass clicks to background
  mainWindow.setIgnoreMouseEvents(true, { forward: true })
  lastHitTestState = { ignore: true, forward: true }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Zenith] Failed to load renderer: ${errorDescription} (${errorCode})`)
    if (process.env.ZENITH_TEST === '1') {
      app.exit(1)
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle display changes (resolution, connect/disconnect monitor)
  const reposition = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        const pos = getWindowPosition()
        mainWindow.setBounds({
          x: pos.x,
          y: pos.y,
          width: WINDOW_WIDTH,
          height: WINDOW_HEIGHT,
        })
      } catch (err) {
        console.error('[Zenith] Reposition error:', err)
      }
    }
  }

  screen.on('display-metrics-changed', reposition)
  screen.on('display-added', reposition)
  screen.on('display-removed', reposition)

  // Self-test runner if ZENITH_TEST environment variable is set
  if (process.env.ZENITH_TEST === '1') {
    mainWindow.webContents.on('did-finish-load', async () => {
      try {
        console.log('[TEST] Checking Window Geometry...')
        const bounds = mainWindow!.getBounds()
        const primary = screen.getPrimaryDisplay()
        const expectedX = Math.round(primary.bounds.x + (primary.bounds.width - WINDOW_WIDTH) / 2)
        const expectedY = primary.bounds.y

        if (Math.abs(bounds.x - expectedX) > 1 || Math.abs(bounds.y - expectedY) > 1) {
          throw new Error(`Position mismatch: got (${bounds.x}, ${bounds.y}), expected (${expectedX}, ${expectedY})`)
        }
        if (Math.abs(bounds.width - WINDOW_WIDTH) > 4 || Math.abs(bounds.height - WINDOW_HEIGHT) > 4) {
          throw new Error(`Size mismatch: got (${bounds.width}, ${bounds.height}), expected (${WINDOW_WIDTH}, ${WINDOW_HEIGHT})`)
        }
        if (!mainWindow!.isAlwaysOnTop()) {
          throw new Error('Window is not set to alwaysOnTop')
        }
        console.log('[TEST] Window Geometry & Flags: PASS')

        console.log('[TEST] Inspecting Renderer DOM & IPC...')
        const inspect = await mainWindow!.webContents.executeJavaScript(`
          (async function() {
            const root = document.getElementById('root');
            if (!root || !root.innerHTML.trim()) return { ok: false, err: '#root missing or empty' };
            if (!window.devnotch) return { ok: false, err: 'window.devnotch not found' };
            if (typeof window.devnotch.setIgnoreMouseEvents !== 'function') return { ok: false, err: 'setIgnoreMouseEvents missing' };
            if (typeof window.devnotch.expandWindow !== 'function') return { ok: false, err: 'expandWindow missing' };
            if (typeof window.devnotch.closeApp !== 'function') return { ok: false, err: 'closeApp missing' };

            // Find pill element
            const pill = root.querySelector('[data-testid="notch-pill"]');
            if (!pill) return { ok: false, err: 'Notch pill element not found' };

            // Simulate mouse enter
            pill.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            pill.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            await new Promise(r => setTimeout(r, 100));

            return { ok: true, classNames: pill.className };
          })()
        `)

        if (!inspect.ok) {
          throw new Error(inspect.err)
        }
        console.log('[TEST] Renderer DOM & API: PASS')

        // Wait up to 500ms for hit-testing IPC to arrive from renderer
        let waited = 0
        while (isHitTestIgnored() !== false && waited < 500) {
          await new Promise(r => setTimeout(r, 50))
          waited += 50
        }

        if (isHitTestIgnored() !== false) {
          throw new Error('Expected hit-testing to disable ignore on mouseenter')
        }
        console.log('[TEST] Hit-Testing Activation (mouseenter): PASS')

        // Test mouse leave on pill
        await mainWindow!.webContents.executeJavaScript(`
          (function() {
            const pill = document.querySelector('[data-testid="notch-pill"]');
            pill.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            pill.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
          })()
        `)
        waited = 0
        while (isHitTestIgnored() !== true && waited < 500) {
          await new Promise(r => setTimeout(r, 50))
          waited += 50
        }
        if (isHitTestIgnored() !== true) {
          throw new Error('Expected hit-testing to enable ignore on mouseleave')
        }
        console.log('[TEST] Hit-Testing Deactivation (mouseleave): PASS')

        // Test expansion toggle via click
        console.log('[TEST] Testing Pill Expansion...')
        const expandResult = await mainWindow!.webContents.executeJavaScript(`
          (async function() {
            const root = document.getElementById('root');
            const pill = root.querySelector('[data-testid="notch-pill"]');
            // Enter and click to expand
            pill.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            pill.click();
            await new Promise(r => setTimeout(r, 100));

            const hasDevTab = root.textContent.includes('Dev');
            const hasMusicTab = root.textContent.includes('Music');
            const hasTasksTab = root.textContent.includes('Tasks');
            const hasAiTab = root.textContent.includes('AI');

            return {
              ok: hasDevTab && hasMusicTab && hasTasksTab && hasAiTab,
              details: { hasDevTab, hasMusicTab, hasTasksTab, hasAiTab }
            };
          })()
        `)

        if (!expandResult.ok) {
          throw new Error('Deck expansion failed: ' + JSON.stringify(expandResult.details))
        }
        if (!isDeckExpanded) {
          throw new Error('Expected isDeckExpanded to be true in main process after expansion')
        }
        console.log('[TEST] Pill Expansion: PASS')

        // Test tab switching in expanded deck
        console.log('[TEST] Testing Tab Switching in Expanded Deck...')
        const tabSwitchResult = await mainWindow!.webContents.executeJavaScript(`
          (async function() {
            const root = document.getElementById('root');
            const findBtn = (name) => Array.from(root.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes(name));

            // Music tab
            const musicBtn = findBtn('Music');
            if (!musicBtn) return { ok: false, err: 'Music button not found' };
            musicBtn.click();
            await new Promise(r => setTimeout(r, 80));
            if (!root.textContent.includes('No Media Playing')) return { ok: false, err: 'Music tab content did not display' };

            // Tasks tab
            const tasksBtn = findBtn('Tasks');
            if (!tasksBtn) return { ok: false, err: 'Tasks button not found' };
            tasksBtn.click();
            await new Promise(r => setTimeout(r, 80));
            if (!root.textContent.includes('Daily Quick Tasks')) return { ok: false, err: 'Tasks tab content did not display' };

            // AI tab
            const aiBtn = findBtn('AI');
            if (!aiBtn) return { ok: false, err: 'AI button not found' };
            aiBtn.click();
            await new Promise(r => setTimeout(r, 80));
            if (!root.textContent.includes('Quick AI Copilot')) return { ok: false, err: 'AI tab content did not display' };

            // Dev tab
            const devBtn = findBtn('Dev');
            if (!devBtn) return { ok: false, err: 'Dev button not found' };
            devBtn.click();
            await new Promise(r => setTimeout(r, 80));
            if (!root.textContent.includes('Git Status')) return { ok: false, err: 'Dev tab content did not display' };

            return { ok: true };
          })()
        `)
        if (!tabSwitchResult.ok) {
          throw new Error('Tab switching failed: ' + tabSwitchResult.err)
        }
        console.log('[TEST] Tab Switching: PASS')

        // Test Hit-Testing Release while Expanded
        console.log('[TEST] Testing Expanded Hit-Testing Release...')
        await mainWindow!.webContents.executeJavaScript(`
          (function() {
            const pill = document.querySelector('[data-testid="notch-pill"]');
            pill.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            pill.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
          })()
        `)
        waited = 0
        while (isHitTestIgnored() !== true && waited < 500) {
          await new Promise(r => setTimeout(r, 50))
          waited += 50
        }
        if (isHitTestIgnored() !== true) {
          throw new Error('Expected hit-testing to release on mouseleave while expanded')
        }
        console.log('[TEST] Expanded Hit-Testing Release: PASS')

        // Test Hit-Testing Reactivation when re-entering deck
        await mainWindow!.webContents.executeJavaScript(`
          (function() {
            const pill = document.querySelector('[data-testid="notch-pill"]');
            pill.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            pill.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          })()
        `)
        waited = 0
        while (isHitTestIgnored() !== false && waited < 500) {
          await new Promise(r => setTimeout(r, 50))
          waited += 50
        }
        if (isHitTestIgnored() !== false) {
          throw new Error('Expected hit-testing to reactivate on mouseenter while expanded')
        }
        console.log('[TEST] Expanded Hit-Testing Reactivation: PASS')

        // Test Escape key collapse
        console.log('[TEST] Testing Escape Key Collapse...')
        const escapeResult = await mainWindow!.webContents.executeJavaScript(`
          (async function() {
            const root = document.getElementById('root');
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await new Promise(r => setTimeout(r, 150));
            const hasDevTab = root.textContent.includes('Dev');
            return { collapsed: !hasDevTab };
          })()
        `)
        if (!escapeResult.collapsed) {
          throw new Error('Escape key did not collapse the deck')
        }
        waited = 0
        while (isHitTestIgnored() !== true && waited < 500) {
          await new Promise(r => setTimeout(r, 50))
          waited += 50
        }
        if (isHitTestIgnored() !== true) {
          throw new Error('Expected hit-testing to enable ignore after Escape collapse')
        }
        if (isDeckExpanded) {
          throw new Error('Expected isDeckExpanded to be false in main process after collapse')
        }
        console.log('[TEST] Escape Key Collapse: PASS')

        // Test Pill Hit-Testing Reactivation on mousemove inside collapsed pill
        console.log('[TEST] Testing Pill Hit-Testing Reactivation after Collapse...')
        await mainWindow!.webContents.executeJavaScript(`
          (function() {
            const pill = document.querySelector('[data-testid="notch-pill"]');
            pill.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
          })()
        `)
        waited = 0
        while (isHitTestIgnored() !== false && waited < 500) {
          await new Promise(r => setTimeout(r, 50))
          waited += 50
        }
        if (isHitTestIgnored() !== false) {
          throw new Error('Expected hit-testing to reactivate on mousemove inside collapsed pill')
        }
        console.log('[TEST] Pill Hit-Testing Reactivation after Collapse: PASS')

        // Test Collapse button
        console.log('[TEST] Testing Collapse Button...')
        const collapseBtnResult = await mainWindow!.webContents.executeJavaScript(`
          (async function() {
            const root = document.getElementById('root');
            const pill = root.querySelector('[data-testid="notch-pill"]');
            pill.click();
            await new Promise(r => setTimeout(r, 100));

            const collapseBtn = root.querySelector('button[title="Collapse"]');
            if (!collapseBtn) return { ok: false, err: 'Collapse button missing' };
            collapseBtn.click();
            await new Promise(r => setTimeout(r, 150));

            const hasDevTab = root.textContent.includes('Dev');
            return { ok: !hasDevTab };
          })()
        `)
        if (!collapseBtnResult.ok) {
          throw new Error('Collapse button failed: ' + (collapseBtnResult.err || 'still expanded'))
        }
        console.log('[TEST] Collapse Button: PASS')

        // Test Blur collapse
        console.log('[TEST] Testing Blur Collapse...')
        const blurResult = await mainWindow!.webContents.executeJavaScript(`
          (async function() {
            const root = document.getElementById('root');
            const pill = root.querySelector('[data-testid="notch-pill"]');
            pill.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            pill.click();
            await new Promise(r => setTimeout(r, 100));

            window.dispatchEvent(new Event('blur'));
            await new Promise(r => setTimeout(r, 150));

            const hasDevTab = root.textContent.includes('Dev');
            return { ok: !hasDevTab };
          })()
        `)
        if (!blurResult.ok) {
          throw new Error('Blur event did not collapse the deck')
        }
        waited = 0
        while (isHitTestIgnored() !== true && waited < 500) {
          await new Promise(r => setTimeout(r, 50))
          waited += 50
        }
        if (isHitTestIgnored() !== true) {
          throw new Error('Expected hit-testing to enable ignore after Blur')
        }
        console.log('[TEST] Blur Collapse: PASS')

        console.log('\n========================================')
        console.log('✓ All Zenith Milestone 1 Acceptance Checks Passed!')
        console.log('========================================\n')

        app.exit(0)
      } catch (err: any) {
        console.error('[TEST] ERROR:', err?.message || err)
        app.exit(1)
      }
    })
  }

  mainWindow.on('closed', () => {
    screen.removeListener('display-metrics-changed', reposition)
    screen.removeListener('display-added', reposition)
    screen.removeListener('display-removed', reposition)
    mainWindow = null
  })
}

// IPC Handlers
ipcMain.on('set-ignore-mouse-events', (event, ignore: boolean, options?: { forward: boolean }) => {
  lastHitTestState = { ignore, forward: ignore ? !!options?.forward : false }
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win && !win.isDestroyed()) {
    if (ignore) {
      win.setIgnoreMouseEvents(true, options)
    } else {
      win.setIgnoreMouseEvents(false)
    }
  }
})

ipcMain.handle('window:close', () => {
  app.quit()
})

ipcMain.handle('window:expand', (_event, expanded: boolean) => {
  isDeckExpanded = !!expanded
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
