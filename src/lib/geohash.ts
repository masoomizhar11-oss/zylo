// Geohash implementation for proximity zones
// Based on the geohash algorithm (public domain)

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
const BITS = [16, 8, 4, 2, 1]

export const geohash = {
  encode(latitude: number, longitude: number, precision = 4): string {
    let isEven = true
    let bit = 0
    let ch = 0
    let result = ''

    let latMin = -90
    let latMax = 90
    let lonMin = -180
    let lonMax = 180

    while (result.length < precision) {
      if (isEven) {
        const mid = (lonMin + lonMax) / 2
        if (longitude >= mid) {
          ch |= BITS[bit]
          lonMin = mid
        } else {
          lonMax = mid
        }
      } else {
        const mid = (latMin + latMax) / 2
        if (latitude >= mid) {
          ch |= BITS[bit]
          latMin = mid
        } else {
          latMax = mid
        }
      }

      isEven = !isEven
      if (bit < 4) {
        bit++
      } else {
        result += BASE32[ch]
        bit = 0
        ch = 0
      }
    }

    return result
  },

  decode(geohash: string): { latitude: number; longitude: number; latMin: number; latMax: number; lonMin: number; lonMax: number } {
    let isEven = true
    let latMin = -90
    let latMax = 90
    let lonMin = -180
    let lonMax = 180

    for (const char of geohash) {
      const cd = BASE32.indexOf(char)
      if (cd === -1) continue

      for (const bit of BITS) {
        if (isEven) {
          const mid = (lonMin + lonMax) / 2
          if (cd & bit) {
            lonMin = mid
          } else {
            lonMax = mid
          }
        } else {
          const mid = (latMin + latMax) / 2
          if (cd & bit) {
            latMin = mid
          } else {
            latMax = mid
          }
        }
        isEven = !isEven
      }
    }

    return {
      latitude: (latMin + latMax) / 2,
      longitude: (lonMin + lonMax) / 2,
      latMin,
      latMax,
      lonMin,
      lonMax,
    }
  },

  neighbors(geohash: string): string[] {
    const decoded = this.decode(geohash)
    const precision = geohash.length

    // Calculate neighbor coordinates (approximate)
    const latStep = (decoded.latMax - decoded.latMin) * 2
    const lonStep = (decoded.lonMax - decoded.lonMin) * 2

    const directions = [
      { lat: decoded.latitude + latStep, lon: decoded.longitude }, // N
      { lat: decoded.latitude + latStep, lon: decoded.longitude + lonStep }, // NE
      { lat: decoded.latitude, lon: decoded.longitude + lonStep }, // E
      { lat: decoded.latitude - latStep, lon: decoded.longitude + lonStep }, // SE
      { lat: decoded.latitude - latStep, lon: decoded.longitude }, // S
      { lat: decoded.latitude - latStep, lon: decoded.longitude - lonStep }, // SW
      { lat: decoded.latitude, lon: decoded.longitude - lonStep }, // W
      { lat: decoded.latitude + latStep, lon: decoded.longitude - lonStep }, // NW
    ]

    return directions.map(d => this.encode(d.lat, d.lon, precision))
  },

  boundingBox(geohash: string) {
    return this.decode(geohash)
  },
}

export function geohashToBoundingBox(geohashStr: string) {
  return geohash.boundingBox(geohashStr)
}

export function getGeohashPrecision(meters: number): number {
  // Approximate precision for given meter radius
  if (meters <= 100) return 6
  if (meters <= 500) return 5
  if (meters <= 2000) return 4
  if (meters <= 10000) return 3
  return 2
}