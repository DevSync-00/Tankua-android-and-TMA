"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle
} from "lucide-react";
import { Button, Card, Badge } from "@tankua/ui";
import { supabase } from "@/lib/supabase";

const steps = [
  { id: 1, title: "Company Info", description: "Basic details" },
  { id: 2, title: "Contact", description: "Owner details" },
  { id: 3, title: "Documents", description: "Verification" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadingDocs, setUploadingDocs] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: "",
    businessType: "",
    description: "",
    address: "",
    city: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    tradeLicense: null as File | null,
    tourLicense: null as File | null,
    agreedToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const tradeInputRef = useRef<HTMLInputElement | null>(null);
  const tourInputRef = useRef<HTMLInputElement | null>(null);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileSelect = (file: File | null, field: "tradeLicense" | "tourLicense") => {
    if (!file) return;

    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only PDF, JPG, or PNG files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be 5MB or less.");
      return;
    }

    setUploadError("");
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File, email: string, type: "trade" | "tour") => {
    const bucket = "provider-docs";
    const ext = file.name.split(".").pop();
    const path = `applications/${email || "unknown"}/${type}-${Date.now()}.${ext}`;

    // Try to upload
    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, cacheControl: "3600" });

    if (uploadErr) {
      // Check if bucket doesn't exist
      if (uploadErr.message?.includes("Bucket not found") || uploadErr.message?.includes("The resource was not found")) {
        // Try to create the bucket (may fail without admin permissions)
        const { error: createErr } = await supabase.storage.createBucket(bucket, {
          public: false,
          fileSizeLimit: 5242880, // 5MB
        });

        if (createErr) {
          throw new Error(
            "Storage bucket not configured. Please contact support or ask an admin to create the 'provider-docs' bucket in Supabase Storage."
          );
        }

        // Retry upload after creating bucket
        const { error: retryErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: false, cacheControl: "3600" });

        if (retryErr) {
          throw retryErr;
        }
      } else {
        throw uploadErr;
      }
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setUploadError("");

    if (!formData.tradeLicense) {
      setError("Please upload your trade license.");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      setUploadingDocs(true);

      const email = formData.email.trim().toLowerCase();
      const uploads: { tradeLicenseUrl: string; tourLicenseUrl?: string } = {
        tradeLicenseUrl: await uploadFile(formData.tradeLicense, email, "trade"),
      };

      if (formData.tourLicense) {
        uploads.tourLicenseUrl = await uploadFile(formData.tourLicense, email, "tour");
      }

      setUploadingDocs(false);

      // 1) Create provider record in inactive state for admin review
      const { data: providerInsert, error: providerErr } = await supabase
        .from("providers")
        .insert({
          name: formData.companyName,
          description: formData.description || `Business type: ${formData.businessType}. City: ${formData.city}. Address: ${formData.address || "N/A"}.`,
          phone: formData.phone,
          email: formData.email,
          status: "inactive",
          logo_url: null,
        })
        .select("id")
        .single();

      if (providerErr) {
        throw providerErr;
      }

      const providerId = providerInsert?.id;

      // 2) Create auth user in Supabase Auth
      // This allows the provider to log in once approved
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            provider_id: providerId,
            name: formData.ownerName,
            company_name: formData.companyName,
          },
        },
      });

      if (authError) {
        // If user already exists, that's okay - they might have registered before
        if (!authError.message?.includes('already registered') && !authError.message?.includes('User already registered')) {
          console.warn("Failed to create auth user:", authError);
          // Don't fail registration - admin can create auth user manually if needed
          // But log it for debugging
        }
      }

      // 3) Create support ticket for admin visibility
      await supabase.from("support_tickets").insert({
        provider_id: providerId,
        subject: `New provider registration - ${formData.companyName}`,
        description: `
Company: ${formData.companyName}
Business Type: ${formData.businessType}
City: ${formData.city}
Address: ${formData.address || "N/A"}
Owner: ${formData.ownerName}
Phone: ${formData.phone}
Email: ${formData.email}
Trade License: ${uploads.tradeLicenseUrl}
Tour License: ${uploads.tourLicenseUrl || "N/A"}
Description: ${formData.description || "N/A"}
        `.trim(),
        category: "general",
        priority: "high",
        status: "open",
      });

      // 4) Notify first admin account (if exists)
      // Note: This may fail due to RLS, but that's okay - the support ticket is the main notification
      try {
        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (adminUser?.id) {
          const { error: notifErr } = await supabase.from("notifications").insert({
            recipient_type: "admin",
            recipient_id: adminUser.id,
            title: "New provider registration submitted",
            message: `${formData.companyName} has submitted documents for review.`,
            type: "system",
            data: {
              provider_id: providerId,
              trade_license: uploads.tradeLicenseUrl,
              tour_license: uploads.tourLicenseUrl,
              contact: { name: formData.ownerName, email: formData.email, phone: formData.phone },
            },
          });

          // Log but don't fail registration if notification fails
          if (notifErr) {
            console.warn("Failed to create admin notification:", notifErr);
          }
        }
      } catch (notifError) {
        // Notification creation is optional - don't fail registration
        console.warn("Could not create admin notification:", notifError);
      }

      router.push("/register/success");
    } catch (err: any) {
      console.error("Registration failed", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setUploadingDocs(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0d2341] to-[#0A1A2F] py-12 px-4">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23D4A017' fill-opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: "60px 60px",
      }} />

      <div className="max-w-2xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#FFB800] flex items-center justify-center shadow-lg overflow-hidden">
              <Image src="/favicon.png" alt="Tankua" width={34} height={34} className="object-contain" priority />
            </div>
            <span className="text-2xl font-bold text-white">Tankua</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Register Your Company</h1>
          <p className="text-white/60">Join Ethiopia's leading pilgrimage platform</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep >= step.id 
                    ? "bg-[#D4A017] text-[#0A1A2F]" 
                    : "bg-white/10 text-white/50"
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-xs sm:text-sm font-medium ${currentStep >= step.id ? "text-white" : "text-white/50"}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-white/40 hidden sm:block">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 transition-colors ${
                  currentStep > step.id ? "bg-[#D4A017]" : "bg-white/10"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="bg-white p-4 sm:p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Step 1: Company Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#0A1A2F] mb-6">Company Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="e.g., Abyssinia Tours"
                      value={formData.companyName}
                      onChange={(e) => updateFormData("companyName", e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business Type *
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => updateFormData("businessType", e.target.value)}
                    className="w-full h-12 px-4 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  >
                    <option value="">Select business type</option>
                    <option value="tour_operator">Tour Operator</option>
                    <option value="travel_agency">Travel Agency</option>
                    <option value="transport_company">Transport Company</option>
                    <option value="individual_guide">Individual Guide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Tell us about your company and services..."
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      City *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="e.g., Addis Ababa"
                        value={formData.city}
                        onChange={(e) => updateFormData("city", e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                      className="w-full h-12 px-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#0A1A2F] mb-6">Contact Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Owner/Manager Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={formData.ownerName}
                      onChange={(e) => updateFormData("ownerName", e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="+251 9XX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      className="w-full h-12 pl-12 pr-12 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#0A1A2F] mb-6">Verification Documents</h2>
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Document verification usually takes 1-2 business days. You'll receive an email once your account is approved.
                  </p>
                </div>

                {uploadError && (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
                    {uploadError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Trade License *
                  </label>
                  <input
                    ref={tradeInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null, "tradeLicense")}
                  />
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => tradeInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium">
                      {formData.tradeLicense ? formData.tradeLicense.name : "Click to upload trade license"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">PDF, JPG, or PNG (max 5MB)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tour Operator License (if applicable)
                  </label>
                  <input
                    ref={tourInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null, "tourLicense")}
                  />
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => tourInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium">
                      {formData.tourLicense ? formData.tourLicense.name : "Click to upload tour license"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">PDF, JPG, or PNG (max 5MB)</p>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.agreedToTerms}
                    onChange={(e) => updateFormData("agreedToTerms", e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary/20" 
                    required
                  />
                  <span className="text-sm text-muted-foreground">
                    I agree to Tankua's{" "}
                    <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    . I confirm that all information provided is accurate.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {currentStep > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <Link href="/login">
                  <Button type="button" variant="ghost">
                    Already have an account?
                  </Button>
                </Link>
              )}
              
              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" isLoading={isLoading}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Registration
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

