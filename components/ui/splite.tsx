'use client'

import React, { Suspense, lazy } from 'react'

// Fix: Explicitly type the lazy-loaded Spline component to avoid the "Property 'scene' does not exist on type 'IntrinsicAttributes'" error.
// Dynamic imports for components from third-party libraries often require explicit prop typing when using React.lazy.
const Spline = lazy(() => 
  import('@splinetool/react-spline').then(module => ({
    default: module.default
  }))
) as React.FC<{ scene: string; className?: string }>;

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
      />
    </Suspense>
  )
}
