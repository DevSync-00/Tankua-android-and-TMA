"use client";

import { useState, useEffect } from "react";
import {
  Church,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Image,
  Tag,
  RefreshCw,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@tankua/ui";
import { getChurches, deleteChurch, createChurch, updateChurch, type Church as ChurchType } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export default function ChurchesPage() {
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<ChurchType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    region: "",
    city: "",
    latitude: "",
    longitude: "",
    tags: "",
    images: "",
  });
  
  // File upload state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]); // Track existing URLs separately
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadChurches();
  }, [page, search]);

  const loadChurches = async () => {
    setLoading(true);
    try {
      const result = await getChurches({
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
      });
      setChurches(result.churches);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading churches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this church?")) {
      const success = await deleteChurch(id);
      if (success) {
        loadChurches();
      }
    }
  };

  const handleAdd = () => {
    setFormData({
      name: "",
      description: "",
      region: "",
      city: "",
      latitude: "",
      longitude: "",
      tags: "",
      images: "",
    });
    setSelectedChurch(null);
    setUploadedImages([]);
    setImagePreviews([]);
    setExistingImageUrls([]);
    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  const handleEdit = (church: ChurchType) => {
    setSelectedChurch(church);
    const existingImages = church.images || [];
    setFormData({
      name: church.name,
      description: church.description || "",
      region: church.region || "",
      city: church.city || "",
      latitude: church.latitude?.toString() || "",
      longitude: church.longitude?.toString() || "",
      tags: church.tags?.join(", ") || "",
      images: existingImages.join(", ") || "",
    });
    setUploadedImages([]);
    setExistingImageUrls(existingImages);
    setImagePreviews(existingImages); // Show existing images as previews
    setError("");
    setSuccess("");
    setShowEditModal(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError("Please select image files only");
      return;
    }

    // Validate file sizes (max 5MB each)
    const oversized = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Some files exceed 5MB limit: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }

    setError(""); // Clear any previous errors
    
    // Add files to upload queue
    setUploadedImages(prev => [...prev, ...imageFiles]);
    
    // Create previews for new files
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreviews(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input so same file can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    // Check if this is an existing URL or a new file preview
    const preview = imagePreviews[index];
    const isExistingUrl = existingImageUrls.includes(preview);
    
    if (isExistingUrl) {
      // Remove from existing URLs
      setExistingImageUrls(prev => prev.filter(url => url !== preview));
    } else {
      // Find the corresponding file in uploadedImages
      // New files are added after existing URLs, so we need to calculate the correct index
      const newFileIndex = index - existingImageUrls.length;
      if (newFileIndex >= 0 && newFileIndex < uploadedImages.length) {
        setUploadedImages(prev => prev.filter((_, i) => i !== newFileIndex));
      }
    }
    
    // Remove from previews
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    // Start with existing URLs that are still in previews
    const remainingExistingUrls = existingImageUrls.filter(url => imagePreviews.includes(url));
    
    // If no new files to upload, just return existing URLs
    if (uploadedImages.length === 0) {
      return remainingExistingUrls;
    }

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("You must be logged in to upload images. Please log in again.");
      }

      const bucket = "destinations"; // Use destinations bucket for all images
      
      for (const file of uploadedImages) {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const path = `${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          // Provide more detailed error messages
          let errorMessage = uploadError.message || "Unknown upload error";
          const uploadStatus =
            (uploadError as { status?: number }).status ??
            (uploadError as { statusCode?: number }).statusCode;
          
          if (uploadError.message?.includes("Bucket not found") || uploadStatus === 404) {
            errorMessage = `Storage bucket '${bucket}' not found. Please create it in Supabase Storage dashboard.`;
          } else if (uploadStatus === 400 || uploadError.message?.includes("row-level security")) {
            errorMessage = `Upload blocked by security policy. Please run the SQL script 'database/26_fix_image_upload_storage_policies.sql' in Supabase SQL Editor to fix this.`;
          } else if (uploadStatus === 401 || uploadStatus === 403) {
            errorMessage = `Authentication failed. Please log in again.`;
          } else if (uploadError.message?.includes("File size")) {
            errorMessage = `File too large. Maximum size is 5MB.`;
          }
          
          throw new Error(errorMessage);
        }

        // Get public URL
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }
      }

      // Combine existing URLs with newly uploaded URLs
      return [...remainingExistingUrls, ...uploadedUrls];
    } catch (err: any) {
      const errorMessage = err.message || "Failed to upload images";
      throw new Error(errorMessage);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Upload images first
      const imageUrls = await uploadImages();

      const churchData: any = {
        name: formData.name,
        description: formData.description || null,
        region: formData.region || null,
        city: formData.city || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
        images: imageUrls.length > 0 ? imageUrls : null,
      };

      if (selectedChurch) {
        // Update existing
        const success = await updateChurch(selectedChurch.id, churchData);
        if (success) {
          setSuccess("Church updated successfully!");
          setTimeout(() => {
            setShowEditModal(false);
            setUploadedImages([]);
            setImagePreviews([]);
            setExistingImageUrls([]);
            loadChurches();
          }, 1500);
        } else {
          setError("Failed to update church");
        }
      } else {
        // Create new
        const result = await createChurch(churchData);
        if (result) {
          setSuccess("Church created successfully!");
          setTimeout(() => {
            setShowAddModal(false);
            setUploadedImages([]);
            setImagePreviews([]);
            setExistingImageUrls([]);
            loadChurches();
          }, 1500);
        } else {
          setError("Failed to create church");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen">
      <Header
        title="Churches"
        subtitle={`Manage ${total.toLocaleString()} churches and monasteries`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadChurches}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Church
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search churches..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        {/* Churches Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : churches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Church className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No churches found</p>
              <Button className="mt-4" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Church
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {churches.map((church) => (
              <Card key={church.id} className="overflow-hidden group">
                {/* Image */}
                <div className="relative h-40 bg-muted">
                  {church.images && church.images[0] ? (
                    <img
                      src={church.images[0]}
                      alt={church.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Church className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(church)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(church.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{church.name}</h3>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {church.city || church.region || "Location not set"}
                    </span>
                  </div>

                  {church.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {church.description}
                    </p>
                  )}

                  {church.tags && church.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {church.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {church.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{church.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} churches
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedChurch ? "Edit Church" : "Add New Church"}</CardTitle>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <p>{success}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Church name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Church description"
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Region</label>
                    <Input
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="Region"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="Latitude"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="Longitude"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Images</label>
                  
                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium text-primary">Click to upload</span>
                        <span className="text-sm text-muted-foreground"> or drag and drop</span>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB each</p>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadingImages && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Uploading images...
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setError("");
                      setSuccess("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={saving || uploadingImages} disabled={uploadingImages}>
                    <Save className="h-4 w-4 mr-2" />
                    {selectedChurch ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


