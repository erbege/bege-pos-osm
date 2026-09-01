import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

/**
 * A slide-in drawer component for the right side of the screen.
 * Used for table selection, voucher input, etc.
 */
export default function Drawer({ show, onClose, title, children }) {
    return (
        <Transition show={show} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-[#1A1A1A] border-l border-white/5 shadow-2xl relative">
                                        {/* Floating Close Button (Absolute positioned if no title) */}
                                        {!title && (
                                            <div className="absolute top-4 right-4 z-50">
                                                <button
                                                    type="button"
                                                    className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all border border-white/10"
                                                    onClick={onClose}
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}

                                        {title && (
                                            <div className="px-3 py-6 sm:px-8 border-b border-white/5 bg-[#222]">
                                                <div className="flex items-start justify-between">
                                                    <Dialog.Title className="text-lg font-normal text-white uppercase tracking-widest">
                                                        {title}
                                                    </Dialog.Title>
                                                    <div className="ml-3 flex h-7 items-center">
                                                        <button
                                                            type="button"
                                                            className="relative -m-2 p-2 text-white/30 hover:text-white transition-colors focus:outline-none"
                                                            onClick={onClose}
                                                        >
                                                            <span className="sr-only">Close panel</span>
                                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className={`relative flex-1 ${!title ? '' : 'px-3 py-6 sm:px-8'}`}>
                                            {children}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
