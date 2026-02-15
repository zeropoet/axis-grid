"use client"

import { useEffect, useRef } from "react"
import type p5 from "p5"

type GridNode = {
    bx: number
    by: number
    x: number
    y: number
    phase: number
}

export default function GridEngine() {
    const hostRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let instance: p5 | null = null
        let cancelled = false

        const sketch = (p: p5) => {
            let cols = 0
            let rows = 0
            let spacing = 0
            let nodes: GridNode[] = []
            let drift = 0

            const indexOf = (r: number, c: number) => r * cols + c

            function viewport() {
                return {
                    width: Math.max(320, window.innerWidth),
                    height: Math.max(240, window.innerHeight)
                }
            }

            function rebuildGrid() {
                const { width, height } = viewport()
                const unit = Math.min(width, height)
                spacing = Math.max(22, Math.min(52, Math.floor(unit / 22)))
                cols = Math.floor(width / spacing) + 3
                rows = Math.floor(height / spacing) + 3
                const startX = -(cols - 1) * spacing * 0.5
                const startY = -(rows - 1) * spacing * 0.5

                nodes = []
                for (let r = 0; r < rows; r += 1) {
                    for (let c = 0; c < cols; c += 1) {
                        const bx = startX + c * spacing
                        const by = startY + r * spacing
                        nodes.push({
                            bx,
                            by,
                            x: bx,
                            y: by,
                            phase: p.noise(r * 0.09, c * 0.09) * Math.PI * 2
                        })
                    }
                }
            }

            function attractor(t: number) {
                const { width, height } = viewport()
                const rx = width * 0.24
                const ry = height * 0.18
                const auto = {
                    x: Math.cos(t * 0.8) * rx,
                    y: Math.sin(t * 0.6 + 0.7) * ry
                }

                if (p.mouseX < 0 || p.mouseY < 0 || p.mouseX > width || p.mouseY > height) return auto

                return {
                    x: p.mouseX - width * 0.5,
                    y: p.mouseY - height * 0.5
                }
            }

            p.setup = () => {
                const { width, height } = viewport()
                p.pixelDensity(1)
                const canvas = p.createCanvas(width, height)
                canvas.style("display", "block")
                canvas.style("position", "fixed")
                canvas.style("left", "0")
                canvas.style("top", "0")
                canvas.style("width", "100%")
                canvas.style("height", "100%")
                p.background(0)
                rebuildGrid()
            }

            p.windowResized = () => {
                const { width, height } = viewport()
                p.pixelDensity(1)
                p.resizeCanvas(width, height)
                rebuildGrid()
            }

            p.draw = () => {
                drift += 0.0055
                const t = drift
                const { width, height } = viewport()
                const centerX = width * 0.5
                const centerY = height * 0.5
                const focus = attractor(t)

                p.background(0, 0, 0, 55)
                p.translate(centerX, centerY)

                for (let i = 0; i < nodes.length; i += 1) {
                    const node = nodes[i]
                    const dx = node.bx - focus.x
                    const dy = node.by - focus.y
                    const d = Math.sqrt(dx * dx + dy * dy) || 1
                    const dNorm = Math.min(1, d / (Math.min(width, height) * 0.55))
                    const pull = (1 - dNorm) * 16

                    const waveA = Math.sin(t * 1.9 + node.phase + node.bx * 0.011)
                    const waveB = Math.cos(t * 1.6 + node.phase + node.by * 0.011)
                    const waveX = waveA * 7 + waveB * 3
                    const waveY = waveB * 7 + waveA * 3

                    const attractX = (focus.x - node.bx) / d * pull
                    const attractY = (focus.y - node.by) / d * pull

                    node.x = node.bx + waveX + attractX
                    node.y = node.by + waveY + attractY
                }

                p.strokeWeight(0.9)
                for (let r = 0; r < rows; r += 1) {
                    for (let c = 0; c < cols; c += 1) {
                        const node = nodes[indexOf(r, c)]
                        const right = c + 1 < cols ? nodes[indexOf(r, c + 1)] : null
                        const down = r + 1 < rows ? nodes[indexOf(r + 1, c)] : null

                        const glow =
                            0.5 +
                            0.5 * Math.sin(t * 1.3 + node.phase + r * 0.14 + c * 0.09)

                        if (right) {
                            p.stroke(235, 235, 235, 16 + glow * 34)
                            p.line(node.x, node.y, right.x, right.y)
                        }
                        if (down) {
                            p.stroke(235, 235, 235, 16 + glow * 34)
                            p.line(node.x, node.y, down.x, down.y)
                        }
                    }
                }

                p.noStroke()
                for (let i = 0; i < nodes.length; i += 1) {
                    const node = nodes[i]
                    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + node.phase)
                    p.fill(248, 248, 248, 70 + pulse * 130)
                    p.circle(node.x, node.y, 1.3 + pulse * 2.2)
                }
            }
        }

        const mount = async () => {
            try {
                const { default: P5 } = await import("p5")
                if (cancelled || !hostRef.current) return
                instance = new P5(sketch, hostRef.current)
            } catch (error) {
                console.error(error)
            }
        }

        void mount()

        return () => {
            cancelled = true
            instance?.remove()
        }
    }, [])

    return <div ref={hostRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />
}
