import React, { useState } from 'react';
import { Driver } from '../types';
import { Send, Paperclip, X } from 'lucide-react';

interface CustomEmailProps {
    drivers: Driver[];
    onSendCustomEmail: (driverId: string, subject: string, body: string, attachments: { name: string; type: string; base64: string }[]) => Promise<void>;
}

export const CustomEmail: React.FC<CustomEmailProps> = ({ drivers, onSendCustomEmail }) => {
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState<{ name: string; type: string; base64: string }[]>([]);
    const [isSending, setIsSending] = useState(false);

    // Filter out any drivers without emails just to be safe
    const validDrivers = drivers.filter(d => d.email && d.email.trim() !== '');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (!files.length) return;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Data = event.target?.result?.toString().split(',')[1];
                if (base64Data) {
                    setAttachments(prev => [
                        ...prev,
                        { name: file.name, type: file.type || 'application/octet-stream', base64: base64Data }
                    ]);
                }
            };
            reader.readAsDataURL(file);
        });

        // Clear input
        e.target.value = '';
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDriverId) {
            alert('Please select a driver first.');
            return;
        }
        if (!subject.trim() || !body.trim()) {
            alert('Subject and Message body are required.');
            return;
        }

        setIsSending(true);
        try {
            if (selectedDriverId === 'ALL') {
                // Send to all
                const promises = validDrivers.map(d => onSendCustomEmail(d.id, subject, body, attachments));
                await Promise.all(promises);
                alert(`Successfully sent to ${validDrivers.length} drivers!`);
            } else {
                // Send to single
                await onSendCustomEmail(selectedDriverId, subject, body, attachments);
                alert('Email sent successfully!');
            }

            // Reset form on success
            setSubject('');
            setBody('');
            setAttachments([]);
            setSelectedDriverId('');
        } catch (error: any) {
            alert(`Failed to send email: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in zoom-in-95 duration-200 max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-500" />
                    Send Custom Email
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Send instructions, updates, and files directly to drivers.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Driver Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Recipient Driver
                    </label>
                    <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                        required
                    >
                        <option value="" disabled>Select a driver...</option>
                        <option value="ALL" className="font-bold text-indigo-600 dark:text-indigo-400">Send to ALL Drivers ({validDrivers.length})</option>
                        {validDrivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                                {driver.name} ({driver.company || 'No Company'}) - {driver.email}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Subject */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="Important Update: New Instructions"
                        required
                    />
                </div>

                {/* Body */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Message Body
                    </label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[200px] resize-y"
                        placeholder="Type your message here..."
                        required
                    />
                </div>

                {/* Attachments */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Attachments (Images, PDFs, Videos)
                    </label>

                    <div className="flex flex-col gap-3">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 dark:text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-bold
                file:bg-indigo-50 file:text-indigo-700
                dark:file:bg-indigo-900/30 dark:file:text-indigo-400
                hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50
                transition-all cursor-pointer"
                        />

                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSending}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>Sending...</>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send Email
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
