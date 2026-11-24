// Components
export { Button, buttonVariants } from "./components/button";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./components/card";
export { Input } from "./components/input";
export { Badge, badgeVariants } from "./components/badge";
export { Avatar } from "./components/avatar";
export { StatCard } from "./components/stat-card";
export { ConfirmDialog, type ConfirmDialogProps } from "./components/confirm-dialog";
export { InlineBanner, type InlineBannerProps } from "./components/inline-banner";

// Utilities
export { tripPromotionChannels, getTripPromotionChannel, type TripPromotionChannel } from "./lib/trip-promotion";
export { cn, formatCurrency, formatCurrencyTotals, getTripCurrency, sumByCurrency, formatDate, formatRelativeTime, truncate, generateInitials, slugify, type CurrencyTotals, type TripCurrency } from "./lib/utils";



// Formatted descriptions
export { RichText, type RichTextProps } from "./components/rich-text";
export { parseRichText, parseInline, richTextToPlain, type RichTextBlock } from "./lib/rich-text";
