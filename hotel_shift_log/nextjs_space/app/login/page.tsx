

import LoginForm from '@/components/login-form'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Very dark grey background with subtle gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        {/* Subtle texture */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.02) 2px, rgba(255, 255, 255, 0.02) 3px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 255, 255, 0.02) 2px, rgba(255, 255, 255, 0.02) 3px)
            `
          }}
        ></div>
        
        {/* Spotlight effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gray-600/5 rounded-full blur-3xl"></div>
      </div>
      
      {/* Decorative poker chips floating */}
      <div className="absolute top-20 left-20 poker-chip opacity-40"></div>
      <div className="absolute top-40 right-32 poker-chip opacity-30"></div>
      <div className="absolute bottom-32 left-40 poker-chip opacity-35"></div>
      <div className="absolute bottom-20 right-20 poker-chip opacity-25"></div>
      
      {/* Container for logo and login card */}
      <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
        {/* Logo above the card */}
        <div className="relative h-24 w-full flex items-center justify-center">
          <div className="relative w-full h-full px-4">
            <Image
              src="https://cdn.abacus.ai/images/abf2f449-00c8-4dfb-9b2c-47c68f7954b8.png"
              alt="Champion's Club Houston"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>

        {/* Main login card */}
        <div className="casino-card p-10 rounded-2xl w-full backdrop-blur-sm">
          <div className="text-center mb-8">
            {/* Title with casino-style gold gradient */}
            <div className="relative">
              <h1 className="text-3xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 10px rgba(255, 215, 0, 0.5))'
              }}>
                Shift Log System
              </h1>
              
              {/* Gold divider with diamond */}
              <div className="gold-divider">
                <div className="gold-diamond"></div>
              </div>
              
              <p className="text-gray-300 text-sm">
                Sign in to access your shift management
              </p>
            </div>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

