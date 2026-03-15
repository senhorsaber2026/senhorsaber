import React from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speaking?: boolean;
}

const sizes = {
  sm: 60,
  md: 100,
  lg: 150,
  xl: 200,
};

export const Avatar: React.FC<AvatarProps> = ({ size = 'md', speaking = false }) => {
  const px = sizes[size];

  return (
    <motion.div
      style={{ width: px, height: px, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Outer ripple rings */}
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `1px solid rgba(0, 245, 255, ${0.4 - i * 0.1})`,
          }}
          animate={{ scale: [1, 1 + i * 0.3], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: i * 0.5 }}
        />
      ))}

      {/* Main glow orb */}
      <motion.div
        style={{
          width: px * 0.9,
          height: px * 0.9,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 35% 30%, rgba(0,245,255,0.25) 0%, rgba(6,20,37,0.9) 60%, rgba(168,85,247,0.15) 100%)',
          border: '2px solid rgba(0,245,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(0,245,255,0.4), 0 0 80px rgba(0,245,255,0.15), inset 0 0 30px rgba(0,245,255,0.05)',
        }}
        animate={speaking ? {
          boxShadow: [
            '0 0 30px rgba(0,245,255,0.4), 0 0 80px rgba(0,245,255,0.15)',
            '0 0 60px rgba(0,245,255,0.8), 0 0 120px rgba(0,245,255,0.3)',
            '0 0 30px rgba(0,245,255,0.4), 0 0 80px rgba(0,245,255,0.15)',
          ],
        } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        {/* Scan line effect */}
        <motion.div
          style={{
            position: 'absolute',
            left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(to right, transparent, rgba(0,245,255,0.6), transparent)',
            zIndex: 2,
          }}
          animate={{ y: [-(px * 0.45), px * 0.45] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />

        {/* Professor Image */}
        <img
          src="/senhor-saber.jpg"
          alt="Senhor Saber"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top', /* Center on his face/head */
            borderRadius: '50%',
            position: 'relative',
            zIndex: 1,
            opacity: 0.9,
          }}
        />

        {/* Inner hexagon grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,245,255,1) 0px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, rgba(0,245,255,1) 0px, transparent 1px, transparent 8px)',
          backgroundSize: '8px 8px',
        }} />
      </motion.div>

    </motion.div>
  );
};
