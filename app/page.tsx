'use client'

import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recordingStartTimeRef = useRef<number>(0)

  // Request microphone permission once on mount
  useEffect(() => {
    const initMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        setHasPermission(true)
      } catch (error) {
        console.error('Error accessing microphone:', error)
        alert('Could not access microphone. Please grant permission and reload the page.')
      }
    }

    initMicrophone()

    // Clean up stream on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startRecording = () => {
    if (!streamRef.current || !hasPermission) {
      alert('Microphone not available. Please reload the page.')
      return
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      recordingStartTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const recordingDuration = Date.now() - recordingStartTimeRef.current
        
        // Only play if recording is 500ms or longer
        if (recordingDuration >= 500) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          // Add 500ms delay before playback
          setTimeout(() => {
            playAudio(audioBlob)
          }, 500)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not start recording. Please try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const playAudio = (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    
    setIsPlaying(true)
    audio.onended = () => {
      setIsPlaying(false)
      URL.revokeObjectURL(audioUrl)
    }
    
    audio.play()
  }

  const handleMouseDown = () => {
    if (!isRecording && !isPlaying && hasPermission) {
      startRecording()
    }
  }

  const handleMouseUp = () => {
    stopRecording()
  }

  // Listen for mouseup anywhere on the document when recording
  useEffect(() => {
    if (isRecording) {
      const handleDocumentMouseUp = () => {
        stopRecording()
      }
      
      document.addEventListener('mouseup', handleDocumentMouseUp)
      
      return () => {
        document.removeEventListener('mouseup', handleDocumentMouseUp)
      }
    }
  }, [isRecording])

  const getButtonColor = () => {
    if (isRecording) return '#ef4444' // Red when recording
    if (isPlaying) return '#10b981' // Green when playing
    return '#0070f3' // Blue default
  }

  const getButtonText = () => {
    if (!hasPermission) return 'Loading...'
    if (isRecording) return 'Recording...'
    if (isPlaying) return 'Playing...'
    return 'Hold to Record'
  }

  return (
    <main style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '6rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <button
        onMouseDown={handleMouseDown}
        onMouseLeave={(e) => {
          if (!isRecording && !isPlaying) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }
        }}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: getButtonColor(),
          color: 'white',
          fontSize: '1rem',
          cursor: hasPermission ? 'pointer' : 'not-allowed',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'background-color 0.2s ease, transform 0.1s ease',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          fontWeight: '500',
          opacity: hasPermission ? 1 : 0.6,
        }}
        onMouseEnter={(e) => {
          if (!isRecording && !isPlaying) {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
          }
        }}
      >
        {getButtonText()}
      </button>
      
      <p style={{ 
        marginTop: '2rem', 
        color: '#666',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: '1.5'
      }}>
        Press and hold the button to record audio. Release to stop and play it back automatically.
      </p>
    </main>
  )
}

