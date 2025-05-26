'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import { subDays, format } from 'date-fns';

interface SocialClickData {
  platform: string;
  total_clicks: number;
  fill: string; // For bar color
}

interface SocialMediaClicksChartProps {
  refreshTrigger?: unknown; // Can be any value that changes to trigger a refresh
}

// Define a color palette for social platforms
const PLATFORM_COLORS: Record<string, string> = {
  Facebook: 'hsl(var(--chart-1))', // Blue
  'X (Twitter)': 'hsl(var(--chart-2))', // Light Blue / Black (adjust to your theme)
  Instagram: 'hsl(var(--chart-3))', // Pink/Purple
  LinkedIn: 'hsl(var(--chart-4))', // Dark Blue
  TikTok: 'hsl(var(--chart-5))',    // Teal/Red
  Youtube: 'hsl(var(--destructive))', // Red
  Other: 'hsl(var(--muted-foreground))',   // Grey
};

const AnimatedBullet = (props: any) => {
  const { cx, cy, payload, value } = props;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Animate the bullet's position based on the bar's width (value)
    // This is a simplified animation; for complex easing, a library like framer-motion might be used within the custom tick
    setWidth(cx); // The cx here is the end of the bar. We can use this to position the bullet
  }, [cx]);

  if (!payload || value === 0) return null;

  return (
    <g transform={`translate(${cx},${cy})`}>
      <circle cx={5} cy={0} r={4} fill={payload.fill} className="animate-pulse" />
      <style jsx>{`
        .animate-pulse {
          animation: pulse-dot 1.5s infinite ease-in-out;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </g>
  );
};

const SocialMediaClicksChart: React.FC<SocialMediaClicksChartProps> = ({ refreshTrigger }) => {
  const [data, setData] = useState<SocialClickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSocialClicks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data: clicksData, error: dbError } = await supabase
      .from('social_media_clicks')
      .select('platform, clicks_count')
      .gte('recorded_date', thirtyDaysAgo)
      .lte('recorded_date', today);

    if (dbError) {
      console.error("Error fetching social media clicks:", dbError);
      setError(`Failed to load click data: ${dbError.message}`);
      toast({ title: "Error Loading Clicks", description: dbError.message, variant: "destructive" });
      setData([]);
    } else if (clicksData) {
      // Aggregate data client-side (Supabase RPC could also do this)
      const aggregated = clicksData.reduce<Record<string, number>>((acc, curr) => {
        if (curr.platform && typeof curr.clicks_count === 'number') {
          acc[curr.platform] = (acc[curr.platform] || 0) + curr.clicks_count;
        }
        return acc;
      }, {});

      const formattedData: SocialClickData[] = Object.entries(aggregated)
        .map(([platform, total_clicks]) => ({
          platform,
          total_clicks,
          fill: PLATFORM_COLORS[platform] || PLATFORM_COLORS.Other,
        }))
        .sort((a, b) => b.total_clicks - a.total_clicks);
      setData(formattedData);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSocialClicks();
  }, [fetchSocialClicks, refreshTrigger]);

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-1 min-h-[250px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading Social Clicks...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-1 min-h-[250px] flex flex-col items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive font-semibold">Error Loading Data</p>
        <p className="text-sm text-muted-foreground px-4 text-center">{error}</p>
        <button onClick={fetchSocialClicks} className="mt-4 text-sm text-primary hover:underline">Try Again</button>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-1 min-h-[250px]">
        <CardHeader>
          <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5" />Social Media Clicks</CardTitle>
          <CardDescription>Clicks from social platforms (last 30 days).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center flex-col h-[150px]">
          <p className="text-muted-foreground">No social media click data available for the last 30 days.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 min-h-[250px]">
      <CardHeader>
        <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5" />Social Media Clicks</CardTitle>
        <CardDescription>Total clicks from social platforms (last 30 days).</CardDescription>
      </CardHeader>
      <CardContent className="h-[200px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="platform" type="category" width={80} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} 
              cursor={{fill: 'hsl(var(--muted))'}}
            />
            <Bar dataKey="total_clicks" layout="vertical" radius={[0, 4, 4, 0]}  animationDuration={1500}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              {/* This is a conceptual placement for AnimatedBullet. Recharts Bar doesn't directly support item-level custom elements like this in its default Bar component.
                  A more robust solution might involve a custom Bar component or overlaying SVG elements.
                  For simplicity, the pulse animation is applied via CSS to a <Cell> like element or a simple <Dot> if we were using it for a scatter plot.
                  Given Recharts Bar limitations for a simple moving bullet, we'll rely on the bar animation and color primarily.
                  The AnimatedBullet component defined above is more for a scenario where you have more control over SVG rendering per bar item (e.g. custom bar shape).
                  We can add a subtle animation to the bar itself or a label instead. 
                  Let's add an animated label showing the value at the end of the bar for a similar effect.
              */}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SocialMediaClicksChart; 