"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import RichTextEditor from "./RichTextEditor";
import { nanoid } from "nanoid";
import { X, Plus, MapPin, Calendar as CalendarIcon, Clock, Tag, Image as ImageIcon, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const eventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  image: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  venue: z.string().min(3, "Venue is required"),
  citySlug: z.string().min(1, "City is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface CreateEventFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateEventForm({ onSuccess, onCancel }: CreateEventFormProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");

  const { data: cities } = trpc.events.getCities.useQuery();
  const { data: categories } = trpc.events.getCategories.useQuery();
  const createEventMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("Event published successfully!");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to publish event: ${error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      image: "",
      date: "",
      time: "",
      venue: "",
      citySlug: "",
      category: "",
      price: "Free",
    },
  });

  const selectedCitySlug = watch("citySlug");
  const selectedCategory = watch("category");

  const onSubmit = async (values: EventFormValues) => {
    const city = cities?.find((c) => c.slug === values.citySlug);
    if (!city) {
      toast.error("Selected city not found");
      return;
    }

    const eventId = nanoid();
    const slug = values.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-") + "-" + nanoid(5);

    await createEventMutation.mutateAsync({
      ...values,
      id: eventId,
      slug,
      city: city.name,
      tags: tags.join(","),
      description: description, // Use the rich text content
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-indigo-100">
      <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
        <CardTitle className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
          <Plus className="w-6 h-6" /> Publish New Event
        </CardTitle>
        <CardDescription>Fill in the details below to share your event with the community.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-8 pt-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2 border-b pb-2">
              <Type className="w-5 h-5" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Summer Music Festival 2026"
                  {...register("title")}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    onValueChange={(value) => setValue("category", value)}
                    value={selectedCategory}
                  >
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price / Ticket Info</Label>
                  <Input
                    id="price"
                    placeholder="e.g. Free, CAD 25, Starting from $10"
                    {...register("price")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date & Location Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2 border-b pb-2">
              <MapPin className="w-5 h-5" /> Date & Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                  className={errors.date ? "border-red-500" : ""}
                />
                {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  {...register("time")}
                  className={errors.time ? "border-red-500" : ""}
                />
                {errors.time && <p className="text-sm text-red-500">{errors.time.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select
                  onValueChange={(value) => setValue("citySlug", value)}
                  value={selectedCitySlug}
                >
                  <SelectTrigger className={errors.citySlug ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities?.map((city) => (
                      <SelectItem key={city.slug} value={city.slug}>
                        {city.name}, {city.province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.citySlug && <p className="text-sm text-red-500">{errors.citySlug.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue Name / Address</Label>
                <Input
                  id="venue"
                  placeholder="e.g. Central Park, 123 Main St"
                  {...register("venue")}
                  className={errors.venue ? "border-red-500" : ""}
                />
                {errors.venue && <p className="text-sm text-red-500">{errors.venue.message}</p>}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2 border-b pb-2">
              <ImageIcon className="w-5 h-5" /> Event Details & Media
            </h3>
            <div className="space-y-2">
              <Label htmlFor="image">Cover Image URL</Label>
              <Input
                id="image"
                placeholder="https://example.com/image.jpg"
                {...register("image")}
              />
              <p className="text-xs text-gray-500">Provide a high-quality image URL for your event banner.</p>
            </div>

            <div className="space-y-2">
              <Label>Event Description (Rich Text)</Label>
              <RichTextEditor 
                content={description} 
                onChange={setDescription} 
                placeholder="Describe your event in detail. You can use bold, italics, headings, lists, and more..."
              />
              {description.length > 0 && description.length < 20 && (
                <p className="text-sm text-red-500">Description must be at least 20 characters</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="flex items-center gap-2">
                <Tag className="w-4 h-4" /> Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button type="button" onClick={addTag} variant="outline">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-indigo-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4 bg-gray-50 border-t border-gray-100 mt-8 py-4">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-indigo-700 hover:bg-indigo-800 text-white px-8"
            disabled={isSubmitting || description.length < 20}
          >
            {isSubmitting ? "Publishing..." : "Publish Event"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
