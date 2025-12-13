import { useState, useCallback, useRef, useEffect } from 'react'

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const audioRef = useRef(null)
  const currentUrlRef = useRef(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (currentUrlRef.current && currentUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrlRef.current)
      }
    }
  }, [])

  const speak = useCallback(async (audioUrl, options = {}) => {
    if (!audioUrl) return

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setIsSpeaking(true)

    try {
      // Create audio element and play
      audioRef.current = new Audio(audioUrl)
      currentUrlRef.current = audioUrl

      audioRef.current.onended = () => {
        setIsSpeaking(false)
        options.onEnded?.()
      }

      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e)
        setIsSpeaking(false)
        options.onError?.(e)
      }

      await audioRef.current.play()
    } catch (error) {
      console.error('Failed to play audio:', error)
      setIsSpeaking(false)

      // Fallback: Try browser speechSynthesis with the text if provided
      if (options.fallbackText && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(options.fallbackText)
        utterance.onend = () => {
          setIsSpeaking(false)
          options.onEnded?.()
        }
        window.speechSynthesis.speak(utterance)
      } else {
        options.onError?.(error)
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  return { speak, stop, isSpeaking, isSupported }
}

export default useTextToSpeech
