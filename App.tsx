import React, { useState, useEffect, useRef, useCallback } from 'react';
import Wheel from './components/Wheel';
import StudentList from './components/StudentList';
import WinnerDisplay from './components/WinnerDisplay';
import ClassManager from './components/ClassManager';
import { SparklesIcon } from './components/Icons';

// Allow TypeScript to recognize the globally available 'confetti' library
declare const confetti: any;

type AllClasses = { [className: string]: string[] };

const App: React.FC = () => {
  const [allClasses, setAllClasses] = useState<AllClasses>({});
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [highlightedStudent, setHighlightedStudent] = useState<string | null>(null);
  
  const spinningSoundRef = useRef<HTMLAudioElement | null>(null);
  const winningSoundRef = useRef<HTMLAudioElement | null>(null);

  // Load data from local storage on initial render
  useEffect(() => {
    try {
      const savedClasses = localStorage.getItem('luckyWheelClasses');
      const savedSelectedClass = localStorage.getItem('luckyWheelSelectedClass');
      
      let loadedClasses: AllClasses;
      if (savedClasses) {
        loadedClasses = JSON.parse(savedClasses);
      } else {
        // Default data for first-time users, migrating old data if present
        const oldStudents = localStorage.getItem('luckyWheelStudents');
        if (oldStudents) {
          loadedClasses = { 'Lớp Mặc Định': JSON.parse(oldStudents) };
          localStorage.removeItem('luckyWheelStudents'); // remove old data
        } else {
          loadedClasses = { 'Lớp 10A1': ['Sơn Tùng', 'Thiều Bảo Trâm', 'Hải Tú', 'Bích Phương', 'Hoàng Thùy Linh', 'Đen Vâu'] };
        }
      }
      setAllClasses(loadedClasses);

      const classNames = Object.keys(loadedClasses);
      // Determine the selected class safely.
      // Check if the previously selected class still exists.
      if (savedSelectedClass && Object.prototype.hasOwnProperty.call(loadedClasses, savedSelectedClass)) {
        setSelectedClass(savedSelectedClass);
      } else if (classNames.length > 0) {
        // If not, or if none was saved, select the first available class.
        setSelectedClass(classNames[0]);
      } else {
        // If there are no classes, ensure selectedClass is null.
        setSelectedClass(null);
      }

    } catch (error) {
      console.error("Failed to load data from local storage:", error);
       setAllClasses({ 'Lớp Mặc Định': [] });
       setSelectedClass('Lớp Mặc Định');
    }
    
    // Assign audio elements after component mounts
    spinningSoundRef.current = document.getElementById('spinning-sound') as HTMLAudioElement;
    winningSoundRef.current = document.getElementById('winning-sound') as HTMLAudioElement;

  }, []);

  // Save data to local storage whenever it changes
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

  const handleCreateClass = useCallback((newClassName: string) => {
    const trimmedName = newClassName.trim();
    if (!trimmedName) {
        return;
    }
    
    const isDuplicate = Object.keys(allClasses).some(
        (key) => key.toLowerCase() === trimmedName.toLowerCase()
    );

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

      if (!trimmedNewName) {
          return;
      }

      if (trimmedNewName === selectedClass) {
          return; // Name is unchanged
      }

      const isDuplicate = Object.keys(allClasses).some(
          key => key.toLowerCase() === trimmedNewName.toLowerCase() && key.toLowerCase() !== selectedClass.toLowerCase()
      );

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
              const newSelectedClass = remainingClasses.length > 0 ? remainingClasses[0] : null;
              
              setSelectedClass(newSelectedClass);

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

  const handleSpinClick = () => {
    if (students.length > 1 && !isSpinning) {
      setHighlightedStudent(null);
      setWinner(null);
      setIsSpinning(true);
      if (spinningSoundRef.current) {
        spinningSoundRef.current.loop = true;
        spinningSoundRef.current.currentTime = 0;
        spinningSoundRef.current.play();
      }
    }
  };

  const handleSpinFinish = (selectedWinner: string) => {
    setWinner(selectedWinner);
    setHighlightedStudent(selectedWinner);
    setIsSpinning(false);
    if (spinningSoundRef.current) {
        spinningSoundRef.current.loop = false;
        spinningSoundRef.current.pause();
        spinningSoundRef.current.currentTime = 0;
    }
    if (winningSoundRef.current) {
        winningSoundRef.current.play();
    }
  };

  const closeWinnerDisplay = () => {
    setWinner(null);
    // Keep the winner highlighted in the list
  };
  
  const triggerConfetti = () => {
    if (typeof confetti === 'undefined') {
        console.error('Confetti library is not loaded.');
        return;
    }
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <header className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 tracking-tight">
          Chiếc Nón Kỳ Diệu
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
            highlightedStudent={highlightedStudent}
            className={selectedClass}
          />
        </div>
        
        <div className="w-full lg:w-2/3 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-2xl aspect-square">
            <Wheel 
              students={students} 
              isSpinning={isSpinning} 
              onSpinFinish={handleSpinFinish}
              onHighlight={setHighlightedStudent}
              highlightedStudent={highlightedStudent} 
            />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 border-4 border-yellow-400 rounded-full shadow-lg z-20"></div>
             <div 
                className="absolute top-[-2%] left-1/2 -translate-x-1/2 w-0 h-0 z-10"
                style={{
                    borderLeft: '20px solid transparent',
                    borderRight: '20px solid transparent',
                    borderTop: '35px solid #facc15', // yellow-400
                }}
            ></div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSpinClick}
              disabled={isSpinning || students.length < 2}
              className="mt-8 flex items-center gap-3 px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              <SparklesIcon className="w-7 h-7" />
              {isSpinning ? 'Đang quay...' : 'Quay số'}
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
          {selectedClass && students.length < 2 && <p className="text-yellow-400 mt-4">Lớp này cần ít nhất 2 học sinh để quay.</p>}
          {!selectedClass && <p className="text-yellow-400 mt-4">Vui lòng tạo hoặc chọn một lớp để bắt đầu.</p>}
        </div>
      </main>

      {winner && <WinnerDisplay winner={winner} onClose={closeWinnerDisplay} />}
    </div>
  );
};

export default App;