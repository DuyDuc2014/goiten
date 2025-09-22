import React, { useState, useEffect, useRef, useCallback } from 'react';
import Wheel from './components/Wheel';
import StudentList from './components/StudentList';
import WinnerDisplay from './components/WinnerDisplay';
import ClassManager from './components/ClassManager';
import { SparklesIcon, RabbitIcon, WheelIcon as WheelModeIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './components/Icons';
import RabbitRace from './components/RabbitRace';

// Allow TypeScript to recognize the globally available 'confetti' library
declare const confetti: any;

type AllClasses = { [className: string]: string[] };

const App: React.FC = () => {
  const [allClasses, setAllClasses] = useState<AllClasses>({});
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [highlightedStudentOnWheel, setHighlightedStudentOnWheel] = useState<string | null>(null);
  const [highlightedStudentOnList, setHighlightedStudentOnList] = useState<string | null>(null);
  const [mode, setMode] = useState<'wheel' | 'race'>('wheel');
  const [isMuted, setIsMuted] = useState(false);
  
  const spinningSoundRef = useRef<HTMLAudioElement | null>(null);
  const winningSoundRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const raceMusicRef = useRef<HTMLAudioElement | null>(null);

  // Load data from local storage on initial render
  useEffect(() => {
    try {
      const savedClasses = localStorage.getItem('luckyWheelClasses');
      const savedSelectedClass = localStorage.getItem('luckyWheelSelectedClass');
      
      let loadedClasses: AllClasses;
      if (savedClasses) {
        loadedClasses = JSON.parse(savedClasses);
      } else {
        const oldStudents = localStorage.getItem('luckyWheelStudents');
        if (oldStudents) {
          loadedClasses = { 'Lớp Mặc Định': JSON.parse(oldStudents) };
          localStorage.removeItem('luckyWheelStudents');
        } else {
          loadedClasses = { 'Lớp 10A1': ['Sơn Tùng', 'Thiều Bảo Trâm', 'Hải Tú', 'Bích Phương', 'Hoàng Thùy Linh', 'Đen Vâu'] };
        }
      }
      setAllClasses(loadedClasses);

      const classNames = Object.keys(loadedClasses);
      if (savedSelectedClass && Object.prototype.hasOwnProperty.call(loadedClasses, savedSelectedClass)) {
        setSelectedClass(savedSelectedClass);
      } else if (classNames.length > 0) {
        setSelectedClass(classNames[0]);
      } else {
        setSelectedClass(null);
      }

    } catch (error) {
      console.error("Failed to load data from local storage:", error);
       setAllClasses({ 'Lớp Mặc Định': [] });
       setSelectedClass('Lớp Mặc Định');
    }
    
    spinningSoundRef.current = document.getElementById('spinning-sound') as HTMLAudioElement;
    winningSoundRef.current = document.getElementById('winning-sound') as HTMLAudioElement;
    backgroundMusicRef.current = document.getElementById('background-music') as HTMLAudioElement;
    raceMusicRef.current = document.getElementById('race-music') as HTMLAudioElement;

    if (backgroundMusicRef.current) {
        backgroundMusicRef.current.volume = 0.3;
        backgroundMusicRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('luckyWheelClasses', JSON.stringify(allClasses));
      if (selectedClass) {
        localStorage.setItem('luckyWheelSelectedClass', selectedClass);
      } else {
        localStorage.removeItem('luckyWheelSelectedClass');
      }
    } catch (error) {
      console.error("Failed to save data to local storage:", error);
    }
  }, [allClasses, selectedClass]);

  useEffect(() => {
    const allAudio = [spinningSoundRef.current, winningSoundRef.current, backgroundMusicRef.current, raceMusicRef.current];
    allAudio.forEach(audio => {
      if (audio) audio.muted = isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    const bgMusic = backgroundMusicRef.current;
    const raceMusic = raceMusicRef.current;
    if (!bgMusic || !raceMusic || isRunning) return;

    if (mode === 'race') {
      bgMusic.pause();
      raceMusic.currentTime = 0;
      raceMusic.volume = 0.5;
      raceMusic.play().catch(() => {});
    } else {
      raceMusic.pause();
      bgMusic.currentTime = 0;
      bgMusic.volume = 0.3;
      bgMusic.play().catch(() => {});
    }
  }, [mode, isRunning]);

  const handleCreateClass = useCallback((newClassName: string) => {
    const trimmedName = newClassName.trim();
    if (!trimmedName) return;
    const isDuplicate = Object.keys(allClasses).some(key => key.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
        alert("Tên lớp đã tồn tại. Vui lòng chọn tên khác.");
        return;
    }
    setAllClasses(prev => ({ ...prev, [trimmedName]: [] }));
    setSelectedClass(trimmedName);
  }, [allClasses]);

  const handleRenameClass = useCallback((newName: string) => {
      if (!selectedClass) return;
      const trimmedNewName = newName.trim();
      if (!trimmedNewName) return;
      if (trimmedNewName.toLowerCase() === selectedClass.toLowerCase()) return;
      const isDuplicate = Object.keys(allClasses).some(key => key.toLowerCase() === trimmedNewName.toLowerCase());
      if (isDuplicate) {
          alert("Tên lớp đã tồn tại. Vui lòng chọn tên khác.");
          return;
      }
      setAllClasses(prev => {
          const updatedClasses = { ...prev };
          const students = updatedClasses[selectedClass];
          delete updatedClasses[selectedClass];
          updatedClasses[trimmedNewName] = students;
          return updatedClasses;
      });
      setSelectedClass(trimmedNewName);
  }, [allClasses, selectedClass]);

  const handleDeleteClass = useCallback(() => {
      if (!selectedClass) return;
      if (confirm(`Bạn có chắc chắn muốn xóa lớp "${selectedClass}" không? Hành động này không thể hoàn tác.`)) {
          setAllClasses(prevClasses => {
              const updatedClasses = { ...prevClasses };
              delete updatedClasses[selectedClass];
              const remainingClasses = Object.keys(updatedClasses);
              setSelectedClass(remainingClasses.length > 0 ? remainingClasses[0] : null);
              return updatedClasses;
          });
      }
  }, [selectedClass]);

  const updateStudentsForCurrentClass = useCallback((newStudents: string[]) => {
    if (selectedClass) {
        setAllClasses(prev => ({ ...prev, [selectedClass]: newStudents }));
    }
  }, [selectedClass]);

  const students = selectedClass ? allClasses[selectedClass] || [] : [];

  const handleStartClick = () => {
    if (students.length > 1 && !isRunning) {
      setHighlightedStudentOnList(null);
      if (mode === 'wheel') setHighlightedStudentOnWheel(null);
      setWinner(null);
      setIsRunning(true);
      
      if (mode === 'wheel') {
        backgroundMusicRef.current?.pause();
        if (spinningSoundRef.current) {
          spinningSoundRef.current.loop = true;
          spinningSoundRef.current.currentTime = 0;
          spinningSoundRef.current.play();
        }
      }
    }
  };

  const handleFinish = (selectedWinner: string) => {
    setWinner(selectedWinner);
    if (mode === 'wheel') setHighlightedStudentOnWheel(selectedWinner);
    setHighlightedStudentOnList(selectedWinner);
    setIsRunning(false);

    if (mode === 'wheel') spinningSoundRef.current?.pause();
    else raceMusicRef.current?.pause();
    
    winningSoundRef.current?.play();
  };

  const closeWinnerDisplay = () => {
    setWinner(null);
  };
  
  const triggerConfetti = () => {
    if (typeof confetti === 'undefined') return;
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const toggleMode = () => {
    if (!isRunning) setMode(prevMode => prevMode === 'wheel' ? 'race' : 'wheel');
  };

  const toggleMute = () => setIsMuted(prev => !prev);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 p-4 sm:p-6 lg:p-8 flex flex-col items-center relative">
       <div className="absolute top-4 right-4 z-50">
          <button onClick={toggleMute} className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/70 transition-colors" aria-label="Tắt/Mở âm thanh">
              {isMuted ? <SpeakerXMarkIcon className="w-6 h-6 text-slate-400" /> : <SpeakerWaveIcon className="w-6 h-6 text-slate-200" />}
          </button>
      </div>
      <header className="text-center mb-6">
        <h1 
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 tracking-tight"
          style={{ backgroundSize: '200% auto', animation: 'gradient-pan 10s linear infinite' }}
        >
          {mode === 'wheel' ? 'Vòng Quay Nhân Phẩm' : 'Đường Đua Thỏ'}
        </h1>
        <p className="text-indigo-300 mt-2 text-lg">Gọi tên học sinh may mắn</p>
      </header>
      
      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/3 bg-slate-800/50 rounded-2xl shadow-lg p-6 border border-slate-700 flex flex-col">
          <ClassManager 
            allClasses={allClasses}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            onCreateClass={handleCreateClass}
            onRenameClass={handleRenameClass}
            onDeleteClass={handleDeleteClass}
          />
          <hr className="border-slate-700 my-4" />
          <StudentList 
            students={students} 
            setStudents={updateStudentsForCurrentClass} 
            highlightedStudent={highlightedStudentOnList}
            className={selectedClass}
          />
        </div>
        
        <div className="w-full lg:w-2/3 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-2xl aspect-square">
            {mode === 'wheel' ? (
                <>
                    <Wheel 
                      students={students} 
                      isSpinning={isRunning} 
                      onSpinFinish={handleFinish}
                      highlightedStudent={highlightedStudentOnWheel} 
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 border-4 border-yellow-400 rounded-full shadow-lg z-20"></div>
                    <div 
                        className="absolute top-[-2%] left-1/2 -translate-x-1/2 w-0 h-0 z-10"
                        style={{
                            borderLeft: '20px solid transparent',
                            borderRight: '20px solid transparent',
                            borderTop: '35px solid #facc15',
                        }}
                    ></div>
                </>
            ) : (
                <RabbitRace
                    students={students}
                    isRunning={isRunning}
                    onFinish={handleFinish}
                />
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMode}
              disabled={isRunning}
              className="mt-8 p-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-2xl rounded-full shadow-lg hover:scale-110 hover:rotate-12 transform transition-all duration-300 ease-in-out disabled:opacity-50"
              aria-label="Đổi chế độ"
              title={mode === 'wheel' ? "Chuyển sang Đường Đua Thỏ" : "Chuyển sang Vòng Quay"}
            >
              {mode === 'wheel' ? <RabbitIcon className="w-7 h-7" /> : <WheelModeIcon className="w-7 h-7" />}
            </button>
            <button
              onClick={handleStartClick}
              disabled={isRunning || students.length < 2}
              className="mt-8 flex items-center gap-3 px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              <SparklesIcon className="w-7 h-7" />
              {isRunning ? (mode === 'wheel' ? 'Đang quay...' : 'Đang đua...') : (mode === 'wheel' ? 'Quay số' : 'Bắt đầu đua')}
            </button>
            <button
              onClick={triggerConfetti}
              className="mt-8 p-4 bg-yellow-400 hover:bg-yellow-500 text-2xl rounded-full shadow-lg hover:scale-110 transform transition-transform duration-300 ease-in-out"
              aria-label="Tung hoa"
              title="Tung hoa!"
            >
              🎉
            </button>
          </div>
          {selectedClass && students.length < 2 && <p className="text-yellow-400 mt-4">Lớp này cần ít nhất 2 học sinh để bắt đầu.</p>}
          {!selectedClass && <p className="text-yellow-400 mt-4">Vui lòng tạo hoặc chọn một lớp để bắt đầu.</p>}
        </div>
      </main>

      {winner && <WinnerDisplay winner={winner} onClose={closeWinnerDisplay} />}
    </div>
  );
};

export default App;