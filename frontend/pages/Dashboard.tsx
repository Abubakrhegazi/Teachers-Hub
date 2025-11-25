import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserType, Report as ReportType, Homework as HomeworkType } from '../types';
import { Card } from '../components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { BookOpen, FileText, Mic, MessageSquare, Trash2, PlusCircle, X, Check, Voicemail, AudioLines, Square, Undo2 } from 'lucide-react';

// --- Add Comment Modal ---
interface AddCommentModalProps {
    homeworkId: string;
    onClose: () => void;
}

const AddCommentModal: React.FC<AddCommentModalProps> = ({ homeworkId, onClose }) => {
    const { currentUser, addHomeworkComment } = useAppContext();
    const [commentType, setCommentType] = useState<'text' | 'voice'>('text');
    const [textContent, setTextContent] = useState('');
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'recorded'>('idle');
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioURL(audioUrl);
                setRecordingStatus('recorded');
                audioChunksRef.current = [];
                // Stop all tracks to turn off the microphone indicator
                stream.getTracks().forEach(track => track.stop());
            };
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setRecordingStatus('recording');
            // FIX: Corrected a typo in the catch block syntax from `catch (err)_` to `catch (err)`.
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please ensure permission is granted.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const resetRecording = () => {
        setAudioURL(null);
        setRecordingStatus('idle');
    }

    const handleSaveComment = async () => {
        if (!currentUser) return;

        try {
            setSaving(true);
            if (commentType === 'text' && textContent.trim()) {
                await addHomeworkComment(homeworkId, {
                    teacherId: currentUser.id,
                    type: 'text',
                    content: textContent.trim(),
                });
                onClose();
            } else if (commentType === 'voice' && audioURL) {
                await addHomeworkComment(homeworkId, {
                    teacherId: currentUser.id,
                    type: 'voice',
                    content: audioURL,
                });
                onClose();
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save comment. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const isSaveDisabled = (commentType === 'text' && !textContent.trim()) || (commentType === 'voice' && recordingStatus !== 'recorded');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Add Teacher Comment</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                </div>

                <div className="mb-4 border-b">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setCommentType('text')} className={`py-3 px-1 border-b-2 font-medium text-sm ${commentType === 'text' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Text Comment
                        </button>
                        <button onClick={() => setCommentType('voice')} className={`py-3 px-1 border-b-2 font-medium text-sm ${commentType === 'voice' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Voice Comment
                        </button>
                    </nav>
                </div>

                {commentType === 'text' ? (
                    <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Type your feedback here..." rows={5} className="w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"></textarea>
                ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg space-y-4">
                        {recordingStatus === 'idle' && (
                            <button onClick={handleStartRecording} className="flex items-center justify-center w-20 h-20 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg">
                                <Mic size={32} />
                            </button>
                        )}
                        {recordingStatus === 'recording' && (
                            <button onClick={handleStopRecording} className="flex items-center justify-center w-20 h-20 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-all shadow-lg animate-pulse">
                                <Square size={28} />
                            </button>
                        )}
                        {recordingStatus === 'recorded' && audioURL && (
                            <div className="w-full space-y-3 text-center">
                                <AudioLines className="mx-auto text-primary-500" size={40} />
                                <p className="font-semibold">Recording Complete</p>
                                <audio src={audioURL} controls className="w-full" />
                                <button onClick={resetRecording} className="text-sm text-white-600 hover:text-primary-600 flex items-center mx-auto"><Undo2 size={14} className="mr-1" /> Record Again</button>
                            </div>
                        )}
                        <p className="text-sm text-gray-500">
                            {recordingStatus === 'idle' && 'Click the mic to start recording.'}
                            {recordingStatus === 'recording' && 'Recording... Click to stop.'}
                            {recordingStatus === 'recorded' && 'Preview your recording above.'}
                        </p>
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveComment} disabled={isSaveDisabled} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">
                        Save Comment
                    </button>
                </div>
            </Card>
        </div>
    );
};

// --- Add Report Modal ---
interface AddReportModalProps {
    studentId: string;
    onClose: () => void;
}

const AddReportModal: React.FC<AddReportModalProps> = ({ studentId, onClose }) => {
    const { currentUser, addReport } = useAppContext();
    const [reportType, setReportType] = useState<'text' | 'voice'>('text');
    const [textContent, setTextContent] = useState('');
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'recorded'>('idle');
    const [audioURL, setAudioURL] = useState<string | null>(null);
    
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioURL(audioUrl);
                setRecordingStatus('recorded');
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
            };
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setRecordingStatus('recording');
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please ensure permission is granted.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const resetRecording = () => {
        setAudioURL(null);
        setRecordingStatus('idle');
    };

    const handleSaveReport = async () => {
        if (!currentUser) return;
        setSaving(true);
        setError(null);
        const newReportBase = {
            studentId,
            teacherId: currentUser.id,
            date: new Date().toISOString().split('T')[0],
        };

        try {
            if (reportType === 'text' && textContent.trim()) {
                await addReport({ ...newReportBase, type: 'text', content: textContent.trim() });
                onClose();
            } else if (reportType === 'voice' && audioURL) {
                await addReport({ ...newReportBase, type: 'voice', content: audioURL });
                onClose();
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save report. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const isSaveDisabled = saving || (reportType === 'text' && !textContent.trim()) || (reportType === 'voice' && recordingStatus !== 'recorded');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Add Progress Report</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                </div>
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                        {error}
                    </div>
                )}
                <div className="mb-4 border-b">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setReportType('text')} className={`py-3 px-1 border-b-2 font-medium text-sm ${reportType === 'text' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Text Report
                        </button>
                        <button onClick={() => setReportType('voice')} className={`py-3 px-1 border-b-2 font-medium text-sm ${reportType === 'voice' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Voice Report
                        </button>
                    </nav>
                </div>
                {reportType === 'text' ? (
                    <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Type your report here..." rows={5} className="w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"></textarea>
                ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg space-y-4">
                        {recordingStatus === 'idle' && (<button onClick={handleStartRecording} className="flex items-center justify-center w-20 h-20 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"><Mic size={32} /></button>)}
                        {recordingStatus === 'recording' && (<button onClick={handleStopRecording} className="flex items-center justify-center w-20 h-20 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-all shadow-lg animate-pulse"><Square size={28} /></button>)}
                        {recordingStatus === 'recorded' && audioURL && (
                            <div className="w-full space-y-3 text-center">
                                <AudioLines className="mx-auto text-primary-500" size={40} />
                                <p className="font-semibold">Recording Complete</p>
                                <audio src={audioURL} controls className="w-full" />
                                <button onClick={resetRecording} className="text-sm text-white-600 hover:text-primary-600 flex items-center mx-auto"><Undo2 size={14} className="mr-1" /> Record Again</button>
                            </div>
                        )}
                        <p className="text-sm text-gray-500">
                            {recordingStatus === 'idle' && 'Click the mic to start recording.'}
                            {recordingStatus === 'recording' && 'Recording... Click to stop.'}
                            {recordingStatus === 'recorded' && 'Preview your recording above.'}
                        </p>
                    </div>
                )}
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveReport} disabled={isSaveDisabled} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">
                        {saving ? 'Saving...' : 'Save Report'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

// --- Add Homework Modal ---
const AddHomeworkModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { currentUser, chapters, addHomework } = useAppContext();
    const [chapter, setChapter] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        const firstAvailableChapter = chapters.find(c => c.status === 'in-progress' || c.status === 'pending');
        if (firstAvailableChapter) {
            setChapter(firstAvailableChapter.title);
        } else if (chapters.length > 0) {
            setChapter(chapters[0].title);
        }
    }, [chapters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !chapter || !content.trim()) return;
        setSubmitting(true);
        setError(null);
        try {
            await addHomework({
                studentId: currentUser.id,
                chapter,
                content: content.trim(),
                submissionDate: new Date().toISOString().split('T')[0],
            });
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to submit homework. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const isSubmitDisabled = submitting || !chapter || !content.trim();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Submit Homework</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                            {error}
                        </div>
                    )}
                    <div>
                        <label htmlFor="chapter" className="block text-sm font-medium text-gray-700">Chapter</label>
                        <select id="chapter" value={chapter} onChange={(e) => setChapter(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                            <option value="" disabled>Select a chapter</option>
                            {chapters.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">Submission Content</label>
                        <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type your submission details here..." rows={6} className="mt-1 w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"></textarea>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isSubmitDisabled} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">
                            {submitting ? 'Submitting...' : 'Submit Homework'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// --- Main Dashboard Components ---

const StudentParentDashboard: React.FC = () => {
    const { currentUser, reports, homeworks, chapters } = useAppContext();
    const studentId = currentUser?.type === UserType.Parent ? currentUser.studentId : currentUser?.id;
    const student = useAppContext().users.find(u => u.id === studentId);
    const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);

    const myReports = reports.filter(r => r.studentId === studentId);
    const myHomeworks = homeworks.filter(h => h.studentId === studentId);

    const progressData = [
        { name: 'Completed', value: chapters.filter(c => c.status === 'completed').length },
        { name: 'In Progress', value: chapters.filter(c => c.status === 'in-progress').length },
        { name: 'Pending', value: chapters.filter(c => c.status === 'pending').length },
    ];
    const COLORS = ['#4ade80', '#facc15', '#d1d5db'];

    if (!student) return <p>Student not found.</p>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white-800">Welcome, {currentUser?.name}</h1>
            <p className="text-lg text-white-600">Here's the progress overview for {student.name}.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Course Progress</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={progressData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                {progressData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Reports</h2>
                    <div className="space-y-4 max-h-72 overflow-y-auto">
                        {myReports.length > 0 ? myReports.map(report => <Report key={report.id} report={report} />) : <p className="text-gray-500">No reports yet.</p>}
                    </div>
                </Card>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">Homework Submissions</h2>
                    {currentUser?.type === UserType.Student && (
                        <button onClick={() => setIsHomeworkModalOpen(true)} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 flex items-center">
                            <PlusCircle size={16} className="mr-2" /> Submit Homework
                        </button>
                    )}
                </div>
                <div className="space-y-4">
                    {myHomeworks.length > 0 ? myHomeworks.map(hw => <Homework key={hw.id} homework={hw} />) : <p className="text-gray-500">No homework submitted yet.</p>}
                </div>
            </Card>
            {isHomeworkModalOpen && <AddHomeworkModal onClose={() => setIsHomeworkModalOpen(false)} />}
        </div>
    );
};

const TeacherDashboard: React.FC = () => {
    const { users, reports, homeworks, deleteHomework, deleteReport } = useAppContext();
    const students = useMemo(() => users.filter(u => u.type === UserType.Student), [users]);
    const [searchDraft, setSearchDraft] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        const term = searchQuery.toLowerCase();
        return students.filter(student =>
            student.name.toLowerCase().includes(term) ||
            student.email.toLowerCase().includes(term)
        );
    }, [students, searchQuery]);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedStudentIdForReport, setSelectedStudentIdForReport] = useState<string | null>(null);

    const handleOpenCommentModal = (homeworkId: string) => {
        setSelectedHomeworkId(homeworkId);
        setIsCommentModalOpen(true);
    };

    const handleCloseCommentModal = () => {
        setSelectedHomeworkId(null);
        setIsCommentModalOpen(false);
    };

    const openReportModal = (studentId: string) => {
        setSelectedStudentIdForReport(studentId);
        setIsReportModalOpen(true);
    };

    const closeReportModal = () => {
        setSelectedStudentIdForReport(null);
        setIsReportModalOpen(false);
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSearchQuery(searchDraft.trim());
    };

    const clearSearch = () => {
        setSearchDraft('');
        setSearchQuery('');
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-semibold text-white-900">Teacher Workspace</h1>
                    <p className="text-white-600">Search, review, and respond to student progress in one place.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedStudentIdForReport(null);
                        setIsReportModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
                >
                    <PlusCircle size={16} className="mr-2" /> New Student Report
                </button>
            </div>

            <Card className="shadow-sm border border-slate-200/70">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1">
                        <label htmlFor="teacher-student-search" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Find a student
                        </label>
                        <input
                            id="teacher-student-search"
                            type="search"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            placeholder="Search by student name or email"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg border border-primary-600 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50"
                        >
                            Search
                        </button>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </form>
                {searchQuery && (
                    <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                        Showing results for �<span className="font-semibold text-slate-700">{searchQuery}</span>�
                    </p>
                )}
            </Card>

            {filteredStudents.length === 0 ? (
                <Card className="shadow-sm border border-slate-200/70">
                    <p className="text-sm text-slate-700">
                        {searchQuery
                            ? 'No students match that search. Try refining your query.'
                            : 'There are no students assigned to your classes yet.'}
                    </p>
                </Card>
            ) : (
                filteredStudents.map(student => {
                    const studentReports = reports.filter(r => r.studentId === student.id);
                    const studentHomework = homeworks.filter(h => h.studentId === student.id);
                    return (
                        <Card key={student.id} className="shadow-md border border-slate-200/80">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-900">{student.name}</h2>
                                        <p className="text-sm text-gray-500">{student.email}</p>
                                    </div>
                                    <button
                                        onClick={() => openReportModal(student.id)}
                                        className="inline-flex items-center justify-center rounded-md border border-primary-600 px-3 py-2 text-xs font-semibold text-primary-600 transition hover:bg-primary-50"
                                    >
                                        <PlusCircle size={14} className="mr-1" /> Add Report
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Recent Reports</h3>
                                            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                                                {studentReports.length} total
                                            </span>
                                        </div>
                                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                                            {studentReports.length ? (
                                                studentReports.map(report => (
                                                    <div key={report.id} className="flex justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                                                        <div className="flex-1">
                                                            <Report report={report} />
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm('Delete this report?')) {
                                                                    await deleteReport(report.id);
                                                                }
                                                            }}
                                                            className="self-start rounded-full p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No reports recorded yet.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Homework Submissions</h3>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                {studentHomework.length} total
                                            </span>
                                        </div>
                                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                                            {studentHomework.length ? (
                                                studentHomework.map(hw => (
                                                    <div key={hw.id} className="rounded-lg border border-slate-200/70 bg-white p-4 shadow-sm">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <Homework homework={hw} />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleOpenCommentModal(hw.id)}
                                                                    className="inline-flex items-center gap-1 rounded-md border border-primary-600 px-3 py-1 text-xs font-semibold text-primary-600 transition hover:bg-primary-50"
                                                                >
                                                                    <MessageSquare size={14} /> {hw.comment ? 'Edit' : 'Comment'}
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm('Delete this homework submission?')) {
                                                                            await deleteHomework(hw.id);
                                                                        }
                                                                    }}
                                                                    className="rounded-full p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No homework submissions yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })
            )}

            {isCommentModalOpen && selectedHomeworkId && (
                <AddCommentModal homeworkId={selectedHomeworkId} onClose={handleCloseCommentModal} />
            )}
            {isReportModalOpen && selectedStudentIdForReport && (
                <AddReportModal studentId={selectedStudentIdForReport} onClose={closeReportModal} />
            )}
            {isReportModalOpen && !selectedStudentIdForReport && (
                <Card className="shadow-sm border border-slate-200/70">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700">Choose a student to start a report</h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => openReportModal(student.id)}
                                    className="text-left rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-primary-500 hover:text-primary-600"
                                >
                                    <p className="font-semibold">{student.name}</p>
                                    <p className="text-sm text-gray-500">{student.email}</p>
                                </button>
                            ))}
                        </div>
                        <button onClick={closeReportModal} className="text-sm text-gray-500 hover:text-gray-700">
                            Cancel
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
};
const Report: React.FC<{ report: ReportType }> = ({ report }) => {
    const { users } = useAppContext();
    const teacher = users.find(u => u.id === report.teacherId);
    return (
        <div className="p-2 flex items-start space-x-3">
            <div className="bg-primary-100 text-primary-600 rounded-full p-2 flex-shrink-0">
                {report.type === 'text' ? <FileText size={20} /> : <Mic size={20} />}
            </div>
            <div>
                {report.type === 'text' ? (
                    <p className="font-semibold text-gray-800">{report.content}</p>
                ) : (
                    <audio controls src={report.content} className="w-full max-w-xs h-10"></audio>
                )}
                <p className="text-sm text-gray-500">From: {teacher?.name} on {report.date}</p>
            </div>
        </div>
    );
};

const Homework: React.FC<{ homework: HomeworkType }> = ({ homework }) => {
    return (
        <div className="w-full">
            <div className="flex items-start space-x-3">
                <div className="bg-green-100 text-green-600 rounded-full p-2 flex-shrink-0">
                    <BookOpen size={20} />
                </div>
                <div>
                    <p className="font-bold text-white-600">{homework.chapter}</p>
                    <p className="text-gray-800">{homework.content}</p>
                    <p className="text-sm text-gray-500">Submitted on: {homework.submissionDate}</p>
                </div>
            </div>
            {homework.comment && (
                <div className="mt-3 ml-8 pl-5 border-l-2 border-yellow-300 flex items-start space-x-3">
                    <div className="bg-yellow-100 text-yellow-600 rounded-full p-2 flex-shrink-0">
                        {homework.comment.type === 'text' ? <MessageSquare size={20} /> : <Mic size={20} />}
                    </div>
                    <div className="w-full">
                        {homework.comment.type === 'text' ? (
                            <p className="font-semibold text-gray-800">{homework.comment.content}</p>
                        ) : (
                            <audio controls src={homework.comment.content} className="w-full max-w-xs h-10"></audio>
                        )}
                        <p className="text-sm text-gray-500">Teacher's Comment</p>
                    </div>
                </div>
            )}
        </div>
    );
};


export const Dashboard: React.FC = () => {
    const { currentUser } = useAppContext();

    switch (currentUser?.type) {
        case UserType.Student:
        case UserType.Parent:
            return <StudentParentDashboard />;
        case UserType.Teacher:
            return <TeacherDashboard />;
        default:
            return <div>Welcome! Please select a user to see the dashboard.</div>;
    }
};
