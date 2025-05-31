"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, RotateCcw, Lightbulb, Flag, Zap, Shield, Eye, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { getUserStats, saveUserStats } from "@/lib/moralis"
import { config } from "@/lib/config"
// Import the MapComponent
import { MapComponent } from "./map-component"
import { BettingSystem } from "@/components/betting-system"
import { FbtBalance } from "@/components/fbt-balance"
import { WalletConnection } from "@/components/wallet-connection"
import { LeaderboardMarquee } from "@/components/leaderboard-marquee"

interface Location {
  id: string
  name: string
  x: number
  y: number
  description: string
}

interface GameState {
  role: "tracker" | "fugitive"
  fugitiveLocation: string | null
  guessesLeft: number
  maxGuesses: number
  gameActive: boolean
  gameWon: boolean
  guessedLocations: string[]
  captureScore: number
  escapeScore: number
  hintUsed: boolean
  powerUps: {
    scanner: number
    shield: number
    speed: number
  }
  shieldActive: boolean
  soundEnabled: boolean
}

// Realistic New Orleans locations based on actual geography and districts
const locations: Location[] = [
  {
    id: "french-quarter",
    name: "French Quarter",
    x: 42,
    y: 45,
    description: "Historic heart of New Orleans with iconic architecture, jazz clubs, and Bourbon Street",
  },
  {
    id: "garden-district",
    name: "Garden District",
    x: 20,
    y: 52,
    description: "Elegant Victorian mansions and oak-lined streets upriver from downtown",
  },
  {
    id: "marigny",
    name: "Marigny",
    x: 58,
    y: 48,
    description: "Bohemian neighborhood downriver from French Quarter, known for Frenchmen Street",
  },
  {
    id: "warehouse-district",
    name: "Warehouse District",
    x: 32,
    y: 42,
    description: "Arts district with museums, galleries, and converted warehouse lofts",
  },
  {
    id: "bywater",
    name: "Bywater",
    x: 68,
    y: 50,
    description: "Colorful neighborhood with shotgun houses and emerging restaurant scene",
  },
  {
    id: "treme",
    name: "Tremé",
    x: 45,
    y: 32,
    description: "Historic African-American neighborhood, birthplace of jazz music",
  },
  {
    id: "mid-city",
    name: "Mid-City",
    x: 32,
    y: 22,
    description: "Diverse area home to City Park, Bayou St. John, and the Fair Grounds",
  },
  {
    id: "uptown",
    name: "Uptown",
    x: 15,
    y: 55,
    description: "University area with Tulane, Loyola, and the famous St. Charles streetcar line",
  },
  {
    id: "algiers",
    name: "Algiers",
    x: 10, // moved further left to avoid being blocked
    y: 75,
    description: "Historic neighborhood on the West Bank across the Mississippi River",
  },
  {
    id: "gentilly",
    name: "Gentilly",
    x: 75,
    y: 28,
    description: "Large residential area extending toward Lake Pontchartrain",
  },
  {
    id: "lakefront",
    name: "Lakefront",
    x: 50,
    y: 12,
    description: "Recreational area along Lake Pontchartrain with parks and marinas",
  },
  {
    id: "cbd",
    name: "CBD",
    x: 35,
    y: 38,
    description: "Central Business District with skyscrapers, hotels, and the Superdome",
  },
]

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>({
    role: "tracker",
    fugitiveLocation: null,
    guessesLeft: 5,
    maxGuesses: 5,
    gameActive: false,
    gameWon: false,
    guessedLocations: [],
    captureScore: 0,
    escapeScore: 0,
    hintUsed: false,
    powerUps: {
      scanner: 2,
      shield: 1,
      speed: 3,
    },
    shieldActive: false,
    soundEnabled: true,
  })

  const [message, setMessage] = useState("Welcome to New Orleans! Choose your role and start the hunt...")
  const [aiThinking, setAiThinking] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [locationTooltip, setLocationTooltip] = useState<{ id: string; x: number; y: number } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Audio references
  const clickSoundRef = useRef<HTMLAudioElement | null>(null)
  const successSoundRef = useRef<HTMLAudioElement | null>(null)
  const failureSoundRef = useRef<HTMLAudioElement | null>(null)
  const powerupSoundRef = useRef<HTMLAudioElement | null>(null)
  const winSoundRef = useRef<HTMLAudioElement | null>(null)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const musicRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      clickSoundRef.current = new Audio("/sounds/game-bonus.mp3")
      successSoundRef.current = new Audio("/sounds/game-start-1.mp3")
      failureSoundRef.current = new Audio("/sounds/game-start-2.mp3")
      powerupSoundRef.current = new Audio("/sounds/powerup.mp3")
      winSoundRef.current = new Audio("/sounds/win.mp3")
      musicRef.current = new Audio("/sounds/Gangstar New Orleans - Cemetary Mission (1).mp3")
      musicRef.current.loop = true
      if (musicEnabled) {
        musicRef.current.volume = 0.5
        musicRef.current.play().catch(() => {})
      }
    }
    return () => {
      musicRef.current?.pause()
      musicRef.current = null
    }
  }, [])

  // Play/pause music on toggle (now also depends on gameState.soundEnabled)
  useEffect(() => {
    if (!musicRef.current) return
    if (musicEnabled && gameState.soundEnabled) {
      musicRef.current.currentTime = 0
      musicRef.current.play().catch(() => {})
    } else {
      musicRef.current.pause()
    }
  }, [musicEnabled, gameState.soundEnabled])

  // Play sound helper function
  const playSound = (sound: "click" | "success" | "failure" | "powerup" | "win") => {
    if (!gameState.soundEnabled) return

    switch (sound) {
      case "click":
        clickSoundRef.current?.play().catch((e) => console.log("Audio play error:", e))
        break
      case "success":
        successSoundRef.current?.play().catch((e) => console.log("Audio play error:", e))
        break
      case "failure":
        failureSoundRef.current?.play().catch((e) => console.log("Audio play error:", e))
        break
      case "powerup":
        powerupSoundRef.current?.play().catch((e) => console.log("Audio play error:", e))
        break
      case "win":
        winSoundRef.current?.play().catch((e) => console.log("Audio play error:", e))
        break
    }
  }

  // Toggle sound
  const toggleSound = () => {
    setGameState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }))
  }

  // Toggle music
  const toggleMusic = () => setMusicEnabled((prev) => !prev)

  // Load user stats from Moralis when walletAddress changes
  useEffect(() => {
    if (!walletAddress) return
    getUserStats(walletAddress)
      .then((stats) => {
        setGameState((prev) => ({
          ...prev,
          captureScore: stats.captures,
          escapeScore: stats.escapes,
        }))
      })
      .catch((error) => {
        console.error("Error loading user stats:", error)
      })
  }, [walletAddress])

  // Check for wallet connection and load user stats
  useEffect(() => {
    const checkWalletAndLoadStats = async () => {
      // Check if wallet is connected from localStorage
      const address = localStorage.getItem("walletAddress")
      if (address) {
        setWalletAddress(address)

        // Load user stats from Moralis
        try {
          const stats = await getUserStats(address)
          setGameState((prev) => ({
            ...prev,
            captureScore: stats.captures,
            escapeScore: stats.escapes,
          }))
        } catch (error) {
          console.error("Error loading user stats:", error)
        }
      }
    }

    checkWalletAndLoadStats()
  }, [])

  // Save wallet address when connected
  useEffect(() => {
    const handleWalletConnection = (event: CustomEvent) => {
      const { address } = event.detail
      setWalletAddress(address)
      localStorage.setItem("walletAddress", address)

      // Load user stats
      getUserStats(address)
        .then((stats) => {
          setGameState((prev) => ({
            ...prev,
            captureScore: stats.captures,
            escapeScore: stats.escapes,
          }))
        })
        .catch((error) => {
          console.error("Error loading user stats:", error)
        })
    }

    window.addEventListener("walletConnected" as any, handleWalletConnection as any)

    return () => {
      window.removeEventListener("walletConnected" as any, handleWalletConnection as any)
    }
  }, [])

  useEffect(() => {
    console.log("GamePage: Current wallet address:", walletAddress)
  }, [walletAddress])

  // Define usePowerUp function first
  const usePowerUp = useCallback(
    (type: "scanner" | "shield" | "speed") => {
      if (gameState.powerUps[type] <= 0 || !gameState.gameActive) return

      playSound("powerup")

      setGameState((prev) => ({
        ...prev,
        powerUps: {
          ...prev.powerUps,
          [type]: prev.powerUps[type] - 1,
        },
      }))

      switch (type) {
        case "scanner":
          // Reveal 2 random empty locations
          const emptyLocations = locations
            .filter((loc) => loc.id !== gameState.fugitiveLocation && !gameState.guessedLocations.includes(loc.id))
            .sort(() => 0.5 - Math.random())
            .slice(0, 2)

          setGameState((prev) => ({
            ...prev,
            guessedLocations: [...prev.guessedLocations, ...emptyLocations.map((l) => l.id)],
          }))
          setMessage(`🔍 Scanner revealed ${emptyLocations.map((l) => l.name).join(" and ")} are empty!`)
          break

        case "shield":
          // Protect from losing a guess on next wrong answer
          setGameState((prev) => ({
            ...prev,
            shieldActive: true,
          }))
          setMessage("🛡️ Shield activated! Your next guess won't cost you if wrong.")
          break

        case "speed":
          // Get an extra guess
          setGameState((prev) => ({
            ...prev,
            guessesLeft: prev.guessesLeft + 1,
            maxGuesses: prev.maxGuesses + 1,
          }))
          setMessage("⚡ Speed boost! You gained an extra guess!")
          break
      }
    },
    [gameState.powerUps, gameState.gameActive, gameState.fugitiveLocation, gameState.guessedLocations],
  )

  // Now define the click handlers that depend on usePowerUp
  const handleScannerClick = useCallback(() => {
    usePowerUp("scanner")
  }, [usePowerUp])

  const handleShieldClick = useCallback(() => {
    usePowerUp("shield")
  }, [usePowerUp])

  const handleSpeedClick = useCallback(() => {
    usePowerUp("speed")
  }, [usePowerUp])

  const selectRole = (role: "tracker" | "fugitive") => {
    playSound("click")
    setGameState((prev) => ({ ...prev, role }))
    newGame(role)
  }

  const newGame = useCallback(
    (role?: "tracker" | "fugitive") => {
      playSound("click")
      const currentRole = role || gameState.role
      const maxGuesses = currentRole === "tracker" ? 5 : 3

      setGameState((prev) => ({
        ...prev,
        role: currentRole,
        gameWon: false,
        guessedLocations: [],
        hintUsed: false,
        maxGuesses,
        guessesLeft: maxGuesses,
        fugitiveLocation: currentRole === "tracker" ? locations[Math.floor(Math.random() * locations.length)].id : null,
        gameActive: true,
        shieldActive: false,
      }))

      if (currentRole === "tracker") {
        setMessage("A fugitive is hiding somewhere in New Orleans. Click locations to search!")
      } else {
        setMessage("Click on a location to hide as a fugitive. Choose carefully!")
      }
    },
    [gameState.role],
  )

  const handleLocationClick = (locationId: string) => {
    if (!gameState.gameActive) return

    playSound("click")

    if (gameState.role === "fugitive" && !gameState.fugitiveLocation) {
      // Fugitive selecting hiding spot
      setGameState((prev) => ({ ...prev, fugitiveLocation: locationId }))
      setMessage(
        `You are now hiding in ${locations.find((l) => l.id === locationId)?.name}. The AI tracker will now try to find you!`,
      )

      // Start AI tracking after delay
      setTimeout(() => startAITracking(locationId), 2000)
      return
    }

    if (gameState.role === "tracker") {
      makeGuess(locationId)
    }
  }

  const makeGuess = (locationId: string) => {
    if (gameState.guessedLocations.includes(locationId)) {
      setMessage("You already searched there! Try a different location.")
      return
    }

    const newGuessedLocations = [...gameState.guessedLocations, locationId]

    // Check if shield is active to prevent losing a guess
    let newGuessesLeft = gameState.guessesLeft
    if (!gameState.shieldActive) {
      newGuessesLeft -= 1
    } else {
      // Shield was used, deactivate it
      setGameState((prev) => ({ ...prev, shieldActive: false }))
      setMessage("🛡️ Shield protected you from losing a guess!")
      playSound("powerup")
    }

    const locationName = locations.find((l) => l.id === locationId)?.name

    setGameState((prev) => ({
      ...prev,
      guessedLocations: newGuessedLocations,
      guessesLeft: newGuessesLeft,
    }))

    if (locationId === gameState.fugitiveLocation) {
      // Found the fugitive!
      const newCaptureScore = gameState.captureScore + 1

      playSound("success")

      setGameState((prev) => ({
        ...prev,
        gameActive: false,
        gameWon: true,
        captureScore: newCaptureScore,
      }))

      setMessage(`🎉 CAPTURED! You found the fugitive hiding in ${locationName}!`)

      // Save stats to Moralis if wallet is connected
      if (walletAddress) {
        saveUserStats(walletAddress, {
          captures: newCaptureScore,
          escapes: gameState.escapeScore,
        })
      }
    } else {
      // Wrong location
      if (newGuessesLeft <= 0) {
        // Game over
        const newEscapeScore = gameState.escapeScore + 1

        playSound("failure")

        setGameState((prev) => ({
          ...prev,
          gameActive: false,
          escapeScore: newEscapeScore,
        }))

        const fugitiveName = locations.find((l) => l.id === gameState.fugitiveLocation)?.name
        setMessage(`💀 GAME OVER! The fugitive escaped! They were hiding in ${fugitiveName}.`)

        // Save stats to Moralis if wallet is connected
        if (walletAddress) {
          saveUserStats(walletAddress, {
            captures: gameState.captureScore,
            escapes: newEscapeScore,
          })
        }
      } else {
        // Give hint
        const hint = getHint(locationId, gameState.fugitiveLocation!)
        setMessage(`Not in ${locationName}. ${hint}`)
      }
    }
  }

  const startAITracking = (fugitiveLocationId: string) => {
    let aiGuesses = 0
    const maxAIGuesses = 3
    setAiThinking(true)

    const makeAIGuess = () => {
      if (aiGuesses >= maxAIGuesses) {
        const newEscapeScore = gameState.escapeScore + 1

        playSound("success")

        setGameState((prev) => ({
          ...prev,
          gameActive: false,
          escapeScore: newEscapeScore,
        }))

        setMessage("🎉 ESCAPED! The AI tracker failed to find you!")
        setAiThinking(false)

        // Save stats to Moralis if wallet is connected
        if (walletAddress) {
          saveUserStats(walletAddress, {
            captures: gameState.captureScore,
            escapes: newEscapeScore,
          })
        }
        return
      }

      const unguessedLocations = locations.filter((loc) => !gameState.guessedLocations.includes(loc.id))

      if (unguessedLocations.length === 0) {
        const newEscapeScore = gameState.escapeScore + 1

        playSound("success")

        setGameState((prev) => ({
          ...prev,
          gameActive: false,
          escapeScore: newEscapeScore,
        }))

        setMessage("🎉 ESCAPED! The AI is stumped!")
        setAiThinking(false)

        // Save stats to Moralis if wallet is connected
        if (walletAddress) {
          saveUserStats(walletAddress, {
            captures: gameState.captureScore,
            escapes: newEscapeScore,
          })
        }
        return
      }

      // AI is smarter now - it uses a weighted random selection based on distance from previous guesses
      let aiGuess

      if (aiGuesses === 0 || gameState.guessedLocations.length === 0) {
        // First guess is random
        const randomIndex = Math.floor(Math.random() * unguessedLocations.length)
        aiGuess = unguessedLocations[randomIndex]
      } else {
        // Subsequent guesses are weighted by distance from previous guesses
        const lastGuessId = gameState.guessedLocations[gameState.guessedLocations.length - 1]
        const lastGuess = locations.find((l) => l.id === lastGuessId)!

        // Calculate distances and weights
        const locationsWithWeights = unguessedLocations.map((loc) => {
          const dx = loc.x - lastGuess.x
          const dy = loc.y - lastGuess.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Closer locations get higher weights (inverse distance)
          const weight = 1 / (distance + 0.1) // Add 0.1 to avoid division by zero

          return { location: loc, weight }
        })

        // Calculate total weight
        const totalWeight = locationsWithWeights.reduce((sum, item) => sum + item.weight, 0)

        // Select location based on weight
        let random = Math.random() * totalWeight
        let selectedLocation = locationsWithWeights[0].location

        for (const item of locationsWithWeights) {
          random -= item.weight
          if (random <= 0) {
            selectedLocation = item.location
            break
          }
        }

        aiGuess = selectedLocation
      }

      playSound("click")

      setGameState((prev) => ({
        ...prev,
        guessedLocations: [...prev.guessedLocations, aiGuess.id],
      }))

      aiGuesses++

      if (aiGuess.id === fugitiveLocationId) {
        const newCaptureScore = gameState.captureScore + 1

        playSound("failure")

        setGameState((prev) => ({
          ...prev,
          gameActive: false,
          gameWon: true,
          captureScore: newCaptureScore,
        }))

        setMessage(`💀 CAUGHT! The AI found you in ${aiGuess.name}!`)
        setAiThinking(false)

        // Save stats to Moralis if wallet is connected
        if (walletAddress) {
          saveUserStats(walletAddress, {
            captures: newCaptureScore,
            escapes: gameState.escapeScore,
          })
        }
      } else {
        const remaining = maxAIGuesses - aiGuesses
        setMessage(
          `AI searched ${aiGuess.name} but missed! ${remaining > 0 ? remaining + " AI attempts left..." : "That was the AI's last chance!"}`,
        )

        if (remaining > 0) {
          setTimeout(makeAIGuess, 2000)
        } else {
          const newEscapeScore = gameState.escapeScore + 1

          playSound("success")

          setGameState((prev) => ({
            ...prev,
            gameActive: false,
            escapeScore: newEscapeScore,
          }))

          setMessage("🎉 ESCAPED! The AI tracker failed to find you!")
          setAiThinking(false)

          // Save stats to Moralis if wallet is connected
          if (walletAddress) {
            saveUserStats(walletAddress, {
              captures: gameState.captureScore,
              escapes: newEscapeScore,
            })
          }
        }
      }
    }

    setTimeout(makeAIGuess, 1500)
  }

  const getHint = (guessedId: string, actualId: string) => {
    const guessedLoc = locations.find((l) => l.id === guessedId)!
    const actualLoc = locations.find((l) => l.id === actualId)!

    const dx = actualLoc.x - guessedLoc.x
    const dy = actualLoc.y - guessedLoc.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    let direction = ""
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? "east" : "west"
    } else {
      direction = dy > 0 ? "south" : "north"
    }

    // New Orleans specific hints
    if (distance < 15) {
      return "🔥 Very close! Check nearby districts."
    } else if (distance < 30) {
      if (actualLoc.y < 25) {
        return "🔸 Try looking near the lakefront or Mid-City area."
      } else if (actualLoc.y > 60) {
        return "🔸 Look across the river or in the southern areas."
      } else {
        return `🔸 Getting warmer. Try heading ${direction} along the river.`
      }
    } else {
      if (actualLoc.x < 30) {
        return "❄️ Cold. Try the upriver neighborhoods like Garden District or Uptown."
      } else if (actualLoc.x > 60) {
        return "❄️ Cold. Look downriver toward Marigny, Bywater, or Gentilly."
      } else {
        return "❄️ Cold. Focus on the central districts near the French Quarter."
      }
    }
  }

  const showHint = () => {
    if (!gameState.gameActive || gameState.hintUsed || gameState.role !== "tracker") return

    playSound("powerup")

    setGameState((prev) => ({
      ...prev,
      hintUsed: true,
      guessesLeft: Math.max(0, prev.guessesLeft - 1),
    }))

    const actualLoc = locations.find((l) => l.id === gameState.fugitiveLocation)!
    let hint = "The fugitive was last seen "

    // New Orleans specific geographical hints
    if (actualLoc.x < 25) {
      hint += "in the upriver areas (Garden District, Uptown)"
    } else if (actualLoc.x > 65) {
      hint += "in the downriver neighborhoods (Bywater, Gentilly)"
    } else {
      hint += "in the central districts (French Quarter, CBD, Tremé)"
    }

    if (actualLoc.y < 25) {
      hint += " near Lake Pontchartrain."
    } else if (actualLoc.y > 60) {
      hint += " across the Mississippi River."
    } else {
      hint += " along the river bend."
    }

    setMessage(`💡 HINT: ${hint} (Hint cost 1 guess)`)
  }

  const surrender = () => {
    if (!gameState.gameActive) return

    playSound("failure")

    const newEscapeScore = gameState.role === "tracker" ? gameState.escapeScore + 1 : gameState.escapeScore

    setGameState((prev) => ({
      ...prev,
      gameActive: false,
      escapeScore: newEscapeScore,
    }))

    const fugitiveName = locations.find((l) => l.id === gameState.fugitiveLocation)?.name
    setMessage(`🏳️ You gave up! The fugitive was hiding in ${fugitiveName}.`)

    // Save stats to Moralis if wallet is connected
    if (walletAddress) {
      saveUserStats(walletAddress, {
        captures: gameState.captureScore,
        escapes: newEscapeScore,
      })
    }
  }

  // Jupiter modal integration
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Jupiter) {
      const script = document.createElement("script")
      script.src = "https://terminal.jup.ag/main-v4.js"
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const openJupiterModal = () => {
    if (window.Jupiter) {
      window.Jupiter.init({
        endpoint: config.rpcEndpoint || "",
        displayMode: "modal",
        containerId: "",
        platformFeeAndAccounts: {
          feeBps: 50, // Use the same fee as in config
          feeAccounts: config.jupiter.platformFeeAccounts,
        },
        integratedTargetId: undefined,
        onSuccess: () => {},
        onError: () => {},
      })
    }
  }

  useEffect(() => {
    newGame()
  }, [newGame])

  useEffect(() => {
    console.log("Game state updated:", gameState)
  }, [gameState])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <LeaderboardMarquee />
        {/* Responsive Header */}
        <header className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4 md:gap-8 mb-8 border-b border-slate-800 pb-4">
          <div className="flex-1 w-full text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
              🎯 New Orleans Fugitive Tracker
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base font-medium max-w-md mx-auto md:mx-0">
              Play as a tracker or fugitive. Outsmart your opponent in the heart of New Orleans!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full md:w-auto justify-center md:justify-end">
            <WalletConnection onConnect={() => {}} onDisconnect={() => {}} />
            <FbtBalance walletAddress={walletAddress} />
          </div>
        </header>

        {/* Tabs or Controls Row (if any) */}
        {/* Example: Add your tabs here, styled for mobile/desktop */}
        {/* <div className="flex flex-wrap gap-2 md:gap-4 mb-6 justify-center md:justify-start">
          <Button variant="secondary">Tab 1</Button>
          <Button variant="secondary">Tab 2</Button>
        </div> */}

        {/* Role Selection */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            onClick={() => selectRole("tracker")}
            variant={gameState.role === "tracker" ? "default" : "outline"}
            className={
              gameState.role === "tracker"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                : "border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
            }
          >
            🕵️ Play as Tracker
          </Button>
          <Button
            onClick={() => selectRole("fugitive")}
            variant={gameState.role === "fugitive" ? "default" : "outline"}
            className={
              gameState.role === "fugitive"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                : "border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            }
          >
            🥷 Play as Fugitive
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-3">
            <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-center">New Orleans - The Crescent City</CardTitle>
                <CardDescription className="text-gray-300 text-center">
                  {gameState.role === "tracker"
                    ? "Search the historic districts and neighborhoods for the hidden fugitive"
                    : "Choose a district to hide in and evade the AI tracker"}
                </CardDescription>
              </CardHeader>              <CardContent>
                <MapComponent
                  locations={locations}
                  guessedLocations={gameState.guessedLocations}
                  fugitiveLocation={gameState.fugitiveLocation}
                  role={gameState.role}
                  shieldActive={gameState.shieldActive}
                  aiThinking={aiThinking}
                  onLocationClick={handleLocationClick}
                />                {/* Message Area */}
                <div className="mt-4 p-4 bg-black/30 border border-purple-800/30 rounded-lg">
                  <p className="text-center text-gray-300">{message}</p>
                </div>
                {/* Control Buttons */}
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    onClick={() => newGame()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    New Game
                  </Button>
                  <Button
                    onClick={showHint}
                    disabled={gameState.hintUsed || gameState.role !== "tracker" || !gameState.gameActive}
                    variant="outline"
                    className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Use Hint
                  </Button>
                  <Button onClick={toggleSound} variant="outline">
                    {gameState.soundEnabled ? (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" /> Sound On
                      </>
                    ) : (
                      <>
                        <VolumeX className="mr-2 h-4 w-4" /> Sound Off
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Info Sidebar */}
          <div className="space-y-4">
            {/* Game Status */}
            <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Game Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Role:</span>
                  <Badge variant={gameState.role === "tracker" ? "default" : "secondary"}>
                    {gameState.role === "tracker" ? "🕵️ Tracker" : "🥷 Fugitive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Guesses Left:</span>
                  <span className="text-white font-bold">{gameState.guessesLeft}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-300 text-sm">Progress:</span>
                  <Progress value={(gameState.guessedLocations.length / gameState.maxGuesses) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Power-ups */}
            <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Power-ups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={handleScannerClick}
                  disabled={gameState.powerUps.scanner <= 0 || !gameState.gameActive || gameState.role !== "tracker"}
                  variant="outline"
                  size="sm"
                  className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Scanner ({gameState.powerUps.scanner})
                </Button>
                <Button
                  onClick={handleShieldClick}
                  disabled={gameState.powerUps.shield <= 0 || !gameState.gameActive || gameState.shieldActive}
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Shield ({gameState.powerUps.shield})
                </Button>
                <Button
                  onClick={handleSpeedClick}
                  disabled={gameState.powerUps.speed <= 0 || !gameState.gameActive}
                  variant="outline"
                  size="sm"
                  className="w-full border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Speed ({gameState.powerUps.speed})
                </Button>
              </CardContent>
            </Card>

            {/* Score */}
            <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Session Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Captures:</span>
                  <span className="text-green-400 font-bold">{gameState.captureScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Escapes:</span>
                  <span className="text-purple-400 font-bold">{gameState.escapeScore}</span>
                </div>
                {walletAddress ? (
                  <div className="text-xs text-gray-400 mt-2">Stats synced to wallet</div>
                ) : (
                  <div className="text-xs text-gray-400 mt-2">Connect wallet to save stats</div>
                )}              </CardContent>
            </Card>
          </div>
        </div>

        {/* Betting System */}
        <div className="mt-6">
          <BettingSystem
            walletAddress={walletAddress}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  )
}
