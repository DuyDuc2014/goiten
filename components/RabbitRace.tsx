import React, { useRef, useEffect, useCallback } from 'react';
import { WHEEL_COLORS } from '../constants';

interface RabbitRaceProps {
  students: string[];
  isRunning: boolean;
  onFinish: (winner: string) => void;
}

const RabbitRace: React.FC<RabbitRaceProps> = ({ students, isRunning, onFinish }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const positions = useRef<number[]>([]);
    const baseSpeeds = useRef<number[]>([]);
    const rabbitSVGs = useRef<HTMLImageElement[]>([]);
    const perspectiveFactor = 0.5; // How much perspective to apply (0 to 1)

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const numStudents = students.length;
        if (numStudents === 0) {
            ctx.clearRect(0, 0, width, height);
            return;
        }

        const horizonY = height * 0.4;
        const roadWidthBottom = width * 1.2; // A bit wider than the canvas for a full effect
        const roadWidthTop = width * 0.1;

        // 1. Draw grass background
        ctx.fillStyle = '#16a34a'; // green-600
        ctx.fillRect(0, 0, width, height);
        
        // 2. Draw road with perspective
        ctx.fillStyle = '#4b5563'; // gray-600
        ctx.beginPath();
        const roadLeftBottom = (width - roadWidthBottom) / 2;
        const roadRightBottom = roadLeftBottom + roadWidthBottom;
        const roadLeftTop = (width - roadWidthTop) / 2;
        const roadRightTop = roadLeftTop + roadWidthTop;
        ctx.moveTo(roadLeftTop, horizonY);
        ctx.lineTo(roadRightTop, horizonY);
        ctx.lineTo(roadRightBottom, height);
        ctx.lineTo(roadLeftBottom, height);
        ctx.closePath();
        ctx.fill();

        // 3. Draw converging lane lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 3;
        for (let i = 1; i < numStudents; i++) {
            const laneXBottom = roadLeftBottom + (roadWidthBottom / numStudents) * i;
            const laneXTop = roadLeftTop + (roadWidthTop / numStudents) * i;
            ctx.beginPath();
            ctx.moveTo(laneXTop, horizonY);
            ctx.lineTo(laneXBottom, height);
            ctx.stroke();
        }
        
        // Draw finish line with perspective
        const finishLineX = width - 80;
        ctx.save();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#ffffff';
        for (let i = 0; i < height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(finishLineX, i);
            ctx.lineTo(finishLineX, i + 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(finishLineX + 10, i + 10);
            ctx.lineTo(finishLineX + 10, i + 20);
            ctx.stroke();
        }
        ctx.restore();

        // Draw rabbits with perspective
        students.forEach((student, i) => {
            const yCenter = (height - horizonY) / numStudents * (i + 0.5) + horizonY;
            const scale = (yCenter / height) * (1 - perspectiveFactor) + perspectiveFactor;
            const rabbitSize = Math.min(height / (numStudents + 2), 80) * scale;
            
            const x = positions.current[i] || 20;

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8 * scale;
            ctx.shadowOffsetX = 3 * scale;
            ctx.shadowOffsetY = 3 * scale;

            const rabbitSVG = rabbitSVGs.current[i];
            if (rabbitSVG && rabbitSVG.complete) {
                // Draw with aspect ratio preserved
                const aspectRatio = rabbitSVG.width / rabbitSVG.height;
                const rabbitHeight = rabbitSize;
                const rabbitWidth = rabbitHeight * aspectRatio;
                ctx.drawImage(rabbitSVG, x, yCenter - rabbitHeight / 2, rabbitWidth, rabbitHeight);
            }
            ctx.restore();

            // Draw name
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = `bold ${14 * scale}px Roboto, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 5;
            ctx.fillText(student, x + rabbitSize * 1.2, yCenter);
            ctx.restore();
        });
    }, [students]);

    const race = useCallback(() => {
        if (!canvasRef.current) return;
        const finishLineX = canvasRef.current.width - 80;
        let winnerIndex = -1;

        for (let i = 0; i < students.length; i++) {
            if (positions.current[i] >= finishLineX) {
                winnerIndex = i;
                break;
            }
            // Start with the rabbit's inherent base speed
            let speed = baseSpeeds.current[i] || 1;

            // Add a chance for a sudden "burst" of speed, creating dramatic overtakes
            // There's a small (e.g., 5%) chance each frame for a rabbit to get a big boost.
            if (Math.random() < 0.05) {
                speed *= (1 + Math.random() * 2.5); // Boost up to 3.5x
            }

            positions.current[i] += speed;
        }

        draw();

        if (winnerIndex !== -1) {
            onFinish(students[winnerIndex]);
        } else {
            animationFrameId.current = requestAnimationFrame(race);
        }
    }, [students, onFinish, draw]);

    // Pre-render SVGs to colored images
    useEffect(() => {
        rabbitSVGs.current = students.map((_, i) => {
            const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
            const svgString = `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="grad-body" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:rgb(230,230,230);stop-opacity:1" />
                </radialGradient>
              </defs>
              <!-- Body -->
              <path d="M 50 60 C 25 60, 20 95, 50 95 C 80 95, 75 60, 50 60 Z" fill="url(#grad-body)" stroke="#D1D5DB" stroke-width="1"/>
              
              <!-- Head -->
              <circle cx="50" cy="45" r="25" fill="url(#grad-body)" stroke="#D1D5DB" stroke-width="1"/>
              
              <!-- Ears -->
              <path d="M 35 25 C 25 -5, 45 -5, 40 25 Z" fill="url(#grad-body)" stroke="#D1D5DB" stroke-width="1"/>
              <path d="M 35 23 C 30 5, 40 5, 38 23 Z" fill="#FBCFE8"/>
              <path d="M 65 25 C 55 -5, 75 -5, 70 25 Z" fill="url(#grad-body)" stroke="#D1D5DB" stroke-width="1"/>
              <path d="M 65 23 C 60 5, 70 5, 68 23 Z" fill="#FBCFE8"/>
              
              <!-- Paws -->
              <circle cx="30" cy="80" r="8" fill="url(#grad-body)" stroke="#D1D5DB" stroke-width="1"/>
              <circle cx="70" cy="80" r="8" fill="url(#grad-body)" stroke="#D1D5DB" stroke-width="1"/>
              <circle cx="30" cy="82" r="5" fill="#FBCFE8"/>
              <circle cx="70" cy="82" r="5" fill="#FBCFE8"/>

              <!-- Eyes -->
              <circle cx="42" cy="45" r="8" fill="#111827"/>
              <circle cx="58" cy="45" r="8" fill="#111827"/>
              <!-- Eye highlights -->
              <circle cx="40" cy="42" r="2.5" fill="white"/>
              <circle cx="56" cy="42" r="2.5" fill="white"/>
              
              <!-- Cheeks -->
              <circle cx="35" cy="52" r="5" fill="#FBCFE8" fill-opacity="0.7"/>
              <circle cx="65" cy="52" r="5" fill="#FBCFE8" fill-opacity="0.7"/>
              
              <!-- Nose and Mouth -->
              <path d="M 48 53 L 52 53 L 50 55 Z" fill="#F472B6"/>
              <path d="M 50 55 Q 48 58, 46 56" stroke="#F472B6" fill="none" stroke-width="1" stroke-linecap="round"/>
              <path d="M 50 55 Q 52 58, 54 56" stroke="#F472B6" fill="none" stroke-width="1" stroke-linecap="round"/>

              <!-- Bow Tie (This part will be colored) -->
              <g transform="translate(50, 62)">
                <path d="M 0 0 L -12 -8 L -12 8 Z" fill="${color}" stroke="#000" stroke-width="0.5" stroke-opacity="0.2"/>
                <path d="M 0 0 L 12 -8 L 12 8 Z" fill="${color}" stroke="#000" stroke-width="0.5" stroke-opacity="0.2"/>
                <circle cx="0" cy="0" r="4" fill="${color}" stroke="white" stroke-width="1"/>
              </g>
            </svg>
            `;
            const img = new Image();
            img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
            return img;
        });
        setTimeout(draw, 50);
    }, [students, draw]);


    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas && canvas.parentElement) {
                const { clientWidth, clientHeight } = canvas.parentElement;
                canvas.width = clientWidth;
                canvas.height = clientHeight;
                draw();
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [draw]);

    useEffect(() => {
        if (isRunning) {
            positions.current = new Array(students.length).fill(20);
            // Initialize base speeds for each rabbit, giving them a core pace
            // This creates a more significant and lasting difference between them.
            baseSpeeds.current = students.map(() => 0.8 + Math.random() * 1.5); // Base speed between 0.8 and 2.3
            
            animationFrameId.current = requestAnimationFrame(race);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isRunning, students, race]);

    return <canvas ref={canvasRef} className="w-full h-full rounded-2xl border-2 border-slate-700" />;
};

export default RabbitRace;