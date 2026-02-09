
import React from 'react';
import { DriverReply } from '../types';
import { MessageSquare, Clock, CheckCircle, User, Search, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DriverRepliesProps {
  replies: DriverReply[];
  onMarkRead: (id: string) => void;
}

export const DriverReplies: React.FC<DriverRepliesProps> = ({ replies, onMarkRead }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 transition-colors">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Response Inbox</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Communications from drivers regarding ELD status</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <Inbox className="w-3.5 h-3.5" />
          {replies.filter(r => !r.isRead).length} New
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950 transition-colors">
        <AnimatePresence mode="popLayout">
          {replies.length > 0 ? (
            replies.map((reply) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={reply.id}
                onClick={() => onMarkRead(reply.id)}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer ${
                  !reply.isRead 
                    ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/50 shadow-sm' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {!reply.isRead && (
                  <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-full animate-pulse"></div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    !reply.isRead ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {reply.driverName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-bold transition-colors ${!reply.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>
                        {reply.driverName}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed transition-colors ${!reply.isRead ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                      "{reply.message}"
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1 transition-colors">
                        <MessageSquare className="w-3 h-3" /> Quick Reply
                      </button>
                      <button className="text-[10px] font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 uppercase tracking-wider flex items-center gap-1 transition-colors">
                        <CheckCircle className="w-3 h-3" /> Resolve Issue
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 transition-colors">
                <MessageSquare className="w-10 h-10 text-slate-200 dark:text-slate-800" />
              </div>
              <h4 className="text-slate-900 dark:text-white font-bold">No responses yet</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                Once drivers reply to your automated alerts, their messages will appear here.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
