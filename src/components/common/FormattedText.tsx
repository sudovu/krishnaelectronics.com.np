'use client';

import React from 'react';

/**
 * Safely renders text supporting bold, italic, and underline tags.
 * Supports HTML tags (<b>, <i>, <u>, <strong>, <em>) as well as Markdown (**bold**, *italic*, __underline__).
 */
export function FormattedText({ 
  text, 
  className 
}: { 
  text?: string | null; 
  className?: string;
}) {
  if (!text) return null;

  // Convert markdown to standard HTML tags if present
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default FormattedText;
