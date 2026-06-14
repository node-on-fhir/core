// /packages/pacio-core/client/components/shared/PdfWatermark.jsx

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { get } from 'lodash';

export function PdfWatermark(props) {
  const {
    text = 'WATERMARK',
    color = 'rgba(255, 0, 0, 0.2)',
    fontSize = '120px',
    fontWeight = 'bold',
    rotation = -45,
    repeat = true,
    spacing = 300,
    children
  } = props;
  
  const containerRef = useRef(null);
  
  useEffect(function() {
    if (!containerRef.current || !text) return;
    
    // Create canvas for watermark pattern
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on text and spacing
    canvas.width = spacing;
    canvas.height = spacing;
    
    // Configure text style
    ctx.font = `${fontWeight} ${fontSize} Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Rotate and draw text
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    
    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL();
    
    // Apply as background
    if (repeat) {
      containerRef.current.style.backgroundImage = `url(${dataUrl})`;
      containerRef.current.style.backgroundRepeat = 'repeat';
      containerRef.current.style.backgroundPosition = 'center';
    }
    
    // Cleanup
    return function() {
      if (containerRef.current) {
        containerRef.current.style.backgroundImage = '';
      }
    };
  }, [text, color, fontSize, fontWeight, rotation, repeat, spacing]);
  
  if (!repeat) {
    // Single watermark overlay
    return (
      <Box position="relative" ref={containerRef}>
        {children}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          style={{
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            fontSize: fontSize,
            fontWeight: fontWeight,
            color: color,
            pointerEvents: 'none',
            zIndex: 1000,
            userSelect: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {text}
        </Box>
      </Box>
    );
  }
  
  // Repeated watermark pattern
  return (
    <Box 
      ref={containerRef}
      position="relative"
      style={{
        backgroundSize: `${spacing}px ${spacing}px`
      }}
    >
      {children}
    </Box>
  );
}

// Higher-order component for applying watermark to any component
export function withWatermark(Component, watermarkProps = {}) {
  return function WatermarkedComponent(props) {
    const shouldWatermark = get(props, 'watermark', false);
    const watermarkText = get(props, 'watermarkText', 'WATERMARK');
    
    if (!shouldWatermark) {
      return <Component {...props} />;
    }
    
    return (
      <PdfWatermark text={watermarkText} {...watermarkProps}>
        <Component {...props} />
      </PdfWatermark>
    );
  };
}