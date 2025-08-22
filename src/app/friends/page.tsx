'use client';

import React from 'react';
import { FriendComparison } from '@/components/social/FriendComparison';

export default function FriendsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Friend Performance Comparison</h1>
        <p className="text-lg text-muted-foreground">
          Compare your fitness performance with friends across different activities and time periods.
        </p>
      </div>
      
      <FriendComparison />
    </div>
  );
}