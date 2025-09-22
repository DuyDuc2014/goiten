import React, { useRef, useEffect, useCallback } from 'react';
import { WHEEL_COLORS } from '../constants';

interface WheelProps {
  students: string[];
  isSpinning: boolean;
  onSpinFinish: (winner: string) => void;
  onHighlight: (student: string) => void;
  highlightedStudent: string | null;
}

const Wheel: React.FC<WheelProps> = ({ students, isSpinning, onSpinFinish, onHighlight, highlightedStudent }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinTime = useRef(0);
  const spinTimeTotal = useRef(0);
  const currentAngle = useRef(0);
  const startAngle = useRef(0); // The angle at the beginning of a spin
  const spinRotation = useRef(0); // The total amount of rotation for the current spin

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numStudents = students.length;
    const arc = Math.PI * 2 / (numStudents || 1);
    const radius = canvas.width / 2;
    const centerX = radius;
    const centerY = radius;
    
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
      
      const isHighlighted = students[i] === highlightedStudent;

      // Dynamic styling for text for better readability
      let fontSize;
      if (numStudents <= 10) fontSize = 18;
      else if (numStudents <= 20) fontSize = 14;
      else if (numStudents <= 30) fontSize = 11;
      else fontSize = 9;
      
      ctx.font = `900 ${fontSize}px Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // --- Improved Truncation Logic ---
      let studentName = students[i];
      const maxWidth = radius * 0.65; 

      if (ctx.measureText(studentName).width > maxWidth) {
        while (ctx.measureText(studentName + '…').width > maxWidth && studentName.length > 1) {
          studentName = studentName.slice(0, -1);
        }
        studentName += '…';
      }

      // Orient text for readability by flipping it on the left side
      const isFlipped = textAngle > Math.PI / 2 && textAngle < (3 * Math.PI) / 2;
      if (isFlipped) {
        ctx.rotate(Math.PI);
      }

      // Add a stroke for better contrast and readability
      const textPosition = radius * 0.7;
      
      // Define styles based on highlight state
      ctx.fillStyle = isHighlighted ? '#facc15' : 'white'; // yellow-400
      ctx.strokeStyle = 'black';
      ctx.lineWidth = isHighlighted ? 5 : 4;
      ctx.lineJoin = 'round';


      // Draw stroke behind the fill for a crisp outline
      ctx.strokeText(studentName, textPosition, 0);
      ctx.fillText(studentName, textPosition, 0);
      ctx.restore();
    }
    ctx.restore();
  }, [students, highlightedStudent]);

  const easeOut = (t: number, b: number, c: number, d: number) => {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc * ts + -5 * ts * ts + 10 * tc + -10 * ts + 5 * t);
  };
  
  const getCurrentIndex = (angle: number) => {
      const numStudents = students.length;
      if (numStudents === 0) return -1;
      
      const degrees = (angle * 180 / Math.PI) % 360;
      // The pointer is at 270 degrees (top of the circle).
      const winningAngle = (270 - degrees + 360) % 360;
      const arcDegrees = 360 / numStudents;
      return Math.floor(winningAngle / arcDegrees);
  };

  const spin = useCallback(() => {
    spinTime.current += 16; // Roughly 60fps
    
    if (spinTime.current >= spinTimeTotal.current) {
        // Set to the exact final angle to prevent slight inaccuracies
        currentAngle.current = startAngle.current + spinRotation.current;
        const finalIndex = getCurrentIndex(currentAngle.current);
        if (finalIndex !== -1) {
          onSpinFinish(students[finalIndex]);
        }
        return;
    }

    const easedSpin = easeOut(spinTime.current, 0, spinRotation.current, spinTimeTotal.current);
    currentAngle.current = startAngle.current + easedSpin;
    
    const currentIndex = getCurrentIndex(currentAngle.current);
    if(currentIndex !== -1 && students[currentIndex]) {
        onHighlight(students[currentIndex]);
    }
    
    drawWheel();
    window.requestAnimationFrame(spin);
  }, [drawWheel, onSpinFinish, students, onHighlight]);


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
        spinTimeTotal.current = Math.random() * 3000 + 5000; // 5-8 seconds
        startAngle.current = currentAngle.current;
        // Calculate a new random rotation amount. 
        // Add at least 5 full rotations plus a random partial rotation for a good spin.
        spinRotation.current = (Math.PI * 2 * (5 + Math.random() * 5));
        spin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default Wheel;