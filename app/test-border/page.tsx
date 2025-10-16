import React from 'react'
import { BorderTest } from '../../../test-border-component'

export default function TestBorderPage() {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      <h1>🔍 Border Component Test Page</h1>
      <p>This page tests the border component in isolation within Next.js environment.</p>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Instructions:</h2>
        <ol>
          <li>Open browser console to see debug logs</li>
          <li>Check if Sacred Sakura border image appears around the avatar</li>
          <li>Verify the "epic member" badge is visible</li>
          <li>Compare with the static HTML test at <a href="/test-border.html" target="_blank">/test-border.html</a></li>
        </ol>
      </div>

      <BorderTest />

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Additional Tests:</h2>
        <p>Check the browser console for detailed logging about:</p>
        <ul>
          <li>User data fetching from API</li>
          <li>Border mapping and data transformation</li>
          <li>Border image loading success/failure</li>
          <li>Component rendering flow</li>
        </ul>
      </div>
    </div>
  )
}