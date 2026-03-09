import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import SensorDashboard from './SensorDashboard';
import BlockchainLog from './BlockchainLog';
import BlockchainBadge from './BlockchainBadge';

interface RwaDashboardModalProps {
    open: boolean;
    onClose: () => void;
}

export default function RwaDashboardModal({ open, onClose }: RwaDashboardModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[400px] w-[95vw] h-[85vh] overflow-hidden bg-gradient-to-b from-green-50 via-[#fefae0] to-[#f4f1de] border-2 border-[#b5835a] shadow-2xl p-0 gap-0 sm:rounded-3xl flex flex-col">
                {/* Header (Cố định ở trên) */}
                <div className="relative bg-[#2A1F18] border-b-2 border-[#8B5E3C] px-5 py-4 pb-5 flex-shrink-0 z-10 shadow-md">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none z-0"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 m-0 mt-2">
                            <span className="text-xl font-black text-white tracking-wide">ORGANIC KINGDOM</span>
                        </DialogTitle>
                    </div>
                    <div className="relative z-10 mt-1 flex items-center gap-1.5 text-[#D4B483] font-medium text-[11px] uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px] text-green-400">eco</span>
                        SMART FARM &middot; DePIN &middot; Blockchain IOT
                    </div>

                    <div className="absolute top-4 right-4 z-20">
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Nội dung dạng list cuộn được */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 relative" style={{ scrollbarWidth: 'none' }}>
                    <div className="absolute -top-10 -left-10 opacity-5 pointer-events-none rotate-12 z-0">
                        <span className="material-symbols-outlined text-9xl text-green-800">grass</span>
                    </div>

                    <div className="relative z-10 space-y-5">
                        <SensorDashboard />

                        <div className="flex items-center gap-2 before:content-[''] before:h-px before:flex-1 before:bg-green-900/10 after:content-[''] after:h-px after:flex-1 after:bg-green-900/10">
                            <span className="text-[10px] text-green-800/50 uppercase font-black tracking-widest">ON-CHAIN DATA</span>
                        </div>

                        <BlockchainLog />
                        <BlockchainBadge size="lg" />
                    </div>

                    <div className="h-6"></div> {/* Bottom spacer */}
                </div>

            </DialogContent>
        </Dialog>
    );
}
