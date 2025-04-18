'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { FaArrowLeft, FaUpload, FaMusic, FaImage } from 'react-icons/fa'

export default function AddTrackPage() {
  const [trackData, setTrackData] = useState({
    title: '',
    artist: '',
    bpm: '',
    key: '',
    price: '12.99',
    licenseType: 'Non-Exclusive',
    tags: ''
  })
  
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setTrackData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type !== 'audio/mpeg') {
        setErrorMessage('Please upload an MP3 file')
        return
      }
      setAudioFile(file)
      setErrorMessage('')
    }
  }
  
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload an image file')
        return
      }
      setCoverFile(file)
      setErrorMessage('')
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate fields
    if (!trackData.title || !trackData.artist || !trackData.bpm || !trackData.key || !audioFile) {
      setErrorMessage('Please fill all required fields and upload an audio file')
      return
    }
    
    // Create FormData object
    const formData = new FormData()
    
    // Append track data
    Object.entries(trackData).forEach(([key, value]) => {
      formData.append(key, value)
    })
    
    // Append files
    if (audioFile) formData.append('audioFile', audioFile)
    if (coverFile) formData.append('coverFile', coverFile)
    
    try {
      setIsUploading(true)
      setErrorMessage('')
      
      const response = await fetch('/api/tracks/add', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Error adding track')
      }
      
      // Reset form on success
      setTrackData({
        title: '',
        artist: '',
        bpm: '',
        key: '',
        price: '12.99',
        licenseType: 'Non-Exclusive',
        tags: ''
      })
      setAudioFile(null)
      setCoverFile(null)
      if (audioInputRef.current) audioInputRef.current.value = ''
      if (coverInputRef.current) coverInputRef.current.value = ''
      
      setSuccessMessage(`Track "${data.track.title}" added successfully!`)
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/admin" 
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-white">Add Track</h1>
      </div>
      
      <div className="bg-zinc-900 rounded-xl p-6">
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-900/30 text-red-400 rounded-lg">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-900/30 text-green-400 rounded-lg">
              {successMessage}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="title" className="block mb-2 text-sm font-medium text-zinc-300">
                Track Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={trackData.title}
                onChange={handleInputChange}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                required
              />
            </div>
            
            <div>
              <label htmlFor="artist" className="block mb-2 text-sm font-medium text-zinc-300">
                Artist *
              </label>
              <input
                type="text"
                id="artist"
                name="artist"
                value={trackData.artist}
                onChange={handleInputChange}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                required
              />
            </div>
            
            <div>
              <label htmlFor="bpm" className="block mb-2 text-sm font-medium text-zinc-300">
                BPM *
              </label>
              <input
                type="number"
                id="bpm"
                name="bpm"
                value={trackData.bpm}
                onChange={handleInputChange}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                required
                min="1"
                max="999"
              />
            </div>
            
            <div>
              <label htmlFor="key" className="block mb-2 text-sm font-medium text-zinc-300">
                Key *
              </label>
              <input
                type="text"
                id="key"
                name="key"
                value={trackData.key}
                onChange={handleInputChange}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                required
                placeholder="e.g. Am, C# Minor, F Major"
              />
            </div>
            
            <div>
              <label htmlFor="price" className="block mb-2 text-sm font-medium text-zinc-300">
                Price *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={trackData.price}
                onChange={handleInputChange}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                required
                min="0.99"
                step="0.01"
              />
            </div>
            
            <div>
              <label htmlFor="licenseType" className="block mb-2 text-sm font-medium text-zinc-300">
                License Type *
              </label>
              <select
                id="licenseType"
                name="licenseType"
                value={trackData.licenseType}
                onChange={handleInputChange}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                required
              >
                <option value="Non-Exclusive">Non-Exclusive</option>
                <option value="Non-Exclusive Plus">Non-Exclusive Plus</option>
                <option value="Exclusive">Exclusive</option>
                <option value="Exclusive Plus">Exclusive Plus</option>
                <option value="Exclusive Pro">Exclusive Pro</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="tags" className="block mb-2 text-sm font-medium text-zinc-300">
                Tags (comma separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={trackData.tags}
                onChange={handleInputChange}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                placeholder="e.g. trap, piano, dark, melodic"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-zinc-300">
                Audio File (MP3) *
              </label>
              <div 
                className={`w-full p-8 bg-zinc-800 border border-dashed ${
                  audioFile ? 'border-purple-600' : 'border-zinc-700'
                } rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-750 transition-colors`}
                onClick={() => audioInputRef.current?.click()}
              >
                <FaMusic className={`text-3xl mb-3 ${audioFile ? 'text-purple-500' : 'text-zinc-500'}`} />
                <p className="text-zinc-400 text-center">
                  {audioFile ? audioFile.name : 'Click to upload MP3 file'}
                </p>
                <input
                  type="file"
                  ref={audioInputRef}
                  onChange={handleAudioChange}
                  className="hidden"
                  accept="audio/mpeg"
                />
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-zinc-300">
                Cover Image (optional)
              </label>
              <div 
                className={`w-full p-8 bg-zinc-800 border border-dashed ${
                  coverFile ? 'border-purple-600' : 'border-zinc-700'
                } rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-750 transition-colors`}
                onClick={() => coverInputRef.current?.click()}
              >
                <FaImage className={`text-3xl mb-3 ${coverFile ? 'text-purple-500' : 'text-zinc-500'}`} />
                <p className="text-zinc-400 text-center">
                  {coverFile ? coverFile.name : 'Click to upload cover image'}
                </p>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium"
            >
              {isUploading ? (
                <>
                  <FaUpload className="animate-bounce" /> Uploading...
                </>
              ) : (
                <>
                  <FaUpload /> Add Track
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 