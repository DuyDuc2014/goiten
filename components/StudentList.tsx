
import React, { useState, useRef, useEffect } from 'react';
import { UserPlusIcon, TrashIcon, UploadIcon, UserGroupIcon, ClipboardIcon } from './Icons';

interface StudentListProps {
  students: string[];
  setStudents: (students: string[]) => void;
  highlightedStudent: string | null;
  className: string | null;
}

const StudentList: React.FC<StudentListProps> = ({ students, setStudents, highlightedStudent, className }) => {
  const [newStudent, setNewStudent] = useState<string>('');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (highlightedStudent && listRef.current) {
      const highlightedElement = listRef.current.querySelector(`[data-student-name="${highlightedStudent}"]`) as HTMLLIElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [highlightedStudent]);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.trim() && !students.includes(newStudent.trim())) {
      setStudents([...students, newStudent.trim()]);
      setNewStudent('');
    }
  };

  const handleRemoveStudent = (studentToRemove: string) => {
    setStudents(students.filter(s => s !== studentToRemove));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const names = text.split(/[\n\r]+/).map(name => name.trim()).filter(name => name.length > 0);
        const uniqueNames = Array.from(new Set([...students, ...names]));
        setStudents(uniqueNames);
      };
      reader.readAsText(file);
    }
    // Reset file input to allow uploading the same file again
    if (event.target) {
        event.target.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handlePasteSubmit = () => {
    const names = pastedText.split(/[\n\r]+/).map(name => name.trim()).filter(name => name.length > 0);
    const uniqueNames = Array.from(new Set([...students, ...names]));
    if (uniqueNames.length > 0) {
      setStudents(uniqueNames);
    }
    setIsPasteModalOpen(false);
    setPastedText('');
  };

  const isControlsDisabled = !className;

  return (
    <div className="flex flex-col h-full flex-grow">
      <h2 className="text-2xl font-bold text-center mb-4 flex items-center justify-center gap-2 truncate">
        <UserGroupIcon className="w-7 h-7 flex-shrink-0" />
        <span className="truncate">{className ? `Danh sách ${className}` : 'Chưa chọn lớp'}</span>
      </h2>

      <form onSubmit={handleAddStudent} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newStudent}
          onChange={(e) => setNewStudent(e.target.value)}
          placeholder={isControlsDisabled ? "Vui lòng chọn lớp" : "Thêm tên học sinh..."}
          className="flex-grow bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          disabled={isControlsDisabled}
        />
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isControlsDisabled}>
          <UserPlusIcon className="w-6 h-6" />
        </button>
      </form>

      <div className="flex-grow bg-slate-900/50 rounded-lg p-2 overflow-y-auto min-h-[200px] lg:max-h-[50vh] border border-slate-700 scroll-smooth">
        {!className ? (
          <p className="text-slate-400 text-center p-4">Vui lòng chọn một lớp để xem danh sách học sinh.</p>
        ) : students.length === 0 ? (
          <p className="text-slate-400 text-center p-4">Lớp này chưa có học sinh nào. Hãy thêm vào nhé!</p>
        ) : (
          <ul ref={listRef} className="space-y-2">
            {students.map((student, index) => {
              const isHighlighted = student === highlightedStudent;
              return (
                <li 
                  key={index}
                  data-student-name={student}
                  className={`flex items-center justify-between p-2 rounded-md transition-all duration-200 ease-in-out ${isHighlighted ? 'bg-yellow-400 text-slate-900 font-bold scale-105 shadow-lg' : 'bg-slate-800 hover:bg-slate-700 hover:scale-[1.02]'}`}
                >
                  <span className="flex-grow truncate text-slate-200" title={student}>{student}</span>
                  <button onClick={() => handleRemoveStudent(student)} className={`p-1 rounded-full flex-shrink-0 ml-2 ${isHighlighted ? 'text-red-600 hover:bg-white/30' : 'text-red-400 hover:text-red-500 hover:bg-slate-700'}`}>
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="file"
          accept=".txt"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          disabled={isControlsDisabled}
        />
        <button
          onClick={triggerFileUpload}
          disabled={isControlsDisabled}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UploadIcon className="w-5 h-5" />
          Tải lên .txt
        </button>
        <button
          onClick={() => setIsPasteModalOpen(true)}
          disabled={isControlsDisabled}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ClipboardIcon className="w-5 h-5" />
          Dán
        </button>
        <button
          onClick={() => setStudents([])}
          disabled={isControlsDisabled || students.length === 0}
          className="sm:col-span-3 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrashIcon className="w-5 h-5" />
          Xóa tất cả
        </button>
      </div>
      
      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-lg border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Dán danh sách học sinh</h3>
            <p className="text-slate-400 mb-4">Dán danh sách của bạn vào ô bên dưới. Mỗi tên trên một dòng.</p>
            <textarea
              className="w-full h-48 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Sơn Tùng M-TP&#10;Hải Tú&#10;Thiều Bảo Trâm..."
              autoFocus
            />
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => { setIsPasteModalOpen(false); setPastedText(''); }}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handlePasteSubmit}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
              >
                Thêm vào lớp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;