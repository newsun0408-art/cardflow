'use client';

import { useState, useEffect } from 'react';
import {
  LandingNavbar,
  HeroSection,
  FeaturesGrid,
  SecurityDetailsSection,
  TransactionSupportSection,
  LandingFooter,
} from '@/features/landing';

export default function LandingPage() {
  const [greeting, setGreeting] = useState('Chào buổi chiều');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #090d16 55%, #020617 100%)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* Background Decorative Ambient Mesh */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.04) 60%, transparent 80%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 1. Header Navbar */}
      <LandingNavbar />

      {/* 2. Hero Section */}
      <HeroSection
        greeting={greeting}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 3. Features Grid */}
      <FeaturesGrid />

      {/* 4. Security & Card Details */}
      <SecurityDetailsSection />

      {/* 5. Transactions & Support */}
      <TransactionSupportSection />

      {/* 6. Footer */}
      <LandingFooter />
    </div>
  );
}
