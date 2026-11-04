'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* ============================================================
   useTts — đọc tiếng Trung bằng Web Speech Synthesis
   - speak(cn, rate, onDone): đọc xong gọi onDone (bỏ qua nếu muted)
   - Có lựa chọn giọng zh-CN / zh nếu trình duyệt có sẵn
   ============================================================ */

export function useTts() {
  const [supported, setSupported] = useState(false)
  const [muted, setMuted] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const mutedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(true)

    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      voiceRef.current =
        voices.find((v) => v.lang === 'zh-CN') ??
        voices.find((v) => v.lang.toLowerCase().startsWith('zh')) ??
        null
    }
    pick()
    window.speechSynthesis.addEventListener('voiceschanged', pick)

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', pick)
      window.speechSynthesis.cancel()
    }
  }, [])

  /* giữ mutedRef để hàm speak không phải phụ thuộc state muted */
  useEffect(() => {
    mutedRef.current = muted
    if (muted) window.speechSynthesis?.cancel()
  }, [muted])

  const speak = useCallback((text: string, rate = 0.9, onDone?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    if (mutedRef.current) {
      setSpeaking(false)
      return /* khi tắt tiếng: KHÔNG tự chạy onDone — người học đọc rồi bấm qua */
    }
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    if (voiceRef.current) u.voice = voiceRef.current
    u.rate = rate
    u.pitch = 1
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      setSpeaking(false)
      onDone?.()
    }
    u.onstart = () => setSpeaking(true)
    u.onend = finish
    u.onerror = finish
    window.speechSynthesis.speak(u)
  }, [])

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { supported, muted, setMuted, speaking, speak, stop }
}

/* ============================================================
   useAsr — nhận diện giọng nói tiếng Trung (Web Speech API)
   - Chỉ khả dụng trên Chrome / Edge (webkitSpeechRecognition)
   - start(handlers): bắt đầu nghe; onFinal trả về câu nhận diện
   ============================================================ */

type AsrAlternative = { transcript?: string }

type AsrResultItem = ArrayLike<AsrAlternative> & { isFinal?: boolean }

type AsrEvent = { results: ArrayLike<AsrResultItem> }

type AsrErrorEvent = { error?: string }

type AsrRecognition = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: AsrEvent) => void) | null
  onerror: ((e: AsrErrorEvent) => void) | null
  onend: (() => void) | null
}

type AsrWindow = {
  SpeechRecognition?: new () => AsrRecognition
  webkitSpeechRecognition?: new () => AsrRecognition
}

export type AsrHandlers = {
  onFinal: (text: string) => void
  onInterim?: (text: string) => void
  onError?: (kind: 'not-allowed' | 'no-speech' | 'network' | 'unsupported' | 'failed') => void
}

export function useAsr() {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<AsrRecognition | null>(null)
  const handlersRef = useRef<AsrHandlers | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as unknown as AsrWindow
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition))
    return () => {
      try {
        recRef.current?.abort()
      } catch {
        /* bỏ qua */
      }
    }
  }, [])

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* bỏ qua */
    }
    setListening(false)
  }, [])

  const start = useCallback((handlers: AsrHandlers) => {
    const w = window as unknown as AsrWindow
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Ctor) {
      handlers.onError?.('unsupported')
      return
    }
    try {
      recRef.current?.abort()
    } catch {
      /* bỏ qua */
    }

    const rec = new Ctor()
    recRef.current = rec
    handlersRef.current = handlers
    rec.lang = 'zh-CN'
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onresult = (e) => {
      const h = handlersRef.current
      if (!h) return
      let interim = ''
      let final = ''
      for (let i = 0; i < e.results.length; i++) {
        const item = e.results[i]
        const alt = item?.[0]
        const text = alt?.transcript ?? ''
        if (item.isFinal === false) interim += text
        else final += text
      }
      if (final.trim()) h.onFinal(final.trim())
      else if (interim.trim()) h.onInterim?.(interim.trim())
    }

    rec.onerror = (ev) => {
      setListening(false)
      const kind = ev.error
      if (kind === 'not-allowed' || kind === 'service-not-allowed') handlersRef.current?.onError?.('not-allowed')
      else if (kind === 'no-speech') handlersRef.current?.onError?.('no-speech')
      else if (kind === 'network') handlersRef.current?.onError?.('network')
      else handlersRef.current?.onError?.('failed')
    }

    rec.onend = () => setListening(false)

    try {
      rec.start()
      setListening(true)
    } catch {
      handlers.onError?.('failed')
    }
  }, [])

  return { supported, listening, start, stop }
}
