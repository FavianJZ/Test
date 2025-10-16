"use client"

import { useState, useEffect } from "react"
import { X, ZoomIn, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  alt?: string
}

export function ImageModal({ isOpen, onClose, imageUrl, alt = "Image" }: ImageModalProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = alt || 'image'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Download button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="absolute top-4 right-16 text-white hover:bg-white/20 z-10"
        >
          <Download className="h-6 w-6" />
        </Button>

        {/* Zoom toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-4 right-28 text-white hover:bg-white/20 z-10"
        >
          <ZoomIn className="h-6 w-6" />
        </Button>

        {/* Image container */}
        <div
          className="relative flex items-center justify-center w-full h-full"
          onClick={onClose}
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          <img
            src={imageUrl}
            alt={alt}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 cursor-pointer ${
              isZoomed ? 'scale-150' : 'scale-100'
            } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsLoaded(true)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Image info */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-white/80 text-sm">{alt}</p>
        </div>
      </div>
    </div>
  )
}