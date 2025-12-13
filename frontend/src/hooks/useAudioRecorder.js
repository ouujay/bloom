import { useState, useRef, useCallback } from 'react'

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const isSupported = typeof MediaRecorder !== 'undefined'
    && navigator.mediaDevices?.getUserMedia

  const startRecording = useCallback(async () => {
    // Don't start if already recording
    if (isRecording || mediaRecorderRef.current) {
      console.log('Already recording, ignoring start')
      return false
    }

    try {
      setError(null)
      chunksRef.current = []

      console.log('Requesting microphone access...')
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      streamRef.current = audioStream
      console.log('Got audio stream:', audioStream.id)

      // WebM with Opus codec - Whisper compatible
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      console.log('Using MIME type:', mimeType)

      const mediaRecorder = new MediaRecorder(audioStream, { mimeType })

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect every 100ms
      setIsRecording(true)
      console.log('Recording started')

      return true
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError(err.message || 'Failed to start recording')
      return false
    }
  }, [isRecording])

  const stopRecording = useCallback(async () => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      const stream = streamRef.current

      console.log('stopRecording called, state:', mediaRecorder?.state)

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        console.log('No active recording to stop')
        setIsRecording(false)
        resolve(null)
        return
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })

        console.log('Recording stopped, blob size:', audioBlob.size, 'bytes, chunks:', chunksRef.current.length)

        // Stop all tracks
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
        streamRef.current = null
        mediaRecorderRef.current = null
        setIsRecording(false)

        // Return blob if it has any content (lowered threshold)
        if (audioBlob.size > 100) {
          console.log('Returning audio blob')
          resolve(audioBlob)
        } else {
          console.log('Audio blob too small, discarding')
          resolve(null)
        }
      }

      mediaRecorder.stop()
    })
  }, [])

  const reset = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    streamRef.current = null
    mediaRecorderRef.current = null
    setIsRecording(false)
    setError(null)
    chunksRef.current = []
  }, [])

  return {
    isRecording,
    error,
    isSupported,
    startRecording,
    stopRecording,
    reset,
    stream: streamRef.current
  }
}

export default useAudioRecorder
