"use client";

import { useState } from "react";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Filter,
  Search,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar } from "@tankua/ui";

const reviews = [
  { id: 1, customer: "Yohannes T.", rating: 5, comment: "Amazing trip to Lalibela! The driver was very knowledgeable and the bus was comfortable. Highly recommend!", trip: "Lalibela Heritage", date: "Jan 15, 2024", helpful: 12 },
  { id: 2, customer: "Sara M.", rating: 5, comment: "Smooth journey and on-time pickup. Will definitely use again for my next pilgrimage.", trip: "Lake Tana", date: "Jan 14, 2024", helpful: 8 },
  { id: 3, customer: "Daniel H.", rating: 4, comment: "Good experience overall. The trip was well organized. AC could be better.", trip: "Debre Damo", date: "Jan 12, 2024", helpful: 5 },
  { id: 4, customer: "Hana T.", rating: 5, comment: "Best spiritual journey I've ever had. Thank you for the wonderful service!", trip: "Lalibela Heritage", date: "Jan 10, 2024", helpful: 15 },
  { id: 5, customer: "Abebe K.", rating: 4, comment: "Very professional service. The pickup was a bit delayed but the rest was perfect.", trip: "Gondar Castles", date: "Jan 8, 2024", helpful: 3 },
  { id: 6, customer: "Meron G.", rating: 5, comment: "Exceeded my expectations! Will recommend to all my friends and family.", trip: "Lake Tana", date: "Jan 5, 2024", helpful: 10 },
];

const ratingStats = {
  average: 4.7,
  total: 156,
  distribution: [
    { stars: 5, count: 98 },
    { stars: 4, count: 42 },
    { stars: 3, count: 12 },
    { stars: 2, count: 3 },
    { stars: 1, count: 1 },
  ],
};

export default function ReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState("all");

  const filteredReviews = reviews.filter((review) => {
    if (ratingFilter === "all") return true;
    return review.rating === parseInt(ratingFilter);
  });

  return (
    <div className="min-h-screen">
      <Header
        title="Reviews"
        subtitle={`${ratingStats.total} customer reviews`}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Overall Rating */}
          <Card className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-5xl font-bold">{ratingStats.average}</span>
                <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-muted-foreground">Based on {ratingStats.total} reviews</p>
            </div>
          </Card>

          {/* Rating Distribution */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="font-semibold mb-4">Rating Distribution</h3>
            <div className="space-y-3">
              {ratingStats.distribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{item.stars}</span>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${(item.count / ratingStats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-10 px-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start gap-4">
                <Avatar name={review.customer} size="md" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.customer}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{review.trip}</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-muted-foreground mb-4">"{review.comment}"</p>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" leftIcon={<ThumbsUp className="h-4 w-4" />}>
                      Helpful ({review.helpful})
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<MessageSquare className="h-4 w-4" />}>
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

