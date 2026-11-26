#!/usr/bin/env node
// Generate PWA icons from SVG using sharp
// Run: node scripts/generate-icons.mjs

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputSvg = path.resolve('public/icons/icon.svg')
const outputDir = path.resolve('public/icons')

async function generateIcons() {
  const svgBuffer = fs.readFileSync(inputSvg)
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    console.log(`Generated ${outputPath}`)
  }
  
  // Also generate favicon.ico (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFile(path.resolve('public/favicon.ico'))
  console.log('Generated favicon.ico')
  
  // Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'))
  console.log('Generated apple-touch-icon.png')
  
  console.log('\nAll icons generated!')
}

generateIcons().catch(console.error)