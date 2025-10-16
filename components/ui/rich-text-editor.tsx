"use client"

import { useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { Button } from "./button"
import { Badge } from "./badge"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Eye,
  Edit3,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon
} from "lucide-react"

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-md flex items-center justify-center text-gray-500">Loading editor...</div>
})

import "react-quill/dist/quill.snow.css"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
  showPreview?: boolean
  mode?: "edit" | "preview" | "both"
  onModeChange?: (mode: "edit" | "preview") => void
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis konten Anda...",
  height = 200,
  showPreview = false,
  mode = "edit",
  onModeChange
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null)

  // Create a proper image handler for Quill
  const imageHandler = useCallback(() => {
    console.log('🖼️ Image handler triggered!')

    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      console.log('📁 File input changed')
      const file = input.files?.[0]

      if (file) {
        const quill = quillRef.current
        if (!quill) {
          console.error('❌ Quill editor not found')
          return
        }

        const range = quill.getSelection()
        const index = range ? range.index : quill.getLength()

        // Show upload indicator
        quill.insertText(index, '📤 Mengupload gambar...', 'user')
        quill.setSelection(index + '📤 Mengupload gambar...'.length)

        // Try server upload first
        let imageUrl = null

        try {
          console.log('📄 Processing file:', file.name, file.size, file.type)
          const formData = new FormData()
          formData.append('image', file)

          console.log('🖼️ Starting image upload...')
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData
          })

          console.log('📤 Upload response status:', response.status)

          if (response.ok) {
            const data = await response.json()
            console.log('✅ Upload response data:', data)
            imageUrl = data.data.url
          } else {
            console.error('❌ Upload failed with status:', response.status)
          }
        } catch (error) {
          console.error('❌ Image upload failed:', error)
        }

        // Remove loading indicator and insert image
        if (imageUrl) {
          // Remove loading text
          quill.deleteText(index, '📤 Mengupload gambar...'.length, 'user')

          // Insert the uploaded image at the same position
          quill.insertEmbed(index, 'image', imageUrl, 'user')

          // Move cursor after the image
          quill.setSelection(index + 1)

          console.log('✅ Image inserted successfully at position:', index)
        } else {
          // Replace loading text with error message
          quill.deleteText(index, '📤 Mengupload gambar...'.length, 'user')
          quill.insertText(index, '❌ Gagal mengupload gambar', 'user')
          quill.setSelection(index + '❌ Gagal mengupload gambar'.length)
          console.error('❌ Failed to upload image')
        }
      } else {
        console.log('⚠️ No file selected')
      }
    }
  }, [])

  // Link handler with validation
  const linkHandler = useCallback(() => {
    const range = quillRef.current?.getEditor().getSelection()
    const url = prompt('Masukkan URL:')

    if (url) {
      // Validate URL
      try {
        new URL(url)
        quillRef.current?.getEditor().formatText(
          range?.index || 0,
          range?.length || 0,
          'link',
          url
        )
      } catch {
        alert('URL tidak valid')
      }
    }
  }, [])

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        link: linkHandler
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), [imageHandler, linkHandler])

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent', 'script', 'align', 'direction',
    'size', 'color', 'background',
    'link', 'image', 'video', 'code-block', 'formula'
  ]

  // Ensure Quill is properly configured when mounted
  useEffect(() => {
    console.log('🔄 Rich Text Editor modules updated')
  }, [imageHandler, linkHandler])

  // Add useEffect to handle Quill ready state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (quillRef.current) {
        console.log('✅ Quill editor is ready')
        // You can add any additional initialization here
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const renderPreview = () => {
    return (
      <div
        className="prose prose-sm max-w-none p-4 border rounded-md min-h-[200px] bg-white"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    )
  }

  const renderEditor = () => {
    return (
      <div className="border rounded-md overflow-hidden">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          style={{ height: `${height}px` }}
          className="bg-white"
        />
        <style jsx>{`
          :global(.ql-editor img) {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 8px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: block;
          }
          :global(.ql-editor .ql-image) {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 8px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: block;
          }
        `}</style>
        <div className="h-12" /> {/* Spacer for toolbar */}
      </div>
    )
  }

  const getWordCount = () => {
    const temp = document.createElement('div')
    temp.innerHTML = value
    return temp.innerText.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getCharacterCount = () => {
    const temp = document.createElement('div')
    temp.innerHTML = value
    return temp.innerText.length
  }

  if (mode === "preview") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Preview Mode
          </Badge>
          {onModeChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange("edit")}
              className="text-xs"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
        {renderPreview()}
      </div>
    )
  }

  if (mode === "edit") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Edit3 className="h-3 w-3 mr-1" />
              Edit Mode
            </Badge>
            <div className="text-xs text-muted-foreground">
              {getWordCount()} kata • {getCharacterCount()} karakter
            </div>
          </div>
          {showPreview && onModeChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange("preview")}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          )}
        </div>
        {renderEditor()}
      </div>
    )
  }

  // Both mode (side by side)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs">
            <Edit3 className="h-3 w-3 mr-1" />
            Edit Mode
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Preview Mode
          </Badge>
          <div className="text-xs text-muted-foreground">
            {getWordCount()} kata • {getCharacterCount()} karakter
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Editor</h4>
          {renderEditor()}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Preview</h4>
          {renderPreview()}
        </div>
      </div>
    </div>
  )
}

// Quick format buttons for simpler use cases
export function QuickFormatButtons({ onFormat }: { onFormat: (format: string) => void }) {
  return (
    <div className="flex items-center gap-1 p-2 border rounded-md bg-gray-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat('bold')}
        className="h-8 w-8 p-0"
      >
        <BoldIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat('italic')}
        className="h-8 w-8 p-0"
      >
        <ItalicIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat('underline')}
        className="h-8 w-8 p-0"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat('list')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat('ordered')}
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat('quote')}
        className="h-8 w-8 p-0"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat('code')}
        className="h-8 w-8 p-0"
      >
        <Code className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat('link')}
        className="h-8 w-8 p-0"
      >
        <Link className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat('image')}
        className="h-8 w-8 p-0"
      >
        <Image className="h-4 w-4" />
      </Button>
    </div>
  )
}