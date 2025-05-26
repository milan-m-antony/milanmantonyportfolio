"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, MapPin, HelpCircle } from 'lucide-react'; // Removed specific icons, will use HelpCircle for display list
import { supabase } from '@/lib/supabaseClient';
import type { TimelineEvent, TimelineEventType } from '@/types/supabase';
import Image from 'next/image'; // For displaying image icons
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const timelineEventSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string().min(1, "Date is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(), // Changed from icon_name
  type: z.enum(['work', 'education', 'certification', 'milestone']),
  sort_order: z.coerce.number().optional().nullable().default(0),
});
type TimelineEventFormData = z.infer<typeof timelineEventSchema>;

const timelineEventTypes: TimelineEventType[] = ['work', 'education', 'certification', 'milestone'];

const IconDisplay = ({ iconImageUrl, altText }: { iconImageUrl: string | null; altText: string }) => {
  if (iconImageUrl) {
    return (
      <div className="h-6 w-6 relative rounded-sm overflow-hidden flex-shrink-0">
        <Image src={iconImageUrl} alt={altText} layout="fill" objectFit="contain" />
      </div>
    );
  }
  return <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />; // Fallback if no image URL
};

export default function TimelineManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<TimelineEvent | null>(null);
  const [showEventDeleteConfirm, setShowEventDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);

  const eventForm = useForm<TimelineEventFormData>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: { date: '', title: '', description: '', icon_image_url: '', type: 'milestone', sort_order: 0 }
  });

  useEffect(() => {
    fetchTimelineEvents();
  }, []);

  useEffect(() => {
    if (currentEvent) {
      eventForm.reset({
        id: currentEvent.id,
        date: currentEvent.date,
        title: currentEvent.title,
        description: currentEvent.description,
        icon_image_url: currentEvent.iconImageUrl || '', // Changed from iconName
        type: currentEvent.type,
        sort_order: currentEvent.sort_order || 0,
      });
    } else {
      eventForm.reset({ date: '', title: '', description: '', icon_image_url: '', type: 'milestone', sort_order: 0 });
    }
  }, [currentEvent, eventForm]);

  const fetchTimelineEvents = async () => {
    setIsLoadingEvents(true);
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching timeline events:', JSON.stringify(error, null, 2));
      toast({ title: "Error", description: `Could not fetch timeline events: ${error.message}`, variant: "destructive" });
      setTimelineEvents([]);
    } else if (data) {
      const mappedData = data.map(event => ({
        ...event,
        iconImageUrl: event.icon_image_url, // Map from icon_image_url
        type: event.type as TimelineEventType
      }));
      setTimelineEvents(mappedData);
    } else {
      setTimelineEvents([]);
    }
    setIsLoadingEvents(false);
  };

  const onEventSubmit: SubmitHandler<TimelineEventFormData> = async (formData) => {
    // Ensure icon_image_url is null if empty string, otherwise keep the URL
    const dataToSave = {
        ...formData,
        icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url,
        sort_order: formData.sort_order === null || formData.sort_order === undefined ? 0 : Number(formData.sort_order),
    };

    if (formData.id) {
      const { error } = await supabase
        .from('timeline_events')
        .update(dataToSave)
        .eq('id', formData.id);
      if (error) {
        console.error("Error updating timeline event:", JSON.stringify(error, null, 2));
        toast({ title: "Error", description: `Failed to update event: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Timeline event updated successfully." });
      }
    } else {
      const { id, ...dataToInsert } = dataToSave;
      const { error } = await supabase
        .from('timeline_events')
        .insert(dataToInsert);
      if (error) {
        console.error("Error adding timeline event:", JSON.stringify(error, null, 2));
        toast({ title: "Error", description: `Failed to add event: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Timeline event added successfully." });
      }
    }
    fetchTimelineEvents();
    setIsEventModalOpen(false);
    eventForm.reset();
    router.refresh();
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    const { error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('id', eventToDelete.id);

    if (error) {
      console.error("Error deleting timeline event:", JSON.stringify(error, null, 2));
      toast({ title: "Error", description: `Failed to delete event: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Timeline event deleted successfully." });
      fetchTimelineEvents();
    }
    setShowEventDeleteConfirm(false);
    setEventToDelete(null);
    router.refresh();
  };

  const triggerDeleteConfirmation = (event: TimelineEvent) => {
    setEventToDelete(event);
    setShowEventDeleteConfirm(true);
  };

  const handleOpenEventModal = (event?: TimelineEvent) => {
    setCurrentEvent(event || null);
    setIsEventModalOpen(true);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Manage Journey (Timeline Events)
          <MapPin className="h-6 w-6 text-primary" />
        </CardTitle>
        <CardDescription>Add, edit, or delete events for your career journey timeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-right">
          <Dialog open={isEventModalOpen} onOpenChange={(isOpen) => { setIsEventModalOpen(isOpen); if (!isOpen) { setCurrentEvent(null); eventForm.reset(); } }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenEventModal()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Timeline Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{currentEvent?.id ? 'Edit Timeline Event' : 'Add New Timeline Event'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto p-2 scrollbar-hide">
                <div><Label htmlFor="date">Date</Label><Input id="date" {...eventForm.register("date")} placeholder="e.g., Jan 2023 - Present, or 2024"/>{eventForm.formState.errors.date && <p className="text-destructive text-sm mt-1">{eventForm.formState.errors.date.message}</p>}</div>
                <div><Label htmlFor="title">Title</Label><Input id="title" {...eventForm.register("title")} />{eventForm.formState.errors.title && <p className="text-destructive text-sm mt-1">{eventForm.formState.errors.title.message}</p>}</div>
                <div><Label htmlFor="description">Description</Label><Textarea id="description" {...eventForm.register("description")} rows={3} />{eventForm.formState.errors.description && <p className="text-destructive text-sm mt-1">{eventForm.formState.errors.description.message}</p>}</div>
                <div>
                  <Label htmlFor="icon_image_url">Icon Image URL (Optional)</Label>
                  <Input id="icon_image_url" {...eventForm.register("icon_image_url")} placeholder="https://example.com/icon.png"/>
                  {eventForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{eventForm.formState.errors.icon_image_url.message}</p>}
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    onValueChange={(value) => eventForm.setValue('type', value as TimelineEventType)}
                    defaultValue={currentEvent?.type || 'milestone'}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {timelineEventTypes.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {eventForm.formState.errors.type && <p className="text-destructive text-sm mt-1">{eventForm.formState.errors.type.message}</p>}
                </div>
                <div><Label htmlFor="sort_order">Sort Order (optional, lower numbers first)</Label><Input id="sort_order" type="number" {...eventForm.register("sort_order")} />{eventForm.formState.errors.sort_order && <p className="text-destructive text-sm mt-1">{eventForm.formState.errors.sort_order.message}</p>}</div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit">{currentEvent?.id ? 'Save Changes' : 'Add Event'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingEvents ? (
          <p className="text-center text-muted-foreground">Loading timeline events...</p>
        ) : timelineEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No timeline events found. Add one to get started!</p>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((event) => (
              <Card key={event.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <IconDisplay iconImageUrl={event.iconImageUrl} altText={`${event.title} icon`} />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold text-md">{event.title}</h4>
                            <p className="text-xs text-muted-foreground">{event.date} - <span className="capitalize font-medium">{event.type}</span> (Sort: {event.sort_order ?? 0})</p>
                        </div>
                        <div className="flex space-x-2 self-start shrink-0">
                            <Button variant="outline" size="sm" onClick={() => handleOpenEventModal(event)}><Edit className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => triggerDeleteConfirmation(event)}>
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                            </Button>
                        </div>
                    </div>
                    <p className="text-sm text-foreground/80 mt-1">{event.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={showEventDeleteConfirm} onOpenChange={setShowEventDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive-foreground">Delete Event: {eventToDelete?.title}?</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">
              This action cannot be undone. This will permanently delete the timeline event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowEventDeleteConfirm(false); setEventToDelete(null); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete Event</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
