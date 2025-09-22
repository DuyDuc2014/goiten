import React, { useRef, useEffect, useCallback } from 'react';
import { WHEEL_COLORS } from '../constants';

interface WheelProps {
  students: string[];
  isSpinning: boolean;
  onSpinFinish: (winner: string) => void;
  highlightedStudent: string | null;
}

const Wheel: React.FC<WheelProps> = ({ students, isSpinning, onSpinFinish, highlightedStudent }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinTime = useRef(0);
  const spinTimeTotal = useRef(0);
  const currentAngle = useRef(0);
  const startAngle = useRef(0); // The angle at the beginning of a spin
  const spinRotation = useRef(0); // The total amount of rotation for the current spin

  const getCurrentIndex = useCallback((angle: number) => {
      const numStudents = students.length;
      if (numStudents === 0) return -1;
      
      // Normalize angle to be between 0 and 2PI
      const normalizedAngle = (angle % (Math.PI * 2) + (Math.PI * 2)) % (Math.PI * 2);
      
      // The pointer is at the top (270 degrees or 1.5 * PI), so we adjust the angle
      // to make the winning segment align with angle 0.
      const winningAngle = (Math.PI * 1.5) - normalizedAngle;
      const positiveWinningAngle = (winningAngle + (Math.PI * 2)) % (Math.PI * 2);
      
      const arc = Math.PI * 2 / numStudents;
      return Math.floor(positiveWinningAngle / arc);
  }, [students]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numStudents = students.length;
    if (numStudents === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    const arc = Math.PI * 2 / numStudents;
    const radius = canvas.width / 2;
    const centerX = radius;
    const centerY = radius;

    // Determine which student to highlight
    let highlightedIndex = -1;
    if (isSpinning) {
        // During spin, calculate from current angle
        highlightedIndex = getCurrentIndex(currentAngle.current);
    } else if (highlightedStudent) {
        // When idle, find the index of the prop-defined winner
        highlightedIndex = students.indexOf(highlightedStudent);
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#334155'; // slate-700 for separation
    ctx.lineWidth = 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle.current);
    ctx.translate(-centerX, -centerY);

    for (let i = 0; i < numStudents; i++) {
      const angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // --- Draw student names on the wheel ---
      ctx.save();
      ctx.translate(centerX, centerY);
      const textAngle = angle + arc / 2;
      ctx.rotate(textAngle);
      
      const studentName = students[i];
      const isHighlighted = i === highlightedIndex;

      // --- Dynamic Text Sizing and Truncation Logic ---
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textRadius = radius * 0.7;
      const maxTextWidth = 2 * textRadius * Math.tan(arc / 2) - 15;
      
      let fontSize = 20;
      ctx.font = `900 ${fontSize}px Roboto, sans-serif`;

      while (ctx.measureText(studentName).width > maxTextWidth && fontSize > 8) {
        fontSize--;
        ctx.font = `900 ${fontSize}px Roboto, sans-serif`;
      }

      let displayName = studentName;
      if (ctx.measureText(displayName).width > maxTextWidth) {
        while (ctx.measureText(displayName + '…').width > maxTextWidth && displayName.length > 1) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '…';
      }

      const isFlipped = textAngle > Math.PI / 2 && textAngle < (3 * Math.PI) / 2;
      if (isFlipped) {
        ctx.rotate(Math.PI);
      }
      
      ctx.fillStyle = isHighlighted ? '#facc15' : 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = isHighlighted ? 5 : 4;
      ctx.lineJoin = 'round';

      ctx.strokeText(displayName, textRadius, 0);
      ctx.fillText(displayName, textRadius, 0);
      ctx.restore();
    }
    ctx.restore();
  }, [students, highlightedStudent, isSpinning, getCurrentIndex]);

  const easeOut = (t: number, b: number, c: number, d: number) => {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
  };

  const spin = useCallback(() => {
    spinTime.current += 16;
    
    if (spinTime.current >= spinTimeTotal.current) {
        currentAngle.current = startAngle.current + spinRotation.current;
        const finalIndex = getCurrentIndex(currentAngle.current);
        if (finalIndex !== -1) {
          onSpinFinish(students[finalIndex]);
        }
        return;
    }

    const easedSpin = easeOut(spinTime.current, 0, spinRotation.current, spinTimeTotal.current);
    currentAngle.current = startAngle.current + easedSpin;
    
    drawWheel();
    requestAnimationFrame(spin);
  }, [drawWheel, onSpinFinish, students, getCurrentIndex]);


  useEffect(() => {
    drawWheel();
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        const size = Math.min(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
        canvas.width = size;
        canvas.height = size;
        drawWheel();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  useEffect(() => {
    if (isSpinning) {
        spinTime.current = 0;
        spinTimeTotal.current = Math.random() * 4000 + 6000;
        startAngle.current = currentAngle.current;
        spinRotation.current = (Math.PI * 2 * (7 + Math.random() * 5));
        spin();
    }
  }, [isSpinning, spin]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default Wheel;