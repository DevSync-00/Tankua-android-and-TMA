"use client";

import { useRef, useState } from "react";
import Link from "next/link";
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
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
} from "lucide-react";
import { Button } from "@tankua/ui";
import { AuthError, ProviderBrand } from "@/components/auth-shell";
import { supabase } from "@/lib/supabase";

const steps = [
  { id: 1, title: "Company" },
  { id: 2, title: "Contact" },
  { id: 3, title: "Documents" },
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

  const goToStep = (step: number) => {
    setError("");
    setCurrentStep(step);
    requestAnimationFrame(() => document.getElementById("registration-step")?.focus());
  };

  const handleNext = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentStep === 2 && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    goToStep(currentStep + 1);
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
    <main className="mx-auto min-h-svh max-w-3xl px-5 py-6 sm:px-8 sm:py-9">
      <ProviderBrand />
      <div className="registration-heading">
        <h1>Register your company</h1>
        <p>Apply to list your trips on Tankua. Have your company details and trade license ready.</p>
      </div>

      <ol aria-label="Registration progress" className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        {steps.map((step) => (
          <li
            key={step.id}
            aria-current={currentStep === step.id ? "step" : undefined}
            className={`flex min-w-0 items-center gap-1.5 rounded-lg border p-2 text-xs font-semibold sm:gap-2.5 sm:p-3 sm:text-sm ${
              currentStep === step.id ? "border-primary/25 bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"
            }`}
          >
            <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[0.6875rem] sm:size-6 ${
              currentStep >= step.id ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              {currentStep > step.id ? <CheckCircle2 aria-hidden="true" className="size-3.5" /> : step.id}
            </span>
            <span>{step.title}{currentStep > step.id ? <span className="sr-only">, complete</span> : null}</span>
          </li>
        ))}
      </ol>

      <form onSubmit={currentStep < steps.length ? handleNext : handleSubmit} className="registration-form rounded-xl border border-border bg-card p-4 sm:p-7">
        {error ? <div className="mb-5"><AuthError>{error}</AuthError></div> : null}

        {/* Step 1: Company Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 id="registration-step" tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">Company information</h2>

            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-foreground mb-2">
                Company Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g., Abyssinia Tours"
                  id="company-name"
                  autoComplete="organization"
                  value={formData.companyName}
                  onChange={(e) => updateFormData("companyName", e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="business-type" className="block text-sm font-medium text-foreground mb-2">
                Business Type *
              </label>
              <select
                id="business-type"
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
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                placeholder="Tell us about your company and services..."
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
                  City *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g., Addis Ababa"
                    id="city"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Street address"
                  id="address"
                  autoComplete="street-address"
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
            <h2 id="registration-step" tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">Contact information</h2>

            <div>
              <label htmlFor="owner-name" className="block text-sm font-medium text-foreground mb-2">
                Owner/Manager Name *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full name"
                  id="owner-name"
                  autoComplete="name"
                  value={formData.ownerName}
                  onChange={(e) => updateFormData("ownerName", e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  id="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="+251 9XX XXX XXXX"
                  id="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  className="w-full h-12 pl-12 pr-12 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Confirm your password"
                  id="confirm-password"
                  autoComplete="new-password"
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
            <h2 id="registration-step" tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">Verification documents</h2>

            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Document verification usually takes 1–2 business days. You’ll receive an email once your account is approved.
              </p>
            </div>

            {uploadError && (
              <AuthError>{uploadError}</AuthError>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Trade License *
              </p>
              <input
                ref={tradeInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null, "tradeLicense")}
              />
              <button
                type="button"
                className="block w-full rounded-xl border border-dashed border-input bg-background px-4 py-5 text-center transition-colors hover:border-primary hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => tradeInputRef.current?.click()}
              >
                <Upload aria-hidden="true" className="mx-auto mb-3 size-5 text-primary" />
                <span className="block break-all text-sm font-semibold">
                  {formData.tradeLicense ? formData.tradeLicense.name : "Upload trade license"}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">PDF, JPG, or PNG (max 5 MB)</span>
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Tour Operator License (if applicable)
              </p>
              <input
                ref={tourInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null, "tourLicense")}
              />
              <button
                type="button"
                className="block w-full rounded-xl border border-dashed border-input bg-background px-4 py-5 text-center transition-colors hover:border-primary hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => tourInputRef.current?.click()}
              >
                <Upload aria-hidden="true" className="mx-auto mb-3 size-5 text-primary" />
                <span className="block break-all text-sm font-semibold">
                  {formData.tourLicense ? formData.tourLicense.name : "Upload tour operator license"}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">PDF, JPG, or PNG (max 5 MB)</span>
              </button>
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
                <Link href="https://www.tankua.co/terms" target="_blank" rel="noreferrer" className="text-primary hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="https://www.tankua.co/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">Privacy Policy</Link>
                . I confirm that all information provided is accurate.
              </span>
            </label>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          {currentStep > 1 ? (
            <Button type="button" variant="ghost" onClick={() => goToStep(currentStep - 1)}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Back
            </Button>
          ) : (
            <Link href="/login" className="auth-link">Back to sign in</Link>
          )}
          <Button type="submit" isLoading={isLoading} rightIcon={<ArrowRight aria-hidden="true" className="size-4" />}>
            {uploadingDocs ? "Uploading documents…" : currentStep < steps.length ? "Continue" : "Submit application"}
          </Button>
        </div>
      </form>
    </main>
  );
}
