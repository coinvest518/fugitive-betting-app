"use client"

import { useState, useEffect, useRef } from "react"
import { Shield } from "lucide-react"

interface Location {
  id: string
  name: string
  x: number
  y: number
  description: string
}

interface MapComponentProps {
  locations: Location[]
  guessedLocations: string[]
  fugitiveLocation: string | null
  role: "tracker" | "fugitive"
  shieldActive: boolean
  aiThinking: boolean
  onLocationClick: (locationId: string) => void
}

// Define map tiles for New Orleans
const MAP_WIDTH = 24
const MAP_HEIGHT = 16

const TILES = {
  WATER: "W", // Lake Pontchartrain
  RIVER: "R", // Mississippi River
  FRENCH: "F", // French Quarter (historic)
  GARDEN: "G", // Garden District
  BUSINESS: "B", // Central Business District
  RESIDENTIAL: "H", // Residential areas
  PARK: "P", // Parks and green spaces
  ROAD: "O", // Major roads
  INDUSTRIAL: "I", // Industrial/Port areas
  MARSH: "M", // Wetlands/Marsh
}

// Create realistic New Orleans map based on actual geography
const createRealisticNewOrleansMap = () => {
  const map = Array(MAP_HEIGHT)
    .fill(null)
    .map(() => Array(MAP_WIDTH).fill(TILES.RESIDENTIAL))

  // Lake Pontchartrain (north)
  for (let x = 0; x < MAP_WIDTH; x++) {
    for (let y = 0; y < 2; y++) {
      map[y][x] = TILES.WATER
    }
  }

  // Mississippi River - characteristic crescent shape
  const riverPoints = [
    { x: 0, y: 12 },
    { x: 2, y: 11 },
    { x: 4, y: 10 },
    { x: 6, y: 9 },
    { x: 8, y: 8 },
    { x: 10, y: 8 },
    { x: 12, y: 9 },
    { x: 14, y: 10 },
    { x: 16, y: 11 },
    { x: 18, y: 12 },
    { x: 20, y: 13 },
    { x: 22, y: 14 },
    { x: 23, y: 15 },
  ]

  // Draw the river
  riverPoints.forEach((point, i) => {
    if (point.y >= 0 && point.y < MAP_HEIGHT && point.x >= 0 && point.x < MAP_WIDTH) {
      map[point.y][point.x] = TILES.RIVER
      // Make river wider
      if (point.y + 1 < MAP_HEIGHT) map[point.y + 1][point.x] = TILES.RIVER
      if (point.x > 0) map[point.y][point.x - 1] = TILES.RIVER
    }
  })

  // French Quarter (historic grid pattern)
  for (let x = 8; x <= 12; x++) {
    for (let y = 6; y <= 8; y++) {
      if (map[y][x] !== TILES.RIVER) {
        map[y][x] = TILES.FRENCH
      }
    }
  }

  // Central Business District (CBD)
  for (let x = 6; x <= 9; x++) {
    for (let y = 5; y <= 7; y++) {
      if (map[y][x] !== TILES.RIVER && map[y][x] !== TILES.FRENCH) {
        map[y][x] = TILES.BUSINESS
      }
    }
  }

  // Garden District (upriver from French Quarter)
  for (let x = 3; x <= 6; x++) {
    for (let y = 7; y <= 9; y++) {
      if (map[y][x] !== TILES.RIVER) {
        map[y][x] = TILES.GARDEN
      }
    }
  }

  // Marigny/Bywater (downriver from French Quarter)
  for (let x = 13; x <= 17; x++) {
    for (let y = 7; y <= 9; y++) {
      if (map[y][x] !== TILES.RIVER) {
        map[y][x] = TILES.RESIDENTIAL
      }
    }
  }

  // Tremé (north of French Quarter)
  for (let x = 9; x <= 12; x++) {
    for (let y = 4; y <= 5; y++) {
      map[y][x] = TILES.RESIDENTIAL
    }
  }

  // Mid-City
  for (let x = 5; x <= 10; x++) {
    for (let y = 2; y <= 4; y++) {
      map[y][x] = TILES.RESIDENTIAL
    }
  }

  // City Park
  map[3][7] = TILES.PARK
  map[3][8] = TILES.PARK
  map[4][7] = TILES.PARK
  map[4][8] = TILES.PARK

  // Audubon Park (Uptown)
  map[8][2] = TILES.PARK
  map[8][3] = TILES.PARK
  map[9][2] = TILES.PARK
  map[9][3] = TILES.PARK

  // Industrial Canal and Port areas
  for (let y = 2; y < MAP_HEIGHT - 2; y++) {
    map[y][18] = TILES.INDUSTRIAL
    map[y][19] = TILES.INDUSTRIAL
  }

  // Major roads
  // Canal Street (major east-west)
  for (let x = 0; x < MAP_WIDTH; x++) {
    if (map[6][x] === TILES.RESIDENTIAL) {
      map[6][x] = TILES.ROAD
    }
  }

  // Magazine Street
  for (let y = 5; y < 11; y++) {
    if (map[y][4] !== TILES.RIVER && map[y][4] !== TILES.WATER) {
      map[y][4] = TILES.ROAD
    }
  }

  // St. Charles Avenue
  for (let x = 1; x < 8; x++) {
    if (map[8][x] !== TILES.RIVER) {
      map[8][x] = TILES.ROAD
    }
  }

  // Esplanade Avenue
  for (let x = 8; x < 18; x++) {
    if (map[5][x] !== TILES.RIVER) {
      map[5][x] = TILES.ROAD
    }
  }

  // Wetlands/Marsh areas (east)
  for (let x = 20; x < MAP_WIDTH; x++) {
    for (let y = 2; y < 8; y++) {
      if (map[y][x] === TILES.RESIDENTIAL) {
        map[y][x] = TILES.MARSH
      }
    }
  }

  return map
}

export function MapComponent({
  locations,
  guessedLocations,
  fugitiveLocation,
  role,
  shieldActive,
  aiThinking,
  onLocationClick,
}: MapComponentProps) {
  const [locationTooltip, setLocationTooltip] = useState<{ id: string; x: number; y: number } | null>(null)
  const [gameMap] = useState(() => createRealisticNewOrleansMap())
  const mapRef = useRef<HTMLDivElement>(null)

  const getTileColor = (tile: string) => {
    switch (tile) {
      case TILES.WATER:
        return "bg-blue-400" // Lake Pontchartrain
      case TILES.RIVER:
        return "bg-blue-600" // Mississippi River
      case TILES.FRENCH:
        return "bg-amber-600" // Historic French Quarter
      case TILES.GARDEN:
        return "bg-emerald-600" // Garden District
      case TILES.BUSINESS:
        return "bg-gray-600" // CBD
      case TILES.RESIDENTIAL:
        return "bg-green-500" // Residential
      case TILES.PARK:
        return "bg-green-400" // Parks
      case TILES.ROAD:
        return "bg-gray-400" // Roads
      case TILES.INDUSTRIAL:
        return "bg-orange-700" // Industrial/Port
      case TILES.MARSH:
        return "bg-green-700" // Wetlands
      default:
        return "bg-green-500"
    }
  }

  const getTileIcon = (tile: string) => {
    switch (tile) {
      case TILES.WATER:
        return "🌊"
      case TILES.RIVER:
        return "🌊"
      case TILES.FRENCH:
        return "🏛️"
      case TILES.GARDEN:
        return "🏡"
      case TILES.BUSINESS:
        return "🏢"
      case TILES.PARK:
        return "🌳"
      case TILES.INDUSTRIAL:
        return "🏭"
      case TILES.MARSH:
        return "🌾"
      case TILES.ROAD:
        return ""
      default:
        return ""
    }
  }

  const getTileLabel = (tile: string) => {
    switch (tile) {
      case TILES.WATER:
        return "Lake"
      case TILES.RIVER:
        return "River"
      case TILES.FRENCH:
        return "French Quarter"
      case TILES.GARDEN:
        return "Garden District"
      case TILES.BUSINESS:
        return "CBD"
      case TILES.RESIDENTIAL:
        return "Residential"
      case TILES.PARK:
        return "Park"
      case TILES.ROAD:
        return "Road"
      case TILES.INDUSTRIAL:
        return "Industrial"
      case TILES.MARSH:
        return "Wetlands"
      default:
        return ""
    }
  }

  const getLocationClass = (locationId: string) => {
    let classes =
      "absolute w-16 h-10 md:w-20 md:h-12 border-2 border-yellow-400 bg-yellow-400/95 flex items-center justify-center text-xs font-bold text-black cursor-pointer transition-all hover:bg-yellow-300 hover:scale-105 text-center leading-tight rounded-lg shadow-lg z-10 backdrop-blur-sm"

    if (guessedLocations.includes(locationId)) {
      if (locationId === fugitiveLocation) {
        classes = classes.replace(
          "border-yellow-400 bg-yellow-400/95 text-black",
          "border-green-500 bg-green-500/95 text-white animate-pulse shadow-green-500/50",
        )
      } else {
        classes = classes.replace(
          "border-yellow-400 bg-yellow-400/95 text-black",
          "border-red-500 bg-red-500/95 text-white shadow-red-500/50",
        )
      }
    }

    if (role === "fugitive" && locationId === fugitiveLocation) {
      classes = classes.replace(
        "border-yellow-400 bg-yellow-400/95 text-black",
        "border-purple-500 bg-purple-500/95 text-white shadow-purple-500/50",
      )
    }

    return classes
  }
  const handleLocationHover = (locationId: string | null, event?: React.MouseEvent) => {
    if (!locationId || !event) {
      setLocationTooltip(null)
      return
    }

    // Get map container's bounding rectangle
    const mapRect = mapRef.current?.getBoundingClientRect()
    if (!mapRect) return

    // Calculate relative position within the map
    const relativeX = event.clientX - mapRect.left
    const relativeY = event.clientY - mapRect.top

    setLocationTooltip({ 
      id: locationId, 
      x: relativeX,
      y: relativeY 
    })
  }

  useEffect(() => {
    console.log("Realistic New Orleans 2D Map rendered")
    console.log("Map dimensions:", MAP_WIDTH, "x", MAP_HEIGHT)
    console.log("Total locations:", locations.length)
  }, [])

  return (
    <div ref={mapRef} className="relative w-full h-96 rounded-lg overflow-hidden bg-blue-300 border-2 border-gray-600">
      {/* 2D Grid Map */}
      <div
        className="absolute inset-0 grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${MAP_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${MAP_HEIGHT}, 1fr)`,
        }}
      >
        {gameMap.map((row, y) =>
          row.map((tile, x) => (
            <div
              key={`${x}-${y}`}
              className={`${getTileColor(tile)} flex items-center justify-center text-xs border border-gray-400/30 relative group`}
              style={{ minHeight: "24px" }}
              title={getTileLabel(tile)}
            >
              <span className="text-xs opacity-60">{getTileIcon(tile)}</span>
            </div>
          )),
        )}
      </div>

      {/* Locations */}
      {locations.map((location) => (
        <div
          key={location.id}
          className={getLocationClass(location.id)}
          style={{
            left: `${location.x}%`,
            top: `${location.y}%`,
            transform: "translate(-50%, -50%)",
          }}          onClick={() => onLocationClick(location.id)}
          onMouseEnter={(e) => handleLocationHover(location.id, e)}
          onMouseLeave={() => handleLocationHover(null)}
        >
          <span className="text-xs font-bold leading-tight">{location.name}</span>
          {/* Character sprites */}
          {role === "fugitive" && location.id === fugitiveLocation && (
            <div className="absolute -top-1 -right-1 text-sm animate-bounce">🥷</div>
          )}
          {guessedLocations.includes(location.id) && location.id === fugitiveLocation && (
            <>
              <div className="absolute -top-1 -left-1 text-sm animate-bounce">🥷</div>
              <div className="absolute -top-1 -right-1 text-sm animate-bounce">🕵️</div>
            </>
          )}
        </div>
      ))}      {/* Location tooltip */}
      {locationTooltip && (
        <div
          className="absolute z-30 bg-black/95 text-white p-3 rounded-lg text-sm max-w-[280px] shadow-2xl border border-yellow-400/50 backdrop-blur-sm"
          style={{
            left: `${locationTooltip.x}px`,
            top: `${locationTooltip.y}px`,
            transform: 'translate(-50%, -120%)',
            pointerEvents: 'none'
          }}
        >
          <div className="font-bold text-yellow-400 mb-1">
            {locations.find((l) => l.id === locationTooltip.id)?.name}
          </div>
          <div className="text-gray-300 text-xs">{locations.find((l) => l.id === locationTooltip.id)?.description}</div>
        </div>
      )}

      {/* AI Thinking Indicator */}
      {aiThinking && (
        <div className="absolute top-4 left-4 bg-black/90 text-white px-4 py-2 rounded-lg border border-purple-500/50 z-20 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
            <span className="text-sm">🤖 AI Tracker Searching...</span>
          </div>
        </div>
      )}

      {/* Shield Active Indicator */}
      {shieldActive && (
        <div className="absolute top-4 right-4 bg-blue-500/90 text-white px-4 py-2 rounded-lg flex items-center border border-blue-300/50 z-20 backdrop-blur-sm">
          <Shield className="h-4 w-4 mr-2" />
          <span className="text-sm">Shield Active</span>
        </div>
      )}

      {/* Compass */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-full text-xs border border-gray-500/50 z-20">
        <span className="text-yellow-400">N</span> ↑
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-2 right-2 bg-black/90 text-white p-3 rounded-lg text-xs border border-yellow-400/30 z-20 backdrop-blur-sm max-w-[200px] pointer-events-auto opacity-90">
        <div className="font-bold text-yellow-400 mb-2">New Orleans Districts</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-amber-600 rounded"></div>
            <span>French Quarter</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-emerald-600 rounded"></div>
            <span>Garden District</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-600 rounded"></div>
            <span>CBD</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded"></div>
            <span>Mississippi</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded"></div>
            <span>Lake Pontch.</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded"></div>
            <span>Parks</span>
          </div>
        </div>
      </div>

      {/* Street Labels */}
      <div className="absolute bottom-16 left-8 text-white text-xs bg-black/60 px-2 py-1 rounded z-20">Canal St.</div>
      <div className="absolute top-20 left-12 text-white text-xs bg-black/60 px-2 py-1 rounded z-20 transform -rotate-90">
        Magazine St.
      </div>
    </div>
  )
}
