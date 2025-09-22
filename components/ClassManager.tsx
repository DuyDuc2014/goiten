
import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, UserPlusIcon } from './Icons';

type AllClasses = { [className: string]: string[] };

interface ClassManagerProps {
    allClasses: AllClasses;
    selectedClass: string | null;
    setSelectedClass: (className: string | null) => void;
    onCreateClass: (name: string) => void;
    onRenameClass: (name: string) => void;
    onDeleteClass: () => void;
}

const ClassManager: React.FC<ClassManagerProps> = ({ 
    allClasses, 
    selectedClass, 
    setSelectedClass,
    onCreateClass,
    onRenameClass,
    onDeleteClass
}) => {
    
    const [modalMode, setModalMode] = useState<'create' | 'rename' | null>(null);
    const [classNameInput, setClassNameInput] = useState('');

    const classNames = Object.keys(allClasses);

    useEffect(() => {
        if (modalMode === 'rename') {
            setClassNameInput(selectedClass || '');
        }
    }, [selectedClass, modalMode]);

    const handleOpenModal = (mode: 'create' | 'rename') => {
        setModalMode(mode);
        setClassNameInput(mode === 'rename' ? selectedClass || '' : '');
    };

    const handleCloseModal = () => {
        setModalMode(null);
        setClassNameInput('');
    };

    const handleSave = () => {
        if (modalMode === 'create') {
            onCreateClass(classNameInput);
        } else if (modalMode === 'rename') {
            onRenameClass(classNameInput);
        }
        handleCloseModal();
    };

    const modalTitle = modalMode === 'create' ? 'Tạo lớp mới' : 'Đổi tên lớp';
    const modalButtonText = modalMode === 'create' ? 'Tạo lớp' : 'Lưu thay đổi';

    return (
        <div>
            <label htmlFor="class-select" className="block mb-2 text-sm font-medium text-slate-300">Chọn lớp:</label>
            <select
                id="class-select"
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(e.target.value || null)}
                className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
            >
                {classNames.length === 0 ? (
                     <option value="" disabled>Chưa có lớp nào</option>
                ) : (
                    classNames.map(name => <option key={name} value={name}>{name}</option>)
                )}
            </select>

            <div className="grid grid-cols-3 gap-2 mt-4">
                <button onClick={() => handleOpenModal('create')} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm">
                    <UserPlusIcon className="w-5 h-5"/>
                    <span>Tạo</span>
                </button>
                <button onClick={() => handleOpenModal('rename')} disabled={!selectedClass} className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    <PencilIcon className="w-5 h-5"/>
                    <span>Đổi tên</span>
                </button>
                <button onClick={onDeleteClass} disabled={!selectedClass} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                     <TrashIcon className="w-5 h-5"/>
                    <span>Xóa</span>
                </button>
            </div>

            {modalMode && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-slate-800 rounded-lg p-6 w-full max-w-sm mx-4 shadow-lg border border-slate-700">
                        <h3 className="text-xl font-bold mb-4">{modalTitle}</h3>
                        <input
                            type="text"
                            value={classNameInput}
                            onChange={(e) => setClassNameInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Nhập tên lớp..."
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <div className="flex justify-end gap-4 mt-4">
                            <button
                                onClick={handleCloseModal}
                                className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors font-semibold"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
                            >
                                {modalButtonText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassManager;
