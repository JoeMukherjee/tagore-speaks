import React, { useEffect, useState, useRef } from "react";

interface AudioVisualizationProps {
    isVisible: boolean;
}

const AudioVisualization: React.FC<AudioVisualizationProps> = ({
    isVisible,
}) => {
    const [points, setPoints] = useState<number[]>(Array(10).fill(50));
    const [currentColor, setCurrentColor] = useState("rgba(255, 0, 0, 0.7)");
    const [viewBoxWidth, setViewBoxWidth] = useState(400);
    const timeRef = useRef(0);
    const colorTimeRef = useRef(0);
    const frequenciesRef = useRef<number[]>([]);
    const phasesRef = useRef<number[]>([]);
    const lastUpdateTimeRef = useRef(0);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        // Function to update viewBox based on actual width
        const updateViewBox = () => {
            if (svgRef.current) {
                const newWidth = svgRef.current.clientWidth;
                if (newWidth > 0) {
                    setViewBoxWidth(newWidth);
                }
            }
        };

        // Initial update
        updateViewBox();

        // Set up resize observer to handle container width changes
        const resizeObserver = new ResizeObserver(updateViewBox);
        resizeObserver.observe(svgRef.current);

        // Clean up
        return () => {
            if (svgRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                resizeObserver.unobserve(svgRef.current);
            }
        };
    }, [isVisible]);

    // Handle animation
    useEffect(() => {
        if (!isVisible) return;

        // Initialize random frequencies and phases
        frequenciesRef.current = Array(10)
            .fill(0)
            .map(() => 0.5 + Math.random() * 1.5);
        phasesRef.current = Array(10)
            .fill(0)
            .map(() => Math.random() * Math.PI * 2);

        // Reset animation time
        timeRef.current = 0;
        colorTimeRef.current = 0;
        lastUpdateTimeRef.current = performance.now();

        // Function to generate points based on time
        const generatePoints = (currentTime: number) => {
            const newPoints = [];

            for (let i = 0; i < 10; i++) {
                // Position factor makes middle points higher (bell curve)
                const positionFactor = 1 - Math.abs((i - 4.5) / 4.5);

                // Base height is higher in the middle
                const baseHeight = 5 + 40 * positionFactor;

                // Add sine wave oscillation based on time and randomized frequencies/phases
                const oscillation =
                    30 *
                    positionFactor *
                    Math.sin(
                        currentTime * frequenciesRef.current[i] +
                            phasesRef.current[i]
                    );

                // Calculate final point value
                newPoints.push(baseHeight + oscillation);
            }

            // Force edge points to be low
            newPoints[0] = newPoints[9] = 0;

            return newPoints;
        };

        const getColorFromTime = (time: number) => {
            const r = Math.sin(time * 0.3) * 127 + 128;
            const g = Math.sin(time * 0.6 + (Math.PI * 2) / 3) * 127 + 128;
            const b = Math.sin(time * 0.2 + (Math.PI * 4) / 3) * 127 + 128;
            return `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(
                b
            )}, 0.7)`;
        };

        let animationFrameId: number;

        // Animation loop
        const animate = (currentTime: number) => {
            // Calculate elapsed time since last update (in seconds)
            const elapsedTimeSec =
                (currentTime - lastUpdateTimeRef.current) / 1000;
            lastUpdateTimeRef.current = currentTime;

            // Increment animation time (at a consistent speed)
            timeRef.current += elapsedTimeSec * 5; // Control wave speed with this multiplier
            colorTimeRef.current += elapsedTimeSec * 1; // Slower color change
            setPoints(generatePoints(timeRef.current));
            setCurrentColor(getColorFromTime(colorTimeRef.current));
            animationFrameId = requestAnimationFrame(animate);
        };

        // Start animation
        animationFrameId = requestAnimationFrame(animate);

        // Clean up
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isVisible]);

    const createPathData = (): string => {
        if (!svgRef.current) return "";

        const width = viewBoxWidth;
        const segment = width / (points.length - 1);
        let path = `M 0,${100 - points[0]}`;
        const tension = 0.4;

        for (let i = 1; i < points.length; i++) {
            const x = i * segment;
            const y = 100 - points[i];
            const prevX = (i - 1) * segment;
            const prevY = 100 - points[i - 1];

            const cpX1 = prevX + segment * tension;
            const cpX2 = x - segment * tension;

            path += ` C ${cpX1},${prevY} ${cpX2},${y} ${x},${y}`;
        }

        path += ` L ${width},100 L 0,100 Z`;

        return path;
    };

    return (
        <div className="w-full mx-auto  overflow-hidden">
            <svg
                ref={svgRef}
                className="w-full"
                height={isVisible ? "25" : "0"}
                viewBox={`0 0 ${viewBoxWidth} 100`}
                preserveAspectRatio="none"
                style={{
                    transition: "height 0.3s ease, transform 0.3s ease",
                    transform: isVisible ? "translateY(0)" : "translateY(100%)",
                }}
            >
                <defs>
                    <linearGradient
                        id="waveGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor={currentColor} />
                        <stop
                            offset="100%"
                            stopColor="rgba(255, 255, 255, 0.3)"
                        />
                    </linearGradient>
                </defs>
                <path
                    d={createPathData()}
                    fill="url(#waveGradient)"
                    style={{ transition: "fill 1s ease" }}
                />
            </svg>
        </div>
    );
};

export default AudioVisualization;
