'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { XIcon, TagIcon, Trash2Icon, Loader2, PlusCircleIcon, Edit3Icon, ListChecksIcon, SaveIcon, MessageSquareIcon } from 'lucide-react'; 
import { supabase } from '@/lib/supabaseClient'; 
import { useToast } from "@/hooks/use-toast";
import type { User } from '@supabase/supabase-js';

interface QuickNoteDbRecord {
    id: string;
    user_id: string;
    title?: string | null;
    content?: string | null;
    tags?: string[] | null;
    created_at: string;
    updated_at: string;
}

export interface QuickNotesHandle {
    triggerSaveIfAutoSaveEnabled: () => Promise<void>;
}

const QuickNotes: React.ForwardRefRenderFunction<QuickNotesHandle> = (props, ref) => {
    const [notesList, setNotesList] = useState<QuickNoteDbRecord[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null); 
    const [isComposingNewNote, setIsComposingNewNote] = useState<boolean>(false);
    
    const [noteTitle, setNoteTitle] = useState<string>('');
    const [noteContent, setNoteContent] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);
    const [currentTagInput, setCurrentTagInput] = useState<string>('');
    const [lastUpdated, setLastUpdated] = useState<string>('Never');
    
    const [autoSave, setAutoSave] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true); // For initial notes list load
    const [isLoadingEditor, setIsLoadingEditor] = useState<boolean>(false); // For loading a specific note into editor
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null); 

    const { toast } = useToast();
    const suggestedTags = ["idea", "urgent", "task", "remember"];

    const prevActiveNoteIdRef = useRef<string | null>(null); // Added ref

    const activeNote = useMemo(() => {
        return notesList.find(n => n.id === activeNoteId) || null;
    }, [notesList, activeNoteId]);

    useEffect(() => {
        const initUserAndLoadNotes = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user);
                await fetchUserNotes(user.id);
            } else {
                toast({ title: "Authentication Error", description: "User not found. Cannot load or save notes.", variant: "destructive" });
            }
            setIsLoading(false);
        };
        initUserAndLoadNotes();
        const autoSaveEnabled = localStorage.getItem('quickNotesMultiAutoSave') === 'true';
        setAutoSave(autoSaveEnabled);
    }, [toast]);

    const fetchUserNotes = useCallback(async (userId: string) => {
        setIsLoading(true); // Loading notes list
        const { data, error } = await supabase
            .from('quick_notes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        setIsLoading(false);

        if (error) {
            toast({ title: "Error Loading Notes", description: error.message, variant: "destructive" });
            setNotesList([]);
        } else {
            setNotesList(data || []);
            if (!activeNoteId && !isComposingNewNote && data && data.length > 0) {
                // No note selected, not composing new, and notes exist - do nothing, let user pick or create
            } else if (!activeNoteId && !isComposingNewNote && (!data || data.length === 0)){
                 // No notes exist, prompt to create new (placeholder handles this)
                 setIsComposingNewNote(true); // Enter new note mode if list is empty
            }
        }
    }, [toast, activeNoteId, isComposingNewNote]); // Added activeNoteId, isComposingNewNote

    useEffect(() => {
        // This effect is for syncing the selected note (from the list) to the editor UI
        if (activeNoteId && activeNote) {
            // If the activeNoteId has changed (user selected a different note)
            // or if there was no previous active note (initial load with a selection)
            if (activeNoteId !== prevActiveNoteIdRef.current) {
                setIsLoadingEditor(true);
                setNoteTitle(activeNote.title || '');
                setNoteContent(activeNote.content || '');
                setTags(activeNote.tags || []);
                setIsComposingNewNote(false); // Ensure we are not in "composing new" mode
                setIsLoadingEditor(false);
            }
            // Always update lastUpdated from the activeNote, as it reflects DB truth
            setLastUpdated(new Date(activeNote.updated_at).toLocaleString());
        } else if (isComposingNewNote) {
            // If composing a new note, ensure editor is clear
            // Only clear if we are moving TO new note mode, or if editor had content from a previous state.
            if (prevActiveNoteIdRef.current !== null || noteTitle !== '' || noteContent !== '' || tags.length > 0) {
                setNoteTitle('');
                setNoteContent('');
                setTags([]);
            }
            setLastUpdated('Never');
        }
        // Update the ref for the next comparison
        prevActiveNoteIdRef.current = activeNoteId;
    }, [activeNoteId, activeNote, isComposingNewNote]); // Removed noteTitle, noteContent, tags from external deps of this specific effect

    const saveCurrentNote = useCallback(async (title: string, content: string, currentTags: string[]) => {
        if (!currentUser) {
            toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
            return null;
        }
        if (!activeNoteId && !isComposingNewNote && !title.trim() && !content.trim() && currentTags.length === 0) {
            return null; // Don't save empty new note unless user explicitly hits save
        }
        setIsSaving(true);
        const noteDataToSave = {
            user_id: currentUser.id,
            title: title.trim() || null, 
            content: content,
            tags: currentTags,
        };

        let savedNote: QuickNoteDbRecord | null = null;
        if (activeNoteId) { 
            const { data, error } = await supabase.from('quick_notes').update(noteDataToSave).eq('id', activeNoteId).select().single();
            if (error) toast({ title: "Error Updating Note", description: error.message, variant: "destructive" });
            else savedNote = data;
        } else { 
            const { data, error } = await supabase.from('quick_notes').insert(noteDataToSave).select().single();
            if (error) toast({ title: "Error Creating Note", description: error.message, variant: "destructive" });
            else savedNote = data;
        }

        if (savedNote) {
            setLastUpdated(new Date(savedNote.updated_at).toLocaleString());
            const newNotesList = activeNoteId 
                ? notesList.map(n => n.id === savedNote!.id ? savedNote! : n) 
                : [savedNote!, ...notesList];
            setNotesList(newNotesList.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
            
            if (!activeNoteId && savedNote.id) { 
                setActiveNoteId(savedNote.id);
                setIsComposingNewNote(false); 
            }
        }
        setIsSaving(false);
        return savedNote; 
    }, [currentUser, toast, activeNoteId, isComposingNewNote, notesList]); 

    const debouncedSave = useCallback(debounce((t, c, currentT) => saveCurrentNote(t, c, currentT), 5000), [saveCurrentNote]);

    useEffect(() => {
        if (autoSave && (activeNoteId || isComposingNewNote) && !isLoadingEditor && !isSaving) {
            // Only call debouncedSave if there's actual content to save for a new note
            if (isComposingNewNote && (noteTitle.trim() || noteContent.trim() || tags.length > 0)) {
                debouncedSave(noteTitle, noteContent, tags);
            } else if (activeNoteId) { // If editing an existing note, always try to save changes
                debouncedSave(noteTitle, noteContent, tags);
            }
        }
    }, [noteTitle, noteContent, tags, autoSave, activeNoteId, isComposingNewNote, isLoadingEditor, isSaving, debouncedSave]);

    const handleNoteTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => setNoteTitle(event.target.value);
    const handleNoteContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => setNoteContent(event.target.value);

    const handleAddTag = (tagToAdd: string) => {
        const newTag = tagToAdd.trim().toLowerCase();
        if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
        setCurrentTagInput('');
    };
    const handleRemoveTag = (tagToRemove: string) => setTags(tags.filter(tag => tag !== tagToRemove));

    const toggleAutoSave = () => {
        const newState = !autoSave;
        setAutoSave(newState);
        localStorage.setItem('quickNotesMultiAutoSave', String(newState));
        if (newState && (activeNoteId || isComposingNewNote) && (noteTitle.trim() || noteContent.trim() || tags.length > 0)) {
            saveCurrentNote(noteTitle, noteContent, tags);
        }
    };

    const handleManualSave = async () => {
        const saved = await saveCurrentNote(noteTitle, noteContent, tags);
        if (saved) toast({ title: "Note Saved", description: `'${saved.title || 'Untitled Note'}' has been saved.` });
        else if (!activeNoteId && !isComposingNewNote) toast({title: "Empty Note", description: "Cannot save an empty new note without content.", variant: "default"});
    };

    const handleNewNote = () => {
        setActiveNoteId(null); 
        setIsComposingNewNote(true);
        // Fields are cleared by useEffect on [activeNoteId, activeNote, isComposingNewNote]
    };

    const handleDeleteNote = async (noteIdToDelete: string) => {
        setShowDeleteConfirm(null); 
        if (!currentUser) {
            toast({ title: "Authentication Error", description: "Cannot delete note, user not authenticated.", variant: "destructive" });
            return;
        }
        if (!noteIdToDelete) {
            toast({ title: "Deletion Error", description: "Note ID is missing. Cannot delete.", variant: "destructive" });
            return;
        }

        console.log(`[QuickNotes] Attempting to delete note with ID: ${noteIdToDelete}`);
        setIsSaving(true); // Using isSaving as a general loading indicator for DB operations

        // For a simple .delete() without .select(), Supabase returns:
        // - data: null
        // - error: null
        // - status: 204 (No Content)
        // - statusText: "No Content"
        // If RLS fails or row not found, it might return other statuses or an error object.
        const { data, error, status, statusText } = await supabase
            .from('quick_notes')
            .delete()
            .eq('id', noteIdToDelete);

        setIsSaving(false);
        console.log('[QuickNotes] Supabase delete response:', { data, error, status, statusText });

        if (error) {
            toast({ 
                title: "Error Deleting Note", 
                description: `Failed to delete from database. Message: ${error.message} (Code: ${error.code})`, 
                variant: "destructive" 
            });
        } else {
            // Primary success indicator for delete without select is status 204.
            if (status === 204) {
                toast({ title: "Note Deleted", description: "The note has been permanently deleted from the database." });
                
                const newNotesList = notesList.filter(n => n.id !== noteIdToDelete);
                setNotesList(newNotesList);

                if (activeNoteId === noteIdToDelete) {
                    setActiveNoteId(null);
                    setIsComposingNewNote(newNotesList.length === 0); // If list becomes empty, go to new note mode
                }
            } else {
                // Handle cases where there's no explicit error object from Supabase client,
                // but status code indicates failure or an unexpected response (e.g., 404 if RLS prevents seeing the row but not erroring).
                toast({ 
                    title: "Deletion Unconfirmed", 
                    description: `The server responded with status ${status} (${statusText}). The note may not have been deleted. Please refresh.`, 
                    variant: "default" 
                });
                // Re-fetch notes to ensure UI consistency with the DB state as deletion was uncertain.
                if (currentUser) {
                    await fetchUserNotes(currentUser.id);
                }
            }
        }
    };

    const selectNoteToEdit = (noteId: string) => {
        setActiveNoteId(noteId);
        setIsComposingNewNote(false);
    };

    function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
        let timeout: NodeJS.Timeout | null = null;
        return (...args: Parameters<F>): Promise<ReturnType<F> | null> =>
            new Promise(resolve => {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => resolve(func(...args)), waitFor);
            });
    } // Keep debounce utility in case it's needed later, or remove if definitely not.
    
    const getNoteDisplayTitle = (note: QuickNoteDbRecord) => note.title || (note.content ? note.content.substring(0, 30) + (note.content.length > 30 ? '...' : '') : 'Untitled Note');

    const showEditor = !isLoadingEditor && (activeNoteId || isComposingNewNote);
    const showSelectNotePlaceholder = !isLoading && !activeNoteId && !isComposingNewNote && notesList.length > 0;
    const showCreateFirstNotePlaceholder = !isLoading && !activeNoteId && !isComposingNewNote && notesList.length === 0;

    useImperativeHandle(ref, () => ({
        async triggerSaveIfAutoSaveEnabled() {
            if (autoSave) {
                console.log('[QuickNotes] Modal closing, auto-save is ON. Attempting to save...');
                // Ensure currentUser is available before saving
                if (!currentUser) {
                    toast({ title: "Save Error", description: "Cannot save on close: User not authenticated.", variant: "destructive" });
                    return;
                }
                // Only save if there's something to save for a new note, or if it's an existing note
                if (isComposingNewNote && (!noteTitle.trim() && !noteContent.trim() && tags.length === 0)) {
                    console.log('[QuickNotes] Modal closing, auto-save ON, but new note is empty. Skipping save.');
                    return;
                }
                
                const saved = await saveCurrentNote(noteTitle, noteContent, tags);
                if (saved) {
                    toast({ title: "Note Auto-Saved", description: `'${saved.title || 'Untitled Note'}' was saved as you closed the notes.`, duration: 4000 });
                } else if (activeNoteId || isComposingNewNote) { // Only toast failure if we expected a save
                    // saveCurrentNote already toasts specific errors, this is a fallback
                    // toast({ title: "Save Unsuccessful", description: "Could not auto-save note on close.", variant: "default" });
                }
            } else {
                console.log('[QuickNotes] Modal closing, auto-save is OFF. No save action taken.');
            }
        }
    }));

    if (isLoading && !currentUser) {
        return (
            <div className="flex items-center justify-center p-10 min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Initializing user...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 -m-2 h-auto md:h-[calc(70vh-1rem)]"> {/* Adjusted height & flex direction */} 
            <div className="w-full md:w-1/3 border-r-0 md:border-r pr-0 md:pr-2 py-2 flex flex-col bg-muted/30 rounded-l-md h-64 md:h-full"> {/* Width, border, height changes */}
                <div className="flex justify-between items-center mb-2 px-2">
                    <h2 className="text-lg font-semibold flex items-center"><ListChecksIcon className="mr-2 h-5 w-5 text-primary"/> My Notes</h2>
                    <Button variant="outline" size="icon" onClick={handleNewNote} title="Create New Note" className="h-8 w-8 shrink-0">
                        <PlusCircleIcon className="h-5 w-5" />
                    </Button>
                </div>
                <ScrollArea className="flex-grow pr-2">
                    {isLoading && notesList.length === 0 ? (
                         <div className="text-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">Loading notes...</p>
                        </div>
                    ) : !isLoading && notesList.length === 0 && !isComposingNewNote ? (
                        <div className="text-center p-4 text-sm text-muted-foreground">
                            No notes yet. Click '+' to create one!
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {notesList.map(note => (
                                <li 
                                    key={note.id}
                                    className={`flex items-center justify-between w-full h-auto py-2 px-3 text-left group relative rounded-md cursor-pointer transition-colors ${activeNoteId === note.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                    onClick={() => selectNoteToEdit(note.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectNoteToEdit(note.id); }}
                                >
                                    <div className="flex-grow overflow-hidden mr-2 min-w-0"> {/* Content wrapper with min-w-0 */}
                                        <span className={`font-medium block truncate`}>{getNoteDisplayTitle(note)}</span>
                                        {note.tags && note.tags.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {note.tags.map(tag => (
                                                    <span key={tag} className={`px-1.5 py-0.5 rounded-sm text-[0.7rem] ${activeNoteId === note.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <span className={`text-xs block mt-1 ${activeNoteId === note.id ? 'text-primary-foreground/80' : 'text-muted-foreground/90'}`}>Updated: {new Date(note.updated_at).toLocaleDateString()}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="flex-shrink-0 h-7 w-7 opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-focus:opacity-100 hover:text-destructive hover:bg-destructive/10 z-10" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(note.id); }} title="Delete this note">
                                        <Trash2Icon className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </div>

            <div className="w-full md:w-2/3 pl-0 md:pl-2 py-2 flex flex-col h-full mt-4 md:mt-0"> {/* Width and margin changes */}
                {isLoadingEditor && (
                    <div className="flex-grow flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">Loading editor...</p>
                    </div>
                )}
                {showSelectNotePlaceholder && (
                     <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-muted/20 rounded-md">
                        <Edit3Icon className="h-16 w-16 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">Select a note to view/edit</p><p className="text-sm text-muted-foreground">Or create a new one using the '+' button.</p>
                    </div>
                )}
                {showCreateFirstNotePlaceholder && !isComposingNewNote && (
                     <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-muted/20 rounded-md">
                        <MessageSquareIcon className="h-16 w-16 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">Welcome to Quick Notes!</p><p className="text-sm text-muted-foreground">Click the '+' button to create your first note.</p>
                    </div>
                )}
                {showEditor && (
                    <>
                        <Input
                            type="text"
                            placeholder="Note Title (optional)"
                            value={noteTitle}
                            onChange={handleNoteTitleChange}
                            className="text-xl font-semibold mb-2 h-11 px-3 py-2 border-b focus:ring-0 focus-visible:ring-offset-0 focus:border-primary rounded-none"
                            disabled={isSaving || isLoadingEditor}
                        />
                        <ScrollArea className="flex-grow mb-2 rounded-md border has-[textarea:focus]:border-primary has-[textarea:focus]:ring-1 has-[textarea:focus]:ring-primary">
                            <Textarea
                                value={noteContent}
                                onChange={handleNoteContentChange}
                                placeholder="Type your notes here..."
                                className="min-h-[150px] text-base border-0 focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 resize-none w-full h-full p-3"
                                disabled={isSaving || isLoadingEditor}
                            />
                        </ScrollArea>
                        
                        <div className="mb-2 space-y-2.5">
                            <h3 className="text-sm font-medium flex items-center text-muted-foreground"><TagIcon className="mr-1.5 h-4 w-4" />Tags</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {suggestedTags.map(tag => (
                                    <Button key={tag} variant="outline" size="sm" onClick={() => handleAddTag(tag)} className="text-xs px-2 py-0.5 h-auto" disabled={isSaving || isLoadingEditor}> {tag} </Button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Input type="text" value={currentTagInput} onChange={(e) => setCurrentTagInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { handleAddTag(currentTagInput); e.preventDefault(); }}} placeholder="Add custom tag..." className="h-9 text-sm" disabled={isSaving || isLoadingEditor}/>
                                <Button onClick={() => handleAddTag(currentTagInput)} disabled={!currentTagInput.trim() || isSaving || isLoadingEditor} size="sm">Add</Button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dashed">
                                    {tags.map(tag => (
                                        <span key={tag} className="flex items-center bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                                            {tag}
                                            <Button variant="ghost" size="icon" className="ml-1 h-5 w-5 hover:bg-destructive/20 hover:text-destructive rounded-full" onClick={() => handleRemoveTag(tag)} disabled={isSaving || isLoadingEditor}><XIcon className="h-3 w-3" /></Button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <CardFooter className="p-0 pt-2 border-t flex flex-col items-start md:flex-row md:items-center justify-between gap-2.5"> {/* Ensure items-start for stacked layout */}
                            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 w-full xs:w-auto"> {/* Stack buttons on very small, then row */}
                                <Button onClick={handleManualSave} size="sm" disabled={isSaving || isLoadingEditor || (!activeNoteId && !isComposingNewNote && !noteTitle && !noteContent && tags.length === 0)} className="w-full xs:w-auto">
                                    {isSaving && !autoSave ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-2 h-4 w-4"/>}
                                    {activeNoteId ? 'Save Changes' : 'Save New Note'}
                                </Button>
                                 <div className="flex items-center space-x-1.5 mt-2 xs:mt-0">
                                    <Switch id="auto-save-quicknotes" checked={autoSave} onCheckedChange={toggleAutoSave} disabled={isLoadingEditor} />
                                    <Label htmlFor="auto-save-quicknotes" className={`cursor-pointer text-sm ${isLoadingEditor ? 'opacity-50' : ''}`}>Auto-save</Label>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground self-start sm:self-center mt-2 md:mt-0"> {/* self-start for stacked */}
                                {isSaving && autoSave ? <span className="flex items-center"><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Saving...</span> : ((activeNoteId || isComposingNewNote) ? `Last updated: ${lastUpdated}` : 'Not saved yet')}
                            </div>
                        </CardFooter>
                    </>
                )}
            </div>
            <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete the note "{showDeleteConfirm ? getNoteDisplayTitle(notesList.find(n => n.id === showDeleteConfirm)!) : 'this note'}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={() => handleDeleteNote(showDeleteConfirm!)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2Icon className="mr-2 h-4 w-4" />}
                            Delete Note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default forwardRef(QuickNotes); 